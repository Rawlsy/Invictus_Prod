import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

if (!getApps().length) {
  try {
    // 1. Production (Vercel) Logic
    if (process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Corrects newline formatting for Vercel
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } 
    // 2. Localhost Logic
    else {
      // Corrected path: sits one level up from /lib
      const serviceAccount = require('../serviceAccountKey.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  } catch (e) {
    console.error("❌ Firebase Init Error:", e);
  }
}

// 🛡️ The 'Mock' safety net - if this exports, queries will return 'empty' (League Not Found)
export const db = getApps().length > 0 
  ? admin.firestore() 
  : ({ 
      collection: () => ({ 
        where: () => ({ get: () => Promise.resolve({ empty: true, docs: [] }) }),
        doc: () => ({ 
          get: () => Promise.resolve({ exists: false }),
          set: () => Promise.resolve(),
          collection: () => ({ doc: () => ({ set: () => Promise.resolve() }) })
        })
      }),
      batch: () => ({ update: () => {}, set: () => {}, commit: () => Promise.resolve() })
    } as any);

export { admin };