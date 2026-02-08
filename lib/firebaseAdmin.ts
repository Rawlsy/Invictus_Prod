import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

if (!getApps().length) {
  const envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (envKey) {
    try {
      const serviceAccount = JSON.parse(envKey);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin initialized via Environment Variable.");
    } catch (error) {
      console.error("❌ FIREBASE: JSON.parse failed on FIREBASE_SERVICE_ACCOUNT_KEY.");
      // Fallback if the string is already somehow an object or weirdly formatted
      admin.initializeApp({
        credential: admin.credential.cert(envKey as any),
      });
    }
  } else {
    // If we are in production and this is missing, initialize a dummy to let the build pass
    if (process.env.NODE_ENV === 'production') {
      admin.initializeApp({
        projectId: 'invictus-sports-placeholder', 
      });
      console.warn("⚠️ FIREBASE: Missing credentials in Production. Using placeholder.");
    } else {
      console.error("❌ FIREBASE: No environment variable found.");
    }
  }
}

const db = admin.firestore();
export { db };