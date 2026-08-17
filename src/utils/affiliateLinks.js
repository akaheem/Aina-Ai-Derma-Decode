/**
 * Affiliate Link System
 *
 * Maps ingredients to brand affiliate links with commission tracking.
 * Revenue model: 5-10% commission per affiliate link click/conversion
 *
 * Affiliate Data Structure:
 * {
 *   ingredient: string,
 *   brand: string,
 *   affiliate_link: string,
 *   commission_rate: number (5-10),
 *   tracking_id: string,
 *   active: boolean,
 *   dateAdded: timestamp
 * }
 */

import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

// Default affiliate mappings (ingredient → brands)
const DEFAULT_AFFILIATES = {
  "Hyaluronic Acid": [
    {
      brand: "Olay",
      product: "Regenerist Hyaluronic Hydrating Serum",
      link: "https://affiliate.olay.com/hydrating-serum?ref=ainai",
      commission_rate: 7,
    },
    {
      brand: "Neutrogena",
      product: "Hydro Boost Hydrating Serum",
      link: "https://affiliate.neutrogena.com/hydro-boost?ref=ainai",
      commission_rate: 6,
    },
    {
      brand: "The Ordinary",
      product: "Hyaluronic Acid 2% + B5",
      link: "https://affiliate.theordinary.com/hyaluronic?ref=ainai",
      commission_rate: 10,
    },
  ],
  Retinol: [
    {
      brand: "Olay",
      product: "Regenerist Retinol24 Night Moisturizer",
      link: "https://affiliate.olay.com/retinol24?ref=ainai",
      commission_rate: 7,
    },
    {
      brand: "The Ordinary",
      product: "Retinol 0.2% in Squalane",
      link: "https://affiliate.theordinary.com/retinol-0.2?ref=ainai",
      commission_rate: 10,
    },
    {
      brand: "Drunk Elephant",
      product: "A-Passioni Retinol Cream",
      link: "https://affiliate.drunkelephant.com/a-passioni?ref=ainai",
      commission_rate: 8,
    },
  ],
  Niacinamide: [
    {
      brand: "The Ordinary",
      product: "Niacinamide 10% + Zinc 1%",
      link: "https://affiliate.theordinary.com/niacinamide?ref=ainai",
      commission_rate: 10,
    },
    {
      brand: "CeraVe",
      product: "PM Facial Moisturizing Lotion",
      link: "https://affiliate.cerave.com/pm-moisturizer?ref=ainai",
      commission_rate: 6,
    },
    {
      brand: "La Roche-Posay",
      product: "Effaclar Mat Moisturizer",
      link: "https://affiliate.laroche-posay.com/effaclar-mat?ref=ainai",
      commission_rate: 7,
    },
  ],
  "Salicylic Acid": [
    {
      brand: "CeraVe",
      product: "SA Cleanser",
      link: "https://affiliate.cerave.com/sa-cleanser?ref=ainai",
      commission_rate: 6,
    },
    {
      brand: "Paula's Choice",
      product: "2% BHA Liquid Exfoliant",
      link: "https://affiliate.paulaschoice.com/bha-2?ref=ainai",
      commission_rate: 8,
    },
    {
      brand: "Neutrogena",
      product: "Oil-Free Acne Wash",
      link: "https://affiliate.neutrogena.com/acne-wash?ref=ainai",
      commission_rate: 5,
    },
  ],
  "Vitamin C": [
    {
      brand: "The Ordinary",
      product: "Vitamin C Suspension 23% + HA Spheres 2%",
      link: "https://affiliate.theordinary.com/vitamin-c-23?ref=ainai",
      commission_rate: 10,
    },
    {
      brand: "Drunk Elephant",
      product: "C-Firma Fresh Serum",
      link: "https://affiliate.drunkelephant.com/c-firma?ref=ainai",
      commission_rate: 8,
    },
    {
      brand: "Skinceuticals",
      product: "H.A. Intensifier",
      link: "https://affiliate.skinceuticals.com/ha-intensifier?ref=ainai",
      commission_rate: 9,
    },
  ],
  Ceramides: [
    {
      brand: "CeraVe",
      product: "Moisturizing Cream",
      link: "https://affiliate.cerave.com/moisturizing-cream?ref=ainai",
      commission_rate: 6,
    },
    {
      brand: "Cetaphil",
      product: "Rich Hydrating Night Cream",
      link: "https://affiliate.cetaphil.com/night-cream?ref=ainai",
      commission_rate: 5,
    },
  ],
  "Centella Asiatica": [
    {
      brand: "COSRX",
      product: "Advanced Snail 96 Mucin Power Essence",
      link: "https://affiliate.cosrx.com/snail-essence?ref=ainai",
      commission_rate: 9,
    },
    {
      brand: "Purito",
      product: "Deep Sea Pure Water Cream",
      link: "https://affiliate.purito.com/water-cream?ref=ainai",
      commission_rate: 8,
    },
  ],
  Peptides: [
    {
      brand: "The Ordinary",
      product: "Matrixyl 10% + HA",
      link: "https://affiliate.theordinary.com/matrixyl?ref=ainai",
      commission_rate: 10,
    },
    {
      brand: "Olay",
      product: "Regenerist Micro-Sculpting Cream",
      link: "https://affiliate.olay.com/micro-sculpting?ref=ainai",
      commission_rate: 7,
    },
  ],
};

/**
 * Get affiliate recommendations for an ingredient
 * @param {string} ingredient - Ingredient name
 * @returns {Promise<Array>} Array of affiliate products
 */
export async function getAffiliateLinks(ingredient) {
  try {
    // Query Firestore for active affiliate links
    const affiliatesRef = collection(db, "affiliates");
    const q = query(
      affiliatesRef,
      where("ingredient", "==", ingredient),
      where("active", "==", true)
    );

    const snapshot = await getDocs(q);
    const affiliates = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // If no Firestore records, return defaults
    if (affiliates.length === 0) {
      return DEFAULT_AFFILIATES[ingredient] || [];
    }

    return affiliates;
  } catch (error) {
    console.error("Error fetching affiliate links:", error);
    // Fallback to defaults
    return DEFAULT_AFFILIATES[ingredient] || [];
  }
}

/**
 * Track an affiliate link click (anonymized)
 * Stores click data without personal information
 * @param {string} ingredientName - Ingredient clicked
 * @param {string} brand - Brand clicked
 * @param {string} affiliateLink - Affiliate URL
 * @returns {Promise<void>}
 */
export async function trackAffiliateClick(
  ingredientName,
  brand,
  affiliateLink
) {
  try {
    const clicksRef = collection(db, "affiliate_clicks");
    await addDoc(clicksRef, {
      ingredient: ingredientName,
      brand: brand,
      link: affiliateLink,
      timestamp: serverTimestamp(),
      // No user ID or personal data stored
    });
  } catch (error) {
    console.error("Error tracking affiliate click:", error);
  }
}

/**
 * Add or update affiliate link (Admin only)
 * @param {Object} affiliateData - Affiliate link data
 * @returns {Promise<string>} Document ID
 */
export async function addAffiliateLink(affiliateData) {
  try {
    const affiliatesRef = collection(db, "affiliates");
    const docRef = await addDoc(affiliatesRef, {
      ...affiliateData,
      active: true,
      dateAdded: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding affiliate link:", error);
    throw error;
  }
}

/**
 * Deactivate an affiliate link
 * @param {string} affiliateId - Document ID
 * @returns {Promise<void>}
 */
export async function deactivateAffiliateLink(affiliateId) {
  try {
    const affiliateRef = doc(db, "affiliates", affiliateId);
    await updateDoc(affiliateRef, { active: false });
  } catch (error) {
    console.error("Error deactivating affiliate link:", error);
    throw error;
  }
}

/**
 * Get all active affiliate links (for admin dashboard)
 * @returns {Promise<Array>} All affiliate links
 */
export async function getAllAffiliateLinks() {
  try {
    const affiliatesRef = collection(db, "affiliates");
    const q = query(affiliatesRef, where("active", "==", true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching all affiliate links:", error);
    return [];
  }
}

/**
 * Get click statistics for affiliate links (anonymized aggregates)
 * @param {string} ingredient - Filter by ingredient (optional)
 * @returns {Promise<Object>} Click statistics
 */
export async function getAffiliateClickStats(ingredient = null) {
  try {
    const clicksRef = collection(db, "affiliate_clicks");
    let q;

    if (ingredient) {
      q = query(clicksRef, where("ingredient", "==", ingredient));
    } else {
      q = query(clicksRef);
    }

    const snapshot = await getDocs(q);
    const stats = {
      totalClicks: snapshot.size,
      byBrand: {},
      byIngredient: {},
    };

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      stats.byBrand[data.brand] = (stats.byBrand[data.brand] || 0) + 1;
      stats.byIngredient[data.ingredient] =
        (stats.byIngredient[data.ingredient] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error("Error fetching affiliate click stats:", error);
    return { totalClicks: 0, byBrand: {}, byIngredient: {} };
  }
}

/**
 * Firestore Collection Schema
 *
 * Collection: affiliates
 * - ingredient (string): e.g., "Hyaluronic Acid"
 * - brand (string): e.g., "Olay"
 * - product (string): Product name
 * - affiliate_link (string): Full affiliate URL
 * - commission_rate (number): 5-10%
 * - active (boolean): Whether link is active
 * - dateAdded (timestamp): When added
 *
 * Collection: affiliate_clicks
 * - ingredient (string): e.g., "Hyaluronic Acid"
 * - brand (string): e.g., "Olay"
 * - link (string): Affiliate URL clicked
 * - timestamp (timestamp): When clicked
 * (No personal data stored)
 */
