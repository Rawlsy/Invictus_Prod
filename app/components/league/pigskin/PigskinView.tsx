'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, serverTimestamp, doc, writeBatch } from 'firebase/firestore'; 
import { db } from '@/lib/firebase'; 
import { ChevronLeft, Trophy, Layers, Sparkles, ScrollText, Users, Flame, Play, Ban, Stethoscope, Info, Copy, Check, Globe, Lock, AlertTriangle, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PigskinViewProps {
    leagueData: any;
}

// --- 1. SUPER BOWL LX PLAYER DATABASE ---
const PLAYER_DB: Record<string, any> = {
    // PATRIOTS
    'ne-maye':      { name: 'Drake Maye', team: 'NE', pos: 'QB', num: 10, tier: 1 },
    'ne-stevenson': { name: 'Rhamondre Stevenson', team: 'NE', pos: 'RB', num: 38, tier: 1 },
    'ne-diggs':     { name: 'Stefon Diggs', team: 'NE', pos: 'WR', num: 14, tier: 2 },
    'ne-henry':     { name: 'Hunter Henry', team: 'NE', pos: 'TE', num: 85, tier: 2 },
    'ne-henderson': { name: 'TreVeyon Henderson', team: 'NE', pos: 'RB', num: 31, tier: 2 },
    'ne-gibson':    { name: 'Antonio Gibson', team: 'NE', pos: 'RB', num: 4, tier: 3 },
    'ne-boutte':    { name: 'Kayshon Boutte', team: 'NE', pos: 'WR', num: 80, tier: 3 },
    'ne-hollins':   { name: 'Mack Hollins', team: 'NE', pos: 'WR', num: 13, tier: 3 },

    // SEAHAWKS
    'sea-walker':   { name: 'Kenneth Walker III', team: 'SEA', pos: 'RB', num: 9, tier: 1 },
    'sea-jsn':      { name: 'Jaxon Smith-Njigba', team: 'SEA', pos: 'WR', num: 11, tier: 1 },
    'sea-kupp':     { name: 'Cooper Kupp', team: 'SEA', pos: 'WR', num: 10, tier: 2 },
    'sea-holani':   { name: 'George Holani', team: 'SEA', pos: 'RB', num: 28, tier: 2 },
    'sea-darnold':  { name: 'Sam Darnold', team: 'SEA', pos: 'QB', num: 14, tier: 3 },
    'sea-barner':   { name: 'AJ Barner', team: 'SEA', pos: 'TE', num: 88, tier: 3 },
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
  const [logs, setLogs] = useState<any[]>([]);
  const [injuredPlayers, setInjuredPlayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [commissionerName, setCommissionerName] = useState<string>('Loading...');

  // --- DATA FETCHING ---
  
  // 1. Members & Commissioner Check
  useEffect(() => {
    if (!leagueData?.id) return;
    const membersRef = collection(db, 'leagues', leagueData.id, 'Members');
    const unsubscribe = onSnapshot(membersRef, (snapshot) => {
        // FIX: Explicitly type as any[] to avoid TypeScript build errors
        const fetchedMembers: any[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Find Commissioner from Members List
        if (leagueData.ownerId) {
            const owner = fetchedMembers.find((m) => m.id === leagueData.ownerId);
            if (owner) {
                setCommissionerName(owner.username || 'Commissioner');
            } else {
                setCommissionerName('Unknown');
            }
        }

        const sorted = fetchedMembers.sort((a: any, b: any) => {
            const orderA = a.queueOrder ?? 999;
            const orderB = b.queueOrder ?? 999;
            if (orderA !== orderB) return orderA - orderB;
            return (b.scores?.Total || 0) - (a.scores?.Total || 0);
        });
        setMembers(sorted.map((m, i) => ({ ...m, rank: i + 1 })));
        setLoading(false);
    }, (error) => {
        console.error("Error fetching members:", error);
    });
    return () => unsubscribe();
  }, [leagueData?.id, leagueData?.ownerId]);

  // 2. Logs
  useEffect(() => {
    if (!leagueData?.id) return;
    const logsRef = collection(db, 'leagues', leagueData.id, 'ActivityLogs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedLogs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setLogs(fetchedLogs);
    }, (error) => {
        console.error("Error fetching logs:", error);
    });
    return () => unsubscribe();
  }, [leagueData?.id]);

  // 3. GLOBAL PIGSKIN INJURIES
  useEffect(() => {
    const injuryRef = doc(db, 'system', 'pigskin_injuries');
    const unsubscribe = onSnapshot(injuryRef, (docSnap) => {
        if (docSnap.exists()) {
            setInjuredPlayers(docSnap.data().playerIds || []);
        } else {
            setInjuredPlayers([]);
        }
    }, (error) => {
        console.error("Error fetching global injuries:", error);
    });
    return () => unsubscribe();
  }, []);

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

  const renderInfoContent = () => (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto pt-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                    <Info size={16} className="text-orange-500" /> League Details
                </h2>
                {leagueData?.privacy === 'Public' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase"><Globe size={12} /> Public</span>
                ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase"><Lock size={12} /> Private</span>
                )}
            </div>
            <div className="p-6 space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">League Join Code</label>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-black/40 border border-slate-700 rounded-lg p-3 text-sm font-mono font-bold text-orange-400 tracking-wider">
                            {leagueData?.joinCode || 'LOADING...'}
                        </div>
                        <button 
                            onClick={copyLeagueCode}
                            className="p-3 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
                        >
                            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-500">Share this code to invite friends.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Password</label>
                        <div className="bg-black/40 border border-slate-700 rounded-lg p-3 text-sm font-bold text-white">
                            {leagueData?.password || 'No Password'}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Max Players</label>
                        <div className="bg-black/40 border border-slate-700 rounded-lg p-3 text-sm font-bold text-white flex items-center gap-2">
                            <Users size={14} className="text-slate-500" />
                            {leagueData?.maxPlayers || 'Unlimited'}
                        </div>
                    </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Commissioner</label>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center font-bold text-xs text-white">
                            {commissionerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white">{commissionerName}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-black">League Owner</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );

  const renderGameContent = () => (
    <div className="space-y-4 animate-in fade-in duration-300">
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-0.5 shadow-lg">
            <div className="bg-[#0f0a05] rounded-[0.9rem] p-4 flex items-center gap-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 to-transparent"></div>
                <div className="relative z-10 flex-1">
                    <h2 className="text-lg font-black uppercase italic tracking-tighter text-white">Super Bowl LX</h2>
                    <p className="text-orange-200/60 text-[10px] font-bold leading-tight">NE vs SEA</p>
                </div>
                <div className="relative z-10"><Trophy className="text-orange-500" size={24} /></div>
            </div>
        </div>

        <div className="flex items-center justify-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertTriangle size={12} className="text-yellow-500" />
            <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wide">Player order will be randomized before kickoff</span>
        </div>

        {loading ? (
            <div className="text-center py-10 text-orange-500 font-bold text-xs animate-pulse">Loading Arena...</div>
        ) : (
            <div className="space-y-3">
                {members.map((member, index) => {
                    const isPigskinHolder = index === 0;
                    const isQueue = index > 1;

                    if (!isQueue) {
                        const currentLineup = member.lineup?.[member.lineup.length - 1];
                        const rawPlayerIds = currentLineup?.players || [];
                        const players = rawPlayerIds.map((pid: string) => PLAYER_DB[pid]).filter(Boolean).sort((a: any, b: any) => a.tier - b.tier);
                        const badgeColor = isPigskinHolder ? 'bg-gradient-to-r from-red-600 via-orange-500 to-red-600 text-white shadow-lg' : 'bg-yellow-500/20 text-yellow-400';
                        const badgeText = isPigskinHolder ? 'Pigskin Holder' : 'On Deck';

                        return (
                            <div key={member.id} className={`relative rounded-2xl p-px transition-all overflow-hidden ${isPigskinHolder ? 'mb-4 scale-[1.02]' : ''}`}>
                                {isPigskinHolder && <div className="absolute -inset-1 rounded-2xl real-fire-bg blur-lg opacity-80 z-0"></div>}
                                {!isPigskinHolder && <div className="absolute inset-0 bg-yellow-500/5 z-0 rounded-2xl border border-yellow-500/30"></div>}

                                <div className={`relative z-10 rounded-[0.9rem] overflow-hidden bg-[#020617] border ${isPigskinHolder ? 'border-orange-500/50' : 'border-transparent'} h-full`}>
                                    <div className={`absolute top-0 inset-x-0 ${badgeColor} text-[9px] font-black uppercase tracking-widest py-1 text-center flex items-center justify-center gap-2`}>
                                        {isPigskinHolder && <Flame size={10} fill="currentColor" />} {badgeText} {isPigskinHolder && <Flame size={10} fill="currentColor" />}
                                    </div>
                                    <div className="p-3 mt-4 flex justify-between items-center border-b border-slate-800/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-md flex items-center justify-center font-black text-[10px] bg-slate-800 text-slate-400">#{member.rank}</div>
                                            <div className="font-bold text-white text-xs">{member.username}</div>
                                        </div>
                                        <div className="text-lg font-black text-white">{member.scores?.Total?.toFixed(0) || 0}</div>
                                    </div>
                                    <div className="p-2">
                                        {players.length > 0 ? (
                                            <div className="grid grid-cols-3 gap-1.5">
                                                {players.map((p: any, idx: number) => {
                                                    let cardClasses = 'bg-slate-900 border-slate-800';
                                                    if (p.tier === 1) cardClasses = 'bg-gradient-to-br from-red-950/40 to-slate-950 border-red-500/50 shadow-[inset_0_0_10px_rgba(220,38,38,0.2)]';
                                                    if (p.tier === 2) cardClasses = 'bg-gradient-to-br from-yellow-950/40 to-slate-950 border-yellow-500/50 shadow-[inset_0_0_10px_rgba(234,179,8,0.2)]';
                                                    if (p.tier === 3) cardClasses = 'bg-gradient-to-br from-green-950/40 to-slate-950 border-green-500/50 shadow-[inset_0_0_10px_rgba(34,197,94,0.2)]';
                                                    const nameColor = getTierColor(p.tier);
                                                    return (
                                                        <div key={idx} className={`rounded-lg border relative overflow-hidden group shadow-md ${cardClasses} p-1.5 h-14 flex flex-col justify-center`}>
                                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                                                                <span className={`text-4xl font-black opacity-10 select-none -rotate-12 ${nameColor}`}>{p.num}</span>
                                                            </div>
                                                            <div className="relative z-10 flex flex-col items-center justify-center gap-0.5">
                                                                <div className="flex w-full justify-between items-center text-[7px] font-black uppercase text-slate-500 px-1">
                                                                    <span>{p.pos}</span><span>{p.team}</span>
                                                                </div>
                                                                <div className={`text-[9px] font-black leading-tight w-full truncate text-center ${nameColor}`}>{p.name.split(' ').slice(1).join(' ')}</div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ) : <div className="p-4 text-center text-slate-600 text-[10px] font-bold">No Players Assigned</div>}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-black text-xs text-slate-500">#{member.rank}</div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-xs font-bold text-slate-300">{member.username}</span>
                                    <span className="text-xs font-black text-slate-500">{member.scores?.Total?.toFixed(0) || 0}</span>
                                </div>
                                <div className="flex gap-1.5">{[1,2,3].map(i => <div key={i} className="h-1 flex-1 rounded-full bg-slate-800/80 overflow-hidden relative"><div className="absolute inset-0 bg-slate-700/30 w-1/2"></div></div>)}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );

  const renderLogContent = () => (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
        <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Game Activity</h2>
            <span className="text-[10px] font-bold text-slate-600">Live Feed</span>
        </div>
        <div className="space-y-0 relative border-l border-slate-800 ml-3">
            {logs.length > 0 ? logs.map((log, i) => (
                <div key={log.id} className="ml-6 mb-6 relative">
                    <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 ${log.type === 'burn' ? 'bg-[#020617] border-red-500' : (log.type === 'score' ? 'bg-[#020617] border-green-500' : 'bg-slate-800 border-slate-600')}`}></div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : 'Just Now'}</span>
                        <div className={`p-3 rounded-xl border ${log.type === 'burn' ? 'bg-red-950/10 border-red-500/20' : (log.type === 'score' ? 'bg-green-950/10 border-green-500/20' : 'bg-slate-900 border-slate-800')}`}>
                            <p className="text-xs font-bold text-slate-200 leading-relaxed">{log.message}</p>
                            {log.points !== 0 && (
                                <span className={`inline-block mt-2 text-[10px] font-black px-1.5 py-0.5 rounded ${log.points > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {log.points > 0 ? '+' : ''}{log.points} PTS
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )) : <div className="ml-6 p-6 text-center text-slate-500 text-xs">No activity yet.</div>}
        </div>
    </div>
  );

  const renderTiersContent = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-10">
        <div className="px-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Assignment Pool</h2>
            <p className="text-[10px] font-bold text-slate-600 mt-1">Assignments are random.</p>
        </div>
        {TIERS_MENU.map((tier) => (
            <div key={tier.id} className={`rounded-2xl border ${tier.border} ${tier.bg} overflow-hidden`}>
                <div className="px-4 py-3 border-b border-inherit bg-black/20 flex justify-between items-center"><span className={`text-xs font-black uppercase tracking-widest ${tier.color}`}>{tier.label}</span></div>
                <div className="p-1 grid grid-cols-1 gap-1">
                    {Object.keys(PLAYER_DB).filter((pid) => PLAYER_DB[pid].tier === tier.id).map((pid) => {
                        const player = PLAYER_DB[pid];
                        const isInjured = injuredPlayers.includes(pid);
                        return (
                            <div 
                                key={pid} 
                                className={`w-full px-3 py-2 rounded-lg transition-colors flex items-center justify-between text-left ${isInjured ? 'bg-red-950/30 border border-red-900/50 opacity-50 grayscale' : 'bg-transparent'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex flex-col items-center justify-center relative">
                                        {isInjured ? <Stethoscope size={14} className="text-red-500" /> : (
                                            <span className="text-[9px] font-black leading-none text-slate-300">{player.name.split(' ').map((n: string) => n[0]).join('').substring(0,2)}</span>
                                        )}
                                    </div>
                                    <div>
                                        <div className={`text-xs font-bold ${isInjured ? 'text-slate-500 line-through' : getTierColor(player.tier)}`}>{player.name}</div>
                                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-500">#{player.num} • {player.team} • {player.pos} {isInjured && '(OUT)'}</div>
                                    </div>
                                </div>
                                {isInjured && <Ban size={16} className="text-red-500 opacity-50" />}
                            </div>
                        );
                    })}
                </div>
            </div>
        ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans">
        <div className="sticky top-0 z-50 bg-[#020617]/95 backdrop-blur-xl border-b border-orange-500/20 shadow-lg shadow-orange-500/5">
            <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
                <div className="flex items-center gap-3"><button onClick={() => router.push('/hub')} className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/5"><ChevronLeft size={20} /></button>
                    <div className="flex items-center gap-1.5 text-orange-500 text-[9px] font-black uppercase tracking-widest mb-0.5"><Flame size={10} fill="currentColor" /> Pass The Pigskin</div>
                </div>
                <div className="flex flex-col items-end"><span className="text-[8px] font-bold uppercase tracking-widest text-orange-400">Pot</span><span className="text-sm font-black text-white tabular-nums">$0.00</span></div>
            </div>
            
            <div className="px-4 pb-4 md:px-8 flex flex-col md:flex-row items-center md:items-end justify-between gap-3">
                <div className="flex-1">
                    <h1 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter text-white leading-none break-words max-w-4xl text-center md:text-left">{leagueData.name}</h1>
                    <div className="hidden md:flex items-center gap-4 mt-2">
                        <button 
                            onClick={() => setActiveTab('game')}
                            className={`text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab !== 'info' ? 'text-orange-500' : 'text-slate-500 hover:text-white'}`}
                        >
                            Game Arena
                        </button>
                        <button 
                            onClick={() => setActiveTab('info')}
                            className={`text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'info' ? 'text-orange-500' : 'text-slate-500 hover:text-white'}`}
                        >
                            League Info
                        </button>
                    </div>
                </div>
                
                <Link 
                    href="/how-to-play" 
                    className="flex items-center gap-2 text-orange-500 hover:text-white transition-colors pb-1 group cursor-pointer"
                >
                    <span className="text-[10px] font-black uppercase tracking-widest underline decoration-orange-500/30 underline-offset-4 group-hover:decoration-white transition-all">How to Play</span>
                    <Play size={14} fill="currentColor" />
                </Link>
            </div>

            <div className="md:hidden max-w-2xl mx-auto px-4 pb-2">
                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
                    <button onClick={() => setActiveTab('game')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'game' ? 'bg-orange-500 text-[#020617] shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                        {/* Renamed "Game" to "Scoreboard" on mobile */}
                        <LayoutDashboard size={14} /> Scoreboard
                    </button>
                    <button onClick={() => setActiveTab('log')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'log' ? 'bg-orange-500 text-[#020617] shadow-lg' : 'text-slate-500 hover:text-white'}`}><ScrollText size={14} /> Log</button>
                    <button onClick={() => setActiveTab('tiers')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'tiers' ? 'bg-orange-500 text-[#020617] shadow-lg' : 'text-slate-500 hover:text-white'}`}><Layers size={14} /> Tiers</button>
                    <button onClick={() => setActiveTab('info')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'info' ? 'bg-orange-500 text-[#020617] shadow-lg' : 'text-slate-500 hover:text-white'}`}><Info size={14} /></button>
                </div>
            </div>
        </div>
        
        <main className="max-w-[1400px] mx-auto px-4 py-6">
            <div className="md:hidden">
                {activeTab === 'game' && renderGameContent()}
                {activeTab === 'log' && renderLogContent()}
                {activeTab === 'tiers' && renderTiersContent()}
                {activeTab === 'info' && renderInfoContent()}
            </div>

            <div className="hidden md:block">
                {activeTab === 'info' ? (
                    renderInfoContent()
                ) : (
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