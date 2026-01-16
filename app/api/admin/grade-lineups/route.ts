import { NextResponse } from 'next/server';
import { collection, getDocs, doc, writeBatch, getDoc } from 'firebase/firestore'; 
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    if (secret !== 'Touchdown2026') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const round = searchParams.get('round') || 'wildcard'; // e.g., 'wildcard'
    console.log(`[Grading] 🎓 Grading lineups for round: ${round}`);

    // 1. Get All Leagues
    const leaguesSnap = await getDocs(collection(db, 'leagues'));
    let updatedCount = 0;
    const batch = writeBatch(db);

    // 2. Loop Leagues
    for (const leagueDoc of leaguesSnap.docs) {
        // Get Lineups for this round
        const lineupsSnap = await getDocs(collection(db, 'leagues', leagueDoc.id, 'lineups'));
        
        for (const lineupDoc of lineupsSnap.docs) {
            const lineupData = lineupDoc.data();
            
            // Only grade lineups for the target round
            if (lineupData.round !== round) continue;

            const roster = lineupData.roster || {};
            let rosterChanged = false;

            // 3. Update Each Player in Roster
            for (const [slotId, player] of Object.entries(roster)) {
                if (!player) continue;
                // @ts-ignore
                const pid = player.id;
                
                // Fetch REAL score from Master Player DB
                const playerRef = doc(db, 'players', pid);
                const playerSnap = await getDoc(playerRef);

                if (playerSnap.exists()) {
                    const masterData = playerSnap.data();
                    // Get score from weeks.wildcard.score
                    const roundData = masterData.weeks?.[round];
                    
                    if (roundData) {
                        const realScore = roundData.score || 0;
                        const realProj = roundData.projected || 0;

                        // Update the roster object
                        // @ts-ignore
                        roster[slotId].actualScore = realScore;
                        // @ts-ignore
                        roster[slotId].projection = realProj;
                        
                        rosterChanged = true;
                    }
                }
            }

            if (rosterChanged) {
                batch.update(lineupDoc.ref, { roster: roster });
                updatedCount++;
            }
        }
    }

    if (updatedCount > 0) {
        await batch.commit();
    }

    return NextResponse.json({ success: true, message: `Graded ${updatedCount} lineups for ${round}` });

  } catch (error: any) {
    console.error("[Grading] 🔥 ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}