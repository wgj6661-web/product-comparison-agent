/**
 * Search Result Page Scrapers
 *
 * These scrapers run in the page context (injected via chrome.scripting.executeScript)
 * and extract product listings from search result pages.
 *
 * Each scraper returns an array of up to 5 products with standardized format.
 */

// Constants
const MAX_PRODUCTS = 5;

/**
 * Shared Helper Functions
 */

/**
 * Extracts numeric price from price element
 * @param {HTMLElement} priceElement - DOM element containing price text
 * @returns {number|null} Parsed price or null if invalid
 */
const extractPrice = (priceElement) => {
  if (!priceElement) return null;

  const priceText = priceElement.innerText.trim();
  // Match formats: "$123.45", "$123", "123.45", "US $123.45"
  // Requires decimal to have digits (e.g., "123." is matched as "123")
  const priceMatch = priceText.match(/[\d,]+(?:\.\d+)?/);
  if (!priceMatch) return null;

  const price = parseFloat(priceMatch[0].replace(/,/g, ''));
  return (isNaN(price) || price === 0) ? null : price;
};

/**
 * Normalizes URL to ensure it's absolute with https protocol
 * @param {string} url - URL to normalize
 * @param {string} fallbackUrl - Fallback URL if input is empty
 * @returns {string} Normalized absolute URL
 */
const normalizeUrl = (url, fallbackUrl = '') => {
  if (!url) return fallbackUrl;
  if (url.startsWith('//')) return 'https:' + url;
  return url;
};

/**
 * Extracts image URL from img element with fallback to data attributes
 * @param {HTMLElement} imgElement - Image DOM element
 * @returns {string} Image URL or empty string
 */
const extractImageUrl = (imgElement) => {
  if (!imgElement) return '';

  return imgElement.src ||
         imgElement.getAttribute('data-src') ||
         imgElement.getAttribute('data-lazy-img') || '';
};

/**
 * Logs item parsing errors with platform context
 * @param {string} platform - Platform name for error context
 * @param {Error} error - Error object
 */
const logItemError = (platform, error) => {
  console.error(`${platform} item parsing error:`, error);
};

/**
 * Logs scraper-level errors with platform context
 * @param {string} platform - Platform name for error context
 * @param {Error} error - Error object
 */
const logScraperError = (platform, error) => {
  console.error(`${platform} search scraper error:`, error);
};

/**
 * eBay Search Result Scraper
 * Extracts top 5 products from eBay search results page
 */
export const ebaySearchScraper = () => {
  const products = [];

  try {
    // Select all search result items (excluding sponsored)
    const items = document.querySelectorAll('.s-item');

    for (const item of items) {
      if (products.length >= MAX_PRODUCTS) break;

      try {
        // Skip invalid items (check for "Shop on eBay" text which indicates placeholder)
        const titleElement = item.querySelector('.s-item__title');
        if (!titleElement || titleElement.innerText.includes('Shop on eBay')) {
          continue;
        }

        // Extract title
        const title = titleElement.innerText.trim();
        if (!title) continue;

        // Extract price with multiple selectors as fallback
        const priceElement = item.querySelector('.s-item__price') ||
                            item.querySelector('[class*="price"]');
        const price = extractPrice(priceElement);
        if (!price) continue;

        // Extract URL
        const linkElement = item.querySelector('.s-item__link');
        const url = linkElement ? linkElement.href : '';

        // Extract image URL
        const imgElement = item.querySelector('.s-item__image-img') ||
                          item.querySelector('img');
        const imageUrl = extractImageUrl(imgElement);

        // Extract seller name (optional)
        const sellerElement = item.querySelector('.s-item__seller-info-text');
        const seller = sellerElement ? sellerElement.innerText.trim() : '';

        // Extract rating and reviews (optional)
        const reviewElement = item.querySelector('.s-item__reviews-count span');
        const reviewText = reviewElement ? reviewElement.innerText.trim() : '';
        const reviewMatch = reviewText.match(/(\d+)/);
        const reviews = reviewMatch ? parseInt(reviewMatch[1]) : 0;

        // eBay doesn't always show ratings in search results, default to 0
        const rating = 0;

        // Add product to results
        products.push({
          title,
          price,
          currency: 'USD',
          url,
          imageUrl,
          seller,
          rating,
          reviews
        });

      } catch (error) {
        logItemError('eBay', error);
        continue;
      }
    }

  } catch (error) {
    logScraperError('eBay', error);
  }

  return products;
};

/**
 * AliExpress Search Result Scraper
 * Extracts top 5 products from AliExpress search results page
 */
export const aliexpressSearchScraper = () => {
  const products = [];

  try {
    // AliExpress has multiple possible selectors for product items
    const items = document.querySelectorAll(
      '.list--gallery--C2f2tvm > div, ' +
      '.search-item, ' +
      '[class*="SearchProductFeed"] > div, ' +
      '[class*="product-item"]'
    );

    for (const item of items) {
      if (products.length >= MAX_PRODUCTS) break;

      try {
        // Extract title with fallback selectors
        const titleElement = item.querySelector(
          '[class*="title"], ' +
          '[class*="Title"], ' +
          'a[title], ' +
          'h1, h2, h3'
        );
        if (!titleElement) continue;

        const title = (titleElement.getAttribute('title') || titleElement.innerText).trim();
        if (!title) continue;

        // Extract price with flexible selectors
        const priceElement = item.querySelector(
          '[class*="price"], ' +
          '[class*="Price"], ' +
          '[data-spm-anchor-id*="price"]'
        );
        const price = extractPrice(priceElement);
        if (!price) continue;

        // Extract URL
        const linkElement = item.querySelector('a[href*="/item/"]') ||
                           item.querySelector('a');
        const url = normalizeUrl(linkElement ? linkElement.href : '');

        // Extract image URL
        const imgElement = item.querySelector('img');
        const imageUrl = normalizeUrl(extractImageUrl(imgElement));

        // Extract seller name (optional, often not visible in search results)
        const sellerElement = item.querySelector('[class*="store"], [class*="seller"]');
        const seller = sellerElement ? sellerElement.innerText.trim() : '';

        // Extract rating and reviews
        const ratingElement = item.querySelector('[class*="rating"], [class*="star"]');
        const ratingText = ratingElement ? ratingElement.innerText.trim() : '';
        const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;

        const reviewElement = item.querySelector('[class*="review"], [class*="order"]');
        const reviewText = reviewElement ? reviewElement.innerText.trim() : '';
        const reviewMatch = reviewText.match(/(\d+)/);
        const reviews = reviewMatch ? parseInt(reviewMatch[1]) : 0;

        // Add product to results
        products.push({
          title,
          price,
          currency: 'USD',
          url,
          imageUrl,
          seller,
          rating,
          reviews
        });

      } catch (error) {
        logItemError('AliExpress', error);
        continue;
      }
    }

  } catch (error) {
    logScraperError('AliExpress', error);
  }

  return products;
};

/**
 * Taobao Search Result Scraper
 * Extracts top 5 products from Taobao search results page
 */
export const taobaoSearchScraper = () => {
  const products = [];

  try {
    // Taobao has different layouts (grid view, list view)
    const items = document.querySelectorAll(
      '.item, ' +
      '.Content--contentInner--QVTcU0M > div, ' +
      '[class*="doubleCardWrapper"], ' +
      '[class*="product-item"]'
    );

    for (const item of items) {
      if (products.length >= MAX_PRODUCTS) break;

      try {
        // Extract title with fallback selectors
        const titleElement = item.querySelector(
          '.title, ' +
          '[class*="title"], ' +
          '[class*="Title"], ' +
          'a[title]'
        );
        if (!titleElement) continue;

        const title = (titleElement.getAttribute('title') || titleElement.innerText).trim();
        if (!title) continue;

        // Extract price with flexible selectors (Taobao prices are in CNY)
        const priceElement = item.querySelector(
          '.price, ' +
          '[class*="price"], ' +
          '[class*="Price"], ' +
          '.priceInt'
        );
        const price = extractPrice(priceElement);
        if (!price) continue;

        // Extract URL
        const linkElement = item.querySelector('a[href*="item.taobao.com"], a[href*="detail.tmall.com"]') ||
                           item.querySelector('a');
        const url = normalizeUrl(linkElement ? linkElement.href : '');

        // Extract image URL
        const imgElement = item.querySelector('img');
        const imageUrl = normalizeUrl(extractImageUrl(imgElement));

        // Extract seller name (optional)
        const sellerElement = item.querySelector('[class*="shop"], [class*="store"]');
        const seller = sellerElement ? sellerElement.innerText.trim() : '';

        // Extract rating and reviews
        const ratingElement = item.querySelector('[class*="rate"]');
        const ratingText = ratingElement ? ratingElement.innerText.trim() : '';
        const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;

        const reviewElement = item.querySelector('[class*="deal-cnt"], [class*="sale"]');
        const reviewText = reviewElement ? reviewElement.innerText.trim() : '';
        // Handle formats like "123人付款", "1234笔", "12.3万"
        let reviews = 0;
        const reviewMatch = reviewText.match(/(\d+\.?\d*)/);
        if (reviewMatch) {
          reviews = parseFloat(reviewMatch[1]);
          // Handle "万" (10,000) unit
          if (reviewText.includes('万')) {
            reviews = reviews * 10000;
          }
          reviews = Math.floor(reviews);
        }

        // Add product to results (note: currency is CNY for Taobao)
        products.push({
          title,
          price,
          currency: 'CNY',
          url,
          imageUrl,
          seller,
          rating,
          reviews
        });

      } catch (error) {
        logItemError('Taobao', error);
        continue;
      }
    }

  } catch (error) {
    logScraperError('Taobao', error);
  }

  return products;
};

/**
 * Walmart Search Result Scraper
 * Extracts top 5 products from Walmart search results page
 */
export const walmartSearchScraper = () => {
  const products = [];

  try {
    // Select all search result items with data-item-id attribute
    const items = document.querySelectorAll('[data-item-id]');

    for (const item of items) {
      if (products.length >= MAX_PRODUCTS) break;

      try {
        // Extract title
        const titleElement = item.querySelector('[data-automation-id="product-title"]');
        if (!titleElement) continue;

        const title = titleElement.innerText.trim();
        if (!title) continue;

        // Extract price with multiple selectors as fallback
        const priceElement = item.querySelector('[itemprop="price"]') ||
                            item.querySelector('.price-main');
        if (!priceElement) continue;

        const priceText = priceElement.innerText || priceElement.getAttribute('content');
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        if (!priceMatch) continue;

        const price = parseFloat(priceMatch[0].replace(/,/g, ''));
        if (isNaN(price) || price === 0) continue;

        // Extract URL
        const linkElement = item.querySelector('a[link-identifier]');
        const url = linkElement ? `https://www.walmart.com${linkElement.getAttribute('href')}` : '';

        // Extract image URL
        const imgElement = item.querySelector('img');
        const imageUrl = extractImageUrl(imgElement);

        // Walmart search results typically don't show seller, rating, or reviews
        const seller = '';
        const rating = 0;
        const reviews = 0;

        // Add product to results
        products.push({
          title,
          price,
          currency: 'USD',
          url,
          imageUrl,
          seller,
          rating,
          reviews
        });

      } catch (error) {
        logItemError('Walmart', error);
        continue;
      }
    }

  } catch (error) {
    logScraperError('Walmart', error);
  }

  return products;
};

/**
 * JD.com Search Result Scraper
 * Extracts top 5 products from JD.com search results page
 */
export const jdSearchScraper = () => {
  const products = [];

  try {
    // Select all search result items
    const items = document.querySelectorAll('.gl-item');

    for (const item of items) {
      if (products.length >= MAX_PRODUCTS) break;

      try {
        // Extract title
        const titleElement = item.querySelector('.p-name em');
        if (!titleElement) continue;

        const title = titleElement.innerText.trim();
        if (!title) continue;

        // Extract price (JD prices are in CNY)
        const priceElement = item.querySelector('.p-price i');
        if (!priceElement) continue;

        const price = parseFloat(priceElement.innerText.trim());
        if (isNaN(price) || price === 0) continue;

        // Extract URL
        const linkElement = item.querySelector('.p-name a');
        const url = linkElement ? `https:${linkElement.href}` : '';

        // Extract image URL
        const imgElement = item.querySelector('img');
        const imageUrl = normalizeUrl(extractImageUrl(imgElement));

        // JD search results typically don't show seller in list view
        const seller = '';
        const rating = 0;
        const reviews = 0;

        // Add product to results (note: currency is CNY for JD)
        products.push({
          title,
          price,
          currency: 'CNY',
          url,
          imageUrl,
          seller,
          rating,
          reviews
        });

      } catch (error) {
        logItemError('JD', error);
        continue;
      }
    }

  } catch (error) {
    logScraperError('JD', error);
  }

  return products;
};

/**
 * Pinduoduo Search Result Scraper
 * Extracts top 5 products from Pinduoduo search results page
 */
export const pinduoduoSearchScraper = () => {
  const products = [];

  try {
    // Select all search result items (Pinduoduo uses dynamic class names)
    const items = document.querySelectorAll('[class*="goods-item"]');

    for (const item of items) {
      if (products.length >= MAX_PRODUCTS) break;

      try {
        // Extract title
        const titleElement = item.querySelector('[class*="goods-title"]');
        if (!titleElement) continue;

        const title = titleElement.innerText.trim();
        if (!title) continue;

        // Extract price (Pinduoduo prices are in CNY)
        const priceElement = item.querySelector('[class*="goods-price"]');
        if (!priceElement) continue;

        const priceText = priceElement.innerText.trim();
        const priceMatch = priceText.match(/[\d.]+/);
        if (!priceMatch) continue;

        const price = parseFloat(priceMatch[0]);
        if (isNaN(price) || price === 0) continue;

        // Pinduoduo search results use current page URL
        const url = window.location.href;

        // Extract image URL
        const imgElement = item.querySelector('img');
        const imageUrl = extractImageUrl(imgElement);

        // Pinduoduo search results typically don't show seller, rating, or reviews in list view
        const seller = '';
        const rating = 0;
        const reviews = 0;

        // Add product to results (note: currency is CNY for Pinduoduo)
        products.push({
          title,
          price,
          currency: 'CNY',
          url,
          imageUrl,
          seller,
          rating,
          reviews
        });

      } catch (error) {
        logItemError('Pinduoduo', error);
        continue;
      }
    }

  } catch (error) {
    logScraperError('Pinduoduo', error);
  }

  return products;
};

/**
 * Helper function to get the appropriate scraper for a platform
 * @param {string} platformId - Platform identifier (e.g., 'ebay', 'aliexpress', 'taobao')
 * @returns {Function|null} Scraper function or null if not available
 */
export const getSearchScraper = (platformId) => {
  // Input validation: handle invalid types, capitalization, and whitespace
  if (!platformId || typeof platformId !== 'string') return null;

  const normalizedId = platformId.toLowerCase().trim();

  const scrapers = {
    ebay: ebaySearchScraper,
    aliexpress: aliexpressSearchScraper,
    taobao: taobaoSearchScraper,
    walmart: walmartSearchScraper,
    jd: jdSearchScraper,
    pinduoduo: pinduoduoSearchScraper
  };

  return scrapers[normalizedId] || null;
};
