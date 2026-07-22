'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Award, ShieldCheck, Flame, Moon, MessageSquare, Skull, Globe, Lock } from 'lucide-react';

export default function UserBadges({ 
  userId, 
  userExp, 
  reportCount, 
  commentCount, 
  deathCount, 
  onBadgeChange 
}: { 
  userId: string | null; 
  userExp: number; 
  reportCount: number; 
  commentCount: number; 
  deathCount: number; 
  onBadgeChange: (badgeName: string) => void 
}) {
  const [activeBadge, setActiveBadge] = useState<string>('novice');
  const [loading, setLoading] = useState(true);

  const allBadges = [
    { code: 'novice', name: '신규 요원', desc: '특무 사령부 입과 완료', icon: ShieldCheck, unlocked: true },
    { code: 'reporter', name: '기밀 제보자', desc: '위험 보고서 1건 이상 작성', icon: Flame, unlocked: reportCount >= 1 },
    { code: 'night_owl', name: '심야의 관측자', desc: '밤 12시~새벽 4시 활동 기록', icon: Moon, unlocked: new Date().getHours() >= 0 && new Date().getHours() < 4 },
    { code: 'debater', name: '토론의 주파수', desc: '댓글 10개 이상 작성', icon: MessageSquare, unlocked: commentCount >= 10 },
    { code: 'disaster', name: '재앙의 경보병', desc: '위험 보고서 3건 이상 작성', icon: Flame, unlocked: reportCount >= 3 },
    { code: 'survivor', name: '사망전대 생존자', desc: '생존 테스트 사망 3회 이상 겪음', icon: Skull, unlocked: deathCount >= 3 },
    { code: 'global', name: '글로벌 관제사', desc: '보안 2급 이상 달성', icon: Globe, unlocked: userExp >= 1500 },
    { code: 'veteran', name: '베테랑 감시관', desc: '보안 3급 (700 EXP) 달성', icon: Award, unlocked: userExp >= 700 },
    { code: 'elite', name: '최정예 요원', desc: '보안 1급 (3000 EXP) 달성', icon: Award, unlocked: userExp >= 3000 },
  ];

  useEffect(() => {
    if (userId) fetchUserBadges();
  }, [userId]);

  const fetchUserBadges = async () => {
    setLoading(true);
    const { data } = await supabase.from('user_profiles').select('active_badge').eq('user_id', userId).single();
    if (data && data.active_badge) {
      setActiveBadge(data.active_badge);
      const found = allBadges.find(b => b.code === data.active_badge);
      if (found) {
        onBadgeChange(found.name);
      }
    }
    setLoading(false);
  };

  const handleSelectBadge = async (badgeCode: string, badgeName: string, isUnlocked: boolean) => {
    if (!userId) return;

    if (!isUnlocked) {
      alert(`🔒 [보안 경고] 아직 [${badgeName}] 훈장 해금 조건을 달성하지 못했습니다!`);
      return;
    }

    setActiveBadge(badgeCode);
    onBadgeChange(badgeName);

    await supabase.from('user_profiles').update({ active_badge: badgeCode }).eq('user_id', userId);
    alert(`🎖️ 대표 칭호가 [${badgeName}] (으)로 장착되었습니다!`);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-3">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-red-500">
          <Award className="w-4 h-4" />
          <span>사령부 수훈 훈장 및 대표 칭호 설정 (AGENT BADGES)</span>
        </div>
        <span className="text-[10px] text-neutral-500">조건 달성 시 장착 가능</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {allBadges.map((b) => {
          const Icon = b.icon;
          const isActive = activeBadge === b.code;

          return (
            <div
              key={b.code}
              onClick={() => handleSelectBadge(b.code, b.name, b.unlocked)}
              className={`p-3 rounded border flex flex-col items-center text-center space-y-1.5 transition-all cursor-pointer relative ${
                isActive
                  ? 'bg-red-950/70 border-red-600 text-white shadow-lg shadow-red-950/50 scale-[1.02]'
                  : b.unlocked
                  ? 'bg-neutral-950 border-neutral-800 text-neutral-200 hover:border-red-900'
                  : 'bg-neutral-950/40 border-neutral-900/80 text-neutral-600 opacity-50'
              }`}
            >
              {isActive && (
                <span className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[8px] px-1.5 py-0.2 rounded font-bold">
                  장착중
                </span>
              )}
              {!b.unlocked && (
                <span className="absolute top-1.5 right-1.5 text-neutral-500 flex items-center space-x-0.5 text-[8px]">
                  <Lock className="w-3 h-3" />
                  <span>잠김</span>
                </span>
              )}

              <Icon className={`w-6 h-6 ${isActive ? 'text-red-400 animate-pulse' : b.unlocked ? 'text-red-500' : 'text-neutral-600'}`} />
              <div>
                <p className="text-[11px] font-bold">{b.name}</p>
                <p className="text-[9px] text-neutral-500 line-clamp-1">{b.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}