import { Link } from "react-router-dom";

/**
 * Shared top chrome used across the authenticated app (Dashboard, Privacy) and
 * the auth screens (Login/Sign-up), so every page reads as the same product.
 *
 * The frosted, sticky wordmark bar matches the Rose Derma system. Pass `right`
 * to render page-specific actions (log out, "back to dashboard", etc.); when
 * omitted the bar shows just the wordmark — right for the login screen.
 */
export function AppHeader({ right = null, tagline = false }) {
  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: "rgba(255,250,251,0.72)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--border-soft)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-baseline gap-1">
          <span className="lk-logo-text">AinaAi</span>
          {tagline && (
            <span className="text-xs sm:text-sm hidden sm:block" style={{ color: "var(--muted)" }}>
              · Your SmartMirror
            </span>
          )}
        </Link>
        {right}
      </div>
    </header>
  );
}
