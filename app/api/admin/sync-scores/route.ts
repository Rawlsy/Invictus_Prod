import { NextResponse } from 'next/server';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

const API_KEY = '85657f0983msh1fda8640dd67e05p1bb7bejsn3e59722b8c1e';
const API_HOST = 'tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com';

const SCORING_RULES = {
  PASS_YD: 0.04, PASS_TD: 4, INT: -2, SACK: -1, 
  RUSH_YD: 0.1, RUSH_TD: 6, REC_YD: 0.1, REC_TD: 6, 
  FUMBLE_LOST: -2, TWO_PT: 2,
  FG_MADE: 3, FG_MISSED: -1, XP_MADE: 1, XP_MISSED: -1,
  DST_SACK: 1, DST_INT: 2, DST_FUMBLE_REC: 2, 
  DST_TD: 6, DST_SAFETY: 6, DST_BLK_KICK: 2,
  DST_RET_XP: 2,
};

const DST_ID_MAP: Record<string, string> = {
    "ARI": "ARI", "ATL": "ATL", "BAL": "BAL", "BUF": "BUF", "CAR": "CAR",
    "CHI": "CHI", "CIN": "CIN", "CLE": "CLE", "DAL": "DAL", "DEN": "DEN",
    "DET": "DET", "GB": "GB",   "HOU": "HOU", "IND": "IND", "JAX": "JAX",
    "KC": "KC",   "LV": "LV",   "LAC": "LAC", "LAR": "LAR", "MIA": "MIA",
    "MIN": "MIN", "NE": "NE",   "NO": "NO",   "NYG": "NYG", "NYJ": "NYJ",
    "PHI": "PHI", "PIT": "PIT", "SEA": "SEA", "SF": "SF",   "TB": "TB",
    "TEN": "TEN", "WAS": "WAS", "WSH": "WAS" 
};

// Points Allowed Tiers
const getPointsAllowedScore = (pa: number | null) => {
  if (pa === null) return 0; // No data = 0 pts
  if (pa === 0) return 15;        
  if (pa >= 1 && pa <= 6) return 10; 
  if (pa >= 7 && pa <= 13) return 7; 
  if (pa >= 14 && pa <= 20) return 5; 
  if (pa >= 21 && pa <= 27) return 0; 
  if (pa >= 28 && pa <= 34) return -5; 
  if (pa >= 35) return -7;        
  return 0;
};

const clean = (val: any) => {
  if (val === undefined || val === null || val === "") return 0;
  const str = String(val);
  if (str.includes('-') && !str.startsWith('-')) return Number(str.split('-')[0]);
  if (str.includes('/')) return Number(str.split('/')[0]);
  const num = Number(str.replace(/,/g, ''));
  return isNaN(num) ? 0 : num;
};

// Preserves null (critical for Points Allowed logic)
const cleanNullable = (val: any) => {
    if (val === undefined || val === null || val === "") return null;
    return clean(val);
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const internalWeek = searchParams.get('week') || '19'; 

    if (secret !== 'Touchdown2026') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const weekMapping: Record<string, { apiWeek: string; roundName: string }> = {
      '19': { apiWeek: '1', roundName: 'WildCard' },
      '20': { apiWeek: '2', roundName: 'Divisional' },
      '21': { apiWeek: '3', roundName: 'Conference' },
      '22': { apiWeek: '4', roundName: 'Superbowl' }
    };

    const target = weekMapping[internalWeek];
    if (!target) return NextResponse.json({ error: "Invalid week" }, { status: 400 });

    console.log(`[Sync-Scores] Syncing ${target.roundName} (API Week ${target.apiWeek})...`);

    const scheduleUrl = `https://${API_HOST}/getNFLGamesForWeek?week=${target.apiWeek}&season=2025&seasonType=post`;
    const scheduleRes = await fetch(scheduleUrl, { headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': API_HOST } });
    const scheduleData = await scheduleRes.json();
    const games = scheduleData.body || [];

    if (games.length === 0) return NextResponse.json({ message: "No games found." });

    const batch = writeBatch(db);
    let updateCount = 0;

    for (const game of games) {
      const boxUrl = `https://${API_HOST}/getNFLBoxScore?gameID=${game.gameID}&fantasyPoints=true`;
      const boxRes = await fetch(boxUrl, { headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': API_HOST } });
      const boxData = await boxRes.json();
      
      const awayTeam = boxData.body?.away || game.awayTeam;
      const homeTeam = boxData.body?.home || game.homeTeam;
      const isGameActive = ['Live', 'Completed', 'Final', 'InProgress'].includes(game.gameStatus);
      
      const playerStats = boxData.body?.playerStats || {};
      const dstStats = boxData.body?.DST || {};
      const teamStatsRaw = boxData.body?.teamStats || {}; // Fallback Source

      // --- A. OFFENSE PLAYERS ---
      Object.values(playerStats).forEach((player: any) => {
        if (!player.playerID) return;

        let pos = player.pos || player.position || 'N/A';
        if (pos === 'PK') pos = 'K'; 

        const team = player.team || player.teamAbv || (player.teamID === game.homeTeamID ? homeTeam : awayTeam) || 'FA';
        const name = player.longName || `${player.firstName} ${player.lastName}` || 'Unknown';

        const PassYds = clean(player.Passing?.passYds || player.passing?.passYds || player.Passing?.passYards);
        const PassTD = clean(player.Passing?.passTD || player.passing?.passTD);
        const Int = clean(player.Passing?.int || player.passing?.int);
        const Sacks = clean(player.Passing?.sacked || player.passing?.sacked); 
        const RushYds = clean(player.Rushing?.rushYds || player.rushing?.rushYds);
        const RushTD = clean(player.Rushing?.rushTD || player.rushing?.rushTD);
        const Rec = clean(player.Receiving?.receptions || player.receiving?.receptions);
        const RecYds = clean(player.Receiving?.recYds || player.receiving?.recYds || player.Receiving?.recYards);
        const RecTD = clean(player.Receiving?.recTD || player.receiving?.recTD);
        const Fumbles = clean(player.Defense?.fumblesLost) + clean(player.Rushing?.fumblesLost) + clean(player.Receiving?.fumblesLost);
        const TwoPt = clean(player.twoPointConversions); 
        const FGMade = clean(player.Kicking?.fgMade || player.kicking?.fgMade);
        const FGMissed = clean(player.Kicking?.fgMissed || player.kicking?.fgMissed);
        const XPMade = clean(player.Kicking?.xpMade || player.kicking?.xpMade);
        const XPMissed = clean(player.Kicking?.xpMissed || player.kicking?.xpMissed);

        let baseScore = 
          (PassYds * SCORING_RULES.PASS_YD) + (PassTD * SCORING_RULES.PASS_TD) + (Int * SCORING_RULES.INT) +
          (Sacks * SCORING_RULES.SACK) + (RushYds * SCORING_RULES.RUSH_YD) + (RushTD * SCORING_RULES.RUSH_TD) + 
          (RecYds * SCORING_RULES.REC_YD) + (RecTD * SCORING_RULES.REC_TD) +
          (TwoPt * SCORING_RULES.TWO_PT) + (Fumbles * SCORING_RULES.FUMBLE_LOST) +
          (FGMade * SCORING_RULES.FG_MADE) + (FGMissed * SCORING_RULES.FG_MISSED) +
          (XPMade * SCORING_RULES.XP_MADE) + (XPMissed * SCORING_RULES.XP_MISSED);

        const ppr = Number((baseScore + (Rec * 1.0)).toFixed(2));
        const half = Number((baseScore + (Rec * 0.5)).toFixed(2));
        const std = Number((baseScore + (Rec * 0.0)).toFixed(2));

        let opponent = team === homeTeam ? `vs ${awayTeam}` : `@ ${homeTeam}`;

        const playerRef = doc(db, 'players', player.playerID);
        
        batch.set(playerRef, {
          name, team, position: pos, 
          [target.roundName]: {
             PPR: ppr,
             Half: half,
             Standard: std,
             opponent: opponent,
             Stats: {
                PassYds, PassTD, Int, Sacks, RushYds, RushTD, Rec, RecYds, RecTD, Fumbles, TwoPt, FGMade, FGMissed, XPMade, XPMissed
             }
          }
        }, { merge: true });
        updateCount++;
      });

      // --- B. DEFENSE (DST) ---
      Object.keys(dstStats).forEach((key) => {
        const stats = dstStats[key];
        const realAbv = stats.teamAbv || stats.team;
        if (!realAbv) return;

        const docID = DST_ID_MAP[realAbv] || realAbv;
        const isHome = (realAbv === (boxData.body?.home || game.homeTeam));
        let opponent = isHome ? `vs ${awayTeam}` : `@ ${homeTeam}`;

        const Sacks = clean(stats.sacks || stats.Sacks);
        
        // CHECK ALL KEYS + FALLBACK TO TEAM STATS
        let Ints = clean(stats.interceptions || stats.Interceptions || stats.ints || stats.Ints || stats.defensiveInterceptions);
        
        // FALLBACK: If fantasy object has 0 Ints, check the raw Box Score (teamStats)
        if (Ints === 0 && teamStatsRaw) {
            const side = isHome ? 'home' : 'away';
            const teamDefStats = teamStatsRaw[side]?.defense || {};
            Ints = clean(teamDefStats.interceptions || teamDefStats.ints || teamDefStats.passingInterceptions || 0);
        }

        const FumblesRec = clean(stats.fumblesRecovered || stats.FumblesRecovered || stats.fumbles);
        const Safeties = clean(stats.safeties || stats.Safeties);
        const TDs = clean(stats.defensiveTD || stats.DefensiveTD) + clean(stats.specialTeamsTD);
        const BlockedKicks = clean(stats.blockedKicks || stats.BlockedKicks);
        const Def2Pt = clean(stats.defensiveTwoPointConversions || stats.twoPointConversions);

        // Points Allowed Logic
        let PtsAllowed = cleanNullable(stats.pointsAllowed || stats.PointsAllowed);
        if (PtsAllowed === null) {
             const homeScore = clean(boxData.body?.lineScore?.home?.score || boxData.body?.homePts || game.homeScore);
             const awayScore = clean(boxData.body?.lineScore?.away?.score || boxData.body?.awayPts || game.awayScore);
             PtsAllowed = isHome ? awayScore : homeScore;
        }
        if (PtsAllowed === 0 && !isGameActive) {
            PtsAllowed = null;
        }

        let defScore = 
            (Sacks * SCORING_RULES.DST_SACK) + 
            (Ints * SCORING_RULES.DST_INT) +
            (FumblesRec * SCORING_RULES.DST_FUMBLE_REC) + 
            (Safeties * SCORING_RULES.DST_SAFETY) +
            (TDs * SCORING_RULES.DST_TD) + 
            (BlockedKicks * SCORING_RULES.DST_BLK_KICK) +
            (Def2Pt * SCORING_RULES.DST_RET_XP) +
            getPointsAllowedScore(PtsAllowed); 

        // DEBUG LOG: Dumps all keys found in the object to console
        console.log(`\n[DEBUG ${realAbv}] Keys Found: ${Object.keys(stats).join(', ')}`);
        console.log(`[DEBUG ${realAbv}] Sacks:${Sacks} Ints:${Ints} Fumbles:${FumblesRec} TDs:${TDs} PtsAllowed:${PtsAllowed} -> TOTAL: ${defScore}`);

        const YdsAllowed = clean(stats.ydsAllowed || stats.YdsAllowed);
        const PtsAllowedDisplay = PtsAllowed === null ? 0 : PtsAllowed;

        const dstRef = doc(db, 'players', docID); 
        
        batch.set(dstRef, {
            name: `${realAbv} Defense`, position: 'DEF', team: realAbv,
            [target.roundName]: {
                PPR: defScore,
                Half: defScore,
                Standard: defScore,
                opponent: opponent,
                Stats: { Sacks, Ints, FumblesRec, Safeties, TDs, BlockedKicks, Def2Pt, PtsAllowed: PtsAllowedDisplay, YdsAllowed }
            }
        }, { merge: true });
        updateCount++;
      });
    }

    await batch.commit();
    return NextResponse.json({ success: true, updated: updateCount, round: target.roundName });
  } catch (error: any) {
    console.error("[Sync-Scores] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}