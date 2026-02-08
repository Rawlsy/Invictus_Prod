import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // 1. PRODUCTION: Use Env Vars
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            }),
        });
    } 
    // 2. LOCAL DEV: Use Key File
    else {
        // Note: Using a relative path to find the Scripts folder from "invictus/lib"
        // Adjust "../Scripts" if your folder structure is different.
        const serviceAccount = require('../Scripts/serviceAccountKey.json');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log("⚠️ Loaded Firebase Admin from local key file.");
    }
  } catch (error) {
    console.error("❌ Firebase Admin Initialization Error:", error);
  }
}

// This export style ensures 'db' has the .collection() method
const db = admin.firestore();
export { db };