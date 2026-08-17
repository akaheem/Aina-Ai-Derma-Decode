import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer className="lk-footer">
      <div className="lk-footer-inner">
        <div>
          <span className="lk-logo-text">AinaAi</span>
          <p className="lk-footer-tagline">
            Your SmartMirror to understand and know what your skin needs — powered by
            YouCam Skin AI.
          </p>
        </div>

        <div className="lk-footer-col">
          <h4 className="lk-footer-heading">Product</h4>
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#impact">Impact</a>
          <Link to="/login">Open the app</Link>
        </div>

        <div className="lk-footer-col">
          <h4 className="lk-footer-heading">Trust</h4>
          <Link to="/privacy">Privacy &amp; data</Link>
          <a href="#features">Your data, your control</a>
          <a href="#how">GDPR / CCPA ready</a>
        </div>
      </div>

      <div className="lk-footer-bottom">
        <span>© 2026 AinaAi. All rights reserved.</span>
        <span>Built for the YouCam (PerfectCorp) API Hackathon.</span>
      </div>
    </footer>
  );
}
