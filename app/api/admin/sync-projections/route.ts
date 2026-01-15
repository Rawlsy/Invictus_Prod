import { NextResponse } from 'next/server';
import { doc, setDoc } from 'firebase/firestore'; 
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // --- 0. SECURITY CHECK ---
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Allow if it's Vercel Cron OR if you manually provided the secret key
    const isCron = authHeader && authHeader.startsWith('Bearer cron_');
    const isAdmin = secret === 'Touchdown2026'; 

    if (!isCron && !isAdmin) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // --- 1. GET CURRENT NFL CONTEXT ---
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    // Override params for testing
    const overrideWeek = searchParams.get('week');
    const overrideSeason = searchParams.get('season');

    let currentWeek = overrideWeek;
    let currentSeason = overrideSeason;
    let seasonType = 'reg'; 

    // If no override, ask the API what time it is
    if (!currentWeek || !currentSeason) {
        const infoUrl = `https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLCurrentInfo?date=${today}`;
        const infoResponse = await fetch(infoUrl, {
          method: 'GET',
          headers: {
            'x-rapidapi-key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
            'x-rapidapi-host': 'tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com'
          }
        });
        const infoData = await infoResponse.json();
        const currentInfo = infoData.body;
        
        if (currentInfo) {
            currentWeek = currentInfo.week;
            currentSeason = currentInfo.season;
            seasonType = currentInfo.seasonType;
        }
    }

    // Fallbacks
    if (!currentWeek) currentWeek = '1';
    if (!currentSeason) currentSeason = '2025';

    console.log(`[Sync] ⏱️ Target: Week ${currentWeek}, Season ${currentSeason}`);

    // --- 2. DETERMINE DATABASE DESTINATION ---
    let docId = '';
    if (seasonType === 'post' || parseInt(currentWeek) > 18) {
        // Playoff Logic: Week 19 -> 1, 20 -> 2, etc.
        const playoffIndex = Math.max(1, parseInt(currentWeek) - 18); 
        docId = `nfl_post_week_${playoffIndex}`;
    } else {
        // Regular Season
        docId = `nfl_reg_week_${currentWeek}`;
    }

    console.log(`[Sync] 🎯 Saving to ${docId}`);

    // --- 3. FETCH PROJECTIONS WITH YOUR CUSTOM SCORING ---
    // These match the snippet you provided exactly
    const scoringParams = [
      'itemFormat=list',
      'twoPointConversions=2',
      'passYards=.04',
      'passAttempts=-.5',
      'passTD=4',
      'passCompletions=1',
      'passInterceptions=-2',
      'pointsPerReception=1',
      'carries=.2',
      'rushYards=.1',
      'rushTD=6',
      'fumbles=-2',
      'receivingYards=.1',
      'receivingTD=6',
      'targets=.1',
      'fgMade=3',
      'fgMissed=-1',
      'xpMade=1',
      'xpMissed=-1'
    ].join('&');
    
    // Note: We use 'season' for flexibility, but your snippet used 'archiveSeason'. 
    // Usually 'season' works for both current and past in Tank01.
    const projUrl = `https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLProjections?week=${currentWeek}&season=${currentSeason}&${scoringParams}`;
    
    console.log(`[Sync] 🔗 Fetching URL: ${projUrl}`);

    const projResponse = await fetch(projUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '', 
        'x-rapidapi-host': 'tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com'
      }
    });

    const data = await projResponse.json();
    const body = data.body || {};

    // --- 4. PROCESS PLAYERS & DEFENSES ---
    let combinedList: any[] = [];

    // A. Process Individual Players (QB, RB, WR, TE, K)
    if (Array.isArray(body.playerProjections)) {
        combinedList = [...body.playerProjections];
    }

    // B. Process Defenses (DST)
    // We map them to look like "Players" so the frontend handles them easily
    if (Array.isArray(body.teamDefenseProjections)) {
        const defenses = body.teamDefenseProjections.map((def: any) => ({
            playerID: `DEF_${def.teamAbv}`, // Create a unique ID
            longName: `${def.teamAbv} Defense`, // e.g. "NE Defense"
            team: def.teamAbv,
            pos: 'DEF', // Normalized position name
            fantasyPoints: def.fantasyPointsDefault || def.fantasyPoints || 0,
            // Carry over raw stats if needed
            sacks: def.sacks,
            interceptions: def.interceptions,
            defTD: def.defTD
        }));
        
        console.log(`[Sync] 🛡️ Found ${defenses.length} Defenses`);
        combinedList = [...combinedList, ...defenses];
    }

    if (combinedList.length === 0) {
       console.warn(`[Sync] ⚠️ Warning: API returned 0 players/defenses.`);
       return NextResponse.json({ success: true, message: `Week ${currentWeek} has 0 projections.` });
    }

    // --- 5. SAVE TO FIREBASE ---
    const docRef = doc(db, 'system_cache', docId);
    await setDoc(docRef, {
        lastUpdated: new Date().toISOString(),
        payload: {
            players: combinedList // Now contains Players AND Defenses
        },
        meta: {
            season: currentSeason,
            week: currentWeek,
            type: seasonType
        }
    });

    return NextResponse.json({ 
        success: true, 
        message: `Synced ${combinedList.length} items (Players + Defenses) to ${docId}`,
    });

  } catch (error: any) {
    console.error(`[Sync] 🔥 ERROR:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}