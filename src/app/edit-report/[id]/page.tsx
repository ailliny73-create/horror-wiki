'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Save, AlertTriangle, ImagePlus } from 'lucide-react';
import Link from 'next/link';

export default function EditReportPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [dangerLevel, setDangerLevel] = useState('C');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 기존 보고서 정보 불러오기
  useEffect(() => {
    async function fetchReport() {
      try {
        const { data, error } = await supabase
          .from('anomalies')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          setCode(data.code);
          setTitle(data.title);
          setDangerLevel(data.danger_level);
          setContent(data.content);
          setImageUrl(data.image_url);
        }
      } catch (err: any) {
        setErrorMsg(`[데이터 로드 오류] ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchReport();
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      let finalImageUrl = imageUrl;

      // 새 이미지가 선택되었을 때만 추가 업로드
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('anomaly-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('anomaly-images')
          .getPublicUrl(filePath);

        finalImageUrl = publicUrlData.publicUrl;
      }

      // DB 데이터 업데이트
      const { error } = await supabase
        .from('anomalies')
        .update({
          code: code.trim(),
          title: title.trim(),
          danger_level: dangerLevel,
          content: content.trim(),
          image_url: finalImageUrl,
        })
        .eq('id', id);

      if (error) throw error;

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(`[수정 실패] ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-400 font-mono flex items-center justify-center">
        <p className="text-xs">기밀 데이터 수정을 위한 보안 동기화 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-mono p-6 flex justify-center items-center">
      <div className="max-w-2xl w-full bg-neutral-900 border border-red-900/40 rounded-lg p-6 shadow-2xl space-y-6">
        
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-7 h-7 text-red-600 animate-pulse" />
            <div>
              <h1 className="text-lg font-bold text-red-500 tracking-wider">
                기밀 보고서 수정 // EDIT ANOMALY
              </h1>
              <p className="text-xs text-neutral-400">보고서의 세부 정보 및 수칙을 재정의합니다.</p>
            </div>
          </div>
          <Link href="/dashboard" className="flex items-center space-x-1 text-xs text-neutral-400 hover:text-neutral-200 transition">
            <ArrowLeft className="w-4 h-4" />
            <span>취소</span>
          </Link>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/50 border border-red-800 rounded text-xs text-red-400 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                식별 코드
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-red-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                위험 등급
              </label>
              <select
                value={dangerLevel}
                onChange={(e) => setDangerLevel(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-red-600 transition"
              >
                <option value="S">S 등급 (재앙급)</option>
                <option value="A">A 등급 (고위험)</option>
                <option value="B">B 등급 (경계)</option>
                <option value="C">C 등급 (주의)</option>
                <option value="Safe">Safe (안전)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              보고서 제목
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-red-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              현장 채증 사진 변경
            </label>
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-3 py-2 rounded text-xs text-neutral-300 cursor-pointer transition">
                <ImagePlus className="w-4 h-4 text-red-500" />
                <span>새 이미지 선택</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
            {(imagePreview || imageUrl) && (
              <div className="mt-2 relative w-32 h-32 border border-neutral-800 rounded overflow-hidden">
                <img src={imagePreview || imageUrl!} alt="미리보기" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              상세 특성 및 대응 수칙 내용
            </label>
            <textarea
              required
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-sm text-neutral-200 focus:outline-none focus:border-red-600 transition resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-red-900 hover:bg-red-800 text-red-100 font-semibold py-2.5 px-4 rounded text-sm transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? '수정 사항 반영 중...' : '보고서 수정 완료'}</span>
          </button>
        </form>

      </div>
    </div>
  );
}