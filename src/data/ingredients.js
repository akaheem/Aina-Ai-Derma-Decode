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
};

// Get ingredient guidance for a specific concern
export function getIngredientGuidance(concern, severity) {
  const concernData = ingredientMap[concern];
  if (!concernData) return null;

  const key = severity === "high" ? "high" : "medium";
  return concernData[key] || concernData.high;
}
