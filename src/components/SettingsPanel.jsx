import React from 'react';
import { X } from 'lucide-react';

const SettingsPanel = ({
  isOpen,
  onClose,
  apiKey,
  setApiKey,
  currentModel,
  setCurrentModel,
  models,
  onSave
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="w-full bg-[#18181b] rounded-2xl border border-white/10 p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white">API Configuration</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold mb-1.5 block">
              NVIDIA API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-blue-400 outline-none focus:border-blue-500/50"
              placeholder="nvapi-..."
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold mb-1.5 block">
              AI Inference Model
            </label>
            <select
              value={currentModel}
              onChange={(e) => setCurrentModel(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-blue-400 outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
            >
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onSave}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-xs font-bold transition-all"
            >
              Save Settings
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
    </div>
  );
};

export default SettingsPanel;
