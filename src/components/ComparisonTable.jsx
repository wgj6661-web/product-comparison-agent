import React from 'react';
import { TrendingUp, Loader2 } from 'lucide-react';
import PlatformRow from './PlatformRow';

const ComparisonTable = ({ analyses, isLoading, progress }) => {
  if (isLoading) {
    return (
      <div className="bg-[#121214] rounded-xl border border-white/5 p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
        <p className="text-xs text-slate-400">{progress || 'Analyzing platforms...'}</p>
      </div>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <div className="bg-[#121214] rounded-xl border border-white/5 p-6 text-center">
        <TrendingUp className="w-8 h-8 mx-auto mb-3 text-slate-600" />
        <p className="text-xs text-slate-500">No comparison data yet</p>
        <p className="text-[10px] text-slate-600 mt-1">
          Click RUN to analyze products across multiple platforms
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-3">
        <h3 className="text-xs font-bold text-blue-400 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Platform Comparison
        </h3>
        <span className="text-[9px] text-slate-500">
          {analyses.length} platforms analyzed
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
          <PlatformRow
            key={analysis.platformId}
            analysis={analysis}
            rank={index + 1}
          />
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
