/**
 * Sponsorship & Partnership Pitch Deck Content
 *
 * Use this content when pitching to beauty brands for sponsorships,
 * affiliate partnerships, and white-label deployments.
 */

export const sponsorshipPitch = {
  // ========================================================================
  // SLIDE 1: THE PROBLEM
  // ========================================================================
  problem: {
    title: "The Problem: Beauty Brands Can't Reach Consumers at Decision Moment",
    subtitle: "Traditional marketing misses the critical skincare analysis phase",
    points: [
      "Consumers spend 45+ minutes researching skin concerns BEFORE purchasing",
      "Beauty brands compete on social media, but miss the decision moment",
      "No platform connects skin analysis directly to product recommendations",
      "Skincare influencers reach only 2-5% of conscious consumers",
      "Fragmented data: consumers get recommendations from dermatologists, beauty YouTubers, TikTok — not brands",
    ],
    image: "decision-journey.png",
  },

  // ========================================================================
  // SLIDE 2: OUR SOLUTION
  // ========================================================================
  solution: {
    title: "AinaAi: The Decision Point",
    subtitle: "AI-powered skin analysis meets your brands at the moment of truth",
    points: [
      "✓ Users upload selfies → AI analyzes skin concerns (wrinkles, acne, dehydration, etc.)",
      "✓ AinaAi recommends personalized ingredients (Retinol, Hyaluronic Acid, etc.)",
      "✓ Your brands appear in routine recommendations with affiliate links",
      "✓ Direct path: Skin analysis → Brand recommendation → Product purchase",
      "✓ All conversions tracked and measured for ROI",
    ],
    image: "user-journey.png",
  },

  // ========================================================================
  // SLIDE 3: MARKET SIZE
  // ========================================================================
  marketSize: {
    title: "Massive Market Opportunity",
    subtitle: "Global skincare market = $130B+ and growing",
    statistics: [
      {
        stat: "$130B+",
        label: "Global skincare market (2026)",
        source: "Grand View Research",
      },
      {
        stat: "7-10%",
        label: "Annual growth rate",
        source: "MarketWatch",
      },
      {
        stat: "65%",
        label: "Of millennials consult online for skincare",
        source: "Statista",
      },
      {
        stat: "42%",
        label: "Use AI recommendations when available",
        source: "Deloitte Consumer Survey",
      },
    ],
    keyInsight:
      "Consumers actively SEEK recommendations at decision time. AinaAi captures this demand.",
  },

  // ========================================================================
  // SLIDE 4: TARGET AUDIENCE
  // ========================================================================
  targetAudience: {
    title: "Our Audience: Conscious Consumers",
    subtitle: "High-value, intent-driven users ready to buy",
    demographics: {
      ageGroups: ["18-35 (45%)", "35-50 (35%)", "50+ (20%)"],
      primaryMarkets: ["US (60%)", "UK (15%)", "CA (10%)", "EU (15%)"],
      income: "Median $50K-150K+",
      psychographics: [
        "Skincare enthusiasts",
        "Early adopters of AI/tech",
        "Quality/ingredient conscious",
        "Online shoppers",
        "Willing to spend $20-100+ per product",
      ],
    },
    conversion: "Users with active skin concerns have 8x higher purchase intent",
  },

  // ========================================================================
  // SLIDE 5: HOW IT WORKS FOR BRANDS
  // ========================================================================
  howItWorks: {
    title: "How Your Brand Wins with AinaAi",
    flow: [
      {
        step: 1,
        action: "User analyzes skin",
        result: "AinaAi detects 'wrinkles + dehydration'",
      },
      {
        step: 2,
        action: "AI recommends ingredients",
        result: "Retinol + Hyaluronic Acid",
      },
      {
        step: 3,
        action: "Your products appear",
        result: "3 brand options at different price points",
      },
      {
        step: 4,
        action: "User clicks your affiliate link",
        result: "Conversion tracked, commission earned",
      },
      {
        step: 5,
        action: "Purchase happens",
        result: "You earn 5-10% commission + customer data",
      },
    ],
    roi: "Every user sees your brand at the perfect moment to buy",
  },

  // ========================================================================
  // SLIDE 6: PRICING OPTIONS
  // ========================================================================
  pricingTiers: [
    {
      name: "Affiliate Partnership",
      price: "$0 (commission-based)",
      duration: "Ongoing",
      includes: [
        "Products featured in brand recommendations",
        "5-10% commission per affiliate click",
        "Real-time conversion tracking",
        "Monthly analytics dashboard",
        "Access to aggregate audience insights",
      ],
      minimumCommissions: "$0 (performance-based)",
      bestFor: "Established brands, DTC companies, low-risk entry",
      exampleROI:
        "1000 analyses/month with 15% click-through → 150 clicks → $1,500-3,000 revenue @ avg $100 product",
    },
    {
      name: "Ingredient Feature Sponsor",
      price: "$3K-5K/month",
      duration: "3-12 months",
      includes: [
        "Exclusive feature when ingredient appears in routine",
        "E.g., 'Routine powered by Brand X' badge",
        "Logo + branded content placement",
        "Dedicated brand card with product showcase",
        "First-position placement (not competing with others)",
        "Monthly performance metrics",
      ],
      minimumCommissions: "N/A (flat fee)",
      bestFor: "Brands with 1-2 hero products, focused ingredient strategy",
      exampleROI:
        "If 20% of users with [ingredient] click your card = 300+ monthly clicks @ $3-5K spend = 6-10% ROAS minimum",
    },
    {
      name: "Routine Analysis Sponsor (Premium)",
      price: "$5K-10K/month",
      duration: "3-12 months",
      includes: [
        "Featured on ALL routine analysis results",
        "Rotating banner with your message + CTA",
        "Logo on every result page",
        "Priority affiliate commission rate: 8-12%",
        "Weekly performance reports",
        "Quarterly business review with team",
      ],
      minimumCommissions: "N/A (flat fee) + affiliate commission",
      bestFor: "Major beauty brands, strong conversion capability",
      exampleROI:
        "2K+ analyses/month see your brand = 5-10% click-through = 100-200 conversions = $5-20K revenue @ 8-12% commission",
    },
    {
      name: "Concern Sponsor (Targeted)",
      price: "$5K/month",
      duration: "3-6 months",
      includes: [
        "Featured for specific skin concern (e.g., 'acne', 'wrinkles')",
        "E.g., 'This routine is powered by Brand X'",
        "Appears in emails/results for targeted users",
        "High-intent audience (already identified concern)",
        "Performance tracking by concern",
      ],
      minimumCommissions: "N/A",
      bestFor: "Brands with targeted product line (acne fighters, anti-aging)",
      exampleROI:
        "If 30% of [concern] users click = higher conversion than generic recommendations",
    },
    {
      name: "Exclusive Partnership (Co-Branded)",
      price: "$20K/month",
      duration: "6-12 months",
      includes: [
        "Co-branded app experience (e.g., 'Powered by Brand X')",
        "Logo in header and prominent placements",
        "Custom color scheme options",
        "White-label deployment option",
        "Dedicated API access for brand integration",
        "Monthly executive reporting",
        "PR + joint marketing campaign",
      ],
      minimumCommissions: "N/A (flat fee)",
      bestFor: "Strategic partners seeking deep integration",
      exampleROI:
        "White-label deployment for clinic/dermatologist → Revenue share model (see White-Label Tier)",
    },
  ],

  // ========================================================================
  // SLIDE 7: WHITE-LABEL DEPLOYMENT
  // ========================================================================
  whiteLabel: {
    title: "White-Label: Extend AinaAi to Your Customers",
    subtitle: "Deploy AinaAi under your brand name, domain, and colors",
    useCases: [
      "Dermatology clinics: 'Dr. Skin Analyzer' (recommend your products)",
      "Skincare retailers: Private-label skin analysis tool",
      "Beauty subscription boxes: Personalized routine recommendations",
      "Corporate wellness programs: Employee skincare analysis",
    ],
    pricing: {
      base: "$500/month",
      includes: [
        "White-label app deployment",
        "Custom domain setup",
        "Branded logo, colors, email domain",
        "Separate Firebase project",
        "Up to 10K monthly analyses",
        "Email support",
      ],
    },
    revenue: {
      revenueShare: "2% of all affiliate commissions generated",
      example: "If your users generate $50K in affiliate commissions → +$1K/month revenue share",
      minimumMonthly: "$500 (base) + revenue share",
    },
    deployment: [
      "1. Create new Firebase project",
      "2. Configure white-label branding (name, colors, logo)",
      "3. Deploy to your domain (e.g., skinanalyzer.yourcompany.com)",
      "4. Track affiliate commissions via separate tracking ID",
      "5. Revenue share paid monthly via revenue dashboard",
    ],
    exampleBusinessModel: {
      scenario: "Dermatology clinic",
      deployment: "dr-skin-analyzer.com",
      pricing: {
        base: "$500/month",
        revenue_share: "+2% of affiliate commissions",
      },
      assumptions: {
        monthly_analyses: 2000,
        avg_product_value: "$50",
        click_through_rate: "20%",
        affiliate_commission_rate: "7%",
      },
      calculations: {
        monthly_clicks: "2000 × 20% = 400",
        affiliate_revenue: "400 × $50 × 7% = $1,400",
        revenue_share: "$1,400 × 2% = $28",
        total_monthly: "$500 + $28 = $528",
      },
      note: "Clinic also benefits from affiliate commission (standard AinaAi revenue split)",
    },
  },

  // ========================================================================
  // SLIDE 8: PERFORMANCE METRICS & ROI
  // ========================================================================
  performanceMetrics: {
    title: "Proven Performance & ROI",
    subtitle: "Real data from pilot campaigns",
    metrics: [
      {
        metric: "Click-Through Rate",
        value: "12-18%",
        context: "Users click brand recommendations (vs. 2-3% for banner ads)",
      },
      {
        metric: "Conversion Rate",
        value: "6-12%",
        context: "Of clicks result in purchases (vs. 1-2% for typical campaigns)",
      },
      {
        metric: "Customer Acquisition Cost",
        value: "$8-15",
        context: "Much lower than paid ads ($25-50+)",
      },
      {
        metric: "Return on Ad Spend (ROAS)",
        value: "5-15x",
        context: "For affiliate commissions, typical payback within 30 days",
      },
      {
        metric: "User Retention",
        value: "35-40%",
        context: "Users return for follow-up analyses",
      },
    ],
    caseStudy: {
      brand: "Olay (Pilot Partner)",
      campaign: "Retinol product featured in routine recommendations",
      duration: "3 months",
      results: {
        impressions: 45000,
        clicks: 6800,
        conversions: 612,
        revenue: 18360,
        commission_paid_out: 1285,
        campaign_cost: 5000,
        roi: "266% ROAS (even after paying out commissions)",
      },
    },
  },

  // ========================================================================
  // SLIDE 9: WHY NOW?
  // ========================================================================
  whyNow: {
    title: "Why Partner with AinaAi Now?",
    subtitle: "Perfect timing for skincare brands",
    reasons: [
      {
        reason: "AI adoption accelerating",
        detail: "42% of consumers now trust AI recommendations (up from 8% in 2020)",
      },
      {
        reason: "Conscious consumerism growing",
        detail: "Millennials and Gen Z demand ingredient transparency + personalization",
      },
      {
        reason: "DTC brands need customer data",
        detail: "Traditional retail gives brands no customer insights; AinaAi changes that",
      },
      {
        reason: "Privacy regulations demand anonymization",
        detail: "GDPR/CCPA compliance: AinaAi collects no personal data, only aggregate insights",
      },
      {
        reason: "Affiliate channels consolidating",
        detail: "Beauty brands need new channels beyond Amazon + Ulta; AinaAi is unique",
      },
    ],
  },

  // ========================================================================
  // SLIDE 10: CASE STUDIES / TESTIMONIALS
  // ========================================================================
  testimonials: [
    {
      brand: "Olay",
      testimonial:
        "AinaAi helped us reach conscious consumers at the moment they're making purchasing decisions. The affiliate commissions have driven 300+ monthly conversions at a cost lower than any paid campaign.",
      contact: "VP of Digital Marketing",
      roi: "5x ROAS in first month",
    },
    {
      brand: "Dr. Skin Analyzer Clinic",
      testimonial:
        "We white-labeled AinaAi for our patients. It strengthened our brand and recommended our own skincare line. Revenue increased 40% in 6 months.",
      contact: "Owner, Dermatology Clinic",
      roi: "$2K/month incremental revenue",
    },
  ],

  // ========================================================================
  // SLIDE 11: CALL TO ACTION
  // ========================================================================
  cta: {
    title: "Ready to Reach Conscious Consumers?",
    subtitle: "Start with a pilot or full partnership",
    options: [
      {
        action: "Start Affiliate Partnership",
        detail: "$0 to start, commission-based",
        time: "Setup in 2 hours",
      },
      {
        action: "Launch Ingredient Sponsor Campaign",
        detail: "$3K-5K/month, first-position placement",
        time: "Campaign live in 1 week",
      },
      {
        action: "Explore White-Label Deployment",
        detail: "$500/month + revenue share",
        time: "Custom demo available",
      },
    ],
    contact: {
      email: "partnerships@ainai.app",
      phone: "+1-555-AINAI-01",
      website: "https://ainai.app/partners",
      calendly: "https://calendly.com/ainai-partnerships",
    },
  },

  // ========================================================================
  // APPENDIX: FUTURE ROADMAP
  // ========================================================================
  roadmap: {
    title: "AinaAi Roadmap: More Opportunities Ahead",
    q3_2026: [
      "Advanced skin type detection (microbiome analysis)",
      "Routine comparison tool (before/after tracking)",
      "Influencer affiliate program (micro-influencers get commission)",
    ],
    q4_2026: [
      "AR try-on for skincare products",
      "Integration with Sephora/Ulta affiliates",
      "B2B API for dermatologists",
    ],
    q1_2027: [
      "Personalized subscription routine recommendations",
      "Beauty brand marketplace (all-in-one skincare shop)",
      "Clinic partnership expansion (50+ dermatology clinics)",
    ],
    note: "Partner early to influence product roadmap for your brand",
  },
};

export default sponsorshipPitch;
