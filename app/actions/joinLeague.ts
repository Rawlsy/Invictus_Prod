'use server'

import { db } from '@/lib/firebaseAdmin'; 
import { revalidatePath } from 'next/cache';
import * as admin from 'firebase-admin';

export async function joinLeagueAction(userId: string, joinCode: string, passwordInput?: string, userName?: string) {
  try {
    // 1. Locate league using Admin SDK (bypasses security rules)
    const leaguesRef = db.collection('leagues');
    const querySnapshot = await leaguesRef.where('joinCode', '==', joinCode.toUpperCase().trim()).get();

    if (querySnapshot.empty) {
      return { success: false, message: "League not found." };
    }

    const leagueDoc = querySnapshot.docs[0];
    const leagueData = leagueDoc.data();
    const leagueId = leagueDoc.id;

    // 2. Member check
    const memberIDs = leagueData.memberIDs || [];
    if (memberIDs.includes(userId)) {
      return { success: false, message: "Already in this league!" };
    }

    // 3. Pigskin Max Players check
    if (leagueData.gameMode === 'pigskin' && leagueData.maxPlayers) {
        if ((leagueData.memberCount || 0) >= leagueData.maxPlayers) {
            return { success: false, message: "League is full!" };
        }
    }

    // 4. Privacy Check
    if (leagueData.privacy === 'Private') {
      if (!passwordInput) return { success: false, status: 'PASSWORD_REQUIRED' };
      if (passwordInput !== leagueData.password) return { success: false, message: "Incorrect password." };
    }

    // 5. Atomic Batch Write (Required for sub-collections in Admin SDK)
    const batch = db.batch();
    const leagueDocRef = leaguesRef.doc(leagueId);
    
    // Update main array and count
    batch.update(leagueDocRef, {
      memberIDs: admin.firestore.FieldValue.arrayUnion(userId),
      memberCount: admin.firestore.FieldValue.increment(1)
    });

    // Create member document
    const memberRef = leagueDocRef.collection('Members').doc(userId);
    batch.set(memberRef, {
        username: userName || 'New Member',
        joinedAt: new Date().toISOString(),
        scores: { "Total": 0.0 }
    });

    await batch.commit();

    revalidatePath('/hub');
    return { success: true, message: "Joined successfully!" };

  } catch (error: any) {
    console.error("Join Action Error:", error);
    return { success: false, message: "Server error. Try again." };
  }
}