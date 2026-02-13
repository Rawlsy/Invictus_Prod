'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Activity, Shield, TrendingUp, AlertTriangle, FileText } from 'lucide-react';
import { SCOUTING_REPORTS } from '@/lib/data/scouting-reports';

export default function PlayerProfilePage() {
  const params = useParams();
  
  const playerId = Number(params.id);
  const player = SCOUTING_REPORTS.find(p => p.id === playerId);

  if (!player) {
    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">
            <div className="text-center">
                <h2 className="text-2xl font-black mb-4">Player Not Found</h2>
                <Link href="/" className="text-[#22c55e] hover:underline">Return to Hub</Link>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans pb-20">
      
      {/* Header / Nav */}
      <div className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-md border-b border-slate-800">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
              <Link href="/fantasy-insight/nfl" className="p-2 rounded-full hover:bg-slate-800 transition-colors">
                  <ChevronLeft size={20} className="text-slate-400" />
              </Link>
              <div className="text-xs font-black uppercase tracking-widest text-slate-500">
                  <Link href="/fantasy-insight/nfl" className="hover:text-white transition-colors">Scouting Report</Link> / {player.pos}
              </div>
          </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Hero Card */}
          <div className={`relative overflow-hidden rounded-3xl border border-slate-800 ${player.image} p-8 md:p-12 mb-8`}>
              <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                  <div>
                      <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                              {player.school}
                          </span>
                          <span className="px-3 py-1 rounded-lg bg-[#22c55e]/20 border border-[#22c55e]/30 text-[10px] font-black uppercase tracking-widest text-[#22c55e]">
                              {player.pos}
                          </span>
                      </div>
                      <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white mb-2">
                          {player.name.toUpperCase()}
                      </h1>
                      <div className="flex items-center gap-6 text-sm font-bold text-slate-300">
                          <span>{player.height}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-600" />
                          <span>{player.weight}</span>
                      </div>
                  </div>

                  <div className="bg-slate-950/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 text-center min-w-[140px]">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Scout Grade</div>
                      <div className="text-5xl font-black text-[#22c55e] flex items-center justify-center gap-1">
                          {player.grade}<span className="text-lg text-slate-600">/10</span>
                      </div>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Left Column: Bio & Stats */}
              <div className="md:col-span-2 space-y-8">
                  
                  {/* Analysis Section (Shows default text if 'analysis' is missing) */}
                  <section>
                      <h3 className="text-lg font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
                          <FileText size={18} className="text-[#22c55e]" /> Scout's Take
                      </h3>
                      <p className="text-slate-400 leading-relaxed text-sm md:text-base border-l-2 border-[#22c55e] pl-4">
                          {player.analysis || `${player.name} is a dynamic prospect out of ${player.school}. While our full written breakdown is being finalized, his athletic profile and college production suggest he has the tools to compete at the next level.`}
                      </p>
                  </section>

                  {/* Strengths & Weaknesses - NOW DECOUPLED from Analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Strengths */}
                      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                          <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
                              <Shield size={14} className="text-blue-400" /> Strengths
                          </h4>
                          {player.strengths && player.strengths.length > 0 ? (
                              <ul className="space-y-3">
                                  {player.strengths.map((s, i) => (
                                      <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
                                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                          {s}
                                      </li>
                                  ))}
                              </ul>
                          ) : (
                              <p className="text-xs text-slate-600 italic">Data pending...</p>
                          )}
                      </div>

                      {/* Weaknesses */}
                      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                          <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
                              <AlertTriangle size={14} className="text-orange-400" /> Areas to Improve
                          </h4>
                          {player.weaknesses && player.weaknesses.length > 0 ? (
                              <ul className="space-y-3">
                                  {player.weaknesses.map((w, i) => (
                                      <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
                                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                                          {w}
                                      </li>
                                  ))}
                              </ul>
                          ) : (
                              <p className="text-xs text-slate-600 italic">Data pending...</p>
                          )}
                      </div>
                  </div>

              </div>

              {/* Right Column: Traits & Comp */}
              <div className="space-y-6">
                  
                  {/* Pro Comp */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">NFL Comparison</div>
                      <div className="text-xl font-black text-white">{player.proComp}</div>
                  </div>

                  {/* Fantasy Odds - NEW SECTION */}
                  {player.fantasyOdds && (
                      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                          <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
                              <TrendingUp size={14} className="text-blue-400" /> 2-Year Hit Rates
                          </h4>
                          <div className="space-y-4">
                              
                              {/* Top 25 */}
                              <div className="space-y-1">
                                  <div className="flex justify-between items-center text-xs font-bold">
                                      <span className="text-slate-500 uppercase">Top 25 Asset</span>
                                      <span className="text-yellow-400">{player.fantasyOdds.top25}%</span>
                                  </div>
                                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                                      <div className="h-full bg-yellow-400" style={{ width: `${player.fantasyOdds.top25}%` }} />
                                  </div>
                              </div>

                              {/* Top 50 */}
                              <div className="space-y-1">
                                  <div className="flex justify-between items-center text-xs font-bold">
                                      <span className="text-slate-500 uppercase">Top 50 Asset</span>
                                      <span className="text-[#22c55e]">{player.fantasyOdds.top50}%</span>
                                  </div>
                                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                                      <div className="h-full bg-[#22c55e]" style={{ width: `${player.fantasyOdds.top50}%` }} />
                                  </div>
                              </div>
                              
                              {/* Top 100 */}
                              <div className="space-y-1">
                                  <div className="flex justify-between items-center text-xs font-bold">
                                      <span className="text-slate-500 uppercase">Top 100 Asset</span>
                                      <span className="text-blue-400">{player.fantasyOdds.top100}%</span>
                                  </div>
                                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-400" style={{ width: `${player.fantasyOdds.top100}%` }} />
                                  </div>
                              </div>

                          </div>
                      </div>
                  )}

                  {/* Attributes Radar (Bars) */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                      <h4 className="text-xs font-black uppercase tracking-widest text-white mb-6 flex items-center gap-2">
                          <Activity size={14} className="text-[#22c55e]" /> Key Traits
                      </h4>
                      <div className="space-y-5">
                          {Object.entries(player.stats).map(([label, val]) => (
                              <div key={label} className="space-y-2">
                                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                                      <span>{label}</span>
                                      <span className="text-white">{val}/100</span>
                                  </div>
                                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/50">
                                      <div 
                                        className="h-full bg-gradient-to-r from-[#22c55e]/50 to-[#22c55e] transition-all duration-1000" 
                                        style={{ width: `${val}%` }} 
                                      />
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

              </div>
          </div>

      </main>
    </div>
  );
}