import React, { createContext, useContext, useState } from "react";
import { functions, auth } from "../firebase";
import { httpsCallable } from "firebase/functions";
import { useAuth } from "./AuthContext";

/**
 * Skin-analysis state, shared across the dashboard.
 *
 * Why a context: <UploadSection> triggers the analysis while <Dashboard>
 * (a sibling) renders the results. If each called a plain useState-based hook
 * they'd hold *separate* state and the result would never reach the display.
 * A single provider gives both the same state.
 *
 * The image is sent to the backend as a base64 data URI (imageData) — no
 * Firebase Storage round-trip. This keeps the local, Functions-only demo fully
 * working without the Storage emulator (which needs Java).
 */

const SkinAnalysisContext = createContext(null);

/**
 * Where to send the image for analysis.
 *
 * When VITE_ANALYZE_API_URL is set (production build), we POST the image to
 * that endpoint — the YouCam backend now runs on Vercel's free tier, which
 * keeps the API key server-side while the frontend stays on Firebase Hosting at
 * the unchanged primary link. When it's unset (local dev), we fall back to the
 * Firebase callable so the Functions emulator still works.
 */
const ANALYZE_API_URL = import.meta.env?.VITE_ANALYZE_API_URL || "";

/** Build an Error carrying a `.code` so parseError() maps it like a callable error. */
function makeError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

/** Read a File/Blob as a "data:<mime>;base64,…" string. */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read the image file"));
    reader.readAsDataURL(file);
  });
}

/** Map a Cloud Function / Firebase error into a friendly, coded object. */
function parseError(err) {
  console.error("[useSkinAnalysis] Error occurred:", err);

  if (err.code) {
    const code = err.code.toUpperCase();
    const errorMap = {
      "UNAUTHENTICATED": {
        code: "UNAUTHENTICATED",
        message: "You must be logged in to analyze skin. Please sign in and try again.",
        userFriendly: true,
      },
      "INVALID-ARGUMENT": {
        code: "INVALID_IMAGE_MIME",
        message: err.message || "Invalid image provided. Please use a clear, front-facing JPG or PNG.",
        userFriendly: true,
      },
      "RESOURCE-EXHAUSTED": {
        code: "QUOTA_EXCEEDED",
        message: err.message || "You've reached your daily analysis limit. Try again tomorrow.",
        userFriendly: true,
      },
      "DEADLINE-EXCEEDED": {
        code: "API_TIMEOUT",
        message: "Analysis took too long. Please try again with a clearer photo.",
        userFriendly: true,
      },
      "UNIMPLEMENTED": {
        code: "UNIMPLEMENTED",
        message: err.message || "This feature isn't available in this build yet.",
        userFriendly: true,
      },
      "INTERNAL": {
        code: "INTERNAL_ERROR",
        message: err.message || "Analysis failed. Please try again.",
        userFriendly: true,
      },
    };

    return (
      errorMap[code] || {
        code: code || "UNKNOWN_ERROR",
        message: err.message || "An unexpected error occurred",
        userFriendly: false,
      }
    );
  }

  if (err.message?.includes("network")) {
    return {
      code: "NETWORK_ERROR",
      message: "Network connection failed. Please check your internet and try again.",
      userFriendly: true,
    };
  }

  if (err.message?.includes("timeout")) {
    return {
      code: "API_TIMEOUT",
      message: "Request timed out. Please try again.",
      userFriendly: true,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: err.message || "Failed to analyze skin",
    userFriendly: false,
  };
}

/**
 * Production transport: POST the image to the Vercel backend with the user's
 * Firebase ID token. The backend verifies the token, calls YouCam server-side
 * (key never leaves the server), and returns the same shape the callable did:
 * { analysis, analysisId }. Errors carry a `.code` so parseError() maps them.
 */
async function analyzeViaHttp({ imageData, imageMetadata }) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw makeError("unauthenticated", "You must be logged in to analyze skin. Please sign in and try again.");
  }
  const token = await currentUser.getIdToken();

  // Guard against a hung request (the server itself caps at 60s).
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);

  let res;
  try {
    res = await fetch(ANALYZE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ imageData, imageMetadata }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err?.name === "AbortError") {
      throw makeError("deadline-exceeded", "Analysis took too long. Please try again in a moment.");
    }
    // Reworded so parseError()'s (lowercase) "network" check matches.
    throw new Error("Could not reach the analysis service (network error). Please try again.");
  } finally {
    clearTimeout(timer);
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON error body */
  }

  if (!res.ok || !json?.success) {
    const code = json?.code || (res.status === 401 ? "unauthenticated" : "internal");
    throw makeError(code, json?.message || "Analysis failed. Please try again.");
  }
  return { analysis: json.analysis, analysisId: json.analysisId };
}

/** Local/dev transport: the Firebase callable (Functions emulator). */
async function analyzeViaCallable({ imageData, imageMetadata }) {
  const analyzeSkin = httpsCallable(functions, "analyzeSkin", { timeout: 180000 });
  const response = await analyzeSkin({ imageData, imageMetadata });
  return { analysis: response.data.analysis, analysisId: response.data.analysisId };
}

export function SkinAnalysisProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useAuth();

  const analyze = async (file) => {
    // Pre-flight checks
    if (!user) {
      setError({ code: "UNAUTHENTICATED", message: "Must be logged in to analyze skin", userFriendly: true });
      return;
    }
    if (!file) {
      setError({ code: "INVALID_FILE", message: "Please select an image file", userFriendly: true });
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (file.type && !allowedTypes.includes(file.type)) {
      setError({
        code: "INVALID_IMAGE_MIME",
        message: `Only JPG and PNG images are supported. You provided: ${file.type}`,
        userFriendly: true,
      });
      return;
    }

    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const actualSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setError({
        code: "INVALID_IMAGE_SIZE",
        message: `Image is too large (${actualSizeMB}MB). Maximum size is 10MB.`,
        userFriendly: true,
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log("[useSkinAnalysis] Encoding image as base64…");
      const imageData = await fileToDataUrl(file);

      const imageMetadata = {
        name: file.name || "face.jpg",
        size: file.size,
        type: file.type || "image/jpeg",
      };

      // Prod: POST to the Vercel backend. Dev (no VITE_ANALYZE_API_URL): the
      // Firebase callable against the Functions emulator.
      const transport = ANALYZE_API_URL ? "backend" : "callable";
      console.log(`[useSkinAnalysis] Calling analysis (${transport})…`);
      const { analysis: analysisRaw, analysisId } = ANALYZE_API_URL
        ? await analyzeViaHttp({ imageData, imageMetadata })
        : await analyzeViaCallable({ imageData, imageMetadata });

      console.log("[useSkinAnalysis] Analysis completed successfully");

      const analysis = analysisRaw || {};
      setResult({
        ...analysis,
        // Prefer the server-returned, face-aligned analyzed image; fall back to
        // the original upload so the results panel always has something to show.
        imageUrl: analysis.baseImage || imageData,
        analysisId,
        timestamp: new Date(),
      });
      setRetryCount(0);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const retry = async (file) => {
    setRetryCount((prev) => prev + 1);
    await analyze(file);
  };

  const clearError = () => setError(null);

  const reset = () => {
    setLoading(false);
    setResult(null);
    setError(null);
    setRetryCount(0);
  };

  const value = { loading, result, error, retryCount, analyze, retry, clearError, reset };

  return <SkinAnalysisContext.Provider value={value}>{children}</SkinAnalysisContext.Provider>;
}

/**
 * Consume the shared skin-analysis state. Must be used inside
 * <SkinAnalysisProvider>. Falls back to a safe no-op shape if the provider is
 * missing so a stray consumer never crashes the app.
 */
export function useSkinAnalysis() {
  const ctx = useContext(SkinAnalysisContext);
  if (!ctx) {
    console.warn("[useSkinAnalysis] Used outside <SkinAnalysisProvider>; returning inert state.");
    return {
      loading: false,
      result: null,
      error: null,
      retryCount: 0,
      analyze: async () => {},
      retry: async () => {},
      clearError: () => {},
      reset: () => {},
    };
  }
  return ctx;
}
