import React, { useState, useRef } from "react";
import { useSkinAnalysis } from "../hooks/useSkinAnalysis";
import { ErrorDisplay } from "../components/ErrorDisplay";
import {
  compressImage,
  formatFileSize,
  formatCompressionTime,
  estimateUploadTime,
} from "../utils/imageCompression";

/**
 * Enhanced Upload Section Component
 *
 * Features:
 * - Client-side image compression with quality control
 * - Drag-and-drop and click-to-upload
 * - Real-time compression progress
 * - Image dimension validation (min 300x300px)
 * - File format validation (JPEG/PNG only)
 * - Preview with compression stats
 * - Touch-friendly UI (48x48px minimum buttons)
 * - Mobile-responsive layout
 *
 * Performance Targets:
 * - Compression: < 3 seconds
 * - Upload: < 2 seconds (on 4G)
 * - Result display: < 2 seconds
 *
 * Testing Checklist:
 * [ ] Desktop: Test with various image sizes (< 300x300, normal, large)
 * [ ] Mobile (320px): Verify full-width layout, touch-friendly buttons
 * [ ] Mobile (768px): Test swipeable tabs (when integrated)
 * [ ] Drag-drop: Works on desktop browsers
 * [ ] Compression: Verify 2MB+ images are compressed correctly
 * [ ] Error handling: Display proper messages for invalid formats/sizes
 * [ ] Accessibility: Tab navigation, ARIA labels work correctly
 */

export function UploadSection() {
  const [file, setFile] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [compressionStats, setCompressionStats] = useState(null);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const fileInputRef = useRef(null);
  const { loading: analyzing, analyze, error: analysisError, retry: retryAnalysis, clearError: clearAnalysisError } = useSkinAnalysis();

  // Combine errors from compression and analysis
  const error = validationError || analysisError;

  /**
   * Handle file selection with validation and compression
   * @param {File} selectedFile - The file to process
   */
  const processFile = async (selectedFile) => {
    setValidationError(null);
    setCompressionProgress(0);

    // Validate file type
    if (!["image/jpeg", "image/png", "image/jpg"].includes(selectedFile.type)) {
      setValidationError("Please upload a JPEG or PNG image");
      return;
    }

    // Validate file size (show warning for large files, but still process)
    if (selectedFile.size > 50 * 1024 * 1024) {
      setValidationError("File is too large. Maximum 50MB allowed.");
      return;
    }

    setFile(selectedFile);

    // Generate preview immediately for user feedback
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result);
    };
    reader.readAsDataURL(selectedFile);

    // Start compression
    try {
      setIsCompressing(true);
      setCompressionProgress(0);

      const result = await compressImage(selectedFile, {
        maxQuality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
        maxFileSize: 2,
        onProgress: setCompressionProgress,
      });

      setCompressedFile(result.compressed);
      setCompressionStats({
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        compressionRatio: result.compressionRatio,
        compressionTime: result.compressionTime,
        dimensions: result.dimensions,
      });

      setIsCompressing(false);
    } catch (err) {
      setValidationError(err.message);
      setIsCompressing(false);
      setCompressionProgress(0);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleAnalyze = async () => {
    if (compressedFile) {
      // Use compressed file for analysis
      await analyze(compressedFile);
    }
  };

  const handleReupload = () => {
    setFile(null);
    setCompressedFile(null);
    setPreview(null);
    setCompressionStats(null);
    setCompressionProgress(0);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isProcessing = isCompressing || analyzing;
  const hasCompressionStats = compressionStats && !isCompressing;

  return (
    <div className="lk-panel">
      <h2 className="text-xl sm:text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
        Analyze your skin
      </h2>
      <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
        Upload a clear, well-lit selfie to begin.
      </p>

      {/* File Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-colors lk-dropzone"
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            fileInputRef.current?.click();
          }
        }}
        aria-label="Upload image by dragging and dropping or clicking"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleFileChange}
          id="file-upload"
          className="hidden"
          disabled={isProcessing}
          aria-label="Select image file for skin analysis"
        />

        {!preview ? (
          <div className="space-y-2">
            <label htmlFor="file-upload" className="cursor-pointer block">
              <div
                className="text-4xl sm:text-5xl mb-2"
                aria-hidden="true"
              >
                📸
              </div>
              <p className="font-medium text-sm sm:text-base" style={{ color: "var(--text)" }}>
                Drag and drop your photo here
              </p>
              <p className="text-xs sm:text-sm" style={{ color: "var(--muted)" }}>
                or click to select (JPEG or PNG, min 300x300px)
              </p>
            </label>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* Preview Image */}
            <img
              src={preview}
              alt="Uploaded image preview for skin analysis"
              className="max-h-64 mx-auto rounded-2xl"
              style={{ border: "1px solid var(--border-soft)" }}
            />

            {/* Compression Progress */}
            {isCompressing && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span style={{ color: "var(--muted)" }}>Compressing image…</span>
                  <span className="font-medium" style={{ color: "var(--muted)" }}>
                    {compressionProgress}%
                  </span>
                </div>
                <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: "var(--accent-soft)" }}>
                  <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${compressionProgress}%`, background: "var(--accent)" }}
                    role="progressbar"
                    aria-valuenow={compressionProgress}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label="Image compression progress"
                  />
                </div>
              </div>
            )}

            {/* File Info */}
            <div className="text-left rounded-xl p-3 sm:p-4" style={{ background: "var(--bg)" }}>
              <p className="text-xs sm:text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
                {file?.name}
              </p>

              {hasCompressionStats && (
                <div className="space-y-2 text-xs sm:text-sm">
                  {/* Compression Summary - Key Metric */}
                  <div className="rounded-xl p-3" style={{ background: "var(--accent-soft)", border: "1px solid rgba(232,96,125,0.2)" }}>
                    <p className="font-semibold" style={{ color: "var(--text)" }}>
                      Original: {formatFileSize(compressionStats.originalSize)} →
                      Compressed:{" "}
                      <span className="font-bold" style={{ color: "var(--accent)" }}>
                        {formatFileSize(compressionStats.compressedSize)}
                      </span>
                    </p>
                    <p className="font-semibold mt-1" style={{ color: "var(--accent)" }}>
                      {compressionStats.compressionRatio}% reduction
                    </p>
                  </div>

                  {/* Detailed Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg p-2" style={{ background: "var(--card)", border: "1px solid var(--border-soft)" }}>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>Dimensions</p>
                      <p className="font-medium" style={{ color: "var(--text)" }}>
                        {compressionStats.dimensions.width}x
                        {compressionStats.dimensions.height}
                      </p>
                    </div>
                    <div className="rounded-lg p-2" style={{ background: "var(--card)", border: "1px solid var(--border-soft)" }}>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>Compression Time</p>
                      <p className="font-medium" style={{ color: "var(--text)" }}>
                        {formatCompressionTime(
                          compressionStats.compressionTime
                        )}
                      </p>
                    </div>
                    <div className="rounded-lg p-2" style={{ background: "var(--card)", border: "1px solid var(--border-soft)" }}>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>Est. Upload</p>
                      <p className="font-medium" style={{ color: "var(--text)" }}>
                        {estimateUploadTime(compressionStats.compressedSize)}
                      </p>
                    </div>
                    <div className="rounded-lg p-2" style={{ background: "var(--card)", border: "1px solid var(--border-soft)" }}>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>Quality</p>
                      <p className="font-medium" style={{ color: "var(--text)" }}>80%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Validation/Analysis Errors */}
      {error && (
        <div className="mt-4">
          {typeof error === "string" ? (
            <div
              className="px-4 py-3 rounded-xl text-sm"
              style={{ background: "#fdeaee", border: "1px solid rgba(232,96,125,0.35)", color: "#a83452" }}
              role="alert"
            >
              {error}
            </div>
          ) : (
            <ErrorDisplay
              error={error}
              onRetry={() => {
                if (compressedFile && !validationError) {
                  retryAnalysis(compressedFile);
                }
              }}
              onDismiss={() => {
                setValidationError(null);
                clearAnalysisError();
              }}
              context="skin analysis"
            />
          )}
        </div>
      )}

      {/* Action Buttons - Touch-Friendly (min 48px height) */}
      {preview && (
        <div className="mt-6 space-y-3 sm:space-y-0 sm:flex sm:gap-3">
          <button
            onClick={handleAnalyze}
            disabled={isProcessing}
            className="lk-btn-primary w-full sm:flex-1"
            style={{ width: "100%", opacity: isProcessing ? 0.5 : 1 }}
            aria-busy={analyzing}
            aria-label="Analyze skin with uploaded image"
          >
            {analyzing ? "Analyzing…" : "Analyze skin"}
          </button>

          {!isCompressing && (
            <button
              onClick={handleReupload}
              disabled={isProcessing}
              className="w-full sm:flex-1 py-3 rounded-full font-medium transition text-sm sm:text-base min-h-[48px] flex items-center justify-center"
              style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border-soft)", opacity: isProcessing ? 0.5 : 1 }}
              aria-label="Re-upload a different image"
            >
              Re-upload
            </button>
          )}
        </div>
      )}

      {/* Empty State Help Text */}
      {!preview && (
        <p className="mt-4 text-xs sm:text-sm text-center" style={{ color: "var(--muted)" }}>
          💡 Pro tip: Images are automatically compressed to reduce upload time
          while maintaining quality
        </p>
      )}
    </div>
  );
}
