'use client';

import Link from 'next/link';
import { Trophy, Shield, Users, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans flex flex-col relative overflow-hidden">
      
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      <div className="absolute top-0 w-full h-[50vh] bg-gradient-to-b from-[#22c55e]/10 to-transparent blur-3xl pointer-events-none" />

      {/* REMOVED LOCAL NAV - Global Navbar from layout.tsx handles this now */}

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 mt-10 md:mt-0">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-[10px] font-black uppercase tracking-widest mb-6 animate-fade-in-up">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" /> Enter the Arena
        </div>
        
        <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-6 bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent">
          DOMINATE <br /> THE POSTSEASON
        </h2>
        
        <p className="text-slate-400 text-sm md:text-lg max-w-md mx-auto mb-10 leading-relaxed">
          The ultimate alternative fantasy sports platform. New ways to play.
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

      {/* Features Grid - Mobile Stack */}
      <section className="relative z-10 max-w-6xl mx-auto w-full px-6 py-20 flex flex-col items-center gap-12">
        
        {/* NEW HEADER */}
        <div className="text-center space-y-2">
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-[0.2em] text-white">
                Coming Soon
            </h3>
            <div className="w-12 h-1 bg-[#22c55e] mx-auto rounded-full" />
        </div>

        {/* THE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {[
              { icon: Trophy, title: "Power to the Player", desc: "Make 'alternative' just a stepping stone when we bring custom league settings in a future release." },
              { icon: Shield, title: "More sports and more ways to play!", desc: "We're not stopping at just football. We plan on bringing new ways to play to March Madness, The Masters, The World Cup and many more." },
              { icon: Users, title: "Global Leaderboards", desc: "Dominated your league? How did you stack up against everyone else?" }
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