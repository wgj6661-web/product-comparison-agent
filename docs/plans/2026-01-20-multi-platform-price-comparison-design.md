# Multi-Platform Price Comparison Design

**Date:** 2026-01-20
**Status:** Approved
**Implementation Model:** Incremental Extension (Plan A)

## Overview

Upgrade the current arbitrage analysis tool from a two-platform comparison (Amazon + 1688) to a multi-platform price comparison system supporting 12+ e-commerce platforms.

## Requirements

- **Platform Coverage:** International e-commerce, Chinese sourcing, vertical marketplaces, wholesale platforms
- **Data Acquisition:** Web scraping (no API dependencies)
- **Product Matching:** AI-based keyword extraction and search
- **Result Display:** Comparison table showing all platforms with profit metrics
- **Configuration:** All cost parameters must be user-configurable

## Architecture

### 1. Overall Architecture

**Core Flow:**
1. User clicks "RUN" on any supported platform's product page
2. Extract current product info (title, price, image, specs)
3. Call NVIDIA API to extract core search keywords (brand, model, specs)
4. Use extracted keywords to search on configured target platforms
5. Inject scrapers into search result pages to extract top 3-5 matching products
6. Aggregate all platform data and calculate profit/ROI/score for each
7. Display comparison table with optimal platform highlighted

**Key Changes:**
- From "fixed two-platform comparison" to "dynamic multi-platform search"
- Retain existing NVIDIA API analysis, add keyword extraction
- New search URL builder and result page scraper modules
- UI upgrade from single result card to comparison table view

### 2. Platform Configuration

**Configuration File:** `src/config/platforms.js`

```javascript
{
  id: 'ebay',
  name: 'eBay',
  searchUrl: 'https://www.ebay.com/sch/i.html?_nkw={query}',
  scraper: ebayScraper,
  enabled: true,
  category: 'international',
  region: 'usa'
}
```

**Supported Platforms (Priority Order):**

**Batch 1 (Core 6):**
- Amazon (existing)
- 1688.com (existing)
- eBay
- AliExpress
- Taobao
- Alibaba.com

**Batch 2 (Extended 6):**
- Walmart
- Pinduoduo
- JD.com
- Etsy
- Wayfair
- Made-in-China

**Scraper Unified Interface:**
```javascript
{
  title: "Product Title",
  price: 123.45,        // Normalized to USD
  currency: "USD",
  url: "Product URL",
  imageUrl: "Image URL",
  seller: "Seller Name",
  rating: 4.5,
  reviews: 1234
}
```

**Search Result Scraper:**
Unlike existing product detail scrapers, search scrapers extract multiple products from listing pages. Example: eBay search scraper extracts first 5 results from `.s-item` containers.

### 3. AI Keyword Extraction and Search Matching

**Keyword Extraction Flow:**

1. **Extract Original Product Info:** Use existing scraper to get full title
2. **AI Keyword Extraction:** Call NVIDIA API with specialized prompt:
   ```
   Extract core search keywords from the following product title. Return only English keywords,
   remove brand words and adjectives, keep model numbers, specs, and category.

   Example: 'Apple iPhone 15 Pro Max 256GB Blue' -> 'iPhone 15 Pro Max 256GB'

   Product Title: {title}

   Return JSON: {"keywords": "...", "category": "...", "brand": "..."}
   ```

3. **Generate Search Query:**
   - Primary query: Use extracted keywords
   - Fallback query: Use brand + category combination if primary yields no results

4. **Cross-Platform Search:**
   - Build search URL for each enabled platform
   - Open multiple tabs in parallel (using chrome.tabs.create)
   - Inject corresponding scraper into each search result page

5. **Result Filtering and Sorting:**
   - Use AI for similarity matching (keep title similarity > 70%)
   - Sort by price low to high
   - Keep top 3 most relevant results per platform

**Technical Implementation:**
- Use `chrome.tabs.create` to open search pages in background tabs
- Inject scraper after page load (monitor `chrome.tabs.onUpdated`)
- 5-second timeout mechanism per platform
- Close temporary tabs after aggregating all results

### 4. Data Aggregation and Configurable Cost Calculation

**Cost Configuration File:** `src/config/costConfig.js`

```javascript
{
  exchange: {
    cnyToUsd: 7.23,
    updateTime: "2026-01-20"
  },
  shipping: {
    usa: 1.15,      // $/lb
    europe: 1.35,
    other: 1.25
  },
  platformFees: {
    amazon: "FBA Calculator",
    ebay: 10,       // %
    walmart: 15,
    aliexpress: 8,
    etsy: 6.5,
    taobao: 0,
    "1688": 0,
    jd: 0,
    pinduoduo: 0
  },
  marketing: 12,    // % CAC
  vat: 5,           // % Tax
  filters: {
    minRoi: 30,     // % Minimum ROI threshold
    minScore: 60
  }
}
```

**Multi-Platform Data Aggregation:**
```javascript
{
  platform: "eBay",
  product: {
    title: "...",
    price: 399.99,
    url: "...",
    image: "..."
  },
  costs: {
    sourceCost: 85.73,      // Lowest Chinese platform ÷ exchange
    shipping: 48.30,
    platformFee: 39.99,
    marketing: 47.99,
    vat: 19.99
  },
  metrics: {
    netProfit: 157.99,
    margin: "39.5%",
    roi: "184%",
    score: 88,
    breakEven: 15
  }
}
```

**Cost Calculation Rules:**
- **Source Cost:** Lowest price from all Chinese platforms
- **Shipping:** Based on weight and target region
- **Platform Fees:** Configurable per platform
- **Marketing:** Fixed percentage (configurable)
- **Tax/VAT:** Fixed percentage (configurable)

**Sorting Logic:**
1. Primary: ROI descending
2. Secondary: Score descending
3. Filter: Mark ROI < 30% as "Not Recommended"

**UI Settings Panel Extension:**
Add "Cost Configuration" tab in existing Settings panel:
- Exchange rate settings (with "Fetch Live Rate" button)
- Shipping cost matrix (by region)
- Platform fee table (all platform rates)
- Marketing/Tax percentage sliders
- Filter threshold settings

**Configuration Persistence:**
- Save to `chrome.storage.local` under `cost_config` key
- Load default config on first use
- Provide "Reset to Defaults" button

### 5. UI Design and Comparison Table

**UI Layout Adjustments:**

Current UI is single-result mode (450px × 600px). Multi-platform comparison requires:

**Solution: Expandable Result Area**
- Keep popup size unchanged
- Change analysis result from single card to scrollable table
- Table height occupies main content area (~350px)

**Comparison Table Design:**

| Platform | Price | Source Cost | Net Profit | ROI | Score | Action |
|----------|-------|-------------|------------|-----|-------|--------|
| 🥇 eBay  | $399  | $85.73      | $157.99    | 184%| 88    | [Details] |
| 🥈 Amazon| $389  | $85.73      | $120.50    | 140%| 85    | [Details] |
| 🥉 Walmart| $419 | $85.73      | $145.20    | 169%| 82    | [Details] |

**Table Features:**
- Top 3 display medal icons (🥇🥈🥉)
- ROI > 150%: Green background
- ROI 100-150%: Blue background
- ROI 50-100%: Yellow background
- ROI < 50%: Gray background
- Click "Details" to expand SWOT and action plan (collapsible panel)

**Loading State:**
- Show skeleton table during search phase
- Fill rows progressively as each platform returns data
- Display progress: "Analyzed 3/8 platforms..."

### 6. Error Handling and Performance Optimization

**Error Handling Strategy:**

**1. Scraper Failure:**
- Single platform scraper failure doesn't affect others
- Failed platforms show "Data Fetch Failed" status in table
- Retry mechanism: Auto-retry once, 1.5s interval
- Timeout: Max 5 seconds per platform

**2. No Search Results:**
- If primary keywords yield no results, try fallback keywords
- If still no results, mark as "No Matching Product Found"
- Platform excluded from profit calculation and sorting

**3. AI Service Failure:**
- If keyword extraction fails, use first 50 characters of original title
- If NVIDIA API rate-limited, show friendly message and suggest retry

**Performance Optimization:**

**1. Parallel Processing:**
- All platform searches and scraping execute in parallel
- Use `Promise.allSettled()` to avoid single-point failure blocking
- Complete all platform analysis in 3-5 seconds (fastest case)

**2. Tab Management:**
- Limit max 6 concurrent background tabs
- Batch processing: Process remaining platforms after first batch completes
- Close all tabs immediately after scraper execution

**3. Caching Mechanism:**
- Cache search results for same product for 5 minutes (chrome.storage.session)
- Cache key: Product title hash + platform ID
- User can select "Force Refresh" to skip cache

**4. User Experience:**
- Show real-time logs: "Searching eBay..."
- Display progress bar: Completed platforms / Total platforms
- Allow user to cancel analysis (close all background tabs)

## File Structure

```
src/
├── App.jsx                      # Main component (needs refactor)
├── main.jsx
├── index.css
├── config/
│   ├── platforms.js            # 🆕 Platform configuration list
│   └── costConfig.js           # 🆕 Cost calculation config
├── utils/
│   ├── scrapers.js             # Existing (keep)
│   ├── searchScrapers.js       # 🆕 Search result page scrapers
│   ├── keywordExtractor.js     # 🆕 AI keyword extraction
│   ├── profitCalculator.js     # 🆕 Profit calculation engine
│   └── tabManager.js           # 🆕 Tab management
└── components/
    ├── ComparisonTable.jsx     # 🆕 Comparison table component
    ├── PlatformRow.jsx         # 🆕 Single platform row component
    ├── SettingsPanel.jsx       # 🆕 Settings panel (extracted)
    └── CostConfigPanel.jsx     # 🆕 Cost configuration panel
```

## Implementation Plan (4 Phases)

**Phase 1 - Foundation (2-3 days):**
1. Create platform and cost configuration files
2. Refactor App.jsx, split into components
3. Implement configuration management and persistence
4. Update UI to table layout (empty data)

**Phase 2 - Core Features (3-4 days):**
5. Implement AI keyword extraction module
6. Implement tab management and search URL builder
7. Create search scrapers for first 3 platforms (eBay, AliExpress, Taobao)
8. Implement profit calculation engine

**Phase 3 - Platform Expansion (3-4 days):**
9. Add search scrapers for remaining 9 platforms
10. Test and optimize scraper accuracy for each platform
11. Implement error handling and retry logic
12. Add caching mechanism

**Phase 4 - Optimization and Testing (2-3 days):**
13. Performance optimization and parallel processing
14. UI/UX detail polishing
15. End-to-end testing
16. Documentation updates

**Estimated Timeline:** 10-14 days

## Success Metrics

- Support 12+ platforms successfully
- Average analysis completion time < 8 seconds
- Scraper success rate > 85% per platform
- All cost parameters configurable via UI
- Comparison table displays clearly on 450px width

## Future Enhancements

- API integration for platforms with official APIs
- Product image comparison
- Historical price tracking
- Browser notification on high-profit opportunities
- Export comparison results to CSV/PDF
