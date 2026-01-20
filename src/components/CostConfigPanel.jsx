import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';
import { loadCostConfig, saveCostConfig, DEFAULT_COST_CONFIG } from '../config/costConfig';

const CostConfigPanel = ({ isOpen, onClose, onSave }) => {
  const [config, setConfig] = useState(DEFAULT_COST_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadCostConfig().then(loadedConfig => {
        setConfig(loadedConfig);
        setLoading(false);
      });
    }
  }, [isOpen]);

  const handleSave = async () => {
    await saveCostConfig(config);
    onSave(config);
    onClose();
  };

  const handleReset = () => {
    setConfig(DEFAULT_COST_CONFIG);
  };

  const updateExchange = (value) => {
    setConfig(prev => ({
      ...prev,
      exchange: { ...prev.exchange, cnyToUsd: parseFloat(value) || 7.23 }
    }));
  };

  const updateShipping = (region, value) => {
    setConfig(prev => ({
      ...prev,
      shipping: { ...prev.shipping, [region]: parseFloat(value) || 0 }
    }));
  };

  const updatePlatformFee = (platform, value) => {
    setConfig(prev => ({
      ...prev,
      platformFees: { ...prev.platformFees, [platform]: parseFloat(value) || 0 }
    }));
  };

  if (!isOpen) return null;
  if (loading) return null;

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto p-4">
      <div className="max-w-md mx-auto bg-[#18181b] rounded-2xl border border-white/10 p-5 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-emerald-500" />
          <h2 className="text-sm font-bold text-white">Cost Configuration</h2>
        </div>

        <div className="space-y-4 text-xs">
          {/* Exchange Rate */}
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold mb-2 block">
              CNY to USD Exchange Rate
            </label>
            <input
              type="number"
              step="0.01"
              value={config.exchange.cnyToUsd}
              onChange={(e) => updateExchange(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-blue-400 outline-none focus:border-blue-500/50"
            />
          </div>

          {/* Shipping Costs */}
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold mb-2 block">
              Shipping Costs ($/lb)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] text-slate-600 block mb-1">USA</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.shipping.usa}
                  onChange={(e) => updateShipping('usa', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-blue-400 outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-600 block mb-1">Europe</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.shipping.europe}
                  onChange={(e) => updateShipping('europe', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-blue-400 outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-600 block mb-1">Other</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.shipping.other}
                  onChange={(e) => updateShipping('other', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-blue-400 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Platform Fees */}
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold mb-2 block">
              Platform Fees (%)
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {Object.entries(config.platformFees)
                .filter(([key]) => key !== 'amazon')
                .map(([platform, fee]) => (
                  <div key={platform} className="flex items-center justify-between">
                    <span className="text-slate-400 capitalize">{platform}</span>
                    <input
                      type="number"
                      step="0.1"
                      value={fee}
                      onChange={(e) => updatePlatformFee(platform, e.target.value)}
                      className="w-20 bg-black/40 border border-white/10 rounded px-2 py-1 text-blue-400 outline-none"
                    />
                  </div>
                ))}
            </div>
          </div>

          {/* Marketing & VAT */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold mb-2 block">
                Marketing CAC (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={config.marketing}
                onChange={(e) => setConfig(prev => ({ ...prev, marketing: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-blue-400 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold mb-2 block">
                VAT/Tax (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={config.vat}
                onChange={(e) => setConfig(prev => ({ ...prev, vat: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-blue-400 outline-none"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold mb-2 block">
                Min ROI (%)
              </label>
              <input
                type="number"
                step="1"
                value={config.filters.minRoi}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  filters: { ...prev.filters, minRoi: parseFloat(e.target.value) || 0 }
                }))}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-blue-400 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold mb-2 block">
                Min Score
              </label>
              <input
                type="number"
                step="1"
                value={config.filters.minScore}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  filters: { ...prev.filters, minScore: parseFloat(e.target.value) || 0 }
                }))}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-blue-400 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleReset}
            className="px-4 bg-white/5 hover:bg-white/10 text-slate-300 py-2 rounded-xl text-xs font-bold transition-all"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold transition-all"
          >
            Save Configuration
          </button>
          <button
            onClick={onClose}
            className="px-4 bg-white/5 hover:bg-white/10 text-slate-300 py-2 rounded-xl text-xs font-bold transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CostConfigPanel;
