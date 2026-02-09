import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin'; 
import { FieldValue } from 'firebase-admin/firestore';

// --- CONFIGURATION ---
const TANK01_ENDPOINT = "https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLBoxScore";
const GAME_ID = "20260208_SEA@NE"; 
const API_KEY = "85657f0983msh1fda8640dd67e05p1bb7bejsn3e59722b8c1e"; 
const CRON_SECRET = "pigskin_super_bowl_2026"; 

export const maxDuration = 55; 
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('secret') !== CRON_SECRET) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    console.log(`📡 [${new Date().toISOString()}] Single Ingest Triggered...`);
    
    await performIngest();

    return NextResponse.json({ 
        success: true, 
        message: "Ingest Successful",
        timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("❌ INGEST ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function performIngest() {
    // 1. FETCH DATA (With Cache Busting)
    const url = `${TANK01_ENDPOINT}?gameID=${GAME_ID}&playByPlay=true&fantasyPoints=true&twoPointConversions=2&passYards=.04&passAttempts=0&passTD=4&passCompletions=0&passInterceptions=-2&pointsPerReception=.5&carries=.2&rushYards=.1&rushTD=6&fumbles=-2&receivingYards=.1&receivingTD=6&targets=0&defTD=6&fgMade=3&fgMissed=-3&xpMade=1&xpMissed=-1`;
    
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-host': 'tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com',
            'x-rapidapi-key': API_KEY
        },
        cache: 'no-store' as RequestCache, 
        next: { revalidate: 0 }
    };

    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Tank01 API Error: ${response.statusText}`);
    
    const json = await response.json();

    // 🔍 LOCAL LOGGING for debugging
    console.log("\n👇👇👇 --- RAW TANK01 API RESPONSE START --- 👇👇👇\n");
    console.dir(json, { depth: null, colors: true }); 
    console.log("\n👆👆👆 --- RAW TANK01 API RESPONSE END --- 👆👆👆\n");

    const gameBody = json.body;
    if (!gameBody) throw new Error("Invalid Data: Missing 'body'");

    // 2. PREPARE FIRESTORE UPDATE
    const plays = gameBody.allPlayByPlay || [];
    
   // app/api/ingest/route.ts

        // ... inside performIngest ...

        console.log(`🏈 Fetched ${plays.length} plays. Updating System Feed...`);

        const updateData = {
            gameID: gameBody.gameID || GAME_ID,
            // 🚀 SURGICAL FIX: Map 'homePts' -> 'homeScore'
            // We use parseInt because the API returns strings "9", "0"
            homeScore: parseInt(gameBody.homePts || "0"), 
            awayScore: parseInt(gameBody.awayPts || "0"),
            
            // 🚀 SURGICAL FIX: Map 'gameClock' and 'currentPeriod'
            // If clock is empty (like at Halftime), show the period instead
            clock: (gameBody.gameClock && gameBody.gameClock !== "") ? gameBody.gameClock : gameBody.currentPeriod,
            period: gameBody.currentPeriod || "Q1",
            
            lastPlay: plays.length > 0 
                ? plays[plays.length - 1] 
                : { play: "Waiting for kickoff..." },
            allPlayByPlay: plays,
            lastUpdated: FieldValue.serverTimestamp()
        };

        // Update ONLY the master feed
        await db.collection('system').doc('live_feed').set(updateData);
        console.log(`✅ System Feed Updated: ${updateData.awayScore} - ${updateData.homeScore}`);
}