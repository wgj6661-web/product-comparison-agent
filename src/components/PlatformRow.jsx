import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

const PlatformRow = ({ analysis, rank, onViewDetails }) => {
  const [expanded, setExpanded] = useState(false);
  const { platformName, product, metrics } = analysis;

  const roiValue = parseFloat(metrics.roi);

  // Determine background color based on ROI
  let bgClass = 'bg-slate-900/20';
  if (roiValue > 150) bgClass = 'bg-emerald-900/20';
  else if (roiValue > 100) bgClass = 'bg-blue-900/20';
  else if (roiValue > 50) bgClass = 'bg-yellow-900/20';

  const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';

  return (
    <div className={`${bgClass} border border-white/5 rounded-lg overflow-hidden transition-all`}>
      {/* Main Row */}
      <div className="flex items-center gap-2 p-3 text-[10px]">
        <div className="w-6 text-center text-xs">{medalEmoji}</div>

        <div className="flex-1 min-w-0">
          <div className="font-bold text-white truncate">{platformName}</div>
          <div className="text-slate-500 text-[9px] truncate">{product.title}</div>
        </div>

        <div className="text-right">
          <div className="text-blue-400 font-mono">${product.price.toFixed(2)}</div>
        </div>

        <div className="text-right">
          <div className="text-emerald-400 font-mono">${metrics.netProfit}</div>
        </div>

        <div className="text-right">
          <div className={`font-bold ${roiValue > 100 ? 'text-emerald-400' : 'text-yellow-400'}`}>
            {metrics.roi}
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 hover:bg-white/5 rounded transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-white/5 p-3 space-y-2 bg-black/20 text-[10px]">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-500">Source Cost:</span>
              <span className="text-blue-400 ml-2">${metrics.costs.sourceCost.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-500">Shipping:</span>
              <span className="text-blue-400 ml-2">${metrics.costs.shipping.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-500">Platform Fee:</span>
              <span className="text-blue-400 ml-2">${metrics.costs.platformFee.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-500">Marketing:</span>
              <span className="text-blue-400 ml-2">${metrics.costs.marketing.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-500">VAT:</span>
              <span className="text-blue-400 ml-2">${metrics.costs.vat.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-500">Margin:</span>
              <span className="text-emerald-400 ml-2">{metrics.margin}</span>
            </div>
          </div>

          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            View Product
          </a>
        </div>
      )}
    </div>
  );
};

export default PlatformRow;
