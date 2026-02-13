'use client';

import Link from 'next/link';
import { Trophy, Shield, Users, ArrowRight, TrendingUp, Star, ChevronRight, Activity } from 'lucide-react';
import { SCOUTING_REPORTS } from '@/lib/data/scouting-reports';

export default function Home() {
  const featuredPlayers = SCOUTING_REPORTS.slice(0, 8);

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans flex flex-col relative overflow-hidden">
      
      {/* ... (Background & Hero sections remain unchanged) ... */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      <div className="absolute top-0 w-full h-[50vh] bg-gradient-to-b from-[#22c55e]/10 to-transparent blur-3xl pointer-events-none" />

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 pt-20 pb-12 md:pt-32 md:pb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-[10px] font-black uppercase tracking-widest mb-6 animate-fade-in-up">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" /> Enter the Arena
        </div>
        <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-6 bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent">
          REDEFINE <br /> THE GAME
        </h2>
        <p className="text-slate-400 text-sm md:text-lg max-w-md mx-auto mb-10 leading-relaxed">
          The ultimate alternative fantasy sports platform. A new era of competition starts here.
        </p>
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-sm md:max-w-md">
          <Link href="/login" className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] text-[#020617] py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]">
            Get Started <ArrowRight size={16} />
          </Link>
          <Link href="/hub" className="flex-1 bg-slate-900 border border-slate-700 hover:border-slate-500 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all">
            Enter Hub
          </Link>
        </div>
      </main>

      {/* NEW SECTION: Player Profile Carousel */}
      <section className="relative z-10 w-full py-16 border-y border-slate-900/50 bg-[#020617]/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="flex items-end justify-between mb-10">
             <div className="space-y-2">
                 <div className="flex items-center gap-2 text-[#22c55e] text-xs font-black uppercase tracking-widest">
                    <TrendingUp size={14} /> Scouting Report
                 </div>
                 <h3 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter">
                    THE CLASS OF '26
                 </h3>
                 <p className="text-slate-500 text-sm font-medium max-w-md">
                    In-depth analysis of the top prospects entering the league.
                 </p>
             </div>
             {/* 🚀 UPDATE LINK: Points to new main section */}
             <Link href="/fantasy-insight/nfl" className="hidden md:flex items-center gap-2 text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest transition-colors">
                View All Reports <ArrowRight size={14} />
             </Link>
          </div>

          <div className="flex overflow-x-auto gap-6 pb-8 -mx-6 px-6 no-scrollbar snap-x snap-mandatory">
            {featuredPlayers.map((player) => (
               <div key={player.id} className="snap-center shrink-0 w-[300px] md:w-[320px] group relative rounded-3xl border border-slate-800 bg-slate-900/80 overflow-hidden hover:border-[#22c55e]/40 transition-all hover:-translate-y-1 duration-300">
                  
                  <div className={`h-24 ${player.image} border-b border-slate-800 p-6 flex justify-between items-start`}>
                      <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-white text-xs font-black uppercase tracking-wider">
                         {player.pos}
                      </div>
                      <div className="flex items-center gap-1 text-[#22c55e]">
                         <Star size={12} fill="currentColor" />
                         <span className="text-sm font-black">{player.grade}</span>
                      </div>
                  </div>

                  <div className="p-6">
                      <div className="mb-6">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{player.school}</div>
                          <h4 className="text-2xl font-black text-white leading-none mb-4">{player.name}</h4>
                          <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                              <Activity size={16} className="text-slate-600" />
                              <div className="flex-1">
                                 <div className="text-[9px] font-bold text-slate-500 uppercase">Pro Comparison</div>
                                 <div className="text-xs font-bold text-slate-200">{player.proComp}</div>
                              </div>
                          </div>
                      </div>

                      <div className="space-y-3 mb-6">
                          {Object.entries(player.stats).map(([label, val]) => (
                             <div key={label} className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                                   <span>{label}</span>
                                   <span>{val}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                   <div className="h-full bg-[#22c55e]" style={{ width: `${val}%` }} />
                                </div>
                             </div>
                          ))}
                      </div>

                      {/* 🚀 UPDATE LINK: Points to new path */}
                      <Link href={`/fantasy-insight/nfl/player/${player.id}`} className="w-full py-3 rounded-xl border border-slate-700 hover:bg-[#22c55e] hover:border-[#22c55e] hover:text-[#020617] text-slate-300 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                          Full Breakdown <ChevronRight size={12} />
                      </Link>
                  </div>
               </div>
            ))}
            
             <Link href="/fantasy-insight/nfl" className="snap-center shrink-0 w-[150px] md:w-[200px] rounded-3xl border border-dashed border-slate-800 bg-transparent flex flex-col items-center justify-center gap-4 hover:border-slate-600 hover:bg-slate-900/30 transition-all cursor-pointer group">
                 <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowRight size={20} className="text-slate-400 group-hover:text-white" />
                 </div>
                 <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-white">View Full Class</span>
             </Link>
          </div>

        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-6xl mx-auto w-full px-6 py-20 flex flex-col items-center gap-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {[
              { icon: Trophy, title: "Power to the Player", desc: "Make 'alternative' just a stepping stone when we bring custom league settings in a future release." },
              { icon: Shield, title: "More sports, More Ways", desc: "We're not stopping at football. Bringing new formats to March Madness, The Masters, The World Cup and more." },
              { icon: Users, title: "Global Leaderboards", desc: "Dominated your league? See how you stack up against the best in the world." }
            ].map((feat, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm hover:border-[#22c55e]/30 transition-colors group">
                <div className="bg-slate-950 w-12 h-12 rounded-xl flex items-center justify-center border border-slate-800 group-hover:border-[#22c55e]/50 transition-colors mb-4">
                    <feat.icon className="text-[#22c55e]" size={20} />
                </div>
                <h3 className="font-bold text-white mb-2 uppercase tracking-wide text-sm">{feat.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{feat.desc}</p>
              </div>
            ))}
        </div>
      </section>

    </div>
  );
}