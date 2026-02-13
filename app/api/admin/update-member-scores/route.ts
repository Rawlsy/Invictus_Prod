import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

// Helper to normalize names for matching (removes suffixes, punctuation, case)
const normalizeName = (name: string) => {
    if (!name) return '';
    return name.toLowerCase()
        .replace(/[^a-z0-9 ]/g, '') // Remove punctuation (Smith-Njigba -> smithnjigba)
        .replace(/\b(jr|sr|ii|iii|iv)\b/g, '') // Remove suffixes
        .trim();
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('secret') !== 'Touchdown2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const log: string[] = [];
    log.push("Starting Score Update (Dynamic Name Matching)...");

    // 1. FETCH ALL PLAYERS & BUILD INDICES
    const playersSnap = await db.collection('players').get();
    
    const playerMap: Record<string, any> = {};      // Lookup by ID
    const nameMap: Record<string, any[]> = {};      // Lookup by Name (Array to handle dupes)

    playersSnap.forEach(doc => {
        const data = doc.data();
        const pid = doc.id;
        
        // Store by ID
        playerMap[pid] = { ...data, id: pid };

        // Store by Normalized Name (Index for fallback)
        if (data.name) {
            const clean = normalizeName(data.name);
            if (!nameMap[clean]) nameMap[clean] = [];
            nameMap[clean].push(playerMap[pid]);
        }
    });

    log.push(`Loaded ${Object.keys(playerMap).length} players.`);

    // 2. FETCH LEAGUES
    const leaguesSnap = await db.collection('leagues').get();
    const batch = db.batch();
    let updateCount = 0;

    for (const leagueDoc of leaguesSnap.docs) {
        const leagueData = leagueDoc.data();
        if (leagueData.gameMode === 'pigskin') continue;

        // Determine Format based on 'scoringType' (Priority) or 'scoringFormat'
        const rawType = (leagueData.scoringType || leagueData.scoringFormat || leagueData.format || '').toLowerCase();
        let formatKey = 'Standard';
        if (rawType.includes('half')) formatKey = 'Half';       
        else if (rawType.includes('ppr')) formatKey = 'PPR';

        // Fetch Members
        const membersSnap = await db.collection('leagues').doc(leagueDoc.id).collection('Members').get();
        if (membersSnap.empty) continue;

        for (const memberDoc of membersSnap.docs) {
            const memberData = memberDoc.data();
            const rawLineup = memberData['Super Bowl Lineup'] || memberData.lineup; 
            let playerIds: string[] = [];

            // Lineup Parsing
            if (rawLineup) {
                if (Array.isArray(rawLineup)) {
                    if (typeof rawLineup[0] === 'string') playerIds = rawLineup;
                    else if (rawLineup[0]?.players) playerIds = rawLineup[rawLineup.length-1].players; 
                }
                else if (Array.isArray(rawLineup.players)) playerIds = rawLineup.players;
                else if (typeof rawLineup === 'object') playerIds = Object.values(rawLineup).filter(val => typeof val === 'string') as string[];
            }

            if (!playerIds || playerIds.length === 0) continue;

            // CALCULATE TOTAL SCORE
            let totalScore = 0;
            
            playerIds.forEach(originalPid => {
                let pStats = playerMap[originalPid];
                let roundStats = null;

                // CHECK 1: Direct ID Match
                if (pStats) {
                    roundStats = pStats.Superbowl || pStats['Week 22'] || pStats.SuperBowl;
                }

                // CHECK 2: Name Fallback (The "Long Term Fix")
                // If direct match failed OR direct match has no stats for this round...
                if (!roundStats && pStats && pStats.name) {
                    const clean = normalizeName(pStats.name);
                    const candidates = nameMap[clean] || [];

                    // Find any matching player that DOES have stats
                    const bestMatch = candidates.find(c => c.Superbowl || c['Week 22'] || c.SuperBowl);
                    
                    if (bestMatch) {
                        // console.log(`[Healed] Found stats for ${pStats.name} via alias ID: ${bestMatch.id}`);
                        roundStats = bestMatch.Superbowl || bestMatch['Week 22'] || bestMatch.SuperBowl;
                    }
                }

                // ADD POINTS
                if (roundStats) {
                    const score = roundStats[formatKey] || 0;
                    totalScore += score;
                }
            });

            totalScore = Math.round(totalScore * 100) / 100;

            // UPDATE DB
            const memberRef = db.collection('leagues').doc(leagueDoc.id).collection('Members').doc(memberDoc.id);
            batch.update(memberRef, {
                [`scores.Superbowl`]: totalScore,
                [`scores.Week22`]: totalScore,
                [`scores.Total`]: totalScore
            });
            updateCount++;
        }
    }

    if (updateCount > 0) {
        await batch.commit();
    }

    log.push(`✅ Updated scores for ${updateCount} members.`);

    return NextResponse.json({ success: true, updated: updateCount, logs: log });

  } catch (error: any) {
    console.error("[Update-Scores] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}