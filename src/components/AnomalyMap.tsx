'use client';

import { useState, useRef } from 'react';
import { MapPin, AlertTriangle, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface AnomalyMapProps {
  reports: any[];
  onSelectReport: (report: any) => void;
}

export default function AnomalyMap({ reports, onSelectReport }: AnomalyMapProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  const getLocationCoords = (loc: string) => {
    if (!loc) return { top: 50, left: 50 };
    if (loc.includes('서울')) return { top: 35, left: 45 };
    if (loc.includes('부산')) return { top: 80, left: 75 };
    if (loc.includes('제주')) return { top: 90, left: 30 };
    if (loc.includes('인천')) return { top: 33, left: 38 };
    if (loc.includes('대구')) return { top: 65, left: 70 };
    if (loc.includes('대전')) return { top: 55, left: 50 };
    if (loc.includes('광주')) return { top: 75, left: 38 };
    return { top: 30 + (loc.length * 7) % 50, left: 20 + (loc.length * 11) % 60 };
  };

  const activeReports = reports.filter(r => r.location && r.location !== '자유 게시판');

  // 마우스 드래그로 지도 이동 (패닝) 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.3, 2.5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.3, 0.8));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4 relative overflow-hidden">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-red-500">
          <AlertTriangle className="w-4 h-4 animate-pulse" />
          <span>전국 괴이 발생 레이더 지도 (ANOMALY RADAR)</span>
        </div>

        {/* 💡 지도 조작 버튼 (확대, 축소, 초기화) */}
        <div className="flex items-center space-x-1.5">
          <button onClick={handleZoomIn} title="확대" className="p-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded text-neutral-300 cursor-pointer">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleZoomOut} title="축소" className="p-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded text-neutral-300 cursor-pointer">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleReset} title="초기화" className="p-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded text-neutral-300 cursor-pointer">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-neutral-500 ml-2">활성 구역: {activeReports.length}곳 (드래그 이동 가능)</span>
        </div>
      </div>

      {/* 💡 드래그 및 이동 가능한 맵 컨테이너 */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative w-full h-80 bg-neutral-950 border border-neutral-800 rounded flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none"
      >
        <div 
          className="absolute inset-0 transition-transform duration-75 ease-out flex items-center justify-center"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(220,38,38,0.08)_10%,transparent_70%)] animate-pulse pointer-events-none" />
          <div className="absolute w-[200%] h-0.5 bg-red-900/30 top-1/2 pointer-events-none" />
          <div className="absolute h-[200%] w-0.5 bg-red-900/30 left-1/2 pointer-events-none" />

          <div className="absolute bottom-6 left-6 text-[10px] text-neutral-600 font-mono pointer-events-none z-0">
            [RADAR ONLINE] KOREA PENINSULA SECTOR (PAN & ZOOM READY)
          </div>

          {activeReports.map((r, idx) => {
            const coords = getLocationCoords(r.location);
            const isNearBottom = coords.top > 65; // 핀이 아래쪽에 있으면 툴팁을 위로 띄움

            return (
              <div
                key={idx}
                style={{ top: `${coords.top}%`, left: `${coords.left}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectReport(r);
                }}
                className="absolute group cursor-pointer -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-transform z-20"
              >
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-5 h-5 bg-red-600 rounded-full animate-ping opacity-75" />
                  <MapPin className="w-6 h-6 text-red-500 relative z-10 filter drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                </div>

                {/* 💡 스마트 툴팁: 아래쪽에 있는 핀은 위로(bottom-full), 위쪽에 있는 핀은 아래로(top-full) 뜸 */}
                <div className={`absolute left-1/2 -translate-x-1/2 hidden group-hover:block z-40 w-44 bg-neutral-900 border border-red-900 p-2.5 rounded text-[10px] text-neutral-200 shadow-2xl pointer-events-none ${
                  isNearBottom ? 'bottom-full mb-2' : 'top-full mt-2'
                }`}>
                  <p className="font-bold text-red-400 line-clamp-1">{r.title}</p>
                  <p className="text-neutral-400">📍 {r.location}</p>
                  <p className="text-yellow-400 font-bold">{r.danger_level || 'LEVEL 1'}</p>
                  <p className="text-[9px] text-red-500 mt-1">[클릭하여 문서 열람]</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}