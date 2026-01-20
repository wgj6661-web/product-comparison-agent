# Product Comparison Agent

A Chrome extension for cross-border e-commerce arbitrage analysis. Analyze products from Amazon and 1688.com (Chinese sourcing platform) to calculate profitability, SWOT analysis, and strategic recommendations using NVIDIA NIM API.

## Features

- **Product Scraping**: Extract product data from Amazon and 1688.com
- **Profitability Analysis**: Calculate ROI, margins, and profit scores
- **SWOT Analysis**: AI-powered strengths, weaknesses, opportunities, threats
- **Strategic Recommendations**: Actionable insights for arbitrage opportunities

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

1. Open the extension on an Amazon or 1688 product page
2. Click "RUN" to analyze the product
3. View profitability analysis, SWOT, and recommendations

## Configuration

API settings can be configured in the extension UI:
- NVIDIA API Key
- Model selection (Llama 3.1 405B, GLM-4, etc.)
- Exchange rate (CNY/USD)

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
