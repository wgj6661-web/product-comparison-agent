/**
 * Firecrawl API Service
 * Handles search and scraping operations using Firecrawl API
 */

const API_KEY = import.meta.env.VITE_FIRECRAWL_API_KEY || '';
const API_URL = 'https://api.firecrawl.dev/v1';

/**
 * Clean price string to number
 * @param {string} priceStr 
 * @returns {number|null}
 */
const parsePrice = (priceStr) => {
  if (!priceStr) return null;
  const match = priceStr.toString().match(/[\d,]+(?:\.\d+)?/);
  if (!match) return null;
  const price = parseFloat(match[0].replace(/,/g, ''));
  return (isNaN(price) || price === 0) ? null : price;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url, options, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 2000 * (i + 1); // Default backoff
      console.warn(`Firecrawl Rate Limited. Waiting ${waitTime}ms...`);
      await sleep(waitTime);
      continue;
    }

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status} ${response.statusText}`);
    }

    return response;
  }
  throw new Error('Max retries exceeded for Firecrawl API');
};

/**
 * Search on a specific platform using Firecrawl
 * @param {string} platformName - e.g. 'Amazon', 'AliExpress'
 * @param {string} query - Search query
 * @param {number} limit - Number of results to return
 * @returns {Promise<Array>} Standardized product list
 */
export const searchWithFirecrawl = async (platformName, query, limit = 5) => {
  try {
    // Construct search URL logic (simplified mapping)
    const getSearchUrl = (platform, q) => {
      const p = platform.toLowerCase();
      const encodedQ = encodeURIComponent(q);
      if (p.includes('amazon')) return `https://www.amazon.com/s?k=${encodedQ}`;
      if (p.includes('ebay')) return `https://www.ebay.com/sch/i.html?_nkw=${encodedQ}`;
      if (p.includes('aliexpress')) return `https://www.aliexpress.com/wholesale?SearchText=${encodedQ}`;
      if (p.includes('taobao')) return `https://s.taobao.com/search?q=${encodedQ}`;
      if (p.includes('jd')) return `https://search.jd.com/Search?keyword=${encodedQ}`;
      if (p.includes('1688')) return `https://s.1688.com/selloffer/offer_search.htm?keywords=${encodedQ}`; // 1688
      if (p.includes('alibaba')) return `https://www.alibaba.com/trade/search?fsb=y&IndexArea=product_en&CatId=&SearchText=${encodedQ}`;
      if (p.includes('walmart')) return `https://www.walmart.com/search?q=${encodedQ}`;
      
      // Fallback to google search for others (e.g. Pinduoduo)
      return `https://www.google.com/search?q=site:${p}.com+${encodedQ}&tbm=shop`;
    };

    const targetUrl = getSearchUrl(platformName, query);

    // Using /scrape endpoint
    const scrapeResponse = await fetchWithRetry(`${API_URL}/scrape`, {
      method: 'POST',
      headers: {
         'Authorization': `Bearer ${API_KEY}`,
         'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: targetUrl,
        formats: ['extract'],
        extract: {
          schema: {
            type: "object",
            properties: {
              products: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    price: { type: "string" }, // Extracts as string, clean later
                    currency: { type: "string" },
                    url: { type: "string" },
                    imageUrl: { type: "string" },
                    seller: { type: "string" },
                    rating: { type: "number" },
                    reviews: { type: "number" }
                  },
                  required: ["title", "price"]
                }
              }
            },
            required: ["products"]
          }
        }
      })
    });

    const json = await scrapeResponse.json();
    const extractedData = json.data?.extract;

    if (!extractedData || !extractedData.products) {
      return [];
    }

    // Standardize output
    return extractedData.products.slice(0, limit).map(p => ({
      title: p.title,
      price: parsePrice(p.price),
      currency: p.currency || 'USD', // Default assumption, improve logic if needed
      url: p.url,
      imageUrl: p.imageUrl,
      seller: p.seller || platformName,
      rating: p.rating || 0,
      reviews: p.reviews || 0
    })).filter(p => p.price !== null);

  } catch (error) {
    console.error('Firecrawl Service Error:', error);
    return [];
  }
};
