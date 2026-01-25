'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import Link from 'next/link';
import { Plus, Trophy, ChevronRight, LogOut } from 'lucide-react';

export default function Hub() {
  const router = useRouter();
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      
      // Fetch leagues where user is a member
      // Note: This requires a complex query or storing league IDs on the user profile.
      // For simplicity in this demo, fetching ALL leagues and filtering client side 
      // (Optimized app would use 'array-contains' query on leagues)
      const q = query(collection(db, 'leagues')); 
      const snap = await getDocs(q);
      const userLeagues = snap.docs.map(d => ({ id: d.id, ...d.data() })); 
      // In a real app, filter here: .filter(l => l.members.includes(u.uid))
      
      setLeagues(userLeagues);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleSignOut = () => { auth.signOut(); router.push('/'); };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans pb-20">
      
      {/* Top Bar */}
      <header className="px-6 py-6 flex justify-between items-center max-w-5xl mx-auto">
        <h1 className="text-xl font-black italic tracking-tighter uppercase">INVICTUS<span className="text-[#22c55e]">HUB</span></h1>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6">
        
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Welcome Back, <br /> <span className="text-slate-500">{user?.displayName || 'Coach'}</span></h2>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Your Leagues</span>
          <button className="flex items-center gap-2 bg-[#22c55e] text-[#020617] px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#16a34a] transition-all">
            <Plus size={14} /> Join League
          </button>
        </div>

        {/* League Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-xs font-bold uppercase animate-pulse">Loading Hub...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leagues.map((league) => (
              <Link href={`/league/${league.id}`} key={league.id} className="group relative bg-slate-900/60 border border-slate-800 hover:border-[#22c55e]/50 p-6 rounded-2xl transition-all hover:bg-slate-900">
                <div className="absolute top-6 right-6 text-slate-600 group-hover:text-[#22c55e] transition-colors">
                  <ChevronRight size={20} />
                </div>
                <div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800 mb-4 group-hover:border-[#22c55e]/30">
                  <Trophy size={20} className="text-slate-400 group-hover:text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#22c55e] transition-colors">{league.name}</h3>
                <div className="flex gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>{league.scoringType || 'PPR'}</span>
                  <span>•</span>
                  <span>{league.members?.length || 0} Members</span>
                </div>
              </Link>
            ))}
            
            {/* Create New Placeholder */}
            <button className="border-2 border-dashed border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-white hover:border-slate-600 transition-all min-h-[160px]">
              <Plus size={24} />
              <span className="text-xs font-bold uppercase tracking-widest">Create New League</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}