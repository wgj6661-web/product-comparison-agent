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
 * @param {number} retries - Number of retry attempts (default 1)
 * @returns {Promise<Array>} Array of product results
 */
import { searchWithFirecrawl } from '../services/firecrawl';

/**
 * Open search page in background tab and extract results
 * @param {string} platformId - Platform identifier
 * @param {string} searchQuery - Search query string
 * @param {Function} onProgress - Progress callback
 * @param {number} retries - Number of retry attempts (default 1)
 * @param {boolean} useApi - Whether to use Firecrawl API (default false)
 * @returns {Promise<Array>} Array of product results
 */
export const searchPlatform = async (platformId, searchQuery, onProgress, retries = 2, useApi = true) => {
  const platform = PLATFORMS.find(p => p.id === platformId);

  if (!platform || !platform.enabled) {
    throw new Error(`Platform ${platformId} not found or disabled`);
  }

  // API Mode (Firecrawl)
  if (useApi) {
    try {
      onProgress?.(`Searching ${platform.name} via Firecrawl API...`);
      const results = await searchWithFirecrawl(platform.name, searchQuery);
      onProgress?.(`Found ${results.length} products on ${platform.name} (API)`);
      return results;
    } catch (error) {
       console.error(`Firecrawl API failed for ${platform.name}, falling back to browser scrape:`, error);
       onProgress?.(`API failed, falling back to browser tab for ${platform.name}...`);
       // Fallback to normal execution below
    }
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
      await waitForTabLoad(tab.id, 25000);

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

      let friendlyMessage = error.message;
      if (error.message === 'NEED_LOGIN') {
        friendlyMessage = '需要登录平台才能搜索，请先在浏览器中登录';
      } else if (error.message === 'CAPTCHA_BLOCKED') {
        friendlyMessage = '触发了人机验证（验证码），请在浏览器中完成验证';
      }

      onProgress?.(`Error searching ${platform.name}: ${friendlyMessage}`);
      return [];
    }
  }

  return [];
};

/**
 * Wait for tab to finish loading
 * @param {number} tabId - Chrome tab ID
 * @param {number} timeout - Max wait time in ms
 * @returns {Promise<void>}
 */
const waitForTabLoad = async (tabId, timeout = 15000) => {
  // Check if tab is already loaded
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.status === 'complete') {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return;
    }
  } catch (e) {
    // Ignore error, proceed to listener
  }

  return new Promise((resolve, reject) => {
    let completed = false;

    const listener = (updatedTabId, changeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        completed = true;
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        // Additional delay to ensure JS has executed
        setTimeout(resolve, 3000);
      }
    };

    const timer = setTimeout(() => {
      if (!completed) {
        chrome.tabs.onUpdated.removeListener(listener);
        reject(new Error('Tab load timeout'));
      }
    }, timeout);

    chrome.tabs.onUpdated.addListener(listener);
  });
};

/**
 * Search multiple platforms in parallel
 * @param {Array<string>} platformIds - Array of platform IDs to search
 * @param {string} searchQuery - Search query string
 * @param {Function} onProgress - Progress callback(platformId, message)
 * @param {number} batchSize - Max concurrent tabs (default 6)
 * @returns {Promise<Object>} Object with results and errors keyed by platform ID
 */
export const searchMultiplePlatforms = async (
  platformIds,
  searchQuery,
  onProgress,
  batchSize = 3,
  useApi = true
) => {
  const results = {};
  const errors = {};  // Track errors separately
  
  // Throttle for API: reduce batch size and add delays
  const effectiveBatchSize = useApi ? 2 : batchSize; 

  // Process in batches to avoid too many open tabs
  for (let i = 0; i < platformIds.length; i += effectiveBatchSize) {
    const batch = platformIds.slice(i, i + effectiveBatchSize);

    if (useApi && i > 0) {
       // Add delay between batches for API to respect rate limits
       onProgress?.('System', 'Rate limit spacing: waiting 2s...');
       await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const batchPromises = batch.map(async (platformId) => {
      try {
        const products = await searchPlatform(
          platformId,
          searchQuery,
          (msg) => onProgress?.(platformId, msg),
          2, // retries
          useApi
        );
        results[platformId] = products;
      } catch (error) {
        console.error(`Platform ${platformId} search failed:`, error);
        results[platformId] = [];
        errors[platformId] = error.message;  // Store error message
      }
    });

    await Promise.allSettled(batchPromises);
  }

  return { results, errors };  // Return both results and errors
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
