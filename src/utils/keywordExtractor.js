/**
 * AI-powered keyword extraction for cross-platform product search
 * Uses NVIDIA NIM API to extract core search terms from product titles
 */

/**
 * Extract search keywords from product title using AI
 * @param {string} title - Product title to analyze
 * @param {string} apiKey - NVIDIA API key
 * @param {string} model - Model ID to use
 * @returns {Promise<{keywords: string, category: string, brand: string}>}
 */
export const extractKeywords = async (title, apiKey, model = "meta/llama-3.1-405b-instruct") => {
  const systemPrompt = `You are a product search keyword extractor. Extract core search keywords from product titles.

Rules:
1. Return ONLY a valid JSON object, no markdown, no explanation
2. Remove unnecessary adjectives, promotional words, and brand names
3. Keep model numbers, specifications, and product categories
4. Return English keywords only, even if input is in Chinese
5. Be concise - 3-7 words maximum

Examples:
- "Apple iPhone 15 Pro Max 256GB Blue Titanium" → {"keywords": "iPhone 15 Pro Max 256GB", "category": "smartphone", "brand": "Apple"}
- "Wireless Bluetooth Headphones Noise Cancelling Over-Ear" → {"keywords": "wireless bluetooth headphones noise cancelling", "category": "headphones", "brand": ""}
- "Sony PlayStation 5 Console Digital Edition" → {"keywords": "PlayStation 5 Digital", "category": "gaming console", "brand": "Sony"}`;

  const userQuery = `Extract search keywords from: "${title}"

Return JSON only: {"keywords": "...", "category": "...", "brand": "..."}`;

  try {
    let response;

    // Use chrome.runtime.sendMessage if in extension environment
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: "fetchNvidia",
          url: `https://integrate.api.nvidia.com/v1/chat/completions`,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: {
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userQuery }
            ],
            temperature: 0.1,
            top_p: 0.1,
            max_tokens: 256,
            stream: false
          }
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response && response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response?.error || "Unknown error"));
          }
        });
      });
    } else {
      // Local development environment - use Vite proxy
      const fetchResponse = await fetch(`/nvidia-api/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userQuery }
          ],
          temperature: 0.1,
          top_p: 0.1,
          max_tokens: 256,
          stream: false
        })
      });

      if (!fetchResponse.ok) {
        throw new Error(`API Error: ${fetchResponse.status}`);
      }
      response = await fetchResponse.json();
    }

    // Extract and parse JSON from response
    let rawContent = response.choices[0].message.content.trim();

    // Try to extract JSON if wrapped in markdown or text
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      rawContent = jsonMatch[0];
    }

    const extracted = JSON.parse(rawContent);

    return {
      keywords: extracted.keywords || title.substring(0, 50),
      category: extracted.category || '',
      brand: extracted.brand || ''
    };

  } catch (error) {
    console.error("Keyword extraction failed:", error);

    // Fallback: use first 50 characters of title
    return {
      keywords: title.substring(0, 50).trim(),
      category: '',
      brand: ''
    };
  }
};

/**
 * Build search query for a platform
 * @param {Object} extracted - Extracted keywords object
 * @param {boolean} includeBrand - Whether to include brand in query
 * @returns {string} Search query string
 */
export const buildSearchQuery = (extracted, includeBrand = false) => {
  let query = extracted.keywords;

  if (includeBrand && extracted.brand) {
    query = `${extracted.brand} ${query}`;
  }

  return query.trim();
};
