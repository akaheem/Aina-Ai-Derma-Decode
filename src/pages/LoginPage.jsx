import React, { useState } from "react";
import { logIn, signUp, signInWithGoogle } from "../auth";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { AppHeader } from "../components/AppHeader";

/**
 * Maps raw Firebase auth error codes to friendly, human copy.
 * (Previously the raw `err.message` was shown, e.g. "Firebase: Error
 * (auth/wrong-password).".)
 */
function friendlyAuthError(err) {
  const code = err?.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Email or password is incorrect. Please try again.";
    case "auth/email-already-in-use":
      return "An account already exists with this email. Try logging in instead.";
    case "auth/weak-password":
      return "Please choose a password with at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled. Please try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    // Declarative redirect — calling navigate() during render crashed the tree
    // to a blank page when arriving here via client-side navigation.
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await logIn(email, password);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader
        tagline
        right={
          <Link to="/" className="text-sm font-medium" style={{ color: "var(--accent)" }}>
            ← Back to home
          </Link>
        }
      />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="lk-panel">
          <div className="text-center mb-7">
            <h1 className="lk-share-title" style={{ fontSize: "1.9rem" }}>
              {isSignUp ? (
                <>
                  Create your <span className="serif-italic">mirror</span>
                </>
              ) : (
                <>
                  Welcome <span className="serif-italic">back</span>
                </>
              )}
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              Your SmartMirror to understand and know what your skin needs.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              autoComplete="email"
              disabled={loading}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              disabled={loading}
              required
            />

            {error && (
              <div
                className="px-4 py-3 rounded-xl text-sm"
                style={{
                  background: "#fdeaee",
                  border: "1px solid rgba(232,96,125,0.35)",
                  color: "#a83452",
                }}
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="lk-btn-primary w-full"
              style={{ width: "100%" }}
            >
              {loading ? "Please wait…" : isSignUp ? "Create account" : "Log in"}
            </button>
          </form>

          <div className="my-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: "var(--border-soft)" }}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3" style={{ background: "var(--card)", color: "var(--muted)" }}>
                or
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="lk-btn-book w-full justify-center"
            style={{ width: "100%", justifyContent: "center" }}
            type="button"
          >
            <span className="lk-btn-book-icon">
              <Sparkles size={18} />
            </span>
            <span className="lk-btn-book-text">
              <span className="lk-btn-book-primary">Continue with Google</span>
              <span className="lk-btn-book-secondary">Fast &amp; secure</span>
            </span>
          </button>

          <p className="mt-6 text-center text-sm" style={{ color: "var(--muted)" }}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="font-semibold"
              style={{ color: "var(--accent)" }}
            >
              {isSignUp ? "Log in" : "Sign up"}
            </button>
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}
