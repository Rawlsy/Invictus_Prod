const admin = require("firebase-admin");
const path = require("path"); // Add this

// ✅ Use absolute pathing to find the key in the root folder
const keyPath = path.join(process.cwd(), "serviceAccountKey.json");
const serviceAccount = require(keyPath); 

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

// --- THE 2026 ROSTER PLAY SCRIPT ---
const PLAYS = [
  // --- Q1: KICKOFF ---
  {
    play: "J.Slye kicks 65 yards from NE 35 to SEA 0. Touchback.",
    playClock: "15:00",
    playPeriod: "Q1",
    playerStats: { "3931390": { Kicking: { kickYards: "65" } } } 
  },
  // --- SEAHAWKS DRIVE ---
  {
    play: "K.Walker III left tackle for 5 yards.",
    playClock: "14:50",
    playPeriod: "Q1",
    playerStats: { "4567048": { Rushing: { rushYds: "5" } } } 
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
  // --- FIELD GOAL MADE (SEA +3) ---
  {
    play: "J.Myers 45 yard field goal is GOOD.",
    playClock: "11:45",
    playPeriod: "Q1",
    playerStats: { "2473037": { Kicking: { fgMade: "1", fgYards: "45" } } } 
  },
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
  {
    play: "D.Maye sacked by B.Mafe at SEA 35. FUMBLES, recovered by SEA J.Love at SEA 33.",
    playClock: "08:00",
    playPeriod: "Q1",
    playerStats: { 
        "4431452": { Passing: { sacked: "1" }, Fumbles: { fumbles: "1", fumblesLost: "1" } } 
    }
  },
  {
    play: "K.Walker III right tackle for 40 yards. BIG GAIN.",
    playClock: "07:45",
    playPeriod: "Q1",
    playerStats: { "4567048": { Rushing: { rushYds: "40" } } } 
  },
  // --- TOUCHDOWN (SEA +6) ---
  {
    play: "K.Walker III up the middle for 27 yards, TOUCHDOWN.",
    playClock: "07:15",
    playPeriod: "Q1",
    playerStats: { 
        "4567048": { Rushing: { rushYds: "27", rushTD: "1" } } 
    }
  },
  // --- EXTRA POINT (SEA +1) ---
  {
    play: "J.Myers extra point is GOOD.",
    playClock: "07:15",
    playPeriod: "Q1",
    playerStats: { "2473037": { Kicking: { xpMade: "1" } } }
  },
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
  // --- TOUCHDOWN (NE +6) ---
  {
    play: "D.Maye pass short right to R.Stevenson for 25 yards, TOUCHDOWN.",
    playClock: "06:10",
    playPeriod: "Q1",
    playerStats: { 
        "4431452": { Passing: { passYds: "25", passTD: "1" } }, 
        "4569173": { Receiving: { recYds: "25", recTD: "1" } } 
    }
  },
  // --- EXTRA POINT (NE +1) ---
  {
    play: "J.Slye extra point is GOOD.",
    playClock: "06:10",
    playPeriod: "Q1",
    playerStats: { "3931390": { Kicking: { xpMade: "1" } } }
  },
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
  {
    play: "S.Darnold pass deep right intended for D.Metcalf INTERCEPTED by C.Gonzalez at NE 40.",
    playClock: "05:15",
    playPeriod: "Q1",
    playerStats: { 
        "3912547": { Passing: { ints: "1" } } 
    }
  },
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
    playerStats: { "4431452": { Passing: { att: "1" } } } 
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
    playerStats: { "3931390": { Kicking: { fgAtt: "1" } } } 
  }
];

// Team Team Mapping (NE = Home, SEA = Away)
const PLAYER_TEAMS = {
    "3931390": "NE", "4569173": "NE", "4431452": "NE", "2976212": "NE", "3046439": "NE", "5000001": "NE", "4241478": "NE", "4431526": "NE",
    "4567048": "SEA", "3912547": "SEA", "4431566": "SEA", "2977187": "SEA", "4426514": "SEA", "4431611": "SEA", "2473037": "SEA", "4684940": "SEA"
};

async function runSimulation() {
  console.log("🚀 Starting EXTENDED Simulation with Live Scoring...");

  // Initialize scores
  let homeScore = 0; // NE
  let awayScore = 0; // SEA

  // 1. HARD RESET
  await db.collection("system").doc("live_feed").set({
    gameID: "20260208_NE@SEA",
    status: "Live",
    period: "Q1",
    clock: "15:00",
    homeScore: 0,
    awayScore: 0,
    allPlayByPlay: [],
    lastPlay: null,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log("✅ Database Reset. Waiting 5s before kickoff...");
  await new Promise(r => setTimeout(r, 5000));

  // 2. STREAM PLAYS
  for (let i = 0; i < PLAYS.length; i++) {
    const play = PLAYS[i];
    const text = play.play.toLowerCase();
    
    // --- LIVE SCORE CALCULATION ---
    let points = 0;
    if (text.includes("touchdown")) points = 6;
    else if (text.includes("field goal is good")) points = 3;
    else if (text.includes("extra point is good")) points = 1;

    if (points > 0) {
        // Determine team based on player ID (NE: 3931390, 4431452 | SEA: 2473037, 4567048)
        const scorerId = Object.keys(play.playerStats)[0];
        const isNE = ["3931390", "4431452", "4569173", "2976212", "3046439", "5000001", "4241478", "4431526", "3052876"].includes(scorerId);
        
        if (isNE) homeScore += points;
        else awayScore += points;
    }

    console.log(`[Play ${i+1}/30] NE: ${homeScore} SEA: ${awayScore} | ${play.play}`);
    
    await db.collection("system").doc("live_feed").update({
      clock: play.playClock,
      period: play.playPeriod,
      homeScore: homeScore,
      awayScore: awayScore,
      lastPlay: play,
      allPlayByPlay: admin.firestore.FieldValue.arrayUnion(play),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });

    await new Promise(r => setTimeout(r, 10000)); 
  }

  console.log("🏁 Simulation Complete.");
  process.exit();
}

runSimulation();