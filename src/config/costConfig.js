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
