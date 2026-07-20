import Link from 'next/link';
import { ShieldAlert, FileText, Search, Compass, Archive, PlusCircle, AlertTriangle } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-mono flex flex-col">
      {/* 상단 네비게이션 바 */}
      <header className="border-b border-red-900/40 bg-neutral-900/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <ShieldAlert className="w-7 h-7 text-red-600 animate-pulse" />
          <span className="font-bold text-lg tracking-wider text-red-500">
            괴이대응국 // DISASTER MANAGEMENT
          </span>
        </div>
        
        {/* 검색창 */}
        <div className="relative w-1/3 hidden md:block">
          <input
            type="text"
            placeholder="괴이 식별코드 또는 코드명 검색..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-1.5 pl-10 text-sm text-neutral-300 focus:outline-none focus:border-red-600 transition"
          />
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
        </div>

        <nav className="flex space-x-4 text-sm">
          <Link href="/login" className="hover:text-red-400 transition">
            [인증 접속]
          </Link>
        </nav>
      </header>

      {/* 메인 레이아웃 */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* 사이드바 메뉴 */}
        <aside className="md:col-span-1 space-y-6">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded p-4">
            <h2 className="text-xs text-neutral-500 uppercase tracking-widest mb-3 font-semibold">
              // SYSTEM MENU
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/docs" className="flex items-center space-x-2 text-neutral-300 hover:text-red-400 p-2 rounded hover:bg-neutral-800/50">
                  <FileText className="w-4 h-4 text-red-500" />
                  <span>괴이 문서 보관소</span>
                </Link>
              </li>
              <li>
                <Link href="/expeditions" className="flex items-center space-x-2 text-neutral-300 hover:text-red-400 p-2 rounded hover:bg-neutral-800/50">
                  <Compass className="w-4 h-4 text-amber-500" />
                  <span>현장 탐사 기록</span>
                </Link>
              </li>
              <li>
                <Link href="/evidence" className="flex items-center space-x-2 text-neutral-300 hover:text-red-400 p-2 rounded hover:bg-neutral-800/50">
                  <Archive className="w-4 h-4 text-blue-500" />
                  <span>증거물 아카이브</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* 작성 버튼 박스 */}
          <div className="bg-neutral-900/60 border border-red-900/30 rounded p-4 text-center">
            <p className="text-xs text-neutral-400 mb-3">
              신규 특무 현장 보고서 작성 권한 활성화됨
            </p>
            <button className="w-full bg-red-950 hover:bg-red-900 text-red-200 border border-red-700 font-semibold py-2 px-4 rounded text-sm flex items-center justify-center space-x-2 transition">
              <PlusCircle className="w-4 h-4" />
              <span>새 보고서 작성</span>
            </button>
          </div>
        </aside>

        {/* 대시보드 (메인 콘텐츠) */}
        <section className="md:col-span-3 space-y-6">
          
          {/* 경고 배너 */}
          <div className="bg-red-950/30 border border-red-800/50 rounded p-4 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-red-400">긴급 전파 사항</h3>
              <p className="text-xs text-neutral-400 mt-1">
                야간 현장 활동 시 단독 행동을 금하며, 표준 정신 오염 방지 수칙을 엄수하십시오.
              </p>
            </div>
          </div>

          {/* 최근 문서 리스트 */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded p-5">
            <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4 flex items-center space-x-2">
              <span className="w-2 h-2 bg-red-600 rounded-full inline-block"></span>
              <span>최근 업데이트된 괴이 문서</span>
            </h2>

            <div className="space-y-3">
              {/* 괴이 문서 1 */}
              <div className="border border-neutral-800 hover:border-red-900/50 bg-neutral-950 p-4 rounded transition group cursor-pointer">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-red-500 border border-red-950 bg-red-950/40 px-2 py-0.5 rounded">
                    위험등급: 극심 (S)
                  </span>
                  <span className="text-xs text-neutral-500">2026.07.20 14:20</span>
                </div>
                <h3 className="text-base font-bold text-neutral-200 group-hover:text-red-400 mt-2">
                  [ANOMALY-049] 지하철 3호선 심야 회차선 잔류 현상
                </h3>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                  막차 운행 종료 후 회차선에 진입한 열차 내부에서 승객 형상의 그림자가 다수 목격됨. 승무원 접촉 시 기억 소실 발생...
                </p>
              </div>

              {/* 괴이 문서 2 */}
              <div className="border border-neutral-800 hover:border-amber-900/50 bg-neutral-950 p-4 rounded transition group cursor-pointer">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-amber-500 border border-amber-950 bg-amber-950/40 px-2 py-0.5 rounded">
                    위험등급: 경계 (B)
                  </span>
                  <span className="text-xs text-neutral-500">2026.07.19 21:05</span>
                </div>
                <h3 className="text-base font-bold text-neutral-200 group-hover:text-amber-400 mt-2">
                  [LOG-102] 옥상 정원 비치파라솔 탐사 보고서
                </h3>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                  비 오는 날 해당 위치에서 우산을 펴지 않고 서 있는 대상을 관찰한 기록. 대상과의 대화는 금지됨...
                </p>
              </div>
            </div>
          </div>

        </section>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-neutral-800 bg-neutral-950 px-6 py-4 text-center text-xs text-neutral-600">
        <p>© DISASTER MANAGEMENT BUREAU. ALL RIGHTS RESERVED.</p>
        <p className="mt-1">허가받지 않은 민간인의 접근 및 정보 유출을 금합니다.</p>
      </footer>
    </div>
  );
}