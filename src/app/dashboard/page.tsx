'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Plus, LogOut, MapPin, AlertCircle, FileText, Trash2, Edit, X, Save, Image as ImageIcon, UserCheck, Filter, Radio, Megaphone, Shield, MessageSquare, Send, Loader2, Search, Activity, Hash, Flame } from 'lucide-react';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userNickname, setUserNickname] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);

  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'전체' | '위험 보고서' | '자유 게시판' | '공지사항'>('전체');
  const [dangerFilter, setDangerFilter] = useState<string>('전체');

  // 모달 및 게시글 상태
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDangerLevel, setEditDangerLevel] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // 댓글 상태
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        setUserNickname(user.user_metadata?.nickname || user.email?.split('@')[0] || '특무 요원');
        if (user.user_metadata?.role === 'ADMIN') {
          setIsAdmin(true);
        }
      }
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
      .order('is_notice', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReports(data);
    }
  };

  const handleOpenDetail = async (report: any) => {
    setSelectedReport(report);
    setEditTitle(report.title);
    setEditContent(report.content);
    setEditLocation(report.location || '');
    setEditDangerLevel(report.danger_level || 'LEVEL 1 (경미)');
    setIsEditing(false);
    await fetchComments(report.id);
  };

  const fetchComments = async (reportId: string) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setComments(data);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedReport || commentLoading) return;

    setCommentLoading(true);

    const { error } = await supabase.from('comments').insert([
      {
        report_id: selectedReport.id,
        user_id: currentUserId,
        author_nickname: userNickname,
        content: newComment.trim(),
      },
    ]);

    if (error) {
      alert('댓글 등록 실패: ' + error.message);
    } else {
      setNewComment('');
      await fetchComments(selectedReport.id);
    }
    setCommentLoading(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;

    const { error } = await supabase.from('comments').delete().eq('id', commentId);

    if (error) {
      alert('댓글 삭제 실패: ' + error.message);
    } else {
      await fetchComments(selectedReport.id);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('정말로 이 문서를 파기(삭제)하시겠습니까?')) return;
    setActionLoading(true);

    const { error } = await supabase.from('reports').delete().eq('id', reportId);

    if (error) {
      alert('삭제 실패: ' + error.message);
    } else {
      alert('문서가 정상 파기되었습니다.');
      setSelectedReport(null);
      fetchReports();
    }
    setActionLoading(false);
  };

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
      alert('수정이 완료되었습니다.');
      setIsEditing(false);
      setSelectedReport(null);
      fetchReports();
    }
    setActionLoading(false);
  };

  // 실시간 위험도 통계 계산
  const totalReportsCount = reports.length;
  const highDangerCount = reports.filter(
    (r) => r.danger_level?.includes('LEVEL 4') || r.danger_level?.includes('LEVEL 5')
  ).length;
  const noticeCount = reports.filter((r) => r.is_notice).length;

  // 필터링 적용
  const filteredReports = reports.filter((report) => {
    // 1. 카테고리 탭
    if (activeTab === '공지사항' && !report.is_notice) return false;
    if (activeTab === '위험 보고서' && (report.category !== '위험 보고서' || report.is_notice)) return false;
    if (activeTab === '자유 게시판' && (report.category !== '자유 게시판' || report.is_notice)) return false;

    // 2. 위험도 필터
    if (dangerFilter !== '전체' && activeTab !== '공지사항') {
      if (!report.danger_level || !report.danger_level.startsWith(dangerFilter)) return false;
    }

    // 3. 해시태그 필터
    if (selectedTag) {
      if (!report.tags || !report.tags.includes(selectedTag)) return false;
    }

    // 4. 검색어 (제목, 내용, 위치)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = report.title?.toLowerCase().includes(q);
      const contentMatch = report.content?.toLowerCase().includes(q);
      const locationMatch = report.location?.toLowerCase().includes(q);
      if (!titleMatch && !contentMatch && !locationMatch) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-mono p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-4">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-7 h-7 text-red-600 animate-pulse" />
            <h1 className="text-xl font-bold text-red-600 tracking-wider">특무 요원 기밀 대시보드</h1>
          </div>

          <div className="flex items-center space-x-3">
            {userNickname && (
              <div className="bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded text-xs text-neutral-300 flex items-center space-x-2">
                {isAdmin ? <Shield className="w-4 h-4 text-yellow-500 animate-bounce" /> : <UserCheck className="w-3.5 h-3.5 text-red-500" />}
                <span>요원: <strong className={isAdmin ? 'text-yellow-400 font-bold' : 'text-red-400'}>{userNickname} {isAdmin && '(사령관)'}</strong></span>
              </div>
            )}
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
        </div>

        {/* 📊 1. 실시간 현황 통계 위젯 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-neutral-900/60 border border-neutral-800 p-3.5 rounded-lg flex items-center space-x-3">
            <Activity className="w-6 h-6 text-red-500" />
            <div>
              <div className="text-[10px] text-neutral-500">누적 기밀 문서</div>
              <div className="text-base font-bold text-neutral-100">{totalReportsCount} 건</div>
            </div>
          </div>

          <div className="bg-red-950/40 border border-red-900/60 p-3.5 rounded-lg flex items-center space-x-3">
            <Flame className="w-6 h-6 text-red-500 animate-pulse" />
            <div>
              <div className="text-[10px] text-red-400">고위험 비상사태 (L4~L5)</div>
              <div className="text-base font-bold text-red-300">{highDangerCount} 건 발령 중</div>
            </div>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 p-3.5 rounded-lg flex items-center space-x-3">
            <Megaphone className="w-6 h-6 text-yellow-500" />
            <div>
              <div className="text-[10px] text-neutral-500">사령부 긴급 지침</div>
              <div className="text-base font-bold text-yellow-400">{noticeCount} 건 활성</div>
            </div>
          </div>
        </div>

        {/* 🔍 2. 통합 검색창 및 해시태그 필터 */}
        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-lg space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="문서 제목, 상세 사건 내용, 사건 발생 위치 통합 검색..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded pl-10 pr-4 py-2 text-xs text-neutral-200 focus:outline-none focus:border-red-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-neutral-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {selectedTag && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-neutral-500">선택된 해시태그:</span>
              <span className="bg-red-950 border border-red-800 text-red-300 px-2 py-0.5 rounded flex items-center space-x-1">
                <span>#{selectedTag}</span>
                <button onClick={() => setSelectedTag(null)} className="hover:text-white">✕</button>
              </span>
            </div>
          )}
        </div>

        {/* 게시판 탭 & 새 문서 작성 버튼 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-1 bg-neutral-900/80 p-1 rounded-lg border border-neutral-800">
            <button
              onClick={() => setActiveTab('전체')}
              className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors ${
                activeTab === '전체' ? 'bg-red-900 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              전체 보기
            </button>
            <button
              onClick={() => setActiveTab('공지사항')}
              className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors flex items-center space-x-1 ${
                activeTab === '공지사항' ? 'bg-red-900 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5 text-yellow-400" />
              <span>긴급 공지</span>
            </button>
            <button
              onClick={() => setActiveTab('위험 보고서')}
              className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors flex items-center space-x-1 ${
                activeTab === '위험 보고서' ? 'bg-red-900 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>위험 보고서</span>
            </button>
            <button
              onClick={() => setActiveTab('자유 게시판')}
              className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors flex items-center space-x-1 ${
                activeTab === '자유 게시판' ? 'bg-red-900 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>자유 게시판</span>
            </button>
          </div>

          <button
            onClick={() => router.push('/new-report')}
            className="bg-red-900 hover:bg-red-800 text-white text-xs px-4 py-2.5 rounded font-bold border border-red-700 flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-red-950/50"
          >
            <Plus className="w-4 h-4" />
            <span>새 문서 작성</span>
          </button>
        </div>

        {/* 위험도 필터 */}
        {activeTab !== '자유 게시판' && activeTab !== '공지사항' && (
          <div className="bg-neutral-900/40 border border-neutral-800/80 p-3 rounded-lg flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-500 flex items-center space-x-1 mr-2">
              <Filter className="w-3.5 h-3.5 text-red-600" />
              <span>위험도 필터:</span>
            </span>
            {['전체', 'LEVEL 1', 'LEVEL 2', 'LEVEL 3', 'LEVEL 4', 'LEVEL 5'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setDangerFilter(lvl)}
                className={`text-[11px] px-2.5 py-1 rounded cursor-pointer transition-all ${
                  dangerFilter === lvl
                    ? 'bg-red-950 border border-red-800 text-red-300 font-bold'
                    : 'bg-neutral-950 text-neutral-500 hover:text-neutral-300 border border-neutral-900'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        )}

        {/* 보고서 목록 */}
        {loading ? (
          <div className="text-center text-xs text-neutral-500 py-16">기밀 데이터베이스 검색 중...</div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center text-xs text-neutral-600 py-16 border border-dashed border-neutral-800 rounded space-y-2">
            <FileText className="w-8 h-8 text-neutral-700 mx-auto" />
            <p>검색 조건에 부합하는 기밀 문서가 존재하지 않습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => handleOpenDetail(report)}
                className={`border p-5 rounded-lg space-y-3 cursor-pointer transition-all hover:scale-[1.01] ${
                  report.is_notice
                    ? 'bg-red-950/30 border-red-800/80 hover:border-red-600 shadow-md shadow-red-950/20'
                    : 'bg-neutral-900/80 border-neutral-800 hover:border-red-900/80'
                }`}
              >
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                  <div className="flex items-center space-x-2">
                    {report.is_notice ? (
                      <span className="text-xs px-2.5 py-0.5 rounded bg-red-900 text-yellow-300 font-bold flex items-center space-x-1 animate-pulse">
                        <Megaphone className="w-3 h-3" />
                        <span>사령부 긴급 공지</span>
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-bold">
                        {report.category || '위험 보고서'}
                      </span>
                    )}
                    <h3 className="text-base font-bold text-neutral-100">{report.title}</h3>
                  </div>

                  {!report.is_notice && report.danger_level && report.danger_level !== '일반' && (
                    <span className="bg-red-950/80 border border-red-900 text-red-400 text-[11px] px-2.5 py-1 rounded">
                      {report.danger_level}
                    </span>
                  )}
                </div>

                {report.location && report.location !== '자유 게시판' && (
                  <div className="text-xs text-neutral-400 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                    <span>발생 장소: {report.location}</span>
                  </div>
                )}

                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                  {report.content}
                </p>

                {/* 해시태그 목록 */}
                {report.tags && report.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {report.tags.map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTag(tag);
                        }}
                        className="text-[10px] bg-neutral-950 hover:bg-red-950 text-neutral-400 hover:text-red-300 border border-neutral-800 px-2 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-[10px] text-neutral-500 border-t border-neutral-800/60 pt-2 flex justify-between items-center">
                  <span>발령 요원: <strong className="text-neutral-400">{report.author_nickname || '익명 요원'}</strong></span>
                  <span>{new Date(report.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 상세보기 모달 */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <span className="text-xs text-red-500 font-bold tracking-wider">
                [{selectedReport.is_notice ? '사령부 공지사항' : selectedReport.category || '기밀 문서'}] 상세 열람
              </span>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-neutral-500 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isEditing ? (
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
                {!selectedReport.is_notice && selectedReport.category === '위험 보고서' && (
                  <>
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
                  </>
                )}
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
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <h2 className="text-lg font-bold text-neutral-100">{selectedReport.title}</h2>
                    {!selectedReport.is_notice && selectedReport.danger_level && selectedReport.danger_level !== '일반' && (
                      <span className="bg-red-950 border border-red-900 text-red-400 text-xs px-2.5 py-1 rounded whitespace-nowrap">
                        {selectedReport.danger_level}
                      </span>
                    )}
                  </div>

                  {selectedReport.location && selectedReport.location !== '자유 게시판' && (
                    <div className="text-xs text-neutral-400 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                      <span>발생 장소: {selectedReport.location}</span>
                    </div>
                  )}

                  <div className="bg-neutral-950 p-4 rounded border border-neutral-800/80 text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">
                    {selectedReport.content}
                  </div>

                  {selectedReport.image_url && (
                    <div className="space-y-1">
                      <span className="text-[11px] text-neutral-500">첨부 사진:</span>
                      <img
                        src={selectedReport.image_url}
                        alt="첨부 이미지"
                        className="w-full max-h-96 object-contain rounded border border-neutral-800 bg-neutral-950"
                      />
                    </div>
                  )}

                  <div className="text-[11px] text-neutral-500 border-t border-neutral-800 pt-3 flex justify-between items-center">
                    <span>발령자: {selectedReport.author_nickname || '익명 요원'}</span>
                    <span>{new Date(selectedReport.created_at).toLocaleString()}</span>
                  </div>

                  {(isAdmin || (currentUserId && currentUserId === selectedReport.user_id)) && (
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

                {/* 댓글 섹션 */}
                <div className="border-t border-neutral-800 pt-5 space-y-4">
                  <div className="flex items-center space-x-2 text-xs font-bold text-neutral-300">
                    <MessageSquare className="w-4 h-4 text-red-600" />
                    <span>특무 요원 현장 의견 ({comments.length})</span>
                  </div>

                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="현장 조치 의견 및 상황 추가 기록..."
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-red-900"
                    />
                    <button
                      type="submit"
                      disabled={commentLoading}
                      className="bg-red-900 hover:bg-red-800 text-white text-xs px-4 py-2 rounded flex items-center space-x-1 font-bold cursor-pointer disabled:opacity-50"
                    >
                      {commentLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>전송</span>
                    </button>
                  </form>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {comments.length === 0 ? (
                      <div className="text-center text-[11px] text-neutral-600 py-4">
                        등록된 현장 의견이 없습니다.
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="bg-neutral-950 border border-neutral-800/80 p-3 rounded space-y-1 text-xs"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-red-400">{comment.author_nickname}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] text-neutral-600">
                                {new Date(comment.created_at).toLocaleString()}
                              </span>
                              {(isAdmin || currentUserId === comment.user_id) && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-neutral-600 hover:text-red-400 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-neutral-300 leading-relaxed break-all">{comment.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}