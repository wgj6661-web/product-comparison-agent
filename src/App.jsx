/*global chrome*/
import React, { useState, useEffect, useRef } from 'react';
import {
  Loader2, Zap, Target, Layers, BarChart3, Clock,
  ArrowRightLeft, CheckCircle2, AlertTriangle, ShieldCheck, Info, Copy, X, Settings, DollarSign
} from 'lucide-react';
import { amazonScraper, sourcingScraper, genericScraper } from './utils/scrapers';
import SettingsPanel from './components/SettingsPanel';
import CostConfigPanel from './components/CostConfigPanel';
import ComparisonTable from './components/ComparisonTable';
import LoginScreen from './components/LoginScreen';
import HistoryPanel from './components/HistoryPanel';
import { DEFAULT_COST_CONFIG } from './config/costConfig';
import { getEnabledPlatforms } from './config/platforms';
import { extractKeywords, buildSearchQuery } from './utils/keywordExtractor';
import { searchMultiplePlatforms, isExtensionEnvironment } from './utils/tabManager';
import { calculateAllPlatformProfits } from './utils/profitCalculator';
import { saveHistory } from './services/historyService';

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [decisionData, setDecisionData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(7.23);
  const [apiKey, setApiKey] = useState(CONFIG.API_KEY);
  const [currentModel, setCurrentModel] = useState(CONFIG.MODEL);
  const [showSettings, setShowSettings] = useState(false);
  const [costConfig, setCostConfig] = useState(DEFAULT_COST_CONFIG);
  const [showCostConfig, setShowCostConfig] = useState(false);
  const [platformAnalyses, setPlatformAnalyses] = useState([]);
  const [searchProgress, setSearchProgress] = useState('');
  const [productWeight, setProductWeight] = useState(0);
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
      chrome.storage.local.get(['nvidia_api_key', 'pref_model', 'is_logged_in', 'user_name'], (result) => {
        if (result.nvidia_api_key) setApiKey(result.nvidia_api_key);
        if (result.pref_model) setCurrentModel(result.pref_model);
        if (result.is_logged_in) {
          setIsLoggedIn(true);
          setUser({ name: result.user_name });
        }
      });
    }
  }, []);

  const handleLogin = (username) => {
    setIsLoggedIn(true);
    setUser({ name: username });
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ is_logged_in: true, user_name: username });
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ is_logged_in: false });
    }
    setShowSettings(false);
  };

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
        if (tabs[0]?.url && !tabs[0].url.startsWith('chrome://')) {
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

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const startAutonomousFlow = async () => {
    if (!targetUrl) {
      addLog("错误: 请先输入或打开一个目标商品链接", "error");
      return;
    }

    setIsAnalyzing(true);
    setLogs([]);
    setDecisionData(null);
    setPlatformAnalyses([]);
    setSearchProgress('Initializing Neural Engine...');

    try {
      addLog("正在初始化 Multi-Platform 深度分析系统...", "system");
      await sleep(600);
      addLog(`建立模型连接: ${currentModel.split('/')[1]}`, "system");
      await sleep(400);
      addLog("神经网络链路已就绪，准备注入抓取算子...", "system");
      await sleep(800);

      // Step 1: Extract product info from current page
      addLog(`正在解析目标页面数据: ${new URL(targetUrl).hostname}...`, "info");
      setSearchProgress('Scraping page data...');

      let scrapedData = {};
      let productTitle = '';
      let weight = 42.0; // Default weight

      if (isExtensionEnvironment()) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        addLog("正在注入智能抓取脚本...", "info");

        addLog("正在注入智能抓取脚本...", "info");

        const executeWithRetry = async (attempts = 3) => {
          for (let i = 0; i < attempts; i++) {
            try {
              let scraperFunc = genericScraper;
              if (targetUrl.includes('amazon.com')) scraperFunc = amazonScraper;
              else if (targetUrl.includes('1688.com')) scraperFunc = sourcingScraper;

              const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: scraperFunc
              });
              const data = results[0].result;

              // Validate data (less strict for generic sites)
              if (data && (data.title || data.price)) {
                return data;
              }

              addLog(`重试数据提取 (${i + 1}/${attempts})...`, "warning");
              await sleep(1500);
            } catch (e) {
              if (i === attempts - 1) throw e;
            }
          }
          return null;
        };

        scrapedData = await executeWithRetry();

        if (!scrapedData) {
          throw new Error("无法抓取关键数据，请确保页面加载完全。");
        }

        productTitle = scrapedData.title || 'Unknown Product';
        weight = scrapedData.weight || 42.0;

      } else {
        // Non-extension environment: use test data
        addLog("非插件环境，切换至仿真沙盒模式", "warning");
        await sleep(1000);
        scrapedData = targetUrl.includes('amazon.com')
          ? { title: "Wireless Bluetooth Headphones Noise Cancelling", price: 389.0, fba_fee: 48.5, weight: 42.0, bsr: 850 }
          : { title: "蓝牙耳机降噪无线", cost_cny: 620.0, moq: 50, supplier_vetted: true, factory_location: "浙江省杭州市" };

        productTitle = scrapedData.title;
        weight = scrapedData.weight || 42.0;
      }

      setProductWeight(weight);
      addLog(`产品解析完成: ${productTitle.substring(0, 32)}...`, "success");
      await sleep(600);

      // Step 2: AI Keyword Extraction
      addLog("计算最优搜索向量...", "info");
      setSearchProgress('Extracting semantic keywords...');
      await sleep(400);

      let extractedKeywords;
      try {
        extractedKeywords = await extractKeywords(productTitle, apiKey, currentModel);
        addLog(`语义关键词提取成功: "${extractedKeywords.keywords}"`, "success");
      } catch (error) {
        addLog(`关键词提取失败，降级至原始模式: ${error.message}`, "warning");
        extractedKeywords = { keywords: productTitle.substring(0, 50), category: '', brand: '' };
      }

      const searchQuery = buildSearchQuery(extractedKeywords, false);
      addLog(`构造跨平台检索式: "${searchQuery}"`, "info");
      await sleep(800);

      // Step 3: Multi-Platform Search
      const enabledPlatforms = getEnabledPlatforms();
      const platformIds = enabledPlatforms.map(p => p.id);

      addLog(`启动多线程并发检索 (共 ${platformIds.length} 个节点)...`, "system");
      setSearchProgress(`Scanning global platforms...`);

      let allPlatformResults = {};

      if (isExtensionEnvironment()) {
        // Real extension environment: use tab manager
        const { results, errors } = await searchMultiplePlatforms(
          platformIds,
          searchQuery,
          (platformId, msg) => {
            addLog(`[${platformId}] ${msg}`, "info");
            setSearchProgress(`Active: ${platformId}...`);
          },
          3 // Batch size reduced for a more "active" feel (not all at once)
        );

        allPlatformResults = results;

        // Log any errors
        Object.entries(errors).forEach(([platformId, error]) => {
          addLog(`[${platformId}] 节点响应延迟: ${error}`, "error");
        });

      } else {
        // Non-extension environment: use mock data with simulated delay
        addLog("正在从分布式节点同步数据...", "info");
        
        // Simulated delayed loading
        for (const pid of platformIds) {
          addLog(`[${pid}] 数据包同步中...`, "info");
          await sleep(Math.random() * 500 + 300);
        }

        allPlatformResults = {
          'amazon': [
            { title: 'Bluetooth Headphones Premium', price: 399.99, currency: 'USD', url: 'https://amazon.com/test', rating: 4.5 }
          ],
          'ebay': [
            { title: 'Wireless Headphones Pro', price: 379.99, currency: 'USD', url: 'https://ebay.com/test', rating: 4.3 }
          ],
          'aliexpress': [
            { title: 'Bluetooth Headset', price: 89.99, currency: 'USD', url: 'https://aliexpress.com/test', rating: 4.2 }
          ],
          '1688': [
            { title: '蓝牙耳机', price: 620, currency: 'CNY', url: 'https://1688.com/test', rating: 4.0 }
          ],
          'taobao': [
            { title: '无线降噪耳机', price: 580, currency: 'CNY', url: 'https://taobao.com/test', rating: 4.1 }
          ],
          'alibaba': [
            { title: 'Wireless Headphones Wholesale', price: 480, currency: 'CNY', url: 'https://alibaba.com/test', rating: 4.0 }
          ],
          'walmart': [],
          'jd': [],
          'pinduoduo': []
        };
      }

      await sleep(1000);
      addLog("数据同步完成，进入利润分析引擎...", "system");

      // Step 4: Calculate profit metrics for all platforms
      setSearchProgress('Running profit engine...');
      await sleep(600);

      let analyses = [];
      try {
        analyses = calculateAllPlatformProfits(
          allPlatformResults,
          weight,
          costConfig
        );

        addLog(`策略挖掘完成: 成功识别 ${analyses.length} 个套利机会`, "success");
      } catch (error) {
        addLog(`风险控制模块报错: ${error.message}`, "error");
        analyses = [];
      }

      // Step 5: Update UI with results
      await sleep(800);
      setPlatformAnalyses(analyses);
      setSearchProgress('');

      if (analyses.length > 0) {
        addLog(`最优路径确定: ${analyses[0].platformName} (预期 ROI: ${analyses[0].metrics.roi})`, "success");
        addLog("点击下方表格查看详细套利计划", "system");
        
        // Save to History
        try {
          saveHistory({
            productTitle,
            bestPlatform: analyses[0].platformName,
            bestRoi: analyses[0].metrics.roi,
            analyses: analyses 
          });
        } catch (historyError) {
          console.error("Failed to save history:", historyError);
          // Don't crash the app if history saving fails
        }
      } else {
        addLog("扫描完毕: 当前市场条件下未发现高价值机会", "warning");
      }

    } catch (err) {
      console.error(err);
      addLog(`系统内核中断: ${err.message}`, "error");
    } finally {
      setIsAnalyzing(false);
      setSearchProgress('');
    }
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

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
        <div className="flex items-center gap-1">
            <button
              onClick={() => setShowHistory(true)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
              title="History"
            >
              <Clock className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowCostConfig(true)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
              title="Cost Configuration"
            >
              <DollarSign className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
            <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-400 font-mono">
              {user?.name || 'ADMIN'}
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
        onLogout={handleLogout}
      />

      <CostConfigPanel
        isOpen={showCostConfig}
        onClose={() => setShowCostConfig(false)}
        onSave={(config) => {
          setCostConfig(config);
          addLog("Cost configuration saved", "success");
        }}
      />

      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onLoadHistory={(details) => {
          setPlatformAnalyses(details.analyses || []);
          setTargetUrl(details.targetUrl || targetUrl);
          addLog(`已加载历史记录: ${details.productTitle}`, "system");
        }}
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

        {/* Comparison Table */}
        <ComparisonTable
          analyses={platformAnalyses}
          isLoading={isAnalyzing}
          progress={searchProgress}
        />
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