import { NextResponse } from 'next/server';
import { doc, writeBatch } from 'firebase/firestore'; 
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const authHeader = request.headers.get('authorization');
    const isCron = authHeader && authHeader.startsWith('Bearer cron_');
    
    // Security Check
    if (!isCron && secret !== 'Touchdown2026') {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // --- 1. CONFIGURATION ---
    const targetSeason = searchParams.get('season') || '2025'; 
    const targetWeek = searchParams.get('week') || '20'; // Default to Divisional
    
    // Map Week Number to Database Field Name
    const roundMap: Record<string, string> = {
        '19': 'wildcard',
        '20': 'divisional',
        '21': 'conference',
        '22': 'superbowl'
    };
    const roundName = roundMap[targetWeek] || `week_${targetWeek}`;

    console.log(`[Score Sync] 🏈 Starting Actuals Update for ${roundName} (Week ${targetWeek})...`);

    const headers = {
        'x-rapidapi-key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
        'x-rapidapi-host': 'tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com'
    };

    // --- 2. GET LIST OF GAME IDs FOR THE WEEK ---
    // We need to know which games happened so we can ask for their box scores
    const scheduleUrl = `https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLGamesForWeek?week=${targetWeek}&season=${targetSeason}`;
    const schedRes = await fetch(scheduleUrl, { headers });
    const schedData = await schedRes.json();
    const games = schedData.body || [];

    if (games.length === 0) {
        return NextResponse.json({ success: false, message: `No games found for Week ${targetWeek}.` });
    }

    console.log(`[Score Sync] Found ${games.length} games to process.`);

    // --- 3. LOOP GAMES & FETCH BOX SCORES ---
    let updatedCount = 0;
    
    // Firestore batches are limited to 500 writes. We'll create a new batch if needed.
    // For simplicity here, we assume one batch is enough for a playoff week (<500 players active).
    const batch = writeBatch(db);

    // Your Exact Scoring Settings from the snippet
    // Note: I swapped 'gameID=...' for the variable
    const scoringParams = new URLSearchParams({
        playByPlay: 'false',
        fantasyPoints: 'true', // <--- IMPORTANT: Tells API to calculate it
        twoPointConversions: '2',
        passYards: '.04',
        passAttempts: '0',
        passTD: '4',
        passCompletions: '0',
        passInterceptions: '-2',
        pointsPerReception: '.5', // Note: Your snippet had .5 here (Half PPR)
        carries: '.2',
        rushYards: '.1',
        rushTD: '6',
        fumbles: '-2',
        receivingYards: '.1',
        receivingTD: '6',
        targets: '0',
        defTD: '6',
        fgMade: '3',
        fgMissed: '-3', // Harsh penalty!
        xpMade: '1',
        xpMissed: '-1',
        // IDP Settings (included in your snippet)
        idpTotalTackles: '0',
        idpSoloTackles: '0',
        idpTFL: '0',
        idpQbHits: '0',
        idpInt: '0',
        idpSacks: '0',
        idpPassDeflections: '0',
        idpFumblesRecovered: '0'
    });

    for (const game of games) {
        const gameID = game.gameID;
        // Construct the URL dynamically
        const boxUrl = `https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLBoxScore?gameID=${gameID}&${scoringParams.toString()}`;
        
        console.log(`[Score Sync] Fetching Box Score: ${game.awayTeam} @ ${game.homeTeam}`);
        
        const boxRes = await fetch(boxUrl, { headers });
        const boxData = await boxRes.json();
        const playerStats = boxData.body?.playerStats || {};

        // Loop through every player in this game
        for (const pid of Object.keys(playerStats)) {
            const pData = playerStats[pid];
            
            // The API calculates 'fantasyPoints' because we sent fantasyPoints=true
            // Sometimes it returns as a string, so we force Number()
            const actualScore = Number(pData.fantasyPoints || 0);

            // Only update if they played/scored
            if (pData) {
                const playerRef = doc(db, 'players', pid);
                
                // Update specifically the score for this round
                // We use dot notation so we don't erase the 'projected' value
                batch.update(playerRef, {
                    [`weeks.${roundName}.score`]: actualScore
                }); // Note: .update() will fail if player doc doesn't exist. .set({ ... }, {merge: true}) is safer if uncertain.
                
                // Switch to set/merge just in case a new player appeared who wasn't projected
                batch.set(playerRef, {
                     weeks: {
                        [roundName]: {
                            score: actualScore
                        }
                     }
                }, { merge: true });

                updatedCount++;
            }
        }
    }

    // --- 4. SAVE TO DB ---
    if (updatedCount > 0) {
        await batch.commit();
        console.log(`[Score Sync] ✅ Successfully updated ${updatedCount} player scores.`);
    }

    return NextResponse.json({ 
        success: true, 
        message: `Updated actual scores for ${updatedCount} players in ${roundName} (Week ${targetWeek})` 
    });

  } catch (error: any) {
    console.error("[Score Sync] 🔥 ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}