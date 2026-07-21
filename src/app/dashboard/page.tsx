'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setReports(data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-mono p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
          <h1 className="text-xl font-bold text-red-600">특무 요원 메인 기밀 대시보드</h1>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs px-3 py-1.5 rounded cursor-pointer"
          >
            접속 종료 (로그아웃)
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => router.push('/new-report')}
            className="bg-red-900 hover:bg-red-800 text-white text-xs px-4 py-2 rounded font-bold cursor-pointer"
          >
            + 새 기밀 보고서 작성
          </button>
        </div>

        {loading ? (
          <div className="text-center text-xs text-neutral-500 py-10">기밀 데이터 로딩 중...</div>
        ) : reports.length === 0 ? (
          <div className="text-center text-xs text-neutral-600 py-10 border border-dashed border-neutral-800 rounded">
            등록된 기밀 보고서가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="bg-neutral-900 border border-neutral-800 p-4 rounded space-y-2">
                <h3 className="text-sm font-bold text-neutral-100">{report.title}</h3>
                <p className="text-xs text-neutral-400 whitespace-pre-wrap">{report.content}</p>
                <div className="text-[10px] text-neutral-600 border-t border-neutral-800/60 pt-2 flex justify-between">
                  <span>작성자: {report.author_nickname || '익명 요원'}</span>
                  <span>{new Date(report.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}