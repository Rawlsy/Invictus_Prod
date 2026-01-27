'use server'

import { db } from '@/lib/firebase'; 
import { doc, setDoc, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export async function joinLeagueAction(userId: string, joinCode: string, passwordInput?: string, userName?: string) {
  try {
    // 1. Find the league by Join Code
    const leaguesRef = collection(db, 'leagues');
    // Ensure code is uppercase to match input
    const q = query(leaguesRef, where('joinCode', '==', joinCode.toUpperCase().trim()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: "League not found. Check the code." };
    }

    const leagueDoc = querySnapshot.docs[0];
    const leagueData = leagueDoc.data();
    const leagueId = leagueDoc.id;

    // 2. Check if user is already in it
    // We check both the array and the subcollection just to be safe, but checking the array is faster
    const memberIDs = leagueData.memberIDs || [];
    if (memberIDs.includes(userId)) {
      return { success: false, message: "You are already in this league!" };
    }

    // 3. Check Privacy & Password
    if (leagueData.privacy === 'Private') {
      // If we haven't sent a password yet, ask for one
      if (!passwordInput) {
        return { success: false, status: 'PASSWORD_REQUIRED' };
      }
      // If password was sent, check it
      if (passwordInput !== leagueData.password) {
        return { success: false, message: "Incorrect password." };
      }
    }

    // 4. Add User to League Document (memberIDs Array)
    await updateDoc(doc(db, 'leagues', leagueId), {
      memberIDs: arrayUnion(userId),
      memberCount: (leagueData.memberCount || 0) + 1
    });

    // 5. Add User to 'Members' Subcollection (Required for your app structure)
    await setDoc(doc(db, 'leagues', leagueId, 'Members', userId), {
        username: userName || 'New Member',
        joinedAt: new Date().toISOString(),
        scores: { "Total": 0.0 }
    });

    // 6. Refresh the page so the new league shows up
    revalidatePath('/hub');
    return { success: true, message: "Joined successfully!" };

  } catch (error) {
    console.error("Join Error:", error);
    return { success: false, message: "Something went wrong." };
  }
}