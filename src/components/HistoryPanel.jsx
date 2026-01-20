import React, { useState, useEffect } from 'react';
import { X, Clock, Trash2, ChevronRight, Search } from 'lucide-react';
import { getHistory, clearHistory } from '../services/historyService';

const HistoryPanel = ({ isOpen, onClose, onLoadHistory }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    const data = await getHistory();
    setHistory(data);
  };

  const handleClear = () => {
    if (window.confirm('Clear all history?')) {
      clearHistory();
      setHistory([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-[#09090b] z-50 flex flex-col animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2 text-slate-200">
          <Clock className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold">Analysis History</h2>
        </div>
        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <button 
              onClick={handleClear}
              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors"
              title="Clear History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 ? (
          <div className="text-center mt-20 text-slate-600">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-xs">No history records found</p>
          </div>
        ) : (
          history.map((item) => (
            <div 
              key={item.id}
              onClick={() => {
                onLoadHistory(item.details); // Pass data back to app
                onClose();
              }}
              className="bg-[#18181b] border border-white/5 rounded-lg p-3 cursor-pointer hover:border-blue-500/30 hover:bg-[#1f1f23] transition-all group"
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-xs font-bold text-slate-200 line-clamp-1 flex-1 pr-2">{item.product}</h3>
                <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                   {new Date(item.timestamp).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-2">
                   <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                     {item.platform}
                   </span>
                </div>
                <div className="flex items-center gap-1 group-hover:text-emerald-400 transition-colors">
                  <span className="font-mono">ROI: {item.roi}</span>
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
