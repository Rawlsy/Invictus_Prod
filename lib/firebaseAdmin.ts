import * as admin from 'firebase-admin';

// Check if Firebase is already initialized to prevent multiple instances
if (!admin.apps.length) {
  
  // OPTION 1: Production (Vercel) - Uses Environment Variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.error('❌ FIREBASE INIT ERROR: Could not parse FIREBASE_SERVICE_ACCOUNT_KEY env var.', error);
    }
  } 
  
  // OPTION 2: Local Development - Uses local file (Dynamic Import to avoid Vercel Build Errors)
  else {
    try {
      // We use a variable for the path so Vercel's bundler ignores this line during build
      const localKeyPath = '../Scripts/serviceAccountKey.json'; 
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const serviceAccount = require(localKeyPath);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin initialized via local file.");
    } catch (error) {
      // In production, this error is expected if the Env Var is missing, but we log it to be sure.
      console.error('❌ FIREBASE INIT ERROR: No Env Var found, and local file missing.');
    }
  }
}

// Export the database instance
const db = admin.firestore();
export { db };