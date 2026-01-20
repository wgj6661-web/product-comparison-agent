# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension for cross-border e-commerce arbitrage analysis. The extension analyzes products from Amazon and 1688.com (Chinese sourcing platform), using NVIDIA NIM API with large language models to provide profitability assessments, SWOT analysis, and strategic recommendations.

**Key Technology Stack:**
- React 18 with Vite as build tool
- Chrome Extension Manifest V3
- TailwindCSS for styling
- NVIDIA NIM API for AI inference (supports multiple models including Llama 3.1 405B, GLM-4, Gemini, etc.)
- Chrome Scripting API for web scraping

## Recent Major Changes (2026-01-20)

### Multi-Platform Comparison Feature

**Overview**: Upgraded from 2-platform comparison (Amazon + 1688) to 12+ platform support with AI-powered product matching and configurable cost analysis.

**Key Components**:
- **AI Keyword Extraction** (`src/utils/keywordExtractor.js`): Uses NVIDIA NIM API to extract searchable keywords from product titles, removing adjectives and promotional words
- **Multi-Platform Search Scrapers** (`src/utils/searchScrapers.js`): Content script scrapers for eBay, AliExpress, Taobao, Walmart, JD, Pinduoduo
- **Parallel Tab Manager** (`src/utils/tabManager.js`): Manages background tabs for simultaneous platform searches with dynamic batch sizing (4/6/8 tabs)
- **Profit Calculator** (`src/utils/profitCalculator.js`): Calculates net profit, ROI, margins with configurable cost parameters
- **Caching System** (`src/utils/cache.js`): 5-minute cache using chrome.storage.session with automatic invalidation on config changes
- **Comparison Table UI** (`src/components/ComparisonTable.jsx`, `src/components/PlatformRow.jsx`): Sortable comparison table with expandable row details

**Architecture Changes**:
- Platform configuration moved to `src/config/platforms.js` (12 platforms with enable/disable flags)
- Cost configuration moved to `src/config/costConfig.js` (exchange rates, shipping, fees)
- Settings panels split into `SettingsPanel.jsx` and `CostConfigPanel.jsx`
- App.jsx refactored to orchestrate multi-platform workflow instead of single analysis

**New File Structure**:
```
src/
├── config/
│   ├── platforms.js         # Platform definitions (12 platforms)
│   └── costConfig.js         # Cost calculation parameters
├── components/
│   ├── ComparisonTable.jsx   # Main comparison table container
│   ├── PlatformRow.jsx       # Individual platform row with expandable details
│   ├── SettingsPanel.jsx     # API key and model settings
│   └── CostConfigPanel.jsx   # Cost parameter configuration
├── utils/
│   ├── keywordExtractor.js   # AI keyword extraction (NVIDIA NIM)
│   ├── searchScrapers.js     # Search result scrapers (6 platforms)
│   ├── tabManager.js         # Chrome tab management with retry logic
│   ├── profitCalculator.js   # Profit/ROI calculation engine
│   ├── cache.js              # Session-based caching system
│   └── scrapers.js           # Original Amazon/1688 detail scrapers
```

**Performance Optimizations**:
- Dynamic batch sizing: 4 tabs (1-4 platforms), 6 tabs (5-8 platforms), 8 tabs (9+ platforms)
- Session-based caching with 5-minute expiration reduces redundant API calls
- Progress tracking with visual progress bar for user feedback
- Parallel processing with Promise.allSettled for resilience

**Known Limitations**:
- Financial precision uses `toFixed(2)` - acceptable for single transactions, consider decimal.js for batch operations (>1000 calculations)
- Cache uses base64 encoding for keys - collision-resistant but not cryptographically secure
- Max 8 concurrent tabs to prevent browser resource exhaustion
- Scrapers are fragile - platform DOM changes require scraper updates

## Common Commands

```bash
# Development server (uses Vite proxy for NVIDIA API)
npm run dev

# Build for production (creates Chrome extension in dist/)
npm run build

# Preview production build
npm run preview
```

## Architecture

### Extension Structure

The application operates in two environments with different API routing:

1. **Chrome Extension Environment**: Uses `chrome.runtime.sendMessage()` to route API calls through the background service worker (public/background.js) to bypass CORS restrictions.

2. **Local Development Environment**: Uses Vite's proxy configuration (defined in vite.config.js) to route `/nvidia-api/*` requests to NVIDIA's API.

### Core Components

**Main Application (src/App.jsx)**
- Single-page React component containing the entire UI and business logic
- Handles dual-mode operation (extension vs. local dev)
- API calls use intelligent routing based on environment detection (`chrome.runtime.sendMessage` vs. `fetch`)
- State management via React hooks (no external state library)

**Scrapers (src/utils/scrapers.js)**
- `amazonScraper()`: Extracts product data from Amazon pages (price, ASIN, weight, BSR)
- `sourcingScraper()`: Extracts data from 1688.com pages (CNY cost, MOQ, supplier info)
- Both scrapers are injected via `chrome.scripting.executeScript()` and run in the page context

**Background Service Worker (public/background.js)**
- Chrome Extension Manifest V3 service worker
- Intercepts `fetchNvidia` messages and performs API calls to bypass CORS
- Essential for production extension builds

### Data Flow

1. User opens extension popup on Amazon or 1688 product page
2. Extension auto-detects current tab URL
3. On "RUN" click:
   - Appropriate scraper is injected into page via Chrome Scripting API
   - Extracted data is combined with default values for missing marketplace
   - Data sent to NVIDIA NIM API with structured prompt requesting strict JSON response
   - AI model performs profitability analysis, SWOT analysis, and generates recommendations
   - Results rendered in glassmorphic UI with profit score, ROI, and action plan

### Build Configuration

**Vite (vite.config.js)**
- Proxy configuration: `/nvidia-api` → `https://integrate.api.nvidia.com/v1` for local development
- React plugin enabled with @vitejs/plugin-react

**Manifest (public/manifest.json)**
- Chrome Extension V3 manifest
- Permissions: `activeTab`, `scripting`
- Host permissions for NVIDIA API, Google Generative Language API, Amazon, 1688
- Service worker: background.js

### API Integration

**NVIDIA NIM API**
- Base URL: `https://integrate.api.nvidia.com/v1`
- Default model: `meta/llama-3.1-405b-instruct`
- User-configurable API key stored in chrome.storage.local
- Supports 7 different models via settings panel
- Temperature: 0.1 (deterministic), Top-P: 0.1
- Max tokens: 1024

**Prompt Engineering**
- System prompt enforces strict JSON-only responses (no markdown, no commentary)
- Includes detailed cost breakdown: Amazon price, CNY cost, FBA fees, shipping (1.15/lb), marketing (12% CAC), VAT (5%)
- Exchange rate: 7.23 CNY/USD (hardcoded, user-adjustable in UI)

### Chrome Extension Features

- Settings persistence via `chrome.storage.local` (API key, model preference)
- Tab URL auto-detection via `chrome.tabs.query()`
- Content script injection with retry logic (3 attempts with 1.5s delays)
- Error handling for script injection failures in non-accessible pages

### Styling Approach

- TailwindCSS utility-first approach
- Fixed dimensions: 450px × 600px popup
- Dark theme with glassmorphic UI elements
- Custom animations: fade-in, slide-in
- Gradient overlays and backdrop blur for depth

## Important Notes

- API keys are stored in chrome.storage.local but also hardcoded in CONFIG object (src/App.jsx:14) - remove hardcoded key before public release
- Scrapers use fallback selector chains since Amazon/1688 frequently change their DOM structure
- JSON parsing includes regex fallback to extract JSON from LLM responses that ignore system prompt
- Exchange rate is hardcoded (7.23) - not fetched dynamically
- No automated tests are configured

**New in Multi-Platform Feature**:
- Platform scrapers are injected as content scripts and run in page context (requires host permissions in manifest.json)
- Cache uses chrome.storage.session (10MB quota, auto-clears on browser close)
- Progress tracking uses explicit completion signals to avoid race conditions
- Cost config changes automatically invalidate cache to prevent stale calculations
- Batch size is capped at 8 concurrent tabs to prevent browser performance issues
- Financial calculations use toFixed(2) for display precision (see profitCalculator.js for scaling notes)

## File Structure

```
src/
├── App.jsx                   # Main application (multi-platform workflow orchestration)
├── main.jsx                  # React entry point
├── index.css                 # Global Tailwind imports
├── config/
│   ├── platforms.js          # Platform definitions and categories
│   └── costConfig.js         # Cost calculation configuration
├── components/
│   ├── ComparisonTable.jsx   # Platform comparison table container
│   ├── PlatformRow.jsx       # Individual platform row component
│   ├── SettingsPanel.jsx     # API settings panel
│   └── CostConfigPanel.jsx   # Cost configuration panel
└── utils/
    ├── keywordExtractor.js   # AI keyword extraction (NVIDIA NIM)
    ├── searchScrapers.js     # Multi-platform search scrapers
    ├── tabManager.js         # Chrome tab management
    ├── profitCalculator.js   # Profit calculation engine
    ├── cache.js              # Session caching system
    └── scrapers.js           # Detail page scrapers (Amazon/1688)

public/
├── manifest.json             # Chrome Extension manifest (updated host permissions)
└── background.js             # Service worker for CORS bypass

docs/
└── plans/
    └── 2026-01-20-multi-platform-comparison-implementation.md  # Implementation plan

dist/                         # Build output (npm run build)
```
