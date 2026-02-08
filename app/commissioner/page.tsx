'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, writeBatch, onSnapshot, setDoc, getDoc } from 'firebase/firestore'; 
import { db } from '@/lib/firebase'; 
// ADDED 'Check' to imports
import { Shield, RefreshCw, Trash2, Shuffle, AlertTriangle, CheckCircle, Trophy, Activity, Users, Stethoscope, Ban, Save, Check } from 'lucide-react';

const GAME_ID = "20260208_NE@SEA";

// --- 1. CONFIGURATION (MATCHING API & PIGSKIN VIEW) ---
const TIERS_CONFIG = {
    // TIER 1: Stars (Maye, Stevenson, Walker, JSN)
    1: ['4431452', '4569173', '4567048', '4431566'],
    
    // TIER 2: Starters (Diggs, Henry, Henderson, Kupp, Holani)
    2: ['2976212', '3046439', '5000001', '2977187', '4426514'],
    
    // TIER 3: Role Players (Gibson, Boutte, Hollins, Slye, Barner, Myers, Darnold)
    3: ['4241478', '4431526', '3052876', '3931390', '4431611', '2473037', '3912547']
};

// --- 2. PLAYER DATABASE (For Injury Selectors) ---
const PLAYER_DB: Record<string, any> = {
    '4431452': { name: 'Drake Maye', team: 'NE', pos: 'QB', num: 10 },
    '4569173': { name: 'Rhamondre Stevenson', team: 'NE', pos: 'RB', num: 38 },
    '2976212': { name: 'Stefon Diggs', team: 'NE', pos: 'WR', num: 14 },
    '3046439': { name: 'Hunter Henry', team: 'NE', pos: 'TE', num: 85 },
    '5000001': { name: 'TreVeyon Henderson', team: 'NE', pos: 'RB', num: 32 },
    '4241478': { name: 'Antonio Gibson', team: 'NE', pos: 'RB', num: 4 },
    '4431526': { name: 'Kayshon Boutte', team: 'NE', pos: 'WR', num: 80 },
    '3052876': { name: 'Mack Hollins', team: 'NE', pos: 'WR', num: 13 },
    '4567048': { name: 'Kenneth Walker III', team: 'SEA', pos: 'RB', num: 9 },
    '4431566': { name: 'Jaxon Smith-Njigba', team: 'SEA', pos: 'WR', num: 11 },
    '3912547': { name: 'Sam Darnold', team: 'SEA', pos: 'QB', num: 14 },
    '2977187': { name: 'Cooper Kupp', team: 'SEA', pos: 'WR', num: 10 },
    '4426514': { name: 'George Holani', team: 'SEA', pos: 'RB', num: 28 },
    '4431611': { name: 'AJ Barner', team: 'SEA', pos: 'TE', num: 88 }
};

export default function CommissionerPage() {
  const [stats, setStats] = useState({ leagues: 0, users: 0, plays: 0 });
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [injuredPlayers, setInjuredPlayers] = useState<string[]>([]);
  const [savingInjury, setSavingInjury] = useState(false);

  // --- DASHBOARD STATS ---
  useEffect(() => {
    const fetchStats = async () => {
        const leaguesSnap = await getDocs(collection(db, 'leagues'));
        const feedSnap = await getDoc(doc(db, 'system', 'live_feed'));
        const playCount = feedSnap.exists() ? (feedSnap.data().allPlayByPlay?.length || 0) : 0;

        setStats({
            leagues: leaguesSnap.size,
            users: 0, 
            plays: playCount
        });
    };
    fetchStats();
  }, [loading]);

  // --- INJURIES LISTENER ---
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system', 'pigskin_injuries'), (docSnap) => {
        if (docSnap.exists()) setInjuredPlayers(docSnap.data().playerIds || []);
    });
    return () => unsub();
  }, []);

  const toggleInjury = async (playerId: string) => {
      setSavingInjury(true);
      try {
          const newInjuries = injuredPlayers.includes(playerId)
              ? injuredPlayers.filter(id => id !== playerId)
              : [...injuredPlayers, playerId];

          await setDoc(doc(db, 'system', 'pigskin_injuries'), { 
              playerIds: newInjuries,
              lastUpdated: new Date()
          }, { merge: true });
      } catch (error: any) {
          alert(`Error: ${error.message}`);
      }
      setSavingInjury(false);
  };

  // --- ACTION: RESET GAME ---
  const handleResetGame = async () => {
      if (!confirm("⚠️ PIGSKIN RESET \n\nThis will:\n1. ERASE the 'allPlayByPlay' array.\n2. Reset Scoreboard to 0-0.\n3. WIPE SCORES for 'Pigskin' leagues.\n\nAre you sure?")) return;
      
      setLoading(true);
      setStatusMsg("Starting Pigskin Reset...");

      try {
          const batch = writeBatch(db);

          // 1. Reset Live Feed
          const feedRef = doc(db, 'system', 'live_feed');
          batch.set(feedRef, {
              gameID: GAME_ID,
              homeScore: 0,
              awayScore: 0,
              clock: "15:00",
              period: "PRE",
              lastPlay: { play: "Waiting for kickoff..." },
              allPlayByPlay: [], 
              lastUpdated: new Date()
          });

          // 2. Wipe Pigskin Member Scores
          const leaguesRef = collection(db, 'leagues');
          const leaguesSnap = await getDocs(leaguesRef);
          let membersReset = 0;

          for (const leagueDoc of leaguesSnap.docs) {
              // RESET LEAGUE INDEX TRACKER
              batch.update(leagueDoc.ref, { lastPlayIndex: -1 });

              if (leagueDoc.data().gameMode === 'pigskin') {
                  const membersRef = collection(db, 'leagues', leagueDoc.id, 'Members');
                  const membersSnap = await getDocs(membersRef);
                  
                  if (!membersSnap.empty) {
                      membersSnap.docs.forEach((memDoc) => {
                          batch.update(memDoc.ref, { 
                              "scores.Total": 0,
                              "lineup": [] 
                          });
                          membersReset++;
                      });
                  }
                  
                  // Clear Logs Collection
                  const logsRef = collection(db, 'leagues', leagueDoc.id, 'ActivityLogs');
                  const logsSnap = await getDocs(logsRef);
                  logsSnap.forEach((logDoc) => {
                      batch.delete(logDoc.ref);
                  });
              }
          }

          // 3. Clear System Games Collection
          const systemGamesRef = collection(db, 'system', 'games', GAME_ID);
          const systemGamesSnap = await getDocs(systemGamesRef);
          systemGamesSnap.forEach((doc) => {
              batch.delete(doc.ref);
          });

          await batch.commit();
          setStatusMsg(`✅ PIGSKIN RESET COMPLETE: Logs cleared. Reset ${membersReset} players.`);
      } catch (error: any) {
          console.error(error);
          setStatusMsg(`❌ Error: ${error.message}`);
      }
      setLoading(false);
  };

  // --- ACTION: SHUFFLE & RE-DEAL ---
  const handleRandomizeAll = async () => {
      if (!confirm("🎲 GLOBAL SHUFFLE & RE-DEAL\n\nThis will:\n1. Shuffle the order of ALL Pigskin leagues.\n2. Deal new cards to Rank 1 (Holder) AND Rank 2 (On Deck).\n\nAre you sure?")) return;

      setLoading(true);
      setStatusMsg("Shuffling & Re-dealing...");

      try {
          const leaguesRef = collection(db, 'leagues');
          const leaguesSnap = await getDocs(leaguesRef);
          let totalShuffled = 0;

          for (const leagueDoc of leaguesSnap.docs) {
              const leagueData = leagueDoc.data();

              if (leagueData.gameMode === 'pigskin') {
                  const membersRef = collection(db, 'leagues', leagueDoc.id, 'Members');
                  const membersSnap = await getDocs(membersRef);
                  
                  if (membersSnap.empty) continue;

                  const batch = writeBatch(db);
                  let memberIds = membersSnap.docs.map(doc => doc.id);
                  
                  // 1. Fisher-Yates Shuffle
                  for (let i = memberIds.length - 1; i > 0; i--) {
                      const j = Math.floor(Math.random() * (i + 1));
                      [memberIds[i], memberIds[j]] = [memberIds[j], memberIds[i]];
                  }

                  // 2. Assign Order & Deal Cards
                  memberIds.forEach((memberId, index) => {
                      const memberRef = doc(db, 'leagues', leagueDoc.id, 'Members', memberId);
                      const rank = index + 1;
                      let newLineup: any[] = [];

                      // --- DEAL LOGIC: Rank 1 AND Rank 2 get cards ---
                      if (rank === 1 || rank === 2) {
                          // Guaranteed 1 player from each Tier
                          const p1 = TIERS_CONFIG[1].filter(id => !injuredPlayers.includes(id)).sort(() => 0.5 - Math.random())[0];
                          const p2 = TIERS_CONFIG[2].filter(id => !injuredPlayers.includes(id)).sort(() => 0.5 - Math.random())[0];
                          const p3 = TIERS_CONFIG[3].filter(id => !injuredPlayers.includes(id)).sort(() => 0.5 - Math.random())[0];
                          
                          if (p1 && p2 && p3) {
                              newLineup = [{ turn: Date.now().toString(), players: [p1, p2, p3] }];
                          }
                      }

                      batch.update(memberRef, { 
                          queueOrder: rank,
                          lineup: newLineup, 
                          lastShuffled: new Date() 
                      });
                  });

                  await batch.commit();
                  totalShuffled += memberIds.length;
              }
          }

          setStatusMsg(`✅ Success! Shuffled & dealt to top 2 players in ${totalShuffled} leagues.`);

      } catch (error: any) {
          console.error(error);
          setStatusMsg(`❌ Error: ${error.message}`);
      }
      setLoading(false);
  };

  const handleUpdateLeaderboards = async () => {
      setLoading(true);
      setStatusMsg("⏳ Calculating Plague Scores...");
      try {
          const response = await fetch('/api/commissioner/update-scores', { method: 'POST' });
          const data = await response.json();
          if (data.success) {
              setStatusMsg(`✅ Updated ${data.count} Plague/Fantasy players.`);
          } else {
              setStatusMsg(`❌ Server Error: ${data.error}`);
          }
      } catch (error: any) {
          setStatusMsg(`❌ Network Error: ${error.message}`);
      }
      setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-8 font-sans">
        <div className="max-w-6xl mx-auto space-y-8">
            
            {/* HEADER */}
            <div className="flex items-center gap-4 border-b border-slate-700 pb-6">
                <div className="p-3 bg-red-600 rounded-xl shadow-lg shadow-red-900/20">
                    <Shield size={32} className="text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Commissioner Console</h1>
                    <p className="text-slate-500 font-bold">System Administration & Game Controls</p>
                </div>
            </div>

            {/* STATUS MESSAGE */}
            {statusMsg && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${statusMsg.includes('Success') || statusMsg.includes('COMPLETE') || statusMsg.includes('Updated') ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
                    {statusMsg.includes('Success') || statusMsg.includes('COMPLETE') || statusMsg.includes('Updated') ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    <span className="font-bold">{statusMsg}</span>
                </div>
            )}

            {/* STATS */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col items-center shadow-lg">
                    <Trophy className="text-yellow-500 mb-2" />
                    <div className="text-3xl font-black text-white">{stats.leagues}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Active Leagues</div>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col items-center shadow-lg">
                    <Activity className="text-blue-500 mb-2" />
                    <div className="text-3xl font-black text-white">{stats.plays}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Logged Plays</div>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col items-center shadow-lg">
                    <Users className="text-green-500 mb-2" />
                    <div className="text-3xl font-black text-white">--</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Users</div>
                </div>
            </div>

            {/* MAIN ACTIONS */}
            <div className="grid md:grid-cols-3 gap-6">
                
                {/* 1. RESET (Pigskin) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <RefreshCw className="text-orange-500" />
                        <h2 className="text-lg font-black text-white uppercase">Game Control</h2>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Clear all game logs & reset scores. <strong>(Pigskin Only)</strong>
                    </p>
                    <button onClick={handleResetGame} disabled={loading} className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02] transition-transform">
                        {loading ? <RefreshCw className="animate-spin" /> : <Trash2 size={18} />} Reset Pigskin
                    </button>
                </div>

                {/* 2. SHUFFLE (Pigskin) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <Shuffle className="text-purple-500" />
                        <h2 className="text-lg font-black text-white uppercase">Randomizer</h2>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Shuffle player queue order & <strong>Deal to Top 2</strong>.
                    </p>
                    <button onClick={handleRandomizeAll} disabled={loading} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02] transition-transform">
                        {loading ? <RefreshCw className="animate-spin" /> : <Shuffle size={18} />} Shuffle & Deal
                    </button>
                </div>

                {/* 3. UPDATE SCORES (Plague) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <Save className="text-green-500" />
                        <h2 className="text-lg font-black text-white uppercase">Leaderboards</h2>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Calculate fantasy points for <strong>Plague/Fantasy</strong> leagues.
                    </p>
                    <button onClick={handleUpdateLeaderboards} disabled={loading} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02] transition-transform">
                        {loading ? <RefreshCw className="animate-spin" /> : <Save size={18} />} Update Scores
                    </button>
                </div>

            </div>

            {/* INJURY REPORT */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                    <Stethoscope className="text-red-500" />
                    <div>
                        <h2 className="text-lg font-black text-white uppercase">Injury Report</h2>
                        <p className="text-xs text-slate-500">Mark players as OUT to remove them from the Pigskin assignment pool.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(PLAYER_DB).map(([pid, player]: [string, any]) => {
                        const isInjured = injuredPlayers.includes(pid);
                        return (
                            <button
                                key={pid}
                                onClick={() => toggleInjury(pid)}
                                disabled={savingInjury}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isInjured ? 'bg-red-950/20 border-red-500/50' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${isInjured ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                        {player.num}
                                    </div>
                                    <div className="text-left">
                                        <div className={`text-sm font-bold ${isInjured ? 'text-red-400 line-through' : 'text-slate-200'}`}>{player.name}</div>
                                        <div className="text-[10px] font-black text-slate-500">{player.team} • {player.pos}</div>
                                    </div>
                                </div>
                                {isInjured ? <Ban size={18} className="text-red-500" /> : <Check size={18} className="text-slate-600" />}
                            </button>
                        );
                    })}
                </div>
            </div>

        </div>
    </div>
  );
}