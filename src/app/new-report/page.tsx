'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Send, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function NewReportPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [dangerLevel, setDangerLevel] = useState('C');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('anomalies').insert([
        {
          code: code.trim(),
          title: title.trim(),
          danger_level: dangerLevel,
          content: content.trim(),
          author_email: user?.email || 'anonymous@disaster.go.kr',
        },
      ]);

      if (error) throw error;

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(`[등록 실패] ${err.message || '데이터베이스 등록 중 오류가 발생했습니다.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-mono p-6 flex justify-center items-center">
      <div className="max-w-2xl w-full bg-neutral-900 border border-red-900/40 rounded-lg p-6 shadow-2xl space-y-6">
        
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-7 h-7 text-red-600 animate-pulse" />
            <div>
              <h1 className="text-lg font-bold text-red-500 tracking-wider">
                특무 보고서 작성 // NEW ANOMALY
              </h1>
              <p className="text-xs text-neutral-400">신규 발견된 괴이 현상에 대한 세부 기록을 작성하십시오.</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                식별 코드 (예: ANOMALY-102)
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="ANOMALY-XXX"
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
              보고서 제목 (코드명/명칭)
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 붉은 안개 속의 심야 가로등"
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-red-600 transition"
            />
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
              placeholder="현장 목격 증언, 오염 경로, 격리 수칙 등의 상세 내용을 작성하십시오."
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-sm text-neutral-200 focus:outline-none focus:border-red-600 transition resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-900 hover:bg-red-800 text-red-100 font-semibold py-2.5 px-4 rounded text-sm transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'DB 전송 중...' : '보고서 최종 등록'}</span>
          </button>
        </form>

      </div>
    </div>
  );
}