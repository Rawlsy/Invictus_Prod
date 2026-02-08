import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin'; 
import { FieldValue } from 'firebase-admin/firestore';

// --- CONFIGURATION ---
//const TANK01_ENDPOINT = "https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLBoxScore";
const GAME_ID = "20260208_NE@SEA"; 
const API_KEY = "85657f0983msh1fda8640dd67e05p1bb7bejsn3e59722b8c1e"; 
const CRON_SECRET = "pigskin_super_bowl_2026"; 

export const maxDuration = 60; // Vercel Timeout Limit
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('secret') !== CRON_SECRET) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    console.log("⏰ Starting Ingest Loop (3x / 18s delay)...");

    // --- LOOP: 3 Times x 18 Seconds ---
    for (let i = 0; i < 3; i++) {
        await performIngest();
        
        // Wait 18s if not the last iteration
        if (i < 2) {
            await new Promise(resolve => setTimeout(resolve, 18000));
        }
    }

    return NextResponse.json({ success: true, message: "Ingest Loop Complete" });

  } catch (error: any) {
    console.error("❌ INGEST LOOP ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function performIngest() {
    console.log(`📡 [${new Date().toISOString()}] Fetching Tank01 Data...`);
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
        const gameBody = json.body;

        if (!gameBody || !gameBody.allPlayByPlay) throw new Error("Invalid Data Structure");

        const updateData = {
            gameID: gameBody.gameID,
            homeScore: gameBody.homeScore || 0,
            awayScore: gameBody.awayScore || 0,
            clock: gameBody.clock || "00:00",
            period: gameBody.gamePeriod || "PRE",
            lastPlay: gameBody.allPlayByPlay.length > 0 
                ? gameBody.allPlayByPlay[gameBody.allPlayByPlay.length - 1] 
                : { play: "Waiting for kickoff..." },
            allPlayByPlay: gameBody.allPlayByPlay,
            lastUpdated: FieldValue.serverTimestamp()
        };

        await db.collection('system').doc('live_feed').set(updateData);
        console.log(`   ✅ Saved ${gameBody.allPlayByPlay.length} plays.`);
    } catch (err) {
        console.error("   ❌ Ingest Iteration Failed:", err);
    }
}