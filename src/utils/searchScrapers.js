/**
 * Search Result Page Scrapers
 *
 * These scrapers run in the page context (injected via chrome.scripting.executeScript)
 * and extract product listings from search result pages.
 *
 * Each scraper returns an array of up to 5 products with standardized format.
 */

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
      // Skip if we already have 5 products
      if (products.length >= 5) break;

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
        if (!priceElement) continue;

        const priceText = priceElement.innerText.trim();
        // Extract numeric price (handle formats like "$123.45", "$123", "US $123.45")
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        if (!priceMatch) continue;

        const price = parseFloat(priceMatch[0].replace(/,/g, ''));
        if (isNaN(price) || price === 0) continue;

        // Extract URL
        const linkElement = item.querySelector('.s-item__link');
        const url = linkElement ? linkElement.href : '';

        // Extract image URL
        const imgElement = item.querySelector('.s-item__image-img') ||
                          item.querySelector('img');
        const imageUrl = imgElement ? imgElement.src : '';

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
        console.error('eBay item parsing error:', error);
        // Skip this item and continue with next
        continue;
      }
    }

  } catch (error) {
    console.error('eBay search scraper error:', error);
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
      // Skip if we already have 5 products
      if (products.length >= 5) break;

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
        if (!priceElement) continue;

        const priceText = priceElement.innerText.trim();
        // Extract numeric price (handle formats like "$123.45", "US $123.45", "123.45")
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        if (!priceMatch) continue;

        const price = parseFloat(priceMatch[0].replace(/,/g, ''));
        if (isNaN(price) || price === 0) continue;

        // Extract URL
        const linkElement = item.querySelector('a[href*="/item/"]') ||
                           item.querySelector('a');
        let url = linkElement ? linkElement.href : '';
        // Ensure absolute URL
        if (url && url.startsWith('//')) {
          url = 'https:' + url;
        }

        // Extract image URL
        const imgElement = item.querySelector('img');
        let imageUrl = '';
        if (imgElement) {
          imageUrl = imgElement.src || imgElement.getAttribute('data-src') || '';
          if (imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          }
        }

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
        console.error('AliExpress item parsing error:', error);
        // Skip this item and continue with next
        continue;
      }
    }

  } catch (error) {
    console.error('AliExpress search scraper error:', error);
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
      // Skip if we already have 5 products
      if (products.length >= 5) break;

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
        if (!priceElement) continue;

        const priceText = priceElement.innerText.trim();
        // Extract numeric price (handle formats like "¥123.45", "123.45", "123")
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        if (!priceMatch) continue;

        const price = parseFloat(priceMatch[0].replace(/,/g, ''));
        if (isNaN(price) || price === 0) continue;

        // Extract URL
        const linkElement = item.querySelector('a[href*="item.taobao.com"], a[href*="detail.tmall.com"]') ||
                           item.querySelector('a');
        let url = linkElement ? linkElement.href : '';
        // Ensure absolute URL
        if (url && url.startsWith('//')) {
          url = 'https:' + url;
        }

        // Extract image URL
        const imgElement = item.querySelector('img');
        let imageUrl = '';
        if (imgElement) {
          imageUrl = imgElement.src ||
                    imgElement.getAttribute('data-src') ||
                    imgElement.getAttribute('data-lazy-img') || '';
          if (imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          }
        }

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
        console.error('Taobao item parsing error:', error);
        // Skip this item and continue with next
        continue;
      }
    }

  } catch (error) {
    console.error('Taobao search scraper error:', error);
  }

  return products;
};

/**
 * Helper function to get the appropriate scraper for a platform
 * @param {string} platformId - Platform identifier (e.g., 'ebay', 'aliexpress', 'taobao')
 * @returns {Function|null} Scraper function or null if not available
 */
export const getSearchScraper = (platformId) => {
  const scrapers = {
    ebay: ebaySearchScraper,
    aliexpress: aliexpressSearchScraper,
    taobao: taobaoSearchScraper
  };

  return scrapers[platformId] || null;
};
