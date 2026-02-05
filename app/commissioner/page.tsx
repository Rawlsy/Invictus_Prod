'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Shield, Loader2, CheckCircle, XCircle } from 'lucide-react';

const AUTHORIZED_EMAIL = "erawlsy@gmail.com";

const PLAYER_DB: Record<string, any> = {
  "ne-maye": { name: "Drake Maye", team: "NE", pos: "QB", tier: 1 },
  "ne-stevenson": { name: "Rhamondre Stevenson", team: "NE", pos: "RB", tier: 1 },
  "ne-diggs": { name: "Stefon Diggs", team: "NE", pos: "WR", tier: 2 },
  "ne-henry": { name: "Hunter Henry", team: "NE", pos: "TE", tier: 2 },
  "ne-henderson": { name: "TreVeyon Henderson", team: "NE", pos: "RB", tier: 2 },
  "ne-gibson": { name: "Antonio Gibson", team: "NE", pos: "RB", tier: 3 },
  "ne-boutte": { name: "Kayshon Boutte", team: "NE", pos: "WR", tier: 3 },
  "ne-hollins": { name: "Mack Hollins", team: "NE", pos: "WR", tier: 3 },
  "sea-walker": { name: "Kenneth Walker III", team: "SEA", pos: "RB", tier: 1 },
  "sea-jsn": { name: "Jaxon Smith-Njigba", team: "SEA", pos: "WR", tier: 1 },
  "sea-kupp": { name: "Cooper Kupp", team: "SEA", pos: "WR", tier: 2 },
  "sea-holani": { name: "George Holani", team: "SEA", pos: "RB", tier: 2 },
  "sea-darnold": { name: "Sam Darnold", team: "SEA", pos: "QB", tier: 3 },
  "sea-barner": { name: "AJ Barner", team: "SEA", pos: "TE", tier: 3 }
};

export default function CommissionerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [injuredIds, setInjuredIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === AUTHORIZED_EMAIL) {
        setAuthorized(true);
        setLoading(false);
      } else {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    const injuryRef = doc(db, "system", "pigskin_injuries");
    const unsub = onSnapshot(injuryRef, (docSnap) => {
      if (docSnap.exists()) {
        setInjuredIds(docSnap.data().playerIds || []);
      }
    });
    return () => unsub();
  }, [authorized]);

  const toggleInjury = async (playerId: string) => {
    const isInjured = injuredIds.includes(playerId);
    let newInjuries = [];
    if (isInjured) {
      newInjuries = injuredIds.filter((id) => id !== playerId);
    } else {
      newInjuries = [...injuredIds, playerId];
    }

    setInjuredIds(newInjuries);
    setSaving(true);

    try {
      await setDoc(doc(db, "system", "pigskin_injuries"), {
        playerIds: newInjuries,
        updatedAt: new Date()
      });
    } catch (e) {
      console.error(e);
      alert("Error saving");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-black text-white">Verifying...</div>;
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Shield className="text-orange-500" size={32} />
            <div>
              <h1 className="text-2xl font-black italic uppercase tracking-tighter">Commissioner Panel</h1>
              <p className="text-xs text-slate-500 font-bold">INJURY MANAGEMENT</p>
            </div>
          </div>
          {saving && <div className="text-green-500 text-xs font-bold uppercase">Saving...</div>}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(PLAYER_DB).map(([id, player]) => {
            const isInjured = injuredIds.includes(id);
            
            return (
              <div
                key={id}
                onClick={() => toggleInjury(id)}
                className={`cursor-pointer flex items-center justify-between p-4 rounded-xl border transition-all ${isInjured ? "bg-red-950 border-red-500" : "bg-slate-900 border-slate-800"}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-slate-400">
                    {player.team}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{player.name}</h3>
                    <p className="text-[10px] font-bold text-slate-500">Tier {player.tier} - {player.pos}</p>
                  </div>
                </div>
                <div className="text-right">
                  {isInjured ? (
                    <span className="text-red-500 text-[10px] font-black uppercase">Injured</span>
                  ) : (
                    <span className="text-green-500 text-[10px] font-black uppercase">Active</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}