'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShieldAlert, KeyRound, UserPlus, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkSession();
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) throw error;

        setMessage({
          type: 'success',
          text: '요원 등록 성공! 암호를 입력하고 [인증 접속] 버튼을 누르세요.',
        });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) throw error;

        // 로그인 성공 시 /dashboard 보관소로 이동!
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      let friendlyText = err.message || '인증에 실패했습니다.';
      
      if (err.message?.includes('Invalid login credentials')) {
        friendlyText = '이메일 또는 비밀번호가 일치하지 않습니다.';
      } else if (err.message?.includes('rate limit exceeded')) {
        friendlyText = '요청이 너무 많습니다. 1~2분 후 다시 시도해 주세요.';
      }

      setMessage({ type: 'error', text: `[인증 실패] ${friendlyText}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-mono flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-900 border border-red-900/40 rounded-lg p-6 shadow-2xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <ShieldAlert className="w-12 h-12 text-red-600 animate-pulse" />
          </div>
          <h1 className="text-xl font-bold tracking-wider text-red-500">
            괴이대응국 // 요원 인증
          </h1>
          <p className="text-xs text-neutral-400">
            {isSignUp ? '신규 현장 요원 신원 등록' : '보안 등급 확인을 위한 로그인'}
          </p>
        </div>

        {message && (
          <div
            className={`p-3 border rounded text-xs flex items-center space-x-2 ${
              message.type === 'error'
                ? 'bg-red-950/50 border-red-800 text-red-400'
                : 'bg-emerald-950/50 border-emerald-800 text-emerald-400'
            }`}
          >
            {message.type === 'error' ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              요원 식별 이메일
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@disaster.go.kr"
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-red-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              보안 암호 (6자리 이상)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-red-600 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-900 hover:bg-red-800 text-red-100 font-semibold py-2.5 px-4 rounded text-sm transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isSignUp ? <UserPlus className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
            <span>{loading ? '인증 확인 중...' : isSignUp ? '신원 등록 요청' : '인증 접속'}</span>
          </button>
        </form>

        <div className="flex justify-between items-center text-xs text-neutral-400 border-t border-neutral-800 pt-4">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage(null);
            }}
            className="hover:text-neutral-200 underline transition cursor-pointer"
          >
            {isSignUp ? '기존 요원 로그인으로 전환' : '신규 요원 등록(회원가입)'}
          </button>

          <Link href="/" className="flex items-center space-x-1 hover:text-neutral-200 transition">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>대문으로</span>
          </Link>
        </div>

      </div>
    </div>
  );
}