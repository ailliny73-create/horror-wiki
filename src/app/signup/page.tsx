'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, User, KeyRound, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

export default function SignUpPage() {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const cleanNickname = nickname.trim().toLowerCase();
      if (!cleanNickname) {
        setErrorMsg('올바른 닉네임을 입력해주세요.');
        setLoading(false);
        return;
      }

      const fakeEmail = `${cleanNickname}@gmail.com`;

      // 1. Supabase 회원가입 진행
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: fakeEmail,
        password: password,
        options: {
          data: {
            nickname: nickname.trim(),
          },
        },
      });

      if (signUpError) {
        console.error('SignUp Error Detail:', signUpError);
        if (signUpError.message.includes('already registered')) {
          setErrorMsg('이미 존재하는 요원 닉네임입니다.');
        } else {
          setErrorMsg('신원 등록 실패: ' + signUpError.message);
        }
        setLoading(false);
        return;
      }

      // 2. 가입 직후 자동 로그인 세션 생성
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: password,
      });

      if (loginError) {
        console.error('Auto Login Error Detail:', loginError);
        // 이메일 미인증 상태일 가능성 안내
        setErrorMsg('계정은 생성되었으나 자동 접속에 실패했습니다. (Supabase에서 Confirm Email 비활성화 필요)');
        setLoading(false);
        return;
      }

      // 3. 성공 시 이동
      alert(`[${nickname}] 요원 신규 등록 완료! 메인 화면으로 이동합니다.`);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Unexpected Error:', err);
      setErrorMsg('시스템 오류가 발생했습니다: ' + (err?.message || '알 수 없는 에러'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-mono flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-neutral-900/60 border border-neutral-800 p-8 rounded-lg space-y-6">
        <div className="text-center space-y-2">
          <UserPlus className="w-10 h-10 text-red-600 mx-auto animate-pulse" />
          <h2 className="text-xl font-bold text-neutral-100 tracking-wider">
            신규 특무 요원 신원 등록
          </h2>
          <p className="text-xs text-neutral-500">LEVEL 3 보안 승인 계정 생성</p>
        </div>

        {errorMsg && (
          <div className="bg-red-950/60 border border-red-900/80 text-red-400 text-xs p-3 rounded text-center break-all">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">요원 닉네임 / 코드명</label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                disabled={loading}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="예: captain 또는 agent007"
                className="w-full bg-neutral-950 border border-neutral-800 rounded pl-10 pr-4 py-2 text-xs text-neutral-200 focus:outline-none focus:border-red-900 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">보안 암호 (6자리 이상)</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-950 border border-neutral-800 rounded pl-10 pr-4 py-2 text-xs text-neutral-200 focus:outline-none focus:border-red-900 disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-900 hover:bg-red-800 text-red-100 font-bold py-3 rounded text-xs border border-red-700 flex items-center justify-center space-x-2 transition-all mt-6 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>신원 등록 중...</span>
              </>
            ) : (
              <>
                <span>신원 등록 요청</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center border-t border-neutral-900">
          <Link
            href="/login"
            className="text-xs text-neutral-500 hover:text-neutral-300 inline-flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>기존 요원 로그인으로 전환</span>
          </Link>
        </div>
      </div>
    </div>
  );
}