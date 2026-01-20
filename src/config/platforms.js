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
