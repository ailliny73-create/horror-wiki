'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { translations, Language } from '@/lib/i18n';
import { translateToKorean } from '@/lib/translate';
import { ShieldAlert, Plus, LogOut, MapPin, AlertCircle, FileText, Trash2, Edit, X, Save, UserCheck, Filter, Radio, Megaphone, Shield, MessageSquare, Send, Loader2, Search, Activity, Globe, Flame, AlertTriangle, RefreshCw, Bell, CheckCheck, Lock, EyeOff, CalendarCheck, Award, Zap, Crown, Languages } from 'lucide-react';

export default function DashboardPage() {
  const [lang, setLang] = useState<Language>('kr');
  const t = translations[lang];

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userNickname, setUserNickname] = useState<string>('');
  
  // 🎮 유저 경험치 및 등급 상태
  const [userExp, setUserExp] = useState<number>(0);
  const [userLevel, setUserLevel] = useState<number>(5); // 1급 ~ 5급
  const [isCheckedInToday, setIsCheckedInToday] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // 🚨 괴이 404 신호 간섭 상태
  const [showFake404, setShowFake404] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<number>(10);

  // 🔔 알림 상태
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotiDropdown, setShowNotiDropdown] = useState(false);

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

  // 🌐 실시간 번역 상태
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedContent, setTranslatedContent] = useState('');
  const [translatedTitle, setTranslatedTitle] = useState('');
  const [translating, setTranslating] = useState(false);

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
        const nickname = user.user_metadata?.nickname || user.email?.split('@')[0] || '특무 요원';
        setUserNickname(nickname);

        const isUserAdmin = Boolean(user.user_metadata?.role === 'ADMIN' || nickname === 'ADMIN' || user.email?.startsWith('admin'));
        setIsAdmin(isUserAdmin);

        await fetchUserProfile(user.id, nickname, isUserAdmin);
        await fetchNotifications(user.id);
      }
      await fetchReports();
    } catch (err) {
      console.error('Init error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateLevel = (exp: number, admin: boolean) => {
    if (admin) return 1;
    if (exp >= 1000) return 1;
    if (exp >= 600) return 2;
    if (exp >= 300) return 3;
    if (exp >= 100) return 4;
    return 5;
  };

  const fetchUserProfile = async (userId: string, nickname: string, admin: boolean) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const todayStr = new Date().toISOString().split('T')[0];

    if (data) {
      const level = calculateLevel(data.exp, admin);
      setUserExp(data.exp);
      setUserLevel(level);
      setIsCheckedInToday(data.last_checkin === todayStr);

      if (level !== data.clearance_level && !admin) {
        await supabase.from('user_profiles').update({ clearance_level: level }).eq('user_id', userId);
      }
    } else {
      const initialExp = 0;
      const initialLevel = admin ? 1 : 5;
      await supabase.from('user_profiles').insert([
        {
          user_id: userId,
          nickname: nickname,
          exp: initialExp,
          clearance_level: initialLevel,
        },
      ]);
      setUserExp(initialExp);
      setUserLevel(initialLevel);
    }
  };

  const handleCheckIn = async () => {
    if (!currentUserId || isCheckedInToday) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const addedExp = 20;
    const newExp = userExp + addedExp;
    const newLevel = calculateLevel(newExp, isAdmin);

    const { error } = await supabase
      .from('user_profiles')
      .update({
        exp: newExp,
        clearance_level: newLevel,
        last_checkin: todayStr,
      })
      .eq('user_id', currentUserId);

    if (error) {
      alert('출석 체크 오류: ' + error.message);
    } else {
      setUserExp(newExp);
      setUserLevel(newLevel);
      setIsCheckedInToday(true);
      alert(`🎉 [일일 보안 출석 완료] 경험치 +${addedExp} EXP를 습득하셨습니다!`);
    }
  };

  const addExp = async (amount: number) => {
    if (!currentUserId) return;
    const newExp = userExp + amount;
    const newLevel = calculateLevel(newExp, isAdmin);

    await supabase
      .from('user_profiles')
      .update({ exp: newExp, clearance_level: newLevel })
      .eq('user_id', currentUserId);

    setUserExp(newExp);
    setUserLevel(newLevel);
  };

  const fetchNotifications = async (userId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      setNotifications(data);
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

      const hazardReportsCount = data.filter(
        (r) => (r.category === '위험 보고서' || !r.category) && !r.is_notice
      ).length;

      let milestone = 0;
      if (hazardReportsCount >= 50) {
        milestone = Math.floor(hazardReportsCount / 50) * 50;
      } else if (hazardReportsCount >= 10) {
        milestone = 10;
      }

      if (milestone > 0 && !sessionStorage.getItem(`anomaly_404_shown_${milestone}`)) {
        setCurrentMilestone(milestone);
        setShowFake404(true);
        sessionStorage.setItem(`anomaly_404_shown_${milestone}`, 'true');

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

  const maskText = (text: string, requiredLevel: number = 5) => {
    if (!text) return '';
    if (userLevel <= requiredLevel) {
      return text;
    }
    return '■'.repeat(Math.min(text.length, 120)) + ' [보안 인가 등급 부족으로 가림 처리됨]';
  };

  const handleOpenDetail = async (report: any) => {
    setSelectedReport(report);
    setEditTitle(report.title);
    setEditContent(report.content);
    setEditLocation(report.location || '');
    setEditDangerLevel(report.danger_level || 'LEVEL 1 (경미)');
    setIsEditing(false);
    
    // 번역 상태 리셋
    setIsTranslated(false);
    setTranslatedTitle('');
    setTranslatedContent('');

    await fetchComments(report.id);
  };

  // 🌐 실시간 한국어 번역 토글 핸들러
  const handleToggleTranslate = async () => {
    if (!selectedReport) return;

    if (!isTranslated) {
      if (!translatedContent) {
        setTranslating(true);
        const [transTitle, transContent] = await Promise.all([
          translateToKorean(selectedReport.title),
          translateToKorean(selectedReport.content),
        ]);
        setTranslatedTitle(transTitle);
        setTranslatedContent(transContent);
        setTranslating(false);
      }
      setIsTranslated(true);
    } else {
      setIsTranslated(false);
    }
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

    if (userLevel > (selectedReport.required_level || 5)) {
      alert('보안 인가 등급이 부족하여 현장 의견을 남길 수 없습니다.');
      return;
    }

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
      await addExp(5);

      if (selectedReport.user_id && selectedReport.user_id !== currentUserId) {
        await supabase.from('notifications').insert([
          {
            user_id: selectedReport.user_id,
            sender_nickname: userNickname,
            report_id: selectedReport.id,
            report_title: selectedReport.title,
          },
        ]);
      }

      setNewComment('');
      await fetchComments(selectedReport.id);
    }
    setCommentLoading(false);
  };

  const handleNotificationClick = async (noti: any) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', noti.id);
    if (currentUserId) fetchNotifications(currentUserId);

    const targetReport = reports.find((r) => r.id === noti.report_id);
    if (targetReport) {
      handleOpenDetail(targetReport);
      setShowNotiDropdown(false);
    } else {
      alert('해당 기밀 문서가 파기되었거나 존재하지 않습니다.');
    }
  };

  const handleMarkAllRead = async () => {
    if (!currentUserId) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUserId);
    fetchNotifications(currentUserId);
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

  const unreadNotiCount = notifications.filter((n) => !n.is_read).length;

  const getNextExpTarget = (exp: number) => {
    if (exp >= 1000) return 1000;
    if (exp >= 600) return 1000;
    if (exp >= 300) return 600;
    if (exp >= 100) return 300;
    return 100;
  };
  const targetExp = getNextExpTarget(userExp);
  const expProgressPercent = Math.min(Math.round((userExp / targetExp) * 100), 100);

  const totalReportsCount = reports.length;
  const highDangerCount = reports.filter(
    (r) => r.danger_level?.includes('LEVEL 4') || r.danger_level?.includes('LEVEL 5')
  ).length;
  const noticeCount = reports.filter((r) => r.is_notice).length;

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
                "축적된 위험 보고서 데이터가 특수 임계치(<span className="font-extrabold text-red-400">{currentMilestone}건 이상</span>)에 도달하면서 주파수 노이즈와 괴이 전파 신호가 사령부 백본망을 침투했습니다..."
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
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div className="flex items-center space-x-3">
              <ShieldAlert className="w-7 h-7 text-red-600 animate-pulse shrink-0" />
              <div>
                <h1 className="text-sm font-extrabold text-red-600 tracking-wider">SPECIAL OPS</h1>
                <span className="text-[10px] text-neutral-500">Classified Dashboard</span>
              </div>
            </div>

            {/* 🔔 알림 버튼 */}
            <div className="relative">
              <button
                onClick={() => setShowNotiDropdown(!showNotiDropdown)}
                className="relative p-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded text-neutral-300 transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4 text-neutral-400" />
                {unreadNotiCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                    {unreadNotiCount}
                  </span>
                )}
              </button>

              {showNotiDropdown && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl z-50 p-3 space-y-2">
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                    <span className="text-xs font-bold text-neutral-200">현장 신호 알림</span>
                    {unreadNotiCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-red-400 hover:text-red-300 flex items-center space-x-1 cursor-pointer"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>모두 읽음</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-[11px] text-neutral-600 text-center py-4">수신된 신호 알림이 없습니다.</div>
                    ) : (
                      notifications.map((noti) => (
                        <div
                          key={noti.id}
                          onClick={() => handleNotificationClick(noti)}
                          className={`p-2.5 rounded border text-xs cursor-pointer transition-colors space-y-1 ${
                            noti.is_read
                              ? 'bg-neutral-950/50 border-neutral-900 text-neutral-500'
                              : 'bg-red-950/40 border-red-900/80 text-neutral-200'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-red-400 text-[11px]">{noti.sender_nickname} 요원</span>
                            <span className="text-[9px] text-neutral-600">
                              {new Date(noti.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] line-clamp-1">
                            [{noti.report_title}] 문서에 의견을 남겼습니다.
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

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
              <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded text-xs space-y-3">
                <div className="flex justify-between items-center text-[10px] text-neutral-500">
                  <span>Access Clearance</span>
                  <span className={`font-bold flex items-center space-x-1 ${isAdmin ? 'text-yellow-400' : 'text-red-400'}`}>
                    {isAdmin ? <Crown className="w-3.5 h-3.5 text-yellow-500 animate-pulse" /> : <Award className="w-3 h-3 text-yellow-500" />}
                    <span>{isAdmin ? '👑 최고 관리자' : `보안 ${userLevel}급 요원`}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between font-bold border-b border-neutral-900 pb-2">
                  <div className="flex items-center space-x-1.5">
                    {isAdmin ? <Crown className="w-4 h-4 text-yellow-500" /> : <UserCheck className="w-3.5 h-3.5 text-red-500" />}
                    <span className={isAdmin ? 'text-yellow-400 font-extrabold' : 'text-neutral-200'}>{userNickname}</span>
                  </div>
                  <span className="text-[10px] text-red-400 flex items-center space-x-0.5">
                    <Zap className="w-3 h-3" />
                    <span>{userExp} EXP</span>
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-neutral-500">
                    <span>Target Clearance</span>
                    <span>{isAdmin ? 'MAX' : `${expProgressPercent}%`}</span>
                  </div>
                  <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden border border-neutral-800">
                    <div
                      className={`${isAdmin ? 'bg-yellow-500' : 'bg-red-600'} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${isAdmin ? 100 : expProgressPercent}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleCheckIn}
                  disabled={isCheckedInToday}
                  className={`w-full text-xs py-2 rounded font-bold border flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    isCheckedInToday
                      ? 'bg-neutral-900 border-neutral-800 text-neutral-500 cursor-not-allowed'
                      : 'bg-red-950 hover:bg-red-900 border-red-800 text-red-300 animate-pulse'
                  }`}
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>{isCheckedInToday ? '오늘 출석 완료 (+20 EXP)' : '📅 일일 출석 체크 (+20 EXP)'}</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => router.push('/new-report')}
            className="w-full bg-red-900 hover:bg-red-800 text-white text-xs py-3 rounded font-bold border border-red-700 flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-red-950/50 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newDocument}</span>
          </button>

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

        {loading ? (
          <div className="text-center text-xs text-neutral-500 py-16">Loading Classified Database...</div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center text-xs text-neutral-600 py-16 border border-dashed border-neutral-800 rounded space-y-2">
            <FileText className="w-8 h-8 text-neutral-700 mx-auto" />
            <p>{t.noDocs}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const reqLevel = report.required_level || 5;
              const isRestricted = userLevel > reqLevel;

              return (
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
                      
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold border flex items-center space-x-1 ${
                        isRestricted 
                          ? 'bg-red-950 border-red-800 text-red-400' 
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                      }`}>
                        {isRestricted ? <Lock className="w-3 h-3 text-red-500" /> : <Shield className="w-3 h-3 text-yellow-500" />}
                        <span>보안 {reqLevel}급 인가 필요</span>
                      </span>

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
                      <span>{t.location}: {maskText(report.location, reqLevel)}</span>
                    </div>
                  )}

                  <p className={`text-xs leading-relaxed line-clamp-2 ${isRestricted ? 'text-red-400/80 font-mono tracking-widest' : 'text-neutral-400'}`}>
                    {maskText(report.content, reqLevel)}
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
              );
            })}
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
                    <h2 className="text-lg font-bold text-neutral-100">
                      {isTranslated ? translatedTitle : selectedReport.title}
                    </h2>
                    {!selectedReport.is_notice && selectedReport.danger_level && selectedReport.danger_level !== '일반' && (
                      <span className="bg-red-950 border border-red-900 text-red-400 text-xs px-2.5 py-1 rounded whitespace-nowrap">
                        {selectedReport.danger_level}
                      </span>
                    )}
                  </div>

                  {/* 🌐 실시간 한국어 번역 토글 버튼 */}
                  <div className="flex justify-between items-center bg-neutral-950 border border-neutral-800/80 px-3 py-2 rounded">
                    <span className="text-[11px] text-neutral-400 flex items-center space-x-1">
                      <Languages className="w-3.5 h-3.5 text-red-500" />
                      <span>{isTranslated ? '🌐 한국어 번역 적용 중' : '🌐 다국어 지원 모드'}</span>
                    </span>
                    <button
                      onClick={handleToggleTranslate}
                      disabled={translating}
                      className="text-[11px] bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 font-bold px-2.5 py-1 rounded transition-all cursor-pointer flex items-center space-x-1"
                    >
                      {translating ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-red-400" />
                          <span>번역 변환 중...</span>
                        </>
                      ) : (
                        <span>{isTranslated ? '↩️ 원문 보기 (Original)' : '🇰🇷 한국어로 실시간 번역'}</span>
                      )}
                    </button>
                  </div>

                  {selectedReport.location && selectedReport.location !== '자유 게시판' && (
                    <div className="text-xs text-neutral-400 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{t.location}: {maskText(selectedReport.location, selectedReport.required_level || 5)}</span>
                    </div>
                  )}

                  {userLevel > (selectedReport.required_level || 5) ? (
                    <div className="bg-red-950/30 border border-red-900/80 p-5 rounded space-y-3 text-center">
                      <EyeOff className="w-8 h-8 text-red-500 mx-auto animate-pulse" />
                      <p className="text-xs text-red-300 font-bold">{t.restricted}</p>
                      <div className="bg-neutral-950 p-3 rounded text-[11px] font-mono text-red-500/60 break-all select-none">
                        {maskText(selectedReport.content, selectedReport.required_level || 5)}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-neutral-950 p-4 rounded border border-neutral-800/80 text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">
                      {isTranslated ? translatedContent : selectedReport.content}
                    </div>
                  )}

                  {selectedReport.image_url && userLevel <= (selectedReport.required_level || 5) && (
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

                  {userLevel <= (selectedReport.required_level || 5) ? (
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
                        <span>{t.send} (+5 EXP)</span>
                      </button>
                    </form>
                  ) : (
                    <div className="text-[11px] text-red-500 bg-red-950/20 border border-red-900/50 p-2.5 rounded text-center">
                      보안 인가 등급이 부족하여 현장 의견을 남길 수 없습니다.
                    </div>
                  )}

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
                          <p className="text-neutral-300 leading-relaxed break-all">
                            {userLevel <= (selectedReport.required_level || 5) ? comment.content : maskText(comment.content, selectedReport.required_level || 5)}
                          </p>
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