'use client';

// 1. Added Suspense to the existing import line
import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import Link from 'next/link';
import { Plus, Trophy, ChevronRight, X, Loader2, Lock, Skull, Flame, Check, Minus } from 'lucide-react';
import JoinLeague from '../components/JoinLeague'; 

// --- CUSTOM ICONS ---
import { GoalPostIcon, BasketballIcon, SoccerIcon, GolfFlagIcon } from '../components/SportsIcons';

// Helper to generate a random 5-char code
const generateJoinCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

type SportType = 'NFL' | 'NCAAM' | 'WC' | 'GOLF';
type GameMode = 'plague' | 'pigskin';

export default function Hub() {
  const router = useRouter();
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // --- SELECTION STATE ---
  const [activeSport, setActiveSport] = useState<SportType>('NFL');
  const [activeMode, setActiveMode] = useState<GameMode>('plague');

  // --- MODAL STATE ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState('');
  
  // Settings
  const [scoringType, setScoringType] = useState('PPR');
  const [maxPlayers, setMaxPlayers] = useState(12);
  const [privacy, setPrivacy] = useState('Private');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);

  // --- REAL-TIME DATA FETCHING ---
  useEffect(() => {
    let unsubscribeLeagues: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (!u) { 
        router.push('/login'); 
        return; 
      }
      setUser(u);
      
      try {
        const q = query(
          collection(db, 'leagues'), 
          where('memberIDs', 'array-contains', u.uid)
        ); 
        
        unsubscribeLeagues = onSnapshot(q, (snapshot) => {
            const userLeagues = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setLeagues(userLeagues);
            setLoading(false);
        }, (error) => {
            console.error("Error listening to leagues:", error);
            setLoading(false);
        });

      } catch (error) {
        console.error("Error setting up listener:", error);
        setLoading(false);
      }
    });

    return () => {
        unsubscribeAuth();
        unsubscribeLeagues();
    };
  }, [router]);

  // Reset defaults when switching modes
  useEffect(() => {
    setNewLeagueName('');
    setPassword('');
    // Defaults: Pigskin = Public, Plague = Private
    if (activeSport === 'NFL' && activeMode === 'pigskin') {
        setPrivacy('Public');
        setScoringType('Standard');
        setMaxPlayers(12);
    } else {
        setPrivacy('Private');
        setScoringType('PPR');
    }
  }, [activeMode, activeSport]);

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeagueName.trim() || !user) return;
    if (privacy === 'Private' && !password.trim()) return;

    setCreating(true);
    try {
        const joinCode = generateJoinCode();

        const leagueData: any = {
            name: newLeagueName,
            privacy: privacy,
            password: privacy === 'Private' ? password : null,
            joinCode: joinCode,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
            memberIDs: [user.uid], 
            memberCount: 1,
            sport: activeSport, // Save Sport
            gameMode: activeMode, // Save Mode
        };

        if (activeSport === 'NFL' && activeMode === 'plague') {
            leagueData.scoringType = scoringType;
        } else if (activeSport === 'NFL' && activeMode === 'pigskin') {
            leagueData.scoringType = 'Standard'; 
            leagueData.maxPlayers = maxPlayers;
        } else {
            // Defaults for other sports
            leagueData.scoringType = 'Bracket';
        }

        const leagueRef = await addDoc(collection(db, 'leagues'), leagueData);

        await setDoc(doc(db, 'leagues', leagueRef.id, 'Members', user.uid), {
            username: user.displayName || 'Commissioner',
            joinedAt: new Date().toISOString(),
            scores: { "Total": 0.0 }
        });
        
        setShowCreateModal(false);
        setNewLeagueName('');
        setPassword('');
        setCreating(false);

    } catch (error) {
        console.error("Error creating league:", error);
        setCreating(false);
    }
  };

  const isFormValid = newLeagueName.trim().length > 0 && (privacy === 'Public' || password.trim().length > 0);
  
  // Theme Helpers
  const isPigskin = activeSport === 'NFL' && activeMode === 'pigskin';
  const themeBorder = isPigskin ? 'border-orange-500' : 'border-[#22c55e]';

  // Filter Logic
  const filteredLeagues = leagues.filter(l => {
    const lSport = l.sport || 'NFL';
    const lMode = l.gameMode || 'plague';
    return lSport === activeSport && (activeSport !== 'NFL' || lMode === activeMode);
  });

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans pb-20 relative">
      
      {/* Top Bar */}
      <header className="px-6 py-6 flex justify-between items-center max-w-5xl mx-auto">
        <h1 className="text-xl font-black italic tracking-tighter uppercase"><span className="text-[#22c55e]">HUB</span></h1>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6">
        
        {/* Welcome Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Welcome Back, <br /> <span className="text-slate-500">{user?.displayName || 'Coach'}</span></h2>
          </div>
          <div className="w-full md:w-auto">
             {/* 2. Added Suspense wrapper for the new JoinLeague logic */}
             <Suspense fallback={<div className="h-10 w-32 bg-slate-900 animate-pulse rounded-xl" />}>
                <JoinLeague />
             </Suspense>
          </div>
        </div>

        {/* --- LEVEL 1: SPORT SELECTOR (COMPACT BAR) --- */}
        <div className="mb-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Select Sport</div>
            <div className="flex p-1 bg-slate-900/80 border border-slate-800 rounded-xl gap-1 overflow-x-auto no-scrollbar">
                
                {/* NFL */}
                <button 
                    onClick={() => { setActiveSport('NFL'); setActiveMode('plague'); }}
                    className={`min-w-[80px] flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${
                        activeSport === 'NFL' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                    }`}
                >
                    <GoalPostIcon size={16} /> <span className="hidden md:inline">NFL</span>
                </button>

                {/* NCAAM */}
                <button 
                    onClick={() => { setActiveSport('NCAAM'); setActiveMode('plague'); }}
                    className={`min-w-[80px] flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${
                        activeSport === 'NCAAM' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                    }`}
                >
                    <BasketballIcon size={16} /> <span className="hidden md:inline">NCAAM</span>
                </button>

                {/* World Cup */}
                <button 
                    onClick={() => { setActiveSport('WC'); setActiveMode('plague'); }}
                    className={`min-w-[80px] flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${
                        activeSport === 'WC' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                    }`}
                >
                    <SoccerIcon size={16} /> <span className="hidden md:inline">World Cup</span>
                </button>

                {/* Golf */}
                <button 
                    onClick={() => { setActiveSport('GOLF'); setActiveMode('plague'); }}
                    className={`min-w-[80px] flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${
                        activeSport === 'GOLF' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                    }`}
                >
                    <GolfFlagIcon size={16} /> <span className="hidden md:inline">Masters</span>
                </button>

            </div>
        </div>

        {/* --- LEVEL 2: MODE SELECTOR --- */}
        <div className="mb-8">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Select League Type</div>
            
            {/* NFL MODES */}
            {activeSport === 'NFL' && (
                <div className="flex p-1 bg-slate-900/80 border border-slate-800 rounded-xl gap-1 overflow-x-auto">
                    <button 
                        onClick={() => setActiveMode('plague')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                            activeMode === 'plague' 
                            ? 'bg-[#22c55e] text-[#020617] shadow-lg shadow-[#22c55e]/20' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Skull size={16} />
                        <span>Plague League</span>
                    </button>

                    <button 
                        onClick={() => setActiveMode('pigskin')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                            activeMode === 'pigskin' 
                            ? 'bg-orange-500 text-[#020617] shadow-lg shadow-orange-500/20' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Flame size={16} />
                        <span>Pass the Pigskin</span>
                    </button>
                </div>
            )}

            {/* COMING SOON MODES (NCAAM, WC, GOLF) */}
            {activeSport !== 'NFL' && (
                <div className="flex p-1 bg-slate-900/80 border border-slate-800 rounded-xl gap-1 overflow-x-auto">
                    <button 
                        disabled
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap bg-slate-800/50 text-slate-500 cursor-not-allowed opacity-60"
                    >
                        <Lock size={16} />
                        <span>Standard League (Coming Soon)</span>
                    </button>
                </div>
            )}
        </div>

        {/* Action Bar */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
             Your {activeSport} • {activeMode === 'plague' ? 'Plague' : 'Pigskin'} Leagues
          </span>
        </div>

        {/* League Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-xs font-bold uppercase animate-pulse">Loading Hub...</div>
        ) : filteredLeagues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLeagues.map((league) => {
                const isThisLeaguePigskin = (league.sport === 'NFL' && league.gameMode === 'pigskin');
                const glowClass = isThisLeaguePigskin 
                    ? 'shadow-[0_0_20px_-5px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.5)] border-orange-500/30' 
                    : 'shadow-[0_0_20px_-5px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_-5px_rgba(34,197,94,0.5)] border-[#22c55e]/30';

                return (
                    <Link href={`/league/${league.id}`} key={league.id} className={`group relative bg-slate-900/80 border p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] ${glowClass}`}>
                        <div className={`absolute top-6 right-6 text-slate-600 transition-colors ${isThisLeaguePigskin ? 'group-hover:text-orange-500' : 'group-hover:text-[#22c55e]'}`}>
                        <ChevronRight size={20} />
                        </div>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-4 transition-colors ${
                            isThisLeaguePigskin 
                            ? 'bg-orange-950/30 border-orange-900 group-hover:border-orange-500/30 text-orange-500' 
                            : 'bg-slate-950 border-slate-800 group-hover:border-[#22c55e]/30 text-slate-400 group-hover:text-white'
                        }`}>
                        <Trophy size={20} />
                        </div>
                        <h3 className={`text-lg font-bold text-white mb-1 transition-colors ${isThisLeaguePigskin ? 'group-hover:text-orange-500' : 'group-hover:text-[#22c55e]'}`}>{league.name}</h3>
                        
                        {/* 3. Added the joinCode badge for easy sharing from the Hub */}
                        <div className="flex items-center justify-between mt-2">
                            <div className="flex gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                <span>{isThisLeaguePigskin ? `${league.maxPlayers || 'No Limit'} Max` : (league.scoringType || 'PPR')}</span>
                                <span>•</span>
                                <span>{league.memberCount || 0} Members</span>
                            </div>
                            <div className={`px-2 py-1 rounded-md text-[10px] font-black font-mono border ${isThisLeaguePigskin ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                                {league.joinCode}
                            </div>
                        </div>
                    </Link>
                );
            })}
            
            {/* GRID VIEW CREATE BUTTON */}
            {activeMode === 'plague' ? (
                <button 
                    disabled
                    className="border-2 border-dashed border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-slate-600 cursor-not-allowed transition-all min-h-[160px]"
                >
                    <Lock size={24} />
                    <span className="text-xs font-bold uppercase tracking-widest text-center">Come back for next years NFL playoffs.</span>
                </button>
            ) : (
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="border-2 border-dashed border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-white hover:border-slate-600 transition-all min-h-[160px]"
                >
                    <Plus size={24} />
                    <span className="text-xs font-bold uppercase tracking-widest">Create New League</span>
                </button>
            )}
          </div>
        ) : (
            <div className="border border-slate-800 bg-slate-900/50 rounded-2xl p-8 text-center">
                {activeSport !== 'NFL' ? (
                    <div className="text-slate-500 font-bold uppercase tracking-widest text-sm">No Leagues Available Yet</div>
                ) : (
                    <>
                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                            isPigskin ? 'bg-orange-900/20 text-orange-500' : 'bg-slate-800/50 text-slate-500'
                        }`}>
                            {isPigskin ? <Flame size={32} /> : <Skull size={32} />}
                        </div>
                        <p className="text-slate-400 mb-4 font-bold">No {activeMode === 'pigskin' ? 'Pigskin' : 'Plague'} Leagues Found.</p>
                        
                        {/* EMPTY STATE CREATE BUTTON */}
                        {activeMode === 'plague' ? (
                            <button 
                                disabled
                                className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-slate-800 text-slate-500 cursor-not-allowed"
                            >
                                Come back for next years NFL playoffs.
                            </button>
                        ) : (
                            <button 
                                onClick={() => setShowCreateModal(true)}
                                className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                    isPigskin 
                                    ? 'bg-orange-500 text-[#020617] hover:bg-orange-600' 
                                    : 'bg-[#22c55e] text-[#020617] hover:bg-[#16a34a]'
                                }`}
                            >
                                Create New League
                            </button>
                        )}
                    </>
                )}
            </div>
        )}
      </main>

      {/* --- CREATE LEAGUE MODAL --- */}
      {showCreateModal && activeSport === 'NFL' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-[#020617]/80 backdrop-blur-sm">
            <div className={`bg-slate-900 border rounded-2xl w-full max-w-md p-6 shadow-2xl relative transition-all ${themeBorder} ${isPigskin ? 'shadow-orange-500/10' : 'shadow-green-500/10'}`}>
                
                <button 
                    onClick={() => setShowCreateModal(false)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-2 mb-6">
                    {isPigskin ? <Flame className="text-orange-500" size={24} /> : <Skull className="text-[#22c55e]" size={24} />}
                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">
                        New {isPigskin ? <span className="text-orange-500">Pigskin</span> : <span className="text-[#22c55e]">Plague</span>} League
                    </h3>
                </div>
                
                <form onSubmit={handleCreateLeague} className="space-y-5">
                    
                    {/* League Name */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">League Name</label>
                        <input 
                            type="text" 
                            value={newLeagueName}
                            onChange={(e) => setNewLeagueName(e.target.value)}
                            placeholder={isPigskin ? "e.g. Hot Potato 2026" : "e.g. Invictus Championship"}
                            className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none transition-colors font-bold ${isPigskin ? 'focus:border-orange-500' : 'focus:border-[#22c55e]'}`}
                            autoFocus
                        />
                    </div>

                    {/* --- PLAGUE SPECIFIC: SCORING --- */}
                    {activeMode === 'plague' && (
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Scoring Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['PPR', 'Half-PPR', 'Standard'].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setScoringType(type)}
                                        className={`px-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                                            scoringType === type 
                                            ? 'bg-[#22c55e] text-[#020617] border-[#22c55e]' 
                                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- PIGSKIN SPECIFIC: MODERN NUMBER PICKER --- */}
                    {activeMode === 'pigskin' && (
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Max Players</label>
                            <div className="flex items-center gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setMaxPlayers(Math.max(2, maxPlayers - 1))}
                                    className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-orange-500 transition-all"
                                >
                                    <Minus size={20} />
                                </button>
                                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl h-12 flex items-center justify-center">
                                    <span className="text-xl font-black text-white tabular-nums">{maxPlayers}</span>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setMaxPlayers(Math.min(99, maxPlayers + 1))}
                                    className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-orange-500 transition-all"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- PRIVACY LOGIC SPLIT --- */}

                    {/* PLAGUE: TOGGLE BUTTONS */}
                    {activeMode === 'plague' && (
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Privacy</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Private', 'Public'].map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPrivacy(p)}
                                        className={`px-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                                            privacy === p 
                                            ? 'bg-white text-[#020617] border-white' 
                                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PIGSKIN: CHECKBOX */}
                    {activeMode === 'pigskin' && (
                        <div>
                            <label className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                                    privacy === 'Private' ? 'bg-orange-500 border-orange-500' : 'bg-slate-950 border-slate-700 group-hover:border-orange-500'
                                }`}>
                                    {privacy === 'Private' && <Check size={14} className="text-[#020617] stroke-[4]" />}
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="hidden" 
                                    checked={privacy === 'Private'}
                                    onChange={(e) => setPrivacy(e.target.checked ? 'Private' : 'Public')}
                                />
                                <span className={`text-sm font-bold uppercase tracking-wider transition-colors ${privacy === 'Private' ? 'text-orange-500' : 'text-slate-400'}`}>Private League?</span>
                            </label>
                        </div>
                    )}

                    {/* Password Field */}
                    {privacy === 'Private' && (
                        <div className="animate-in slide-in-from-top-2 duration-200 pt-2">
                            <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1 ${isPigskin ? 'text-orange-500' : 'text-[#22c55e]'}`}>
                                <Lock size={10} /> Set League Password *
                            </label>
                            <input 
                                type="text" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="e.g. Touchdown2026"
                                className={`w-full bg-slate-950 border rounded-lg px-4 py-3 text-white focus:outline-none transition-colors font-bold ${isPigskin ? 'border-orange-500/50 focus:border-orange-500' : 'border-[#22c55e]/50 focus:border-[#22c55e]'}`}
                            />
                        </div>
                    )}

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        disabled={creating || !isFormValid}
                        className={`w-full font-black uppercase tracking-widest py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2 ${
                            isPigskin
                            ? 'bg-orange-500 hover:bg-orange-600 text-[#020617]'
                            : 'bg-[#22c55e] hover:bg-[#16a34a] text-[#020617]'
                        }`}
                    >
                        {creating ? <Loader2 className="animate-spin" size={18} /> : 'Launch League'}
                    </button>

                </form>
            </div>
        </div>
      )}

    </div>
  );
}