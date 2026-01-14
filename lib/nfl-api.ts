import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; 

// --- SANITY CHECK LOG ---
console.log("\n\n------------------------------------------------");
console.log("✅ LOADED: src/lib/nfl-api.ts (With Recursive Hunter)");
console.log("------------------------------------------------\n\n");

export interface NFLPlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  opponent: string;
  image: string;
  projection: number; 
  actualScore: number; 
}

// --- HELPER: SUPER NORMALIZER ---
function normalizeName(name: string): string {
    if (!name) return "";
    return name.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/(jr|sr|ii|iii|iv)$/g, '').trim();
}

// --- HELPER: RECURSIVE DATA HUNTER ---
// This finds the array of players no matter where it is hidden (root, payload, body, etc.)
function findDataArray(data: any): any[] | null {
    if (!data) return null;

    // 1. If it's an array, check if it looks like player data
    if (Array.isArray(data)) {
        if (data.length > 0) {
            const sample = data[0];
            // Disqualify Schedules (if it has home/away but no points/ID)
            if ((sample.home || sample.away) && !sample.playerID) return null;
            return data;
        }
        return null;
    }

    // 2. If it's an object, search known keys first
    if (typeof data === 'object') {
        if (data.playerProjections) return findDataArray(data.playerProjections);
        if (data.playerScores) return findDataArray(data.playerScores); // For scores
        if (data.body) return findDataArray(data.body);
        if (data.payload) return findDataArray(data.payload);

        // Deep search other keys
        for (const key in data) {
            if (typeof data[key] === 'object' || typeof data[key] === 'string') {
                const res = findDataArray(data[key]);
                if (res) return res;
            }
        }
    }

    // 3. If it's a JSON string, parse it
    if (typeof data === 'string') {
        if (data.trim().startsWith('[') || data.trim().startsWith('{')) {
            try { return findDataArray(JSON.parse(data)); } catch (e) {}
        }
    }
    return null;
}

// --- MAIN FETCH FUNCTION ---
async function getFirebaseData(round: string) {
    const possibleDocIds = [
        round === 'wildcard' ? 'nfl_post_week_1' : `nfl_post_${round}`,
        'post_season_week_1' 
    ];
    
    if (round === 'divisional') possibleDocIds.unshift('nfl_post_week_2');
    if (round === 'conference') possibleDocIds.unshift('nfl_post_week_3');
    if (round === 'superbowl')  possibleDocIds.unshift('nfl_post_week_4');
    
    const projections = { byId: {} as Record<string,string>, byName: {} as Record<string,string> };
    const actuals = { byId: {} as Record<string,string>, byName: {} as Record<string,string> };

    console.log(`[API] 🔍 Checking Firebase Cache: system_cache/${possibleDocIds[0]}`);

    for (const docId of possibleDocIds) {
        try {
            const docRef = doc(db, 'system_cache', docId); 
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // --- 1. HUNT FOR PROJECTIONS ---
                // We use the hunter to find the array wherever it is
                let rawProjections = findDataArray(data.playerProjections || data.payload || data);
                
                if (rawProjections && rawProjections.length > 0) {
                    console.log(`[API] ✅ Found ${rawProjections.length} Projections in ${docId}`);
                    rawProjections.forEach((p: any) => {
                         const pts = String(p.fantasyPoints || p.projection || p.projectedPoints || "0");
                         if (p.playerID) projections.byId[String(p.playerID)] = pts;
                         if (p.id) projections.byId[String(p.id)] = pts;
                         const n = normalizeName(p.espnName || p.longName || p.name);
                         if (n) projections.byName[n] = pts;
                    });
                } else {
                    console.log(`[API] ⚠️ No Projections array found in ${docId}`);
                }

                // --- 2. HUNT FOR SCORES ---
                // Look specifically in 'playerScores' field first
                let rawScores = findDataArray(data.playerScores);
                
                if (rawScores && rawScores.length > 0) {
                    console.log(`[API] ✅ Found ${rawScores.length} Actual Scores in ${docId}`);
                    rawScores.forEach((p: any) => {
                         const pts = String(p.fantasyPoints || "0");
                         if (p.playerID) actuals.byId[String(p.playerID)] = pts;
                         const n = normalizeName(p.longName || p.espnName || p.name);
                         if (n) actuals.byName[n] = pts;
                    });
                }

                if (Object.keys(projections.byId).length > 0 || Object.keys(actuals.byId).length > 0) {
                    return { projections, actuals };
                }
            }
        } catch (e) { console.warn(`[API] Error reading ${docId}:`, e); }
    }
    return { projections, actuals };
}

export async function getNFLPlayers(round: string = 'wildcard') {
    const rosterUrl = 'https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLTeams?sortBy=standings&rosters=true&schedules=false&topPerformers=false&teamStats=true&teamStatsSeason=2025&standingsSeason=2025';
    
    const options = { 
        method: 'GET', 
        headers: { 
            'x-rapidapi-key': '85657f0983msh1fda8640dd67e05p1bb7bejsn3e59722b8c1e', 
            'x-rapidapi-host': 'tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com' 
        }
    };

    try {
        const [rosterRes, firebaseData] = await Promise.all([ 
            fetch(rosterUrl, options), 
            getFirebaseData(round) 
        ]);

        const rosterData = await rosterRes.json();
        const teams = rosterData.body;
        const { projections, actuals } = firebaseData;
        let allAvailablePlayers: NFLPlayer[] = [];

        if (!teams || !Array.isArray(teams)) {
            console.error("[API] Failed to fetch roster data");
            return [];
        }

        teams.forEach((team: any) => {
            if (!team.Roster) return;
            const rosterEntries = Object.entries(team.Roster);
            const allowedPositions = ['QB', 'RB', 'WR', 'TE', 'PK'];
            
            const activePlayers = rosterEntries
                .map(([keyID, player]: [string, any]) => ({ 
                    ...player, 
                    _finalID: String(player.playerID || keyID) 
                }))
                .filter((player: any) => !['Out','IR'].includes(player.injury?.designation) && ['QB','RB','WR','TE','PK'].includes(player.pos))
                .map((p: any) => {
                    const pid = p._finalID;
                    const pName = normalizeName(p.espnName || p.longName || p.name);

                    // MATCH PROJECTIONS
                    let proj = projections.byId[pid];
                    if (!proj && pName) proj = projections.byName[pName];
                    
                    // MATCH SCORES
                    let score = actuals.byId[pid];
                    if (!score && pName) score = actuals.byName[pName];

                    return {
                        id: pid,
                        name: p.espnName,
                        position: p.pos === 'PK' ? 'K' : p.pos,
                        team: p.team,
                        opponent: "TBD",
                        image: p.espnHeadshot,
                        projection: parseFloat(proj || "0"),
                        actualScore: parseFloat(score || "0") 
                    };
                });
            
            // Defense Logic
            const dstId = `DST_${team.teamAbv}`;
            const dstName = normalizeName(`${team.teamCity} defense`);
            const dstProj = projections.byId[dstId] || projections.byName[dstName] || "0";
            const dstScore = actuals.byId[dstId] || actuals.byName[dstName] || "0";

            allAvailablePlayers.push(...activePlayers);
            allAvailablePlayers.push({
                id: dstId,
                name: `${team.teamCity} Defense`,
                position: 'DEF',
                team: team.teamAbv,
                opponent: "TBD",
                image: team.espnLogo1,
                projection: parseFloat(dstProj),
                actualScore: parseFloat(dstScore)
            });
        });

        return allAvailablePlayers;

    } catch (error) {
        console.error("Critical Error in getNFLPlayers:", error);
        return [];
    }
}