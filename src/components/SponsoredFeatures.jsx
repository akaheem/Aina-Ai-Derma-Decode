import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

/**
 * Sponsored Features Component
 *
 * Displays sponsor badges and content on analysis results and routines.
 * Non-intrusive, clearly marked as sponsored content.
 *
 * Sponsorship pricing tiers (shown in brand dashboard):
 * - Routine Analysis Sponsor: $5K-10K/month (featured on all routine results)
 * - Ingredient Feature Sponsor: $3K-5K/month (featured when specific ingredient appears)
 * - Concern Sponsor: $5K/month (featured for specific skin concerns like "dermatitis")
 * - Exclusive Partner: $20K/month (app-wide branding)
 */

export function SponsoredFeatures({ analysisResult = null, ingredientName = null, concernName = null }) {
  const [sponsorContent, setSponsorContent] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!analysisResult && !ingredientName && !concernName) {
      return;
    }

    loadSponsorContent();
  }, [analysisResult, ingredientName, concernName]);

  const loadSponsorContent = async () => {
    setLoading(true);
    try {
      const sponsorsRef = collection(db, "sponsors");
      let q = null;

      // Query by matching context
      if (ingredientName) {
        q = query(
          sponsorsRef,
          where("sponsorshipType", "==", "ingredient"),
          where("targetIngredient", "==", ingredientName),
          where("active", "==", true),
          orderBy("priority", "desc"),
          limit(1)
        );
      } else if (concernName) {
        q = query(
          sponsorsRef,
          where("sponsorshipType", "==", "concern"),
          where("targetConcern", "==", concernName),
          where("active", "==", true),
          orderBy("priority", "desc"),
          limit(1)
        );
      } else {
        q = query(
          sponsorsRef,
          where("sponsorshipType", "==", "routine"),
          where("active", "==", true),
          orderBy("priority", "desc"),
          limit(1)
        );
      }

      const snapshot = await getDocs(q);
      if (snapshot.docs.length > 0) {
        setSponsorContent({
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
        });
      }
    } catch (error) {
      console.error("Error loading sponsor content:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!sponsorContent || loading) {
    return null;
  }

  return (
    <div className="border-2 border-yellow-300 rounded-lg p-4 bg-yellow-50 my-4">
      {/* Sponsor Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block bg-yellow-400 text-gray-900 px-2 py-1 rounded text-xs font-bold">
          SPONSORED
        </span>
        <span className="text-xs text-gray-600">
          Partnership with {sponsorContent.brandName}
        </span>
      </div>

      {/* Sponsor Content */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-2">
          {sponsorContent.headline || `This analysis is powered by ${sponsorContent.brandName}`}
        </h3>
        {sponsorContent.description && (
          <p className="text-sm text-gray-700 mb-3">{sponsorContent.description}</p>
        )}

        {/* CTA Button */}
        {sponsorContent.ctaUrl && sponsorContent.ctaText && (
          <a
            href={sponsorContent.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg text-sm font-medium hover:bg-yellow-600 transition"
            onClick={() => trackSponsorClick(sponsorContent.id)}
          >
            {sponsorContent.ctaText}
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Track sponsor click (anonymized)
 * @param {string} sponsorId - Sponsor document ID
 */
async function trackSponsorClick(sponsorId) {
  try {
    const clicksRef = collection(db, "sponsor_clicks");
    const { addDoc, serverTimestamp } = await import("firebase/firestore");
    await addDoc(clicksRef, {
      sponsorId: sponsorId,
      timestamp: serverTimestamp(),
      // No personal data
    });
  } catch (error) {
    console.error("Error tracking sponsor click:", error);
  }
}

/**
 * Sponsorship Configuration Guide
 *
 * To add a sponsor:
 *
 * 1. Add document to Firestore collection: "sponsors"
 * 2. Schema:
 *    {
 *      brandName: "Brand X",
 *      sponsorshipType: "routine" | "ingredient" | "concern",
 *      targetIngredient: "Hyaluronic Acid" (for ingredient type),
 *      targetConcern: "wrinkles" (for concern type),
 *      headline: "Recommended by dermatologists",
 *      description: "Long-form sponsor message",
 *      ctaUrl: "https://brand.com/affiliate",
 *      ctaText: "Learn More",
 *      priority: 1 (higher = shown first),
 *      active: true,
 *      startDate: timestamp,
 *      endDate: timestamp (for campaign duration)
 *    }
 *
 * Pricing Tiers (what to show brands):
 * - Routine Analysis Sponsor ($5K-10K/month):
 *   "Featured on every routine analysis result for duration of campaign"
 *
 * - Ingredient Feature Sponsor ($3K-5K/month):
 *   "Featured when users receive routine including [ingredient]"
 *
 * - Concern Sponsor ($5K/month):
 *   "Featured for users with [concern]. Example: 'This routine is powered by Brand X'"
 *
 * - Exclusive Partner ($20K/month):
 *   "Co-branded partnership, logo on app, featured across all analysis types"
 *
 * Revenue Example:
 * - 10 brands at $5K/month = $50K/month recurring
 * - 2 brands at $20K/month = $40K/month
 * - Total: $90K/month from sponsorships alone
 */

export default SponsoredFeatures;
