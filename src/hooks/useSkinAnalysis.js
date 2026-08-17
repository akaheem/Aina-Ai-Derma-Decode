/**
 * useSkinAnalysis — thin re-export.
 *
 * The real implementation now lives in a shared context so that the component
 * that *triggers* the analysis (UploadSection) and the component that *renders*
 * it (Dashboard) read the same state. See contexts/SkinAnalysisContext.jsx.
 *
 * Kept as a module so existing imports (`../hooks/useSkinAnalysis`) still work.
 */
export {
  useSkinAnalysis,
  SkinAnalysisProvider,
} from "../contexts/SkinAnalysisContext";
