/**
 * B2B Integration API Documentation
 *
 * AinaAi offers a REST API for enterprise partners to integrate
 * skin analysis capabilities, brand recommendations, and affiliate tracking
 * into their own applications.
 *
 * Base URL: https://api.ainai.app/v1
 * Authentication: API Key (Bearer token)
 * Rate Limits: 1000 requests/hour for basic tier
 */

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * All API requests require an API key in the Authorization header:
 *
 * curl -H "Authorization: Bearer YOUR_API_KEY" https://api.ainai.app/v1/analyze
 *
 * API Keys are issued per customer and can be managed in the dashboard.
 * Enterprise keys support up to 1M requests/month.
 */

// ============================================================================
// ENDPOINT 1: Analyze Skin
// ============================================================================

/**
 * POST /api/v1/analyze
 *
 * Analyze a skin image and return detected concerns with recommendations.
 *
 * Request:
 * {
 *   "image_url": "https://example.com/image.jpg",  // or base64 encoded
 *   "analyze_type": "full|concerns_only|recommendations_only",
 *   "include_brands": true,  // Include brand recommendations
 *   "price_preference": "budget|mid|premium"
 * }
 *
 * Response (200 OK):
 * {
 *   "analysis_id": "unique-id-123",
 *   "timestamp": "2026-08-14T21:21:03Z",
 *   "concerns": [
 *     {
 *       "name": "wrinkles",
 *       "severity": "high",
 *       "confidence": 0.92,
 *       "area": "forehead"
 *     },
 *     {
 *       "name": "dehydration",
 *       "severity": "medium",
 *       "confidence": 0.78
 *     }
 *   ],
 *   "skin_type": "combination",
 *   "health_score": 72,
 *   "recommendations": [
 *     {
 *       "ingredient": "Retinol",
 *       "reason": "Stimulates collagen, reduces fine lines",
 *       "priority": 1
 *     }
 *   ],
 *   "brand_recommendations": [
 *     {
 *       "ingredient": "Retinol",
 *       "recommendations": [
 *         {
 *           "brand": "Olay",
 *           "product": "Regenerist Retinol24",
 *           "price": 27,
 *           "price_range": "mid",
 *           "rating": 4.4,
 *           "affiliate_link": "https://affiliate.olay.com/..."
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * Error Responses:
 * 400: Invalid image or parameters
 * 401: Unauthorized (invalid API key)
 * 429: Rate limit exceeded
 * 500: Server error
 */

// ============================================================================
// ENDPOINT 2: Get Recommended Brands
// ============================================================================

/**
 * GET /api/v1/brands?ingredient=Retinol&price_preference=mid
 *
 * Get brand recommendations for a specific ingredient.
 *
 * Query Parameters:
 * - ingredient (required): e.g., "Hyaluronic Acid", "Retinol"
 * - price_preference (optional): "budget", "mid", or "premium"
 *
 * Response (200 OK):
 * {
 *   "ingredient": "Retinol",
 *   "recommendations": [
 *     {
 *       "brand": "Olay",
 *       "product": "Regenerist Retinol24 Night Moisturizer",
 *       "price": 27,
 *       "price_range": "mid",
 *       "rating": 4.4,
 *       "affiliate_link": "https://affiliate.olay.com/retinol24?ref=partner123",
 *       "commission_rate": 7
 *     },
 *     {
 *       "brand": "The Ordinary",
 *       "product": "Retinol 0.2% in Squalane",
 *       "price": 5.9,
 *       "price_range": "budget",
 *       "rating": 4.5,
 *       "affiliate_link": "https://affiliate.theordinary.com/retinol?ref=partner123",
 *       "commission_rate": 10
 *     }
 *   ]
 * }
 *
 * Errors: 400, 401, 404, 429, 500
 */

// ============================================================================
// ENDPOINT 3: Analytics & Metrics
// ============================================================================

/**
 * GET /api/v1/analytics?start_date=2026-08-01&end_date=2026-08-31&metric=all
 *
 * Get aggregate analytics for your analyses (helps track ROI).
 *
 * Query Parameters:
 * - start_date (required): YYYY-MM-DD
 * - end_date (required): YYYY-MM-DD
 * - metric (optional): "all", "analyses", "concerns", "brands", "affiliate_clicks"
 *
 * Response (200 OK):
 * {
 *   "period": "2026-08-01 to 2026-08-31",
 *   "total_analyses": 5423,
 *   "unique_users": 2847,
 *   "top_concerns": [
 *     { "concern": "wrinkles", "count": 1850, "percentage": 34.1 },
 *     { "concern": "dehydration", "count": 1432, "percentage": 26.4 }
 *   ],
 *   "popular_ingredients": [
 *     { "ingredient": "Hyaluronic Acid", "count": 3200, "percentage": 59 },
 *     { "ingredient": "Retinol", "count": 2100, "percentage": 38.7 }
 *   ],
 *   "affiliate_stats": {
 *     "total_clicks": 8342,
 *     "estimated_revenue": 5847,  // 7% avg commission on $83.5K product sales
 *     "top_brands": [
 *       { "brand": "Olay", "clicks": 2100, "revenue": 1470 },
 *       { "brand": "The Ordinary", "clicks": 1950, "revenue": 1950 }
 *     ]
 *   }
 * }
 *
 * Errors: 400, 401, 429, 500
 */

// ============================================================================
// ENDPOINT 4: Track Affiliate Conversions
// ============================================================================

/**
 * POST /api/v1/track-conversion
 *
 * Report a conversion from affiliate link (optional for revenue tracking).
 * This helps both parties understand ROI.
 *
 * Request:
 * {
 *   "affiliate_link": "https://affiliate.olay.com/...",
 *   "ingredient": "Retinol",
 *   "brand": "Olay",
 *   "conversion_value": 27.99,  // Product price in USD
 *   "session_id": "abc123"  // Your unique session ID
 * }
 *
 * Response (200 OK):
 * {
 *   "tracking_id": "conv-123456",
 *   "status": "recorded",
 *   "timestamp": "2026-08-14T21:21:03Z"
 * }
 */

// ============================================================================
// ENDPOINT 5: White-Label Customization
// ============================================================================

/**
 * GET /api/v1/config
 *
 * Get customizable configuration for white-label deployments.
 *
 * Response (200 OK):
 * {
 *   "app_name": "AinaAi",
 *   "app_tagline": "Your SmartMirror",
 *   "colors": {
 *     "primary": "#2563eb",
 *     "secondary": "#64748b"
 *   },
 *   "logo_urls": {
 *     "light": "https://cdn.ainai.app/logo-light.svg",
 *     "dark": "https://cdn.ainai.app/logo-dark.svg"
 *   },
 *   "support_email": "support@ainai.app"
 * }
 */

// ============================================================================
// RATE LIMITS & QUOTAS
// ============================================================================

/**
 * Rate Limits (per API key):
 *
 * TIER 1 (Startup): $1K/month
 * - 1,000 requests/hour
 * - Up to 10K analyses/month
 * - Email support
 *
 * TIER 2 (Growth): $5K/month
 * - 10,000 requests/hour
 * - Up to 100K analyses/month
 * - Priority email + chat support
 * - Custom brand recommendations
 *
 * TIER 3 (Enterprise): Custom pricing
 * - Unlimited requests
 * - Dedicated account manager
 * - Custom API endpoints
 * - White-label deployment support
 *
 * Rate Limit Headers:
 * X-RateLimit-Limit: 1000
 * X-RateLimit-Remaining: 987
 * X-RateLimit-Reset: 1692055263
 */

// ============================================================================
// EXAMPLE INTEGRATION: JAVASCRIPT/FETCH
// ============================================================================

const AINAI_API_KEY = "your-api-key-here";
const API_BASE = "https://api.ainai.app/v1";

async function analyzeSkin(imageUrl) {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${AINAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_url: imageUrl,
      analyze_type: "full",
      include_brands: true,
      price_preference: "mid",
    }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

async function getBrandRecommendations(ingredient, pricePreference) {
  const response = await fetch(
    `${API_BASE}/brands?ingredient=${ingredient}&price_preference=${pricePreference}`,
    {
      headers: {
        "Authorization": `Bearer ${AINAI_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

async function getAnalytics(startDate, endDate) {
  const response = await fetch(
    `${API_BASE}/analytics?start_date=${startDate}&end_date=${endDate}`,
    {
      headers: {
        "Authorization": `Bearer ${AINAI_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

// Usage:
// const analysis = await analyzeSkin("https://example.com/skin.jpg");
// const brands = await getBrandRecommendations("Retinol", "mid");
// const analytics = await getAnalytics("2026-08-01", "2026-08-31");

// ============================================================================
// EXAMPLE INTEGRATION: PYTHON
// ============================================================================

/*
import requests
import json
from datetime import datetime

class AinaAiClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.ainai.app/v1"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def analyze_skin(self, image_url, price_preference="mid"):
        response = requests.post(
            f"{self.base_url}/analyze",
            headers=self.headers,
            json={
                "image_url": image_url,
                "analyze_type": "full",
                "include_brands": True,
                "price_preference": price_preference
            }
        )
        return response.json()

    def get_brands(self, ingredient, price_preference="mid"):
        response = requests.get(
            f"{self.base_url}/brands",
            headers=self.headers,
            params={
                "ingredient": ingredient,
                "price_preference": price_preference
            }
        )
        return response.json()

    def get_analytics(self, start_date, end_date):
        response = requests.get(
            f"{self.base_url}/analytics",
            headers=self.headers,
            params={
                "start_date": start_date,
                "end_date": end_date
            }
        )
        return response.json()

# Usage:
# client = AinaAiClient("your-api-key")
# analysis = client.analyze_skin("https://example.com/image.jpg")
# brands = client.get_brands("Retinol")
# analytics = client.get_analytics("2026-08-01", "2026-08-31")
*/

// ============================================================================
// SUPPORT & DOCUMENTATION
// ============================================================================

/**
 * Documentation: https://docs.ainai.app
 * Support: support@ainai.app
 * Status Page: https://status.ainai.app
 * Github: https://github.com/ainai/api-client-js
 *
 * Support Hours: Mon-Fri 9am-6pm EST
 * Response Time:
 * - Tier 1: 24-48 hours
 * - Tier 2: 4-8 hours
 * - Tier 3: 1 hour
 */
