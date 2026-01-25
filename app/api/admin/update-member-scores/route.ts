import { NextResponse } from 'next/server';
import { collection, getDocs, doc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

const ROUND_TO_DB_MAP: Record<string, string> = {
  "Wild Card Lineup": "WildCard",
  "Divisional Lineup": "Divisional",
  "Conference Lineup": "Conference",
  "Super Bowl Lineup": "Superbowl"
};

const SCORING_KEYS: Record<string, string> = {
    "PPR": "PPR",
    "Half-PPR": "Half",
    "Standard": "Standard"
};

export async function GET(request: Request) {
  const logs: string[] = []; // Log collector
  
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const specificLeagueId = searchParams.get('leagueId');

    if (secret !== 'Touchdown2026') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    logs.push("Starting Update Process...");

    // 1. Get Leagues
    let leaguesToCheck = [];
    if (specificLeagueId) {
        const leagueDoc = await getDoc(doc(db, 'leagues', specificLeagueId));
        if (leagueDoc.exists()) {
            leaguesToCheck.push({ id: leagueDoc.id, ...leagueDoc.data() });
            logs.push(`Found specific league: ${leagueDoc.id}`);
        } else {
            logs.push(`League ID ${specificLeagueId} not found.`);
        }
    } else {
        const leaguesSnap = await getDocs(collection(db, 'leagues'));
        leaguesToCheck = leaguesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        logs.push(`Found ${leaguesToCheck.length} leagues total.`);
    }

    const batch = writeBatch(db);
    let updateCount = 0;

    // 2. Iterate Leagues
    for (const league of leaguesToCheck) {
        const leagueId = league.id;
        // @ts-ignore
        let scoringType = league.scoringType || league.settings?.scoringType || "PPR";
        if (scoringType === "Half PPR") scoringType = "Half-PPR";
        
        const scoreKey = SCORING_KEYS[scoringType] || "PPR";
        logs.push(`Processing League ${leagueId} (Format: ${scoringType} -> Key: ${scoreKey})`);

        // 3. Fetch Members
        const membersRef = collection(db, 'leagues', leagueId, 'Members');
        const membersSnap = await getDocs(membersRef);
        logs.push(`-> Found ${membersSnap.size} members.`);

        if (membersSnap.empty) continue;

        // 4. Gather Player IDs
        const allPlayerIds = new Set<string>();
        const memberDataMap: any[] = [];

        membersSnap.docs.forEach(docSnap => {
            const data = docSnap.data();
            memberDataMap.push({ id: docSnap.id, ref: docSnap.ref, data });
            
            // Log the keys found in the first member to debug structure
            if (memberDataMap.length === 1) {
                logs.push(`-> Sample Member Keys: ${Object.keys(data).join(', ')}`);
            }

            Object.keys(ROUND_TO_DB_MAP).forEach(roundKey => {
                if (data[roundKey]) {
                    const lineupSize = Object.keys(data[roundKey]).length;
                    if (lineupSize > 0) {
                        // logs.push(`--> Found ${lineupSize} players in ${roundKey} for ${docSnap.id}`);
                        Object.values(data[roundKey]).forEach((pid: any) => {
                            if (typeof pid === 'string' && pid) allPlayerIds.add(pid);
                        });
                    }
                }
            });
        });

        logs.push(`-> Unique Players collected from all lineups: ${allPlayerIds.size}`);

        if (allPlayerIds.size === 0) {
            logs.push(`-> No players found in any lineup. Skipping calculation.`);
            continue;
        }

        // 5. Fetch Player Stats (Optimized: Fetch entire players collection for simplicity if < 500 docs, else chunk)
        // Since we likely have < 500 active players, fetching all is safer/easier than chunking 'in' queries.
        const playersRef = collection(db, 'players');
        const playersSnap = await getDocs(playersRef); 
        const playersMap: Record<string, any> = {};
        playersSnap.docs.forEach(p => { playersMap[p.id] = p.data(); });
        
        logs.push(`-> Loaded ${playersSnap.size} player stats records from DB.`);

        // 6. Calculate Scores
        for (const member of memberDataMap) {
            const scores: Record<string, number> = { Total: 0 };
            
            Object.entries(ROUND_TO_DB_MAP).forEach(([lineupKey, statKey]) => {
                const lineup = member.data[lineupKey] || {};
                let roundTotal = 0;

                Object.values(lineup).forEach((pid: any) => {
                    if (typeof pid === 'string' && playersMap[pid]) {
                        const pData = playersMap[pid];
                        // Access nested round stats: e.g. player['WildCard']['PPR']
                        const roundStats = pData[statKey]; 
                        if (roundStats) {
                            const points = Number(roundStats[scoreKey] || 0);
                            roundTotal += points;
                        }
                    }
                });

                scores[statKey] = Number(roundTotal.toFixed(2));
                scores.Total += roundTotal;
            });

            scores.Total = Number(scores.Total.toFixed(2));

            // Queue Update
            batch.update(member.ref, { scores });
            updateCount++;
        }
    }

    if (updateCount > 0) {
        await batch.commit();
        logs.push(`Committed updates for ${updateCount} members.`);
    } else {
        logs.push("No updates committed.");
    }

    return NextResponse.json({ 
        success: true, 
        updatedMembers: updateCount, 
        logs: logs 
    });

  } catch (error: any) {
    console.error("Error updating member scores:", error);
    return NextResponse.json({ error: error.message, logs }, { status: 500 });
  }
}