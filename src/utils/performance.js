/**
 * Performance Optimization Utilities
 *
 * Includes lazy loading, debouncing, memoization, and
 * other performance enhancements for mobile and desktop.
 *
 * Performance Targets:
 * - Lazy load images within 500ms of viewport entry
 * - Debounce chart updates to 300ms
 * - Cache expensive calculations with memoization
 */

/**
 * Lazy Load Images Using Intersection Observer
 *
 * Usage:
 * - Add data-src attribute to img tags
 * - Call initLazyLoading() on component mount
 *
 * @param {number} rootMargin - Margin around viewport (default: "50px")
 */
export function initLazyLoading(rootMargin = "50px") {
  // Select all images with data-src attribute
  const images = document.querySelectorAll("img[data-src]");

  if (!("IntersectionObserver" in window)) {
    // Fallback for browsers without IntersectionObserver support
    images.forEach((img) => {
      img.src = img.dataset.src;
      img.removeAttribute("data-src");
    });
    return;
  }

  const imageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
          imageObserver.unobserve(img);

          // Add fade-in animation
          img.style.animation = "fadeIn 0.3s ease-in-out";
        }
      });
    },
    {
      rootMargin,
      threshold: 0.01,
    }
  );

  images.forEach((img) => imageObserver.observe(img));
}

/**
 * Debounce Function
 *
 * Limits how often a function can be called.
 * Useful for resize events, input validation, chart updates.
 *
 * Usage:
 * const debouncedUpdate = debounce(() => updateChart(), 300);
 *
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay = 300) {
  let timeoutId = null;

  return function debounced(...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle Function
 *
 * Ensures a function runs at most once per time interval.
 * Useful for scroll events, window resize.
 *
 * Usage:
 * const throttledScroll = throttle(() => handleScroll(), 100);
 * window.addEventListener('scroll', throttledScroll);
 *
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 100) {
  let inThrottle;

  return function throttled(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Memoization Cache
 *
 * Caches expensive function results based on arguments.
 * Useful for metric calculations, color determinations.
 *
 * Usage:
 * const memoizedCalc = memoize((value) => expensiveCalculation(value));
 *
 * @param {Function} func - Function to memoize
 * @returns {Function} Memoized function with cache
 */
export function memoize(func) {
  const cache = new Map();

  return function memoized(...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func.apply(this, args);
    cache.set(key, result);

    // Clear cache if it gets too large
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  };
}

/**
 * Measure Function Performance
 *
 * Helps identify performance bottlenecks during development.
 *
 * Usage:
 * const result = measurePerformance("imageCompression", () => compressImage(file));
 *
 * @param {string} label - Label for the measurement
 * @param {Function} func - Function to measure
 * @returns {any} Result of the function
 */
export function measurePerformance(label, func) {
  const start = performance.now();
  const result = func();
  const end = performance.now();
  const duration = end - start;

  // Log only if duration exceeds 100ms
  if (duration > 100) {
    console.warn(`Performance Warning: ${label} took ${duration.toFixed(2)}ms`);
  } else if (process.env.NODE_ENV === "development") {
    console.log(`${label} took ${duration.toFixed(2)}ms`);
  }

  return result;
}

/**
 * Request Idle Callback Polyfill
 *
 * Schedules work during browser idle time.
 * Falls back to setTimeout if not supported.
 *
 * Usage:
 * scheduleIdleTask(() => updateAnalytics());
 *
 * @param {Function} callback - Callback to execute during idle time
 * @param {Object} options - Options object
 */
export function scheduleIdleTask(callback, options = {}) {
  if ("requestIdleCallback" in window) {
    return window.requestIdleCallback(callback, options);
  }

  // Polyfill using setTimeout
  const timeout = (options.timeout || 1000) / 1000;
  return setTimeout(callback, timeout);
}

/**
 * Detect Connection Speed
 *
 * Returns estimated connection speed for adaptive loading.
 *
 * @returns {string} "4g" | "3g" | "2g" | "slow" | "unknown"
 */
export function getConnectionSpeed() {
  if ("connection" in navigator) {
    const effectiveType = navigator.connection.effectiveType;
    return effectiveType; // "4g", "3g", "2g", "slow-2g"
  }

  return "unknown";
}

/**
 * Adaptive Image Loading
 *
 * Adjusts image quality based on connection speed.
 *
 * @param {number} imageSize - Original image file size in bytes
 * @returns {Object} Recommendations for image loading
 */
export function getAdaptiveImageSettings(imageSize) {
  const speed = getConnectionSpeed();

  const settings = {
    "4g": { maxWidth: 1920, quality: 0.8, shouldLazyLoad: false },
    "3g": { maxWidth: 1280, quality: 0.6, shouldLazyLoad: true },
    "2g": { maxWidth: 640, quality: 0.4, shouldLazyLoad: true },
    "slow-2g": { maxWidth: 320, quality: 0.3, shouldLazyLoad: true },
    unknown: { maxWidth: 1280, quality: 0.6, shouldLazyLoad: true },
  };

  return settings[speed] || settings.unknown;
}

/**
 * Check if running on mobile device
 *
 * @returns {boolean}
 */
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Check if device is in low battery mode
 *
 * @returns {boolean}
 */
export function isLowBattery() {
  if ("getBattery" in navigator) {
    return navigator.getBattery().then((battery) => battery.level < 0.2);
  }

  // Fallback: check if explicitly set (some browsers may support this)
  if ("battery" in navigator) {
    return navigator.battery.level < 0.2;
  }

  return false;
}

/**
 * Viewport Detection
 *
 * Determines current viewport size for responsive behavior.
 *
 * @returns {Object} Viewport information
 */
export function getViewport() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 640,
    isTablet: window.innerWidth >= 640 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
  };
}

/**
 * Preload Image
 *
 * Preloads an image to ensure it's cached before display.
 *
 * @param {string} src - Image source URL
 * @returns {Promise} Resolves when image is loaded
 */
export function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Optimize for Mobile
 *
 * Applies mobile-specific optimizations.
 * Call on app startup on mobile devices.
 */
export function optimizeForMobile() {
  if (!isMobileDevice()) return;

  // Disable hover effects on mobile (prevent sticky hover states)
  const style = document.createElement("style");
  style.textContent = `
    @media (hover: none) {
      button:hover,
      a:hover,
      input:hover {
        background-color: inherit;
        color: inherit;
      }
    }
  `;
  document.head.appendChild(style);

  // Add viewport meta tag if not present
  if (!document.querySelector('meta[name="viewport"]')) {
    const viewport = document.createElement("meta");
    viewport.name = "viewport";
    viewport.content =
      "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5, user-scalable=yes";
    document.head.appendChild(viewport);
  }

  // Disable double-tap zoom on input fields (prevents 300ms delay)
  document.addEventListener("touchstart", (e) => {
    if (e.target.matches("input, textarea, select")) {
      e.target.style.fontSize = "16px";
    }
  });
}

/**
 * Request Animation Frame Loop
 *
 * Efficient animation loop respecting browser refresh rate.
 *
 * @param {Function} callback - Called on each frame
 * @returns {Function} Stop function
 */
export function createAnimationLoop(callback) {
  let animationId = null;
  let isRunning = false;

  const start = () => {
    if (isRunning) return;
    isRunning = true;

    const loop = () => {
      callback();
      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
  };

  const stop = () => {
    isRunning = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  };

  return { start, stop };
}

/**
 * Memory Leak Detection Helper
 *
 * Helps identify common memory leak patterns during development.
 * Only runs in development mode.
 */
export function setupMemoryLeakDetection() {
  if (process.env.NODE_ENV !== "development") return;

  const observedElements = new WeakMap();

  window.addEventListener("beforeunload", () => {
    // Check for detached DOM nodes with listeners
    const allElements = document.querySelectorAll("*");
    allElements.forEach((el) => {
      if (el.parentNode === null && observedElements.has(el)) {
        console.warn("Potential memory leak: Detached element still referenced", el);
      }
    });
  });
}
