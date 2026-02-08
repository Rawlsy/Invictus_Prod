const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); 

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

// --- THE 2026 ROSTER PLAY SCRIPT (30 PLAYS) ---
const PLAYS = [
  // --- Q1: KICKOFF ---
  {
    play: "J.Slye kicks 65 yards from NE 35 to SEA 0. Touchback.",
    playClock: "15:00",
    playPeriod: "Q1",
    playerStats: { "3931390": { Kicking: { kickYards: "65" } } } // Slye
  },
  // --- SEAHAWKS DRIVE ---
  {
    play: "K.Walker III left tackle for 5 yards.",
    playClock: "14:50",
    playPeriod: "Q1",
    playerStats: { "4567048": { Rushing: { rushYds: "5" } } } // Walker
  },
  {
    play: "S.Darnold pass short right to J.Smith-Njigba for 12 yards.",
    playClock: "14:15",
    playPeriod: "Q1",
    playerStats: { 
        "3912547": { Passing: { passYds: "12" } }, 
        "4431566": { Receiving: { recYds: "12" } } 
    }
  },
  {
    play: "S.Darnold pass deep left to C.Kupp for 25 yards.",
    playClock: "13:40",
    playPeriod: "Q1",
    playerStats: { 
        "3912547": { Passing: { passYds: "25" } }, 
        "2977187": { Receiving: { recYds: "25" } } 
    }
  },
  {
    play: "G.Holani right guard for 3 yards.",
    playClock: "13:00",
    playPeriod: "Q1",
    playerStats: { "4426514": { Rushing: { rushYds: "3" } } } 
  },
  {
    play: "S.Darnold pass short middle to A.Barner for 4 yards.",
    playClock: "12:20",
    playPeriod: "Q1",
    playerStats: { 
        "3912547": { Passing: { passYds: "4" } }, 
        "4431611": { Receiving: { recYds: "4" } } 
    }
  },
  // --- FIELD GOAL MADE ---
  {
    play: "J.Myers 45 yard field goal is GOOD.",
    playClock: "11:45",
    playPeriod: "Q1",
    playerStats: { "2473037": { Kicking: { fgMade: "1", fgYards: "45" } } } // Myers
  },

  // --- Q1: PATRIOTS DRIVE ---
  {
    play: "J.Myers kicks 65 yards to NE 0. Touchback.",
    playClock: "11:45",
    playPeriod: "Q1",
    playerStats: { "2473037": { Kicking: { kickYards: "65" } } }
  },
  {
    play: "D.Maye pass short left to R.Stevenson for 6 yards.",
    playClock: "11:30",
    playPeriod: "Q1",
    playerStats: { 
        "4431452": { Passing: { passYds: "6" } }, 
        "4569173": { Receiving: { recYds: "6" } } 
    }
  },
  {
    play: "D.Maye pass deep right to S.Diggs for 20 yards.",
    playClock: "11:00",
    playPeriod: "Q1",
    playerStats: { 
        "4431452": { Passing: { passYds: "20" } }, 
        "2976212": { Receiving: { recYds: "20" } } 
    }
  },
  {
    play: "T.Henderson left tackle for 8 yards.",
    playClock: "10:30",
    playPeriod: "Q1",
    playerStats: { "5000001": { Rushing: { rushYds: "8" } } } 
  },
  {
    play: "A.Gibson right guard for 3 yards.",
    playClock: "10:00",
    playPeriod: "Q1",
    playerStats: { "4241478": { Rushing: { rushYds: "3" } } } 
  },
  {
    play: "D.Maye pass short middle to H.Henry for 12 yards.",
    playClock: "09:20",
    playPeriod: "Q1",
    playerStats: { 
        "4431452": { Passing: { passYds: "12" } }, 
        "3046439": { Receiving: { recYds: "12" } } 
    }
  },
  {
    play: "D.Maye pass deep left to K.Boutte for 15 yards.",
    playClock: "08:45",
    playPeriod: "Q1",
    playerStats: { 
        "4431452": { Passing: { passYds: "15" } }, 
        "4431526": { Receiving: { recYds: "15" } } 
    }
  },
  
  // --- FUMBLE EVENT ---
  {
    play: "D.Maye sacked by B.Mafe at SEA 35. FUMBLES, recovered by SEA J.Love at SEA 33.",
    playClock: "08:00",
    playPeriod: "Q1",
    playerStats: { 
        "4431452": { Passing: { sacked: "1" }, Fumbles: { fumbles: "1", fumblesLost: "1" } } 
    }
  },

  // --- SEAHAWKS DRIVE (After Turnover) ---
  {
    play: "K.Walker III right tackle for 40 yards. BIG GAIN.",
    playClock: "07:45",
    playPeriod: "Q1",
    playerStats: { "4567048": { Rushing: { rushYds: "40" } } } 
  },
  
  // --- TOUCHDOWN (RUSHING) ---
  {
    play: "K.Walker III up the middle for 27 yards, TOUCHDOWN.",
    playClock: "07:15",
    playPeriod: "Q1",
    playerStats: { 
        "4567048": { Rushing: { rushYds: "27", rushTD: "1" } } 
    }
  },
  // --- EXTRA POINT ---
  {
    play: "J.Myers extra point is GOOD.",
    playClock: "07:15",
    playPeriod: "Q1",
    playerStats: { "2473037": { Kicking: { xpMade: "1" } } }
  },

  // --- PATRIOTS DRIVE ---
  {
    play: "J.Myers kicks 65 yards to NE 0. Touchback.",
    playClock: "07:15",
    playPeriod: "Q1",
    playerStats: { "2473037": { Kicking: { kickYards: "65" } } }
  },
  {
    play: "D.Maye pass deep middle to S.Diggs for 50 yards.",
    playClock: "06:50",
    playPeriod: "Q1",
    playerStats: { 
        "4431452": { Passing: { passYds: "50" } }, 
        "2976212": { Receiving: { recYds: "50" } } 
    }
  },
  
  // --- TOUCHDOWN (PASSING) ---
  {
    play: "D.Maye pass short right to R.Stevenson for 25 yards, TOUCHDOWN.",
    playClock: "06:10",
    playPeriod: "Q1",
    playerStats: { 
        "4431452": { Passing: { passYds: "25", passTD: "1" } }, 
        "4569173": { Receiving: { recYds: "25", recTD: "1" } } 
    }
  },
  {
    play: "J.Slye extra point is GOOD.",
    playClock: "06:10",
    playPeriod: "Q1",
    playerStats: { "3931390": { Kicking: { xpMade: "1" } } }
  },

  // --- SEAHAWKS DRIVE ---
  {
    play: "J.Slye kicks 65 yards to SEA 0. Touchback.",
    playClock: "06:10",
    playPeriod: "Q1",
    playerStats: { "3931390": { Kicking: { kickYards: "65" } } }
  },
  {
    play: "S.Darnold pass short left to C.Kupp for 8 yards.",
    playClock: "05:45",
    playPeriod: "Q1",
    playerStats: { 
        "3912547": { Passing: { passYds: "8" } }, 
        "2977187": { Receiving: { recYds: "8" } } 
    }
  },
  
  // --- INTERCEPTION ---
  {
    play: "S.Darnold pass deep right intended for D.Metcalf INTERCEPTED by C.Gonzalez at NE 40.",
    playClock: "05:15",
    playPeriod: "Q1",
    playerStats: { 
        "3912547": { Passing: { ints: "1" } } 
    }
  },

  // --- PATRIOTS DRIVE (After INT) ---
  {
    play: "R.Stevenson up the middle for 2 yards.",
    playClock: "04:50",
    playPeriod: "Q1",
    playerStats: { "4569173": { Rushing: { rushYds: "2" } } }
  },
  {
    play: "D.Maye pass incomplete short left.",
    playClock: "04:15",
    playPeriod: "Q1",
    playerStats: { "4431452": { Passing: { att: "1" } } } // Just an attempt
  },
  {
    play: "D.Maye pass short middle to H.Henry for 8 yards.",
    playClock: "03:40",
    playPeriod: "Q1",
    playerStats: { 
        "4431452": { Passing: { passYds: "8" } }, 
        "3046439": { Receiving: { recYds: "8" } } 
    }
  },
  {
    play: "D.Maye scrambles right for 5 yards. First Down.",
    playClock: "03:00",
    playPeriod: "Q1",
    playerStats: { "4431452": { Rushing: { rushYds: "5" } } }
  },
  {
    play: "J.Slye 48 yard field goal is NO GOOD (Wide Left).",
    playClock: "02:15",
    playPeriod: "Q1",
    playerStats: { "3931390": { Kicking: { fgAtt: "1" } } } // Missed FG
  }
];

async function runSimulation() {
  console.log("🚀 Starting EXTENDED Simulation (30 Plays)...");

  // 1. HARD RESET
  await db.collection("system").doc("live_feed").set({
    gameID: "20260208_NE@SEA",
    status: "Live",
    period: "Q1",
    clock: "15:00",
    homeScore: 0,
    awayScore: 0,
    allPlayByPlay: [],
    lastPlay: null
  });

  // 2. CLEAR PREVIOUS LOGS
  const logs = await db.collection("system").doc("games").collection("20260208_NE@SEA").get();
  const batch = db.batch();
  logs.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  console.log("✅ Database Reset. Waiting 5s before kickoff...");
  await new Promise(r => setTimeout(r, 5000));

  // 3. STREAM PLAYS
  for (let i = 0; i < PLAYS.length; i++) {
    const play = PLAYS[i];
    
    console.log(`[Play ${i+1}/${PLAYS.length}] Sending: ${play.play}`);
    
    await db.collection("system").doc("live_feed").update({
      clock: play.playClock,
      period: play.playPeriod,
      lastPlay: play,
      allPlayByPlay: admin.firestore.FieldValue.arrayUnion(play)
    });

    console.log("...Waiting 10 seconds...");
    // Slightly faster loop for testing, change to 15000 for real feel
    await new Promise(r => setTimeout(r, 10000)); 
  }

  console.log("🏁 Simulation Complete.");
  process.exit();
}

runSimulation();