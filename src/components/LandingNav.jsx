import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, FlaskConical, Shirt, LineChart, LogIn } from "lucide-react";
import { LimelightNav } from "./ui/LimelightNav";

// Sections the nav "limelight" follows as you scroll, in document order.
const SPY_SECTIONS = [
  { id: "how", index: 1 },
  { id: "features", index: 2 },
  { id: "impact", index: 3 },
];

/**
 * Landing-page top chrome: an editorial wordmark (top-left) plus a floating
 * frosted "limelight" nav whose accent glow slides to the section in view.
 */
export function LandingNav() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const lockUntil = useRef(0);

  useEffect(() => {
    const compute = () => {
      if (performance.now() < lockUntil.current) return;
      const threshold = 120;
      let current = 0;
      for (const section of SPY_SECTIONS) {
        const el = document.getElementById(section.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= threshold) current = section.index;
        else break;
      }
      setActiveIndex(current);
    };
    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const items = [
    {
      id: "home",
      icon: <Sparkles />,
      label: "Home",
      onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
    },
    { id: "how", icon: <FlaskConical />, label: "How it works", onClick: () => scrollTo("how") },
    { id: "features", icon: <Shirt />, label: "Features", onClick: () => scrollTo("features") },
    { id: "impact", icon: <LineChart />, label: "Impact", onClick: () => scrollTo("impact") },
    { id: "signin", icon: <LogIn />, label: "Sign in", onClick: () => navigate("/login") },
  ];

  return (
    <>
      <div className="lk-navbar-bg" aria-hidden="true" />
      <header className="lk-navbar">
        <div className="lk-logo">
          <span className="lk-logo-text">AinaAi</span>
          <span className="lk-logo-mark">&trade;</span>
        </div>
        <button type="button" className="lk-btn-primary" onClick={() => navigate("/login")}>
          Open the app
        </button>
      </header>

      <div className="fixed z-[110] left-1/2 -translate-x-1/2 bottom-4 sm:bottom-auto sm:top-2.5">
        <LimelightNav
          items={items}
          activeIndex={activeIndex}
          onTabChange={(i) => {
            if (i <= 3) {
              setActiveIndex(i);
              lockUntil.current = performance.now() + 900;
            }
          }}
          iconContainerClassName="px-3.5 sm:px-5"
        />
      </div>
    </>
  );
}
