import { NextResponse } from 'next/server';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

const API_KEY = '85657f0983msh1fda8640dd67e05p1bb7bejsn3e59722b8c1e';
const API_HOST = 'tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com';

const DST_ID_MAP: Record<string, string> = {
    "ARI": "ARI", "ATL": "ATL", "BAL": "BAL", "BUF": "BUF", "CAR": "CAR",
    "CHI": "CHI", "CIN": "CIN", "CLE": "CLE", "DAL": "DAL", "DEN": "DEN",
    "DET": "DET", "GB": "GB",   "HOU": "HOU", "IND": "IND", "JAX": "JAX",
    "KC": "KC",   "LV": "LV",   "LAC": "LAC", "LAR": "LAR", "MIA": "MIA",
    "MIN": "MIN", "NE": "NE",   "NO": "NO",   "NYG": "NYG", "NYJ": "NYJ",
    "PHI": "PHI", "PIT": "PIT", "SEA": "SEA", "SF": "SF",   "TB": "TB",
    "TEN": "TEN", "WAS": "WAS", "WSH": "WAS" 
};

const parseScore = (val: any) => {
    if (val === undefined || val === null || val === "") return 0;
    if (typeof val === 'number') return val;
    const num = parseFloat(String(val).replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
};

// Flatten API structure
const normalizeProjections = (data: any) => {
    let allItems: any[] = [];
    const root = data.body || data;

    if (Array.isArray(root)) return root;

    if (typeof root === 'object' && root !== null) {
        if (root.playerProjections) {
            allItems = allItems.concat(Object.values(root.playerProjections));
        }
        if (root.teamDefenseProjections) {
            const defs = Object.values(root.teamDefenseProjections);
            defs.forEach((d: any) => {
                d.pos = 'DEF'; 
                const t = d.teamAbv || d.team;
                d.playerID = DST_ID_MAP[t] || t; 
            });
            allItems = allItems.concat(defs);
        }
    }
    return allItems;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    // DEFAULT TO 19 IF MISSING, BUT LOG IT
    const internalWeek = searchParams.get('week') || '19'; 

    if (secret !== 'Touchdown2026') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const weekMapping: Record<string, { apiWeek: string; roundName: string }> = {
      '19': { apiWeek: '19', roundName: 'WildCard' },
      '20': { apiWeek: '20', roundName: 'Divisional' },
      '21': { apiWeek: '21', roundName: 'Conference' },
      '22': { apiWeek: '22', roundName: 'Superbowl' }
    };

    const target = weekMapping[internalWeek];
    if (!target) return NextResponse.json({ error: `Invalid week: ${internalWeek}` }, { status: 400 });

    console.log(`[Sync-Projections] ------------------------------------------------`);
    console.log(`[Sync-Projections] STARTING SYNC: ${target.roundName} (Week ${target.apiWeek})`);
    
    let url = `https://${API_HOST}/getNFLProjections?week=${target.apiWeek}&season=2025&seasonType=post&archive=false`;
    let res = await fetch(url, { headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': API_HOST } });
    let data = await res.json();
    let projections = normalizeProjections(data);

    // DEBUG: Check if we got nothing
    if (projections.length === 0) {
        console.warn(`[Sync-Projections] WARNING: API returned 0 players for Week ${target.apiWeek}.`);
        console.warn(`[Sync-Projections] This usually means the matchups are not set yet.`);
        return NextResponse.json({ message: `No projections found for ${target.roundName}. Matchups might not be set.` });
    }

    // DEBUG: Look for Bo Nix specifically
    const boNixFound = projections.find((p: any) => p.longName === "Bo Nix" || p.name === "Bo Nix");
    if (boNixFound) {
        console.log(`[Sync-Projections] ✅ FOUND BO NIX in API data! Proceeding to update...`);
    } else {
        console.warn(`[Sync-Projections] ❌ BO NIX NOT FOUND in API data for Week ${target.apiWeek}.`);
    }

    let batch = writeBatch(db);
    let count = 0;
    const BATCH_LIMIT = 400; 

    for (const p of projections) {
        
        // 1. Position Normalization
        let pos = (p.pos || p.position || '').trim();
        if (pos === 'PK') pos = 'K'; 

        // Filter out junk, but keep the core positions
        if (!['QB', 'RB', 'WR', 'TE', 'K', 'DST', 'DEF'].includes(pos)) continue;

        let docId = p.playerID;
        let name = p.longName || `${p.firstName} ${p.lastName}`;
        const team = p.team || p.teamAbv;

        if (pos === 'DST' || pos === 'DEF') {
            docId = DST_ID_MAP[team] || team;
            pos = 'DEF';
            name = `${team} Defense`;
        }

        if (!docId) continue;

        // 2. Parse Scores
        let ppr = 0, half = 0, std = 0;

        if (p.fantasyPointsDefault) {
             if (typeof p.fantasyPointsDefault === 'object') {
                 ppr = parseScore(p.fantasyPointsDefault.PPR || p.fantasyPoints);
                 half = parseScore(p.fantasyPointsDefault.halfPPR || p.fantasyPointsDefault.HalfPPR);
                 std = parseScore(p.fantasyPointsDefault.standard || p.fantasyPointsDefault.Standard);
             } else {
                 const val = parseScore(p.fantasyPointsDefault);
                 ppr = val; half = val; std = val;
             }
        } else {
             const val = parseScore(p.fantasyPoints || p.projectedPoints);
             ppr = val; half = val; std = val;
        }

        // Fill gaps
        if (ppr > 0 && half === 0) half = ppr * 0.85; 
        if (ppr > 0 && std === 0) std = ppr * 0.7;

        const playerRef = doc(db, 'players', docId);

        // 3. CONSTRUCT UPDATE
        // This explicitly sets 'position' at the root, AND nests the round data.
        const updateData = {
            name: name,
            team: team,
            position: pos,  // <--- THIS FORCES THE POSITION UPDATE AT ROOT
            [target.roundName]: {
                "Projected PPR": Number(ppr.toFixed(2)),
                "Projected Half PPR": Number(half.toFixed(2)),
                "Projected Standard": Number(std.toFixed(2)),
                Active: true,
                opponent: p.opponent || "BYE"
            }
        };

        batch.set(playerRef, updateData, { merge: true });

        count++;
        if (count % BATCH_LIMIT === 0) {
            await batch.commit();
            batch = writeBatch(db); 
        }
    }

    if (count % BATCH_LIMIT !== 0) {
        await batch.commit();
    }
    
    console.log(`[Sync-Projections] SUCCESS: Updated ${count} records for ${target.roundName}.`);
    return NextResponse.json({ success: true, updated: count, round: target.roundName });

  } catch (error: any) {
    console.error(`[Sync-Projections] ERROR: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}