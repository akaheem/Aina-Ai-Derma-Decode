/**
 * Image Compression Utility
 *
 * Handles client-side image compression with quality control,
 * dimension limiting, and file size optimization.
 *
 * Performance Targets:
 * - Compression time: < 2 seconds for typical 5MB images
 * - Output file size: <= 2MB
 * - Quality level: 0.8 (80%) for optimal balance
 */

/**
 * Compresses an image file with specified constraints
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @param {number} options.maxQuality - Quality level 0-1 (default: 0.8)
 * @param {number} options.maxWidth - Maximum width in pixels (default: 1920)
 * @param {number} options.maxHeight - Maximum height in pixels (default: 1920)
 * @param {number} options.maxFileSize - Maximum file size in MB (default: 2)
 * @param {Function} options.onProgress - Progress callback (0-100)
 * @returns {Promise<{compressed: File, originalSize: number, compressedSize: number, compressionRatio: number, compressionTime: number, dimensions: {width: number, height: number}}>}
 */
export async function compressImage(file, options = {}) {
  const startTime = performance.now();

  const {
    maxQuality = 0.8,
    maxWidth = 1920,
    maxHeight = 1920,
    maxFileSize = 2, // MB
    onProgress = () => {},
  } = options;

  // Validate input
  if (!file) {
    throw new Error("No file provided for compression");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image");
  }

  const originalSize = file.size;
  onProgress(10);

  // Create image element to get dimensions
  const image = new Image();
  const imageUrl = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    image.onload = async () => {
      try {
        onProgress(20);

        // Check minimum dimensions
        if (image.width < 300 || image.height < 300) {
          throw new Error(
            `Image too small. Minimum 300x300px required. Your image: ${image.width}x${image.height}px`
          );
        }

        // Calculate new dimensions maintaining aspect ratio
        let newWidth = image.width;
        let newHeight = image.height;
        const aspectRatio = image.width / image.height;

        if (image.width > maxWidth) {
          newWidth = maxWidth;
          newHeight = Math.round(maxWidth / aspectRatio);
        }

        if (newHeight > maxHeight) {
          newHeight = maxHeight;
          newWidth = Math.round(maxHeight * aspectRatio);
        }

        onProgress(40);

        // Create canvas for compression
        const canvas = document.createElement("canvas");
        canvas.width = newWidth;
        canvas.height = newHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Could not get canvas context");
        }

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(image, 0, 0, newWidth, newHeight);
        onProgress(60);

        // Compress to blob with quality control
        let compressedBlob = await new Promise((blobResolve) => {
          canvas.toBlob(
            (blob) => blobResolve(blob),
            "image/jpeg",
            maxQuality
          );
        });

        onProgress(80);

        // If still too large, progressively reduce quality
        let currentQuality = maxQuality;
        let attempts = 0;
        const maxAttempts = 5;

        while (
          compressedBlob.size > maxFileSize * 1024 * 1024 &&
          attempts < maxAttempts
        ) {
          currentQuality -= 0.1;
          attempts += 1;

          compressedBlob = await new Promise((blobResolve) => {
            canvas.toBlob(
              (blob) => blobResolve(blob),
              "image/jpeg",
              Math.max(0.5, currentQuality)
            );
          });
        }

        onProgress(95);

        // Create new File object with timestamp
        const timestamp = Date.now();
        const compressedFile = new File(
          [compressedBlob],
          `compressed_${timestamp}_${file.name}`,
          {
            type: "image/jpeg",
            lastModified: Date.now(),
          }
        );

        const endTime = performance.now();
        const compressionTime = endTime - startTime;
        const compressedSize = compressedFile.size;
        const compressionRatio =
          ((originalSize - compressedSize) / originalSize) * 100;

        onProgress(100);

        // Cleanup
        URL.revokeObjectURL(imageUrl);

        resolve({
          compressed: compressedFile,
          originalSize,
          compressedSize,
          compressionRatio: Math.round(compressionRatio),
          compressionTime: Math.round(compressionTime),
          dimensions: {
            width: newWidth,
            height: newHeight,
          },
        });
      } catch (error) {
        URL.revokeObjectURL(imageUrl);
        reject(error);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error("Failed to load image"));
    };

    image.src = imageUrl;
  });
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size (e.g., "2.5MB")
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + sizes[i];
}

/**
 * Format compression time for display
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} Formatted time (e.g., "1.2s")
 */
export function formatCompressionTime(milliseconds) {
  if (milliseconds < 1000) {
    return `${Math.round(milliseconds)}ms`;
  }
  return `${(milliseconds / 1000).toFixed(2)}s`;
}

/**
 * Estimate upload time based on file size and connection speed
 * Assumes average 5G/LTE speeds of 5-10 Mbps
 * @param {number} bytes - File size in bytes
 * @returns {string} Estimated time (e.g., "~2s")
 */
export function estimateUploadTime(bytes) {
  const estimatedSpeedMbps = 7.5; // Average mobile speed
  const bitSize = bytes * 8;
  const seconds = bitSize / (estimatedSpeedMbps * 1024 * 1024);

  if (seconds < 1) {
    return "< 1s";
  }

  if (seconds < 60) {
    return `~${Math.round(seconds)}s`;
  }

  const minutes = Math.round(seconds / 60);
  return `~${minutes}m`;
}
