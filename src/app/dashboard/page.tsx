'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Plus, LogOut, MapPin, AlertCircle, FileText, Trash2, Edit, X, Save, Image as ImageIcon } from 'lucide-react';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // 상세보기 및 수정 모달 상태
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDangerLevel, setEditDangerLevel] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
      await fetchReports();
    } catch (err) {
      console.error('Init error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReports(data);
    }
  };

  // 게시글 클릭 시 상세보기 모달 열기
  const handleOpenDetail = (report: any) => {
    setSelectedReport(report);
    setEditTitle(report.title);
    setEditContent(report.content);
    setEditLocation(report.location || '');
    setEditDangerLevel(report.danger_level || 'LEVEL 1 (경미)');
    setIsEditing(false);
  };

  // 게시글 삭제
  const handleDelete = async (reportId: string) => {
    if (!confirm('정말로 이 기밀 보고서를 파기(삭제)하시겠습니까?')) return;
    setActionLoading(true);

    const { error } = await supabase.from('reports').delete().eq('id', reportId);

    if (error) {
      alert('삭제 실패: ' + error.message);
    } else {
      alert('기밀 보고서가 파기되었습니다.');
      setSelectedReport(null);
      fetchReports();
    }
    setActionLoading(false);
  };

  // 게시글 수정 저장
  const handleUpdate = async () => {
    if (!selectedReport) return;
    setActionLoading(true);

    const { error } = await supabase
      .from('reports')
      .update({
        title: editTitle.trim(),
        content: editContent.trim(),
        location: editLocation.trim(),
        danger_level: editDangerLevel,
      })
      .eq('id', selectedReport.id);

    if (error) {
      alert('수정 실패: ' + error.message);
    } else {
      alert('보고서 수정이 완료되었습니다.');
      setIsEditing(false);
      setSelectedReport(null);
      fetchReports();
    }
    setActionLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-mono p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-7 h-7 text-red-600 animate-pulse" />
            <h1 className="text-xl font-bold text-red-600 tracking-wider">특무 요원 기밀 대시보드</h1>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
            className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 text-xs px-3 py-1.5 rounded flex items-center space-x-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>접속 종료</span>
          </button>
        </div>

        {/* 새 보고서 작성 버튼 */}
        <div className="flex justify-end">
          <button
            onClick={() => router.push('/new-report')}
            className="bg-red-900 hover:bg-red-800 text-white text-xs px-4 py-2.5 rounded font-bold border border-red-700 flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-red-950/50"
          >
            <Plus className="w-4 h-4" />
            <span>새 기밀 보고서 작성</span>
          </button>
        </div>

        {/* 보고서 목록 */}
        {loading ? (
          <div className="text-center text-xs text-neutral-500 py-16">기밀 데이터베이스 검색 중...</div>
        ) : reports.length === 0 ? (
          <div className="text-center text-xs text-neutral-600 py-16 border border-dashed border-neutral-800 rounded space-y-2">
            <FileText className="w-8 h-8 text-neutral-700 mx-auto" />
            <p>등록된 기밀 보고서가 존재하지 않습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => handleOpenDetail(report)}
                className="bg-neutral-900/80 border border-neutral-800 hover:border-red-900/80 p-5 rounded-lg space-y-3 cursor-pointer transition-all hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                  <h3 className="text-base font-bold text-neutral-100 flex items-center space-x-2">
                    <span className="text-red-600">■</span>
                    <span>{report.title}</span>
                  </h3>
                  <span className="bg-red-950/80 border border-red-900 text-red-400 text-[11px] px-2.5 py-1 rounded">
                    {report.danger_level || 'LEVEL 1'}
                  </span>
                </div>

                {report.location && (
                  <div className="text-xs text-neutral-400 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                    <span>발생 장소: {report.location}</span>
                  </div>
                )}

                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                  {report.content}
                </p>

                {report.image_url && (
                  <div className="text-[11px] text-neutral-500 flex items-center space-x-1">
                    <ImageIcon className="w-3.5 h-3.5 text-red-500" />
                    <span>현장 사진 증거 첨부됨 (클릭하여 열람)</span>
                  </div>
                )}

                <div className="text-[10px] text-neutral-500 border-t border-neutral-800/60 pt-2 flex justify-between items-center">
                  <span>작성 요원: <strong className="text-neutral-400">{report.author_nickname || '익명 요원'}</strong></span>
                  <span>{new Date(report.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 팝업 모달 (상세보기 & 수정) */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg p-6 space-y-5">
            {/* 모달 헤더 */}
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <span className="text-xs text-red-500 font-bold tracking-wider">LEVEL 3 기밀 문서 상세</span>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-neutral-500 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isEditing ? (
              /* 수정 폼 */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">제목</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">발생 장소</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">위험도 등급</label>
                  <select
                    value={editDangerLevel}
                    onChange={(e) => setEditDangerLevel(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200"
                  >
                    <option value="LEVEL 1 (경미)">LEVEL 1 (경미)</option>
                    <option value="LEVEL 2 (주의)">LEVEL 2 (주의)</option>
                    <option value="LEVEL 3 (위험)">LEVEL 3 (위험)</option>
                    <option value="LEVEL 4 (극심)">LEVEL 4 (극심)</option>
                    <option value="LEVEL 5 (재앙)">LEVEL 5 (재앙)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">내용</label>
                  <textarea
                    rows={6}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-xs text-neutral-200 resize-none"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-neutral-800 text-neutral-300 text-xs px-4 py-2 rounded cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={actionLoading}
                    className="bg-red-900 text-white text-xs px-4 py-2 rounded flex items-center space-x-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>저장하기</span>
                  </button>
                </div>
              </div>
            ) : (
              /* 상세보기 뷰 */
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <h2 className="text-lg font-bold text-neutral-100">{selectedReport.title}</h2>
                  <span className="bg-red-950 border border-red-900 text-red-400 text-xs px-2.5 py-1 rounded whitespace-nowrap">
                    {selectedReport.danger_level}
                  </span>
                </div>

                {selectedReport.location && (
                  <div className="text-xs text-neutral-400 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                    <span>발생 장소: {selectedReport.location}</span>
                  </div>
                )}

                <div className="bg-neutral-950 p-4 rounded border border-neutral-800/80 text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">
                  {selectedReport.content}
                </div>

                {/* 이미지 원본 보기 */}
                {selectedReport.image_url && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-neutral-500">현장 첨부 증거 사진:</span>
                    <img
                      src={selectedReport.image_url}
                      alt="현장 증거 사진"
                      className="w-full max-h-96 object-contain rounded border border-neutral-800 bg-neutral-950"
                    />
                  </div>
                )}

                <div className="text-[11px] text-neutral-500 border-t border-neutral-800 pt-3 flex justify-between items-center">
                  <span>작성자: {selectedReport.author_nickname || '익명 요원'}</span>
                  <span>{new Date(selectedReport.created_at).toLocaleString()}</span>
                </div>

                {/* 작성자 본인일 경우에만 수정/삭제 버튼 노출 */}
                {currentUserId === selectedReport.user_id && (
                  <div className="flex justify-end space-x-2 border-t border-neutral-800 pt-3">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs px-3 py-1.5 rounded flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>수정</span>
                    </button>
                    <button
                      onClick={() => handleDelete(selectedReport.id)}
                      disabled={actionLoading}
                      className="bg-red-950 hover:bg-red-900 text-red-300 text-xs px-3 py-1.5 rounded flex items-center space-x-1 border border-red-900 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>파기(삭제)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}