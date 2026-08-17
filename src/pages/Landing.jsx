import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "motion/react";
import { Sparkles, ScanFace, FlaskConical, Shirt, LineChart, ShieldCheck } from "lucide-react";
import { LandingNav } from "../components/LandingNav";
import { LandingFooter } from "../components/LandingFooter";
import { ScrollScaleReveal } from "../components/ui/ScrollScaleReveal";
import { AnimatedNumber } from "../components/ui/AnimatedNumber";

const TICKER_ITEMS = [
  "Wrinkles",
  "Redness",
  "Oiliness",
  "Dark circles",
  "Dryness",
  "Acne",
  "Sensitivity",
  "Texture",
];

const CURVED_LINES = Array.from({ length: 20 }, (_, i) => ({
  width: 60 + i * 10,
  delay: i * 0.25,
}));

const STEPS = [
  {
    icon: <ScanFace size={22} />,
    title: "Snap or upload",
    body: "Take a selfie or upload a photo. We compress it on-device and keep it private to your account.",
  },
  {
    icon: <Sparkles size={22} />,
    title: "AI reads your skin",
    body: "YouCam Skin AI scores wrinkles, redness, oiliness and more — in seconds.",
  },
  {
    icon: <FlaskConical size={22} />,
    title: "Know your ingredients",
    body: "We translate scores into the exact ingredients to look for — and what to avoid.",
  },
];

const FEATURES = [
  {
    icon: <ScanFace size={20} />,
    tag: "Skin AI",
    title: "Real-time skin analysis",
    body: "Wrinkles, redness, oiliness and more, measured from a single photo and tracked over time.",
  },
  {
    icon: <FlaskConical size={20} />,
    tag: "Guidance",
    title: "Ingredient-level advice",
    body: "No jargon. See which actives target your concerns, how to use them, and what to skip.",
  },
  {
    icon: <Shirt size={20} />,
    tag: "Try-On",
    title: "Virtual apparel try-on",
    body: "See how clothing looks with your complexion before you buy — powered by the same engine.",
  },
  {
    icon: <LineChart size={20} />,
    tag: "Progress",
    title: "Track improvements",
    body: "Your history, trends and skin-health score sync across every device you sign in on.",
  },
  {
    icon: <ShieldCheck size={20} />,
    tag: "Privacy",
    title: "Your data, your control",
    body: "Export or delete everything in one click. GDPR / CCPA-ready, with a full audit trail.",
  },
  {
    icon: <Sparkles size={20} />,
    tag: "Always on",
    title: "Instant, on any device",
    body: "A calm, fast experience on mobile and desktop — no app store, no waiting.",
  },
];

const STATS = [
  { value: 7, suffix: "", label: "Skin concerns measured" },
  { value: 2, suffix: "s", label: "Typical analysis time" },
  { value: 100, suffix: "%", label: "Private to your account" },
];

function StatsRow() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {STATS.map((s) => (
        <div key={s.label} className="lk-panel text-center">
          <div className="text-5xl font-semibold tracking-tight" style={{ color: "var(--accent)" }}>
            {inView ? <AnimatedNumber value={s.value} /> : 0}
            {s.suffix}
          </div>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}

export function Landing() {
  const navigate = useNavigate();

  // Landing is a public, scrollable page; make sure we always start at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <LandingNav />

      {/* ---------- Hero ---------- */}
      <section className="lk-hero">
        <div className="lk-curved-lines" aria-hidden="true">
          {CURVED_LINES.map((line, i) => (
            <div
              key={`l-${i}`}
              className="lk-curved-line left"
              style={{ width: line.width, animationDelay: `${line.delay}s` }}
            />
          ))}
          {CURVED_LINES.map((line, i) => (
            <div
              key={`r-${i}`}
              className="lk-curved-line right"
              style={{ width: line.width, animationDelay: `${line.delay}s` }}
            />
          ))}
        </div>
        <div className="lk-curved-lines-top" aria-hidden="true">
          {CURVED_LINES.map((line, i) => (
            <div
              key={`t-${i}`}
              className="lk-curved-line-top"
              style={{ height: line.width, animationDelay: `${line.delay}s` }}
            />
          ))}
        </div>

        <div className="lk-ticker">
          <div className="lk-ticker-track">
            {Array.from({ length: 4 }, (_, row) => (
              <div className="lk-ticker-row" key={row}>
                {TICKER_ITEMS.map((item) => (
                  <span className="lk-ticker-item" key={`${row}-${item}`}>
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <motion.h1
          className="lk-hero-title"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          Understand what your skin <span className="serif-italic">actually needs</span>
          <sup>&reg;</sup>
        </motion.h1>

        <motion.p
          className="lk-hero-subtitle"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: "easeOut" }}
        >
          AinaAi is your SmartMirror: it reads your skin, explains the ingredients it needs,
          and shows what suits you — powered by YouCam Skin AI.
        </motion.p>

        <motion.div
          className="lk-cta-row"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24, ease: "easeOut" }}
        >
          <button type="button" className="lk-btn-primary" onClick={() => navigate("/login")}>
            Analyze my skin
          </button>

          <button type="button" className="lk-btn-book" onClick={() => navigate("/login")}>
            <span className="lk-btn-book-icon">
              <Sparkles size={18} />
            </span>
            <span className="lk-btn-book-text">
              <span className="lk-btn-book-primary">See it in action</span>
              <span className="lk-btn-book-secondary">
                <span className="lk-green-dot" />
                Free to try · no credit card
              </span>
            </span>
          </button>
        </motion.div>
      </section>

      {/* ---------- Trust marquee ---------- */}
      <div className="lk-trust">
        <div className="lk-trust-label">Built on best-in-class beauty AI</div>
        <div className="lk-trust-marquee">
          <div className="lk-trust-track">
            {Array.from({ length: 2 }, (_, row) => (
              <div className="lk-trust-row" key={row}>
                {["YouCam Skin AI", "PerfectCorp", "Firebase", "Ingredient science", "Virtual Try-On"].map(
                  (item) => (
                    <span className="lk-trust-item" key={`${row}-${item}`}>
                      {item}
                    </span>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- How it works ---------- */}
      <section id="how" className="max-w-[1200px] mx-auto px-9 py-20">
        <div className="mb-12 text-center">
          <p className="lk-share-eyebrow">How it works</p>
          <h2 className="lk-share-title">
            From a photo to a <span className="serif-italic">real routine</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <ScrollScaleReveal key={step.title}>
              <div className="lk-panel h-full">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full text-white"
                    style={{ background: "var(--accent)" }}
                  >
                    {step.icon}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-semibold" style={{ color: "var(--text)" }}>
                  {step.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "var(--muted)" }}>
                  {step.body}
                </p>
              </div>
            </ScrollScaleReveal>
          ))}
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section id="features" className="max-w-[1200px] mx-auto px-9 py-20">
        <div className="mb-12 text-center">
          <p className="lk-share-eyebrow">Everything in one mirror</p>
          <h2 className="lk-share-title">
            Skincare <span className="serif-italic">and</span> style, together
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <ScrollScaleReveal key={f.title}>
              <div className="lk-note-card h-full">
                <div className="lk-note-topics">
                  <span className="lk-note-topic">{f.tag}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                  >
                    {f.icon}
                  </span>
                  <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
                    {f.title}
                  </h3>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--muted)" }}>
                  {f.body}
                </p>
              </div>
            </ScrollScaleReveal>
          ))}
        </div>
      </section>

      {/* ---------- Impact / stats ---------- */}
      <section id="impact" className="max-w-[1200px] mx-auto px-9 py-20">
        <div className="mb-12 text-center">
          <p className="lk-share-eyebrow">Why it matters</p>
          <h2 className="lk-share-title">
            Clarity you can <span className="serif-italic">act on</span>
          </h2>
        </div>
        <StatsRow />

        <div className="mt-16 text-center">
          <button type="button" className="lk-btn-primary" onClick={() => navigate("/login")}>
            Start your first analysis
          </button>
        </div>
      </section>

      <LandingFooter />
    </>
  );
}
