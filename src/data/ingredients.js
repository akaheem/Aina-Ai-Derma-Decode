// Ingredient guidance database
// Maps skin concerns to recommended ingredients with explanations

export const ingredientMap = {
  wrinkles: {
    high: [
      {
        name: "Retinol",
        benefit: "Stimulates collagen production and cell turnover",
        how: "Apply at night 2-3x/week to start, gradually increase frequency",
        avoid: "Don't mix with vitamin C or acids; use sunscreen daily",
      },
      {
        name: "Peptides",
        benefit: "Strengthens skin structure and supports elasticity",
        how: "Usually in serums; use morning and night",
        avoid: "Generally safe; no major conflicts",
      },
      {
        name: "Vitamin C",
        benefit: "Brightens skin and builds collagen",
        how: "Use in AM routine for antioxidant protection",
        avoid: "Can be unstable; store in cool, dark place",
      },
    ],
  },
  redness: {
    high: [
      {
        name: "Centella Asiatica",
        benefit: "Soothes inflammation and strengthens skin barrier",
        how: "Gentle and effective; safe for daily use",
        avoid: "Rare allergies; patch test if sensitive",
      },
      {
        name: "Azelaic Acid",
        benefit: "Reduces redness and kills bacteria",
        how: "Start at 2-3x/week to avoid irritation",
        avoid: "Can be irritating; avoid if skin is very reactive",
      },
      {
        name: "Allantoin",
        benefit: "Calms irritated skin and promotes healing",
        how: "Often in moisturizers; gentle daily use",
        avoid: "Generally safe; supports sensitive skin",
      },
    ],
  },
  oiliness: {
    high: [
      {
        name: "Niacinamide",
        benefit: "Regulates sebum production and minimizes pores",
        how: "Use morning and night; very effective for oily skin",
        avoid: "Can be irritating at high concentrations; start low",
      },
      {
        name: "Salicylic Acid",
        benefit: "Exfoliates pores and reduces oil buildup",
        how: "Start 2-3x/week; builds tolerance for daily use",
        avoid: "Over-exfoliating can strip skin; use with moisturizer",
      },
      {
        name: "Clay (Kaolin/Bentonite)",
        benefit: "Absorbs excess oil and detoxifies",
        how: "Use as weekly mask; 10-15 minutes",
        avoid: "Can be drying; always follow with moisturizer",
      },
    ],
  },
  dark_circles: {
    high: [
      {
        name: "Caffeine",
        benefit: "Constricts blood vessels and reduces puffiness",
        how: "Use in eye creams; apply gently with ring finger",
        avoid: "Can be irritating to sensitive under-eye area",
      },
      {
        name: "Vitamin K",
        benefit: "Strengthens capillaries and reduces discoloration",
        how: "Often paired with caffeine in eye products",
        avoid: "Rare reactions; good for all skin types",
      },
      {
        name: "Peptides",
        benefit: "Strengthens delicate under-eye skin",
        how: "Use in serums and eye creams",
        avoid: "Generally safe and gentle",
      },
    ],
  },
  dryness: {
    high: [
      {
        name: "Hyaluronic Acid",
        benefit: "Holds 1000x its weight in water; deeply hydrates",
        how: "Apply to damp skin; layer with moisturizer",
        avoid: "Use in humid climates; can draw moisture if air is dry",
      },
      {
        name: "Ceramides",
        benefit: "Repairs skin barrier and locks in moisture",
        how: "Use in moisturizers and serums daily",
        avoid: "Safe for all skin types including sensitive",
      },
      {
        name: "Glycerin",
        benefit: "Humectant that draws moisture into skin",
        how: "Works best when followed by an occlusive layer",
        avoid: "Can feel sticky; balance with other ingredients",
      },
    ],
  },
  acne: {
    high: [
      {
        name: "Salicylic Acid",
        benefit: "Exfoliates clogged pores and reduces bacteria",
        how: "Start 2-3x/week; use gentle cleanser",
        avoid: "Over-use causes dryness; use with hydrating moisturizer",
      },
      {
        name: "Niacinamide",
        benefit: "Reduces sebum and has anti-inflammatory properties",
        how: "Use morning and night; very safe long-term",
        avoid: "Rare sensitivity; generally well-tolerated",
      },
      {
        name: "Benzoyl Peroxide",
        benefit: "Kills acne-causing bacteria effectively",
        how: "Start low (2.5%); can bleach fabrics",
        avoid: "Can be irritating and drying; use with care",
      },
    ],
  },
  sensitivity: {
    high: [
      {
        name: "Centella Asiatica",
        benefit: "Calms irritation and strengthens barrier",
        how: "Ideal for sensitive skin; use daily",
        avoid: "Very gentle; few contraindications",
      },
      {
        name: "Allantoin",
        benefit: "Soothes and promotes skin healing",
        how: "Often in gentle moisturizers",
        avoid: "Safe for all skin types",
      },
      {
        name: "Azelaic Acid",
        benefit: "Reduces redness and calms reactive skin",
        how: "Start slowly; can be drying",
        avoid: "May irritate very sensitive skin initially",
      },
    ],
  },
  pores: {
    high: [
      {
        name: "Niacinamide",
        benefit: "Regulates oil and visibly minimizes enlarged pores",
        how: "Use morning and night; pairs well with most routines",
        avoid: "Start at ~5%; very high concentrations can irritate",
      },
      {
        name: "Salicylic Acid (BHA)",
        benefit: "Clears out pore-clogging oil and debris",
        how: "Start 2-3x/week, building up as tolerated",
        avoid: "Can dry the skin; always follow with moisturizer",
      },
      {
        name: "Retinol",
        benefit: "Boosts cell turnover so pores look refined over time",
        how: "Apply at night, easing in 2-3x/week to start",
        avoid: "Don't layer with acids the same night; wear SPF daily",
      },
    ],
  },
  texture: {
    high: [
      {
        name: "Glycolic Acid (AHA)",
        benefit: "Exfoliates the surface to smooth rough, uneven texture",
        how: "Use as a leave-on or weekly treatment at night",
        avoid: "Increases sun sensitivity; daily SPF is essential",
      },
      {
        name: "Lactic Acid",
        benefit: "Gentler AHA that smooths while adding hydration",
        how: "Good starter exfoliant; 2-3x/week at night",
        avoid: "Still exfoliating — don't stack with other strong acids",
      },
      {
        name: "Retinol",
        benefit: "Refines texture by accelerating skin renewal",
        how: "Introduce slowly at night; pea-sized amount",
        avoid: "Expect an adjustment period; buffer with moisturizer",
      },
    ],
  },
  age_spots: {
    high: [
      {
        name: "Vitamin C",
        benefit: "Brightens and fades sun-related dark spots over time",
        how: "Use in the AM under sunscreen for antioxidant support",
        avoid: "Can oxidize; store cool and dark, replace if it darkens",
      },
      {
        name: "Alpha Arbutin",
        benefit: "Targets excess pigment to even out discoloration",
        how: "Layer under moisturizer morning and/or night",
        avoid: "Results are gradual; consistency matters more than strength",
      },
      {
        name: "Niacinamide",
        benefit: "Limits pigment transfer to the surface for a more even tone",
        how: "Well tolerated twice daily alongside other actives",
        avoid: "Generally safe; introduce one new active at a time",
      },
    ],
  },
  radiance: {
    high: [
      {
        name: "Vitamin C",
        benefit: "Antioxidant that revives dull skin and adds glow",
        how: "Apply in the morning before sunscreen",
        avoid: "Keep away from heat and light to preserve potency",
      },
      {
        name: "Glycolic Acid (AHA)",
        benefit: "Sweeps away dull surface cells for fresher-looking skin",
        how: "Use at night 1-3x/week depending on tolerance",
        avoid: "Raises sun sensitivity; daily SPF required",
      },
      {
        name: "Hyaluronic Acid",
        benefit: "Plumps and hydrates so skin looks luminous",
        how: "Apply to damp skin, then seal with moisturizer",
        avoid: "In very dry air, always lock in with an occlusive",
      },
    ],
  },
  firmness: {
    high: [
      {
        name: "Retinol",
        benefit: "Stimulates collagen to support firmer-looking skin",
        how: "Night use, starting 2-3x/week and increasing slowly",
        avoid: "Pair with daily SPF; avoid mixing with strong acids",
      },
      {
        name: "Peptides",
        benefit: "Support skin's structure and elasticity",
        how: "Use in serums morning and night; gentle and layerable",
        avoid: "Generally conflict-free; give it consistent weeks to show",
      },
      {
        name: "Vitamin C",
        benefit: "Cofactor for collagen synthesis; adds antioxidant defense",
        how: "Morning application under sunscreen",
        avoid: "Can be unstable; store in a cool, dark place",
      },
    ],
  },
};

/**
 * Lifestyle & professional guidance for concerns without a genuine topical fix
 * (eye bags and upper/lower eyelid heaviness are largely structural). These
 * render as an honest note + practical tips instead of pretend "serum cures,"
 * and point persistent cases to a professional.
 *
 * Keyed by API concern key. Shape: { note: string, tips: string[] }.
 */
export const lifestyleGuidance = {
  eye_bags: {
    note: "Under-eye puffiness is usually about fluid, sleep, and genetics more than skincare. A few habits help temporarily; lasting bags are best discussed with a professional.",
    tips: [
      "Aim for 7-9 hours of sleep and keep a consistent schedule",
      "Sleep with your head slightly elevated to reduce overnight fluid pooling",
      "Try a cold compress or chilled eye mask for a few minutes in the morning",
      "Go easy on salty food and alcohol late in the day",
      "A caffeine-based eye cream can briefly tighten the area",
      "If puffiness is persistent, a dermatologist can discuss options",
    ],
  },
  droopy_upper_eyelid: {
    note: "Upper-eyelid heaviness is mostly structural and tied to natural aging, so topicals can't lift it. The focus is protecting the skin you have and knowing when to ask a professional.",
    tips: [
      "Protect the eye area from sun with SPF and sunglasses to slow skin aging",
      "Handle the delicate lid gently — pat, never tug or rub",
      "Keep the skin hydrated with a fragrance-free eye moisturizer",
      "Prioritize sleep and overall skin health",
      "If drooping affects your vision or bothers you, see an eye or skin specialist",
    ],
  },
  droopy_lower_eyelid: {
    note: "Lower-lid laxity is also largely structural. Good habits keep the skin healthy, but a professional is the right call for meaningful change.",
    tips: [
      "Use daily SPF around the eyes to limit further collagen loss",
      "Apply a gentle hydrating eye cream; avoid dragging the skin",
      "A cool compress can calm temporary puffiness",
      "Stay hydrated and limit late-night salt",
      "For persistent sagging, consult a dermatologist or oculoplastic specialist",
    ],
  },
};

// Get ingredient guidance for a specific concern
export function getIngredientGuidance(concern, severity) {
  const concernData = ingredientMap[concern];
  if (!concernData) return null;

  const key = severity === "high" ? "high" : "medium";
  return concernData[key] || concernData.high;
}
