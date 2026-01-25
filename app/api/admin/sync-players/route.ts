import { NextResponse } from 'next/server';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Force dynamic to ensure fresh data fetch
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Optional: Verify Secret if you are using Vercel Cron
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  const url = 'https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLPlayerList';
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': '85657f0983msh1fda8640dd67e05p1bb7bejsn3e59722b8c1e',
      'x-rapidapi-host': 'tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com'
    }
  };

  try {
    console.log("[Sync] Fetching player list from Tank01...");
    const response = await fetch(url, options);
    const data = await response.json();
    
    // The API usually returns the list in data.body
    const players = data.body || [];

    if (!Array.isArray(players)) {
      throw new Error("Invalid API response format");
    }

    console.log(`[Sync] Found ${players.length} players. Starting batch update...`);

    // Firestore allows max 500 writes per batch. We must chunk the array.
    const chunkSize = 500;
    const chunks = [];
    
    for (let i = 0; i < players.length; i += chunkSize) {
      chunks.push(players.slice(i, i + chunkSize));
    }

    let totalUpdated = 0;

    // Process chunks sequentially to avoid overwhelming the database connection
    for (const chunk of chunks) {
      const batch = writeBatch(db);

      chunk.forEach((player: any) => {
        // Use playerID as the document ID
        const pid = player.playerID;
        if (!pid) return;

        const playerRef = doc(db, 'players', pid);

        // We use { merge: true } so we don't overwrite existing projections/stats
        batch.set(playerRef, {
          name: player.longName || player.name,
          team: player.team || "FA", // FA = Free Agent
          position: player.pos || player.position || "N/A",
          playerID: pid,
          height: player.height || "",
          weight: player.weight || "",
          jerseyNum: player.jerseyNum || "",
          college: player.college || "",
          lastUpdated: new Date().toISOString()
        }, { merge: true });
      });

      await batch.commit();
      totalUpdated += chunk.length;
      console.log(`[Sync] Committed batch of ${chunk.length} players.`);
    }

    console.log(`[Sync] Successfully updated ${totalUpdated} players.`);
    return NextResponse.json({ success: true, count: totalUpdated });

  } catch (error: any) {
    console.error("[Sync] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}