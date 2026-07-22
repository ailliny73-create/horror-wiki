'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Lock, ArrowRight, ShieldCheck, Database, FileText, Globe } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [lang, setLang] = useState<'kr' | 'en'>('kr');

  // 다국어 텍스트 딕셔너리
  const t = {
    kr: {
      serverStatus: '보안 서버 정상 가동 중',
      badge: '대한민국 국가안보 특무 기밀 구역',
      titleMain: '초자연적 괴이 현상 통합 관리 및',
      titleSub: '특무 기밀 보고서 보관소',
      desc: '본 시스템은 식별된 이상 현상(Anomalies)의 기록, 격리 수칙, 현장 대응 요원의 보고서를 기밀 관리합니다. 인가되지 않은 민간인의 무단 접속 및 유출 시 법적 처벌 조치됩니다.',
      accessBtn: '요원 인증 및 통합 보관소 접속',
      card1Title: '실시간 보고서 열람',
      card1Desc: '현장에서 수집된 괴이 현상 보고서를 등급별로 즉시 확인합니다.',
      card2Title: '격리 및 대응 수칙',
      card2Desc: '위험 등급(S/A/B/C)에 따른 현장 대원의 즉각적인 대응 수칙을 수립합니다.',
      card3Title: '256-Bit 기밀 암호화',
      card3Desc: 'Supabase Auth 연동을 통한 철저한 대원 식별 및 보안을 제공합니다.',
    },
    en: {
      serverStatus: 'Secure Server Operational',
      badge: 'Republic of Korea National Security Classified Zone',
      titleMain: 'Supernatural Anomaly Integrated Management &',
      titleSub: 'Classified Report Archive',
      desc: 'This system classifies and manages records of identified anomalies, containment procedures, and field agent reports. Unauthorized civilian access or leakage is subject to strict legal punishment.',
      accessBtn: 'Agent Authentication & Access Archive',
      card1Title: 'Real-time Report Access',
      card1Desc: 'Instantly review anomaly incident reports collected from the field by hazard level.',
      card2Title: 'Containment Protocols',
      card2Desc: 'Establish immediate field response guidelines according to hazard ratings (S/A/B/C).',
      card3Title: '256-Bit Classified Encryption',
      card3Desc: 'Provides rigorous agent identification and security through Supabase Auth integration.',
    }
  };

  const currentT = t[lang];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-mono flex flex-col justify-between selection:bg-red-900 selection:text-white">
      
      {/* 💡 상단 네비게이션 및 언어 토글 버튼 */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center border-b border-neutral-900">
        <div className="flex items-center space-x-2 text-red-600 font-bold tracking-widest text-sm">
          <ShieldAlert className="w-5 h-5 animate-pulse" />
          <span>DISASTER RESPONSE BUREAU</span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 text-xs text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            <span>{currentT.serverStatus}</span>
          </div>

          {/* 💡 KR / EN 토글 버튼 */}
          <button
            onClick={() => setLang(lang === 'kr' ? 'en' : 'kr')}
            className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold px-3 py-1.5 rounded flex items-center space-x-1.5 text-neutral-300 transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-red-500" />
            <span>{lang === 'kr' ? 'ENGLISH (EN)' : '한국어 (KR)'}</span>
          </button>
        </div>
      </header>

      {/* 메인 히어로 섹션 */}
      <main className="w-full max-w-4xl mx-auto px-6 py-12 flex flex-col items-center text-center space-y-8 my-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-red-950/40 border border-red-900/60 text-red-400 text-xs tracking-wider">
          <Lock className="w-3.5 h-3.5" />
          <span>{currentT.badge}</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-100 leading-tight">
            {currentT.titleMain} <br />
            <span className="text-red-600 font-black drop-shadow-[0_0_15px_rgba(220,38,38,0.4)]">{currentT.titleSub}</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl mx-auto leading-relaxed pt-2">
            {currentT.desc}
          </p>
        </div>

        <button
          onClick={() => router.push('/login')}
          className="bg-red-900 hover:bg-red-800 text-white text-xs sm:text-sm font-bold px-8 py-4 rounded-lg border border-red-700 shadow-xl shadow-red-950/50 flex items-center space-x-3 cursor-pointer transition-all hover:scale-105"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{currentT.accessBtn}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </main>

      {/* 하단 특징 카드 섹션 */}
      <footer className="w-full border-t border-neutral-900 bg-neutral-950/80">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          
          <div className="bg-neutral-900/40 border border-neutral-900 p-5 rounded-lg space-y-2">
            <div className="flex items-center space-x-2 text-red-500 font-bold text-xs">
              <FileText className="w-4 h-4" />
              <span>01 / ARCHIVE</span>
            </div>
            <h3 className="text-sm font-bold text-neutral-200">{currentT.card1Title}</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">{currentT.card1Desc}</p>
          </div>

          <div className="bg-neutral-900/40 border border-neutral-900 p-5 rounded-lg space-y-2">
            <div className="flex items-center space-x-2 text-red-500 font-bold text-xs">
              <ShieldAlert className="w-4 h-4" />
              <span>02 / PROTOCOL</span>
            </div>
            <h3 className="text-sm font-bold text-neutral-200">{currentT.card2Title}</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">{currentT.card2Desc}</p>
          </div>

          <div className="bg-neutral-900/40 border border-neutral-900 p-5 rounded-lg space-y-2">
            <div className="flex items-center space-x-2 text-red-500 font-bold text-xs">
              <Database className="w-4 h-4" />
              <span>03 / SECURITY</span>
            </div>
            <h3 className="text-sm font-bold text-neutral-200">{currentT.card3Title}</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">{currentT.card3Desc}</p>
          </div>

        </div>
      </footer>

    </div>
  );
}