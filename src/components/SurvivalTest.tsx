'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Skull, ShieldAlert, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';

export default function SurvivalTest({ userId, onExpGained }: { userId: string | null; onExpGained: () => void }) {
  const [testedToday, setTestedToday] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (userId) checkTodayTest();
  }, [userId]);

  const checkTodayTest = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('survival_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('last_test_date', todayStr)
      .single();

    if (data) {
      setTestedToday(true);
      setResult(data);
    }
  };

  const handleTestLuck = async () => {
    if (!userId || testedToday || loading) return;
    setLoading(true);

    const rand = Math.random();
    let type = 'injury';
    let exp = 10;
    let msg = '괴이의 습격을 받았으나 부상만 입고 겨우 생존했습니다! (+10 EXP)';

    if (rand < 0.2) {
      type = 'death';
      exp = 0;
      msg = '☠️ [사망] 치명적인 괴이와 조우하여 신호가 끊겼습니다... (EXP 획득 실패)';
    } else if (rand > 0.8) {
      type = 'miracle';
      exp = 40;
      msg = '🎉 [기적적 생존] 특무 보급품을 발견하여 엄청난 공조를 이뤄냈습니다! (+40 EXP)';
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const { error } = await supabase.from('survival_logs').insert([
      { user_id: userId, last_test_date: todayStr, result_type: type }
    ]);

    if (!error) {
      if (exp > 0) {
        await supabase.rpc('add_user_exp', { target_user_id: userId, exp_to_add: exp });
        onExpGained();
      }
      setTestedToday(true);
      setResult({ result_type: type, message: msg });
    }
    setLoading(false);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-3">
      <div className="flex items-center space-x-2 text-xs font-bold text-yellow-400">
        <Sparkles className="w-4 h-4 animate-spin" />
        <span>일일 생존 확률 테스트 (SURVIVAL LUCK CHECK)</span>
      </div>
      <p className="text-[11px] text-neutral-400">
        오늘 하루 사령부 구역에서의 생존 확률을 점쳐보십시오. (매일 1회 참여 가능)
      </p>

      {testedToday ? (
        <div className="bg-neutral-950 p-3 rounded border border-neutral-800 text-xs text-neutral-300 flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
          <div>
            <p className="font-bold text-neutral-200">오늘의 테스트 완료</p>
            <p className="text-[11px] text-neutral-400">
              {result?.result_type === 'death' && '☠️ 사망 판정 (EXP 0)'}
              {result?.result_type === 'injury' && '⚠️ 부상 생존 (+10 EXP)'}
              {result?.result_type === 'miracle' && '🎉 기적적 생존 (+40 EXP)'}
            </p>
          </div>
        </div>
      ) : (
        <button
          onClick={handleTestLuck}
          disabled={loading}
          className="w-full bg-yellow-600 hover:bg-yellow-500 text-neutral-950 text-xs py-2.5 rounded font-extrabold transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-md"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Skull className="w-4 h-4" />}
          <span>오늘의 생존 운세 시험하기</span>
        </button>
      )}
    </div>
  );
}