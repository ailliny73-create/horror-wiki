'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { FilePlus, ArrowLeft, Send, Loader2 } from 'lucide-react';

export default function NewReportPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setErrorMsg('');

    try {
      // 1. 현재 로그인된 유저 세션 가져오기
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrorMsg('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
        setLoading(false);
        return;
      }

      const nickname = user.user_metadata?.nickname || user.email?.split('@')[0] || '익명 요원';

      // 2. Supabase DB reports 테이블에 기밀 보고서 등록
      const { error: insertError } = await supabase.from('reports').insert([
        {
          title: title.trim(),
          content: content.trim(),
          user_id: user.id,
          author_nickname: nickname,
        },
      ]);

      if (insertError) {
        console.error('Insert Error Detail:', insertError);
        setErrorMsg('보고서 저장 실패: ' + insertError.message);
        setLoading(false);
        return;
      }

      alert('특무 기밀 보고서가 성공적으로 등록되었습니다.');
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
            <FilePlus className="w-6 h-6 text-red-600" />
            <h2 className="text-lg font-bold text-neutral-100">신규 기밀 보고서 작성</h2>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>대시보드로 돌아가기</span>
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-950/60 border border-red-900/80 text-red-400 text-xs p-3 rounded text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">보고서 제목 / 사건명</label>
            <input
              type="text"
              required
              disabled={loading}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: [경고] 제3구역 괴생명체 목격 보고"
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-red-900 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">상세 기밀 내용</label>
            <textarea
              required
              rows={8}
              disabled={loading}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="사건 발생 일시, 장소, 현장 상황을 상세히 작성하십시오..."
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
                  <span>보고서 전송 중...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>기밀 보고서 제출</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}