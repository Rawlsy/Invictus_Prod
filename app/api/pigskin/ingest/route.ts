import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin'; 
import { FieldValue } from 'firebase-admin/firestore';

// --- CONFIGURATION ---
const TANK01_ENDPOINT = "https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLBoxScore";
const GAME_ID = "20260208_NE@SEA"; 
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

    // SINGLE-SHOT EXECUTION: No more loops or delays.
    // The frequency is now handled by your pinger script.
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
    const url = `${TANK01_ENDPOINT}?gameID=${GAME_ID}&playByPlay=true&fantasyPoints=true&twoPointConversions=2&passYards=.04&passAttempts=0&passTD=4&passCompletions=0&passInterceptions=-2&pointsPerReception=.5&carries=.2&rushYards=.1&rushTD=6&fumbles=-2&receivingYards=.1&receivingTD=6&targets=0&defTD=6&fgMade=3&fgMissed=-3&xpMade=1&xpMissed=-1`;
    
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-host': 'tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com',
            'x-rapidapi-key': API_KEY
        }
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`Tank01 API Error: ${response.statusText}`);

        const json = await response.json();

        // --- THE LOG: See the full raw response in your terminal ---
        console.log("------------------ TANK01 RAW DATA START ------------------");
        console.dir(json, { depth: null, colors: true }); 
        console.log("------------------- TANK01 RAW DATA END -------------------");

        const gameBody = json.body;

        // If body is missing, the API might be sending an error inside the JSON
        if (!gameBody) {
            console.error("❌ Tank01 Response missing 'body' field. Full JSON above.");
            throw new Error("Invalid Data Structure: Missing 'body'");
        }

        const plays = gameBody.allPlayByPlay || [];

        // If allPlayByPlay is missing, the game status might be 'Scheduled' or 'Pre-game'
        if (!gameBody.allPlayByPlay) {
            console.warn(`⚠️ Game status is likely '${gameBody.gameStatus}'. 'allPlayByPlay' is missing.`);
        }

        const updateData = {
            gameID: gameBody.gameID || GAME_ID,
            homeScore: gameBody.homeScore || 0,
            awayScore: gameBody.awayScore || 0,
            clock: gameBody.clock || "15:00",
            period: gameBody.gamePeriod || "Q1",
            lastPlay: plays.length > 0 
                ? plays[plays.length - 1] 
                : { play: "Waiting for kickoff..." },
            allPlayByPlay: plays,
            lastUpdated: FieldValue.serverTimestamp()
        };

        await db.collection('system').doc('live_feed').set(updateData);
        console.log(`   ✅ Ingest: Processed ${plays.length} plays.`);
    } catch (err) {
        console.error("   ❌ Ingest Failed:", err);
        throw err;
    }
}