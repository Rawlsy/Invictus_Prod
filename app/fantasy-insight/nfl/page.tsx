'use client';

import Link from 'next/link';
import { ChevronLeft, TrendingUp, Search, ArrowRight } from 'lucide-react';
import { SCOUTING_REPORTS } from '@/lib/data/scouting-reports';
import { useState } from 'react';

export default function NFLBigBoardPage() {
  const [filterPos, setFilterPos] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlayers = SCOUTING_REPORTS.filter(p => {
    const matchesPos = filterPos === 'ALL' || p.pos === filterPos;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.school.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPos && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans pb-20">
      
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-md border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <Link href="/" className="p-2 rounded-full hover:bg-slate-800 transition-colors">
                      <ChevronLeft size={20} className="text-slate-400" />
                  </Link>
                  <div className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                      <TrendingUp size={16} className="text-[#22c55e]" /> 2026 Big Board
                  </div>
              </div>
          </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
          
          <div className="mb-10 text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white mb-4">
                  THE TOP 50
              </h1>
              <p className="text-slate-400 max-w-2xl leading-relaxed">
                  Our exclusive ranking of the most fantasy-relevant prospects entering the 2026 NFL Draft. 
                  Updated weekly based on film study, analytic models, and insider buzz.
              </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search player or school..." 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#22c55e] transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {['ALL', 'QB', 'RB', 'WR', 'TE'].map((pos) => (
                      <button 
                        key={pos}
                        onClick={() => setFilterPos(pos)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all whitespace-nowrap ${
                            filterPos === pos 
                            ? 'bg-[#22c55e] border-[#22c55e] text-[#020617]' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                          {pos}
                      </button>
                  ))}
              </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                          <tr className="bg-slate-950 border-b border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
                              <th className="p-4 w-16 text-center">Rank</th>
                              <th className="p-4">Player</th>
                              <th className="p-4 hidden lg:table-cell">School</th>
                              <th className="p-4 hidden lg:table-cell">Comp</th>
                              
                              {/* 🚀 NEW COLUMN WIDTH INCREASED */}
                              <th className="p-4 w-[360px]">2-Year Hit Rates (Top 25/50/100/150)</th> 
                              
                              <th className="p-4 text-right">Grade</th>
                              <th className="p-4 w-16"></th>
                          </tr>
                      </thead>
                      <tbody>
                          {filteredPlayers.map((player) => (
                              <tr key={player.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                                  <td className="p-4 text-center">
                                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-white text-sm">
                                          {player.rank}
                                      </div>
                                  </td>
                                  <td className="p-4">
                                      <div className="flex items-center gap-3">
                                          <div className={`w-10 h-10 rounded-full ${player.image} border border-slate-700 hidden sm:block`} />
                                          <div>
                                              <div className="font-bold text-white text-sm md:text-base">{player.name}</div>
                                              <div className="flex items-center gap-2 mt-1">
                                                  <span className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#22c55e]/10 text-[#22c55e]">{player.pos}</span>
                                                  <span className="text-[10px] text-slate-500 lg:hidden">{player.school}</span>
                                              </div>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="p-4 hidden lg:table-cell text-sm text-slate-300">{player.school}</td>
                                  <td className="p-4 hidden lg:table-cell text-xs font-bold text-slate-500 uppercase tracking-wide">{player.proComp}</td>
                                  
                                  {/* 🚀 NEW: 4-COLUMN HIT RATES */}
                                  <td className="p-4">
                                      {player.fantasyOdds && (
                                          <div className="flex items-center gap-2 text-[10px] font-bold">
                                              
                                              {/* Top 25 (Gold/Yellow) */}
                                              <div className="flex flex-col items-center gap-1 bg-slate-950/50 p-2 rounded-lg border border-yellow-500/20 w-16">
                                                  <span className="text-yellow-400">{player.fantasyOdds.top25}%</span>
                                                  <span className="text-slate-600 uppercase tracking-wider text-[8px]">Top 25</span>
                                              </div>

                                              {/* Top 50 (Green) */}
                                              <div className="flex flex-col items-center gap-1 bg-slate-950/50 p-2 rounded-lg border border-slate-800 w-16">
                                                  <span className="text-[#22c55e]">{player.fantasyOdds.top50}%</span>
                                                  <span className="text-slate-600 uppercase tracking-wider text-[8px]">Top 50</span>
                                              </div>

                                              {/* Top 100 (Blue) */}
                                              <div className="flex flex-col items-center gap-1 bg-slate-950/50 p-2 rounded-lg border border-slate-800 w-16">
                                                  <span className="text-blue-400">{player.fantasyOdds.top100}%</span>
                                                  <span className="text-slate-600 uppercase tracking-wider text-[8px]">Top 100</span>
                                              </div>

                                              {/* Top 150 (Grey) */}
                                              <div className="flex flex-col items-center gap-1 bg-slate-950/50 p-2 rounded-lg border border-slate-800 w-16">
                                                  <span className="text-slate-300">{player.fantasyOdds.top150}%</span>
                                                  <span className="text-slate-600 uppercase tracking-wider text-[8px]">Top 150</span>
                                              </div>

                                          </div>
                                      )}
                                  </td>

                                  <td className="p-4 text-right font-black text-[#22c55e] text-lg">{player.grade}</td>
                                  <td className="p-4 text-right">
                                      <Link href={`/fantasy-insight/nfl/player/${player.id}`} className="inline-flex p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors">
                                          <ArrowRight size={18} />
                                      </Link>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
              
              {filteredPlayers.length === 0 && (
                  <div className="p-12 text-center text-slate-500 text-sm">
                      No players found matching your filters.
                  </div>
              )}
          </div>

      </main>
    </div>
  );
}