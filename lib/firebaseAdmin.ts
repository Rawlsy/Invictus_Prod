import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import path from 'path';
import fs from 'fs';

if (!getApps().length) {
  try {
    const envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (envKey) {
      const serviceAccount = JSON.parse(envKey.startsWith('{') ? envKey : envKey.replace(/\\n/g, '\n'));
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } else {
      const keyPath = path.join(process.cwd(), 'serviceAccountKey.json');
      if (fs.existsSync(keyPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      } else {
        console.warn("⚠️ Firebase Admin: No credentials. Skipping init for build.");
      }
    }
  } catch (e) {
    console.error("❌ Firebase Init Error:", e);
  }
}

// 🛡️ This part prevents the "The default Firebase app does not exist" error during build
export const db = getApps().length > 0 
  ? admin.firestore() 
  : ({ collection: () => ({ doc: () => ({ onSnapshot: () => {} }) }) } as any); 

export { admin };