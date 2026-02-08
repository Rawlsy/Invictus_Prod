import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import path from 'path';
import fs from 'fs';

if (!getApps().length) {
  try {
    // 1. Check for Environment Variable first (For Production/Vercel)
    const envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (envKey) {
      const serviceAccount = JSON.parse(envKey.replace(/\\n/g, '\n'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin: Initialized via Environment Variable");
    } 
    else {
      // 2. Local Fallback: Use an absolute path to the root of your A: drive project
      const keyPath = path.join(process.cwd(), 'serviceAccountKey.json');
      
      if (fs.existsSync(keyPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log(`✅ Firebase Admin: Initialized via ${keyPath}`);
      } else {
        throw new Error(`Service account file not found at: ${keyPath}`);
      }
    }
  } catch (error: any) {
    console.error("❌ Firebase Admin Init Error:", error.message);
  }
}

export const db = admin.firestore();