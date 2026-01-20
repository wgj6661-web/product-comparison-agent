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
