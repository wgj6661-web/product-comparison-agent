export const amazonScraper = () => {
  const getCleanText = (selectors) => {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.innerText.trim()) return el.innerText.trim();
    }
    return null;
  };

  const getPrice = () => {
    const priceWhole = getCleanText(['.a-price-whole', '.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen']);
    const priceFraction = getCleanText(['.a-price-fraction']);
    
    if (priceWhole && priceFraction && !isNaN(parseFloat(priceWhole))) {
      return parseFloat(`${priceWhole}.${priceFraction}`.replace(/[^0-9.]/g, ''));
    }

    const priceText = getCleanText([
      '#priceblock_ourprice', 
      '#priceblock_dealprice', 
      '#price_inside_buybox',
      '.a-price .a-offscreen',
      '#corePrice_feature_div .a-offscreen',
      '.a-color-price'
    ]);
    return priceText ? parseFloat(priceText.replace(/[^0-9.]/g, '')) : null;
  };

  const getAsin = () => {
    const asinInput = document.querySelector('input[name="asin"]') || 
                      document.querySelector('#ASIN') || 
                      document.querySelector('[data-asin]');
    return asinInput ? (asinInput.value || asinInput.getAttribute('data-asin')) : null;
  };

  return {
    title: document.title,
    price: getPrice(),
    asin: getAsin(),
    weight: parseFloat((getCleanText(['#detailBullets_feature_div', '#productDetails_techSpec_section_1']) || "").match(/[0-9.]+(?=\s*(lb|kg|g|pounds))/i)?.[0] || "0"),
    bsr: parseInt((getCleanText(['#SalesRank', '#detailBulletsWrapper_feature_div']) || "").match(/#([0-9,]+)/)?.[1].replace(/,/g, '') || "0"),
  };
};

export const sourcingScraper = () => {
  const getCleanText = (selectors) => {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.innerText.trim()) return el.innerText.trim();
    }
    return null;
  };

  const get1688Price = () => {
    const priceText = getCleanText([
      '.price-text', 
      '.price-num', 
      '.extra-price',
      '.offer-price',
      '[class*="price-container"]'
    ]);
    return priceText ? parseFloat(priceText.replace(/[^0-9.]/g, '')) : null;
  };

  return {
    cost_cny: get1688Price(),
    moq: parseInt(getCleanText(['.moq-number', '.od-item-limit', '.quantity-text']) || "1"),
    supplier_vetted: !!document.querySelector('.trust-badge') || !!document.querySelector('.company-name .win-icon'),
    factory_location: getCleanText(['.factory-location', '.address', '.company-city']) || "Unknown"
  };
};
export const genericScraper = () => {
  const getPrice = () => {
    // Look for common price patterns
    const bodyText = document.body.innerText;
    const priceRegex = /([$¥€£])\s?([0-9,]+(\.[0-9]{2})?)/g;
    const matches = [...bodyText.matchAll(priceRegex)];
    if (matches.length > 0) {
      // Return the most likely price (first one found usually)
      return parseFloat(matches[0][2].replace(/,/g, ''));
    }
    return null;
  };

  return {
    title: document.title,
    price: getPrice(),
    description: document.querySelector('meta[name="description"]')?.content || "",
    url: window.location.href
  };
};
