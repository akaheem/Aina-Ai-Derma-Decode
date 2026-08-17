import React, { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

/**
 * Content Hub Page
 * Blog articles, video links, ingredient guides
 * Educational content stored in Firestore
 * Deep dives on popular ingredients
 * Dermatologist interviews (future)
 */
export function ContentHub() {
  const [content, setContent] = useState([]);
  const [filteredContent, setFilteredContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all"); // all, articles, guides, videos
  const { user } = useAuth();

  const categories = [
    { id: "all", label: "All Content" },
    { id: "articles", label: "Blog Articles" },
    { id: "guides", label: "Ingredient Guides" },
    { id: "videos", label: "Videos" },
  ];

  // Fetch content from Firestore
  const fetchContent = useCallback(async () => {
    setLoading(true);

    try {
      const q = query(
        collection(db, "content"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const snapshot = await getDocs(q);

      const contentData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));

      setContent(contentData);
      setFilteredContent(contentData);
    } catch (err) {
      console.error("Error fetching content:", err);
      // If collection doesn't exist, load default content
      loadDefaultContent();
    } finally {
      setLoading(false);
    }
  }, []);

  // Load default content if not in Firestore
  const loadDefaultContent = () => {
    const defaultContent = [
      {
        id: "retinol-guide",
        title: "Retinol: Everything You Need to Know",
        category: "guides",
        type: "article",
        author: "Dermatologist Dr. Sarah Chen",
        excerpt: "A complete guide to using retinol safely and effectively for anti-aging.",
        content: `Retinol is one of the most studied and effective anti-aging ingredients. Learn how to use it, what to expect, and how to avoid common mistakes.

## What is Retinol?
Retinol is a form of vitamin A that helps boost cell turnover and collagen production. It's been clinically proven to reduce wrinkles, improve skin texture, and even treat acne.

## How Long Does It Take to Work?
Patience is key with retinol. Most people see noticeable results after 8-12 weeks of consistent use. Some may experience improvements in 4-6 weeks.

## Getting Started
Start with a low concentration (0.25-0.3%) and use it 2-3 times per week. Gradually increase frequency as your skin adapts.

## Common Mistakes to Avoid
- Using too high a concentration too soon
- Not using SPF during the day
- Mixing with vitamin C or AHA/BHA
- Expecting results in 2-3 weeks`,
        readTime: "8 min",
        tags: ["retinol", "anti-aging", "beginner-friendly"],
        helpful: 487,
        createdAt: new Date("2026-07-15"),
      },
      {
        id: "niacinamide-benefits",
        title: "Niacinamide: The Universal Ingredient",
        category: "guides",
        type: "article",
        author: "Dr. James Liu",
        excerpt: "Why niacinamide works for every skin type and how to use it effectively.",
        content: `Niacinamide (vitamin B3) is one of the few ingredients that works well for all skin types. Here's what you need to know.

## Benefits for Different Skin Types
- Oily skin: Regulates sebum production
- Dry skin: Strengthens skin barrier
- Sensitive skin: Reduces irritation
- Combination: Balances all zones

## Recommended Concentration
Most effective at 4-5% concentration. Even at this level, it's gentle enough for daily use.

## Best Practices
Use in the morning and evening after cleansing. Can be combined with most other ingredients safely.`,
        readTime: "5 min",
        tags: ["niacinamide", "beginner-friendly", "all-skin-types"],
        helpful: 623,
        createdAt: new Date("2026-07-10"),
      },
      {
        id: "skincare-routine-build",
        title: "How to Build a Skincare Routine",
        category: "articles",
        type: "video",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        author: "Skincare Educator Lisa Wong",
        excerpt: "Step-by-step guide to creating an effective morning and evening skincare routine.",
        duration: "12 min",
        views: 45200,
        tags: ["routine", "basics", "tutorial"],
        createdAt: new Date("2026-07-05"),
      },
      {
        id: "retinol-mistakes",
        title: "5 Retinol Mistakes You're Probably Making",
        category: "articles",
        type: "article",
        author: "Dr. Sarah Chen",
        excerpt: "Common retinol application mistakes and how to fix them.",
        content: `Even experienced users make mistakes with retinol. Here are the top 5 to avoid.

## 1. Applying to Wet Skin
Retinol penetrates better on slightly damp skin, but overly wet skin can cause irritation and reduced effectiveness. Pat skin until just slightly damp.

## 2. Using Too Much
A pea-sized amount is enough for your entire face. More doesn't mean faster results.

## 3. Not Using Enough Moisture
Retinol can be drying. Use a good moisturizer afterward to prevent irritation.

## 4. Forgetting SPF
Retinol makes skin more sun-sensitive. Daily SPF 30+ is non-negotiable.

## 5. Expecting Results Too Soon
Give retinol 8-12 weeks before judging its effectiveness.`,
        readTime: "6 min",
        tags: ["retinol", "mistakes", "application"],
        helpful: 512,
        createdAt: new Date("2026-06-28"),
      },
      {
        id: "peptides-101",
        title: "Peptides 101: Firming Your Skin",
        category: "guides",
        type: "article",
        author: "Dr. Robert Kim",
        excerpt: "Understanding peptides and how they support collagen production.",
        content: `Peptides are short chains of amino acids that signal your skin to produce more collagen. Here's everything you need to know.

## How Peptides Work
Peptides act as messengers, telling your skin cells to increase collagen synthesis. This leads to firmer, more youthful-looking skin.

## Popular Peptide Types
- Matrixyl: Stimulates collagen
- Argireline: Relaxes expression lines
- Copper peptides: Enhance skin repair

## How to Use
Peptides work best in serums or moisturizers. Apply after cleansing, before oils.`,
        readTime: "7 min",
        tags: ["peptides", "firming", "collagen"],
        helpful: 389,
        createdAt: new Date("2026-06-20"),
      },
      {
        id: "aha-bha-guide",
        title: "AHA vs BHA: Which Exfoliant is Right for You?",
        category: "guides",
        type: "article",
        author: "Dr. Sarah Chen",
        excerpt: "Complete comparison of chemical exfoliants and how to choose the right one.",
        content: `Chemical exfoliants remove dead skin cells more gently than physical scrubs. But which one should you use?

## AHA (Alpha Hydroxy Acid)
- Works on surface
- Best for dry, mature skin
- Improves texture and brightness
- Examples: Glycolic acid, Lactic acid

## BHA (Beta Hydroxy Acid)
- Oil-soluble, penetrates pores
- Best for oily, acne-prone skin
- Prevents breakouts
- Example: Salicylic acid

## Usage Frequency
Start with 1-2x per week for either. Gradually increase if well-tolerated.`,
        readTime: "7 min",
        tags: ["exfoliation", "ahas", "bhas"],
        helpful: 445,
        createdAt: new Date("2026-06-15"),
      },
      {
        id: "dermatologist-interview",
        title: "Interview: Dr. Sarah Chen on Personalized Skincare",
        category: "articles",
        type: "video",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        author: "AinaAi Team",
        excerpt: "Renowned dermatologist shares her insights on personalized skincare approaches.",
        duration: "18 min",
        views: 28500,
        tags: ["dermatologist", "interview", "personalization"],
        createdAt: new Date("2026-06-10"),
      },
      {
        id: "hyaluronic-acid",
        title: "Hyaluronic Acid: The Hydration Hero",
        category: "guides",
        type: "article",
        author: "Dr. Lisa Park",
        excerpt: "How hyaluronic acid works and why it's essential for all skin types.",
        content: `Hyaluronic acid is a humectant that can hold up to 1000x its weight in water. Here's how to use it effectively.

## Molecular Weight Matters
- High MW: Stays on surface, plumps temporarily
- Low MW: Penetrates deeper for lasting hydration

## Best Practices
Apply to damp skin for maximum absorption. Layer with occlusives to lock in moisture.`,
        readTime: "5 min",
        tags: ["hyaluronic-acid", "hydration", "basics"],
        helpful: 678,
        createdAt: new Date("2026-06-05"),
      },
    ];

    setContent(defaultContent);
    setFilteredContent(defaultContent);
  };

  // Filter content by category
  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredContent(content);
    } else {
      setFilteredContent(content.filter((c) => c.category === selectedCategory));
    }
  }, [selectedCategory, content]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Content Hub</h2>
        <p className="text-gray-600">
          Learn from skincare experts, dermatologists, and ingredient deep dives
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition ${
              selectedCategory === cat.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading content...</div>
      ) : filteredContent.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No content in this category yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredContent.map((item) => (
            <ContentCard key={item.id} content={item} />
          ))}
        </div>
      )}

      {/* Coming Soon Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg shadow-md p-8 border border-blue-200">
        <h3 className="text-xl font-semibold mb-4 text-indigo-900">Coming Soon</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🎙️</span>
            <div>
              <h4 className="font-semibold text-indigo-900">Skincare Podcast</h4>
              <p className="text-sm text-indigo-800">
                Weekly episodes with dermatologists, skincare experts, and real user stories.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-3xl">👨‍⚕️</span>
            <div>
              <h4 className="font-semibold text-indigo-900">Live Q&A with Dermatologists</h4>
              <p className="text-sm text-indigo-800">
                Monthly live sessions to ask your burning skincare questions.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-3xl">🧪</span>
            <div>
              <h4 className="font-semibold text-indigo-900">Ingredient Combinations</h4>
              <p className="text-sm text-indigo-800">
                Detailed guides on which ingredients work together and which to avoid.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-3xl">📱</span>
            <div>
              <h4 className="font-semibold text-indigo-900">Community Stories</h4>
              <p className="text-sm text-indigo-800">
                Real transformations and routines from AinaAi users.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual Content Card Component
 */
function ContentCard({ content }) {
  const [isOpen, setIsOpen] = useState(false);

  const openContent = () => {
    if (content.type === "video") {
      setIsOpen(true);
    } else {
      // Could open a modal or navigate to detailed page
      setIsOpen(true);
    }
  };

  return (
    <>
      <div
        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
        onClick={openContent}
      >
        {/* Thumbnail/Header */}
        <div className="bg-gradient-to-r from-blue-400 to-indigo-500 h-32 flex items-center justify-center">
          <span className="text-4xl">
            {content.type === "video" ? "🎥" : "📖"}
          </span>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-gray-800 line-clamp-2">
              {content.title}
            </h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium whitespace-nowrap flex-shrink-0">
              {content.category === "articles"
                ? "Article"
                : content.category === "guides"
                  ? "Guide"
                  : "Video"}
            </span>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {content.excerpt}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{content.author}</span>
            <span>
              {content.type === "video"
                ? `${content.duration} • ${content.views.toLocaleString()} views`
                : `${content.readTime} read`}
            </span>
          </div>

          {/* Tags */}
          <div className="flex gap-1 flex-wrap mt-3">
            {content.tags?.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
            {content.helpful !== undefined && (
              <span>{content.helpful} found this helpful</span>
            )}
          </div>
        </div>
      </div>

      {/* Content Modal */}
      {isOpen && (
        <ContentModal content={content} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}

/**
 * Content Modal for viewing full content
 */
function ContentModal({ content, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {content.title}
            </h2>
            <p className="text-sm text-gray-600">
              By {content.author}{" "}
              {content.createdAt &&
                `• ${new Date(content.createdAt).toLocaleDateString()}`}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {content.type === "video" ? (
            <div className="mb-6 rounded-lg overflow-hidden">
              <iframe
                width="100%"
                height="400"
                src={content.videoUrl}
                title={content.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              {content.content?.split("\n\n").map((paragraph, idx) => {
                if (paragraph.startsWith("##")) {
                  return (
                    <h3
                      key={idx}
                      className="text-lg font-semibold text-gray-800 mt-4 mb-2"
                    >
                      {paragraph.replace("##", "").trim()}
                    </h3>
                  );
                } else if (paragraph.startsWith("-")) {
                  return (
                    <ul key={idx} className="list-disc list-inside text-gray-700 mb-2">
                      {paragraph
                        .split("\n")
                        .filter((line) => line.startsWith("-"))
                        .map((line, i) => (
                          <li key={i} className="ml-4">
                            {line.replace("-", "").trim()}
                          </li>
                        ))}
                    </ul>
                  );
                }
                return (
                  <p key={idx} className="text-gray-700 mb-4">
                    {paragraph}
                  </p>
                );
              })}
            </div>
          )}

          {/* Engagement */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex gap-4">
            <button className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition">
              👍 Helpful
            </button>
            <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition">
              📤 Share
            </button>
            <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition">
              💾 Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
