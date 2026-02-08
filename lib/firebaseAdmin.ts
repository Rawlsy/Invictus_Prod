import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  // 1. Check for Environment Variable (Production / Vercel)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.error('Firebase Admin Init Error: Invalid JSON in FIREBASE_SERVICE_ACCOUNT_KEY env var.');
    }
  } 
  // 2. Fallback for Local Development
  else {
    try {
      // Attempt to load the local file. If it fails, that's okay in production (env var takes precedence).
      // Note: Vercel will ignore this require if the file isn't there, or throw runtime error if env var is missing.
      const serviceAccount = require('../Scripts/serviceAccountKey.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.error('Firebase Admin Init Error: Missing FIREBASE_SERVICE_ACCOUNT_KEY env var or local json file.');
    }
  }
}

const db = admin.firestore();
export { db };