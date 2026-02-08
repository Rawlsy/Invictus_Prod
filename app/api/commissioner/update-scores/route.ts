import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin'; 

// --- SCORING CALCULATOR ---
const calculateFantasyPoints = (stats: any, format: string = 'Standard') => {
    if (!stats) return 0;
    
    let points = 0;
    // Standard Stats
    points += (stats.passingYards || 0) * 0.04;
    points += (stats.passingTouchdowns || 0) * 4;
    points += (stats.interceptions || 0) * -2;
    points += (stats.rushingYards || 0) * 0.1;
    points += (stats.rushingTouchdowns || 0) * 6;
    points += (stats.receivingYards || 0) * 0.1;
    points += (stats.receivingTouchdowns || 0) * 6;
    points += (stats.fumblesLost || 0) * -2;

    // Format Specifics
    if (format === 'PPR') {
        points += (stats.receptions || 0) * 1;
    } else if (format === 'Half-PPR') {
        points += (stats.receptions || 0) * 0.5;
    }

    return parseFloat(points.toFixed(2));
};

export async function POST() {
  try {
    const logs: string[] = [];
    logs.push("🚀 Starting Leaderboard Update...");

    // 1. Fetch All Player Stats (The Dictionary)
    const playersRef = db.collection('players');
    const playersSnap = await playersRef.get();
    const playerStatsMap: Record<string, any> = {};
    
    playersSnap.forEach((doc: any) => {
        playerStatsMap[doc.id] = doc.data();
    });
    
    // 2. Fetch All Leagues
    const leaguesRef = db.collection('leagues');
    const leaguesSnap = await leaguesRef.get();
    let totalMembersUpdated = 0;

    // 3. Process Each League
    for (const leagueDoc of leaguesSnap.docs) {
        const leagueData = leagueDoc.data();
        
        // Skip Pigskin leagues
        if (leagueData.gameMode === 'pigskin') continue;

        const scoringFormat = leagueData.scoringType || 'Standard';
        logs.push(`Processing '${leagueData.name}' (${scoringFormat})...`);

        const membersRef = db.collection('leagues').doc(leagueDoc.id).collection('Members');
        const membersSnap = await membersRef.get();

        if (membersSnap.empty) continue;

        const batch = db.batch();
        let leagueUpdates = 0;

        membersSnap.forEach((memDoc) => {
            const member = memDoc.data();
            const currentScores = member.scores || {};
            
            // A. Safely Get Past Rounds
            // NOTE: We use the full key names to match 'StandardView.tsx'
            const wc = parseFloat(currentScores.WildCard) || 0;
            const div = parseFloat(currentScores.Divisional) || 0;
            const conf = parseFloat(currentScores.Conference) || 0;
            
            // B. Calculate Active Lineup Score (SUPER BOWL)
            // We look specifically for "Super Bowl Lineup" first, then fall back to generic
            const lineup = member["Super Bowl Lineup"] || member.lineup || {};
            let sbScore = 0;
            
            // Handle different lineup structures
            const players = Array.isArray(lineup) ? lineup : (Object.values(lineup) || []);

            // Sum up points for current roster
            players.forEach((item: any) => {
                const pid = typeof item === 'string' ? item : item.id;
                // Only count valid IDs
                if (pid && typeof pid === 'string') {
                    const stats = playerStatsMap[pid];
                    if (stats) {
                        sbScore += calculateFantasyPoints(stats, scoringFormat);
                    }
                }
            });

            // C. Calculate The GRAND TOTAL
            const grandTotal = wc + div + conf + sbScore;

            // D. Queue Update
            // We update 'Superbowl' and 'Total' to match the View's expectations
            batch.update(memDoc.ref, { 
                "scores.Superbowl": parseFloat(sbScore.toFixed(2)),
                "scores.Total": parseFloat(grandTotal.toFixed(2)) 
            });

            leagueUpdates++;
            totalMembersUpdated++;
        });

        await batch.commit();
        logs.push(`   -> Updated ${leagueUpdates} members.`);
    }

    return NextResponse.json({ success: true, logs, count: totalMembersUpdated });

  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}