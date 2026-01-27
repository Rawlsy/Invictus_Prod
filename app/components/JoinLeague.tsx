'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { joinLeagueAction } from '@/app/actions/joinLeague';
import { auth } from '@/lib/firebase';
import { Loader2, Lock, ArrowRight } from 'lucide-react';

export default function JoinLeague() {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'PASSWORD_NEEDED' | 'ERROR'>('IDLE');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleJoin = async () => {
    const user = auth.currentUser;
    if (!code || !user) return;

    setStatus('LOADING');
    setErrorMsg('');

    try {
        const result = await joinLeagueAction(user.uid, code, password, user.displayName || 'Member');

        if (result.success) {
            setCode('');
            setPassword('');
            setStatus('IDLE');
            router.refresh(); 
        } else if (result.status === 'PASSWORD_REQUIRED') {
            setStatus('PASSWORD_NEEDED');
        } else {
            setStatus('ERROR');
            setErrorMsg(result.message || 'Error joining league');
            // Reset error after 3 seconds
            setTimeout(() => setStatus('IDLE'), 3000);
        }
    } catch (err) {
        console.error(err);
        setStatus('ERROR');
        setErrorMsg('Network error. Try again.');
    }
  };

  return (
    <div className="flex items-center gap-2 relative">
      {/* Input Field */}
      <div className="relative group">
        <input
          type="text"
          maxLength={5}
          placeholder="JOIN CODE"
          className="bg-slate-900/50 border border-slate-700 text-white px-4 py-2.5 rounded-xl font-mono text-center uppercase tracking-widest w-32 focus:outline-none focus:border-[#22c55e] focus:bg-slate-900 transition-all text-sm font-bold placeholder:text-slate-600"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
        />
        {/* Helper Tooltip */}
        <div className="absolute -bottom-8 left-0 right-0 text-center opacity-0 group-focus-within:opacity-100 transition-opacity text-[9px] font-bold text-slate-500 uppercase tracking-widest pointer-events-none">
            Enter 5-Char Code
        </div>
      </div>

      {/* Join Button */}
      <button
        onClick={handleJoin}
        disabled={status === 'LOADING' || code.length < 5}
        className="bg-[#22c55e] hover:bg-[#16a34a] text-[#020617] p-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-900/20"
      >
        {status === 'LOADING' ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} strokeWidth={3} />}
      </button>

      {/* Password Modal */}
      {status === 'PASSWORD_NEEDED' && (
        <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black uppercase italic text-white mb-2 flex items-center gap-2">
              <Lock size={16} className="text-[#22c55e]" /> Private League
            </h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wide mb-4">Enter Password to Join</p>
            
            <input
              type="password"
              autoFocus
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white mb-4 focus:border-[#22c55e] outline-none font-bold"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />

            {errorMsg && <p className="text-red-500 text-xs font-bold mb-3 uppercase">{errorMsg}</p>}

            <div className="flex gap-3">
              <button 
                onClick={() => { setStatus('IDLE'); setPassword(''); }}
                className="flex-1 py-3 text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest"
              >
                Cancel
              </button>
              <button 
                onClick={handleJoin}
                className="flex-1 py-3 bg-[#22c55e] text-[#020617] font-black text-xs uppercase tracking-widest rounded-lg hover:bg-[#16a34a]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message Toast */}
      {status === 'ERROR' && !password && (
        <div className="absolute top-full mt-2 right-0 bg-red-500 text-white px-3 py-1 rounded text-[10px] font-bold uppercase animate-in fade-in slide-in-from-top-1 z-40 whitespace-nowrap shadow-lg">
          {errorMsg}
        </div>
      )}
    </div>
  );
}