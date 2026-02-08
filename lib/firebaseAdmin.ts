import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

if (!getApps().length) {
  try {
    // 1. PRODUCTION (Vercel) - Uses Environment Variables
    if (process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Fixed formatting to handle Vercel's private key requirements
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } 
    // 2. LOCALHOST ONLY - Uses the JSON file
    else if (process.env.NODE_ENV === 'development') {
      const serviceAccount = require('../serviceAccountKey.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  } catch (e) {
    console.error("❌ Firebase Admin Initialization Error:", e);
  }
}

// 🛡️ MOCK DB: Keeps the build from crashing if variables aren't loaded yet
export const db = getApps().length > 0 
  ? admin.firestore() 
  : ({ 
      collection: () => ({ 
        where: () => ({ get: () => Promise.resolve({ empty: true, docs: [] }) }),
        doc: () => ({ collection: () => ({ doc: () => ({ set: () => Promise.resolve() }) }) })
      }),
      batch: () => ({ update: () => {}, set: () => {}, commit: () => Promise.resolve() })
    } as any);

export { admin };