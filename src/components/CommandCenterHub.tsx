'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Radio, Dices, Vote, Send, Loader2, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export default function CommandCenterHub({ currentUserId, userNickname, onExpGained }: { currentUserId: string | null; userNickname: string; onExpGained: () => void }) {
  const [activeTab, setActiveTab] = useState<'radio' | 'gacha' | 'vote'>('radio');

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [gachaResult, setGachaResult] = useState<any>(null);
  const [gachaLoading, setGachaLoading] = useState(false);
  const [gachaCooldown, setGachaCooldown] = useState(false);

  const [hasVoted, setHasVoted] = useState(false);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [voteStats, setVoteStats] = useState({ choiceA: 0, choiceB: 0, total: 0 });
  const [voteLoading, setVoteLoading] = useState(false);

  useEffect(() => {
    fetchMessages();
    checkUserVote();

    const channel = supabase
      .channel('public:radio_chats')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'radio_chats' }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('radio_chats')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50);
    if (data) setMessages(data);
  };

  const handleSendRadio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId || chatLoading) return;
    setChatLoading(true);

    const { error } = await supabase.from('radio_chats').insert([
      {
        user_id: currentUserId,
        nickname: userNickname || '특무 요원',
        message: newMessage.trim(),
      },
    ]);

    if (!error) {
      setNewMessage('');
    }
    setChatLoading(false);
  };

  const handleGachaPull = async () => {
    if (gachaLoading || gachaCooldown || !currentUserId) return;
    setGachaLoading(true);

    const rand = Math.random() * 100;
    let resultObj: any = {};

    if (rand < 60) {
      resultObj = { title: '🟢 일반 시민 등급', desc: '오늘 하루 무사히 일상에서 생존하셨습니다.', exp: 15, color: 'text-green-400' };
    } else if (rand < 90) {
      resultObj = { title: '🟡 재난국 감시 대상', desc: '이질적인 주파수가 감지되어 3시간 격리되었습니다.', exp: 30, color: 'text-yellow-400' };
    } else if (rand < 99) {
      resultObj = { title: '🔴 특수 능력 각성자', desc: '괴이의 힘 일부를 다스릴 수 있게 되었습니다!', exp: 70, color: 'text-red-400' };
    } else {
      resultObj = { title: '💀 인체 실험체 (즉사)', desc: '괴이에게 포획되어 본부 지하 실험실로 끌려갔습니다...', exp: 100, color: 'text-purple-400' };
    }

    await supabase.rpc('add_user_exp', { target_user_id: currentUserId, exp_to_add: resultObj.exp });
    onExpGained();

    setGachaResult(resultObj);
    setGachaLoading(false);
    setGachaCooldown(true);
  };

  const checkUserVote = async () => {
    if (!currentUserId) return;
    const { data } = await supabase.from('survival_votes').select('*').eq('user_id', currentUserId).single();
    if (data) {
      setHasVoted(true);
      setMyVote(data.choice);
    }
    fetchVoteStats();
  };

  const fetchVoteStats = async () => {
    const { data } = await supabase.from('survival_votes').select('choice');
    if (data) {
      const choiceA = data.filter((v) => v.choice === 'A').length;
      const choiceB = data.filter((v) => v.choice === 'B').length;
      setVoteStats({ choiceA, choiceB, total: data.length });
    }
  };

  const handleVote = async (choice: string) => {
    if (hasVoted || !currentUserId || voteLoading) return;
    setVoteLoading(true);

    const { error } = await supabase.from('survival_votes').insert([{ user_id: currentUserId, choice }]);
    if (!error) {
      setHasVoted(true);
      setMyVote(choice);
      await supabase.rpc('add_user_exp', { target_user_id: currentUserId, exp_to_add: 25 });
      onExpGained();
      fetchVoteStats();
    }
    setVoteLoading(false);
  };

  return (
    <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-4 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
          <span className="text-xs font-extrabold text-neutral-200">사령부 통제실 허브 (작전 & 오락)</span>
        </div>
        
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setActiveTab('radio')}
            className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition-all ${
              activeTab === 'radio' ? 'bg-red-950 border border-red-800 text-red-300' : 'bg-neutral-950 text-neutral-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>실시간 무전</span>
          </button>
          
          <button
            onClick={() => setActiveTab('gacha')}
            className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition-all ${
              activeTab === 'gacha' ? 'bg-yellow-950 border border-yellow-800 text-yellow-300' : 'bg-neutral-950 text-neutral-400 hover:text-white'
            }`}
          >
            <Dices className="w-3.5 h-3.5" />
            <span>재난 등급 가챠</span>
          </button>

          <button
            onClick={() => setActiveTab('vote')}
            className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition-all ${
              activeTab === 'vote' ? 'bg-purple-950 border border-purple-800 text-purple-300' : 'bg-neutral-950 text-neutral-400 hover:text-white'
            }`}
          >
            <Vote className="w-3.5 h-3.5" />
            <span>양자택일</span>
          </button>
        </div>
      </div>

      {activeTab === 'radio' && (
        <div className="space-y-3 animate-fade-in">
          <div ref={chatScrollRef} className="h-48 overflow-y-auto bg-neutral-950 border border-neutral-800 p-3 rounded space-y-2 pr-2">
            {messages.length === 0 ? (
              <div className="text-center text-[11px] text-neutral-600 py-12">수신된 무전 신호가 없습니다. OVER.</div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="text-xs space-y-0.5 border-b border-neutral-900 pb-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-red-400">📻 {msg.nickname} 요원</span>
                    <span className="text-neutral-600">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-neutral-300 break-all">{msg.message}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendRadio} className="flex gap-2">
            <input
              type="text"
              required
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="무전 메시지 입력 (OVER.)"
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-red-800"
            />
            <button
              type="submit"
              disabled={chatLoading || !newMessage.trim()}
              className="bg-red-900 hover:bg-red-800 text-white text-xs px-4 py-2 rounded font-bold flex items-center space-x-1 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {chatLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>송출</span>
            </button>
          </form>
        </div>
      )}

      {activeTab === 'gacha' && (
        <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-lg text-center space-y-4 animate-fade-in">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-yellow-400 flex items-center justify-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span>오늘의 요주의 대상 / 재난 등급 측정</span>
            </h3>
            <p className="text-[11px] text-neutral-500">대응국 요원으로서 오늘의 운명과 경험치(EXP)를 측정합니다.</p>
          </div>

          {gachaResult ? (
            <div className="bg-neutral-900 border border-yellow-900/60 p-4 rounded-lg space-y-2">
              <div className={`text-base font-extrabold ${gachaResult.color}`}>{gachaResult.title}</div>
              <p className="text-xs text-neutral-300">{gachaResult.desc}</p>
              <div className="text-[11px] text-red-400 font-bold pt-1">습득 경험치: +{gachaResult.exp} EXP</div>
            </div>
          ) : (
            <div className="py-6 text-xs text-neutral-500 border border-dashed border-neutral-800 rounded">
              아직 측정 결과가 없습니다. 아래 버튼을 눌러 측정을 개시하십시오.
            </div>
          )}

          <button
            onClick={handleGachaPull}
            disabled={gachaLoading || gachaCooldown}
            className="w-full bg-yellow-950 hover:bg-yellow-900 border border-yellow-800 text-yellow-200 text-xs py-3 rounded font-extrabold flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 transition-all"
          >
            {gachaLoading ? <Loader2 className="w-4 h-4 animate-spin text-yellow-400" /> : <Dices className="w-4 h-4 text-yellow-400" />}
            <span>{gachaCooldown ? '측정 완료 (재측정 불가)' : '🎲 재난 등급 측정 개시'}</span>
          </button>
        </div>
      )}

      {activeTab === 'vote' && (
        <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-lg space-y-4 animate-fade-in">
          <div className="space-y-1 border-b border-neutral-800 pb-3">
            <span className="text-[10px] text-purple-400 font-bold">🚨 [재난국 긴급 양자택일 설문]</span>
            <h3 className="text-xs font-extrabold text-neutral-100 leading-snug">
              "새벽 3시, 자취방 문밖에서 엄마 목소리로 '밥 먹어라' 하며 문을 두드린다. 문을 연다 vs 절대 무시한다"
            </h3>
          </div>

          {hasVoted ? (
            <div className="space-y-3">
              <div className="bg-purple-950/30 border border-purple-900/60 p-3 rounded text-center text-xs text-purple-300 font-bold flex items-center justify-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>투표 완료! (선택한 항목: {myVote === 'A' ? '🚪 문을 연다' : '🛡️ 절대 무시한다'}) [+25 EXP]</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-neutral-400">
                    <span>🚪 문을 연다</span>
                    <span>{voteStats.total > 0 ? Math.round((voteStats.choiceA / voteStats.total) * 100) : 0}% ({voteStats.choiceA}명)</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800">
                    <div className="bg-red-600 h-full" style={{ width: `${voteStats.total > 0 ? (voteStats.choiceA / voteStats.total) * 100 : 0}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-neutral-400">
                    <span>🛡️ 절대 무시한다</span>
                    <span>{voteStats.total > 0 ? Math.round((voteStats.choiceB / voteStats.total) * 100) : 0}% ({voteStats.choiceB}명)</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800">
                    <div className="bg-purple-600 h-full" style={{ width: `${voteStats.total > 0 ? (voteStats.choiceB / voteStats.total) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => handleVote('A')}
                disabled={voteLoading}
                className="bg-neutral-900 hover:bg-red-950/80 border border-neutral-800 hover:border-red-800 p-3 rounded text-xs font-bold text-neutral-200 cursor-pointer transition-all text-center space-y-1"
              >
                <div>🚪 문을 연다</div>
              </button>

              <button
                onClick={() => handleVote('B')}
                disabled={voteLoading}
                className="bg-neutral-900 hover:bg-purple-950/80 border border-neutral-800 hover:border-purple-800 p-3 rounded text-xs font-bold text-neutral-200 cursor-pointer transition-all text-center space-y-1"
              >
                <div>🛡️ 절대 무시한다</div>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}