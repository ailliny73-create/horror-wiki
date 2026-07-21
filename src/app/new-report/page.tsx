'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { FilePlus, ArrowLeft, Send, Loader2, AlertTriangle, MapPin, ImagePlus, Radio, Megaphone, Hash } from 'lucide-react';

export default function NewReportPage() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('위험 보고서');
  const [location, setLocation] = useState('');
  const [dangerLevel, setDangerLevel] = useState('LEVEL 1 (경미)');
  const [tagInput, setTagInput] = useState('');
  const [content, setContent] = useState('');
  const [isNotice, setIsNotice] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.user_metadata?.role === 'ADMIN') {
      setIsAdmin(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrorMsg('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
        setLoading(false);
        return;
      }

      const nickname = user.user_metadata?.nickname || user.email?.split('@')[0] || '익명 요원';
      let uploadedImageUrl = '';

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `reports/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('report-images')
          .upload(filePath, imageFile);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('report-images')
            .getPublicUrl(filePath);
          uploadedImageUrl = urlData.publicUrl;
        }
      }

      // 태그 파싱 (# 태그 분리)
      const parsedTags = tagInput
        .split(/[,\s]+/)
        .map((t) => t.replace(/^#/, '').trim())
        .filter((t) => t.length > 0);

      const { error: insertError } = await supabase.from('reports').insert([
        {
          title: title.trim(),
          category: isNotice ? '긴급 공지' : category,
          content: content.trim(),
          location: category === '위험 보고서' && !isNotice ? (location.trim() || '미상 구역') : '사령부 본부',
          danger_level: category === '위험 보고서' && !isNotice ? dangerLevel : '공지',
          tags: parsedTags,
          image_url: uploadedImageUrl,
          is_notice: isNotice,
          user_id: user.id,
          author_nickname: nickname,
        },
      ]);

      if (insertError) {
        console.error('Insert Error Detail:', insertError);
        setErrorMsg('문서 저장 실패: ' + insertError.message);
        setLoading(false);
        return;
      }

      alert('성공적으로 등록되었습니다.');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Submit Exception:', err);
      setErrorMsg('시스템 오류가 발생했습니다: ' + (err?.message || '알 수 없는 오류'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-mono flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-neutral-900/60 border border-neutral-800 p-8 rounded-lg space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center space-x-3">
            <FilePlus className="w-6 h-6 text-red-600 animate-pulse" />
            <h2 className="text-lg font-bold text-neutral-100">신규 기밀 문서 / 게시글 작성</h2>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center space-x-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>대시보드로 돌아가기</span>
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-950/60 border border-red-900/80 text-red-400 text-xs p-3 rounded text-center break-all">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 사령관 전용 공지 체크박스 */}
          {isAdmin && (
            <div className="bg-red-950/40 border border-red-900/80 p-3 rounded flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Megaphone className="w-4 h-4 text-red-500 animate-bounce" />
                <span className="text-xs font-bold text-red-300">사령부 최고 지침 (최상단 고정 공지사항 등록)</span>
              </div>
              <input
                type="checkbox"
                checked={isNotice}
                onChange={(e) => setIsNotice(e.target.checked)}
                className="w-4 h-4 accent-red-600 cursor-pointer"
              />
            </div>
          )}

          {/* 카테고리 */}
          {!isNotice && (
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">문서 분류 (카테고리)</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCategory('위험 보고서')}
                  className={`p-3 rounded text-xs font-bold border flex items-center justify-center space-x-2 cursor-pointer transition-all ${
                    category === '위험 보고서'
                      ? 'bg-red-950/80 border-red-700 text-red-300'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>위험 보고서 (특무 기밀)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('자유 게시판')}
                  className={`p-3 rounded text-xs font-bold border flex items-center justify-center space-x-2 cursor-pointer transition-all ${
                    category === '자유 게시판'
                      ? 'bg-neutral-800 border-neutral-600 text-neutral-100'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <Radio className="w-4 h-4" />
                  <span>자유 게시판 (요원 소통)</span>
                </button>
              </div>
            </div>
          )}

          {/* 제목 */}
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">문서 제목 / 사건명</label>
            <input
              type="text"
              required
              disabled={loading}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isNotice ? '[공지] 특무 사령부 긴급 보안 지침 통보' : '제목을 입력하세요'}
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-red-900 disabled:opacity-50"
            />
          </div>

          {/* 위치 & 위험도 */}
          {!isNotice && category === '위험 보고서' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">사건 발생 위치/구역</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    disabled={loading}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="예: 서울 구로구 폐공장 지하 B2"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded pl-10 pr-4 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-red-900 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">위험도 등급 지정</label>
                <div className="relative">
                  <AlertTriangle className="w-4 h-4 text-red-600 absolute left-3 top-3" />
                  <select
                    value={dangerLevel}
                    onChange={(e) => setDangerLevel(e.target.value)}
                    disabled={loading}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded pl-10 pr-4 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-red-900 disabled:opacity-50 appearance-none"
                  >
                    <option value="LEVEL 1 (경미)">LEVEL 1 (경미 - 관찰 필요)</option>
                    <option value="LEVEL 2 (주의)">LEVEL 2 (주의 - 민간인 접근 금지)</option>
                    <option value="LEVEL 3 (위험)">LEVEL 3 (위험 - 즉각 격리 필요)</option>
                    <option value="LEVEL 4 (극심)">LEVEL 4 (극심 - 특무 대원 출동)</option>
                    <option value="LEVEL 5 (재앙)">LEVEL 5 (재앙 - 국가적 비상사태)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 태그 입력 */}
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">해시태그 (공백이나 쉼표로 구분)</label>
            <div className="relative">
              <Hash className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                type="text"
                disabled={loading}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="예: 서울 실종 심야 현장목격"
                className="w-full bg-neutral-950 border border-neutral-800 rounded pl-10 pr-4 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-red-900 disabled:opacity-50"
              />
            </div>
          </div>

          {/* 사진 첨부 */}
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">첨부 이미지 (선택)</label>
            <div className="relative border border-neutral-800 border-dashed rounded-lg p-4 bg-neutral-950 text-center">
              <input
                type="file"
                accept="image/*"
                disabled={loading}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImageFile(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2 text-xs text-neutral-400 hover:text-red-400 transition-colors"
              >
                <ImagePlus className="w-8 h-8 text-neutral-600" />
                <span>
                  {imageFile ? `선택된 파일: ${imageFile.name}` : '클릭하여 사진 이미지 업로드'}
                </span>
              </label>
            </div>
          </div>

          {/* 상세 내용 */}
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">상세 내용</label>
            <textarea
              required
              rows={6}
              disabled={loading}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 작성해 주세요..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-4 text-xs text-neutral-200 focus:outline-none focus:border-red-900 disabled:opacity-50 resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-xs px-5 py-2.5 rounded cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-red-900 hover:bg-red-800 text-white font-bold text-xs px-6 py-2.5 rounded border border-red-700 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>전송 중...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{isNotice ? '긴급 공지 전파' : '문서 제출'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}