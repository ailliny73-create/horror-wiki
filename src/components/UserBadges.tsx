'use client';

import { Award, ShieldCheck, Flame, Calendar, MessageSquare } from 'lucide-react';

export default function UserBadges({ userExp, reportCount }: { userExp: number; reportCount: number }) {
  const badges = [
    { id: 'novice', name: '신규 요원', desc: '특무 사령부 입과 완료', icon: ShieldCheck, unlocked: true },
    { id: 'reporter', name: '기밀 제보자', desc: '위험 보고서 1건 이상 작성', icon: Flame, unlocked: reportCount > 0 },
    { id: 'veteran', name: '베테랑 감시관', desc: '보안 3급 (700 EXP) 이상 달성', icon: Award, unlocked: userExp >= 700 },
    { id: 'elite', name: '최정예 요원', desc: '보안 1급 (3000 EXP) 달성', icon: Award, unlocked: userExp >= 3000 },
  ];

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-3">
      <div className="flex items-center space-x-2 text-xs font-bold text-red-500">
        <Award className="w-4 h-4" />
        <span>사령부 수훈 훈장 (AGENT BADGES)</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {badges.map((b) => {
          const Icon = b.icon;
          return (
            <div
              key={b.id}
              className={`p-3 rounded border flex flex-col items-center text-center space-y-1.5 transition-all ${
                b.unlocked
                  ? 'bg-neutral-950 border-red-900/60 text-neutral-200 shadow-inner'
                  : 'bg-neutral-950/40 border-neutral-900 text-neutral-600 opacity-40 grayscale'
              }`}
            >
              <Icon className={`w-6 h-6 ${b.unlocked ? 'text-red-500 animate-pulse' : 'text-neutral-600'}`} />
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