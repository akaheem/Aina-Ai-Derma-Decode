/**
 * Shared UI primitives for the Rose Derma design system.
 * Pill buttons + editorial "note" cards, ported from the Soforotto design
 * language and re-themed. Presentational only — no app logic here.
 */

/** Primary pill button (dark plum fill, lifts on hover). */
export function PillButton({ children, className = "", as: As = "button", ...props }) {
  return (
    <As className={`lk-btn-primary ${className}`} {...props}>
      {children}
    </As>
  );
}

/** Secondary "book"-style pill button with an icon chip + two-line label. */
export function BookButton({ icon, primary, secondary, className = "", ...props }) {
  return (
    <button type="button" className={`lk-btn-book ${className}`} {...props}>
      {icon && <span className="lk-btn-book-icon">{icon}</span>}
      <span className="lk-btn-book-text">
        <span className="lk-btn-book-primary">{primary}</span>
        {secondary && <span className="lk-btn-book-secondary">{secondary}</span>}
      </span>
    </button>
  );
}

/** Editorial note card: off-white, soft shadow, subtle rotation that
 *  straightens on hover. Great for testimonials, tips, and results. */
export function NoteCard({ children, className = "", ...props }) {
  return (
    <div className={`lk-note-card ${className}`} {...props}>
      {children}
    </div>
  );
}
