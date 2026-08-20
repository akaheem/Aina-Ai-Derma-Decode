/**
 * cameraDevices.js — helpers for camera selection and getUserMedia constraints.
 *
 * The pure helpers (constraint builders, facing/label derivation) read no
 * browser globals and are unit-testable with plain Node assert. The single
 * impure helper, `enumerateVideoDevices`, is a thin async wrapper over
 * `navigator.mediaDevices.enumerateDevices()` kept here so CameraCapture.jsx
 * has one place for all device concerns.
 *
 * Used by CameraCapture.jsx to:
 *   - build constraints for a front/back flip or a specific deviceId,
 *   - derive the active facing mode / deviceId from a running stream,
 *   - label cameras when the browser withholds labels (pre-permission),
 *   - decide when the flip / picker controls are meaningful.
 */

/** Shared quality ideals — square-ish 1280 so the portrait oval maps cleanly. */
const VIDEO_IDEALS = { width: { ideal: 1280 }, height: { ideal: 1280 } };

/**
 * Build constraints requesting a camera by facing mode (front/back flip or
 * the initial open). Uses `ideal` (not `exact`) so a device with only one
 * camera still resolves instead of throwing OverconstrainedError.
 *
 * @param {"user" | "environment"} facingMode - "user" = front, "environment" = rear.
 * @returns {MediaStreamConstraints}
 */
export function buildFacingConstraints(facingMode) {
  if (facingMode !== "user" && facingMode !== "environment") {
    throw new Error(`Invalid facingMode: ${facingMode}. Use "user" or "environment".`);
  }
  return {
    audio: false,
    video: { facingMode: { ideal: facingMode }, ...VIDEO_IDEALS },
  };
}

/**
 * Build constraints pinned to one exact device — used by the lens/camera picker.
 *
 * @param {string} deviceId - An exact deviceId from enumerateVideoDevices().
 * @returns {MediaStreamConstraints}
 */
export function buildDeviceConstraints(deviceId) {
  if (!deviceId || typeof deviceId !== "string") {
    throw new Error("deviceId must be a non-empty string.");
  }
  return {
    audio: false,
    video: { deviceId: { exact: deviceId }, ...VIDEO_IDEALS },
  };
}

/**
 * Derive the facing mode from a live stream's active video track.
 * Browsers that omit `facingMode` (most desktops) yield "unknown" so the
 * caller can fall back to the side it requested.
 *
 * @param {MediaStream | null | undefined} stream
 * @returns {"user" | "environment" | "unknown"}
 */
export function getActualFacingMode(stream) {
  const track = stream?.getVideoTracks?.()[0];
  if (!track) return "unknown";
  const facing = track.getSettings?.().facingMode;
  if (facing === "user" || facing === "environment") return facing;
  return "unknown";
}

/**
 * Active video deviceId from a live stream, or null when unavailable.
 *
 * @param {MediaStream | null | undefined} stream
 * @returns {string | null}
 */
export function getActiveDeviceId(stream) {
  const track = stream?.getVideoTracks?.()[0];
  return track?.getSettings?.().deviceId || null;
}

/**
 * The opposite facing mode (front ⇄ back).
 *
 * @param {"user" | "environment"} facingMode
 * @returns {"user" | "environment"}
 */
export function flipFacingMode(facingMode) {
  return facingMode === "environment" ? "user" : "environment";
}

/**
 * Friendly label for a camera device, falling back to "Camera N" when the
 * browser withholds the label (labels are empty until permission is granted).
 *
 * @param {{ label?: string, deviceId?: string }} device
 * @param {number} index - Zero-based position, used for the fallback name.
 * @returns {string}
 */
export function labelCamera(device, index) {
  const label = device?.label?.trim();
  return label || `Camera ${index + 1}`;
}

/**
 * True when more than one video input exists (i.e. switching is meaningful).
 *
 * @param {Array<unknown>} devices - videoinput entries from enumerateVideoDevices().
 * @returns {boolean}
 */
export function hasMultipleDevices(devices) {
  return Array.isArray(devices) && devices.length > 1;
}

/**
 * Enumerate available video-input devices. Returns [] on any failure or when
 * the API is unavailable, so callers can treat it as "no switching offered".
 * Labels are only populated after the first successful getUserMedia.
 *
 * @returns {Promise<MediaDeviceInfo[]>}
 */
export async function enumerateVideoDevices() {
  try {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    const all = await navigator.mediaDevices.enumerateDevices();
    return all.filter((d) => d.kind === "videoinput");
  } catch {
    return [];
  }
}
