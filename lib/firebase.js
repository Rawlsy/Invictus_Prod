// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
console.log("MY API KEY IS:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

const firebaseConfig = {
  apiKey: "AIzaSyCvFmy4En7XCAsZMUHwG53gy47M3POZ9uA",
  authDomain: "invictus-d01da.firebaseapp.com",
  projectId: "invictus-d01da",
  storageBucket: "invictus-d01da.firebasestorage.app",
  messagingSenderId: "508015403416",
  appId: "1:508015403416:web:d01bc290d14e91d4864bed"
};

// Check if firebase is already running to avoid "Double-Initialization" errors
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };