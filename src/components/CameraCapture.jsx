import React, { useCallback, useEffect, useRef, useState } from "react";
import { Camera, X, RefreshCw, SwitchCamera } from "lucide-react";
import {
  createDetector,
  evaluateFace,
  isNativeFaceDetectorSupported,
  mapFaceBoxToOverlay,
} from "../utils/faceGuide";
import {
  buildDeviceConstraints,
  buildFacingConstraints,
  enumerateVideoDevices,
  flipFacingMode,
  getActiveDeviceId,
  getActualFacingMode,
  hasMultipleDevices,
  labelCamera,
} from "../utils/cameraDevices";

/**
 * CameraCapture — self-contained modal that captures a selfie through
 * getUserMedia with an oval face guide, then hands the JPEG File to the
 * existing compress -> analyze pipeline via onCapture.
 *
 * Camera switching: after the first permission grant the modal enumerates the
 * device's cameras. A flip button (front ⇄ back) appears whenever more than one
 * camera exists; a lens/camera picker appears when the device exposes more than
 * a simple pair (Android multi-lens, multi-webcam desktops). The selfie mirror
 * and FaceDetector auto-capture apply to the FRONT camera only — the rear
 * camera renders true-orientation and uses the manual Capture button. The
 * capture canvas is always drawn un-mirrored regardless of preview mirroring.
 *
 * Auto-capture runs only where window.FaceDetector exists (Chrome/Edge) AND the
 * front camera is active; everywhere else the user taps Capture manually.
 *
 * @component
 * @param {Object} props
 * @param {(file: File) => void} props.onCapture - Called with the captured JPEG File (true orientation, un-mirrored).
 * @param {() => void} props.onClose - Dismiss the modal ("Switch to Upload", X, Esc, or after a completed capture).
 * @param {boolean} [props.autoAnalyze=true] - When true, an auto-capture (face aligned) proceeds straight to analysis after a ~2s countdown with a Retake escape; when false it lands on the Use-photo preview instead.
 * @returns {JSX.Element}
 */
export function CameraCapture({ onCapture, onClose, autoAnalyze = true }) {
  /** @type {'starting'|'live'|'countdown'|'preview'|'error'} */
  const [phase, setPhase] = useState("starting");
  const [camError, setCamError] = useState(null);
  const [faceStatus, setFaceStatus] = useState({ status: "none", hint: "Center your face inside the oval" });
  const [frozenUrl, setFrozenUrl] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [devices, setDevices] = useState([]);
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  // Requested side; used as the mirror/auto-capture signal and as a fallback
  // when the browser omits facingMode from track settings (common on desktop).
  const [facingMode, setFacingMode] = useState("user");
  // Whether the browser actually reports front/back. False on most desktops,
  // where we lead with the device picker instead of a front/back flip.
  const [facingKnown, setFacingKnown] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [switchStatus, setSwitchStatus] = useState(null);

  const videoRef = useRef(null);
  const stageRef = useRef(null);
  const cardRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);
  const frozenFileRef = useRef(null);
  const frozenUrlRef = useRef(null);
  const goodSinceRef = useRef(null);
  const finishedRef = useRef(false);
  const detectBusyRef = useRef(false);
  const mountedRef = useRef(true);
  const switchingRef = useRef(false); // guards re-entrancy without a stale-closure race
  const switchSeqRef = useRef(0); // only the latest switch may mutate state
  const statusTimerRef = useRef(null);
  // Keep latest callbacks reachable from long-lived timers without re-subscribing.
  const onCaptureRef = useRef(onCapture);
  const onCloseRef = useRef(onClose);
  onCaptureRef.current = onCapture;
  onCloseRef.current = onClose;

  const autoSupported = isNativeFaceDetectorSupported();
  const isFront = facingMode === "user";
  const autoActive = autoSupported && isFront; // auto-capture is front-camera only
  // Mobile-like (facing known): lead with a front/back flip, show the picker
  // only for extra lenses. Desktop-like (facing unknown): lead with the picker.
  const showFlip = facingKnown && hasMultipleDevices(devices);
  const showPicker = facingKnown ? devices.length > 2 : hasMultipleDevices(devices);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  /** Attach a stream to the <video> and start playback (autoplay may reject). */
  const attachStream = useCallback(async (stream) => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    try {
      await video.play();
    } catch {
      /* autoplay can reject until gestures settle; the stream stays live */
    }
  }, []);

  const refreshDevices = useCallback(async () => {
    const list = await enumerateVideoDevices();
    if (mountedRef.current) setDevices(list);
  }, []);

  const showStatus = useCallback((message) => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    setSwitchStatus(message);
    statusTimerRef.current = setTimeout(() => {
      if (mountedRef.current) setSwitchStatus(null);
    }, 3500);
  }, []);

  /**
   * Switch cameras by acquiring the replacement stream BEFORE stopping the old
   * one, so a rejected request (e.g. OverconstrainedError) leaves the current
   * preview live instead of dropping to the error screen. A sequence guard
   * ensures only the most recent switch mutates state, and teardown mid-switch
   * stops any orphaned replacement track.
   *
   * @param {MediaStreamConstraints} constraints
   * @param {"user" | "environment"} requestedFacing - fallback when the browser omits facingMode.
   */
  const switchTo = useCallback(
    async (constraints, requestedFacing) => {
      if (switchingRef.current || finishedRef.current) return;
      if (!navigator.mediaDevices?.getUserMedia) return;

      const seq = ++switchSeqRef.current;
      switchingRef.current = true;
      setSwitching(true);
      setSwitchStatus(null);

      try {
        const replacement = await navigator.mediaDevices.getUserMedia(constraints);
        if (!mountedRef.current || seq !== switchSeqRef.current || finishedRef.current) {
          replacement.getTracks().forEach((t) => t.stop());
          return;
        }

        const previous = streamRef.current;
        streamRef.current = replacement;
        await attachStream(replacement);
        previous?.getTracks().forEach((t) => t.stop());

        if (!mountedRef.current || seq !== switchSeqRef.current) return;
        const actual = getActualFacingMode(replacement);
        const known = actual !== "unknown";
        setFacingKnown(known);
        setFacingMode(known ? actual : requestedFacing);
        setCurrentDeviceId(getActiveDeviceId(replacement));
        setFaceStatus({ status: "none", hint: "Center your face inside the oval" });
        goodSinceRef.current = null;
        await refreshDevices();
      } catch (err) {
        if (mountedRef.current && seq === switchSeqRef.current) {
          showStatus(
            err?.name === "NotAllowedError"
              ? "Camera permission was blocked"
              : "Couldn’t switch — still on your current camera"
          );
        }
      } finally {
        if (seq === switchSeqRef.current) {
          switchingRef.current = false;
          if (mountedRef.current) setSwitching(false);
        }
      }
    },
    [attachStream, refreshDevices, showStatus]
  );

  const flipCamera = useCallback(() => {
    const next = flipFacingMode(facingMode);
    switchTo(buildFacingConstraints(next), next);
  }, [facingMode, switchTo]);

  const pickDevice = useCallback(
    (deviceId) => {
      if (!deviceId || deviceId === currentDeviceId) return;
      switchTo(buildDeviceConstraints(deviceId), facingMode);
    },
    [currentDeviceId, facingMode, switchTo]
  );

  const clearFrozen = useCallback(() => {
    if (frozenUrlRef.current) URL.revokeObjectURL(frozenUrlRef.current);
    frozenUrlRef.current = null;
    frozenFileRef.current = null;
    setFrozenUrl(null);
  }, []);

  /** Draw the current video frame (un-mirrored, true orientation) to a JPEG. */
  const captureFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(null);
          resolve({
            file: new File([blob], "aina-camera.jpg", { type: "image/jpeg" }),
            url: URL.createObjectURL(blob),
          });
        },
        "image/jpeg",
        0.92
      );
    });
  }, []);

  /** Hand the frozen photo to the parent and tear everything down. */
  const finishCapture = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const file = frozenFileRef.current;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    stopStream();
    const url = frozenUrlRef.current;
    frozenUrlRef.current = null; // parent shows its own preview; revoke ours after handoff
    frozenFileRef.current = null;
    if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (file) onCaptureRef.current(file);
    onCloseRef.current();
  }, [stopStream]);

  /** Freeze the live frame: auto path counts down then finishes, manual path shows Use-photo. */
  const freeze = useCallback(
    async (mode) => {
      if (finishedRef.current || frozenFileRef.current) return;
      if (intervalRef.current) clearInterval(intervalRef.current);
      const shot = await captureFrame();
      if (!shot || finishedRef.current) return;
      frozenFileRef.current = shot.file;
      frozenUrlRef.current = shot.url;
      setFrozenUrl(shot.url);
      if (mode === "auto" && autoAnalyze) {
        setSecondsLeft(2);
        setPhase("countdown");
      } else {
        setPhase("preview");
      }
    },
    [autoAnalyze, captureFrame]
  );

  /** Cancel countdown/preview and go back to live alignment. */
  const retake = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = null;
    clearFrozen();
    goodSinceRef.current = null;
    setSecondsLeft(null);
    setPhase("live");
  }, [clearFrozen]);

  // Countdown driver: fires finishCapture one tick after the counter hits 0.
  useEffect(() => {
    if (phase !== "countdown" || secondsLeft === null) return;
    if (secondsLeft <= 0) {
      finishCapture();
      return;
    }
    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => (prev === null ? null : prev - 1));
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = null;
    };
  }, [phase, secondsLeft, finishCapture]);

  // Camera start (mount only) + full teardown on unmount.
  useEffect(() => {
    let cancelled = false;
    mountedRef.current = true;
    detectorRef.current = createDetector();

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw Object.assign(new Error("getUserMedia unavailable"), { name: "NotSupportedError" });
        }
        const stream = await navigator.mediaDevices.getUserMedia(buildFacingConstraints("user"));
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        await attachStream(stream);
        if (cancelled) return;
        const actual = getActualFacingMode(stream);
        const known = actual !== "unknown";
        setFacingKnown(known);
        setFacingMode(known ? actual : "user");
        setCurrentDeviceId(getActiveDeviceId(stream));
        setPhase("live");
        refreshDevices(); // labels are available now that permission is granted
      } catch (err) {
        if (!cancelled) {
          setCamError(friendlyCameraError(err));
          setPhase("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      stopStream();
      if (frozenUrlRef.current) URL.revokeObjectURL(frozenUrlRef.current);
    };
  }, [attachStream, refreshDevices, stopStream]);

  // Face-detection loop while live (front camera + auto support only, ~6fps).
  useEffect(() => {
    if (phase !== "live" || !autoActive || !detectorRef.current) return;
    goodSinceRef.current = null;

    const tick = async () => {
      const video = videoRef.current;
      const stage = stageRef.current;
      if (!video || !stage || video.readyState < 2 || detectBusyRef.current) return;
      detectBusyRef.current = true;
      try {
        const faces = await detectorRef.current.detect(video);
        const box = faces?.[0]
          ? mapFaceBoxToOverlay(
              faces[0].boundingBox,
              video.videoWidth,
              video.videoHeight,
              stage.clientWidth,
              stage.clientHeight,
              isFront // preview is mirrored only on the front camera
            )
          : null;
        const result = evaluateFace(box);
        setFaceStatus(result);
        if (result.status === "good") {
          if (!goodSinceRef.current) {
            goodSinceRef.current = Date.now();
          } else if (Date.now() - goodSinceRef.current >= 1000) {
            await freeze("auto");
          }
        } else {
          goodSinceRef.current = null;
        }
      } catch {
        /* transient detector failure — skip this tick */
      } finally {
        detectBusyRef.current = false;
      }
    };

    intervalRef.current = setInterval(tick, 160);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [phase, autoActive, isFront, freeze]);

  // Esc closes; focus lands on the card for keyboard users.
  useEffect(() => {
    cardRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ovalStroke = faceStatus.status === "good" ? "var(--green)" : "#fffdfb";
  const hint =
    phase === "countdown"
      ? "Using photo…"
      : phase === "preview"
        ? "Happy with this photo?"
        : autoActive
          ? faceStatus.hint
          : "Center your face inside the oval, then tap Capture";

  return (
    <div className="lk-modal" role="dialog" aria-modal="true" aria-label="Take a photo for skin analysis">
      <div className="lk-modal-card" ref={cardRef} tabIndex={-1}>
        <div className="lk-cam-header">
          <h3 className="lk-cam-title">Take a selfie</h3>
          <button
            className="lk-cam-close"
            onClick={() => {
              stopStream();
              onCloseRef.current();
            }}
            aria-label="Close camera"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {phase === "error" ? (
          <div className="lk-cam-error" role="alert">
            <p className="lk-cam-error-text">{camError}</p>
            <button className="lk-btn-primary" onClick={() => onCloseRef.current()}>
              Upload a file instead
            </button>
          </div>
        ) : (
          <>
            <div className="lk-cam-stage" ref={stageRef}>
              <video
                ref={videoRef}
                className={`lk-cam-video${isFront ? " lk-cam-video--mirror" : ""}`}
                playsInline
                muted
                autoPlay
                aria-hidden="true"
              />
              {frozenUrl && <img src={frozenUrl} className="lk-cam-frozen" alt="Captured photo preview" />}
              {phase !== "preview" && (
                <svg className="lk-cam-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <mask id="lk-oval-mask">
                      <rect width="100" height="100" fill="white" />
                      <ellipse cx="50" cy="44" rx="27" ry="36" fill="black" />
                    </mask>
                  </defs>
                  <rect width="100" height="100" fill="rgba(46,31,36,0.6)" mask="url(#lk-oval-mask)" />
                  <ellipse
                    cx="50"
                    cy="44"
                    rx="27"
                    ry="36"
                    className="lk-cam-oval"
                    fill="none"
                    stroke={ovalStroke}
                    strokeWidth="2.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              )}
              {phase === "live" && showFlip && (
                <div className="lk-cam-tools">
                  <button
                    className="lk-cam-tool-button"
                    onClick={flipCamera}
                    disabled={switching}
                    aria-label="Switch between front and back camera"
                    title="Flip camera"
                  >
                    <SwitchCamera size={20} aria-hidden="true" />
                  </button>
                </div>
              )}
              {phase === "countdown" && (
                <div className="lk-cam-countdown" aria-live="assertive">
                  <span className="lk-cam-count-number">{Math.max(secondsLeft, 1)}</span>
                  <p>Using photo…</p>
                </div>
              )}
            </div>

            {phase === "live" && showPicker && (
              <div className="lk-cam-device-picker" role="group" aria-label="Choose a camera">
                {devices.map((device, index) => (
                  <button
                    key={device.deviceId || index}
                    className="lk-cam-device-chip"
                    aria-pressed={device.deviceId === currentDeviceId}
                    onClick={() => pickDevice(device.deviceId)}
                    disabled={switching || !device.deviceId}
                  >
                    {labelCamera(device, index)}
                  </button>
                ))}
              </div>
            )}

            <p className="lk-cam-hint" aria-live="polite">
              {hint}
            </p>

            <p className="lk-cam-status" role="status" aria-live="polite">
              {switchStatus}
            </p>

            <div className="lk-cam-controls">
              {phase === "live" && (
                <button className="lk-btn-secondary" onClick={() => freeze("manual")} disabled={switching}>
                  <Camera size={18} aria-hidden="true" /> Capture
                </button>
              )}
              {phase === "countdown" && (
                <button className="lk-btn-secondary" onClick={retake}>
                  <RefreshCw size={18} aria-hidden="true" /> Retake
                </button>
              )}
              {phase === "preview" && (
                <>
                  <button className="lk-btn-primary" onClick={finishCapture}>
                    Use photo
                  </button>
                  <button className="lk-btn-secondary" onClick={retake}>
                    <RefreshCw size={18} aria-hidden="true" /> Retake
                  </button>
                </>
              )}
              <button
                className="lk-cam-switch"
                onClick={() => {
                  stopStream();
                  onCloseRef.current();
                }}
              >
                Switch to upload
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Map a getUserMedia error to friendly, actionable copy.
 * @param {Error & {name?: string}} err
 * @returns {string}
 */
function friendlyCameraError(err) {
  switch (err?.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera access was blocked. Allow camera permission in your browser settings, or upload a file instead.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No camera was found on this device. Try uploading a file instead.";
    case "NotReadableError":
    case "AbortError":
      return "Your camera is in use by another app. Close it and try again, or upload a file instead.";
    default:
      return "Camera is not available right now. Try uploading a file instead.";
  }
}
