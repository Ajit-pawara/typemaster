import React from 'react';

interface HeatmapProps {
  errorKeys: Record<string, number>;
}

export const Heatmap: React.FC<HeatmapProps> = ({ errorKeys = {} }) => {
  const keyboardRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  // Helper to determine background color based on error count
  const getKeyColor = (key: string) => {
    const count = errorKeys[key] || 0;
    if (count === 0) return 'bg-canvas-soft-2 text-body border-hairline';
    if (count <= 2) return 'bg-brand-cyan-soft text-brand-cyan border-brand-cyan/30';
    if (count <= 5) return 'bg-warning-soft text-warning border-warning/30';
    return 'bg-brand-pink-soft text-brand-pink border-brand-pink/30 font-semibold';
  };

  const totalErrors = Object.values(errorKeys).reduce((sum, current) => sum + current, 0);

  return (
    <div className="w-full p-6 border border-hairline bg-canvas-soft rounded-lg shadow-level-2">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-sm font-semibold text-ink">Key Error Heatmap</h3>
          <p className="text-xs text-body">Visualizes keys missed during typing tests.</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono text-body">
            Total Mistype Keys: <span className="text-ink font-semibold">{totalErrors}</span>
          </div>
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="flex items-center space-x-4 mb-6 text-[10px] font-mono text-mute">
        <div className="flex items-center space-x-1">
          <span className="w-3 h-3 rounded border border-hairline bg-canvas-soft-2 inline-block"></span>
          <span>0 errors</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-3 h-3 rounded border border-brand-cyan/30 bg-brand-cyan-soft inline-block"></span>
          <span>1-2 errors</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-3 h-3 rounded border border-warning/30 bg-warning-soft inline-block"></span>
          <span>3-5 errors</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-3 h-3 rounded border border-brand-pink/30 bg-brand-pink-soft inline-block"></span>
          <span>6+ errors</span>
        </div>
      </div>

      {/* Keyboard Grid */}
      <div className="flex flex-col space-y-2 max-w-2xl mx-auto font-mono">
        {keyboardRows.map((row, rowIndex) => (
          <div 
            key={rowIndex} 
            className="flex justify-center space-x-1.5"
            style={{ paddingLeft: rowIndex === 1 ? '1.5rem' : rowIndex === 2 ? '3rem' : '0' }}
          >
            {row.map(key => {
              const count = errorKeys[key] || 0;
              return (
                <div
                  key={key}
                  title={`${key.toUpperCase()}: ${count} error${count !== 1 ? 's' : ''}`}
                  className={`w-9 h-9 md:w-11 md:h-11 rounded flex flex-col items-center justify-center text-xs md:text-sm border transition-all relative group cursor-help select-none ${getKeyColor(key)}`}
                >
                  <span className="uppercase">{key}</span>
                  {count > 0 && (
                    <span className="text-[8px] absolute bottom-0.5 right-0.5 opacity-60">
                      {count}
                    </span>
                  )}
                  {/* Hover tooltip */}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-zinc-950 text-white text-[9px] py-0.5 px-1.5 rounded border border-hairline whitespace-nowrap z-10 font-sans shadow-level-3">
                    {count} error{count !== 1 ? 's' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
export default Heatmap;
