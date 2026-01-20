/**
 * History Service
 * Manages analysis history using chrome.storage.local
 */

const HISTORY_KEY = 'analysis_history';
const MAX_HISTORY = 50;

/**
 * Save an analysis result
 * @param {Object} analysisResult 
 */
export const saveHistory = (analysisResult) => {
  if (typeof chrome === 'undefined' || !chrome.storage) return;

  chrome.storage.local.get([HISTORY_KEY], (result) => {
    const history = result[HISTORY_KEY] || [];
    
    const newItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      product: analysisResult.productTitle,
      roi: analysisResult.bestRoi,
      platform: analysisResult.bestPlatform,
      details: analysisResult // Store full details if space permits, or minimize
    };

    // Prepend new item
    const newHistory = [newItem, ...history].slice(0, MAX_HISTORY);

    chrome.storage.local.set({ [HISTORY_KEY]: newHistory });
  });
};

/**
 * Get all history
 * @returns {Promise<Array>}
 */
export const getHistory = () => {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve([]);
      return;
    }

    chrome.storage.local.get([HISTORY_KEY], (result) => {
      resolve(result[HISTORY_KEY] || []);
    });
  });
};

/**
 * Clear history
 */
export const clearHistory = () => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.remove(HISTORY_KEY);
  }
};
