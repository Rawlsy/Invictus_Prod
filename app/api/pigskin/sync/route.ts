import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin'; 
import { FieldValue } from 'firebase-admin/firestore';

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

// --- 1. ROSTER CONFIGURATION ---
const TIERS: Record<number, string[]> = {
    // TIER 1: Stars
    1: ['4431452', '4569173', '4567048', '4431566'], // Maye, Stevenson, Walker, JSN
    // TIER 2: Starters
    2: ['2976212', '3046439', '5000001', '2977187', '4426514'], // Diggs, Henry, Henderson, Kupp, Holani
    // TIER 3: Role Players & Special Teams
    3: [
        '4241478', // Gibson
        '4431526', // Boutte
        '3052876', // Hollins
        '3931390', // Slye (K)
        '4431611', // Barner (ID 1)
        '4576297', // Barner (ID 2 - API Variation)
        '2473037', // Myers (K)
        '3912547', // Darnold
        '4684940'  // Shaheed
    ] 
};

// --- 2. NAME FALLBACK MAP ---
const ID_TO_NAME: Record<string, string> = {
    '4431452': 'Maye',
    '4569173': 'Stevenson',
    '2976212': 'Diggs',
    '3046439': 'Henry',
    '5000001': 'Henderson',
    '4241478': 'Gibson',
    '4431526': 'Boutte',
    '3052876': 'Hollins',
    '4567048': 'Walker',
    '4431566': 'Smith-Njigba', 
    '2977187': 'Kupp',
    '3912547': 'Darnold',
    '4426514': 'Holani',
    '4431611': 'Barner',
    '4576297': 'Barner',
    '4684940': 'Shaheed'
};

export async function GET() {
  try {
    console.log("🔄 Sync Triggered...");
    await performSync();
    return NextResponse.json({ success: true, message: "Sync complete" });
  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function performSync() {
    const [feedDoc, injuriesDoc, leaguesSnap] = await Promise.all([
        db.collection('system').doc('live_feed').get(),
        db.collection('system').doc('pigskin_injuries').get(),
        db.collection('leagues').get()
    ]);

    const feed = feedDoc.data();
    const injuries = injuriesDoc.data()?.playerIds || [];
    
    if (!feed || !feed.allPlayByPlay) return;

    const allPlays = feed.allPlayByPlay;
    const batch = db.batch();
    let batchCount = 0;

    for (const leagueDoc of leaguesSnap.docs) {
        const leagueData = leagueDoc.data();
        if (leagueData.gameMode !== 'pigskin') continue;

        let lastIndex = typeof leagueData.lastPlayIndex === 'number' ? leagueData.lastPlayIndex : -1;
        if (lastIndex >= allPlays.length) {
             batch.update(leagueDoc.ref, { lastPlayIndex: -1 });
             lastIndex = -1;
        }

        const startIndex = lastIndex + 1;
        if (startIndex >= allPlays.length) continue; 

        // Fetch Members
        const membersSnap = await db.collection('leagues').doc(leagueDoc.id).collection('Members').get();
        let members: any[] = membersSnap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() }))
            .sort((a: any, b: any) => (parseInt(a.queueOrder) || 999) - (parseInt(b.queueOrder) || 999));

        if (members.length === 0) continue;

        let newLastIndex = lastIndex;

        for (let i = startIndex; i < allPlays.length; i++) {
            const playData = allPlays[i];
            const playId = `play_${String(i).padStart(3, '0')}`;
            const lowerDesc = (playData.play || "").toLowerCase();
            const playerStats = playData.playerStats || {};

            newLastIndex = i;
            const holder = members[0]; 
            if (!holder) continue;

            const currentLineup = (Array.isArray(holder.lineup) && holder.lineup.length > 0) 
                ? holder.lineup[holder.lineup.length - 1] 
                : (holder.lineup || {});
            
            const myPlayerIds: string[] = currentLineup.players || [];

            // --- A. KICKER / SPECIAL TEAMS CHECK ---
            const involvesKicking = Object.values(playerStats).some((stats: any) => stats && stats.Kicking);

            // --- B. NULL PLAY CHECK ---
            const isNullPlay = 
                involvesKicking || 
                lowerDesc.includes('timeout') || 
                lowerDesc.includes('end quarter') || 
                lowerDesc.includes('end game') || 
                lowerDesc.includes('touchback') ||
                lowerDesc.includes('spike');

            // --- C. HOLDER INVOLVEMENT (Updated) ---
            let holderInvolved = false;

            if (!isNullPlay) {
                for (const myPid of myPlayerIds) {
                    // 1. Direct ID Match
                    if (playerStats[myPid]) {
                        holderInvolved = true;
                        break;
                    }
                    // 2. Name Fallback (For Incompletes)
                    const pName = ID_TO_NAME[myPid];
                    if (pName && lowerDesc.includes(pName.toLowerCase())) {
                        holderInvolved = true;
                        break;
                    }
                }
            }

            // --- D. SCORING ---
            let pointsToAdd = 0;
            let logType = "info";
            let logMessage = "Game Event"; 
            let shouldRotate = false;

            if (isNullPlay) {
                pointsToAdd = 0;
                logType = "neutral";
                logMessage = "GAME UPDATE";
            } 
            else if (holderInvolved) {
                if (lowerDesc.includes('touchdown')) {
                    pointsToAdd = 7;
                    logType = "score";
                    logMessage = `${holder.username} +7 (TD)`;
                    shouldRotate = false; 
                } else {
                    pointsToAdd = 0;
                    logType = "burn";
                    logMessage = `${holder.username} 🔥`;
                    shouldRotate = true; 
                }
            } 
            else {
                pointsToAdd = 1;
                logType = "score";
                logMessage = `${holder.username} +1`;
            }

            // --- E. BATCH OPERATIONS ---
            const logRef = db.collection('leagues').doc(leagueDoc.id).collection('ActivityLogs').doc(playId);
            batch.set(logRef, {
                message: logMessage,
                type: logType,
                points: pointsToAdd,
                timestamp: FieldValue.serverTimestamp(),
                playText: playData.play
            });
            batchCount++;

            if (pointsToAdd > 0) {
                batch.set(holder.ref, { scores: { Total: FieldValue.increment(pointsToAdd) } }, { merge: true });
                batchCount++;
            }

            if (shouldRotate) {
                batch.update(holder.ref, { lineup: [] });
                batchCount++;

                const movingMember = members.shift();
                if (movingMember) members.push(movingMember);

                members.forEach((m: any, index: number) => {
                    batch.update(m.ref, { queueOrder: index + 1 });
                    batchCount++;
                });

                const newOnDeck = members[1];
                if (newOnDeck) {
                    const p1 = TIERS[1].filter(id => !injuries.includes(id)).sort(() => 0.5 - Math.random())[0];
                    const p2 = TIERS[2].filter(id => !injuries.includes(id)).sort(() => 0.5 - Math.random())[0];
                    // Fallback for Tier 3
                    let p3 = TIERS[3].filter(id => !injuries.includes(id)).sort(() => 0.5 - Math.random())[0];
                    if (!p3 && TIERS[3].length > 0) p3 = TIERS[3][0]; 

                    if (p1 && p2 && p3) {
                        const newHand = [{ turn: Date.now().toString(), players: [p1, p2, p3] }];
                        batch.update(newOnDeck.ref, { lineup: newHand });
                        batchCount++;
                    }
                }
            }
        }
        
        batch.update(leagueDoc.ref, { lastPlayIndex: newLastIndex });
        batchCount++;
    }

    if (batchCount > 0) {
        await batch.commit();
        console.log(`✅ Sync: Committed ${batchCount} updates.`);
    }
}