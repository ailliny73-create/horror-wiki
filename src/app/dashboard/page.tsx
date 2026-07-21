'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { translations, Language } from '@/lib/i18n';
import { ShieldAlert, Plus, LogOut, MapPin, AlertCircle, FileText, Trash2, Edit, X, Save, UserCheck, Filter, Radio, Megaphone, Shield, MessageSquare, Send, Loader2, Search, Activity, Globe, Flame, AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const [lang, setLang] = useState<Language>('kr');
  const t = translations[lang];

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userNickname, setUserNickname] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);

  // 🚨 괴이 404 신호 간섭 상태
  const [showFake404, setShowFake404] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

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

      // 💡 게시글이 10개 이상 쌓였을 경우, 404 괴이 신호 간섭 발동 (세션당 1회)
      if (data.length >= 10 && !sessionStorage.getItem('anomaly_404_shown')) {
        setShowFake404(true);
        sessionStorage.setItem('anomaly_404_shown', 'true');

        // 3.5초 후 자동 복구
        setTimeout(() => {
          setIsRestoring(true);
          setTimeout(() => {
            setShowFake404(false);
            setIsRestoring(false);
          }, 1200);
        }, 3500);
      }
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
      alert('Error: ' + error.message);
    } else {
      setNewComment('');
      await fetchComments(selectedReport.id);
    }
    setCommentLoading(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    const { error } = await supabase.from('comments').delete().eq('id', commentId);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      await fetchComments(selectedReport.id);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Purge this document?')) return;
    setActionLoading(true);

    const { error } = await supabase.from('reports').delete().eq('id', reportId);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Document purged.');
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
      alert('Error: ' + error.message);
    } else {
      alert('Updated successfully.');
      setIsEditing(false);
      setSelectedReport(null);
      fetchReports();
    }
    setActionLoading(false);
  };

  // 통계 계산
  const totalReportsCount = reports.length;
  const highDangerCount = reports.filter(
    (r) => r.danger_level?.includes('LEVEL 4') || r.danger_level?.includes('LEVEL 5')
  ).length;
  const noticeCount = reports.filter((r) => r.is_notice).length;

  // 필터링 적용
  const filteredReports = reports.filter((report) => {
    if (activeTab === '공지사항' && !report.is_notice) return false;
    if (activeTab === '위험 보고서' && (report.category !== '위험 보고서' || report.is_notice)) return false;
    if (activeTab === '자유 게시판' && (report.category !== '자유 게시판' || report.is_notice)) return false;

    if (dangerFilter !== '전체' && activeTab !== '공지사항') {
      if (!report.danger_level || !report.danger_level.startsWith(dangerFilter)) return false;
    }

    if (selectedTag) {
      if (!report.tags || !report.tags.includes(selectedTag)) return false;
    }

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
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-mono flex flex-col md:flex-row">
      
      {/* 🚨 404 괴이 신호 간섭 연출 모달 */}
      {showFake404 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6 text-center animate-fade-in">
          <div className="max-w-lg space-y-6 border border-red-900/80 bg-red-950/20 p-8 rounded-lg shadow-2xl shadow-red-950/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse" />
            
            <div className="flex justify-center">
              <AlertTriangle className="w-16 h-16 text-red-600 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold text-red-600 tracking-widest font-mono">
                404 NOT FOUND
              </h1>
              <p className="text-xs text-red-400 font-bold tracking-wider">
                [CRITICAL] SIGNAL INTERFERENCE DETECTED
              </p>
            </div>

            <div className="bg-neutral-950 border border-red-900/40 p-4 rounded text-left text-xs text-red-300/90 leading-relaxed space-y-2">
              <p className="font-bold text-yellow-500">⚠️ [사령부 자동 감지 로그]</p>
              <p>
                "축적된 기밀 데이터가 특수 임계치(10건 이상)에 도달하면서 주파수 노이즈와 괴이 전파 신호가 사령부 백본망을 침투했습니다..."
              </p>
              <p className="text-[11px] text-neutral-400 italic">
                - 수신된 수수께끼 음성: "우리를 더 많이 기억할수록... 문은 더 빨리 열린다..."
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2 text-xs text-neutral-400 pt-2">
              <RefreshCw className={`w-4 h-4 text-red-500 ${isRestoring ? 'animate-spin' : 'animate-pulse'}`} />
              <span>
                {isRestoring ? '긴급 방화벽 가동 및 신호 복구 중...' : '보안 프로토콜 재연결 시도 중 (3초)...'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 📌 좌측 사이드바 패널 */}
      <aside className="w-full md:w-64 bg-neutral-900/90 border-r border-neutral-800 p-5 flex flex-col justify-between shrink-0 space-y-6">
        <div className="space-y-6">
          {/* 로고 영역 */}
          <div className="flex items-center space-x-3 pb-4 border-b border-neutral-800">
            <ShieldAlert className="w-7 h-7 text-red-600 animate-pulse shrink-0" />
            <div>
              <h1 className="text-sm font-extrabold text-red-600 tracking-wider">SPECIAL OPS</h1>
              <span className="text-[10px] text-neutral-500">Classified Dashboard</span>
            </div>
          </div>

          {/* 한/영 언어 토글 및 요원 프로필 */}
          <div className="space-y-2">
            <button
              onClick={() => setLang(lang === 'kr' ? 'en' : 'kr')}
              className="w-full bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs py-2 px-3 rounded flex items-center justify-between cursor-pointer font-bold text-neutral-300 transition-colors"
            >
              <span className="flex items-center space-x-2">
                <Globe className="w-3.5 h-3.5 text-red-500" />
                <span>LANGUAGE</span>
              </span>
              <span className="text-red-400 font-bold">{lang === 'kr' ? '한국어 (KR)' : 'ENGLISH (EN)'}</span>
            </button>

            {userNickname && (
              <div className="bg-neutral-950 border border-neutral-800 p-3 rounded text-xs space-y-1">
                <div className="text-[10px] text-neutral-500">Access Identity</div>
                <div className="flex items-center space-x-2 font-bold">
                  {isAdmin ? <Shield className="w-4 h-4 text-yellow-500" /> : <UserCheck className="w-3.5 h-3.5 text-red-500" />}
                  <span className={isAdmin ? 'text-yellow-400' : 'text-red-400'}>{userNickname}</span>
                </div>
              </div>
            )}
          </div>

          {/* 새 문서 작성 버튼 */}
          <button
            onClick={() => router.push('/new-report')}
            className="w-full bg-red-900 hover:bg-red-800 text-white text-xs py-3 rounded font-bold border border-red-700 flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-red-950/50 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newDocument}</span>
          </button>

          {/* 탭 내비게이션 메뉴 */}
          <nav className="space-y-1">
            <div className="text-[10px] text-neutral-500 px-2 py-1 font-bold">CATEGORIES</div>
            {[
              { id: '전체', name: t.all, icon: Activity },
              { id: '공지사항', name: t.notice, icon: Megaphone },
              { id: '위험 보고서', name: t.report, icon: AlertCircle },
              { id: '자유 게시판', name: t.freeBoard, icon: Radio },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-red-950/80 border border-red-800/80 text-white'
                      : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 text-red-500" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>

          {/* 위험도 필터 */}
          {activeTab !== '자유 게시판' && activeTab !== '공지사항' && (
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <span className="text-[10px] text-neutral-500 flex items-center space-x-1 font-bold">
                <Filter className="w-3 h-3 text-red-600" />
                <span>{t.dangerFilter}</span>
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {['전체', 'LEVEL 1', 'LEVEL 2', 'LEVEL 3', 'LEVEL 4', 'LEVEL 5'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setDangerFilter(lvl)}
                    className={`text-[10px] py-1.5 px-2 rounded cursor-pointer transition-all text-center ${
                      dangerFilter === lvl
                        ? 'bg-red-950 border border-red-800 text-red-300 font-bold'
                        : 'bg-neutral-950 text-neutral-500 hover:text-neutral-300 border border-neutral-900'
                    }`}
                  >
                    {lvl === '전체' ? (lang === 'kr' ? '전체' : 'ALL') : lvl}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 하단 로그아웃 */}
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push('/login');
          }}
          className="w-full bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 text-xs py-2.5 rounded flex items-center justify-center space-x-2 cursor-pointer transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t.logout}</span>
        </button>
      </aside>

      {/* 📄 우측 메인 콘텐츠 영역 */}
      <main className="flex-1 p-6 space-y-6 max-w-5xl mx-auto w-full">
        
        {/* 📊 1. 실시간 현황 통계 위젯 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-neutral-900/60 border border-neutral-800 p-3.5 rounded-lg flex items-center space-x-3">
            <Activity className="w-6 h-6 text-red-500" />
            <div>
              <div className="text-[10px] text-neutral-500">{t.totalDocs}</div>
              <div className="text-base font-bold text-neutral-100">{totalReportsCount}</div>
            </div>
          </div>

          <div className="bg-red-950/40 border border-red-900/60 p-3.5 rounded-lg flex items-center space-x-3">
            <Flame className="w-6 h-6 text-red-500 animate-pulse" />
            <div>
              <div className="text-[10px] text-red-400">{t.highDanger}</div>
              <div className="text-base font-bold text-red-300">{highDangerCount} {t.activeCount}</div>
            </div>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 p-3.5 rounded-lg flex items-center space-x-3">
            <Megaphone className="w-6 h-6 text-yellow-500" />
            <div>
              <div className="text-[10px] text-neutral-500">{t.activeNotices}</div>
              <div className="text-base font-bold text-yellow-400">{noticeCount} {t.activeNoticeCount}</div>
            </div>
          </div>
        </div>

        {/* 🔍 2. 검색창 및 태그 필터 */}
        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-lg space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-neutral-950 border border-neutral-800 rounded pl-10 pr-4 py-2 text-xs text-neutral-200 focus:outline-none focus:border-red-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-neutral-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {selectedTag && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-neutral-500">Selected Tag:</span>
              <span className="bg-red-950 border border-red-800 text-red-300 px-2 py-0.5 rounded flex items-center space-x-1">
                <span>#{selectedTag}</span>
                <button onClick={() => setSelectedTag(null)} className="hover:text-white cursor-pointer">✕</button>
              </span>
            </div>
          )}
        </div>

        {/* 보고서 목록 */}
        {loading ? (
          <div className="text-center text-xs text-neutral-500 py-16">Loading Classified Database...</div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center text-xs text-neutral-600 py-16 border border-dashed border-neutral-800 rounded space-y-2">
            <FileText className="w-8 h-8 text-neutral-700 mx-auto" />
            <p>{t.noDocs}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => handleOpenDetail(report)}
                className={`border p-5 rounded-lg space-y-3 cursor-pointer transition-all hover:scale-[1.005] ${
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
                        <span>{t.notice}</span>
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-bold">
                        {report.category || t.report}
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
                    <span>{t.location}: {report.location}</span>
                  </div>
                )}

                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                  {report.content}
                </p>

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
                  <span>{t.author}: <strong className="text-neutral-400">{report.author_nickname || 'Agent'}</strong></span>
                  <span>{new Date(report.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 상세보기 모달 */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <span className="text-xs text-red-500 font-bold tracking-wider">
                [{selectedReport.is_notice ? t.notice : selectedReport.category || t.report}] {t.detailTitle}
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
                  <label className="block text-xs text-neutral-400 mb-1">Title</label>
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
                      <label className="block text-xs text-neutral-400 mb-1">{t.location}</label>
                      <input
                        type="text"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">{t.dangerFilter}</label>
                      <select
                        value={editDangerLevel}
                        onChange={(e) => setEditDangerLevel(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200"
                      >
                        <option value="LEVEL 1 (경미)">LEVEL 1</option>
                        <option value="LEVEL 2 (주의)">LEVEL 2</option>
                        <option value="LEVEL 3 (위험)">LEVEL 3</option>
                        <option value="LEVEL 4 (극심)">LEVEL 4</option>
                        <option value="LEVEL 5 (재앙)">LEVEL 5</option>
                      </select>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Content</label>
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
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={actionLoading}
                    className="bg-red-900 text-white text-xs px-4 py-2 rounded flex items-center space-x-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
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
                      <span>{t.location}: {selectedReport.location}</span>
                    </div>
                  )}

                  <div className="bg-neutral-950 p-4 rounded border border-neutral-800/80 text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">
                    {selectedReport.content}
                  </div>

                  {selectedReport.image_url && (
                    <div className="space-y-1">
                      <span className="text-[11px] text-neutral-500">Image Attachment:</span>
                      <img
                        src={selectedReport.image_url}
                        alt="Image Attachment"
                        className="w-full max-h-96 object-contain rounded border border-neutral-800 bg-neutral-950"
                      />
                    </div>
                  )}

                  <div className="text-[11px] text-neutral-500 border-t border-neutral-800 pt-3 flex justify-between items-center">
                    <span>{t.author}: {selectedReport.author_nickname || 'Agent'}</span>
                    <span>{new Date(selectedReport.created_at).toLocaleString()}</span>
                  </div>

                  {(isAdmin || (currentUserId && currentUserId === selectedReport.user_id)) && (
                    <div className="flex justify-end space-x-2 border-t border-neutral-800 pt-3">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs px-3 py-1.5 rounded flex items-center space-x-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>{t.edit}</span>
                      </button>
                      <button
                        onClick={() => handleDelete(selectedReport.id)}
                        disabled={actionLoading}
                        className="bg-red-950 hover:bg-red-900 text-red-300 text-xs px-3 py-1.5 rounded flex items-center space-x-1 border border-red-900 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t.delete}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 댓글 섹션 */}
                <div className="border-t border-neutral-800 pt-5 space-y-4">
                  <div className="flex items-center space-x-2 text-xs font-bold text-neutral-300">
                    <MessageSquare className="w-4 h-4 text-red-600" />
                    <span>{t.comments} ({comments.length})</span>
                  </div>

                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={t.commentPlaceholder}
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-red-900"
                    />
                    <button
                      type="submit"
                      disabled={commentLoading}
                      className="bg-red-900 hover:bg-red-800 text-white text-xs px-4 py-2 rounded flex items-center space-x-1 font-bold cursor-pointer disabled:opacity-50"
                    >
                      {commentLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>{t.send}</span>
                    </button>
                  </form>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {comments.length === 0 ? (
                      <div className="text-center text-[11px] text-neutral-600 py-4">
                        {t.noComments}
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