import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin'; 
import { FieldValue } from 'firebase-admin/firestore';

const GAME_ID = "20260208_NE@SEA";

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

// --- CONFIGURATION ---
const TIERS = {
    // TIER 1: Stars
    1: ['4431452', '4569173', '4567048', '4431566'],
    // TIER 2: Starters
    2: ['2976212', '3046439', '5000001', '2977187', '4426514'],
    // TIER 3: Role Players (KICKERS REMOVED)
    3: ['4241478', '4431526', '3052876', '4431611', '3912547'] 
};

export async function GET() {
  try {
    console.log("⏰ Starting Sync Loop (4x / 14s delay)...");

    // --- LOOP: 4 Times x 14 Seconds ---
    for (let i = 0; i < 4; i++) {
        await performSync();
        
        // Wait 14s if not the last iteration
        if (i < 3) {
            await new Promise(resolve => setTimeout(resolve, 14000));
        }
    }

    return NextResponse.json({ success: true, message: "Sync Loop Complete" });

  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function performSync() {
    console.log(`🔄 [${new Date().toISOString()}] processing sync logic...`);
    const feedRef = db.collection('system').doc('live_feed');
    const injuriesRef = db.collection('system').doc('pigskin_injuries');
    const leaguesRef = db.collection('leagues');

    const [feedDoc, injuriesDoc, leaguesSnap] = await Promise.all([
        feedRef.get(),
        injuriesRef.get(),
        leaguesRef.get()
    ]);

    const feed = feedDoc.data();
    const injuries = injuriesDoc.data()?.playerIds || [];
    
    if (!feed || !feed.allPlayByPlay) return;

    const allPlays = feed.allPlayByPlay;
    const batch = db.batch();
    let batchCount = 0;

    for (const leagueDoc of leaguesSnap.docs) {
        const leagueId = leagueDoc.id;
        const leagueData = leagueDoc.data();
        let lastIndex = typeof leagueData.lastPlayIndex === 'number' ? leagueData.lastPlayIndex : -1;

        if (lastIndex >= allPlays.length) {
             batch.update(leagueDoc.ref, { lastPlayIndex: -1 });
             lastIndex = -1;
        }

        const startIndex = lastIndex + 1;
        if (startIndex >= allPlays.length) continue;

        const membersRef = leaguesRef.doc(leagueId).collection('Members');
        const membersSnap = await membersRef.get();
        
        // --- FIX: Added ': any[]' type to fix TypeScript build error ---
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

            const currentLineup = (Array.isArray(holder.lineup) && holder.lineup.length > 0) ? holder.lineup[holder.lineup.length - 1] : (holder.lineup || {});
            const myPlayerIds: string[] = currentLineup.players || [];

            const isNullPlay = lowerDesc.includes('kick') || lowerDesc.includes('punt') || lowerDesc.includes('field goal') || lowerDesc.includes('extra point') || lowerDesc.includes('touchback') || lowerDesc.includes('timeout') || lowerDesc.includes('end quarter') || lowerDesc.includes('end game');

            let holderInvolved = false;
            if (!isNullPlay) {
                for (const myPid of myPlayerIds) {
                    if (playerStats[myPid]) {
                        holderInvolved = true;
                        break;
                    }
                }
            }

            let pointsToAdd = 0;
            let logType = "info";
            let logMessage = "Game Event"; 
            let shouldRotate = false;

            if (isNullPlay) {
                pointsToAdd = 0;
                logType = "neutral";
                logMessage = "Game Update";
            } 
            else if (holderInvolved) {
                if (lowerDesc.includes('touchdown')) {
                    pointsToAdd = 7;
                    logType = "score";
                    logMessage = `${holder.username} +7`;
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

            const logRef = leaguesRef.doc(leagueId).collection('ActivityLogs').doc(playId);
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
                    const p3 = TIERS[3].filter(id => !injuries.includes(id)).sort(() => 0.5 - Math.random())[0];
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
        console.log(`   ✅ Committed ${batchCount} updates.`);
    }
}