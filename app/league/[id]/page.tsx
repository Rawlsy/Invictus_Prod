'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, AlertTriangle } from 'lucide-react';

// --- FIXED IMPORTS ---
// Pointing to invictus/app/components/league/
import PlagueView from '@/app/components/league/plague/PlagueView';
import PigskinView from '@/app/components/league/pigskin/PigskinView';

export default function LeaguePageDispatcher() {
  const params = useParams();
  const [leagueData, setLeagueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.id) return;
    const leagueDocRef = doc(db, 'leagues', params.id as string);
    
    const unsubscribe = onSnapshot(leagueDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setLeagueData({ id: docSnap.id, ...docSnap.data() });
      } else {
        setError('League not found');
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError('Error loading league');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [params.id]);

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#22c55e]" size={48} />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center text-red-500 gap-2">
        <AlertTriangle /> {error}
    </div>
  );

  // --- DISPATCHER LOGIC ---
  if (leagueData.gameMode === 'pigskin') {
      return <PigskinView leagueData={leagueData} />;
  }

  return <PlagueView leagueData={leagueData} />;
}