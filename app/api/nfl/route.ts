import { NextResponse } from 'next/server';
import { getNFLPlayers } from '@/lib/nfl-api';

export const dynamic = 'force-dynamic'; // <--- Forces Next.js to not cache this route

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const round = searchParams.get('round') || 'wildcard';

  console.log(`\n\n🔥 FORCE DEBUG: API Route Hit for Round: ${round}`);

  try {
    // Call the library function
    const players = await getNFLPlayers(round);

    // LOG PROJECTION SAMPLE
    // FIX: Added "(p: any)" to fix Build Error
    // FIX: Checking 'fantasyPoints' OR 'projection' to match your data structure
    const samplePlayer = players.find((p: any) => (p.fantasyPoints || p.projection) > 0);
    
    if (samplePlayer) {
        // @ts-ignore
        const pts = samplePlayer.fantasyPoints || samplePlayer.projection;
        // @ts-ignore
        const name = samplePlayer.longName || samplePlayer.name;
        console.log(`✅ SUCCESS: Found player with projection > 0: ${name} (${pts})`);
    } else {
        console.log(`❌ FAILURE: All ${players.length} players have 0 projection.`);
    }

    // Mock Games Data (Required for frontend not to crash)
    const games = [
      { id: '1', home: 'BUF', away: 'MIA', date: '20260111', time: '1:00 PM' },
      { id: '2', home: 'CIN', away: 'CLE', date: '20260111', time: '4:30 PM' },
      { id: '3', home: 'HOU', away: 'IND', date: '20260111', time: '8:15 PM' },
      { id: '4', home: 'JAX', away: 'TEN', date: '20260112', time: '1:00 PM' },
    ];

    return NextResponse.json({ players, games });
     
  } catch (error) {
    console.error("🔥 API ROUTE CRASHED:", error);
    return NextResponse.json({ players: [], games: [] }, { status: 500 });
  }
}