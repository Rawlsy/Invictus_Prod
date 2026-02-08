import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import fs from 'fs';
import path from 'path';

// Prevent initializing the app multiple times (Next.js hot reload issue)
if (!getApps().length) {
    let serviceAccount: any = null;

    // OPTION 1: Vercel / Production (Environment Variable)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        } catch (error) {
            console.error('❌ FIREBASE: Could not parse environment variable.');
        }
    } 
    // OPTION 2: Local Development (Read File System)
    else {
        try {
            // We use path.join and process.cwd() to construct the path at RUNTIME.
            // This prevents Vercel's bundler from trying to include the file at BUILD time.
            
            // Try different common locations for the key
            const possiblePaths = [
                path.join(process.cwd(), 'app', 'serviceAccountKey.json'),
                path.join(process.cwd(), 'Scripts', 'serviceAccountKey.json'),
                path.join(process.cwd(), 'serviceAccountKey.json')
            ];

            for (const filePath of possiblePaths) {
                if (fs.existsSync(filePath)) {
                    const fileContent = fs.readFileSync(filePath, 'utf8');
                    serviceAccount = JSON.parse(fileContent);
                    console.log(`✅ FIREBASE: Loaded local key from ${filePath}`);
                    break;
                }
            }
        } catch (error) {
            console.warn('⚠️ FIREBASE: Failed to load local service account file.');
        }
    }

    // INITIALIZE APP
    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } else {
        // Fallback for Build Time (Prevents Vercel build crash)
        // If we are just building the app, we don't need real credentials yet.
        console.warn('⚠️ FIREBASE: No credentials found. Initializing mock app for build.');
        if (process.env.NODE_ENV === 'production') {
             // Safe dummy init just to let "npm run build" finish
             admin.initializeApp({ projectId: 'build-placeholder' }); 
        }
    }
}

const db = admin.firestore();
export { db };