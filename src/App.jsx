/*global chrome*/
import React, { useState, useEffect, useRef } from 'react';
import {
  Loader2, Zap, Target, Layers, BarChart3,
  ArrowRightLeft, CheckCircle2, AlertTriangle, ShieldCheck, Info, Copy, X, Settings
} from 'lucide-react';
import { amazonScraper, sourcingScraper } from './utils/scrapers';
import SettingsPanel from './components/SettingsPanel';

// ----------------------------------------------------------------
// 配置区域：NVIDIA NIM API
// API Key 应通过环境变量 VITE_NVIDIA_API_KEY 设置
// ----------------------------------------------------------------
const CONFIG = {
  BASE_URL: "https://integrate.api.nvidia.com/v1",
  API_KEY: import.meta.env.VITE_NVIDIA_API_KEY || "",
  // 使用 Llama 3.1 405B Instruct - NVIDIA 平台上最强大的开源模型之一，适合复杂推理
  MODEL: "meta/llama-3.1-405b-instruct"
};

const ArbitrageAgentPro = () => {
  const [targetUrl, setTargetUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [decisionData, setDecisionData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(7.23);
  const [apiKey, setApiKey] = useState(CONFIG.API_KEY);
  const [currentModel, setCurrentModel] = useState(CONFIG.MODEL);
  const [showSettings, setShowSettings] = useState(false);
  const logEndRef = useRef(null);

  const MODELS = [
    { id: "meta/llama-3.1-405b-instruct", name: "Llama 3.1 405B (Extreme Reasoning)" },
    { id: "meta/llama-3.3-70b-instruct", name: "Llama 3.3 70B (Pro Balanced)" },
    { id: "z-ai/glm-4-9b-instruct", name: "GLM-4 (CN Logic Expert)" },
    { id: "minimaxai/minimax-m2.1", name: "MiniMax M2.1 (Balanced)" },
    { id: "moonshotai/kimi-k2-thinking", name: "Kimi K2 (Deep Thinking)" },
    { id: "nvidia/llama-3.1-nemotron-70b-instruct", name: "Nemotron 70B (JSON Expert)" },
    { id: "google/gemma-2-9b-it", name: "Gemma 2 9B (Ultra Fast)" }
  ];

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['nvidia_api_key', 'pref_model'], (result) => {
        if (result.nvidia_api_key) setApiKey(result.nvidia_api_key);
        if (result.pref_model) setCurrentModel(result.pref_model);
      });
    }
  }, []);

  const saveSettings = () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ 
        nvidia_api_key: apiKey,
        pref_model: currentModel 
      }, () => {
        addLog("设置已保存", "success");
        setShowSettings(false);
      });
    } else {
      setShowSettings(false);
    }
  };

  // --- 自动获取当前 Tab URL ---
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          setTargetUrl(tabs[0].url);
        }
      });
    }
  }, []);

  // --- 日志自动滚动 ---
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { 
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" }), 
      message, 
      type 
    }]);
  };

  const copyToClipboard = () => {
    if (!decisionData) return;
    const text = `
    Arbitrage Analysis Report:
    Product: ${decisionData.title}
    Score: ${decisionData.score}
    Profit: $${decisionData.net_profit} (ROI: ${decisionData.roi})
    Action: ${decisionData.action_plan}
    `.trim();
    navigator.clipboard.writeText(text);
    addLog("报告已复制到剪贴板", "success");
  };

  const startAutonomousFlow = async () => {
    if (!targetUrl) {
      addLog("错误: 请先输入或打开一个目标商品链接", "error");
      return;
    }

    setIsAnalyzing(true);
    setLogs([]);
    setDecisionData(null);

    try {
      addLog("初始化 NVIDIA NIM 推理节点...", "system");
      addLog(`连接模型: ${currentModel.split('/')[1]}`, "system");
      
      addLog(`正在解析页面数据: ${new URL(targetUrl).hostname}...`, "info");
      
      let scrapedData = {};
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.scripting) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        addLog("正在注入智能抓取脚本...", "info");
        
        const executeWithRetry = async (attempts = 3) => {
          for (let i = 0; i < attempts; i++) {
            try {
              const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: targetUrl.includes('amazon.com') ? amazonScraper : sourcingScraper
              });
              const data = results[0].result;
              const hasPrice = targetUrl.includes('amazon.com') ? data.price : data.cost_cny;
              
              if (hasPrice) return data;
              
              addLog(`重试数据提取 (${i + 1}/${attempts})...`, "warning");
              await new Promise(r => setTimeout(r, 1500)); 
            } catch (e) {
              if (i === attempts - 1) throw e;
            }
          }
          return null;
        };

        scrapedData = await executeWithRetry();
      } else {
        addLog("非插件环境，使用本地测试数据", "warning");
        scrapedData = targetUrl.includes('amazon.com') 
          ? { title: "Amazon Test Product", price: 389.0, fba_fee: 48.5, weight: 42.0, bsr: 850 }
          : { cost_cny: 620.0, moq: 50, supplier_vetted: true, factory_location: "浙江省杭州市" };
      }

      if (!scrapedData || (targetUrl.includes('amazon.com') && !scrapedData.price) || (targetUrl.includes('1688.com') && !scrapedData.cost_cny)) {
        throw new Error("无法抓取关键价格数据，请确保页面加载完全。");
      }

      const amazonPayload = targetUrl.includes('amazon.com') ? scrapedData : {
        title: "Product from 1688 Sourcing",
        price: 389.00,
        fba_fee: 48.50,
        weight: 42.0, 
        bsr: 850,
      };

      const supplyPayload = targetUrl.includes('1688.com') ? scrapedData : {
        cost_cny: 620.00,
        moq: 50,
        supplier_vetted: true,
        factory_location: "浙江省杭州市"
      };

      addLog(`数据提取成功: ${amazonPayload.title.substring(0, 20)}...`, "success");

      addLog("正在上传数据至 NVIDIA GPU 集群进行审计...", "info");
      
      const systemPrompt = `你是一个专业的跨境电商套利审计专家。你必须严格遵守以下规则：
      1. 只能返回一个合法的、纯净的 JSON 对象。
      2. 严禁包含任何 Markdown 标记（如 \`\`\`json 或 \`\`\`）。
      3. 严禁包含任何前导或后置的文字说明、分析或评论。
      4. 所有字段必须严格按照给定的格式，严禁出现非 JSON 字符。
      
      返回格式示例：
      {
        "score": 85,
        "net_profit": "120.50",
        "margin": "30%",
        "roi": "110%",
        "break_even_units": 20,
        "market_status": "高潜",
        "swot": { "strengths": ["优势1", "优势2"], "threats": ["风险1", "风险2"] },
        "action_plan": "建议备货",
        "pricing_strategy": "$399-$429"
      }

      输入审计数据：
      - Amazon 售价: $${amazonPayload.price}
      - 采购成本: ¥${supplyPayload.cost_cny} (汇率: ${exchangeRate})
      - FBA 费用: $${amazonPayload.fba_fee}
      - 重量: ${amazonPayload.weight} lbs (物流预估 $1.15/lb)
      - 营销成本 (CAC): 售价的 12%
      - VAT 税率: 5%`;

      const userQuery = `执行审计并仅返回 JSON。`;

      const startTime = Date.now();
      let resJson;

      // --- 智能请求路由 ---
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        // [插件环境]
        addLog("正在通过后台安全隧道连接 NVIDIA...", "system");
        
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({
            action: "fetchNvidia",
            url: `${CONFIG.BASE_URL}/chat/completions`,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: {
              model: currentModel,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userQuery }
              ],
              temperature: 0.1, 
              top_p: 0.1,
              max_tokens: 1024,
              stream: false
            }
          }, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError.message);
            } else if (response && response.success) {
              resolve(response.data);
            } else {
              reject(response?.error || "Unknown error from background worker");
            }
          });
        });
        resJson = response;

      } else {
        // [本地开发环境] 使用 Vite 代理路径 /nvidia-api
        addLog("本地开发模式: 使用代理请求...", "system");
        const response = await fetch(`/nvidia-api/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: currentModel,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userQuery }
            ],
            temperature: 0.1,
            top_p: 0.1,
            max_tokens: 1024,
            stream: false
          })
        });
        
        if (!response.ok) {
           throw new Error(`API Error: ${response.status}`);
        }
        resJson = await response.json();
      }

      const endTime = Date.now();
      addLog(`推理完成 (${endTime - startTime}ms)`, "success");

      // --- 增强的 JSON 解析逻辑 ---
      let rawContent = resJson.choices[0].message.content.trim();
      
      // 尝试提取 JSON 部分（防止模型返回 "根据数据... {json} ..."）
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        rawContent = jsonMatch[0];
      }
      
      const analysis = JSON.parse(rawContent);
      setDecisionData({ ...amazonPayload, ...supplyPayload, ...analysis });
      addLog("决策报告已生成。", "success");

    } catch (err) {
      console.error(err);
      addLog(`执行中断: ${err.message}`, "error");
      setIsAnalyzing(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-[450px] h-[600px] bg-[#09090b] text-slate-200 font-sans overflow-hidden flex flex-col relative">
      {/* 背景装饰光效 */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 opacity-80"></div>
      
      {/* 顶部导航 */}
      <nav className="bg-white/[0.03] backdrop-blur-md px-4 py-3 shrink-0 border-b border-white/5 flex justify-between items-center z-10">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-600/20 p-1.5 rounded-lg border border-blue-500/30 text-blue-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-none">
              ARBITRAGE <span className="text-blue-500">NIM</span>
            </h1>
            <p className="text-[9px] text-slate-500 font-medium tracking-wide mt-0.5">POWERED BY NVIDIA</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
            <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-400 font-mono">
              ACTIVE
            </div>
        </div>
      </nav>

      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        currentModel={currentModel}
        setCurrentModel={setCurrentModel}
        models={MODELS}
        onSave={saveSettings}
      />

      {/* URL 输入区 */}
      <div className="p-4 shrink-0 z-10">
        <div className="relative group">
          <input 
            type="text" 
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="Enter Product URL..."
            className="w-full bg-[#18181b] border border-white/10 rounded-xl pl-4 pr-24 py-3 text-xs text-slate-200 outline-none focus:border-blue-500/50 focus:bg-[#1f1f23] transition-all placeholder:text-slate-600"
          />
          {targetUrl && (
            <button 
              onClick={() => setTargetUrl('')}
              className="absolute right-20 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button 
            onClick={startAutonomousFlow}
            disabled={isAnalyzing}
            className="absolute right-1 top-1 bottom-1 bg-blue-600 hover:bg-blue-500 text-white px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
          >
            {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 fill-current" />}
            RUN
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 z-10">
        
        {/* 日志终端 */}
        <div className="bg-[#121214] rounded-xl border border-white/5 overflow-hidden flex flex-col shadow-inner">
           <div className="px-3 py-2 bg-white/[0.02] border-b border-white/5 flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isAnalyzing ? 'bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-600'}`}></span> 
                System Kernel
              </span>
              <Layers className="w-3 h-3 text-slate-700" />
           </div>
           <div className="p-3 h-28 overflow-y-auto font-mono text-[10px] space-y-1.5 bg-black/20 text-slate-400">
              {logs.length === 0 && <div className="text-slate-700 italic opacity-50">System ready. Waiting for input...</div>}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2 animate-in fade-in slide-in-from-left-1 duration-200">
                  <span className="text-slate-700 shrink-0 select-none">[{log.time}]</span>
                  <span className={`break-all
                    ${log.type === 'success' ? 'text-emerald-400' : ''}
                    ${log.type === 'error' ? 'text-rose-400' : ''}
                    ${log.type === 'system' ? 'text-blue-400' : ''}
                    ${log.type === 'info' ? 'text-slate-400' : ''}
                  `}>
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
           </div>
        </div>

        {/* 结果面板 */}
        {!decisionData ? (
          <div className="flex flex-col items-center justify-center py-12 opacity-30 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
               <ShieldCheck className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-xs text-slate-500 font-medium">Ready for deep audit</p>
          </div>
        ) : (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* 核心指标卡 - 玻璃拟态 */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 p-4 rounded-2xl border border-white/10 flex justify-between items-center group">
              <div className="absolute inset-0 bg-blue-500/10 blur-3xl -z-10 group-hover:bg-blue-500/20 transition-all duration-700"></div>
              
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[9px] font-black text-blue-200/70 tracking-widest">PROFITABILITY SCORE</p>
                  <button onClick={copyToClipboard} className="text-blue-300/50 hover:text-blue-300 transition-colors">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <div className={`text-4xl font-black tracking-tight ${decisionData.score > 80 ? 'text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]' : 'text-amber-400'}`}>
                  {decisionData.score}
                </div>
              </div>
              
              <div className="text-right space-y-1">
                <div>
                  <span className="text-2xl font-bold text-emerald-400">${decisionData.net_profit}</span>
                  <span className="text-[10px] text-emerald-500/70 block font-medium">Net Profit / Unit</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-300">
                  <BarChart3 className="w-3 h-3 text-blue-400" /> 
                  ROI: <span className="text-white font-bold">{decisionData.roi}</span>
                </div>
              </div>
            </div>

            {/* SWOT 网格 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#18181b] p-3 rounded-xl border-l-2 border-l-blue-500 border-y border-r border-white/5">
                <h3 className="text-[9px] font-bold text-slate-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3 text-blue-500" /> Strengths
                </h3>
                <ul className="space-y-1.5">
                  {decisionData.swot.strengths.slice(0, 2).map((s, i) => (
                    <li key={i} className="text-[10px] text-slate-300 leading-tight flex items-start gap-1">
                      <span className="text-blue-500/50 mt-0.5">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#18181b] p-3 rounded-xl border-l-2 border-l-rose-500 border-y border-r border-white/5">
                <h3 className="text-[9px] font-bold text-slate-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertTriangle className="w-3 h-3 text-rose-500" /> Threats
                </h3>
                <ul className="space-y-1.5">
                  {decisionData.swot.threats.slice(0, 2).map((t, i) => (
                    <li key={i} className="text-[10px] text-slate-300 leading-tight flex items-start gap-1">
                      <span className="text-rose-500/50 mt-0.5">•</span> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 战略建议 */}
            <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 p-4 rounded-xl border border-emerald-500/20 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-3 opacity-10">
                 <ShieldCheck className="w-12 h-12 text-emerald-400" />
               </div>
               <h3 className="text-[9px] font-black text-emerald-500/80 tracking-widest mb-2 flex items-center gap-2 relative z-10">
                 STRATEGIC ACTION PLAN
               </h3>
               <p className="text-xs text-emerald-100 font-medium leading-relaxed relative z-10 italic">
                 "{decisionData.action_plan}"
               </p>
               <div className="mt-3 pt-3 border-t border-emerald-500/10 flex items-center gap-2 relative z-10">
                 <span className="text-[9px] text-emerald-400/70 font-bold uppercase">Pricing:</span>
                 <span className="text-[10px] text-white font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">
                   {decisionData.pricing_strategy}
                 </span>
               </div>
            </div>

          </div>
        )}
      </main>

      {/* 底部状态栏 */}
      <div className="px-4 py-2 bg-[#09090b] border-t border-white/5 flex justify-between items-center text-[9px] text-slate-600 shrink-0 z-10">
        <span className="flex items-center gap-1.5 group cursor-help">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
          <span className="group-hover:text-slate-400 transition-colors">NVIDIA NIM: ONLINE</span>
        </span>
        <span className="font-mono opacity-50">v2.0.1-RC</span>
      </div>
    </div>
  );
};

export default ArbitrageAgentPro;