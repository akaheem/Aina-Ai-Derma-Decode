/**
 * Brand Recommendation Engine
 *
 * Recommends 3 brands per ingredient based on:
 * - User's price preference (budget, mid-range, premium)
 * - Product availability and ratings
 * - Affiliate partnership status
 *
 * Output: 3 recommended brands with affiliate links and price ranges
 */

import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// Product database mapping ingredients to actual brand products
const BRAND_PRODUCTS = {
  "Hyaluronic Acid": [
    {
      brand: "Olay",
      product: "Regenerist Hyaluronic Hydrating Serum",
      priceRange: "mid",
      price: 28,
      rating: 4.5,
      affiliate_link:
        "https://affiliate.olay.com/hydrating-serum?ref=ainai",
    },
    {
      brand: "Neutrogena",
      product: "Hydro Boost Hydrating Serum",
      priceRange: "budget",
      price: 8.99,
      rating: 4.3,
      affiliate_link: "https://affiliate.neutrogena.com/hydro-boost?ref=ainai",
    },
    {
      brand: "The Ordinary",
      product: "Hyaluronic Acid 2% + B5",
      priceRange: "budget",
      price: 6.9,
      rating: 4.6,
      affiliate_link: "https://affiliate.theordinary.com/hyaluronic?ref=ainai",
    },
    {
      brand: "Drunk Elephant",
      product: "C-Firma Serum with Hyaluronic",
      priceRange: "premium",
      price: 68,
      rating: 4.7,
      affiliate_link: "https://affiliate.drunkelephant.com/c-firma?ref=ainai",
    },
    {
      brand: "Skinceuticals",
      product: "H.A. Intensifier",
      priceRange: "premium",
      price: 95,
      rating: 4.8,
      affiliate_link:
        "https://affiliate.skinceuticals.com/ha-intensifier?ref=ainai",
    },
  ],
  Retinol: [
    {
      brand: "Olay",
      product: "Regenerist Retinol24 Night Moisturizer",
      priceRange: "mid",
      price: 27,
      rating: 4.4,
      affiliate_link: "https://affiliate.olay.com/retinol24?ref=ainai",
    },
    {
      brand: "The Ordinary",
      product: "Retinol 0.2% in Squalane",
      priceRange: "budget",
      price: 5.9,
      rating: 4.5,
      affiliate_link:
        "https://affiliate.theordinary.com/retinol-0.2?ref=ainai",
    },
    {
      brand: "Drunk Elephant",
      product: "A-Passioni Retinol Cream",
      priceRange: "premium",
      price: 72,
      rating: 4.6,
      affiliate_link:
        "https://affiliate.drunkelephant.com/a-passioni?ref=ainai",
    },
    {
      brand: "Estée Lauder",
      product: "Advanced Night Repair Eye",
      priceRange: "premium",
      price: 72,
      rating: 4.7,
      affiliate_link: "https://affiliate.esteelauder.com/eye-repair?ref=ainai",
    },
  ],
  Niacinamide: [
    {
      brand: "The Ordinary",
      product: "Niacinamide 10% + Zinc 1%",
      priceRange: "budget",
      price: 5.9,
      rating: 4.7,
      affiliate_link:
        "https://affiliate.theordinary.com/niacinamide?ref=ainai",
    },
    {
      brand: "CeraVe",
      product: "PM Facial Moisturizing Lotion",
      priceRange: "budget",
      price: 18,
      rating: 4.5,
      affiliate_link: "https://affiliate.cerave.com/pm-moisturizer?ref=ainai",
    },
    {
      brand: "La Roche-Posay",
      product: "Effaclar Mat Moisturizer",
      priceRange: "mid",
      price: 38,
      rating: 4.4,
      affiliate_link:
        "https://affiliate.laroche-posay.com/effaclar-mat?ref=ainai",
    },
    {
      brand: "Clinique",
      product: "Dramatically Different Moisturizing Gel",
      priceRange: "mid",
      price: 35,
      rating: 4.3,
      affiliate_link:
        "https://affiliate.clinique.com/diff-gel?ref=ainai",
    },
  ],
  "Salicylic Acid": [
    {
      brand: "The Ordinary",
      product: "Salicylic Acid 2% Solution",
      priceRange: "budget",
      price: 5.9,
      rating: 4.4,
      affiliate_link:
        "https://affiliate.theordinary.com/salicylic-acid?ref=ainai",
    },
    {
      brand: "CeraVe",
      product: "SA Cleanser",
      priceRange: "budget",
      price: 9,
      rating: 4.5,
      affiliate_link: "https://affiliate.cerave.com/sa-cleanser?ref=ainai",
    },
    {
      brand: "Paula's Choice",
      product: "2% BHA Liquid Exfoliant",
      priceRange: "mid",
      price: 36,
      rating: 4.6,
      affiliate_link:
        "https://affiliate.paulaschoice.com/bha-2?ref=ainai",
    },
    {
      brand: "Neutrogena",
      product: "Oil-Free Acne Wash",
      priceRange: "budget",
      price: 7,
      rating: 4.2,
      affiliate_link:
        "https://affiliate.neutrogena.com/acne-wash?ref=ainai",
    },
  ],
  "Vitamin C": [
    {
      brand: "The Ordinary",
      product: "Vitamin C Suspension 23% + HA Spheres 2%",
      priceRange: "budget",
      price: 5.9,
      rating: 4.3,
      affiliate_link:
        "https://affiliate.theordinary.com/vitamin-c-23?ref=ainai",
    },
    {
      brand: "Drunk Elephant",
      product: "C-Firma Fresh Serum",
      priceRange: "premium",
      price: 80,
      rating: 4.6,
      affiliate_link:
        "https://affiliate.drunkelephant.com/c-firma?ref=ainai",
    },
    {
      brand: "Skinceuticals",
      product: "C E Ferulic",
      priceRange: "premium",
      price: 169,
      rating: 4.8,
      affiliate_link:
        "https://affiliate.skinceuticals.com/ce-ferulic?ref=ainai",
    },
    {
      brand: "Timeless",
      product: "Vitamin C Serum + E Ferulic",
      priceRange: "mid",
      price: 12,
      rating: 4.4,
      affiliate_link: "https://affiliate.timelessha.com/vit-c?ref=ainai",
    },
  ],
  Ceramides: [
    {
      brand: "CeraVe",
      product: "Moisturizing Cream",
      priceRange: "budget",
      price: 18,
      rating: 4.6,
      affiliate_link:
        "https://affiliate.cerave.com/moisturizing-cream?ref=ainai",
    },
    {
      brand: "Cetaphil",
      product: "Rich Hydrating Night Cream",
      priceRange: "budget",
      price: 17,
      rating: 4.4,
      affiliate_link:
        "https://affiliate.cetaphil.com/night-cream?ref=ainai",
    },
    {
      brand: "La Roche-Posay",
      product: "Toleriane Hydrating Gentle Cleanser",
      priceRange: "mid",
      price: 11,
      rating: 4.5,
      affiliate_link:
        "https://affiliate.laroche-posay.com/toleriane?ref=ainai",
    },
  ],
  "Centella Asiatica": [
    {
      brand: "COSRX",
      product: "Advanced Snail 96 Mucin Power Essence",
      priceRange: "mid",
      price: 5.5,
      rating: 4.7,
      affiliate_link:
        "https://affiliate.cosrx.com/snail-essence?ref=ainai",
    },
    {
      brand: "Purito",
      product: "Deep Sea Pure Water Cream",
      priceRange: "mid",
      price: 22,
      rating: 4.6,
      affiliate_link: "https://affiliate.purito.com/water-cream?ref=ainai",
    },
    {
      brand: "Some By Mi",
      product: "Snail Truecica Miracle Repair Serum",
      priceRange: "mid",
      price: 18,
      rating: 4.5,
      affiliate_link:
        "https://affiliate.somebymi.com/snail-serum?ref=ainai",
    },
  ],
  Peptides: [
    {
      brand: "The Ordinary",
      product: "Matrixyl 10% + HA",
      priceRange: "budget",
      price: 5.9,
      rating: 4.5,
      affiliate_link:
        "https://affiliate.theordinary.com/matrixyl?ref=ainai",
    },
    {
      brand: "Olay",
      product: "Regenerist Micro-Sculpting Cream",
      priceRange: "mid",
      price: 28,
      rating: 4.4,
      affiliate_link:
        "https://affiliate.olay.com/micro-sculpting?ref=ainai",
    },
    {
      brand: "Estée Lauder",
      product: "Advanced Night Repair Eye Concentrate",
      priceRange: "premium",
      price: 75,
      rating: 4.7,
      affiliate_link:
        "https://affiliate.esteelauder.com/repair-concentrate?ref=ainai",
    },
  ],
};

/**
 * Get brand recommendations for an ingredient
 * @param {string} ingredient - Ingredient name
 * @param {string} pricePreference - "budget", "mid", or "premium"
 * @returns {Promise<Array>} Top 3 recommended brands
 */
export async function getBrandRecommendations(
  ingredient,
  pricePreference = "mid"
) {
  try {
    // Get products for this ingredient
    const products = BRAND_PRODUCTS[ingredient] || [];

    if (products.length === 0) {
      return [];
    }

    // Try to get Firestore recommendations (for custom/updated data)
    const recommendationsRef = collection(db, "brand_recommendations");
    const q = query(
      recommendationsRef,
      where("ingredient", "==", ingredient)
    );
    const snapshot = await getDocs(q);

    let recommendations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // If no Firestore data, use defaults with price-based filtering
    if (recommendations.length === 0) {
      // Filter by price preference, but always include top-rated
      const ranked = products.sort((a, b) => b.rating - a.rating);

      // Strategy: Return 1 budget, 1 mid, 1 premium (or best available)
      const byPrice = {
        budget: ranked.filter((p) => p.priceRange === "budget"),
        mid: ranked.filter((p) => p.priceRange === "mid"),
        premium: ranked.filter((p) => p.priceRange === "premium"),
      };

      recommendations = [];

      // Always include top-rated from preferred price range
      if (byPrice[pricePreference]?.length > 0) {
        recommendations.push(byPrice[pricePreference][0]);
      }

      // Fill remaining slots with next best options
      for (const range of ["budget", "mid", "premium"]) {
        if (
          recommendations.length >= 3 ||
          byPrice[range].length === 0 ||
          range === pricePreference
        ) {
          continue;
        }

        const available = byPrice[range].filter(
          (p) => !recommendations.some((r) => r.brand === p.brand)
        );

        if (available.length > 0) {
          recommendations.push(available[0]);
        }
      }

      // Ensure we have 3 results
      while (recommendations.length < 3 && ranked.length > 0) {
        const available = ranked.find(
          (p) => !recommendations.some((r) => r.brand === p.brand)
        );
        if (available) {
          recommendations.push(available);
        } else {
          break;
        }
      }
    }

    return recommendations.slice(0, 3);
  } catch (error) {
    console.error("Error getting brand recommendations:", error);
    // Fallback to defaults
    const products = BRAND_PRODUCTS[ingredient] || [];
    return products.slice(0, 3);
  }
}

/**
 * Get all ingredients with available brand recommendations
 * @returns {Array<string>} List of ingredients
 */
export function getAvailableIngredients() {
  return Object.keys(BRAND_PRODUCTS).sort();
}

/**
 * Track a brand recommendation view (anonymized)
 * @param {string} ingredient - Ingredient recommended
 * @param {Array<string>} brandNames - Brands shown
 * @returns {Promise<void>}
 */
export async function trackBrandRecommendationView(ingredient, brandNames) {
  try {
    const viewsRef = collection(db, "brand_recommendation_views");
    await addDoc(viewsRef, {
      ingredient: ingredient,
      brands: brandNames,
      timestamp: serverTimestamp(),
      // No user ID or personal data
    });
  } catch (error) {
    console.error("Error tracking brand recommendation view:", error);
  }
}

/**
 * Firestore Collection Schema
 *
 * Collection: brand_recommendations
 * - ingredient (string): e.g., "Hyaluronic Acid"
 * - brand (string): e.g., "Olay"
 * - product (string): Full product name
 * - priceRange (string): "budget", "mid", or "premium"
 * - price (number): Price in USD
 * - rating (number): 0-5 star rating
 * - affiliate_link (string): Full affiliate URL
 * - dateAdded (timestamp): When added
 *
 * Collection: brand_recommendation_views
 * - ingredient (string): e.g., "Hyaluronic Acid"
 * - brands (array): e.g., ["Olay", "Neutrogena", "The Ordinary"]
 * - timestamp (timestamp): When viewed
 * (No personal data stored)
 */
