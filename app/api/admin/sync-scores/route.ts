import { NextResponse } from 'next/server';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// CONFIG: Round -> Tank01 Week
const ROUND_TO_WEEK_MAP: Record<string, string> = {
  'wildcard': '19',     
  'divisional': '20',   
  'conference': '21',   
  'superbowl': '22'     
};

// CONFIG: Round -> Firebase Doc ID
const ROUND_TO_DOC_ID: Record<string, string> = {
  'wildcard': 'nfl_post_week_1',
  'divisional': 'nfl_post_week_2',
  'conference': 'nfl_post_week_3',
  'superbowl': 'nfl_post_week_4'
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const round = searchParams.get('round') || 'wildcard';
  const week = ROUND_TO_WEEK_MAP[round];
  const docId = ROUND_TO_DOC_ID[round];

  if (!week || !docId) return NextResponse.json({ error: "Invalid round" }, { status: 400 });

  console.log(`[ScoreSync] Starting for Round: ${round} (Week ${week})`);

  const headers = {
    'x-rapidapi-key': '85657f0983msh1fda8640dd67e05p1bb7bejsn3e59722b8c1e',
    'x-rapidapi-host': 'tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com'
  };

  try {
    // 1. Get Schedule to find Game IDs
    // We use getNFLGamesForWeek (or similar logic via daily endpoints if needed, but lets try the schedule endpoint)
    // Actually, Tank01 has 'getNFLGamesForWeek'
    const scheduleUrl = `https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLGamesForWeek?week=${week}&season=2025&seasonType=post`;
    
    console.log(`[ScoreSync] Fetching Schedule...`);
    const scheduleRes = await fetch(scheduleUrl, { method: 'GET', headers });
    const scheduleData = await scheduleRes.json();
    const games = scheduleData.body;

    if (!games || !Array.isArray(games) || games.length === 0) {
        throw new Error("No games found for this week. Schedule might be empty.");
    }

    console.log(`[ScoreSync] Found ${games.length} games. Fetching Box Scores...`);

    const allPlayerScores: any[] = [];

    // 2. Loop through games and get Box Scores
    for (const game of games) {
        const gameID = game.gameID;
        // console.log(`[ScoreSync] Fetching Box Score: ${gameID}`);
        
        const boxScoreUrl = `https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLBoxScore?gameID=${gameID}&fantasyPoints=true`;
        const boxRes = await fetch(boxScoreUrl, { method: 'GET', headers });
        const boxData = await boxRes.json();
        
        // Tank01 Box Score Structure typically has 'playerStats' or 'body.playerStats'
        // We look for the fantasy points in the response
        const stats = boxData.body?.playerStats || {};
        
        // Iterate through all players in the box score
        Object.values(stats).forEach((player: any) => {
             // We only care if they have fantasy points
             // Normalize the structure to save to Firebase
             allPlayerScores.push({
                 playerID: player.playerID,
                 longName: player.longName || player.espnName,
                 team: player.team,
                 fantasyPoints: player.fantasyPoints || "0" // The actual score
             });
        });
    }

    console.log(`[ScoreSync] Extracted ${allPlayerScores.length} player scores.`);

    // 3. Save to Firebase (Merge into existing doc)
    const docRef = doc(db, 'system_cache', docId);
    
    // We first get the existing doc to preserve projections
    const currentDoc = await getDoc(docRef);
    const currentData = currentDoc.exists() ? currentDoc.data() : {};

    await setDoc(docRef, {
        ...currentData, // Keep projections
        lastUpdatedScores: new Date().toISOString(),
        playerScores: allPlayerScores // NEW FIELD
    });

    console.log(`[ScoreSync] ✅ Saved scores to ${docId}`);

    return NextResponse.json({ 
        success: true, 
        message: `Synced ${allPlayerScores.length} scores to ${docId}`,
        gamesProcessed: games.length
    });

  } catch (error: any) {
    console.error("[ScoreSync] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}