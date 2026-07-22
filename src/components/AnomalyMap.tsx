'use client';

import { MapPin, AlertTriangle } from 'lucide-react';

export default function AnomalyMap({ reports }: { reports: any[] }) {
  // 간단한 가상 좌표 매핑 (주요 지역 키워드별 화면 위치 %)
  const getLocationCoords = (loc: string) => {
    if (!loc) return { top: '50%', left: '50%' };
    if (loc.includes('서울')) return { top: '35%', left: '45%' };
    if (loc.includes('부산')) return { top: '80%', left: '75%' };
    if (loc.includes('제주')) return { top: '90%', left: '30%' };
    if (loc.includes('인천')) return { top: '33%', left: '38%' };
    if (loc.includes('대구')) return { top: '65%', left: '70%' };
    if (loc.includes('대전')) return { top: '55%', left: '50%' };
    if (loc.includes('광주')) return { top: '75%', left: '38%' };
    // 기본 랜덤 배치
    return { top: `${30 + (loc.length * 7) % 50}%`, left: `${20 + (loc.length * 11) % 60}%` };
  };

  const activeReports = reports.filter(r => r.location && r.location !== '자유 게시판');

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4 relative overflow-hidden">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-red-500">
          <AlertTriangle className="w-4 h-4 animate-pulse" />
          <span>전국 괴이 발생 레이더 지도 (ANOMALY RADAR)</span>
        </div>
        <span className="text-[10px] text-neutral-500">활성 경고 구역: {activeReports.length}곳</span>
      </div>

      {/* 가상 레이더 맵 박스 */}
      <div className="relative w-full h-64 bg-neutral-950 border border-neutral-800 rounded flex items-center justify-center overflow-hidden">
        {/* 레이더 스캔 효과선 */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(220,38,38,0.08)_10%,transparent_70%)] animate-pulse" />
        <div className="absolute w-full h-0.5 bg-red-900/30 top-1/2" />
        <div className="absolute h-full w-0.5 bg-red-900/30 left-1/2" />

        <div className="absolute bottom-3 left-3 text-[10px] text-neutral-600 font-mono">
          [RADAR ONLINE] KOREA PENINSULA SECTOR
        </div>

        {activeReports.map((r, idx) => {
          const pos = getLocationCoords(r.location);
          return (
            <div
              key={idx}
              style={{ top: pos.top, left: pos.left }}
              className="absolute group cursor-pointer -translate-x-1/2 -translate-y-1/2"
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute w-4 h-4 bg-red-600 rounded-full animate-ping opacity-75" />
                <MapPin className="w-5 h-5 text-red-500 relative z-10" />
              </div>

              {/* 호버 시 나타나는 위치 정보 툴팁 */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 w-40 bg-neutral-900 border border-red-900 p-2 rounded text-[10px] text-neutral-200 shadow-xl pointer-events-none">
                <p className="font-bold text-red-400 line-clamp-1">{r.title}</p>
                <p className="text-neutral-400">📍 {r.location}</p>
                <p className="text-yellow-400">{r.danger_level || 'LEVEL 1'}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}