/**
 * Profit calculation engine with configurable cost parameters
 * Calculates net profit, ROI, margins for each platform
 */

import { DEFAULT_COST_CONFIG } from '../config/costConfig';
import { PLATFORMS, getPlatformsByCategory } from '../config/platforms';

/**
 * Calculate profit metrics for a platform
 * @param {Object} params - Calculation parameters
 * @param {number} params.sellingPrice - Platform selling price in USD
 * @param {number} params.sourceCost - Source cost in USD (already converted)
 * @param {number} params.weight - Product weight in lbs
 * @param {string} params.platformId - Platform identifier
 * @param {Object} costConfig - Cost configuration object
 * @returns {Object} Profit metrics
 */
export const calculateProfitMetrics = ({
  sellingPrice,
  sourceCost,
  weight,
  platformId
}, costConfig = DEFAULT_COST_CONFIG) => {

  // Input validation
  if (typeof sellingPrice !== 'number' || sellingPrice < 0) {
    throw new Error('sellingPrice must be a non-negative number');
  }
  if (typeof sourceCost !== 'number' || sourceCost < 0) {
    throw new Error('sourceCost must be a non-negative number');
  }
  if (typeof weight !== 'number' || weight <= 0) {
    throw new Error('weight must be a positive number');
  }

  const platform = PLATFORMS.find(p => p.id === platformId);
  if (!platform) {
    throw new Error(`Platform ${platformId} not found`);
  }

  // Determine shipping cost based on platform region
  let shippingCostPerLb;
  if (platform.region === 'usa') {
    shippingCostPerLb = costConfig.shipping.usa;
  } else if (platform.region === 'europe') {
    shippingCostPerLb = costConfig.shipping.europe;
  } else {
    shippingCostPerLb = costConfig.shipping.other;
  }

  const shippingCost = weight * shippingCostPerLb;

  // Calculate platform fee
  let platformFee;
  const feeConfig = costConfig.platformFees[platformId];

  if (feeConfig === 'fba_calculator' || platformId === 'amazon') {
    // Use simplified FBA calculation (can be enhanced later)
    platformFee = sellingPrice * 0.15; // Approximate 15%
  } else {
    platformFee = sellingPrice * (feeConfig / 100);
  }

  // Calculate marketing and VAT
  const marketingCost = sellingPrice * (costConfig.marketing / 100);
  const vatCost = sellingPrice * (costConfig.vat / 100);

  // Total costs
  const totalCost = sourceCost + shippingCost + platformFee + marketingCost + vatCost;

  // Net profit
  const netProfit = sellingPrice - totalCost;

  // Margin percentage
  const margin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;

  // ROI percentage
  const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

  // Break-even units: number of units to sell to recover $1000 in fixed costs
  // If netProfit <= 0, returns a very high number (effectively infinity)
  const breakEven = netProfit > 0 ? Math.ceil(1000 / netProfit) : Infinity;

  return {
    sellingPrice,
    costs: {
      sourceCost,
      shipping: shippingCost,
      platformFee,
      marketing: marketingCost,
      vat: vatCost,
      total: totalCost
    },
    // Note: Using toFixed for display precision. For high-volume calculations,
    // consider using a decimal library (decimal.js) for exact financial math.
    netProfit: parseFloat(netProfit.toFixed(2)),
    margin: `${margin.toFixed(1)}%`,
    roi: `${roi.toFixed(0)}%`,
    breakEven,
    score: 0 // Will be set by AI analysis
  };
};

/**
 * Find lowest source cost from Chinese platforms
 * @param {Object} allPlatformResults - Results from all platforms
 * @param {Object} costConfig - Cost configuration
 * @param {number|null} fallbackSourceCost - Fallback cost if no Chinese platforms have data
 * @returns {number|null} Lowest source cost in USD, or null if not available
 */
export const getLowestSourceCost = (
  allPlatformResults,
  costConfig = DEFAULT_COST_CONFIG,
  fallbackSourceCost = null
) => {
  const sourcingPlatforms = getPlatformsByCategory('sourcing')
    .concat(getPlatformsByCategory('wholesale'))
    .map(p => p.id);
  let lowestCost = Infinity;

  for (const platformId of sourcingPlatforms) {
    const results = allPlatformResults[platformId];
    if (!results || results.length === 0) continue;

    for (const product of results) {
      let costInUsd;
      if (product.currency === 'CNY') {
        costInUsd = product.price / costConfig.exchange.cnyToUsd;
      } else {
        costInUsd = product.price;
      }

      if (costInUsd < lowestCost) {
        lowestCost = costInUsd;
      }
    }
  }

  if (lowestCost === Infinity) {
    // No Chinese platform data found, use fallback cost if available
    if (fallbackSourceCost !== null && fallbackSourceCost > 0) {
      return fallbackSourceCost;
    }
    return null; // Return null instead of throwing error
  }
  return lowestCost;
};

/**
 * Calculate profit metrics for all platforms
 * @param {Object} allPlatformResults - Results from all platforms
 * @param {number} weight - Product weight in lbs
 * @param {Object} costConfig - Cost configuration
 * @param {number|null} fallbackSourceCost - Fallback source cost if Chinese platforms return no results
 * @returns {Array} Array of platform profit analyses
 */
export const calculateAllPlatformProfits = (
  allPlatformResults,
  weight,
  costConfig = DEFAULT_COST_CONFIG,
  fallbackSourceCost = null
) => {
  const lowestSourceCost = getLowestSourceCost(allPlatformResults, costConfig, fallbackSourceCost);

  // If still no source cost available, log warning and return empty results
  if (lowestSourceCost === null) {
    console.warn('No source cost available from Chinese platforms and no fallback provided');
    return [];
  }

  const analyses = [];
  const sellingPlatforms = getPlatformsByCategory('international')
    .concat(getPlatformsByCategory('vertical'))
    .map(p => p.id);

  for (const platformId of sellingPlatforms) {
    const results = allPlatformResults[platformId];
    if (!results || results.length === 0) continue;

    // Use the best (lowest price) product from this platform
    const bestProduct = results.reduce((best, current) =>
      current.price < best.price ? current : best
    );

    try {
      const metrics = calculateProfitMetrics({
        sellingPrice: bestProduct.price,
        sourceCost: lowestSourceCost,
        weight,
        platformId
      }, costConfig);

      analyses.push({
        platformId,
        platformName: PLATFORMS.find(p => p.id === platformId)?.name || platformId,
        product: bestProduct,
        metrics
      });
    } catch (error) {
      console.error(`Profit calculation failed for ${platformId}:`, error);
    }
  }

  // Sort by ROI descending
  analyses.sort((a, b) => {
    const aRoi = parseFloat(a.metrics.roi);
    const bRoi = parseFloat(b.metrics.roi);
    return bRoi - aRoi;
  });

  return analyses;
};
