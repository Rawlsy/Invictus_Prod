'use server'

import { db } from '@/lib/firebaseAdmin'; 
import { revalidatePath } from 'next/cache';
import admin from 'firebase-admin';

export async function joinLeagueAction(userId: string, joinCode: string, passwordInput?: string, userName?: string) {
  try {
    // 1. Locate league using Admin syntax
    const leaguesRef = db.collection('leagues');
    const querySnapshot = await leaguesRef.where('joinCode', '==', joinCode.toUpperCase().trim()).get();

    if (querySnapshot.empty) {
      return { success: false, message: "League not found." };
    }

    const leagueDoc = querySnapshot.docs[0];
    const leagueData = leagueDoc.data();
    const leagueId = leagueDoc.id;

    // 2. Check if user is already a member
    const memberIDs = leagueData.memberIDs || [];
    if (memberIDs.includes(userId)) {
      return { success: false, message: "Already in this league!" };
    }

    // 3. Check Pigskin-specific player limits
    if (leagueData.gameMode === 'pigskin' && leagueData.maxPlayers) {
      if ((leagueData.memberCount || 0) >= leagueData.maxPlayers) {
        return { success: false, message: "League is full!" };
      }
    }

    // 4. Validate Privacy/Password
    if (leagueData.privacy === 'Private') {
      if (!passwordInput) return { success: false, status: 'PASSWORD_REQUIRED' };
      if (passwordInput !== leagueData.password) return { success: false, message: "Incorrect password." };
    }

    // 5. Use an Atomic Batch to add the user (Standard practice for any user joining)
    const batch = db.batch();
    const leagueRef = leaguesRef.doc(leagueId);
    
    // Update main league document
    batch.update(leagueRef, {
      memberIDs: admin.firestore.FieldValue.arrayUnion(userId),
      memberCount: admin.firestore.FieldValue.increment(1)
    });

    // Create the member entry in the subcollection
    const memberRef = leagueRef.collection('Members').doc(userId);
    batch.set(memberRef, {
        username: userName || 'New Member',
        joinedAt: new Date().toISOString(),
        scores: { "Total": 0.0 }
    });

    await batch.commit();

    revalidatePath('/hub');
    return { success: true, message: "Joined successfully!" };

  } catch (error: any) {
    console.error("Join Error:", error);
    return { success: false, message: "Server error. Try again." };
  }
}