'use client';

import { ShieldAlert, Lock, ArrowRight, FileSearch, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-mono flex flex-col justify-between p-6 md:p-12">
      
      {/* 상단 로고 헤더 */}
      <header className="flex justify-between items-center border-b border-neutral-900 pb-6">
        <div className="flex items-center space-x-3">
          <ShieldAlert className="w-8 h-8 text-red-600 animate-pulse" />
          <span className="text-lg font-bold tracking-widest text-red-500">
            DISASTER RESPONSE BUREAU
          </span>
        </div>
        <div className="text-xs text-neutral-500 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>보안 서버 정상 가동 중</span>
        </div>
      </header>

      {/* 중앙 메인 타이틀 및 접속 버튼 */}
      <main className="max-w-4xl mx-auto text-center space-y-8 my-auto py-12">
        <div className="inline-flex items-center space-x-2 bg-red-950/40 border border-red-900/60 px-4 py-1.5 rounded-full text-xs text-red-400">
          <Lock className="w-3.5 h-3.5" />
          <span>대한민국 국가안보 특무 기밀 구역</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-neutral-100 tracking-tight leading-tight">
          초자연적 괴이 현상 통합 관리 및<br />
          <span className="text-red-600">특무 기밀 보고서 보관소</span>
        </h1>

        <p className="text-neutral-400 text-xs md:text-sm max-w-2xl mx-auto leading-relaxed">
          본 시스템은 식별된 이상 현상(Anomalies)의 기록, 격리 수칙, 현장 대응 요원의 보고서를 기밀 관리합니다.
          인가되지 않은 민간인의 무단 접속 및 유출 시 법적 처벌 조치됩니다.
        </p>

        {/* 핵심 [요원 인증 접속] 버튼 */}
        <div className="pt-4 flex justify-center">
          <Link
            href="/login"
            className="group relative inline-flex items-center space-x-3 bg-red-900 hover:bg-red-800 text-red-100 font-bold px-8 py-4 rounded-lg text-sm border border-red-700 shadow-lg shadow-red-950/50 transition-all hover:scale-105"
          >
            <ShieldCheck className="w-5 h-5 text-red-300" />
            <span>요원 인증 및 통합 보관소 접속</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </main>

      {/* 하단 특징 소개 3칸 */}
      <footer className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-neutral-900 pt-6 max-w-5xl mx-auto w-full text-xs">
        <div className="p-4 bg-neutral-900/40 border border-neutral-800/60 rounded flex items-start space-x-3">
          <FileSearch className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-neutral-200">실시간 보고서 열람</h3>
            <p className="text-neutral-500 text-[11px] mt-1">현장에서 수집된 괴이 현상 보고서를 등급별로 즉시 확인합니다.</p>
          </div>
        </div>

        <div className="p-4 bg-neutral-900/40 border border-neutral-800/60 rounded flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-neutral-200">격리 및 대응 수칙</h3>
            <p className="text-neutral-500 text-[11px] mt-1">위험 등급(S/A/B/C)에 따른 현장 대원의 즉각적인 대응 수칙을 수립합니다.</p>
          </div>
        </div>

        <div className="p-4 bg-neutral-900/40 border border-neutral-800/60 rounded flex items-start space-x-3">
          <Lock className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-neutral-200">256-Bit 기밀 암호화</h3>
            <p className="text-neutral-500 text-[11px] mt-1">Supabase Auth 연동을 통한 철저한 대원 식별 및 보안을 제공합니다.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}