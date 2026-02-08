import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import path from 'path';
import fs from 'fs';

if (!getApps().length) {
  try {
    // 1. Check for Environment Variable first (For Production/Vercel)
    const envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (envKey) {
      // Robust parsing: handles both raw JSON strings and stringified JSON with escaped newlines
      const serviceAccount = JSON.parse(
        envKey.startsWith('{') ? envKey : envKey.replace(/\\n/g, '\n')
      );

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin: Initialized via Environment Variable");
    } 
    else {
      // 2. Local Fallback: Use an absolute path to the root of your project
      const keyPath = path.join(process.cwd(), 'serviceAccountKey.json');
      
      if (fs.existsSync(keyPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log(`✅ Firebase Admin: Initialized via ${keyPath}`);
      } else {
        // This is where Vercel was crashing—it couldn't find the file OR the env var.
        throw new Error("Service account not found (Env Var missing and local file not found).");
      }
    }
  } catch (error: any) {
    console.error("❌ Firebase Admin Init Error:", error.message);
    // Don't let the build crash here; the error will be caught by the route handler
  }
}

export const db = admin.firestore();