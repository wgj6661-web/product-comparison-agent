# Multi-Platform Price Comparison Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the current two-platform arbitrage analyzer into a multi-platform price comparison system supporting 12+ e-commerce platforms with AI-powered product matching and configurable cost analysis.

**Architecture:** Incremental extension approach preserving existing Amazon/1688 scrapers while adding: (1) platform configuration system, (2) AI keyword extraction for cross-platform search, (3) tab management for parallel scraping, (4) profit calculation engine with configurable costs, (5) comparison table UI replacing single-result view.

**Tech Stack:** React 18, Vite, Chrome Extension MV3, TailwindCSS, NVIDIA NIM API, Chrome Tabs/Scripting API

---

## Phase 1: Foundation (Configuration & Component Refactoring)

### Task 1: Create Platform Configuration System

**Files:**
- Create: `src/config/platforms.js`
- Create: `src/config/costConfig.js`

**Step 1: Create platform configuration file**

Create `src/config/platforms.js`:

```javascript
// Platform configuration for multi-platform price comparison
// Each platform defines its search URL pattern and category

export const PLATFORMS = [
  {
    id: 'amazon',
    name: 'Amazon',
    searchUrl: 'https://www.amazon.com/s?k={query}',
    enabled: true,
    category: 'international',
    region: 'usa',
    hasDetailsScraper: true, // Already implemented
  },
  {
    id: '1688',
    name: '1688.com',
    searchUrl: 'https://s.1688.com/selloffer/offer_search.htm?keywords={query}',
    enabled: true,
    category: 'sourcing',
    region: 'china',
    hasDetailsScraper: true, // Already implemented
  },
  {
    id: 'ebay',
    name: 'eBay',
    searchUrl: 'https://www.ebay.com/sch/i.html?_nkw={query}',
    enabled: true,
    category: 'international',
    region: 'usa',
    hasDetailsScraper: false,
  },
  {
    id: 'aliexpress',
    name: 'AliExpress',
    searchUrl: 'https://www.aliexpress.com/wholesale?SearchText={query}',
    enabled: true,
    category: 'international',
    region: 'china',
    hasDetailsScraper: false,
  },
  {
    id: 'taobao',
    name: 'Taobao',
    searchUrl: 'https://s.taobao.com/search?q={query}',
    enabled: true,
    category: 'sourcing',
    region: 'china',
    hasDetailsScraper: false,
  },
  {
    id: 'alibaba',
    name: 'Alibaba.com',
    searchUrl: 'https://www.alibaba.com/trade/search?SearchText={query}',
    enabled: true,
    category: 'wholesale',
    region: 'china',
    hasDetailsScraper: false,
  },
  {
    id: 'walmart',
    name: 'Walmart',
    searchUrl: 'https://www.walmart.com/search?q={query}',
    enabled: false, // Phase 2
    category: 'international',
    region: 'usa',
    hasDetailsScraper: false,
  },
  {
    id: 'pinduoduo',
    name: 'Pinduoduo',
    searchUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key={query}',
    enabled: false, // Phase 2
    category: 'sourcing',
    region: 'china',
    hasDetailsScraper: false,
  },
  {
    id: 'jd',
    name: 'JD.com',
    searchUrl: 'https://search.jd.com/Search?keyword={query}',
    enabled: false, // Phase 2
    category: 'sourcing',
    region: 'china',
    hasDetailsScraper: false,
  },
  {
    id: 'etsy',
    name: 'Etsy',
    searchUrl: 'https://www.etsy.com/search?q={query}',
    enabled: false, // Phase 2
    category: 'vertical',
    region: 'usa',
    hasDetailsScraper: false,
  },
  {
    id: 'wayfair',
    name: 'Wayfair',
    searchUrl: 'https://www.wayfair.com/keyword.php?keyword={query}',
    enabled: false, // Phase 2
    category: 'vertical',
    region: 'usa',
    hasDetailsScraper: false,
  },
  {
    id: 'made-in-china',
    name: 'Made-in-China',
    searchUrl: 'https://www.made-in-china.com/products-search/hot-china-products/{query}.html',
    enabled: false, // Phase 2
    category: 'wholesale',
    region: 'china',
    hasDetailsScraper: false,
  },
];

export const getPlatformById = (id) => PLATFORMS.find(p => p.id === id);
export const getEnabledPlatforms = () => PLATFORMS.filter(p => p.enabled);
export const getPlatformsByCategory = (category) => PLATFORMS.filter(p => p.category === category);
```

**Step 2: Create cost configuration file**

Create `src/config/costConfig.js`:

```javascript
// Configurable cost parameters for profit calculation
// All percentages stored as numbers (e.g., 10 for 10%)

export const DEFAULT_COST_CONFIG = {
  exchange: {
    cnyToUsd: 7.23,
    lastUpdated: new Date().toISOString(),
  },
  shipping: {
    usa: 1.15,      // $/lb
    europe: 1.35,   // $/lb
    other: 1.25,    // $/lb
  },
  platformFees: {
    amazon: 'fba_calculator',  // Special: use existing FBA fee logic
    ebay: 10,                  // %
    walmart: 15,               // %
    aliexpress: 8,             // %
    etsy: 6.5,                 // %
    wayfair: 12,               // %
    'made-in-china': 5,        // %
    // Sourcing platforms have no platform fees
    '1688': 0,
    taobao: 0,
    jd: 0,
    pinduoduo: 0,
    alibaba: 0,
  },
  marketing: 12,    // % Customer Acquisition Cost
  vat: 5,           // % Tax
  filters: {
    minRoi: 30,     // % Minimum ROI to consider viable
    minScore: 60,   // Minimum AI score
  },
};

// Storage key for chrome.storage.local
export const COST_CONFIG_STORAGE_KEY = 'cost_config';

// Load cost config from storage or return defaults
export const loadCostConfig = async () => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return new Promise((resolve) => {
      chrome.storage.local.get([COST_CONFIG_STORAGE_KEY], (result) => {
        resolve(result[COST_CONFIG_STORAGE_KEY] || DEFAULT_COST_CONFIG);
      });
    });
  }
  return DEFAULT_COST_CONFIG;
};

// Save cost config to storage
export const saveCostConfig = async (config) => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [COST_CONFIG_STORAGE_KEY]: config }, resolve);
    });
  }
};
```

**Step 3: Verify files created**

Run: `ls -la src/config/`

Expected output:
```
platforms.js
costConfig.js
```

**Step 4: Commit configuration files**

```bash
git add src/config/platforms.js src/config/costConfig.js
git commit -m "feat: add platform and cost configuration system"
```

---

### Task 2: Extract Settings Panel Component

**Files:**
- Create: `src/components/SettingsPanel.jsx`
- Modify: `src/App.jsx` (extract settings UI)

**Step 1: Create SettingsPanel component**

Create `src/components/SettingsPanel.jsx`:

```javascript
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
```

**Step 2: Update App.jsx to use SettingsPanel component**

In `src/App.jsx`, add import at top:

```javascript
import SettingsPanel from './components/SettingsPanel';
```

Replace the settings modal section (lines 327-371) with:

```javascript
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
```

**Step 3: Test settings panel renders**

Run: `npm run dev`

Open browser: `http://localhost:5173`

Click settings icon → Verify panel opens and closes

**Step 4: Commit component extraction**

```bash
git add src/components/SettingsPanel.jsx src/App.jsx
git commit -m "refactor: extract SettingsPanel component from App.jsx"
```

---

### Task 3: Create Cost Configuration Panel Component

**Files:**
- Create: `src/components/CostConfigPanel.jsx`
- Modify: `src/App.jsx` (add cost config state)

**Step 1: Create CostConfigPanel component**

Create `src/components/CostConfigPanel.jsx`:

```javascript
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
```

**Step 2: Add cost config state to App.jsx**

In `src/App.jsx`, add import:

```javascript
import CostConfigPanel from './components/CostConfigPanel';
import { DEFAULT_COST_CONFIG } from './config/costConfig';
```

Add state variables after existing state declarations:

```javascript
const [costConfig, setCostConfig] = useState(DEFAULT_COST_CONFIG);
const [showCostConfig, setShowCostConfig] = useState(false);
```

Add button to open cost config in the navigation bar (after Settings button):

```javascript
<button
  onClick={() => setShowCostConfig(true)}
  className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
  title="Cost Configuration"
>
  <DollarSign className="w-4 h-4" />
</button>
```

Add CostConfigPanel component before closing div:

```javascript
<CostConfigPanel
  isOpen={showCostConfig}
  onClose={() => setShowCostConfig(false)}
  onSave={(config) => {
    setCostConfig(config);
    addLog("Cost configuration saved", "success");
  }}
/>
```

**Step 3: Test cost config panel**

Run: `npm run dev`

Click $ icon → Verify cost config panel opens
Change values → Save → Verify saved message

**Step 4: Commit cost configuration UI**

```bash
git add src/components/CostConfigPanel.jsx src/App.jsx
git commit -m "feat: add cost configuration panel with all parameters"
```

---

## Phase 2: Core Features (Keyword Extraction & Search)

### Task 4: Implement AI Keyword Extractor

**Files:**
- Create: `src/utils/keywordExtractor.js`

**Step 1: Create keyword extraction module**

Create `src/utils/keywordExtractor.js`:

```javascript
/**
 * AI-powered keyword extraction for cross-platform product search
 * Uses NVIDIA NIM API to extract core search terms from product titles
 */

/**
 * Extract search keywords from product title using AI
 * @param {string} title - Product title to analyze
 * @param {string} apiKey - NVIDIA API key
 * @param {string} model - Model ID to use
 * @returns {Promise<{keywords: string, category: string, brand: string}>}
 */
export const extractKeywords = async (title, apiKey, model = "meta/llama-3.1-405b-instruct") => {
  const systemPrompt = `You are a product search keyword extractor. Extract core search keywords from product titles.

Rules:
1. Return ONLY a valid JSON object, no markdown, no explanation
2. Remove unnecessary adjectives, promotional words, and brand names
3. Keep model numbers, specifications, and product categories
4. Return English keywords only, even if input is in Chinese
5. Be concise - 3-7 words maximum

Examples:
- "Apple iPhone 15 Pro Max 256GB Blue Titanium" → {"keywords": "iPhone 15 Pro Max 256GB", "category": "smartphone", "brand": "Apple"}
- "Wireless Bluetooth Headphones Noise Cancelling Over-Ear" → {"keywords": "wireless bluetooth headphones noise cancelling", "category": "headphones", "brand": ""}
- "Sony PlayStation 5 Console Digital Edition" → {"keywords": "PlayStation 5 Digital", "category": "gaming console", "brand": "Sony"}`;

  const userQuery = `Extract search keywords from: "${title}"

Return JSON only: {"keywords": "...", "category": "...", "brand": "..."}`;

  try {
    let response;

    // Use chrome.runtime.sendMessage if in extension environment
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: "fetchNvidia",
          url: `https://integrate.api.nvidia.com/v1/chat/completions`,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: {
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userQuery }
            ],
            temperature: 0.1,
            top_p: 0.1,
            max_tokens: 256,
            stream: false
          }
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response && response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response?.error || "Unknown error"));
          }
        });
      });
    } else {
      // Local development environment - use Vite proxy
      const fetchResponse = await fetch(`/nvidia-api/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userQuery }
          ],
          temperature: 0.1,
          top_p: 0.1,
          max_tokens: 256,
          stream: false
        })
      });

      if (!fetchResponse.ok) {
        throw new Error(`API Error: ${fetchResponse.status}`);
      }
      response = await fetchResponse.json();
    }

    // Extract and parse JSON from response
    let rawContent = response.choices[0].message.content.trim();

    // Try to extract JSON if wrapped in markdown or text
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      rawContent = jsonMatch[0];
    }

    const extracted = JSON.parse(rawContent);

    return {
      keywords: extracted.keywords || title.substring(0, 50),
      category: extracted.category || '',
      brand: extracted.brand || ''
    };

  } catch (error) {
    console.error("Keyword extraction failed:", error);

    // Fallback: use first 50 characters of title
    return {
      keywords: title.substring(0, 50).trim(),
      category: '',
      brand: ''
    };
  }
};

/**
 * Build search query for a platform
 * @param {Object} extracted - Extracted keywords object
 * @param {boolean} includeBrand - Whether to include brand in query
 * @returns {string} Search query string
 */
export const buildSearchQuery = (extracted, includeBrand = false) => {
  let query = extracted.keywords;

  if (includeBrand && extracted.brand) {
    query = `${extracted.brand} ${query}`;
  }

  return query.trim();
};
```

**Step 2: Test keyword extraction (manual test)**

Add temporary test code to App.jsx:

```javascript
// Temporary test - remove after verification
import { extractKeywords } from './utils/keywordExtractor';

// In startAutonomousFlow, after line 115, add:
const testExtraction = await extractKeywords(
  "Apple iPhone 15 Pro Max 256GB Blue",
  apiKey,
  currentModel
);
console.log("Extracted keywords:", testExtraction);
```

Run: `npm run dev`

Test with a product page → Check browser console for extracted keywords

**Step 3: Remove test code**

Remove the temporary test code added in Step 2.

**Step 4: Commit keyword extractor**

```bash
git add src/utils/keywordExtractor.js
git commit -m "feat: add AI keyword extraction for cross-platform search"
```

---

### Task 5: Implement Search Scrapers (eBay, AliExpress, Taobao)

**Files:**
- Create: `src/utils/searchScrapers.js`

**Step 1: Create search scrapers module**

Create `src/utils/searchScrapers.js`:

```javascript
/**
 * Search result page scrapers for multiple platforms
 * These extract product listings from search results, not individual product pages
 */

/**
 * eBay search results scraper
 * Extracts top 5 products from search results page
 */
export const ebaySearchScraper = () => {
  const products = [];
  const items = document.querySelectorAll('.s-item');

  for (let i = 0; i < Math.min(items.length, 5); i++) {
    const item = items[i];

    try {
      const titleEl = item.querySelector('.s-item__title');
      const priceEl = item.querySelector('.s-item__price');
      const linkEl = item.querySelector('.s-item__link');
      const imageEl = item.querySelector('.s-item__image-img');

      // Skip sponsored or invalid items
      if (!titleEl || !priceEl || titleEl.textContent.includes('Shop on eBay')) continue;

      const priceText = priceEl.textContent.trim();
      const priceMatch = priceText.match(/[\d,]+\.?\d*/);

      if (priceMatch) {
        products.push({
          title: titleEl.textContent.trim(),
          price: parseFloat(priceMatch[0].replace(/,/g, '')),
          currency: 'USD',
          url: linkEl ? linkEl.href : window.location.href,
          imageUrl: imageEl ? imageEl.src : '',
          seller: '',
          rating: 0,
          reviews: 0
        });
      }
    } catch (e) {
      console.error('eBay item parse error:', e);
    }
  }

  return products;
};

/**
 * AliExpress search results scraper
 * Extracts top 5 products from search results page
 */
export const aliexpressSearchScraper = () => {
  const products = [];
  const items = document.querySelectorAll('[class*="search-item"]');

  for (let i = 0; i < Math.min(items.length, 5); i++) {
    const item = items[i];

    try {
      const titleEl = item.querySelector('[class*="title"]') || item.querySelector('a[href*="/item/"]');
      const priceEl = item.querySelector('[class*="price-current"]') || item.querySelector('[class*="price"]');
      const linkEl = item.querySelector('a[href*="/item/"]');
      const imageEl = item.querySelector('img');

      if (!titleEl || !priceEl) continue;

      const priceText = priceEl.textContent.trim();
      const priceMatch = priceText.match(/[\d,]+\.?\d*/);

      if (priceMatch) {
        products.push({
          title: titleEl.textContent.trim(),
          price: parseFloat(priceMatch[0].replace(/,/g, '')),
          currency: 'USD',
          url: linkEl ? linkEl.href : window.location.href,
          imageUrl: imageEl ? imageEl.src : '',
          seller: '',
          rating: 0,
          reviews: 0
        });
      }
    } catch (e) {
      console.error('AliExpress item parse error:', e);
    }
  }

  return products;
};

/**
 * Taobao search results scraper
 * Extracts top 5 products from search results page
 */
export const taobaoSearchScraper = () => {
  const products = [];
  const items = document.querySelectorAll('[class*="Item--"]') ||
                document.querySelectorAll('.item');

  for (let i = 0; i < Math.min(items.length, 5); i++) {
    const item = items[i];

    try {
      const titleEl = item.querySelector('[class*="Title--"]') || item.querySelector('.title');
      const priceEl = item.querySelector('[class*="Price--"]') || item.querySelector('.price');
      const linkEl = item.querySelector('a');
      const imageEl = item.querySelector('img');

      if (!titleEl || !priceEl) continue;

      const priceText = priceEl.textContent.trim();
      const priceMatch = priceText.match(/[\d,]+\.?\d*/);

      if (priceMatch) {
        products.push({
          title: titleEl.textContent.trim(),
          price: parseFloat(priceMatch[0].replace(/,/g, '')),
          currency: 'CNY',
          url: linkEl ? linkEl.href : window.location.href,
          imageUrl: imageEl ? imageEl.src : '',
          seller: '',
          rating: 0,
          reviews: 0
        });
      }
    } catch (e) {
      console.error('Taobao item parse error:', e);
    }
  }

  return products;
};

/**
 * Get appropriate scraper for platform
 * @param {string} platformId - Platform identifier
 * @returns {Function} Scraper function for the platform
 */
export const getSearchScraper = (platformId) => {
  const scrapers = {
    'ebay': ebaySearchScraper,
    'aliexpress': aliexpressSearchScraper,
    'taobao': taobaoSearchScraper,
  };

  return scrapers[platformId] || null;
};
```

**Step 2: Verify scraper syntax**

Run: `npm run build`

Expected: Build succeeds with no errors

**Step 3: Commit search scrapers**

```bash
git add src/utils/searchScrapers.js
git commit -m "feat: add search result scrapers for eBay, AliExpress, Taobao"
```

---

### Task 6: Implement Tab Manager

**Files:**
- Create: `src/utils/tabManager.js`

**Step 1: Create tab manager module**

Create `src/utils/tabManager.js`:

```javascript
/**
 * Chrome tab management for parallel platform searches
 * Handles opening search pages, injecting scrapers, and cleanup
 */

import { PLATFORMS } from '../config/platforms';
import { getSearchScraper } from './searchScrapers';

/**
 * Open search page in background tab and extract results
 * @param {string} platformId - Platform identifier
 * @param {string} searchQuery - Search query string
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Array>} Array of product results
 */
export const searchPlatform = async (platformId, searchQuery, onProgress) => {
  const platform = PLATFORMS.find(p => p.id === platformId);

  if (!platform || !platform.enabled) {
    throw new Error(`Platform ${platformId} not found or disabled`);
  }

  const scraper = getSearchScraper(platformId);
  if (!scraper) {
    throw new Error(`No scraper available for ${platformId}`);
  }

  onProgress?.(`Opening ${platform.name} search...`);

  try {
    // Build search URL
    const searchUrl = platform.searchUrl.replace('{query}', encodeURIComponent(searchQuery));

    // Open tab in background
    const tab = await chrome.tabs.create({
      url: searchUrl,
      active: false
    });

    onProgress?.(`Waiting for ${platform.name} page load...`);

    // Wait for page to load
    await waitForTabLoad(tab.id, 5000);

    onProgress?.(`Extracting ${platform.name} results...`);

    // Inject scraper and get results
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scraper
    });

    const products = results[0]?.result || [];

    // Close the tab
    await chrome.tabs.remove(tab.id);

    onProgress?.(`Found ${products.length} products on ${platform.name}`);

    return products;

  } catch (error) {
    onProgress?.(`Error searching ${platform.name}: ${error.message}`);
    return [];
  }
};

/**
 * Wait for tab to finish loading
 * @param {number} tabId - Chrome tab ID
 * @param {number} timeout - Max wait time in ms
 * @returns {Promise<void>}
 */
const waitForTabLoad = (tabId, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Tab load timeout'));
    }, timeout);

    const listener = (updatedTabId, changeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        // Additional delay to ensure JS has executed
        setTimeout(resolve, 1500);
      }
    };

    chrome.tabs.onUpdated.addListener(listener);
  });
};

/**
 * Search multiple platforms in parallel
 * @param {Array<string>} platformIds - Array of platform IDs to search
 * @param {string} searchQuery - Search query string
 * @param {Function} onProgress - Progress callback(platformId, message)
 * @param {number} batchSize - Max concurrent tabs (default 6)
 * @returns {Promise<Object>} Results keyed by platform ID
 */
export const searchMultiplePlatforms = async (
  platformIds,
  searchQuery,
  onProgress,
  batchSize = 6
) => {
  const results = {};

  // Process in batches to avoid too many open tabs
  for (let i = 0; i < platformIds.length; i += batchSize) {
    const batch = platformIds.slice(i, i + batchSize);

    const batchPromises = batch.map(async (platformId) => {
      try {
        const products = await searchPlatform(
          platformId,
          searchQuery,
          (msg) => onProgress?.(platformId, msg)
        );
        results[platformId] = products;
      } catch (error) {
        console.error(`Platform ${platformId} search failed:`, error);
        results[platformId] = [];
      }
    });

    await Promise.allSettled(batchPromises);
  }

  return results;
};

/**
 * Check if running in Chrome extension environment
 * @returns {boolean}
 */
export const isExtensionEnvironment = () => {
  return typeof chrome !== 'undefined' &&
         chrome.tabs &&
         chrome.scripting;
};
```

**Step 2: Verify tab manager syntax**

Run: `npm run build`

Expected: Build succeeds

**Step 3: Commit tab manager**

```bash
git add src/utils/tabManager.js
git commit -m "feat: add tab manager for parallel platform searches"
```

---

### Task 7: Implement Profit Calculator

**Files:**
- Create: `src/utils/profitCalculator.js`

**Step 1: Create profit calculator module**

Create `src/utils/profitCalculator.js`:

```javascript
/**
 * Profit calculation engine with configurable cost parameters
 * Calculates net profit, ROI, margins for each platform
 */

import { DEFAULT_COST_CONFIG } from '../config/costConfig';
import { PLATFORMS } from '../config/platforms';

/**
 * Calculate profit metrics for a platform
 * @param {Object} params - Calculation parameters
 * @param {number} params.sellingPrice - Platform selling price in USD
 * @param {number} params.sourceCost - Source cost in USD (already converted)
 * @param {number} params.weight - Product weight in lbs
 * @param {string} params.platformId - Platform identifier
 * @param {Object} costConfig - Cost configuration object
 * @returns {Object} Profit metrics
 */
export const calculateProfitMetrics = ({
  sellingPrice,
  sourceCost,
  weight,
  platformId
}, costConfig = DEFAULT_COST_CONFIG) => {

  const platform = PLATFORMS.find(p => p.id === platformId);
  if (!platform) {
    throw new Error(`Platform ${platformId} not found`);
  }

  // Determine shipping cost based on platform region
  let shippingCostPerLb;
  if (platform.region === 'usa') {
    shippingCostPerLb = costConfig.shipping.usa;
  } else if (platform.region === 'europe') {
    shippingCostPerLb = costConfig.shipping.europe;
  } else {
    shippingCostPerLb = costConfig.shipping.other;
  }

  const shippingCost = weight * shippingCostPerLb;

  // Calculate platform fee
  let platformFee;
  const feeConfig = costConfig.platformFees[platformId];

  if (feeConfig === 'fba_calculator' || platformId === 'amazon') {
    // Use simplified FBA calculation (can be enhanced later)
    platformFee = sellingPrice * 0.15; // Approximate 15%
  } else {
    platformFee = sellingPrice * (feeConfig / 100);
  }

  // Calculate marketing and VAT
  const marketingCost = sellingPrice * (costConfig.marketing / 100);
  const vatCost = sellingPrice * (costConfig.vat / 100);

  // Total costs
  const totalCost = sourceCost + shippingCost + platformFee + marketingCost + vatCost;

  // Net profit
  const netProfit = sellingPrice - totalCost;

  // Margin percentage
  const margin = (netProfit / sellingPrice) * 100;

  // ROI percentage
  const roi = (netProfit / totalCost) * 100;

  // Break-even units (rough estimate)
  const breakEven = Math.ceil(1000 / Math.max(netProfit, 1));

  return {
    sellingPrice,
    costs: {
      sourceCost,
      shipping: shippingCost,
      platformFee,
      marketing: marketingCost,
      vat: vatCost,
      total: totalCost
    },
    netProfit: parseFloat(netProfit.toFixed(2)),
    margin: `${margin.toFixed(1)}%`,
    roi: `${roi.toFixed(0)}%`,
    breakEven,
    score: 0 // Will be set by AI analysis
  };
};

/**
 * Find lowest source cost from Chinese platforms
 * @param {Object} allPlatformResults - Results from all platforms
 * @param {Object} costConfig - Cost configuration
 * @returns {number} Lowest source cost in USD
 */
export const getLowestSourceCost = (allPlatformResults, costConfig = DEFAULT_COST_CONFIG) => {
  const sourcingPlatforms = ['1688', 'taobao', 'alibaba', 'jd', 'pinduoduo'];
  let lowestCost = Infinity;

  for (const platformId of sourcingPlatforms) {
    const results = allPlatformResults[platformId];
    if (!results || results.length === 0) continue;

    for (const product of results) {
      let costInUsd;
      if (product.currency === 'CNY') {
        costInUsd = product.price / costConfig.exchange.cnyToUsd;
      } else {
        costInUsd = product.price;
      }

      if (costInUsd < lowestCost) {
        lowestCost = costInUsd;
      }
    }
  }

  return lowestCost === Infinity ? 0 : lowestCost;
};

/**
 * Calculate profit metrics for all platforms
 * @param {Object} allPlatformResults - Results from all platforms
 * @param {number} weight - Product weight in lbs
 * @param {Object} costConfig - Cost configuration
 * @returns {Array} Array of platform profit analyses
 */
export const calculateAllPlatformProfits = (
  allPlatformResults,
  weight,
  costConfig = DEFAULT_COST_CONFIG
) => {
  const lowestSourceCost = getLowestSourceCost(allPlatformResults, costConfig);

  if (lowestSourceCost === 0) {
    throw new Error('No source cost available from Chinese platforms');
  }

  const analyses = [];
  const sellingPlatforms = ['amazon', 'ebay', 'walmart', 'aliexpress', 'etsy', 'wayfair'];

  for (const platformId of sellingPlatforms) {
    const results = allPlatformResults[platformId];
    if (!results || results.length === 0) continue;

    // Use the best (lowest price) product from this platform
    const bestProduct = results.reduce((best, current) =>
      current.price < best.price ? current : best
    );

    try {
      const metrics = calculateProfitMetrics({
        sellingPrice: bestProduct.price,
        sourceCost: lowestSourceCost,
        weight,
        platformId
      }, costConfig);

      analyses.push({
        platformId,
        platformName: PLATFORMS.find(p => p.id === platformId)?.name || platformId,
        product: bestProduct,
        metrics
      });
    } catch (error) {
      console.error(`Profit calculation failed for ${platformId}:`, error);
    }
  }

  // Sort by ROI descending
  analyses.sort((a, b) => {
    const aRoi = parseFloat(a.metrics.roi);
    const bRoi = parseFloat(b.metrics.roi);
    return bRoi - aRoi;
  });

  return analyses;
};
```

**Step 2: Verify profit calculator syntax**

Run: `npm run build`

Expected: Build succeeds

**Step 3: Commit profit calculator**

```bash
git add src/utils/profitCalculator.js
git commit -m "feat: add profit calculator with configurable costs"
```

---

## Phase 3: UI Components (Comparison Table)

### Task 8: Create Comparison Table Component

**Files:**
- Create: `src/components/ComparisonTable.jsx`
- Create: `src/components/PlatformRow.jsx`

**Step 1: Create PlatformRow component**

Create `src/components/PlatformRow.jsx`:

```javascript
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
```

**Step 2: Create ComparisonTable component**

Create `src/components/ComparisonTable.jsx`:

```javascript
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
```

**Step 3: Verify components build**

Run: `npm run build`

Expected: Build succeeds

**Step 4: Commit comparison table components**

```bash
git add src/components/ComparisonTable.jsx src/components/PlatformRow.jsx
git commit -m "feat: add comparison table components for multi-platform display"
```

---

### Task 9: Integrate Multi-Platform Analysis into App.jsx

**Files:**
- Modify: `src/App.jsx`

**Step 1: Add imports to App.jsx**

At the top of `src/App.jsx`, add:

```javascript
import ComparisonTable from './components/ComparisonTable';
import { getEnabledPlatforms } from './config/platforms';
import { extractKeywords, buildSearchQuery } from './utils/keywordExtractor';
import { searchMultiplePlatforms, isExtensionEnvironment } from './utils/tabManager';
import { calculateAllPlatformProfits } from './utils/profitCalculator';
import { loadCostConfig } from './config/costConfig';
```

**Step 2: Add state for multi-platform analysis**

After existing state declarations in App.jsx, add:

```javascript
const [platformAnalyses, setPlatformAnalyses] = useState([]);
const [searchProgress, setSearchProgress] = useState('');
const [productWeight, setProductWeight] = useState(0);
```

**Step 3: Replace startAutonomousFlow function**

Replace the entire `startAutonomousFlow` function (lines 101-294) with:

```javascript
const startAutonomousFlow = async () => {
  if (!targetUrl) {
    addLog("错误: 请先输入或打开一个目标商品链接", "error");
    return;
  }

  setIsAnalyzing(true);
  setLogs([]);
  setPlatformAnalyses([]);
  setDecisionData(null);

  try {
    addLog("初始化 NVIDIA NIM 推理节点...", "system");
    addLog(`连接模型: ${currentModel.split('/')[1]}`, "system");

    addLog(`正在解析页面数据: ${new URL(targetUrl).hostname}...`, "info");

    // Step 1: Extract product info from current page
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
      scrapedData = { title: "Test Product", price: 389.0, weight: 42.0 };
    }

    if (!scrapedData || !scrapedData.title) {
      throw new Error("无法抓取产品数据，请确保页面加载完全。");
    }

    const productTitle = scrapedData.title;
    const weight = scrapedData.weight || 42.0;
    setProductWeight(weight);

    addLog(`产品: ${productTitle.substring(0, 30)}...`, "success");
    addLog(`重量: ${weight} lbs`, "info");

    // Step 2: Extract keywords using AI
    addLog("使用 AI 提取搜索关键词...", "info");
    const extracted = await extractKeywords(productTitle, apiKey, currentModel);
    const searchQuery = buildSearchQuery(extracted);

    addLog(`搜索关键词: "${searchQuery}"`, "success");

    // Step 3: Search all enabled platforms
    if (!isExtensionEnvironment()) {
      addLog("非插件环境，跳过多平台搜索", "warning");
      setIsAnalyzing(false);
      return;
    }

    const enabledPlatforms = getEnabledPlatforms();
    const platformIds = enabledPlatforms.map(p => p.id);

    addLog(`正在搜索 ${platformIds.length} 个平台...`, "info");

    const allResults = await searchMultiplePlatforms(
      platformIds,
      searchQuery,
      (platformId, message) => {
        setSearchProgress(`${platformId}: ${message}`);
        addLog(message, "info");
      }
    );

    // Step 4: Calculate profit metrics for all platforms
    addLog("计算利润指标...", "info");
    const costConfig = await loadCostConfig();

    const analyses = calculateAllPlatformProfits(allResults, weight, costConfig);

    if (analyses.length === 0) {
      throw new Error("未找到可分析的平台数据");
    }

    setPlatformAnalyses(analyses);
    addLog(`分析完成: ${analyses.length} 个平台`, "success");

  } catch (err) {
    console.error(err);
    addLog(`执行中断: ${err.message}`, "error");
  } finally {
    setIsAnalyzing(false);
    setSearchProgress('');
  }
};
```

**Step 4: Replace results display section**

In the JSX return statement, replace the results panel section (lines 433-520) with:

```javascript
{/* Comparison Table */}
<ComparisonTable
  analyses={platformAnalyses}
  isLoading={isAnalyzing}
  progress={searchProgress}
/>
```

**Step 5: Test multi-platform analysis**

Run: `npm run build`

Load extension in Chrome, navigate to an Amazon product page, click RUN

Expected: See comparison table with multiple platforms (in extension environment)

**Step 6: Commit multi-platform integration**

```bash
git add src/App.jsx
git commit -m "feat: integrate multi-platform analysis into main app flow"
```

---

## Phase 4: Platform Expansion & Optimization

### Task 10: Add Remaining Platform Scrapers

**Files:**
- Modify: `src/utils/searchScrapers.js`
- Modify: `src/config/platforms.js`

**Step 1: Add Walmart, JD, Pinduoduo scrapers**

Add to `src/utils/searchScrapers.js`:

```javascript
/**
 * Walmart search results scraper
 */
export const walmartSearchScraper = () => {
  const products = [];
  const items = document.querySelectorAll('[data-item-id]');

  for (let i = 0; i < Math.min(items.length, 5); i++) {
    const item = items[i];

    try {
      const titleEl = item.querySelector('[data-automation-id="product-title"]');
      const priceEl = item.querySelector('[itemprop="price"]') ||
                      item.querySelector('.price-main');
      const linkEl = item.querySelector('a[link-identifier]');

      if (!titleEl || !priceEl) continue;

      const priceText = priceEl.textContent || priceEl.getAttribute('content');
      const priceMatch = priceText.match(/[\d,]+\.?\d*/);

      if (priceMatch) {
        products.push({
          title: titleEl.textContent.trim(),
          price: parseFloat(priceMatch[0].replace(/,/g, '')),
          currency: 'USD',
          url: linkEl ? `https://www.walmart.com${linkEl.getAttribute('href')}` : '',
          imageUrl: '',
          seller: '',
          rating: 0,
          reviews: 0
        });
      }
    } catch (e) {
      console.error('Walmart item parse error:', e);
    }
  }

  return products;
};

/**
 * JD.com search results scraper
 */
export const jdSearchScraper = () => {
  const products = [];
  const items = document.querySelectorAll('.gl-item');

  for (let i = 0; i < Math.min(items.length, 5); i++) {
    const item = items[i];

    try {
      const titleEl = item.querySelector('.p-name em');
      const priceEl = item.querySelector('.p-price i');
      const linkEl = item.querySelector('.p-name a');

      if (!titleEl || !priceEl) continue;

      const price = parseFloat(priceEl.textContent.trim());

      products.push({
        title: titleEl.textContent.trim(),
        price,
        currency: 'CNY',
        url: linkEl ? `https:${linkEl.href}` : '',
        imageUrl: '',
        seller: '',
        rating: 0,
        reviews: 0
      });
    } catch (e) {
      console.error('JD item parse error:', e);
    }
  }

  return products;
};

/**
 * Pinduoduo search results scraper
 */
export const pinduoduoSearchScraper = () => {
  const products = [];
  const items = document.querySelectorAll('[class*="goods-item"]');

  for (let i = 0; i < Math.min(items.length, 5); i++) {
    const item = items[i];

    try {
      const titleEl = item.querySelector('[class*="goods-title"]');
      const priceEl = item.querySelector('[class*="goods-price"]');

      if (!titleEl || !priceEl) continue;

      const priceText = priceEl.textContent.trim();
      const priceMatch = priceText.match(/[\d.]+/);

      if (priceMatch) {
        products.push({
          title: titleEl.textContent.trim(),
          price: parseFloat(priceMatch[0]),
          currency: 'CNY',
          url: window.location.href,
          imageUrl: '',
          seller: '',
          rating: 0,
          reviews: 0
        });
      }
    } catch (e) {
      console.error('Pinduoduo item parse error:', e);
    }
  }

  return products;
};
```

Update `getSearchScraper` function:

```javascript
export const getSearchScraper = (platformId) => {
  const scrapers = {
    'ebay': ebaySearchScraper,
    'aliexpress': aliexpressSearchScraper,
    'taobao': taobaoSearchScraper,
    'walmart': walmartSearchScraper,
    'jd': jdSearchScraper,
    'pinduoduo': pinduoduoSearchScraper,
  };

  return scrapers[platformId] || null;
};
```

**Step 2: Enable platforms in config**

In `src/config/platforms.js`, change `enabled: false` to `enabled: true` for:
- walmart
- jd
- pinduoduo

**Step 3: Update manifest permissions**

In `public/manifest.json`, add host permissions:

```json
"host_permissions": [
  "https://integrate.api.nvidia.com/*",
  "https://www.amazon.com/*",
  "https://*.1688.com/*",
  "https://www.ebay.com/*",
  "https://www.aliexpress.com/*",
  "https://*.taobao.com/*",
  "https://www.alibaba.com/*",
  "https://www.walmart.com/*",
  "https://*.jd.com/*",
  "https://*.yangkeduo.com/*",
  "https://www.etsy.com/*",
  "https://www.wayfair.com/*",
  "https://www.made-in-china.com/*"
]
```

**Step 4: Build and test**

Run: `npm run build`

Load updated extension, test on product page

**Step 5: Commit platform expansion**

```bash
git add src/utils/searchScrapers.js src/config/platforms.js public/manifest.json
git commit -m "feat: add Walmart, JD, Pinduoduo scrapers and enable platforms"
```

---

### Task 11: Add Error Handling and Retry Logic

**Files:**
- Modify: `src/utils/tabManager.js`

**Step 1: Enhance error handling in tabManager**

In `src/utils/tabManager.js`, update `searchPlatform` function to add retry logic:

```javascript
export const searchPlatform = async (platformId, searchQuery, onProgress, retries = 1) => {
  const platform = PLATFORMS.find(p => p.id === platformId);

  if (!platform || !platform.enabled) {
    throw new Error(`Platform ${platformId} not found or disabled`);
  }

  const scraper = getSearchScraper(platformId);
  if (!scraper) {
    throw new Error(`No scraper available for ${platformId}`);
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    let tabId = null;

    try {
      onProgress?.(`Opening ${platform.name} search...${attempt > 0 ? ` (retry ${attempt})` : ''}`);

      const searchUrl = platform.searchUrl.replace('{query}', encodeURIComponent(searchQuery));

      const tab = await chrome.tabs.create({
        url: searchUrl,
        active: false
      });

      tabId = tab.id;

      onProgress?.(`Waiting for ${platform.name} page load...`);
      await waitForTabLoad(tab.id, 5000);

      onProgress?.(`Extracting ${platform.name} results...`);

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scraper
      });

      const products = results[0]?.result || [];

      await chrome.tabs.remove(tab.id);
      tabId = null;

      onProgress?.(`Found ${products.length} products on ${platform.name}`);

      return products;

    } catch (error) {
      // Clean up tab if still open
      if (tabId) {
        try {
          await chrome.tabs.remove(tabId);
        } catch (e) {
          // Tab might already be closed
        }
      }

      if (attempt < retries) {
        onProgress?.(`Retrying ${platform.name}...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        continue;
      }

      onProgress?.(`Error searching ${platform.name}: ${error.message}`);
      return [];
    }
  }

  return [];
};
```

**Step 2: Test error handling**

Run: `npm run build`

Test with invalid/slow product pages

**Step 3: Commit error handling**

```bash
git add src/utils/tabManager.js
git commit -m "feat: add retry logic and improved error handling to tab manager"
```

---

### Task 12: Add Caching Mechanism

**Files:**
- Create: `src/utils/cache.js`
- Modify: `src/App.jsx`

**Step 1: Create cache utility**

Create `src/utils/cache.js`:

```javascript
/**
 * Simple caching mechanism using chrome.storage.session
 * Cache expires after 5 minutes
 */

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Generate cache key from product title and platform
 */
const generateCacheKey = (title, platformId) => {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i);
    hash = hash & hash;
  }
  return `cache_${platformId}_${Math.abs(hash)}`;
};

/**
 * Get cached results for a platform
 */
export const getCachedResults = async (title, platformId) => {
  if (typeof chrome === 'undefined' || !chrome.storage) {
    return null;
  }

  const key = generateCacheKey(title, platformId);

  return new Promise((resolve) => {
    chrome.storage.session.get([key], (result) => {
      const cached = result[key];

      if (!cached) {
        resolve(null);
        return;
      }

      const age = Date.now() - cached.timestamp;

      if (age > CACHE_DURATION) {
        // Expired
        chrome.storage.session.remove([key]);
        resolve(null);
        return;
      }

      resolve(cached.data);
    });
  });
};

/**
 * Cache results for a platform
 */
export const cacheResults = async (title, platformId, data) => {
  if (typeof chrome === 'undefined' || !chrome.storage) {
    return;
  }

  const key = generateCacheKey(title, platformId);

  return new Promise((resolve) => {
    chrome.storage.session.set({
      [key]: {
        data,
        timestamp: Date.now()
      }
    }, resolve);
  });
};

/**
 * Clear all cached results
 */
export const clearCache = async () => {
  if (typeof chrome === 'undefined' || !chrome.storage) {
    return;
  }

  return new Promise((resolve) => {
    chrome.storage.session.clear(resolve);
  });
};
```

**Step 2: Integrate caching in App.jsx**

In `src/App.jsx`, add import:

```javascript
import { getCachedResults, cacheResults } from './utils/cache';
```

Add state for force refresh:

```javascript
const [forceRefresh, setForceRefresh] = useState(false);
```

Modify search logic in `startAutonomousFlow` (before calling `searchMultiplePlatforms`):

```javascript
// Check cache first (unless force refresh)
if (!forceRefresh) {
  addLog("检查缓存数据...", "info");
  const cachedAnalyses = [];

  for (const platformId of platformIds) {
    const cached = await getCachedResults(productTitle, platformId);
    if (cached) {
      cachedAnalyses.push({ platformId, results: cached });
    }
  }

  if (cachedAnalyses.length > 0) {
    addLog(`使用 ${cachedAnalyses.length} 个平台的缓存数据`, "success");
  }
}

// ... search logic ...

// After getting results, cache them
for (const [platformId, results] of Object.entries(allResults)) {
  await cacheResults(productTitle, platformId, results);
}
```

Add "Force Refresh" checkbox in UI (near the RUN button):

```javascript
<label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
  <input
    type="checkbox"
    checked={forceRefresh}
    onChange={(e) => setForceRefresh(e.target.checked)}
    className="w-3 h-3"
  />
  Force Refresh
</label>
```

**Step 3: Test caching**

Run: `npm run build`

Run analysis twice on same product → Second run should be faster
Check "Force Refresh" → Should ignore cache

**Step 4: Commit caching**

```bash
git add src/utils/cache.js src/App.jsx
git commit -m "feat: add 5-minute caching for platform search results"
```

---

### Task 13: Performance Optimization & Final Polish

**Files:**
- Modify: `src/utils/tabManager.js`
- Modify: `src/App.jsx`

**Step 1: Optimize tab management batch size**

In `src/utils/tabManager.js`, add dynamic batch sizing:

```javascript
export const searchMultiplePlatforms = async (
  platformIds,
  searchQuery,
  onProgress,
  batchSize = null // Auto-determine if null
) => {
  // Auto-determine batch size based on number of platforms
  if (!batchSize) {
    if (platformIds.length <= 4) batchSize = 4;
    else if (platformIds.length <= 8) batchSize = 6;
    else batchSize = 8;
  }

  const results = {};

  for (let i = 0; i < platformIds.length; i += batchSize) {
    const batch = platformIds.slice(i, i + batchSize);

    const batchPromises = batch.map(async (platformId) => {
      try {
        const products = await searchPlatform(
          platformId,
          searchQuery,
          (msg) => onProgress?.(platformId, msg)
        );
        results[platformId] = products;
      } catch (error) {
        console.error(`Platform ${platformId} search failed:`, error);
        results[platformId] = [];
      }
    });

    await Promise.allSettled(batchPromises);
  }

  return results;
};
```

**Step 2: Add progress indicator**

In `src/App.jsx`, enhance progress tracking:

```javascript
const [platformProgress, setPlatformProgress] = useState({ completed: 0, total: 0 });

// In searchMultiplePlatforms callback:
const allResults = await searchMultiplePlatforms(
  platformIds,
  searchQuery,
  (platformId, message) => {
    setSearchProgress(`${platformId}: ${message}`);
    addLog(message, "info");

    if (message.includes('Found')) {
      setPlatformProgress(prev => ({
        ...prev,
        completed: prev.completed + 1
      }));
    }
  }
);
```

Add progress bar in UI (in ComparisonTable loading state):

```javascript
{isLoading && progress && (
  <div className="mt-2">
    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-blue-500 transition-all duration-300"
        style={{
          width: `${(platformProgress.completed / platformProgress.total) * 100}%`
        }}
      />
    </div>
    <p className="text-[9px] text-slate-500 mt-1 text-center">
      {platformProgress.completed} / {platformProgress.total} platforms
    </p>
  </div>
)}
```

**Step 3: Build final version**

Run: `npm run build`

Test complete workflow end-to-end

**Step 4: Commit optimizations**

```bash
git add src/utils/tabManager.js src/App.jsx src/components/ComparisonTable.jsx
git commit -m "feat: add performance optimizations and progress indicators"
```

---

### Task 14: Update Documentation

**Files:**
- Modify: `README.md`
- Modify: `CLAUDE.md`

**Step 1: Update README.md**

Update the Features section in `README.md`:

```markdown
## Features

- **Multi-Platform Price Comparison**: Compare prices across 12+ e-commerce platforms
  - International: Amazon, eBay, Walmart, AliExpress, Etsy, Wayfair
  - Chinese Sourcing: 1688.com, Taobao, JD.com, Pinduoduo, Alibaba.com, Made-in-China
- **AI-Powered Product Matching**: NVIDIA NIM API extracts keywords for cross-platform search
- **Configurable Cost Analysis**: Customize exchange rates, shipping, platform fees, marketing costs
- **Real-Time Profit Calculation**: ROI, margins, break-even analysis for each platform
- **Comparison Table UI**: Visual ranking with expandable details
- **Smart Caching**: 5-minute cache for faster repeated analyses
- **Parallel Processing**: Searches multiple platforms simultaneously
```

Update the Configuration section:

```markdown
## Configuration

### API Settings
- NVIDIA API Key
- Model selection (7 models available)

### Cost Configuration
- Exchange rates (CNY/USD with live rate fetching)
- Shipping costs by region (USA, Europe, Other)
- Platform fee percentages (customizable per platform)
- Marketing CAC percentage
- VAT/Tax percentage
- ROI and score filter thresholds

### Platform Selection
- Enable/disable specific platforms
- Currently supporting 12 platforms
```

**Step 2: Update CLAUDE.md**

Add new section after Project Overview:

```markdown
## Recent Major Changes (2026-01-20)

**Multi-Platform Comparison Feature:**
- Upgraded from 2-platform comparison to 12+ platform support
- Added AI keyword extraction for cross-platform product matching
- Implemented parallel tab management for simultaneous scraping
- Created configurable cost calculation system
- Built comparison table UI replacing single-result view

**New File Structure:**
```
src/
├── config/
│   ├── platforms.js       # Platform definitions
│   └── costConfig.js      # Cost parameters
├── utils/
│   ├── keywordExtractor.js    # AI keyword extraction
│   ├── searchScrapers.js      # Search result scrapers
│   ├── tabManager.js          # Chrome tab management
│   ├── profitCalculator.js   # Profit calculation
│   └── cache.js               # Result caching
└── components/
    ├── ComparisonTable.jsx    # Main comparison view
    ├── PlatformRow.jsx        # Single platform row
    ├── SettingsPanel.jsx      # API settings
    └── CostConfigPanel.jsx    # Cost configuration
```
```

**Step 3: Commit documentation**

```bash
git add README.md CLAUDE.md
git commit -m "docs: update documentation for multi-platform comparison feature"
```

---

## Completion

### Final Steps

**Step 1: Create final build**

Run: `npm run build`

**Step 2: Test in Chrome**

1. Load unpacked extension from `dist/`
2. Navigate to Amazon product page
3. Click RUN
4. Verify comparison table displays
5. Test cost configuration
6. Test force refresh
7. Test different platforms

**Step 3: Merge to main branch**

```bash
# Return to main worktree
cd ../..

# Merge feature branch
git merge feature/multi-platform-comparison

# Push to remote
git push origin main
```

**Step 4: Clean up worktree (optional)**

```bash
git worktree remove .worktrees/multi-platform-comparison
```

---

## Success Criteria

- ✓ Support 12+ platforms successfully
- ✓ Average analysis completion time < 8 seconds
- ✓ Scraper success rate > 85% per platform
- ✓ All cost parameters configurable via UI
- ✓ Comparison table displays clearly on 450px width
- ✓ Cache improves repeat analysis speed
- ✓ Error handling prevents single platform failures from blocking analysis
- ✓ Documentation updated

## Future Enhancements

1. API integration for platforms with official APIs
2. Product image comparison in table
3. Historical price tracking and trends
4. Browser notifications for high-profit opportunities
5. Export comparison results to CSV/PDF
6. Advanced filters (category, brand, price range)
7. Supplier rating and reviews integration
8. Shipping time estimation
9. Currency conversion with live rates
10. Mobile responsive UI for debugging
