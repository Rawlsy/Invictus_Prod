'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Play } from 'lucide-react';

export default function HowToPlay() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#020617]/95 backdrop-blur-xl border-b border-orange-500/20 shadow-lg shadow-orange-500/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <div className="p-1.5 rounded-full group-hover:bg-white/10 transition-colors">
                <ChevronLeft size={20} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Back to league page</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center p-4 md:p-10 max-w-5xl mx-auto w-full">
        
        <div className="text-center mb-8 md:mb-12 space-y-2">
            <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
              How To Play
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto">
              Master the rules of Pass The Pigskin. Watch the tutorial below to learn about scoring, burns, and winning the pot.
            </p>
        </div>

        {/* Video Placeholder Container */}
        <div className="w-full bg-slate-900/50 rounded-2xl border border-slate-800 p-2 md:p-4 shadow-2xl shadow-orange-500/10">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#0a0f1e] border border-slate-800/50 flex flex-col items-center justify-center gap-4">
                <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700">
                    <Play size={32} className="text-slate-600 fill-current ml-1" />
                </div>
                <span className="text-slate-500 font-black uppercase tracking-widest text-sm md:text-base animate-pulse">Video tutorial coming soon</span>
            </div>
        </div>

        {/* Instructions / Text Content */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-center">
            <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/50">
                <div className="w-10 h-10 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                    <span className="text-green-500 font-black">1</span>
                </div>
                <h3 className="font-bold text-white mb-2">Hold the Pigskin</h3>
                <p className="text-xs text-slate-500 leading-relaxed">The Pigskin holder will receive 3 players, 1 from each tier. These players are randomly assigned at each turn. To Keep your turn you will want to avoid "Burns" (Receptions, Rush Attempts or Sacks by your players). When a player is burned, pigskin holder will move to bottom of queue and the next player is up!</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/50">
                <div className="w-10 h-10 mx-auto bg-orange-500/10 rounded-full flex items-center justify-center mb-4">
                    <span className="text-orange-500 font-black">2</span>
                </div>
                <h3 className="font-bold text-white mb-2">Score Points</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Earn +1 for every play you aren't burned (Kickoffs, Field Goals and Punts do not count).</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/50">
                <div className="w-10 h-10 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                    <span className="text-red-500 font-black">3</span>
                </div>
                <h3 className="font-bold text-white mb-2">A Twist!</h3>
                <p className="text-xs text-slate-500 leading-relaxed">If one of your players scores a touchdown while holding the pigskin, your turn will not be burned and you will be rewarded +7 points with no loss of turn.</p>
            </div>
        </div>

      </main>
    </div>
  );
}