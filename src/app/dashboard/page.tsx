'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { translations, Language } from '@/lib/i18n';
import { translateToKorean } from '@/lib/translate';
import { ShieldAlert, Plus, LogOut, MapPin, AlertCircle, FileText, Trash2, Edit, X, Save, UserCheck, Filter, Radio, Megaphone, Shield, MessageSquare, Send, Loader2, Search, Activity, Globe, Flame, AlertTriangle, RefreshCw, Bell, CheckCheck, CalendarCheck, Award, Zap, Crown, Languages, Check, CornerDownRight, ChevronUp, ChevronDown, Lock, User } from 'lucide-react';

import AnomalyMap from '@/components/AnomalyMap';
import SurvivalTest from '@/components/SurvivalTest';
import UserBadgesModal from '@/components/UserBadgesModal';

const getKSTDateString = () => {
  const now = new Date();
  const utcNow = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  const kstTime = new Date(utcNow + (9 * 60 * 60 * 1000));
  const year = kstTime.getFullYear();
  const month = String(kstTime.getMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  const [isCheckingIn, setIsCheckingIn] = useState(false);

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
  const [activeTab, setActiveTab] = useState<'전체' | '위험 보고서' | '자유 게시판' | '공지사항' | '내 기록'>('전체');
  
  const [showSuggestionsToggle, setShowSuggestionsToggle] = useState(false);
  const [dangerFilter, setDangerFilter] = useState<string>('전체');

  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<any | null>(null);
  const [sugComments, setSugComments] = useState<any[]>([]);
  const [newSugComment, setNewSugComment] = useState('');
  const [sugCommentLoading, setSugCommentLoading] = useState(false);

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
      }
      await fetchReports();
      await fetchSuggestions(); // 💡 모든 요원이 건의사항을 볼 수 있도록 초기 로딩 포함
    } catch (err) {
      console.error('Init error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBadgeStats = async (userId: string) => {
    try {
      const { data: commentsData } = await supabase
        .from('comments')
        .select('id')
        .eq('user_id', userId);

      if (commentsData) setUserCommentCount(commentsData.length);

      const { data: survivalData } = await supabase
        .from('survival_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('result_type', 'death');

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
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const todayStr = getKSTDateString();

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

      if (level !== data.clearance_level && !admin) {
        await supabase.from('user_profiles').update({ clearance_level: level }).eq('user_id', userId);
      }
    } else {
      const initialExp = 0;
      const initialLevel = admin ? 1 : 5;
      await supabase.from('user_profiles').insert([
        {
          user_id: userId,
          nickname: nickname || '특무 요원',
          exp: initialExp,
          clearance_level: initialLevel,
          active_badge: 'novice',
        },
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

    const upperNick = trimmed.toUpperCase();
    const forbiddenKeywords = ['ADMIN', '관리자', '사령관', '최고관리자', '특무사령관'];
    const isForbidden = forbiddenKeywords.some((keyword) => upperNick.includes(keyword.toUpperCase()));

    if (isForbidden && !isAdmin) {
      alert('🚫 [보안 경고] "ADMIN" 및 최고 관리자 관련 호칭은 일반 요원이 사용할 수 없습니다.');
      return;
    }

    setSavingNickname(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({ data: { nickname: trimmed } });
      if (authError) throw authError;

      const { error: profileError } = await supabase.from('user_profiles').update({ nickname: trimmed }).eq('user_id', currentUserId);
      if (profileError) throw profileError;

      setUserNickname(trimmed);
      setIsEditingNickname(false);
      alert('🔒 요원 호칭(닉네임)이 성공적으로 변경되었습니다!');
    } catch (err: any) {
      alert('닉네임 변경 실패: ' + err.message);
    } finally {
      setSavingNickname(false);
    }
  };

  const handleCheckIn = async () => {
    if (!currentUserId || isCheckedInToday || isCheckingIn) return;
    setIsCheckingIn(true);

    try {
      const todayStr = getKSTDateString();
      const addedExp = 20;

      const { data: profileCheck } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', currentUserId)
        .single();

      if (profileCheck && profileCheck.last_checkin === todayStr) {
        setIsCheckedInToday(true);
        alert('🚫 이미 오늘 출석을 완료하셨습니다.');
        return;
      }

      if (!profileCheck) {
        await supabase.from('user_profiles').insert([
          {
            user_id: currentUserId,
            nickname: userNickname || '특무 요원',
            exp: 0,
            clearance_level: isAdmin ? 1 : 5,
          },
        ]);
      } else if (!profileCheck.nickname) {
        await supabase.from('user_profiles').update({ nickname: userNickname || '특무 요원' }).eq('user_id', currentUserId);
      }

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ last_checkin: todayStr })
        .eq('user_id', currentUserId);

      if (updateError) {
        throw new Error('출석 기록 업데이트 통신에 실패했습니다.');
      }

      const { error: rpcError } = await supabase.rpc('add_user_exp', {
        target_user_id: currentUserId,
        exp_to_add: addedExp,
      });

      if (rpcError) {
        throw new Error('경험치 추가 통신에 실패했습니다.');
      }

      setIsCheckedInToday(true);
      await fetchUserProfile(currentUserId, userNickname, isAdmin);
      alert(`🎉 [일일 보안 출석 완료] 경험치 +${addedExp} EXP를 습득하셨습니다!`);

    } catch (err: any) {
      alert(`❌ [오류 발생] ${err.message}`);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const fetchNotifications = async (userId: string) => {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (data) setNotifications(data);
  };

  const fetchReports = async () => {
    const { data, error } = await supabase.from('reports').select('*').order('is_notice', { ascending: false }).order('created_at', { ascending: false });

    if (!error && data) {
      setReports(data);
      const hazardReportsCount = data.filter((r) => (r.category === '위험 보고서' || !r.category) && !r.is_notice).length;
      const validMilestones = [10, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500];

      if (validMilestones.includes(hazardReportsCount)) {
        const milestoneKey = `anomaly_404_shown_${hazardReportsCount}`;
        if (!sessionStorage.getItem(milestoneKey)) {
          setCurrentMilestone(hazardReportsCount);
          setShowFake404(true);
          sessionStorage.setItem(milestoneKey, 'true');

          setTimeout(() => {
            setIsRestoring(true);
            setTimeout(() => {
              setShowFake404(false);
              setIsRestoring(false);
            }, 1200);
          }, 3500);
        }
      }
    }
  };

  const fetchSuggestions = async () => {
    const { data, error } = await supabase.from('suggestions').select('*').order('created_at', { ascending: false });
    if (!error && data) setSuggestions(data);
  };

  const fetchSuggestionComments = async (suggestionId: string) => {
    const { data } = await supabase.from('suggestion_comments').select('*').eq('suggestion_id', suggestionId).order('created_at', { ascending: true });
    if (data) setSugComments(data);
  };

  const handleOpenSuggestionDetail = async (sug: any) => {
    setSelectedSuggestion(sug);
    await fetchSuggestionComments(sug.id);
  };

  const handleAddSuggestionComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('🚫 건의사항 답변은 최고 관리자(ADMIN)만 작성할 수 있습니다.');
      return;
    }
    if (!newSugComment.trim() || !selectedSuggestion || sugCommentLoading) return;
    setSugCommentLoading(true);

    const { error } = await supabase.from('suggestion_comments').insert([
      {
        suggestion_id: selectedSuggestion.id,
        user_id: currentUserId,
        author_nickname: userNickname || '👑 최고 관리자',
        content: newSugComment.trim(),
      },
    ]);

    if (!error) {
      setNewSugComment('');
      await fetchSuggestionComments(selectedSuggestion.id);
    } else {
      alert('답변 등록 실패: ' + error.message);
    }
    setSugCommentLoading(false);
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
            title="🔒 [사령부 기밀] 마우스 호버 또는 터치 시 단어 해독"
            className={`px-1.5 py-0.5 rounded transition-all duration-200 cursor-pointer select-none font-bold inline-block mx-0.5 shadow-xs border ${
              isRevealedOnMobile
                ? 'bg-red-950 text-red-300 border-red-600'
                : 'bg-neutral-800 text-neutral-800 hover:bg-red-950/80 hover:text-red-300 border-neutral-700/60 hover:border-red-600/80'
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

    if (lang === 'en') {
      handleModalTranslate('en');
    }

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
          const enTitle = jsonTitle[0].map((item: any) => item[0]).join('');

          const resContent = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(selectedReport.content)}`);
          const jsonContent = await resContent.json();
          const enContent = jsonContent[0].map((item: any) => item[0]).join('');

          setModalEnglishTitle(enTitle);
          setModalEnglishContent(enContent);
        } catch (e) {
          setModalEnglishTitle(selectedReport.title);
          setModalEnglishContent(selectedReport.content);
        }
        setModalTranslating(false);
      }
      setModalTranslateMode('en');
    }
  };

  const handleToggleListTranslate = async () => {
    if (!isListTranslated) {
      if (Object.keys(translatedMap).length === 0) {
        setListTranslating(true);
        const newMap: { [id: string]: { title: string; content: string } } = {};

        for (const report of filteredReports) {
          const [transTitle, transContent] = await Promise.all([
            translateToKorean(report.title),
            translateToKorean(report.content),
          ]);
          newMap[report.id] = { title: transTitle, content: transContent };
        }
        setTranslatedMap(newMap);
        setListTranslating(false);
      }
      setIsListTranslated(true);
    } else {
      setIsListTranslated(false);
    }
  };

  const fetchComments = async (reportId: string) => {
    const { data, error } = await supabase.from('comments').select('*').eq('report_id', reportId).order('created_at', { ascending: true });
    if (!error && data) setComments(data);
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
        parent_id: null,
      },
    ]);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      if (currentUserId) {
        await supabase.rpc('add_user_exp', { target_user_id: currentUserId, exp_to_add: 5 });
        await fetchUserProfile(currentUserId, userNickname, isAdmin);
        await fetchUserBadgeStats(currentUserId);
      }
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

  const handleAddReply = async (parentId: string) => {
    if (!replyText.trim() || !selectedReport || commentLoading) return;
    setCommentLoading(true);

    const { error } = await supabase.from('comments').insert([
      {
        report_id: selectedReport.id,
        user_id: currentUserId,
        author_nickname: userNickname,
        content: replyText.trim(),
        parent_id: parentId,
      },
    ]);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      if (currentUserId) {
        await fetchUserBadgeStats(currentUserId);
      }
      setReplyText('');
      setReplyTargetId(null);
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
    if (!error) {
      if (currentUserId) await fetchUserBadgeStats(currentUserId);
      await fetchComments(selectedReport.id);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Purge this document?')) return;
    setActionLoading(true);
    const { error } = await supabase.from('reports').delete().eq('id', reportId);
    if (!error) {
      alert('Document purged.');
      setSelectedReport(null);
      fetchReports();
    }
    setActionLoading(false);
  };

  const handleDeleteSuggestion = async (sugId: string) => {
    if (!confirm('해당 건의사항을 파기하시겠습니까?')) return;
    const { error } = await supabase.from('suggestions').delete().eq('id', sugId);
    if (!error) {
      setSelectedSuggestion(null);
      fetchSuggestions();
    }
  };

  const handleUpdate = async () => {
    if (!selectedReport) return;
    setActionLoading(true);

    const tags = editTagsInput.split(',').map((tag) => tag.trim().replace(/^#/, '')).filter((tag) => tag.length > 0);

    const { error } = await supabase
      .from('reports')
      .update({
        title: editTitle.trim(),
        content: editContent.trim(),
        location: editLocation.trim(),
        danger_level: editDangerLevel,
        tags: tags,
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
    if (exp >= 3000) return 3000;
    if (exp >= 1500) return 3000;
    if (exp >= 700) return 1500;
    if (exp >= 300) return 700;
    return 300;
  };
  const targetExp = getNextExpTarget(userExp);
  const expProgressPercent = Math.min(Math.round((userExp / targetExp) * 100), 100);

  const hazardReportsCount = reports.filter((r) => (r.category === '위험 보고서' || !r.category) && !r.is_notice).length;
  const freeBoardCount = reports.filter((r) => r.category === '자유 게시판' && !r.is_notice).length;
  const highDangerCount = reports.filter((r) => r.danger_level?.includes('LEVEL 4') || r.danger_level?.includes('LEVEL 5')).length;
  const noticeCount = reports.filter((r) => r.is_notice).length;

  const userReportCount = reports.filter((r) => r.user_id === currentUserId).length;

  const filteredReports = reports.filter((report) => {
    if (activeTab === '내 기록') {
      if (report.user_id !== currentUserId) return false;
    } else {
      if (hideNotices && report.is_notice && activeTab !== '공지사항') return false;
      if (activeTab === '공지사항' && !report.is_notice) return false;
      if (activeTab === '위험 보고서' && (report.category !== '위험 보고서' || report.is_notice)) return false;
      if (activeTab === '자유 게시판' && (report.category !== '자유 게시판' || report.is_notice)) return false;
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
      const locationMatch = report.location?.toLowerCase().includes(q);
      if (!titleMatch && !contentMatch && !locationMatch) return false;
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
      
      {showFake404 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6 text-center animate-fade-in">
          <div className="max-w-lg space-y-6 border border-red-900/80 bg-red-950/20 p-8 rounded-lg shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse" />
            <div className="flex justify-center"><AlertTriangle className="w-16 h-16 text-red-600 animate-bounce" /></div>
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold text-red-600 tracking-widest font-mono">404 NOT FOUND</h1>
              <p className="text-xs text-red-400 font-bold tracking-wider">[CRITICAL] SIGNAL INTERFERENCE DETECTED</p>
            </div>
          </div>
        </div>
      )}

      {showBadgesModal && (
        <UserBadgesModal
          userId={currentUserId}
          userExp={userExp}
          reportCount={userReportCount}
          commentCount={userCommentCount}
          deathCount={userDeathCount}
          activeBadge={activeBadgeCode}
          onClose={() => setShowBadgesModal(false)}
          onBadgeChange={(code, name) => {
            setActiveBadgeCode(code);
            setActiveBadgeName(name);
          }}
        />
      )}

      <aside className="w-full md:w-64 bg-neutral-900/90 border-r border-neutral-800 p-5 flex flex-col justify-between shrink-0 space-y-6">
        <div className="space-y-6">
          <div 
            onClick={() => {
              setActiveTab('전체');
              setShowSuggestionsToggle(false);
              setSelectedTag(null);
              setSearchQuery('');
            }}
            className="flex items-center justify-between pb-4 border-b border-neutral-800 cursor-pointer group"
          >
            <div className="flex items-center space-x-3">
              <ShieldAlert className="w-7 h-7 text-red-600 animate-pulse shrink-0 group-hover:scale-105 transition-transform" />
              <div>
                <h1 className="text-sm font-extrabold text-red-600 tracking-wider group-hover:text-red-500 transition-colors">SPECIAL OPS</h1>
                <span className="text-[10px] text-neutral-500">Classified Dashboard</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowNotiDropdown(!showNotiDropdown);
              }}
              className="relative p-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded text-neutral-300 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4 text-neutral-400" />
              {unreadNotiCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                  {unreadNotiCount}
                </span>
              )}
            </button>
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

                <div className="border-b border-neutral-900 pb-2 space-y-1">
                  {isEditingNickname ? (
                    <div className="flex items-center space-x-1.5 pt-1">
                      <input
                        type="text"
                        value={newNickname}
                        onChange={(e) => setNewNickname(e.target.value)}
                        placeholder="새 요원 호칭 입력"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-red-600"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveNickname}
                        disabled={savingNickname}
                        className="bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 p-1.5 rounded cursor-pointer shrink-0"
                      >
                        {savingNickname ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingNickname(false);
                          setNewNickname(userNickname);
                        }}
                        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-400 p-1.5 rounded cursor-pointer shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between font-bold">
                      <div 
                        onClick={() => {
                          setActiveTab('내 기록');
                          setShowSuggestionsToggle(false);
                        }}
                        className="flex items-center space-x-1.5 cursor-pointer group"
                        title="클릭 시 내가 작성한 기밀 문서 모아보기"
                      >
                        {isAdmin ? <Crown className="w-4 h-4 text-yellow-500" /> : <UserCheck className="w-3.5 h-3.5 text-red-500" />}
                        <span className={isAdmin ? 'text-yellow-400 font-extrabold group-hover:underline' : 'text-neutral-200 group-hover:text-red-400 transition-colors'}>
                          <span className="text-red-400 font-extrabold mr-1">[{activeBadgeName}]</span> {userNickname}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-red-400 flex items-center space-x-0.5">
                          <Zap className="w-3 h-3" />
                          <span>{userExp} EXP</span>
                        </span>
                        <button
                          onClick={() => setIsEditingNickname(true)}
                          title="닉네임 변경"
                          className="text-neutral-500 hover:text-red-400 cursor-pointer transition-colors p-0.5"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    fetchUserBadgeStats(currentUserId || '');
                    setShowBadgesModal(true);
                  }}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-[11px] py-1.5 rounded font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
                >
                  <Award className="w-3.5 h-3.5 text-red-500" />
                  <span>🎖️ 내 수훈 훈장 및 칭호 관리</span>
                </button>

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
                  disabled={isCheckedInToday || isCheckingIn}
                  className={`w-full text-xs py-2 rounded font-bold border flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    isCheckedInToday || isCheckingIn
                      ? 'bg-neutral-900 border-neutral-800 text-neutral-500 cursor-not-allowed'
                      : 'bg-red-950 hover:bg-red-900 border-red-800 text-red-300 animate-pulse'
                  }`}
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>
                    {isCheckingIn 
                      ? '통신 중...' 
                      : isCheckedInToday 
                        ? '오늘 출석 완료 (+20 EXP)' 
                        : '📅 일일 출석 체크 (+20 EXP)'}
                  </span>
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
              { id: '내 기록', name: `내 기록 (${userReportCount}건)`, icon: User },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id && !showSuggestionsToggle;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setShowSuggestionsToggle(false);
                    if (tab.id === '공지사항') setHideNotices(false);
                  }}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-950/80 border border-red-800/80 text-white'
                      : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 text-red-500" />
                  <span>{tab.name}</span>
                </button>
              );
            })}

            {/* 💡 [개편] 모든 요원이 건의사항 함에 접근할 수 있도록 전체 공개 전환 */}
            <button
              onClick={() => setShowSuggestionsToggle(!showSuggestionsToggle)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-bold transition-all cursor-pointer border ${
                showSuggestionsToggle
                  ? 'bg-purple-950 border-purple-700 text-purple-200 shadow-md shadow-purple-950/50'
                  : 'bg-neutral-950 border-neutral-800 text-purple-400 hover:bg-purple-950/40'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Lock className="w-4 h-4 text-purple-400 animate-pulse" />
                <span>건의사항 함 (전체 공개)</span>
              </div>
              <span className="bg-purple-900/80 text-purple-200 text-[10px] px-1.5 py-0.2 rounded-full">
                {suggestions.length}
              </span>
            </button>
          </nav>

          {activeTab !== '자유 게시판' && activeTab !== '공지사항' && activeTab !== '내 기록' && !showSuggestionsToggle && (
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

      {showNotiDropdown && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-20 sm:pt-24 p-4">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl p-4 space-y-3 relative">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-red-500" />
                <span className="text-xs font-bold text-neutral-200">현장 신호 알림</span>
              </div>
              <div className="flex items-center space-x-2">
                {unreadNotiCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-red-400 hover:text-red-300 flex items-center space-x-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>모두 읽음</span>
                  </button>
                )}
                <button
                  onClick={() => setShowNotiDropdown(false)}
                  className="text-neutral-500 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {notifications.length === 0 ? (
                <div className="text-[11px] text-neutral-600 text-center py-6">수신된 신호 알림이 없습니다.</div>
              ) : (
                notifications.map((noti) => (
                  <div
                    key={noti.id}
                    onClick={() => handleNotificationClick(noti)}
                    className={`p-3 rounded border text-xs cursor-pointer transition-colors space-y-1 ${
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
        </div>
      )}

      <main className="flex-1 p-6 space-y-6 max-w-5xl mx-auto w-full">
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-neutral-900/60 border border-neutral-800 p-3.5 rounded-lg flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <div className="text-[10px] text-neutral-500">위험 보고서</div>
              <div className="text-base font-bold text-neutral-100">{hazardReportsCount}건</div>
            </div>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 p-3.5 rounded-lg flex items-center space-x-3">
            <Radio className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <div className="text-[10px] text-neutral-500">자유 게시판</div>
              <div className="text-base font-bold text-neutral-100">{freeBoardCount}건</div>
            </div>
          </div>

          <div className="bg-red-950/40 border border-red-900/60 p-3.5 rounded-lg flex items-center space-x-3">
            <Flame className="w-5 h-5 text-red-500 animate-pulse shrink-0" />
            <div>
              <div className="text-[10px] text-red-400">{t.highDanger}</div>
              <div className="text-base font-bold text-red-300">{highDangerCount}건 발령 중</div>
            </div>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 p-3.5 rounded-lg flex items-center space-x-3">
            <Megaphone className="w-5 h-5 text-yellow-500 shrink-0" />
            <div>
              <div className="text-[10px] text-neutral-500">{t.activeNotices}</div>
              <div className="text-base font-bold text-yellow-400">{noticeCount}건 활성</div>
            </div>
          </div>
        </div>

        {!showSuggestionsToggle && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <AnomalyMap reports={reports} onSelectReport={handleOpenDetail} />
            </div>
            <div className="space-y-4">
              <SurvivalTest userId={currentUserId} onExpGained={() => { if (currentUserId) fetchUserProfile(currentUserId, userNickname, isAdmin); }} />
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-neutral-900/80 border border-neutral-800 p-3.5 rounded-lg gap-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-neutral-300">
            <Languages className="w-4 h-4 text-red-500" />
            <span>실시간 외국어 게시글 다국어 번역 시스템</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {noticeCount > 0 && activeTab !== '공지사항' && activeTab !== '내 기록' && !showSuggestionsToggle && (
              <button
                onClick={() => setHideNotices(!hideNotices)}
                className="text-xs bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-bold px-3 py-1.5 rounded transition-all cursor-pointer flex items-center justify-center space-x-1"
              >
                {hideNotices ? (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-yellow-500" />
                    <span>📢 공지 펼치기 ({noticeCount})</span>
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 text-neutral-500" />
                    <span>📢 공지 숨기기</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleToggleListTranslate}
              disabled={listTranslating}
              className="text-xs bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 font-bold px-3 py-1.5 rounded transition-all cursor-pointer flex items-center justify-center space-x-1.5"
            >
              {listTranslating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                  <span>목록 실시간 번역 중...</span>
                </>
              ) : (
                <span>{isListTranslated ? '↩️ 원문 목록 보기' : '🇰🇷 목록 전체 한국어 번역'}</span>
              )}
            </button>
          </div>
        </div>

        {!showSuggestionsToggle && (
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
        )}

        {/* 💡 [개편] 전체 요원이 볼 수 있는 건의사항 제보함 목록 */}
        {showSuggestionsToggle ? (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-purple-950/30 border border-purple-900/60 p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Lock className="w-6 h-6 text-purple-400 shrink-0" />
                <div>
                  <h2 className="text-sm font-bold text-purple-300">건의사항 및 사령부 제보 게시판 (전체 공개)</h2>
                  <p className="text-[11px] text-neutral-400">요원들이 보낸 건의 내역 ({suggestions.length}건) - 👑 최고 관리자만 답변 가능</p>
                </div>
              </div>
              <button
                onClick={() => setShowSuggestionsToggle(false)}
                className="bg-neutral-800 hover:bg-neutral-700 text-xs px-3 py-1.5 rounded text-neutral-300 cursor-pointer"
              >
                닫기 ✕
              </button>
            </div>

            {suggestions.length === 0 ? (
              <div className="text-center text-xs text-neutral-600 py-16 border border-dashed border-neutral-800 rounded">
                접수된 건의사항이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((sug) => (
                  <div
                    key={sug.id}
                    onClick={() => handleOpenSuggestionDetail(sug)}
                    className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg space-y-2 cursor-pointer hover:border-purple-900 transition-all"
                  >
                    <div className="flex justify-between items-center text-xs border-b border-neutral-800 pb-2">
                      <span className="font-bold text-purple-400">{sug.title}</span>
                      <span className="text-[10px] text-neutral-500">{new Date(sug.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-neutral-300 line-clamp-2">{sug.content}</p>
                    <div className="text-[10px] text-neutral-500 flex justify-between items-center">
                      <span>제보자: {sug.author_nickname} 요원</span>
                      <span className="text-purple-400 hover:underline">상세 및 사령부 답변 보기 &gt;</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {loading ? (
              <div className="text-center text-xs text-neutral-500 py-16">Loading Classified Database...</div>
            ) : englishListTranslating ? (
              <div className="text-center text-xs text-neutral-400 py-16 flex flex-col items-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                <p>Translating all feeds into English for global agents...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center text-xs text-neutral-600 py-16 border border-dashed border-neutral-800 rounded space-y-2">
                <FileText className="w-8 h-8 text-neutral-700 mx-auto" />
                <p>{activeTab === '내 기록' ? '작성하신 기밀 문서가 없습니다.' : t.noDocs}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => {
                  let displayTitle = report.title;
                  let displayContent = report.content;

                  if (lang === 'en' && englishMap[report.id]) {
                    displayTitle = englishMap[report.id].title;
                    displayContent = englishMap[report.id].content;
                  } else if (isListTranslated && translatedMap[report.id]) {
                    displayTitle = translatedMap[report.id].title;
                    displayContent = translatedMap[report.id].content;
                  }

                  return (
                    <div
                      key={report.id}
                      onClick={() => handleOpenDetail(report)}
                      className={`border p-5 rounded-lg space-y-3 cursor-pointer transition-all hover:scale-[1.005] ${
                        report.is_notice ? 'bg-red-950/30 border-red-800/80 hover:border-red-600 shadow-md shadow-red-950/20' : 'bg-neutral-900/80 border-neutral-800 hover:border-red-900/80'
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
                          <h3 className="text-base font-bold text-neutral-100">{displayTitle}</h3>
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
                          <span>{t.location}: {renderMaskedText(report.location, `loc-${report.id}`)}</span>
                        </div>
                      )}

                      <p className="text-xs leading-relaxed line-clamp-2 text-neutral-400">
                        {renderMaskedText(displayContent, `content-${report.id}`)}
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
          </>
        )}
      </main>

      {/* 💡 [개편] 건의사항 상세 보기 + 오직 관리자만 답변(댓글) 작성 가능 모달 */}
      {selectedSuggestion && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-purple-900 w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-lg p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <span className="text-xs text-purple-400 font-bold">🔒 건의사항 상세 및 사령부 공식 답변</span>
              <button onClick={() => setSelectedSuggestion(null)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <h2 className="text-base font-bold text-neutral-100">{selectedSuggestion.title}</h2>
            <div className="bg-neutral-950 p-4 rounded border border-neutral-800 text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">
              {selectedSuggestion.content}
            </div>

            <div className="flex justify-between items-center text-[11px] text-neutral-500 border-t border-neutral-800 pt-3">
              <span>제보자: {selectedSuggestion.author_nickname} 요원</span>
              {(isAdmin || currentUserId === selectedSuggestion.user_id) && (
                <button
                  onClick={() => handleDeleteSuggestion(selectedSuggestion.id)}
                  className="bg-red-950 hover:bg-red-900 text-red-300 px-2.5 py-1 rounded border border-red-900 text-xs cursor-pointer"
                >
                  삭제
                </button>
              )}
            </div>

            {/* 사령부 답변 댓글 섹션 */}
            <div className="border-t border-neutral-800 pt-4 space-y-3">
              <h3 className="text-xs font-bold text-purple-400 flex items-center space-x-1.5">
                <Crown className="w-3.5 h-3.5 text-yellow-500" />
                <span>사령부 공식 답변 ({sugComments.length})</span>
              </h3>

              {isAdmin ? (
                <form onSubmit={handleAddSuggestionComment} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newSugComment}
                    onChange={(e) => setNewSugComment(e.target.value)}
                    placeholder="최고 관리자 전용 답변 입력..."
                    className="flex-1 bg-neutral-950 border border-purple-900/60 rounded px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-600"
                  />
                  <button
                    type="submit"
                    disabled={sugCommentLoading}
                    className="bg-purple-900 hover:bg-purple-800 text-white text-xs px-4 py-2 rounded flex items-center space-x-1 font-bold cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {sugCommentLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>답변 등록</span>
                  </button>
                </form>
              ) : (
                <div className="bg-neutral-950/60 border border-neutral-800 p-2.5 rounded text-[11px] text-neutral-500 text-center">
                  🔒 답변 작성 권한은 최고 관리자(ADMIN)에게만 부여되어 있습니다.
                </div>
              )}

              <div className="space-y-2 pt-1 max-h-48 overflow-y-auto">
                {sugComments.length === 0 ? (
                  <div className="text-center text-[11px] text-neutral-600 py-3">아직 작성된 공식 답변이 없습니다.</div>
                ) : (
                  sugComments.map((sc) => (
                    <div key={sc.id} className="bg-purple-950/20 border border-purple-900/40 p-3 rounded text-xs space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-yellow-400 flex items-center space-x-1">
                          <Crown className="w-3 h-3 text-yellow-500" />
                          <span>{sc.author_nickname}</span>
                        </span>
                        <span className="text-neutral-500">{new Date(sc.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-neutral-200">{sc.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <span className="text-xs text-red-500 font-bold tracking-wider">
                [{selectedReport.is_notice ? t.notice : selectedReport.category || t.report}] {t.detailTitle}
              </span>
              <button onClick={() => setSelectedReport(null)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
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
                  <label className="block text-xs text-neutral-400 mb-1">보안 태그 (Tags)</label>
                  <input
                    type="text"
                    value={editTagsInput}
                    onChange={(e) => setEditTagsInput(e.target.value)}
                    placeholder="쉼표(,)로 구분"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200"
                  />
                </div>
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
                  <button onClick={() => setIsEditing(false)} className="bg-neutral-800 text-neutral-300 text-xs px-4 py-2 rounded cursor-pointer">Cancel</button>
                  <button onClick={handleUpdate} disabled={actionLoading} className="bg-red-900 text-white text-xs px-4 py-2 rounded flex items-center space-x-1 cursor-pointer">
                    <Save className="w-3.5 h-3.5" /><span>Save</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <h2 className="text-lg font-bold text-neutral-100">{currentModalTitle}</h2>
                    {!selectedReport.is_notice && selectedReport.danger_level && selectedReport.danger_level !== '일반' && (
                      <span className="bg-red-950 border border-red-900 text-red-400 text-xs px-2.5 py-1 rounded whitespace-nowrap">
                        {selectedReport.danger_level}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-neutral-950 border border-neutral-800/80 px-3 py-2.5 rounded gap-2">
                    <span className="text-[11px] text-neutral-400 flex items-center space-x-1">
                      <Languages className="w-3.5 h-3.5 text-red-500" />
                      <span>
                        {modalTranslateMode === 'original' && '🌐 다국어 모드 (원본 보기)'}
                        {modalTranslateMode === 'kr' && '🇰🇷 한국어 실시간 번역 적용 중'}
                        {modalTranslateMode === 'en' && '🇺🇸 English Translation Active'}
                      </span>
                    </span>

                    <div className="flex items-center space-x-1.5 w-full sm:w-auto">
                      <button
                        onClick={() => handleModalTranslate('original')}
                        className={`flex-1 sm:flex-none text-[10px] font-bold px-2.5 py-1 rounded transition-all cursor-pointer border ${
                          modalTranslateMode === 'original' ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        Original
                      </button>
                      <button
                        onClick={() => handleModalTranslate('kr')}
                        disabled={modalTranslating}
                        className={`flex-1 sm:flex-none text-[10px] font-bold px-2.5 py-1 rounded transition-all cursor-pointer border ${
                          modalTranslateMode === 'kr' ? 'bg-red-950 border-red-800 text-red-300' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {modalTranslating && modalTranslateMode === 'kr' ? 'Translating...' : '🇰🇷 한국어'}
                      </button>
                      <button
                        onClick={() => handleModalTranslate('en')}
                        disabled={modalTranslating}
                        className={`flex-1 sm:flex-none text-[10px] font-bold px-2.5 py-1 rounded transition-all cursor-pointer border ${
                          modalTranslateMode === 'en' ? 'bg-blue-950 border-blue-800 text-blue-300' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {modalTranslating && modalTranslateMode === 'en' ? 'Translating...' : '🇺🇸 English'}
                      </button>
                    </div>
                  </div>

                  {selectedReport.location && selectedReport.location !== '자유 게시판' && (
                    <div className="text-xs text-neutral-400 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{t.location}: {renderMaskedText(selectedReport.location, `modal-loc-${selectedReport.id}`)}</span>
                    </div>
                  )}

                  <div className="bg-neutral-950 p-4 rounded border border-neutral-800/80 text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">
                    {renderMaskedText(currentModalContent, `modal-content-${selectedReport.id}`)}
                  </div>

                  {selectedReport.tags && selectedReport.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {selectedReport.tags.map((tag: string, idx: number) => (
                        <span key={idx} className="text-[10px] bg-neutral-950 text-neutral-400 border border-neutral-800 px-2 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {selectedReport.image_url && (
                    <div className="space-y-1">
                      <span className="text-[11px] text-neutral-500">Image Attachment:</span>
                      <img src={selectedReport.image_url} alt="Image Attachment" className="w-full max-h-96 object-contain rounded border border-neutral-800 bg-neutral-950" />
                    </div>
                  )}

                  <div className="text-[11px] text-neutral-500 border-t border-neutral-800 pt-3 flex justify-between items-center">
                    <span>{t.author}: {selectedReport.author_nickname || 'Agent'}</span>
                    <span>{new Date(selectedReport.created_at).toLocaleString()}</span>
                  </div>

                  {(isAdmin || (currentUserId && currentUserId === selectedReport.user_id)) && (
                    <div className="flex justify-end space-x-2 border-t border-neutral-800 pt-3">
                      <button onClick={() => setIsEditing(true)} className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs px-3 py-1.5 rounded flex items-center space-x-1 cursor-pointer">
                        <Edit className="w-3.5 h-3.5" /><span>{t.edit}</span>
                      </button>
                      <button onClick={() => handleDelete(selectedReport.id)} disabled={actionLoading} className="bg-red-950 hover:bg-red-900 text-red-300 text-xs px-3 py-1.5 rounded flex items-center space-x-1 border border-red-900 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" /><span>{t.delete}</span>
                      </button>
                    </div>
                  )}
                </div>

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
                      <span>{t.send} (+5 EXP)</span>
                    </button>
                  </form>

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {rootComments.length === 0 ? (
                      <div className="text-center text-[11px] text-neutral-600 py-4">{t.noComments}</div>
                    ) : (
                      rootComments.map((comment) => {
                        const replies = getReplies(comment.id);

                        return (
                          <div key={comment.id} className="space-y-2">
                            <div className="bg-neutral-950 border border-neutral-800/80 p-3 rounded space-y-1.5 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-red-400">{comment.author_nickname}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-[10px] text-neutral-600">{new Date(comment.created_at).toLocaleString()}</span>
                                  {(isAdmin || currentUserId === comment.user_id) && (
                                    <button onClick={() => handleDeleteComment(comment.id)} className="text-neutral-600 hover:text-red-400 cursor-pointer">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-neutral-300 leading-relaxed break-all">{renderMaskedText(comment.content, `comment-${comment.id}`)}</p>

                              <div className="pt-1 flex justify-end">
                                <button
                                  onClick={() => {
                                    if (replyTargetId === comment.id) {
                                      setReplyTargetId(null);
                                    } else {
                                      setReplyTargetId(comment.id);
                                      setReplyText('');
                                    }
                                  }}
                                  className="text-[10px] text-neutral-500 hover:text-red-400 flex items-center space-x-1 cursor-pointer transition-colors"
                                >
                                  <CornerDownRight className="w-3.5 h-3.5" />
                                  <span>{replyTargetId === comment.id ? '취소' : '답글 달기'}</span>
                                </button>
                              </div>
                            </div>

                            {replyTargetId === comment.id && (
                              <div className="pl-6 flex gap-2 pt-1">
                                <CornerDownRight className="w-4 h-4 text-red-500 shrink-0 mt-2" />
                                <input
                                  type="text"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder={`${comment.author_nickname} 요원에게 남길 답글 입력...`}
                                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-red-900"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleAddReply(comment.id)}
                                  disabled={commentLoading || !replyText.trim()}
                                  className="bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-xs px-3 py-1.5 rounded font-bold cursor-pointer disabled:opacity-50 shrink-0"
                                >
                                  {commentLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : '답글 작성'}
                                </button>
                              </div>
                            )}

                            {replies.length > 0 && (
                              <div className="pl-6 space-y-2 border-l border-neutral-800 ml-2">
                                {replies.map((reply) => (
                                  <div key={reply.id} className="bg-neutral-900/60 border border-neutral-800/50 p-2.5 rounded space-y-1 text-xs">
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center space-x-1.5">
                                        <CornerDownRight className="w-3 h-3 text-red-500" />
                                        <span className="font-bold text-neutral-300">{reply.author_nickname}</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-[9px] text-neutral-600">{new Date(reply.created_at).toLocaleString()}</span>
                                        {(isAdmin || currentUserId === reply.user_id) && (
                                          <button onClick={() => handleDeleteComment(reply.id)} className="text-neutral-600 hover:text-red-400 cursor-pointer">
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-neutral-400 pl-4 leading-relaxed break-all">{renderMaskedText(reply.content, `reply-${reply.id}`)}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
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