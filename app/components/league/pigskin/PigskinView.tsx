'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, limit, doc } from 'firebase/firestore'; 
import { db } from '@/lib/firebase'; 
import { ChevronLeft, Trophy, Layers, ScrollText, Users, Flame, Play, Info, Check, Globe, Lock, AlertTriangle, Gamepad2, Clock, Ban, Stethoscope } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const GAME_ID = "20260208_NE@SEA";

interface PigskinViewProps {
    leagueData: any;
}

// --- CONFIG: SHAHEED ADDED TO TIER 3 ---
const PLAYER_DB: Record<string, any> = {
    '4431452': { name: 'Drake Maye', team: 'NE', pos: 'QB', num: 10, tier: 1 },
    '4569173': { name: 'Rhamondre Stevenson', team: 'NE', pos: 'RB', num: 38, tier: 1 },
    '2976212': { name: 'Stefon Diggs', team: 'NE', pos: 'WR', num: 14, tier: 2 },
    '3046439': { name: 'Hunter Henry', team: 'NE', pos: 'TE', num: 85, tier: 2 },
    '5000001': { name: 'TreVeyon Henderson', team: 'NE', pos: 'RB', num: 32, tier: 2 },
    '4241478': { name: 'Antonio Gibson', team: 'NE', pos: 'RB', num: 4, tier: 3 },
    '4431526': { name: 'Kayshon Boutte', team: 'NE', pos: 'WR', num: 80, tier: 3 },
    '3052876': { name: 'Mack Hollins', team: 'NE', pos: 'WR', num: 13, tier: 3 },
    '4567048': { name: 'Kenneth Walker III', team: 'SEA', pos: 'RB', num: 9, tier: 1 },
    '4431566': { name: 'Jaxon Smith-Njigba', team: 'SEA', pos: 'WR', num: 11, tier: 1 },
    '3912547': { name: 'Sam Darnold', team: 'SEA', pos: 'QB', num: 14, tier: 3 }, 
    '2977187': { name: 'Cooper Kupp', team: 'SEA', pos: 'WR', num: 10, tier: 2 },
    '4426514': { name: 'George Holani', team: 'SEA', pos: 'RB', num: 28, tier: 2 },
    '4431611': { name: 'AJ Barner', team: 'SEA', pos: 'TE', num: 88, tier: 3 },
    '4684940': { name: 'Rashid Shaheed', team: 'SEA', pos: 'WR', num: 22, tier: 3 },
};

const TIERS_MENU = [
    { id: 1, label: 'Tier 1', color: 'text-red-500', border: 'border-red-500/30', bg: 'bg-red-500/10' },
    { id: 2, label: 'Tier 2', color: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10' },
    { id: 3, label: 'Tier 3', color: 'text-green-500', border: 'border-green-500/30', bg: 'bg-green-500/10' },
];

export default function PigskinView({ leagueData }: PigskinViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'game' | 'log' | 'tiers' | 'info'>('game');
   
  const [members, setMembers] = useState<any[]>([]);
  const [globalPlays, setGlobalPlays] = useState<any[]>([]); 
  const [leagueLogs, setLeagueLogs] = useState<Record<string, any>>({}); 
   
  const [injuredPlayers, setInjuredPlayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [commissionerName, setCommissionerName] = useState<string>('Loading...');
  const [gameFeed, setGameFeed] = useState<any>(null);

  // --- FETCH MEMBERS ---
  useEffect(() => {
    if (!leagueData?.id) return;
    const membersRef = collection(db, 'leagues', leagueData.id, 'Members');
    const unsubscribe = onSnapshot(membersRef, (snapshot) => {
        const fetchedMembers: any[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        if (leagueData.ownerId) {
            const owner = fetchedMembers.find((m) => m.id === leagueData.ownerId);
            setCommissionerName(owner?.username || owner?.displayName || 'Commissioner');
        }
        const sortedMembers = fetchedMembers.sort((a, b) => (parseInt(a.queueOrder) || 999) - (parseInt(b.queueOrder) || 999));
        setMembers(sortedMembers.map((m, i) => ({ ...m, rank: i + 1 })));
        setLoading(false);
    });
    return () => unsubscribe();
  }, [leagueData?.id]);

  // --- GLOBAL FEED ---
  useEffect(() => {
    const interval = setInterval(() => {
        fetch('/api/pigskin/sync').catch(err => console.error("Sync trigger failed", err));
    }, 5000); 

    const feedRef = doc(db, 'system', 'live_feed');
    const unsubscribe = onSnapshot(feedRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setGameFeed(data);
            if (data.allPlayByPlay && Array.isArray(data.allPlayByPlay)) {
                setGlobalPlays(data.allPlayByPlay); 
            }
        }
    });

    return () => {
        clearInterval(interval);
        unsubscribe();
    };
  }, []);

  // --- LEAGUE LOGS ---
  useEffect(() => {
    if (!leagueData?.id) return;
    const logsRef = collection(db, 'leagues', leagueData.id, 'ActivityLogs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const logsMap: Record<string, any> = {};
        snapshot.docs.forEach(doc => {
            logsMap[doc.id] = doc.data(); 
        });
        setLeagueLogs(logsMap);
    });
    return () => unsubscribe();
  }, [leagueData?.id]);

  // --- INJURIES ---
  useEffect(() => {
    const injuryRef = doc(db, 'system', 'pigskin_injuries');
    const unsubscribe = onSnapshot(injuryRef, (docSnap) => {
        if (docSnap.exists()) {
            setInjuredPlayers(docSnap.data().playerIds || []);
        } else {
            setInjuredPlayers([]);
        }
    });
    return () => unsubscribe();
  }, []);

  // --- SCORE CALCULATOR ---
  const { homeScore, awayScore } = useMemo(() => {
    let home = 0;
    let away = 0;

    globalPlays.forEach(play => {
        const text = (play.play || "").toLowerCase();
        const stats = play.playerStats || {};
        const pid = Object.keys(stats)[0]; 
        const player = PLAYER_DB[pid];

        if (!player) return; 

        let points = 0;
        if (text.includes("touchdown")) points = 6; 
        else if (text.includes("field goal") && text.includes("good")) points = 3;
        else if (text.includes("extra point") && text.includes("good")) points = 1;
        else if (text.includes("safety")) points = 2;

        if (points > 0) {
            if (player.team === 'NE') home += points;
            else if (player.team === 'SEA') away += points;
        }
    });

    return { homeScore: home, awayScore: away };
  }, [globalPlays]);


  const copyLeagueCode = () => {
    if (leagueData?.joinCode) {
        navigator.clipboard.writeText(leagueData.joinCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  const getTierColor = (tier: number) => {
      switch(tier) {
          case 1: return 'text-red-500';
          case 2: return 'text-yellow-400';
          case 3: return 'text-green-500';
          default: return 'text-slate-200';
      }
  };

  const findOwnerName = (playerId: string) => {
      if (!playerId) return null;
      const owner = members.find(m => {
        let rawPlayerIds: string[] = [];
        if (m.lineup) {
            if (Array.isArray(m.lineup)) {
                const lastEntry = m.lineup[m.lineup.length - 1];
                rawPlayerIds = lastEntry?.players || [];
            } else {
                const keys = Object.keys(m.lineup).map(Number).sort((a,b) => b-a);
                const lastKey = keys[0];
                if (lastKey !== undefined) {
                    rawPlayerIds = m.lineup[String(lastKey)]?.players || [];
                }
            }
        }
        return rawPlayerIds.includes(playerId);
      });
      return owner ? owner.username : null;
  };

  const renderInfoContent = () => (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto pt-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2"><Info size={16} className="text-orange-500" /> League Details</h2>
                {leagueData?.privacy === 'Public' ? <span className="text-[10px] font-bold text-green-500 uppercase flex items-center gap-1"><Globe size={12} /> Public</span> : <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Lock size={12} /> Private</span>}
            </div>
            <div className="p-6 space-y-6">
                <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-500">League Join Code</label><div className="flex items-center gap-2"><div className="flex-1 bg-black/40 border border-slate-700 rounded-lg p-3 text-sm font-mono font-bold text-orange-400 tracking-wider">{leagueData?.joinCode || 'LOADING...'}</div><button onClick={copyLeagueCode} className="p-3 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-white">{copied ? <Check size={18} className="text-green-500" /> : <Layers size={18} />}</button></div></div>
            </div>
        </div>
    </div>
  );

  const renderGameContent = () => (
    <div className="space-y-4 animate-in fade-in duration-300">
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-0.5 shadow-lg">
            <div className="bg-[#0f0a05] rounded-[0.9rem] p-4 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 to-transparent"></div>
                <div className="relative z-10 flex items-center gap-3">
                    <Trophy className="text-orange-500" size={24} />
                    <div><h2 className="text-lg font-black uppercase italic tracking-tighter text-white">Super Bowl LX</h2><p className="text-orange-200/60 text-[10px] font-bold leading-tight">NE vs SEA</p></div>
                </div>
                {gameFeed ? (
                    <div className="relative z-10 flex items-center gap-4 bg-black/40 p-2 rounded-lg border border-white/10">
                        <div className="text-center">
                            <div className="text-2xl font-black text-white leading-none">{awayScore}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase">SEA</div>
                        </div>
                        <div className="text-xs font-black text-orange-500">VS</div>
                        <div className="text-center">
                            <div className="text-2xl font-black text-white leading-none">{homeScore}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase">NE</div>
                        </div>
                        <div className="h-8 w-px bg-white/10 mx-1"></div>
                        <div className="flex flex-col items-center min-w-[50px]"><div className="text-sm font-mono font-bold text-green-400 flex items-center gap-1">{gameFeed.clock || "00:00"}</div><div className="text-[9px] font-bold text-slate-400 uppercase">{gameFeed.period || "PRE"}</div></div>
                    </div>
                ) : (
                    <div className="relative z-10 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-black/20 px-3 py-1 rounded-full">Waiting for kickoff...</div>
                )}
            </div>
        </div>

        <div className="space-y-3">
            {members.map((member, index) => {
                const isPigskinHolder = index === 0;
                const isQueue = index > 1;
                let rawPlayerIds: string[] = [];
                if (member.lineup) {
                    if (Array.isArray(member.lineup)) {
                        const lastEntry = member.lineup[member.lineup.length - 1];
                        rawPlayerIds = lastEntry?.players || [];
                    } else {
                        const keys = Object.keys(member.lineup).map(Number).sort((a,b) => b-a);
                        const lastKey = keys[0];
                        if (lastKey !== undefined) {
                            rawPlayerIds = member.lineup[String(lastKey)]?.players || [];
                        }
                    }
                }
                const players = rawPlayerIds.map(pid => ({ ...PLAYER_DB[pid], id: pid })).filter(p => p.name).sort((a, b) => a.tier - b.tier);

                if (!isQueue) {
                    const badgeColor = isPigskinHolder ? 'bg-gradient-to-r from-red-600 via-orange-500 to-red-600 text-white shadow-lg' : 'bg-yellow-500/20 text-yellow-400';
                    const badgeText = isPigskinHolder ? 'Pigskin Holder' : 'On Deck';
                    return (
                        <div key={member.id} className={`relative rounded-2xl p-px transition-all overflow-hidden ${isPigskinHolder ? 'mb-4 scale-[1.02]' : ''}`}>
                            {isPigskinHolder && <div className="absolute -inset-1 rounded-2xl real-fire-bg blur-lg opacity-80 z-0"></div>}
                            <div className={`relative z-10 rounded-[0.9rem] overflow-hidden bg-[#020617] border ${isPigskinHolder ? 'border-orange-500/50' : 'border-slate-800'} h-full`}>
                                <div className={`absolute top-0 inset-x-0 ${badgeColor} text-[9px] font-black uppercase tracking-widest py-1 text-center flex items-center justify-center gap-2`}>{isPigskinHolder && <Flame size={10} fill="currentColor" />} {badgeText} {isPigskinHolder && <Flame size={10} fill="currentColor" />}</div>
                                <div className="p-3 mt-4 flex justify-between items-center border-b border-slate-800/50">
                                    <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-md flex items-center justify-center font-black text-[10px] bg-slate-800 text-slate-400">#{member.rank}</div><div className="font-bold text-white text-xs">{member.username}</div></div>
                                    <div className="text-lg font-black text-white">{Math.round(member.scores?.Total || 0)}</div>
                                </div>
                                <div className="p-2">
                                    {players.length > 0 ? <div className="grid grid-cols-3 gap-1.5">{players.map((p: any, idx: number) => {
                                            const isOut = injuredPlayers.includes(p.id);
                                            let cardClasses = 'bg-slate-900 border-slate-800';
                                            if (p.tier === 1) cardClasses = 'bg-gradient-to-br from-red-950/40 to-slate-950 border-red-500/50 shadow-[inset_0_0_10px_rgba(220,38,38,0.2)]';
                                            if (p.tier === 2) cardClasses = 'bg-gradient-to-br from-yellow-950/40 to-slate-950 border-yellow-500/50 shadow-[inset_0_0_10px_rgba(234,179,8,0.2)]';
                                            if (p.tier === 3) cardClasses = 'bg-gradient-to-br from-green-950/40 to-slate-950 border-green-500/50 shadow-[inset_0_0_10px_rgba(34,197,94,0.2)]';
                                            
                                            return (
                                                    <div key={idx} className={`rounded-lg border relative overflow-hidden group shadow-md ${cardClasses} p-1.5 h-14 flex flex-col justify-center transition-all`}>
                                                        {isOut && <div className="absolute top-0 right-0 bg-red-600 text-[6px] font-black px-1 rounded-bl-sm z-20 animate-pulse flex items-center gap-0.5"><Stethoscope size={6} /> OUT</div>}
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"><span className={`text-4xl font-black opacity-10 select-none -rotate-12 ${getTierColor(p.tier)}`}>{p.num}</span></div>
                                                        <div className="relative z-10 flex flex-col items-center justify-center gap-0.5">
                                                            <div className="flex w-full justify-between items-center text-[7px] font-black uppercase text-slate-500 px-1"><span>{p.pos}</span><span>{p.team}</span></div>
                                                            <div className={`text-[9px] font-black leading-tight w-full truncate text-center ${isOut ? 'text-red-500' : getTierColor(p.tier)}`}>{p.name.split(' ').slice(1).join(' ')}</div>
                                                        </div>
                                                    </div>
                                            )
                                    })}</div> : <div className="p-4 text-center text-slate-600 text-[10px] font-bold">No Players Assigned</div>}
                                </div>
                            </div>
                        </div>
                    );
                }
                return (
                    <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-black text-xs text-slate-500">#{member.rank}</div>
                        <div className="flex-1"><div className="flex justify-between items-center mb-1.5"><span className="text-xs font-bold text-slate-300">{member.username}</span><span className="text-xs font-black text-slate-500">{Math.round(member.scores?.Total || 0)}</span></div></div>
                    </div>
                );
            })}
        </div>
    </div>
  );

  const renderTiersContent = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-10">
        <div className="px-2"><h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Assignment Pool</h2></div>
        {TIERS_MENU.map((tier) => (
            <div key={tier.id} className={`rounded-2xl border ${tier.border} ${tier.bg} overflow-hidden`}>
                <div className="px-4 py-3 border-b border-inherit bg-black/20 flex justify-between items-center"><span className={`text-xs font-black uppercase tracking-widest ${tier.color}`}>{tier.label}</span></div>
                <div className="p-1 grid grid-cols-1 gap-1">
                    {Object.keys(PLAYER_DB).filter((pid) => PLAYER_DB[pid].tier === tier.id).map((pid) => {
                        const isOut = injuredPlayers.includes(pid);
                        return (
                            <div key={pid} className="w-full px-3 py-2 rounded-lg flex items-center justify-between text-left bg-transparent">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full border flex flex-col items-center justify-center ${isOut ? 'border-red-500 bg-red-950/20' : 'border-slate-600 bg-slate-800'}`}>
                                        <span className={`text-[9px] font-black leading-none ${isOut ? 'text-red-500' : 'text-slate-300'}`}>{isOut ? 'OUT' : PLAYER_DB[pid].num}</span>
                                    </div>
                                    <div>
                                        <div className={`text-xs font-bold ${isOut ? 'text-red-500' : getTierColor(PLAYER_DB[pid].tier)}`}>{PLAYER_DB[pid].name}</div>
                                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-500">#{PLAYER_DB[pid].num} • {PLAYER_DB[pid].team} • {PLAYER_DB[pid].pos}</div>
                                    </div>
                                </div>
                                {isOut && <Ban size={14} className="text-red-600" />}
                            </div>
                        );
                    })}
                </div>
            </div>
        ))}
    </div>
  );

  const renderLogContent = () => {
    const displayPlays = [...globalPlays].reverse();

    return (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Play-by-Play</h2>
                <span className="text-[10px] font-bold text-green-500 animate-pulse">● Live</span>
            </div>
            
            <div className="space-y-3">
                {displayPlays.length > 0 ? displayPlays.map((play, i) => {
                    const playId = `play_${String((globalPlays.length - 1) - i).padStart(3, '0')}`;
                    const playText = play.play?.toLowerCase() || "";
                    const isNullPlay = playText.includes("kick") || playText.includes("punt") || playText.includes("field goal") || playText.includes("touchback") || playText.includes("timeout") || playText.includes("end");
                    
                    const leagueResult = leagueLogs[playId]; 
                    const stats = play.playerStats || {};
                    const playerId = Object.keys(stats)[0];
                    const ownerName = findOwnerName(playerId); 
                    
                    let statusLabel = "PROCESSING...";
                    let statusColor = "text-slate-600 animate-pulse";
                    let cardBorder = "border-slate-800 dashed";
                    let cardBg = "bg-slate-900"; 
                    
                    if (leagueResult) {
                        if (leagueResult.type === 'burn') {
                            statusLabel = `${leagueResult.message}`;
                            statusColor = "text-red-500";
                            cardBorder = "border-red-500/50";
                            cardBg = "bg-red-950/10";
                        } else if (leagueResult.type === 'score') {
                            statusLabel = `${leagueResult.message}`;
                            statusColor = "text-green-400";
                            cardBorder = "border-green-500/50";
                            cardBg = "bg-green-950/10";
                        } else if (leagueResult.type === 'neutral') {
                            statusLabel = "GAME UPDATE";
                            statusColor = "text-slate-600";
                            cardBorder = "border-slate-800";
                            cardBg = "bg-slate-900";
                        }
                    } else if (ownerName) {
                        if (!isNullPlay) {
                            statusLabel = `${ownerName} +1`;
                            statusColor = "text-orange-400"; 
                            cardBorder = "border-slate-700";
                        } else {
                            statusLabel = "GAME UPDATE";
                            statusColor = "text-slate-600";
                            cardBorder = "border-slate-800";
                        }
                    } else if (isNullPlay) {
                        statusLabel = "GAME UPDATE";
                        statusColor = "text-slate-600";
                        cardBorder = "border-slate-800";
                    }

                    return (
                        <div key={playId} className={`rounded-xl border ${cardBorder} ${cardBg} p-3 transition-all`}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                                    {play.playPeriod} {play.playClock}
                                </span>
                                <div className={`text-[9px] font-black uppercase tracking-widest ${statusColor} flex items-center gap-1.5`}>
                                    {leagueResult?.type === 'burn' && <Flame size={10} fill="currentColor" />}
                                    {statusLabel}
                                </div>
                            </div>
                            <p className="text-xs font-bold text-slate-300 leading-relaxed">
                                {play.play}
                            </p>
                        </div>
                    );
                }) : <div className="p-6 text-center text-slate-500 text-xs">Waiting for plays...</div>}
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans">
        <div className="sticky top-0 z-50 bg-[#020617]/95 backdrop-blur-xl border-b border-orange-500/20 shadow-lg shadow-orange-500/5">
            <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
                <div className="flex items-center gap-3"><button onClick={() => router.push('/hub')} className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/5"><ChevronLeft size={20} /></button><div className="flex items-center gap-1.5 text-orange-500 text-[9px] font-black uppercase tracking-widest mb-0.5"><Flame size={10} fill="currentColor" /> Pass The Pigskin</div></div>
            </div>
            <div className="px-4 pb-4 md:px-8 flex flex-col md:flex-row items-center md:items-end justify-between gap-3">
                <div className="flex-1"><h1 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter text-white leading-none break-words max-w-4xl text-center md:text-left">{leagueData.name}</h1><div className="hidden md:flex items-center gap-4 mt-2"><button onClick={() => setActiveTab('game')} className={`text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'game' ? 'text-orange-500' : 'text-slate-500 hover:text-white'}`}>Game Arena</button><button onClick={() => setActiveTab('info')} className={`text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'info' ? 'text-orange-500' : 'text-slate-500 hover:text-white'}`}>League Info</button></div></div>
                <div className="hidden md:block"><Link href="/how-to-play" className="flex items-center gap-2 text-orange-500 hover:text-white transition-colors pb-1 group cursor-pointer"><span className="text-[10px] font-black uppercase tracking-widest underline decoration-orange-500/30 underline-offset-4 group-hover:decoration-white transition-all">How to Play</span><Play size={14} fill="currentColor" /></Link></div>
            </div>
            <div className="md:hidden max-w-2xl mx-auto px-4 pb-2"><div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800"><button onClick={() => setActiveTab('game')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'game' ? 'bg-orange-500 text-[#020617] shadow-lg' : 'text-slate-500 hover:text-white'}`}><Gamepad2 size={14} /> Scoreboard</button><button onClick={() => setActiveTab('log')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'log' ? 'bg-orange-500 text-[#020617] shadow-lg' : 'text-slate-500 hover:text-white'}`}><ScrollText size={14} /> Log</button><button onClick={() => setActiveTab('tiers')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'tiers' ? 'bg-orange-500 text-[#020617] shadow-lg' : 'text-slate-500 hover:text-white'}`}><Layers size={14} /> Tiers</button><button onClick={() => setActiveTab('info')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'info' ? 'bg-orange-500 text-[#020617] shadow-lg' : 'text-slate-500 hover:text-white'}`}><Info size={14} /></button></div></div>
        </div>
        <main className="max-w-[1400px] mx-auto px-4 py-6">
            <div className="md:hidden">
                {activeTab === 'game' && renderGameContent()}
                {activeTab === 'log' && renderLogContent()}
                {activeTab === 'tiers' && renderTiersContent()}
                {activeTab === 'info' && renderInfoContent()}
            </div>
            <div className="hidden md:block">
                {activeTab === 'info' ? renderInfoContent() : (
                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-3 border-r border-slate-800/50 pr-6">{renderTiersContent()}</div>
                        <div className="col-span-6">{renderGameContent()}</div>
                        <div className="col-span-3 border-l border-slate-800/50 pl-6 h-[calc(100vh-200px)] overflow-y-auto no-scrollbar">{renderLogContent()}</div>
                    </div>
                )}
            </div>
        </main>
        <style jsx>{`@keyframes risingFire { 0% { background-position: 0% 0%; } 100% { background-position: 0% 200%; } } .real-fire-bg { background: linear-gradient(to top, #7f1d1d, #ef4444, #f97316, #eab308, #ef4444, #7f1d1d); background-size: 100% 200%; animation: risingFire 1.5s linear infinite; }`}</style>
    </div>
  );
}