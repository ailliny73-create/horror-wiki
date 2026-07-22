'use client';

import React from 'react';
import { supabase } from '@/lib/supabase';
import { Award, ShieldCheck, Flame, Moon, MessageSquare, Skull, Globe, X, Lock } from 'lucide-react';

interface UserBadgesModalProps {
  userId: string | null;
  userExp: number;
  reportCount: number;
  commentCount: number;
  deathCount: number;
  activeBadge: string;
  onClose: () => void;
  onBadgeChange: (badgeCode: string, badgeName: string) => void;
}

export default function UserBadgesModal({
  userId,
  userExp,
  reportCount,
  commentCount,
  deathCount,
  activeBadge,
  onClose,
  onBadgeChange,
}: UserBadgesModalProps) {
  const badges = [
    { 
      code: 'novice', 
      name: '신규 요원', 
      desc: '특무 사령부 입과 완료', 
      icon: ShieldCheck, 
      unlocked: true,
      progressText: '해금 완료' 
    },
    { 
      code: 'reporter', 
      name: '기밀 제보자', 
      desc: '위험 보고서 1건 이상 작성', 
      icon: Flame, 
      unlocked: reportCount >= 1,
      progressText: reportCount >= 1 ? '해금 완료' : `현재 ${reportCount}/1건 (1건 필요)`
    },
    { 
      code: 'night_owl', 
      name: '심야의 관측자', 
      desc: '밤 12시~새벽 4시 활동 기록', 
      icon: Moon, 
      unlocked: new Date().getHours() >= 0 && new Date().getHours() < 4,
      progressText: (new Date().getHours() >= 0 && new Date().getHours() < 4) ? '해금 완료' : '새벽 00~04시 접속 시 해금'
    },
    { 
      code: 'debater', 
      name: '토론의 주파수', 
      desc: '댓글 10개 이상 작성', 
      icon: MessageSquare, 
      unlocked: commentCount >= 10,
      progressText: commentCount >= 10 ? '해금 완료' : `현재 ${commentCount}/10개 (${10 - commentCount}개 남음)`
    },
    { 
      code: 'disaster', 
      name: '재앙의 경보병', 
      desc: '위험 보고서 3건 이상 작성', 
      icon: Flame, 
      unlocked: reportCount >= 3,
      progressText: reportCount >= 3 ? '해금 완료' : `현재 ${reportCount}/3건 (${3 - reportCount}건 남음)`
    },
    { 
      code: 'survivor', 
      name: '사망전대 생존자', 
      desc: '생존 테스트 사망 3회 이상 겪음', 
      icon: Skull, 
      unlocked: deathCount >= 3,
      progressText: deathCount >= 3 ? '해금 완료' : `현재 ${deathCount}/3회 사망 (${3 - deathCount}회 남음)`
    },
    { 
      code: 'global', 
      name: '글로벌 관제사', 
      desc: '보안 2급 (1500 EXP) 달성', 
      icon: Globe, 
      unlocked: userExp >= 1500,
      progressText: userExp >= 1500 ? '해금 완료' : `현재 ${userExp}/1500 EXP (${1500 - userExp} EXP 부족)`
    },
    { 
      code: 'veteran', 
      name: '베테랑 감시관', 
      desc: '보안 3급 (700 EXP) 달성', 
      icon: Award, 
      unlocked: userExp >= 700,
      progressText: userExp >= 700 ? '해금 완료' : `현재 ${userExp}/700 EXP (${700 - userExp} EXP 부족)`
    },
    { 
      code: 'elite', 
      name: '최정예 요원', 
      desc: '보안 1급 (3000 EXP) 달성', 
      icon: Award, 
      unlocked: userExp >= 3000,
      progressText: userExp >= 3000 ? '해금 완료' : `현재 ${userExp}/3000 EXP (${3000 - userExp} EXP 부족)`
    },
  ];

  const handleSelect = async (badgeCode: string, badgeName: string, isUnlocked: boolean) => {
    if (!userId) return;
    if (!isUnlocked) {
      alert(`🔒 [보안 경고] 아직 [${badgeName}] 훈장 해금 조건을 달성하지 못했습니다!`);
      return;
    }

    await supabase.from('user_profiles').update({ active_badge: badgeCode }).eq('user_id', userId);
    onBadgeChange(badgeCode, badgeName);
    alert(`🎖️ 대표 칭호가 [${badgeName}] (으)로 장착되었습니다!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-neutral-900 border border-red-900/80 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg p-6 space-y-6 shadow-2xl">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-red-500">
            <Award className="w-4 h-4" />
            <span>개인 수훈 훈장 및 칭호 관리 소록 (AGENT BADGES)</span>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-[11px] text-neutral-400">
          사령부 임무 수행 및 생존 실적을 통해 해금된 훈장을 클릭하여 대표 칭호로 장착하십시오. 미달성 훈장은 남은 횟수와 조건이 표시됩니다.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {badges.map((b) => {
            const Icon = b.icon;
            const isActive = activeBadge === b.code;

            return (
              <div
                key={b.code}
                onClick={() => handleSelect(b.code, b.name, b.unlocked)}
                className={`p-3.5 rounded-lg border flex flex-col justify-between space-y-2 transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-red-950/70 border-red-600 text-white shadow-lg shadow-red-950/50'
                    : b.unlocked
                    ? 'bg-neutral-950 border-neutral-800 text-neutral-200 hover:border-red-900'
                    : 'bg-neutral-950/40 border-neutral-900/80 text-neutral-500 opacity-60'
                }`}
              >
                <div className="flex justify-between items-start">
                  <Icon className={`w-6 h-6 ${isActive ? 'text-red-400 animate-pulse' : b.unlocked ? 'text-red-500' : 'text-neutral-600'}`} />
                  {isActive && (
                    <span className="bg-red-600 text-white text-[9px] px-2 py-0.5 rounded font-bold">
                      장착중
                    </span>
                  )}
                  {!b.unlocked && (
                    <span className="text-neutral-500 flex items-center space-x-1 text-[9px]">
                      <Lock className="w-3 h-3" />
                      <span>잠김</span>
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-neutral-100">{b.name}</p>
                  <p className="text-[10px] text-neutral-400">{b.desc}</p>
                </div>

                <div className="pt-2 border-t border-neutral-800/80 text-[10px] flex justify-between items-center font-mono">
                  <span className={b.unlocked ? 'text-green-400 font-bold' : 'text-red-400'}>
                    {b.progressText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}