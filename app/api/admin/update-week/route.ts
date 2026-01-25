import { NextResponse } from 'next/server';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

// 2026 Playoff Schedule Assumptions (Based on standard NFL scheduling)
// Wild Card: Jan 10-12, 2026
// Divisional: Jan 17-18, 2026
// Conference: Jan 25, 2026
// Super Bowl: Feb 8, 2026

const getWeekFromDate = () => {
  const today = new Date();
  
  // NOTE: For testing purposes, you can uncomment this line to simulate a specific date:
  // const today = new Date('2026-01-21'); // Wednesday before Conference Championship

  const currentMonth = today.getMonth() + 1; // 1-12
  const currentDay = today.getDate();

  // If it's not Jan/Feb, default to Offseason or Pre-season behavior
  if (currentMonth > 2 && currentMonth < 9) return 'Offseason';

  // January Logic (Playoffs)
  if (currentMonth === 1) {
    if (currentDay <= 14) return '19'; // Wild Card (Ends ~Jan 13)
    if (currentDay <= 21) return '20'; // Divisional (Ends ~Jan 20)
    if (currentDay <= 28) return '21'; // Conference (Ends ~Jan 27)
    return '22'; // Super Bowl Prep starts
  }

  // February Logic
  if (currentMonth === 2) {
    return '22'; // Super Bowl
  }

  return '19'; // Default Fallback
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    // Allow manual override via URL (e.g., ?force=21)
    const forceWeek = searchParams.get('force'); 

    if (secret !== 'Touchdown2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine Week
    const currentWeek = forceWeek || getWeekFromDate();
    
    console.log(`[System Update] Setting Global NFL Week to: ${currentWeek}`);

    // Update Firestore System State
    await setDoc(doc(db, 'system', 'nfl_state'), {
      currentWeek: currentWeek,
      seasonType: 'post',
      lastUpdated: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      week: currentWeek, 
      mode: forceWeek ? 'Manual Override' : 'Auto-Date',
      message: `System updated to Week ${currentWeek}`
    });

  } catch (error: any) {
    console.error("[System Update] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}