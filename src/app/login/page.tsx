'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, KeyRound, User, ArrowRight, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const cleanNickname = nickname.trim().toLowerCase();
    const fakeEmail = `${cleanNickname}@gmail.com`;

    const { error } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password,
    });

    if (error) {
      console.error('Login error detail:', error.message);
      setErrorMsg('인증 실패: 닉네임 또는 보안 암호를 확인하십시오.');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-mono flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-neutral-900/60 border border-neutral-800 p-8 rounded-lg space-y-6">
        <div className="text-center space-y-2">
          <ShieldAlert className="w-10 h-10 text-red-600 mx-auto animate-pulse" />
          <h2 className="text-xl font-bold text-neutral-100 tracking-wider">
            특무 요원 보안 인증
          </h2>
          <p className="text-xs text-neutral-500">LEVEL 3 이상 인가된 요원 전용 접속 구역</p>
        </div>

        {errorMsg && (
          <div className="bg-red-950/60 border border-red-900/80 text-red-400 text-xs p-3 rounded text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">요원 닉네임 / 코드명</label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="등록한 닉네임 입력"
                className="w-full bg-neutral-950 border border-neutral-800 rounded pl-10 pr-4 py-2 text-xs text-neutral-200 focus:outline-none focus:border-red-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">보안 암호</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-950 border border-neutral-800 rounded pl-10 pr-4 py-2 text-xs text-neutral-200 focus:outline-none focus:border-red-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-900 hover:bg-red-800 text-red-100 font-bold py-3 rounded text-xs border border-red-700 flex items-center justify-center space-x-2 transition-all mt-6 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? '보안 인증 진행 중...' : '보안 승인 요청'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center border-t border-neutral-900">
          <Link
            href="/signup"
            className="text-xs text-neutral-500 hover:text-red-400 inline-flex items-center space-x-1.5 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>신규 요원 계정 발급 신청 (회원가입)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}