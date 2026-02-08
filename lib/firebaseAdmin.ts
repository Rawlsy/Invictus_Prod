import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

if (!getApps().length) {
  try {
    // 1. Prioritize individual environment variables for Vercel stability
    if (process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } 
    // 2. Fallback to local file for localhost
    else {
// Change ../../ to ../
      const serviceAccount = require('../serviceAccountKey.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  } catch (e) {
    console.error("❌ Firebase Init Error:", e);
  }
}

export const db = getApps().length > 0 
  ? admin.firestore() 
  : ({ 
      collection: () => ({ 
        doc: () => ({ 
          get: () => Promise.resolve({ exists: false }),
          set: () => Promise.resolve(),
          update: () => Promise.resolve(),
          collection: () => ({ doc: () => ({ set: () => Promise.resolve() }) })
        }),
        where: () => ({ get: () => Promise.resolve({ empty: true }) })
      }),
      batch: () => ({ update: () => {}, set: () => {}, commit: () => Promise.resolve() })
    } as any);

export { admin };