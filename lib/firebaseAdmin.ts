import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import path from 'path';
import fs from 'fs';

if (!getApps().length) {
  try {
    const envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (envKey) {
      const serviceAccount = JSON.parse(
        envKey.startsWith('{') ? envKey : envKey.replace(/\\n/g, '\n')
      );

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin: Initialized via Environment Variable");
    } 
    else {
      const keyPath = path.join(process.cwd(), 'serviceAccountKey.json');
      
      if (fs.existsSync(keyPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log(`✅ Firebase Admin: Initialized via ${keyPath}`);
      } else {
        // ⚠️ FIXED: Changed 'throw' to 'console.warn'
        // This prevents Vercel from crashing during the build process.
        console.warn("⚠️ Firebase Admin: Service account not found. Build will continue, but Firebase features will require the ENV KEY at runtime.");
      }
    }
  } catch (error: any) {
    // ⚠️ FIXED: Added another safeguard here
    console.error("❌ Firebase Admin Init Error:", error.message);
  }
}

export const db = admin.firestore();