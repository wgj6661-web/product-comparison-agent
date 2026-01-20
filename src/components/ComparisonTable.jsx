import React from 'react';
import { TrendingUp, Loader2 } from 'lucide-react';
import PlatformRow from './PlatformRow';

const ComparisonTable = ({ analyses, isLoading, progress }) => {
  if (isLoading) {
    return (
      <div className="bg-[#121214] rounded-xl border border-white/10 p-8 text-center relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20">
          <div className="h-full bg-blue-500 animate-[loading_2s_infinite_linear]"></div>
        </div>
        <div className="relative z-10">
          <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)] animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
          <p className="text-[10px] font-mono text-blue-400 uppercase tracking-widest mb-1">Processing Analysis</p>
          <p className="text-xs text-slate-300 font-medium h-4">{progress || 'Establishing neural link...'}</p>
          
          <div className="mt-6 flex justify-center gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className={`w-1 h-1 rounded-full bg-blue-500/40 animate-bounce`} style={{ animationDelay: `${i * 150}ms` }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <div className="bg-[#121214] rounded-xl border border-white/5 p-6 text-center animate-in fade-in zoom-in duration-500">
        <TrendingUp className="w-8 h-8 mx-auto mb-3 text-slate-600" />
        <p className="text-xs text-slate-500">No comparison data yet</p>
        <p className="text-[10px] text-slate-600 mt-1">
          Click RUN to analyze products across multiple platforms
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between px-3">
        <h3 className="text-xs font-bold text-blue-400 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Global Opportunity Scan
        </h3>
        <span className="text-[9px] text-slate-500 font-mono">
          NODES: {analyses.length} / STATUS: COMPLETE
        </span>
      </div>

      {/* Table Header */}
      <div className="flex items-center gap-2 px-3 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
        <div className="w-6"></div>
        <div className="flex-1">Platform</div>
        <div className="w-16 text-right">Price</div>
        <div className="w-16 text-right">Profit</div>
        <div className="w-12 text-right">ROI</div>
        <div className="w-4"></div>
      </div>

      {/* Platform Rows */}
      <div className="space-y-2">
        {analyses.map((analysis, index) => (
          <div 
            key={analysis.platformId} 
            className="animate-in fade-in slide-in-from-right-4 fill-mode-both"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <PlatformRow
              analysis={analysis}
              rank={index + 1}
            />
          </div>
        ))}
      </div>

      {/* Summary */}
      {analyses.length > 0 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-500/20">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400">Best Platform:</span>
            <span className="text-white font-bold">{analyses[0].platformName}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] mt-1">
            <span className="text-slate-400">Best ROI:</span>
            <span className="text-emerald-400 font-bold">{analyses[0].metrics.roi}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonTable;
