// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your configuration
const firebaseConfig = {
  apiKey: "AIzaSyCvFmy4En7XCAsZMUHwG53gy47M3POZ9uA",
  authDomain: "invictus-d01da.firebaseapp.com",
  projectId: "invictus-d01da",
  storageBucket: "invictus-d01da.firebasestorage.app",
  messagingSenderId: "508015403416",
  appId: "1:508015403416:web:d01bc290d14e91d4864bed"
};

// Initialize Firebase (Singleton pattern to prevent re-initialization errors)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };