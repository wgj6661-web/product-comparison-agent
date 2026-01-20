# Product Comparison Agent

A Chrome extension for cross-border e-commerce arbitrage analysis. Analyze products from Amazon and 1688.com (Chinese sourcing platform) to calculate profitability, SWOT analysis, and strategic recommendations using NVIDIA NIM API.

## Features

- **Multi-Platform Price Comparison**: Compare prices across 12+ e-commerce platforms
  - International: Amazon, eBay, Walmart, AliExpress, Etsy, Wayfair
  - Chinese Sourcing: 1688.com, Taobao, JD.com, Pinduoduo, Alibaba.com, Made-in-China
- **AI-Powered Product Matching**: NVIDIA NIM API extracts keywords for cross-platform search
- **Configurable Cost Analysis**: Customize exchange rates, shipping, platform fees, marketing costs
- **Real-Time Profit Calculation**: ROI, margins, break-even analysis for each platform
- **Comparison Table UI**: Visual ranking with expandable details
- **Smart Caching**: 5-minute cache for faster repeated analyses
- **Parallel Processing**: Searches multiple platforms simultaneously with progress tracking

## Tech Stack

- React 18 + Vite
- Chrome Extension Manifest V3
- TailwindCSS
- NVIDIA NIM API (Llama 3.1 405B, GLM-4, etc.)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- NVIDIA API Key (get it from https://build.nvidia.com/explore/llm)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/wgj6661-web/product-comparison-agent.git
cd product-comparison-agent
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env and add your NVIDIA API key
```

4. Development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

### Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist` folder

## Usage

1. **Navigate to a Product Page**: Open any Amazon or 1688.com product page
2. **Open Extension**: Click the extension icon in Chrome toolbar
3. **Configure Settings** (optional):
   - Click ⚙️ to set NVIDIA API key and select model
   - Click 💰 to adjust cost parameters (exchange rate, shipping, fees)
4. **Run Analysis**: Click "RUN ANALYSIS" button
5. **View Results**:
   - Progress bar shows platform search status
   - Comparison table displays all platforms sorted by ROI
   - Click chevron (▼) on any row to see detailed cost breakdown
6. **Force Refresh**: Check "Force Refresh" to bypass cache and get fresh results

### Pro Tips
- First run extracts product details and searches all platforms (~15-30 seconds)
- Subsequent runs use 5-minute cache for instant results
- Change cost config? Cache is automatically cleared
- Best ROI platforms are highlighted in emerald/blue colors

## Configuration

### API Settings
- NVIDIA API Key (stored securely in chrome.storage.local)
- Model selection (7 models available including Llama 3.1 405B, GLM-4, Gemini)

### Cost Configuration
- Exchange rates (CNY/USD, user-adjustable)
- Shipping costs by region (USA: $1.15/lb, Europe: $1.35/lb, Other: $1.25/lb)
- Platform fee percentages (customizable per platform)
  - Amazon: Uses FBA calculator
  - eBay: 10%, Walmart: 15%, AliExpress: 8%, Etsy: 6.5%, Wayfair: 12%
- Marketing CAC percentage (default: 12%)
- VAT/Tax percentage (default: 5%)
- ROI and score filter thresholds (min ROI: 30%, min score: 60)

### Platform Selection
- Enable/disable specific platforms via configuration
- Currently supporting 12 platforms across 3 categories:
  - International (6 platforms)
  - Sourcing (4 platforms)
  - Wholesale (2 platforms)

## Project Structure

```
├── src/
│   ├── App.jsx           # Main application component
│   ├── main.jsx          # React entry point
│   ├── index.css         # Global styles
│   └── utils/
│       └── scrapers.js   # Amazon & 1688 scrapers
├── public/
│   ├── manifest.json     # Chrome Extension manifest
│   └── background.js     # Service worker
├── dist/                 # Build output
├── index.html
├── vite.config.js
└── tailwind.config.js
```

## License

MIT
