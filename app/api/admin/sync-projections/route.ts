import { NextResponse } from 'next/server';
import { doc, setDoc, deleteDoc } from 'firebase/firestore'; 
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic'; // Ensure this never caches

// CONFIG
const ROUND_TO_DOC_ID: Record<string, string> = {
  'wildcard': 'nfl_post_week_1',
  'divisional': 'nfl_post_week_2',
  'conference': 'nfl_post_week_3',
  'superbowl': 'nfl_post_week_4'
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const round = searchParams.get('round') || 'wildcard';
  
  // FIX: Define docId BEFORE using it in logs
  const docId = ROUND_TO_DOC_ID[round];

  // --- DEBUG OVERRIDE ---
  const DEBUG_WEEK = '18'; 
  const SEASON = '2025'; 

  console.log(`[Sync] 🚀 STARTING NUCLEAR SYNC`);
  console.log(`[Sync] Target Document: system_cache/${docId}`);
  console.log(`[Sync] API Target: Week ${DEBUG_WEEK}, Season ${SEASON}`);

  try {
    // 1. DELETE EXISTING DATA
    const docRef = doc(db, 'system_cache', docId);
    await deleteDoc(docRef);
    console.log(`[Sync] 🗑️ Deleted old document: ${docId}`);

    // 2. FETCH REAL API DATA
    const url = `https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLProjections?week=${DEBUG_WEEK}&season=${SEASON}&itemFormat=list`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': '85657f0983msh1fda8640dd67e05p1bb7bejsn3e59722b8c1e', 
        'x-rapidapi-host': 'tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com'
      }
    });

    const data = await response.json();
    let cleanProjections = data.body?.playerProjections || data.body || [];

    if (!Array.isArray(cleanProjections) || cleanProjections.length === 0) {
       console.error(`[Sync] ❌ API returned 0 players. Response:`, JSON.stringify(data).substring(0, 100));
       return NextResponse.json({ success: false, message: "API returned 0 players. Check Season/Week param." });
    }

    console.log(`[Sync] ✅ API Success. Fetched ${cleanProjections.length} players.`);

    // 3. SAVE NEW DATA
    await setDoc(docRef, {
        lastUpdated: new Date().toISOString(),
        sourceRound: round,
        sourceWeek: DEBUG_WEEK,
        playerProjections: cleanProjections 
    });

    console.log(`[Sync] 💾 Saved fresh data to Firestore.`);
    
    return NextResponse.json({ 
        success: true, 
        message: `Overwrote ${docId} with ${cleanProjections.length} players from Week ${DEBUG_WEEK}`,
        count: cleanProjections.length
    });

  } catch (error: any) {
    console.error("[Sync] 🔥 CRITICAL ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}