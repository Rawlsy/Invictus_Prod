import { NextResponse } from 'next/server';
import { doc, setDoc, writeBatch } from 'firebase/firestore'; 
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

function sanitize(obj: any) {
  return JSON.parse(JSON.stringify(obj));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const authHeader = request.headers.get('authorization');
    const isCron = authHeader && authHeader.startsWith('Bearer cron_');
    
    if (!isCron && secret !== 'Touchdown2026') {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const headers = {
        'x-rapidapi-key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
        'x-rapidapi-host': 'tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com'
    };

    // --- 2. CONFIGURATION ---
    let targetWeek = searchParams.get('week') || '19'; 
    let targetSeason = searchParams.get('season') || '2025';

    // Auto-Discovery: Only if week is truly missing
    if (!searchParams.get('week')) {
        const infoRes = await fetch('https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLCurrentInfo', { headers });
        const infoData = await infoRes.json();
        const rawWeek = infoData.body?.week || '1';
        
        if (typeof rawWeek === 'string' && rawWeek.toLowerCase().includes('post season')) {
            const relativeWeek = parseInt(rawWeek.replace(/\D/g, ''));
            targetWeek = (18 + relativeWeek).toString(); 
        } else {
            targetWeek = rawWeek.replace(/\D/g, ''); 
        }
    }

    // --- 3. DETERMINE API PARAMETERS ---
    const weekNum = parseInt(targetWeek);
    
    // VARIABLES FOR API (Must be Relative: 1, 2, 3...)
    let apiWeek = targetWeek; 
    let seasonType = 'reg';
    let dbWeek = targetWeek;

    // Force Post Season Logic
    if (weekNum > 18) {
        seasonType = 'post';
        apiWeek = (weekNum - 18).toString(); 
        console.log(`[Sync] 🏈 Post Season Detected. DB Week: ${dbWeek} -> API Week: ${apiWeek}`);
    }

    const roundMap: Record<string, string> = {
        '19': 'wildcard',
        '20': 'divisional',
        '21': 'conference',
        '22': 'superbowl'
    };
    const roundName = roundMap[dbWeek] || `week_${dbWeek}`;

    // --- 4. FETCH SCHEDULE (WITH PARSING FALLBACK) ---
    const scheduleUrl = `https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLGamesForWeek?week=${apiWeek}&season=${targetSeason}&seasonType=${seasonType}`;
    
    console.log(`[Sync] 📅 Fetching Schedule: ${scheduleUrl}`);
    const gamesRes = await fetch(scheduleUrl, { headers });
    const gamesData = await gamesRes.json();

    const validTeams = new Set<string>();
    let schedule: any[] = [];

    if (Array.isArray(gamesData.body)) {
        schedule = gamesData.body.map((g: any) => {
            // FALLBACK PARSING: If API homeTeam is missing, parse from ID
            // Format: YYYYMMDD_AWAY@HOME (e.g., 20260110_GB@CHI)
            let home = g.homeTeam;
            let away = g.awayTeam;

            if (!home || !away) {
                try {
                    const parts = g.gameID.split('_'); // ["20260110", "GB@CHI"]
                    if (parts.length > 1) {
                        const teams = parts[1].split('@'); // ["GB", "CHI"]
                        away = teams[0];
                        home = teams[1];
                        console.log(`[Sync] ⚠️ Parsed missing teams from ID: ${away} @ ${home}`);
                    }
                } catch (e) {
                    console.error("Error parsing gameID:", g.gameID);
                }
            }

            // Add valid teams to whitelist
            if (home) validTeams.add(home);
            if (away) validTeams.add(away);

            return {
                id: g.gameID,
                home: home, // Now guaranteed to exist if ID is valid
                away: away,
                date: g.gameDate,
                time: g.gameTime
            };
        });
    }

    // --- 5. FETCH PROJECTIONS ---
    const projParams = new URLSearchParams({
        week: apiWeek, 
        season: targetSeason,
        seasonType: seasonType,
        itemFormat: 'list',
        twoPointConversions: '2', passYards: '.04', passAttempts: '-.5', passTD: '4',
        passCompletions: '1', passInterceptions: '-2', pointsPerReception: '1',
        carries: '.2', rushYards: '.1', rushTD: '6', fumbles: '-2',
        receivingYards: '.1', receivingTD: '6', targets: '.1',
        fgMade: '3', fgMissed: '-1', xpMade: '1', xpMissed: '-1'
    });

    console.log(`[Sync] 📊 Fetching Projections: Week ${apiWeek} (${seasonType})`);
    const projRes = await fetch(`https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLProjections?${projParams.toString()}`, { headers });
    const projData = await projRes.json();
    const body = projData.body || {};
    
    // --- 6. FILTER PLAYERS ---
    let combinedList: any[] = [];

    if (Array.isArray(body.playerProjections)) {
        combinedList = body.playerProjections.filter((p: any) => validTeams.has(p.team));
    }
    
    if (Array.isArray(body.teamDefenseProjections)) {
        const defenses = body.teamDefenseProjections
            .filter((def: any) => validTeams.has(def.teamAbv))
            .map((def: any) => ({
                playerID: `DEF_${def.teamAbv}`,
                longName: `${def.teamAbv} Defense`,
                team: def.teamAbv,
                pos: 'DEF',
                fantasyPoints: def.fantasyPointsDefault || def.fantasyPoints || 0
            }));
        combinedList = [...combinedList, ...defenses];
    }

    if (combinedList.length === 0) {
        return NextResponse.json({ success: false, message: `No players matched the schedule for Week ${apiWeek}.` });
    }

    // --- 7. SAVE TO DB ---
    let cacheId = parseInt(dbWeek) > 18 ? `nfl_post_week_${parseInt(dbWeek) - 18}` : `nfl_reg_week_${dbWeek}`;
    
    const cacheData = sanitize({
        lastUpdated: new Date().toISOString(),
        payload: { players: combinedList, games: schedule }, 
        meta: { week: dbWeek, season: targetSeason, round: roundName }
    });
    
    await setDoc(doc(db, 'system_cache', cacheId), cacheData);

    const batch = writeBatch(db);
    const chunkSize = 400; 

    for (let i = 0; i < combinedList.length; i += chunkSize) {
        const chunk = combinedList.slice(i, i + chunkSize);
        const subBatch = writeBatch(db);
        
        chunk.forEach((player) => {
            const pid = player.playerID || player.id;
            if (!pid) return;

            const playerRef = doc(db, 'players', pid);
            const projPoints = Number(player.fantasyPoints || player.projectedPoints || 0);

            const updateData = sanitize({
                id: pid,
                name: player.longName || player.name,
                team: player.team,
                position: player.pos || player.position,
                weeks: {
                    [roundName]: { 
                        projected: projPoints,
                        score: 0, 
                        opponent: player.opponent || player.gameOpponent || 'BYE'
                    }
                }
            });

            subBatch.set(playerRef, updateData, { merge: true });
        });
        await subBatch.commit();
    }

    return NextResponse.json({ 
        success: true, 
        message: `Synced ${combinedList.length} players & ${schedule.length} games for ${roundName}.` 
    });

  } catch (error: any) {
    console.error("[Sync] 🔥 ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}