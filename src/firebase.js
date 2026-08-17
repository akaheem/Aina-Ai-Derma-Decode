import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDaFn9lhsb7yVibxxKI9Bd-ic9DSTgJAYU",
  authDomain: "aina-ai-derma-decode.firebaseapp.com",
  projectId: "aina-ai-derma-decode",
  storageBucket: "aina-ai-derma-decode.firebasestorage.app",
  messagingSenderId: "650627814048",
  appId: "1:650627814048:web:1a905c489986b2efa92fc5",
  measurementId: "G-24T3JF8B05",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Local development: run the Cloud Functions in the Firebase emulator.
//
// Only the Functions emulator is wired here. Auth, Firestore and Storage stay
// on the real (cloud) Firebase project because the Auth/Firestore/Storage
// emulators require Java, which isn't installed on this machine. This is safe:
//   - Auth: the emulated function verifies the real cloud ID token.
//   - Firestore/Storage: the function skips Firestore (YOUCAM_SKIP_FIRESTORE)
//     and takes the image as base64, so neither service is touched locally.
//
// Point the browser at the deployed functions instead by setting
// VITE_USE_EMULATOR=false (or running on any non-localhost host).
const useEmulator =
  typeof window !== "undefined" &&
  window.location.hostname === "localhost" &&
  import.meta.env?.VITE_USE_EMULATOR !== "false";

if (useEmulator && !globalThis.__AINAAI_FUNCTIONS_EMULATOR__) {
  try {
    connectFunctionsEmulator(functions, "localhost", 5001);
    globalThis.__AINAAI_FUNCTIONS_EMULATOR__ = true;
    // eslint-disable-next-line no-console
    console.info("[firebase] Using Functions emulator at localhost:5001");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[firebase] Could not connect Functions emulator:", err?.message);
  }
}

export default app;
