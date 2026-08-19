import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";

/**
 * Session-only auth persistence: the signed-in user lives in sessionStorage,
 * so closing the browser (or the tab session ending) logs the user out and
 * they are asked for credentials on the next visit. Without this, Firebase
 * defaults to browserLocalPersistence and silently restores the first
 * account ever used on that browser — forever.
 *
 * Applied before every sign-in path so the stored credential always lands
 * in sessionStorage regardless of which flow the user picks.
 */
async function withSessionPersistence(signIn) {
  await setPersistence(auth, browserSessionPersistence);
  return signIn();
}

export const signUp = (email, password) =>
  withSessionPersistence(() => createUserWithEmailAndPassword(auth, email, password));

export const logIn = (email, password) =>
  withSessionPersistence(() => signInWithEmailAndPassword(auth, email, password));

export const logOut = () => signOut(auth);

export const signInWithGoogle = () =>
  withSessionPersistence(() => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  });
