/**
 * Image validation utilities for AinaAi Cloud Functions
 * Validates MIME type, file size, and dimensions
 */

const { ERROR_CODES } = require("./logger");

// Allowed MIME types
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];

// Max file size: 10MB
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// Min dimensions for face detection: 300x300px
const MIN_WIDTH = 300;
const MIN_HEIGHT = 300;

/**
 * Validate image MIME type
 * @param {string} mimeType - MIME type string (e.g., "image/jpeg")
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateMimeType(mimeType) {
  if (!mimeType) {
    return {
      valid: false,
      errorCode: ERROR_CODES.INVALID_IMAGE_MIME,
      error: "MIME type is required",
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    return {
      valid: false,
      errorCode: ERROR_CODES.INVALID_IMAGE_MIME,
      error: `Only JPG and PNG images are supported. You provided: ${mimeType}`,
    };
  }

  return { valid: true };
}

/**
 * Validate image file size
 * @param {number} sizeBytes - File size in bytes
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateFileSize(sizeBytes) {
  if (!sizeBytes || typeof sizeBytes !== "number") {
    return {
      valid: false,
      errorCode: ERROR_CODES.INVALID_IMAGE_SIZE,
      error: "File size information is missing",
    };
  }

  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    const maxSizeMB = MAX_FILE_SIZE_BYTES / (1024 * 1024);
    const actualSizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      errorCode: ERROR_CODES.INVALID_IMAGE_SIZE,
      error: `Image is too large (${actualSizeMB}MB). Maximum size is ${maxSizeMB}MB.`,
    };
  }

  return { valid: true };
}

/**
 * Validate image dimensions
 * Requires image to be at least 300x300px for reliable face detection
 *
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateDimensions(width, height) {
  if (!width || !height || typeof width !== "number" || typeof height !== "number") {
    return {
      valid: false,
      errorCode: ERROR_CODES.INVALID_IMAGE_DIMENSIONS,
      error: "Image dimensions are invalid or missing",
    };
  }

  if (width < MIN_WIDTH || height < MIN_HEIGHT) {
    return {
      valid: false,
      errorCode: ERROR_CODES.INVALID_IMAGE_DIMENSIONS,
      error: `Image is too small (${width}x${height}px). Minimum size is ${MIN_WIDTH}x${MIN_HEIGHT}px for accurate skin analysis.`,
    };
  }

  return { valid: true };
}

/**
 * Get image dimensions by fetching and analyzing headers
 * Note: This is a simplified version. In production, you might use a library
 * like 'sharp' or 'jimp' to properly read image metadata.
 *
 * @param {string} imageUrl - URL to the image
 * @returns {Promise<{width: number, height: number}>} Image dimensions
 */
async function getImageDimensions(imageUrl) {
  try {
    // Try to extract from Storage metadata if available
    // For now, we'll validate via YouCam API response
    // In a full implementation, you could use an image processing library
    return null; // Will be validated via YouCam response
  } catch (error) {
    throw error;
  }
}

/**
 * Comprehensive image validation
 * @param {Object} imageData - Image data from Firebase Storage
 * @param {string} imageData.mimeType - MIME type
 * @param {number} imageData.size - File size in bytes
 * @param {number} imageData.width - Image width (optional, can be null)
 * @param {number} imageData.height - Image height (optional, can be null)
 * @returns {Object} { valid: boolean, errorCode?: string, error?: string }
 */
function validateImage(imageData) {
  const { mimeType, size, width, height } = imageData;

  // Validate MIME type
  const mimeValidation = validateMimeType(mimeType);
  if (!mimeValidation.valid) {
    return mimeValidation;
  }

  // Validate file size
  const sizeValidation = validateFileSize(size);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  // Validate dimensions if provided
  if (width && height) {
    const dimensionValidation = validateDimensions(width, height);
    if (!dimensionValidation.valid) {
      return dimensionValidation;
    }
  }

  return { valid: true };
}

module.exports = {
  validateMimeType,
  validateFileSize,
  validateDimensions,
  validateImage,
  getImageDimensions,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MIN_WIDTH,
  MIN_HEIGHT,
};
