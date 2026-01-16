import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; 
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

// --- 1. CRASH FIX: SANITIZE DATA ---
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

    // --- 2. DETERMINE WEEK ---
    let targetWeek = searchParams.get('week'); 
    let targetSeason = searchParams.get('season') || '2025';

    if (!targetWeek) {
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

    const weekNum = parseInt(targetWeek!);
    let apiWeek = targetWeek!;
    let seasonType = 'reg';
    let dbWeek = targetWeek!;

    if (weekNum > 18) {
        seasonType = 'post';
        apiWeek = (weekNum - 18).toString(); 
    }

    // --- 3. FETCH SCORES ---
    const scheduleUrl = `https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLGamesForWeek?week=${apiWeek}&season=${targetSeason}&seasonType=${seasonType}`;
    console.log(`[Scores] 🏈 Fetching Scores: ${scheduleUrl}`);
    
    const res = await fetch(scheduleUrl, { headers });
    const data = await res.json();
    
    if (!Array.isArray(data.body)) {
        return NextResponse.json({ success: false, message: "No games found." });
    }

    // --- 4. PARSE & MAP SCORES ---
    const updatedGames = data.body.map((g: any) => {
        let home = g.homeTeam;
        let away = g.awayTeam;
        
        // Fallback for missing team names
        if (!home || !away) {
             try {
                const parts = g.gameID.split('_'); 
                if (parts.length > 1) {
                    const teams = parts[1].split('@');
                    away = teams[0];
                    home = teams[1];
                }
            } catch (e) {}
        }

        // SCORING LOGIC: Check multiple fields to be safe
        const homeScore = g.homeScore ?? g.homePts ?? '0';
        const awayScore = g.awayScore ?? g.awayPts ?? '0';

        return {
            id: g.gameID,
            home: home,
            away: away,
            date: g.gameDate,
            time: g.gameTime,
            homeScore: homeScore.toString(), // Force to string
            awayScore: awayScore.toString(),
            status: g.gameStatus || 'Scheduled'
        };
    });

    // --- 5. SAVE TO DB (SANITIZED) ---
    let cacheId = parseInt(dbWeek) > 18 ? `nfl_post_week_${parseInt(dbWeek) - 18}` : `nfl_reg_week_${dbWeek}`;
    const cacheRef = doc(db, 'system_cache', cacheId);
    
    const currentDoc = await getDoc(cacheRef);
    if (!currentDoc.exists()) {
        return NextResponse.json({ success: false, message: "Cache doc not found. Run Sync first." });
    }
    
    const currentData = currentDoc.data();
    
    // We sanitize ONLY the object we are about to write
    const updatePayload = sanitize({
        payload: {
            players: currentData.payload?.players || [], 
            games: updatedGames 
        },
        lastUpdated: new Date().toISOString()
    });

    await updateDoc(cacheRef, updatePayload);

    return NextResponse.json({ 
        success: true, 
        message: `Updated scores for ${updatedGames.length} games (Week ${dbWeek})`,
        games: updatedGames
    });

  } catch (error: any) {
    console.error("[Scores] 🔥 ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}