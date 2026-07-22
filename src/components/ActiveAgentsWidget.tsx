'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Monitor, Smartphone, Users } from 'lucide-react';

export default function ActiveAgentsWidget({ currentUserId, userNickname }: { currentUserId: string | null; userNickname: string }) {
  const [activeAgents, setActiveAgents] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUserId) return;

    // 기기 판별 (모바일 여부)
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const deviceType = isMobile ? 'mobile' : 'pc';

    // Supabase Realtime Presence 채널 생성
    const roomChannel = supabase.channel('online_agents_room', {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    roomChannel
      .on('presence', { event: 'sync' }, () => {
        const state = roomChannel.presenceState();
        const agentsList: any[] = [];
        
        Object.values(state).forEach((presenceArray: any) => {
          presenceArray.forEach((presence: any) => {
            agentsList.push(presence);
          });
        });

        setActiveAgents(agentsList);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await roomChannel.track({
            user_id: currentUserId,
            nickname: userNickname || '특무 요원',
            device: deviceType,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [currentUserId, userNickname]);

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-lg space-y-3">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-red-500 animate-pulse" />
          <span className="text-xs font-bold text-neutral-200">실시간 작전 통제실 접속 현황</span>
        </div>
        <span className="bg-red-950/80 border border-red-900 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
          실시간 {activeAgents.length}명 접속 중
        </span>
      </div>

      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
        {activeAgents.length === 0 ? (
          <div className="text-[11px] text-neutral-500 text-center py-4">접속 중인 요원을 탐색 중...</div>
        ) : (
          activeAgents.map((agent, idx) => (
            <div key={idx} className="bg-neutral-950 border border-neutral-800/80 px-3 py-2 rounded flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                <span className="font-bold text-neutral-300">{agent.nickname} 요원</span>
              </div>
              <div className="flex items-center space-x-1 text-neutral-400" title={agent.device === 'mobile' ? '모바일 기기 접속' : 'PC 접속'}>
                {agent.device === 'mobile' ? (
                  <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <Monitor className="w-3.5 h-3.5 text-yellow-500" />
                )}
                <span className="text-[10px] text-neutral-500 uppercase">{agent.device}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}