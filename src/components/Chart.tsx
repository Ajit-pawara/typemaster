import React, { useState } from 'react';

interface HistoryItem {
  wpm: number;
  accuracy: number;
  createdAt: string | Date;
  mode?: string;
}

interface ChartProps {
  history: HistoryItem[];
}

export const Chart: React.FC<ChartProps> = ({ history = [] }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (history.length === 0) {
    return (
      <div className="w-full h-64 border border-hairline bg-canvas-soft rounded-lg flex items-center justify-center text-xs text-body font-mono">
        No test history recorded yet. Complete some typing tests to view your progression!
      </div>
    );
  }

  // Cap visible points to 15 to keep the chart clean, but show the most recent 15
  const chartData = [...history]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-15);

  const width = 600;
  const height = 220;
  const paddingX = 40;
  const paddingY = 25;

  const wpms = chartData.map(d => d.wpm);

  const maxWpm = Math.max(...wpms, 60); // min ceiling of 60
  const minWpm = Math.max(0, Math.min(...wpms) - 10); // scale slightly below min
  
  const getX = (index: number) => {
    if (chartData.length <= 1) return width / 2;
    return paddingX + (index * (width - paddingX * 2)) / (chartData.length - 1);
  };

  const getY = (wpm: number) => {
    const range = maxWpm - minWpm;
    if (range === 0) return height / 2;
    return height - paddingY - ((wpm - minWpm) * (height - paddingY * 2)) / range;
  };

  // Generate WPM Path
  let wpmPath = '';
  let wpmAreaPath = '';
  
  if (chartData.length > 0) {
    wpmPath = `M ${getX(0)} ${getY(chartData[0].wpm)}`;
    wpmAreaPath = `M ${getX(0)} ${height - paddingY} L ${getX(0)} ${getY(chartData[0].wpm)}`;
    
    for (let i = 1; i < chartData.length; i++) {
      wpmPath += ` L ${getX(i)} ${getY(chartData[i].wpm)}`;
      wpmAreaPath += ` L ${getX(i)} ${getY(chartData[i].wpm)}`;
    }
    wpmAreaPath += ` L ${getX(chartData.length - 1)} ${height - paddingY} Z`;
  }

  return (
    <div className="w-full p-6 border border-hairline bg-canvas-soft rounded-lg shadow-level-2">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-sm font-semibold text-ink">WPM Progression</h3>
          <p className="text-xs text-body">Track your speed improvements over your last {chartData.length} tests.</p>
        </div>
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-cyan inline-block"></span>
            <span className="text-body">WPM</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full relative overflow-visible">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#50e3c2" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#50e3c2" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines (Horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const wpmVal = Math.round(minWpm + (maxWpm - minWpm) * ratio);
            const y = getY(wpmVal);
            return (
              <g key={idx}>
                <line 
                  x1={paddingX} 
                  y1={y} 
                  x2={width - paddingX} 
                  y2={y} 
                  stroke="var(--color-hairline)" 
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <text 
                  x={paddingX - 10} 
                  y={y + 4} 
                  fill="var(--color-mute)" 
                  fontSize="9" 
                  fontFamily="JetBrains Mono" 
                  textAnchor="end"
                >
                  {wpmVal}
                </text>
              </g>
            );
          })}

          {/* Chart Area Fill */}
          {wpmAreaPath && (
            <path d={wpmAreaPath} fill="url(#chartGradient)" />
          )}

          {/* Chart Stroke Line */}
          {wpmPath && (
            <path 
              d={wpmPath} 
              fill="none" 
              stroke="var(--color-brand-cyan)" 
              strokeWidth="2" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points */}
          {chartData.map((data, idx) => {
            const cx = getX(idx);
            const cy = getY(data.wpm);
            const isHovered = hoveredIndex === idx;

            return (
              <g 
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                <circle 
                  cx={cx} 
                  cy={cy} 
                  r={isHovered ? 6 : 4} 
                  fill="var(--color-canvas)" 
                  stroke="var(--color-brand-cyan)" 
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all"
                />
                
                {/* Vertical marker line on hover */}
                {isHovered && (
                  <line 
                    x1={cx} 
                    y1={paddingY} 
                    x2={cx} 
                    y2={height - paddingY} 
                    stroke="var(--color-brand-cyan)" 
                    strokeWidth="1" 
                    strokeDasharray="2,2" 
                    opacity="0.5"
                  />
                )}
              </g>
            );
          })}

          {/* X-Axis labels (Indices or Dates) */}
          {chartData.map((data, idx) => {
            // Only show labels for every few points to avoid crowding
            if (chartData.length > 6 && idx % 2 !== 0 && idx !== chartData.length - 1) return null;
            
            const date = new Date(data.createdAt);
            const label = `${date.getMonth() + 1}/${date.getDate()}`;
            
            return (
              <text 
                key={idx}
                x={getX(idx)} 
                y={height - 8} 
                fill="var(--color-mute)" 
                fontSize="9" 
                fontFamily="JetBrains Mono" 
                textAnchor="middle"
              >
                {label}
              </text>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIndex !== null && chartData[hoveredIndex] && (
          <div 
            className="absolute bg-zinc-950 border border-hairline p-2 rounded shadow-level-3 font-mono text-[10px] pointer-events-none transition-all z-10"
            style={{
              left: `${(getX(hoveredIndex) / width) * 100}%`,
              top: `${(getY(chartData[hoveredIndex].wpm) / height) * 100 - 30}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="text-white font-semibold">{chartData[hoveredIndex].wpm} WPM</div>
            <div className="text-body">{chartData[hoveredIndex].accuracy}% Accuracy</div>
            {chartData[hoveredIndex].mode && (
              <div className="text-mute uppercase text-[8px] mt-0.5">{chartData[hoveredIndex].mode}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default Chart;
