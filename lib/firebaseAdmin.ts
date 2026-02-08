import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

if (!getApps().length) {
  const envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (envKey) {
    try {
      // If it's a stringified JSON (common in Vercel), parse it
      const serviceAccount = JSON.parse(envKey);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin initialized via Environment Variable.");
    } catch (error) {
      console.error("❌ FIREBASE: JSON.parse failed on FIREBASE_SERVICE_ACCOUNT_KEY.");
      // Fallback: If it's already an object or has weird formatting
      admin.initializeApp({
        credential: admin.credential.cert(envKey as any),
      });
    }
  } else {
    // LOCAL FALLBACK
    try {
      const serviceAccount = require('../Scripts/serviceAccountKey.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin initialized via Local File.");
    } catch (err) {
      console.error("❌ FIREBASE: No environment variable found and no local file.");
      
      // CRITICAL: Dummy init to prevent the "default credentials" crash during Vercel build
      if (process.env.NODE_ENV === 'production') {
        admin.initializeApp({
          projectId: 'invictus-sports-placeholder', // Replace with your actual project ID string if known
        });
      }
    }
  }
}

const db = admin.firestore();
export { db };