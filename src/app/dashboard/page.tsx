'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { translations, Language } from '@/lib/i18n';
import { translateToKorean } from '@/lib/translate';
import { ShieldAlert, Plus, LogOut, MapPin, AlertCircle, FileText, Trash2, Edit, X, Save, UserCheck, Filter, Radio, Megaphone, Shield, MessageSquare, Send, Loader2, Search, Activity, Globe, Flame, AlertTriangle, RefreshCw, Bell, CheckCheck, CalendarCheck, Award, Zap, Crown, Languages, Check, CornerDownRight, ChevronUp, ChevronDown, Lock, User, BookOpen } from 'lucide-react';

import AnomalyMap from '@/components/AnomalyMap';
import SurvivalTest from '@/components/SurvivalTest';
import UserBadgesModal from '@/components/UserBadgesModal';

export default function DashboardPage() {
  const [lang, setLang] = useState<Language>('kr');
  const t = translations[lang];

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userNickname, setUserNickname] = useState<string>('');
  
  const [activeBadgeCode, setActiveBadgeCode] = useState<string>('novice');
  const [activeBadgeName, setActiveBadgeName] = useState<string>('신규 요원');
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [savingNickname, setSavingNickname] = useState(false);

  const [userExp, setUserExp] = useState<number>(0);
  const [userLevel, setUserLevel] = useState<number>(5);
  const [isCheckedInToday, setIsCheckedInToday] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [userCommentCount, setUserCommentCount] = useState<number>(0);
  const [userDeathCount, setUserDeathCount] = useState<number>(0);

  const [showFake404, setShowFake404] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<number>(10);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotiDropdown, setShowNotiDropdown] = useState(false);

  const [hideNotices, setHideNotices] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  // 💡 도시 괴담 시리즈 카테고리 포함 탭 상태
  const [activeTab, setActiveTab] = useState<'전체' | '위험 보고서' | '자유 게시판' | '공지사항' | '도시 괴담 시리즈' | '내 기록'>('전체');
  
  const [showSuggestionsToggle, setShowSuggestionsToggle] = useState(false);
  const [dangerFilter, setDangerFilter] = useState<string>('전체');

  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDangerLevel, setEditDangerLevel] = useState('');
  const [editTagsInput, setEditTagsInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [modalTranslateMode, setModalTranslateMode] = useState<'original' | 'kr' | 'en'>('original');
  const [modalTranslatedTitle, setModalTranslatedTitle] = useState('');
  const [modalTranslatedContent, setModalTranslatedContent] = useState('');
  const [modalEnglishTitle, setModalEnglishTitle] = useState('');
  const [modalEnglishContent, setModalEnglishContent] = useState('');
  const [modalTranslating, setModalTranslating] = useState(false);

  const [isListTranslated, setIsListTranslated] = useState(false);
  const [listTranslating, setListTranslating] = useState(false);
  const [translatedMap, setTranslatedMap] = useState<{ [id: string]: { title: string; content: string } }>({});

  const [englishMap, setEnglishMap] = useState<{ [id: string]: { title: string; content: string } }>({});
  const [englishListTranslating, setEnglishListTranslating] = useState(false);

  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const [revealedSet, setRevealedSet] = useState<{ [key: string]: boolean }>({});

  const router = useRouter();

  useEffect(() => {
    const browserLang = navigator.language || navigator.languages[0];
    if (browserLang && !browserLang.toLowerCase().startsWith('ko')) {
      setLang('en');
    }
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (lang === 'en' && reports.length > 0 && Object.keys(englishMap).length === 0) {
      handleTranslateAllToEnglish();
    }
  }, [lang, reports]);

  const handleTranslateAllToEnglish = async () => {
    setEnglishListTranslating(true);
    const newMap: { [id: string]: { title: string; content: string } } = {};

    for (const report of reports) {
      try {
        const resTitle = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(report.title)}`);
        const jsonTitle = await resTitle.json();
        const enTitle = jsonTitle[0].map((item: any) => item[0]).join('');

        const resContent = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(report.content)}`);
        const jsonContent = await resContent.json();
        const enContent = jsonContent[0].map((item: any) => item[0]).join('');

        newMap[report.id] = { title: enTitle, content: enContent };
      } catch (e) {
        newMap[report.id] = { title: report.title, content: report.content };
      }
    }
    setEnglishMap(newMap);
    setEnglishListTranslating(false);
  };

  const fetchInitialData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const nickname = user.user_metadata?.nickname || user.email?.split('@')[0] || '특무 요원';
        setUserNickname(nickname);
        setNewNickname(nickname);

        const isUserAdmin = Boolean(user.user_metadata?.role === 'ADMIN' || nickname === 'ADMIN' || user.email?.startsWith('admin'));
        setIsAdmin(isUserAdmin);

        await fetchUserProfile(user.id, nickname, isUserAdmin);
        await fetchNotifications(user.id);
        await fetchUserBadgeStats(user.id);

        if (isUserAdmin) {
          await fetchSuggestions();
        }
      }
      await fetchReports();
    } catch (err) {
      console.error('Init error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBadgeStats = async (userId: string) => {
    try {
      const { data: commentsData } = await supabase.from('comments').select('id').eq('user_id', userId);
      if (commentsData) setUserCommentCount(commentsData.length);

      const { data: survivalData } = await supabase.from('survival_logs').select('id').eq('user_id', userId).eq('result_type', 'death');
      if (survivalData) setUserDeathCount(survivalData.length);
    } catch (e) {
      console.error('Badge stats fetch error:', e);
    }
  };

  const calculateLevel = (exp: number, admin: boolean) => {
    if (admin) return 1;
    if (exp >= 3000) return 1;
    if (exp >= 1500) return 2;
    if (exp >= 700) return 3;
    if (exp >= 300) return 4;
    return 5;
  };

  const fetchUserProfile = async (userId: string, nickname: string, admin: boolean) => {
    const { data } = await supabase.from('user_profiles').select('*').eq('user_id', userId).single();
    const todayStr = new Date().toISOString().split('T')[0];

    if (data) {
      const level = calculateLevel(data.exp, admin);
      setUserExp(data.exp);
      setUserLevel(level);
      setIsCheckedInToday(data.last_checkin === todayStr);

      if (data.active_badge) {
        setActiveBadgeCode(data.active_badge);
        const badgeMap: any = {
          novice: '신규 요원',
          reporter: '기밀 제보자',
          night_owl: '심야의 관측자',
          debater: '토론의 주파수',
          disaster: '재앙의 경보병',
          survivor: '사망전대 생존자',
          global: '글로벌 관제사',
          veteran: '베테랑 감시관',
          elite: '최정예 요원',
        };
        if (badgeMap[data.active_badge]) {
          setActiveBadgeName(badgeMap[data.active_badge]);
        }
      }
    } else {
      const initialExp = 0;
      const initialLevel = admin ? 1 : 5;
      await supabase.from('user_profiles').insert([
        { user_id: userId, nickname: nickname || '특무 요원', exp: initialExp, clearance_level: initialLevel, active_badge: 'novice' },
      ]);
      setUserExp(initialExp);
      setUserLevel(initialLevel);
    }
  };

  const handleSaveNickname = async () => {
    const trimmed = newNickname.trim();
    if (!trimmed || !currentUserId) return;
    if (trimmed === userNickname) {
      setIsEditingNickname(false);
      return;
    }

    setSavingNickname(true);
    try {
      await supabase.auth.updateUser({ data: { nickname: trimmed } });
      await supabase.from('user_profiles').update({ nickname: trimmed }).eq('user_id', currentUserId);
      setUserNickname(trimmed);
      setIsEditingNickname(false);
      alert('🔒 요원 호칭(닉네임)이 변경되었습니다!');
    } catch (err: any) {
      alert('닉네임 변경 실패: ' + err.message);
    } finally {
      setSavingNickname(false);
    }
  };

  const handleCheckIn = async () => {
    if (!currentUserId || isCheckedInToday) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const addedExp = 20;

    await supabase.rpc('add_user_exp', { target_user_id: currentUserId, exp_to_add: addedExp });
    await supabase.from('user_profiles').update({ last_checkin: todayStr }).eq('user_id', currentUserId);

    setIsCheckedInToday(true);
    await fetchUserProfile(currentUserId, userNickname, isAdmin);
    alert(`🎉 [일일 보안 출석 완료] 경험치 +${addedExp} EXP를 습득하셨습니다!`);
  };

  const fetchNotifications = async (userId: string) => {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (data) setNotifications(data);
  };

  const fetchReports = async () => {
    const { data, error } = await supabase.from('reports').select('*').order('is_notice', { ascending: false }).order('created_at', { ascending: false });
    if (!error && data) setReports(data);
  };

  const fetchSuggestions = async () => {
    const { data, error } = await supabase.from('suggestions').select('*').order('created_at', { ascending: false });
    if (!error && data) setSuggestions(data);
  };

  const renderMaskedText = (text: string, scopeKey: string = '') => {
    if (!text) return '';
    const parts = text.split(/(\(\(.*?\)\))/g);

    return parts.map((part, index) => {
      const match = part.match(/^\(\((.*?)\)\)$/);
      if (match) {
        const innerText = match[1];
        const uniqueKey = `${scopeKey}-${index}-${innerText}`;
        const isRevealedOnMobile = !!revealedSet[uniqueKey];

        return (
          <span
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              setRevealedSet((prev) => ({ ...prev, [uniqueKey]: !prev[uniqueKey] }));
            }}
            className={`px-1.5 py-0.5 rounded transition-all duration-200 cursor-pointer select-none font-bold inline-block mx-0.5 shadow-xs border ${
              isRevealedOnMobile ? 'bg-red-950 text-red-300 border-red-600' : 'bg-neutral-800 text-neutral-800 hover:bg-red-950/80 hover:text-red-300 border-neutral-700/60'
            }`}
          >
            {innerText}
          </span>
        );
      }
      return part;
    });
  };

  const handleOpenDetail = async (report: any) => {
    setSelectedReport(report);
    setEditTitle(report.title);
    setEditContent(report.content);
    setEditLocation(report.location || '');
    setEditDangerLevel(report.danger_level || 'LEVEL 1 (경미)');
    setEditTagsInput(report.tags ? report.tags.join(', ') : '');
    setIsEditing(false);
    setReplyTargetId(null);
    setReplyText('');

    setModalTranslateMode('original');
    setModalTranslatedTitle('');
    setModalTranslatedContent('');
    setModalEnglishTitle('');
    setModalEnglishContent('');

    if (lang === 'en') handleModalTranslate('en');
    await fetchComments(report.id);
  };

  const handleModalTranslate = async (targetMode: 'original' | 'kr' | 'en') => {
    if (!selectedReport) return;
    if (targetMode === 'original') {
      setModalTranslateMode('original');
      return;
    }

    if (targetMode === 'kr') {
      if (!modalTranslatedContent) {
        setModalTranslating(true);
        const [transTitle, transContent] = await Promise.all([
          translateToKorean(selectedReport.title),
          translateToKorean(selectedReport.content),
        ]);
        setModalTranslatedTitle(transTitle);
        setModalTranslatedContent(transContent);
        setModalTranslating(false);
      }
      setModalTranslateMode('kr');
    } else if (targetMode === 'en') {
      if (!modalEnglishContent) {
        setModalTranslating(true);
        try {
          const resTitle = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(selectedReport.title)}`);
          const jsonTitle = await resTitle.json();
          setModalEnglishTitle(jsonTitle[0].map((item: any) => item[0]).join(''));

          const resContent = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(selectedReport.content)}`);
          const jsonContent = await resContent.json();
          setModalEnglishContent(jsonContent[0].map((item: any) => item[0]).join(''));
        } catch (e) {
          setModalEnglishTitle(selectedReport.title);
          setModalEnglishContent(selectedReport.content);
        }
        setModalTranslating(false);
      }
      setModalTranslateMode('en');
    }
  };

  const fetchComments = async (reportId: string) => {
    const { data } = await supabase.from('comments').select('*').eq('report_id', reportId).order('created_at', { ascending: true });
    if (data) setComments(data);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedReport || commentLoading) return;
    setCommentLoading(true);

    const { error } = await supabase.from('comments').insert([
      { report_id: selectedReport.id, user_id: currentUserId, author_nickname: userNickname, content: newComment.trim(), parent_id: null },
    ]);

    if (!error) {
      if (currentUserId) {
        await supabase.rpc('add_user_exp', { target_user_id: currentUserId, exp_to_add: 5 });
        await fetchUserProfile(currentUserId, userNickname, isAdmin);
      }
      setNewComment('');
      await fetchComments(selectedReport.id);
    }
    setCommentLoading(false);
  };

  const handleAddReply = async (parentId: string) => {
    if (!replyText.trim() || !selectedReport || commentLoading) return;
    setCommentLoading(true);

    const { error } = await supabase.from('comments').insert([
      { report_id: selectedReport.id, user_id: currentUserId, author_nickname: userNickname, content: replyText.trim(), parent_id: parentId },
    ]);

    if (!error) {
      setReplyText('');
      setReplyTargetId(null);
      await fetchComments(selectedReport.id);
    }
    setCommentLoading(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (!error) await fetchComments(selectedReport.id);
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('이 문서를 파기하시겠습니까?')) return;
    setActionLoading(true);
    const { error } = await supabase.from('reports').delete().eq('id', reportId);
    if (!error) {
      setSelectedReport(null);
      fetchReports();
    }
    setActionLoading(false);
  };

  const handleUpdate = async () => {
    if (!selectedReport) return;
    setActionLoading(true);
    const tags = editTagsInput.split(',').map((tag) => tag.trim().replace(/^#/, '')).filter((tag) => tag.length > 0);

    const { error } = await supabase.from('reports').update({
      title: editTitle.trim(),
      content: editContent.trim(),
      location: editLocation.trim(),
      danger_level: editDangerLevel,
      tags: tags,
    }).eq('id', selectedReport.id);

    if (!error) {
      setIsEditing(false);
      setSelectedReport(null);
      fetchReports();
    }
    setActionLoading(false);
  };

  const unreadNotiCount = notifications.filter((n) => !n.is_read).length;
  const userReportCount = reports.filter((r) => r.user_id === currentUserId).length;

  // 💡 카테고리 필터 로직 (도시 괴담 시리즈 포함)
  const filteredReports = reports.filter((report) => {
    if (activeTab === '내 기록') {
      if (report.user_id !== currentUserId) return false;
    } else {
      if (hideNotices && report.is_notice && activeTab !== '공지사항') return false;
      if (activeTab === '공지사항' && !report.is_notice) return false;
      if (activeTab === '위험 보고서' && (report.category !== '위험 보고서' || report.is_notice)) return false;
      if (activeTab === '자유 게시판' && (report.category !== '자유 게시판' || report.is_notice)) return false;
      if (activeTab === '도시 괴담 시리즈') {
        const isCityHorror = report.category === '도시 괴담 시리즈' || report.title?.includes('대한민국 도시 괴담') || report.tags?.includes('도시괴담');
        if (!isCityHorror) return false;
      }
    }

    if (dangerFilter !== '전체' && activeTab !== '공지사항' && activeTab !== '내 기록') {
      if (!report.danger_level || !report.danger_level.startsWith(dangerFilter)) return false;
    }

    if (selectedTag) {
      if (!report.tags || !report.tags.includes(selectedTag)) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = report.title?.toLowerCase().includes(q);
      const contentMatch = report.content?.toLowerCase().includes(q);
      if (!titleMatch && !contentMatch) return false;
    }

    return true;
  });

  const rootComments = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

  let currentModalTitle = selectedReport?.title || '';
  let currentModalContent = selectedReport?.content || '';
  if (lang === 'en' && englishMap[selectedReport?.id]) {
    currentModalTitle = englishMap[selectedReport.id].title;
    currentModalContent = englishMap[selectedReport.id].content;
  } else if (modalTranslateMode === 'kr') {
    currentModalTitle = modalTranslatedTitle;
    currentModalContent = modalTranslatedContent;
  } else if (modalTranslateMode === 'en') {
    currentModalTitle = modalEnglishTitle;
    currentModalContent = modalEnglishContent;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-mono flex flex-col md:flex-row overflow-x-hidden">
      
      {/* 사이드바 메뉴 */}
      <aside className="w-full md:w-64 bg-neutral-900/90 border-r border-neutral-800 p-5 flex flex-col justify-between shrink-0 space-y-6">
        <div className="space-y-6">
          <div 
            onClick={() => { setActiveTab('전체'); setShowSuggestionsToggle(false); setSelectedTag(null); setSearchQuery(''); }}
            className="flex items-center justify-between pb-4 border-b border-neutral-800 cursor-pointer group"
          >
            <div className="flex items-center space-x-3">
              <ShieldAlert className="w-7 h-7 text-red-600 animate-pulse shrink-0" />
              <div>
                <h1 className="text-sm font-extrabold text-red-600 tracking-wider">SPECIAL OPS</h1>
                <span className="text-[10px] text-neutral-500">Classified Dashboard</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setLang(lang === 'kr' ? 'en' : 'kr')}
              className="w-full bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs py-2 px-3 rounded flex items-center justify-between cursor-pointer font-bold text-neutral-300"
            >
              <span className="flex items-center space-x-2">
                <Globe className="w-3.5 h-3.5 text-red-500" />
                <span>LANGUAGE</span>
              </span>
              <span className="text-red-400 font-bold">{lang === 'kr' ? '한국어 (KR)' : 'ENGLISH (EN)'}</span>
            </button>

            {userNickname && (
              <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded text-xs space-y-2">
                <div className="flex justify-between items-center text-[10px] text-neutral-500">
                  <span>Access Clearance</span>
                  <span className={`font-bold ${isAdmin ? 'text-yellow-400' : 'text-red-400'}`}>
                    {isAdmin ? '👑 최고 관리자' : `보안 ${userLevel}급 요원`}
                  </span>
                </div>
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center space-x-1.5">
                    <span 
                      onClick={() => setShowBadgesModal(true)}
                      className="text-red-400 cursor-pointer hover:underline"
                      title="뱃지 변경"
                    >
                      [{activeBadgeName}]
                    </span>
                    {isEditingNickname ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="text"
                          value={newNickname}
                          onChange={(e) => setNewNickname(e.target.value)}
                          className="bg-neutral-900 border border-red-800 rounded px-1.5 py-0.5 text-xs text-white w-24 focus:outline-none"
                          maxLength={15}
                        />
                        <button onClick={handleSaveNickname} disabled={savingNickname} className="text-green-400 hover:text-green-300">
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setIsEditingNickname(false)} className="text-neutral-500 hover:text-white">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <span className="text-white">{userNickname}</span>
                        <button onClick={() => { setNewNickname(userNickname); setIsEditingNickname(true); }} className="text-neutral-500 hover:text-red-400">
                          <Edit className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-400">{userExp} EXP</span>
                </div>
                <button
                  onClick={handleCheckIn}
                  disabled={isCheckedInToday}
                  className={`w-full text-xs py-1.5 rounded font-bold border flex items-center justify-center space-x-1 ${
                    isCheckedInToday ? 'bg-neutral-900 border-neutral-800 text-neutral-500' : 'bg-red-950 hover:bg-red-900 border-red-800 text-red-300 animate-pulse cursor-pointer'
                  }`}
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>{isCheckedInToday ? '오늘 출석 완료' : '📅 일일 출석 체크 (+20 EXP)'}</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => router.push('/new-report')}
            className="w-full bg-red-900 hover:bg-red-800 text-white text-xs py-3 rounded font-bold border border-red-700 flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-red-950/50"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newDocument}</span>
          </button>

          {/* 카테고리 네비게이션 */}
          <nav className="space-y-1">
            <div className="text-[10px] text-neutral-500 px-2 py-1 font-bold">CATEGORIES</div>
            {[
              { id: '전체', name: t.all, icon: Activity },
              { id: '공지사항', name: t.notice, icon: Megaphone },
              { id: '위험 보고서', name: t.report, icon: AlertCircle },
              { id: '자유 게시판', name: t.freeBoard, icon: Radio },
              { id: '도시 괴담 시리즈', name: '🌆 도시 괴담 시리즈', icon: BookOpen },
              { id: '내 기록', name: `내 기록 (${userReportCount}건)`, icon: User },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id && !showSuggestionsToggle;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setShowSuggestionsToggle(false); }}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-bold transition-all cursor-pointer ${
                    isSelected ? 'bg-red-950/80 border border-red-800/80 text-white' : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 text-red-500" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <button
          onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
          className="w-full bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 text-xs py-2.5 rounded flex items-center justify-center space-x-2 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t.logout}</span>
        </button>
      </aside>

      {/* 메인 피드 영역 */}
      <main className="flex-1 p-6 space-y-6 max-w-5xl mx-auto w-full">
        
        {/* 상단 검색 및 필터 */}
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
          </div>
        </div>

        {/* 보고서 목록 */}
        <div className="space-y-4">
          {filteredReports.length === 0 ? (
            <div className="text-center text-xs text-neutral-600 py-16 border border-dashed border-neutral-800 rounded space-y-2">
              <FileText className="w-8 h-8 text-neutral-700 mx-auto" />
              <p>해당 카테고리에 등록된 기밀 문서가 없습니다.</p>
            </div>
          ) : (
            filteredReports.map((report) => {
              const displayTitle = lang === 'en' && englishMap[report.id] ? englishMap[report.id].title : report.title;
              const displayContent = lang === 'en' && englishMap[report.id] ? englishMap[report.id].content : report.content;

              return (
                <div
                  key={report.id}
                  onClick={() => handleOpenDetail(report)}
                  className={`border p-5 rounded-lg space-y-3 cursor-pointer transition-all ${
                    report.is_notice ? 'bg-red-950/20 border-red-900/60 hover:border-red-600' : 'bg-neutral-900/80 border-neutral-800 hover:border-red-900/80'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                    <div className="flex items-center space-x-2">
                      {report.is_notice ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-900 text-white font-bold border border-red-700 animate-pulse">공지사항</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-950 text-red-400 font-bold border border-red-900">
                          {report.category || '도시 괴담 시리즈'}
                        </span>
                      )}
                      <h3 className="text-base font-bold text-neutral-100">{displayTitle}</h3>
                    </div>
                    {report.danger_level && (
                      <span className="bg-red-950/85 border border-red-900 text-red-400 text-[11px] px-2.5 py-1 rounded">
                        {report.danger_level}
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed line-clamp-2 text-neutral-400">
                    {renderMaskedText(displayContent, `content-${report.id}`)}
                  </p>
                  <div className="text-[10px] text-neutral-500 border-t border-neutral-800/60 pt-2 flex justify-between">
                    <span>작성자: <strong className="text-neutral-400">{report.author_nickname || 'Agent'}</strong></span>
                    <span>{new Date(report.created_at).toLocaleString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* 상세 보기 모달 (댓글 및 번역 포함) */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-red-500 font-bold">기밀 문서 상세</span>
                <div className="flex items-center space-x-1 ml-4 bg-neutral-950 p-1 rounded border border-neutral-800 text-[10px]">
                  <button
                    onClick={() => handleModalTranslate('original')}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer ${modalTranslateMode === 'original' ? 'bg-red-900 text-white' : 'text-neutral-400 hover:text-white'}`}
                  >
                    ORIGINAL
                  </button>
                  <button
                    onClick={() => handleModalTranslate('kr')}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer ${modalTranslateMode === 'kr' ? 'bg-red-900 text-white' : 'text-neutral-400 hover:text-white'}`}
                  >
                    🇰🇷 KR
                  </button>
                  <button
                    onClick={() => handleModalTranslate('en')}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer ${modalTranslateMode === 'en' ? 'bg-red-900 text-white' : 'text-neutral-400 hover:text-white'}`}
                  >
                    🇺🇸 EN
                  </button>
                </div>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            {modalTranslating ? (
              <div className="py-12 text-center text-xs text-neutral-500 flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                <span>데이터 번역 중...</span>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-neutral-100">{currentModalTitle}</h2>
                <div className="bg-neutral-950 p-4 rounded border border-neutral-800 text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">
                  {renderMaskedText(currentModalContent, `modal-${selectedReport.id}`)}
                </div>

                {/* 댓글 영역 */}
                <div className="border-t border-neutral-800 pt-4 space-y-4">
                  <h3 className="text-xs font-bold text-neutral-400 flex items-center space-x-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-red-500" />
                    <span>요원들의 무전 토론 (댓글 {comments.length})</span>
                  </h3>

                  <form onSubmit={handleAddComment} className="flex space-x-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="의견이나 현장 첩보를 남기십시오..."
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-red-900"
                    />
                    <button type="submit" disabled={commentLoading} className="bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded text-xs font-bold cursor-pointer">
                      전송
                    </button>
                  </form>

                  <div className="space-y-3 pt-2">
                    {rootComments.map((comment) => (
                      <div key={comment.id} className="bg-neutral-950 border border-neutral-800/80 p-3 rounded text-xs space-y-1.5">
                        <div className="flex justify-between text-[10px] text-neutral-500">
                          <span className="font-bold text-neutral-400">{comment.author_nickname}</span>
                          <div className="flex items-center space-x-2">
                            <span>{new Date(comment.created_at).toLocaleString()}</span>
                            {(comment.user_id === currentUserId || isAdmin) && (
                              <button onClick={() => handleDeleteComment(comment.id)} className="text-red-500 hover:text-red-400">삭제</button>
                            )}
                          </div>
                        </div>
                        <p className="text-neutral-300">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 뱃지 모달 (isOpen 제거 및 올바른 속성 매핑) */}
      {showBadgesModal && (
        <UserBadgesModal
          onClose={() => setShowBadgesModal(false)}
          currentUserId={currentUserId}
          activeBadgeCode={activeBadgeCode}
          userCommentCount={userCommentCount}
          userDeathCount={userDeathCount}
          userReportCount={userReportCount}
          userExp={userExp}
          onBadgeChanged={() => {
            if (currentUserId) fetchUserProfile(currentUserId, userNickname, isAdmin);
          }}
        />
      )}
    </div>
  );
}