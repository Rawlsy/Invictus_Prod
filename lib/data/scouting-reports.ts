// lib/data/scouting-reports.ts

export interface PlayerProfile {
  id: number;
  rank: number;
  name: string;
  school: string;
  pos: string;
  height: string;
  weight: string;
  grade: string;
  proComp: string;
  stats: Record<string, number>;
  image: string;
  fantasyOdds: {
    top25: number;
    top50: number;
    top100: number;
    top150: number;
  };
  bio?: string;
  strengths: string[];
  weaknesses: string[];
  analysis?: string;
}

export const SCOUTING_REPORTS: PlayerProfile[] = [
  // --- TIER 1: THE ELITE ---
  {
    id: 1, rank: 1, name: "Jeremiyah Love", school: "Notre Dame", pos: "RB",
    height: "6'0\"", weight: "214 lbs", grade: "9.8", proComp: "Jahmyr Gibbs",
    stats: { "Speed": 97, "Burst": 96, "Receiving": 92 }, image: "bg-blue-950/20",
    fantasyOdds: { top25: 58, top50: 78, top100: 92, top150: 98 },
    strengths: [
      "Elite home-run speed (4.4s range) that changes defensive geometry.",
      "Exceptional contact balance for his lean frame; rarely goes down on first contact.",
      "Natural hands catcher out of the backfield, capable of running real routes."
    ],
    weaknesses: [
      "Can run too upright at times, exposing him to big hits.",
      "Pass protection recognition needs polish before he can handle 3rd downs."
    ]
  },
  {
    id: 2, rank: 2, name: "Carnell Tate", school: "Ohio State", pos: "WR",
    height: "6'2\"", weight: "191 lbs", grade: "9.7", proComp: "Chris Olave",
    stats: { "Route Running": 98, "Hands": 96, "Speed": 91 }, image: "bg-red-900/20",
    fantasyOdds: { top25: 52, top50: 72, top100: 88, top150: 96 },
    strengths: [
      "Technical marvel with elite route-running nuance.",
      "Late hands allow him to separate at the very last second.",
      "Body control along the sideline is NFL-ready today."
    ],
    weaknesses: [
      "Lacks the elite top-end speed to take the top off a defense.",
      "Lean frame can get jammed by physical press corners."
    ]
  },
  {
    id: 3, rank: 3, name: "Makai Lemon", school: "USC", pos: "WR",
    height: "6'0\"", weight: "205 lbs", grade: "9.6", proComp: "Robert Woods",
    stats: { "Agility": 95, "Versatility": 94, "YAC": 92 }, image: "bg-red-800/20",
    fantasyOdds: { top25: 45, top50: 68, top100: 85, top150: 95 },
    strengths: [
      "Violent runner after the catch with RB-like vision.",
      "Versatile chess piece who can play X, Z, or Slot.",
      "Excellent blocker on the perimeter."
    ],
    weaknesses: [
      "Average catch radius; won't win many jump balls.",
      "Lacks elite vertical speed to win purely on go-routes."
    ]
  },
  {
    id: 4, rank: 4, name: "Jordyn Tyson", school: "Arizona State", pos: "WR",
    height: "6'1\"", weight: "195 lbs", grade: "9.5", proComp: "Gabe Davis",
    stats: { "Deep Threat": 97, "Jump Ball": 95, "Speed": 93 }, image: "bg-yellow-900/20",
    fantasyOdds: { top25: 42, top50: 65, top100: 82, top150: 93 },
    strengths: [
      "Vertical field stretcher who commands safety help.",
      "Elite ball-tracking ability on deep throws.",
      "Explosive leaper who wins at the catch point."
    ],
    weaknesses: [
      "Limited route tree; mostly runs gos, posts, and curls.",
      "Consistency with focus drops has been an issue."
    ]
  },
  {
    id: 5, rank: 5, name: "Denzel Boston", school: "Washington", pos: "WR",
    height: "6'4\"", weight: "209 lbs", grade: "9.4", proComp: "Michael Pittman Jr.",
    stats: { "Size": 96, "Catch Radius": 95, "Physicality": 92 }, image: "bg-purple-900/20",
    fantasyOdds: { top25: 40, top50: 62, top100: 80, top150: 91 },
    strengths: [
      "Massive catch radius; creates a reliable target for QBs.",
      "Dominant red-zone weapon who boxes out defenders.",
      "Physical hand fighter at the line of scrimmage."
    ],
    weaknesses: [
      "Struggles to create separation against quick-twitch corners.",
      "Takes time to build up to top speed."
    ]
  },
  {
    id: 6, rank: 6, name: "Jonah Coleman", school: "Washington", pos: "RB",
    height: "5'9\"", weight: "225 lbs", grade: "9.3", proComp: "Dameon Pierce",
    stats: { "Power": 97, "Balance": 95, "Agility": 88 }, image: "bg-purple-900/20",
    fantasyOdds: { top25: 38, top50: 65, top100: 84, top150: 94 },
    strengths: [
      "Bowling ball build with low center of gravity.",
      "Impossible to tackle with an arm tackle.",
      "Surprisingly nimble feet for a power back."
    ],
    weaknesses: [
      "Lacks breakaway speed; won't hit many 50+ yard runs.",
      "Catching radius is limited by his height."
    ]
  },

  // --- TIER 2: HIGH-END STARTERS ---
  {
    id: 7, rank: 7, name: "K.C. Concepcion", school: "NC State", pos: "WR",
    height: "5'11\"", weight: "187 lbs", grade: "9.3", proComp: "Golden Tate",
    stats: { "YAC": 96, "Elusiveness": 95, "Hands": 90 }, image: "bg-red-700/20",
    fantasyOdds: { top25: 35, top50: 55, top100: 78, top150: 89 },
    strengths: [
      "Gadget player potential with elite YAC ability.",
      "Instant acceleration makes him dangerous on screens.",
      "Creative runner in open space."
    ],
    weaknesses: [
      "Undersized for a perimeter role; strictly a slot/gadget guy.",
      "Route running depth needs to expand beyond the line of scrimmage."
    ]
  },
  {
    id: 8, rank: 8, name: "Jadarian Price", school: "Notre Dame", pos: "RB",
    height: "5'10\"", weight: "200 lbs", grade: "9.1", proComp: "Tony Pollard",
    stats: { "Burst": 94, "Speed": 93, "Vision": 89 }, image: "bg-blue-950/20",
    fantasyOdds: { top25: 35, top50: 58, top100: 79, top150: 90 },
    strengths: [
      "Explosive first step that gets him to the second level instantly.",
      "Efficient runner who doesn't dance in the backfield.",
      "Capable receiver with soft hands."
    ],
    weaknesses: [
      "Durability concerns with a history of injuries.",
      "Needs to improve patience to let blocks develop."
    ]
  },
  {
    id: 9, rank: 9, name: "Kenyon Sadiq", school: "Oregon", pos: "TE",
    height: "6'3\"", weight: "235 lbs", grade: "9.1", proComp: "Chig Okonkwo",
    stats: { "Athleticism": 95, "Speed": 90, "Blocking": 75 }, image: "bg-green-800/20",
    fantasyOdds: { top25: 25, top50: 45, top100: 70, top150: 85 },
    strengths: [
      "Move-TE who creates mismatches against linebackers.",
      "Fluid athlete who runs routes like a big receiver.",
      "Dangerous after the catch."
    ],
    weaknesses: [
      "Undersized for in-line blocking duties.",
      "Can get pushed around by physical defensive ends."
    ]
  },
  {
    id: 10, rank: 10, name: "Fernando Mendoza", school: "Indiana", pos: "QB",
    height: "6'5\"", weight: "225 lbs", grade: "9.0", proComp: "Jared Goff",
    stats: { "Accuracy": 92, "IQ": 90, "Pocket Presence": 88 }, image: "bg-red-700/20",
    fantasyOdds: { top25: 20, top50: 40, top100: 75, top150: 92 },
    strengths: [
      "Pro-style processor who reads the full field.",
      "Excellent anticipation thrower into tight windows.",
      "Tough leader who stands tall in the pocket."
    ],
    weaknesses: [
      "Lack of mobility limits his fantasy ceiling.",
      "Arm strength is good, not elite."
    ]
  },
  {
    id: 11, rank: 11, name: "Kaytron Allen", school: "Penn State", pos: "RB",
    height: "5'11\"", weight: "221 lbs", grade: "8.9", proComp: "AJ Dillon",
    stats: { "Power": 94, "Vision": 90, "Speed": 85 }, image: "bg-blue-900/20",
    fantasyOdds: { top25: 28, top50: 52, top100: 75, top150: 88 },
    strengths: [
      "Consistent, no-nonsense runner who falls forward.",
      "Excellent vision in gap-scheme runs.",
      "Reliable pass protector."
    ],
    weaknesses: [
      "Lacks the explosive gear to turn corners.",
      "Not a dynamic threat in the passing game."
    ]
  },

  // --- TIER 3: DEPTH & SLEEPERS ---
  {
    id: 12, rank: 12, name: "Emmett Johnson", school: "Nebraska", pos: "RB",
    height: "5'11\"", weight: "190 lbs", grade: "8.8", proComp: "James Cook",
    stats: { "Agility": 93, "Receiving": 90, "Power": 80 }, image: "bg-red-700/20",
    fantasyOdds: { top25: 25, top50: 48, top100: 72, top150: 86 },
    strengths: [
      "Fluid pass catcher who runs excellent routes.",
      "Shifty in open space; makes the first man miss.",
      "Good burst to the edge."
    ],
    weaknesses: [
      "Runs light; struggles to push the pile.",
      "Pass protection against blitzing LBs is a liability."
    ]
  },
  {
    id: 13, rank: 13, name: "Chris Bell", school: "Louisville", pos: "WR",
    height: "6'2\"", weight: "225 lbs", grade: "8.8", proComp: "Allen Lazard",
    stats: { "Blocking": 95, "Size": 94, "Hands": 88 }, image: "bg-red-600/20",
    fantasyOdds: { top25: 20, top50: 42, top100: 68, top150: 82 },
    strengths: [
      "Bully receiver who dominates at the catch point.",
      "Elite blocker for the position.",
      "Uses size well to box out defenders."
    ],
    weaknesses: [
      "Heavy feet; struggles to separate quickly.",
      "Not a vertical threat."
    ]
  },
  {
    id: 14, rank: 14, name: "Nicholas Singleton", school: "Penn State", pos: "RB",
    height: "6'0\"", weight: "228 lbs", grade: "8.7", proComp: "Saquon Barkley",
    stats: { "Speed": 96, "Power": 92, "Vision": 80 }, image: "bg-blue-900/20",
    fantasyOdds: { top25: 22, top50: 45, top100: 70, top150: 85 },
    strengths: [
      "Rare size-speed combination.",
      "Home run hitter who can score from anywhere.",
      "Improved power runner between the tackles."
    ],
    weaknesses: [
      "Tendency to bounce runs outside too often.",
      "Vision in traffic can be inconsistent."
    ]
  },
  {
    id: 15, rank: 15, name: "Eli Stowers", school: "Vanderbilt", pos: "TE",
    height: "6'4\"", weight: "235 lbs", grade: "8.6", proComp: "Taysom Hill",
    stats: { "Athleticism": 94, "Versatility": 95, "Route": 82 }, image: "bg-yellow-500/20",
    fantasyOdds: { top25: 15, top50: 35, top100: 60, top150: 80 },
    strengths: [
      "Unique athlete (QB convert) with ball-carrier vision.",
      "Versatile weapon who can line up everywhere.",
      "Strong runner after the catch."
    ],
    weaknesses: [
      "Still learning the nuances of route running.",
      "Blocking technique is raw."
    ]
  },
  {
    id: 16, rank: 16, name: "Elijah Sarratt", school: "Indiana", pos: "WR",
    height: "6'2\"", weight: "207 lbs", grade: "8.5", proComp: "Jakobi Meyers",
    stats: { "Route Running": 92, "Hands": 94, "Speed": 84 }, image: "bg-red-700/20",
    fantasyOdds: { top25: 18, top50: 38, top100: 65, top150: 80 },
    strengths: [
      "Reliable possession receiver who moves the chains.",
      "Strong hands; rarely drops a pass.",
      "Good size for the perimeter."
    ],
    weaknesses: [
      "Average speed; won't run away from defenders.",
      "Ceiling is likely capped as a WR2/3."
    ]
  },
  {
    id: 17, rank: 17, name: "Omar Cooper Jr.", school: "Indiana", pos: "WR",
    height: "6'1\"", weight: "195 lbs", grade: "8.4", proComp: "Tyler Boyd",
    stats: { "Hands": 92, "Route": 90, "Speed": 85 }, image: "bg-red-700/20",
    fantasyOdds: { top25: 15, top50: 35, top100: 62, top150: 78 },
    strengths: [
      "Smooth route runner who finds soft spots in zone.",
      "Reliable hands catcher.",
      "Good body control."
    ],
    weaknesses: [
      "Lacks explosive athleticism.",
      "Struggles to separate against press man."
    ]
  },
  {
    id: 18, rank: 18, name: "Germie Bernard", school: "Alabama", pos: "WR",
    height: "6'1\"", weight: "203 lbs", grade: "8.3", proComp: "Jermaine Burton",
    stats: { "Speed": 91, "Physicality": 88, "YAC": 86 }, image: "bg-red-900/20",
    fantasyOdds: { top25: 12, top50: 32, top100: 60, top150: 76 },
    strengths: [
      "Physical runner with the ball in his hands.",
      "Willing blocker who plays with an edge.",
      "Versatile enough to take handoffs."
    ],
    weaknesses: [
      "Not a natural separator.",
      "Route running can be rounded."
    ]
  },
  {
    id: 19, rank: 19, name: "Chris Brazzell II", school: "Tennessee", pos: "WR",
    height: "6'5\"", weight: "200 lbs", grade: "8.3", proComp: "George Pickens",
    stats: { "Size": 95, "Jump Ball": 94, "Speed": 88 }, image: "bg-orange-600/20",
    fantasyOdds: { top25: 14, top50: 34, top100: 61, top150: 77 },
    strengths: [
      "Elite height and length for the position.",
      "Acrobatic catches with a massive catch radius.",
      "Deceptive build-up speed."
    ],
    weaknesses: [
      "Thin frame; struggles with physical press.",
      "Limited agility in short areas."
    ]
  },
  {
    id: 20, rank: 20, name: "Antonio Williams", school: "Clemson", pos: "WR",
    height: "5'11\"", weight: "195 lbs", grade: "8.2", proComp: "Christian Kirk",
    stats: { "Route Running": 90, "Hands": 88, "YAC": 85 }, image: "bg-orange-700/20",
    fantasyOdds: { top25: 10, top50: 30, top100: 58, top150: 75 },
    strengths: [
      "Polished slot receiver with quick feet.",
      "Understands leverage and how to set up defenders.",
      "Reliable safety valve for QBs."
    ],
    weaknesses: [
      "Lacks elite athletic traits.",
      "Injury history is a concern."
    ]
  },
  {
    id: 21, rank: 21, name: "Ty Simpson", school: "Alabama", pos: "QB",
    height: "6'2\"", weight: "203 lbs", grade: "8.2", proComp: "Mac Jones",
    stats: { "Accuracy": 90, "IQ": 92, "Arm": 85 }, image: "bg-red-900/20",
    fantasyOdds: { top25: 8, top50: 25, top100: 55, top150: 82 },
    strengths: [
      "Good processor who makes quick decisions.",
      "Accurate distributor within the structure of the offense.",
      "Functional mobility to extend plays."
    ],
    weaknesses: [
      "Arm strength is average.",
      "Can get rattled by interior pressure."
    ]
  },
  {
    id: 22, rank: 22, name: "Mike Washington Jr.", school: "NMSU", pos: "RB",
    height: "5'8\"", weight: "205 lbs", grade: "8.1", proComp: "Devin Singletary",
    stats: { "Agility": 88, "Vision": 85, "Balance": 87 }, image: "bg-red-900/20",
    fantasyOdds: { top25: 12, top50: 28, top100: 55, top150: 78 },
    strengths: [
      "Quick feet and excellent lateral agility.",
      "Low center of gravity makes him hard to hit squarely.",
      "Productive runner with good vision."
    ],
    weaknesses: [
      "Small stature limits his workload potential.",
      "Lack of top-end speed."
    ]
  },
  {
    id: 23, rank: 23, name: "Malachi Fields", school: "Virginia", pos: "WR",
    height: "6'4\"", weight: "220 lbs", grade: "8.1", proComp: "Drake London",
    stats: { "Size": 96, "Contested Catch": 94, "Speed": 82 }, image: "bg-orange-600/20",
    fantasyOdds: { top25: 10, top50: 26, top100: 52, top150: 74 },
    strengths: [
      "Uses his big body to box out defenders like a power forward.",
      "Dominant at the catch point.",
      "Strong hands."
    ],
    weaknesses: [
      "Struggles to create separation with speed.",
      "Heavy mover in and out of breaks."
    ]
  },
  {
    id: 24, rank: 24, name: "Zachariah Branch", school: "Georgia", pos: "WR",
    height: "5'10\"", weight: "175 lbs", grade: "8.0", proComp: "Jaylen Waddle",
    stats: { "Speed": 99, "Return": 99, "Size": 75 }, image: "bg-red-600/20",
    fantasyOdds: { top25: 8, top50: 25, top100: 50, top150: 72 },
    strengths: [
      "Electrifying speed and acceleration.",
      "Game-breaking return specialist.",
      "Dangerous with the ball in space."
    ],
    weaknesses: [
      "Undersized frame raises durability concerns.",
      "Still developing as a polished route runner."
    ]
  },
  {
    id: 25, rank: 25, name: "Garrett Nussmeier", school: "LSU", pos: "QB",
    height: "6'2\"", weight: "198 lbs", grade: "8.0", proComp: "Kirk Cousins",
    stats: { "IQ": 90, "Accuracy": 88, "Mobility": 70 }, image: "bg-purple-800/20",
    fantasyOdds: { top25: 8, top50: 22, top100: 50, top150: 80 },
    strengths: [
      "Gunslinger mentality who attacks all levels of the field.",
      "Clean mechanics and quick release.",
      "Experienced starter in a pro-style offense."
    ],
    weaknesses: [
      "Prone to forcing throws into coverage.",
      "Limited mobility hinders his ability to create."
    ]
  },
  {
    id: 26, rank: 26, name: "Ja'Kobi Lane", school: "USC", pos: "WR",
    height: "6'4\"", weight: "195 lbs", grade: "7.9", proComp: "Tee Higgins",
    stats: { "Size": 94, "Jump Ball": 92, "Route": 85 }, image: "bg-red-800/20",
    fantasyOdds: { top25: 8, top50: 22, top100: 48, top150: 70 },
    strengths: [
      "Rare height and length.",
      "Huge catch radius for red-zone targets.",
      "Fluid mover for his size."
    ],
    weaknesses: [
      "Needs to add significant muscle mass.",
      "Can struggle against physical press coverage."
    ]
  },
  {
    id: 27, rank: 27, name: "Demond Claiborne", school: "Wake Forest", pos: "RB",
    height: "5'9\"", weight: "200 lbs", grade: "7.9", proComp: "Kenneth Walker III",
    stats: { "Speed": 94, "Burst": 90, "Vision": 82 }, image: "bg-yellow-800/20",
    fantasyOdds: { top25: 10, top50: 24, top100: 50, top150: 72 },
    strengths: [
      "Explosive acceleration through the hole.",
      "Home run threat whenever he touches the ball.",
      "Good contact balance."
    ],
    weaknesses: [
      "Vision can be hit-or-miss.",
      "Pass protection needs work."
    ]
  },
  {
    id: 28, rank: 28, name: "Adam Randall", school: "Clemson", pos: "WR",
    height: "6'2\"", weight: "225 lbs", grade: "7.8", proComp: "Deebo Samuel (Lite)",
    stats: { "Physicality": 92, "YAC": 88, "Hands": 80 }, image: "bg-orange-700/20",
    fantasyOdds: { top25: 6, top50: 20, top100: 45, top150: 68 },
    strengths: [
      "Running back build at the receiver position.",
      "Hard to bring down after the catch.",
      "Physical blocker."
    ],
    weaknesses: [
      "Production has not matched his physical traits.",
      "Stiff hips limit his route running."
    ]
  },
  {
    id: 29, rank: 29, name: "Roman Hemby", school: "Maryland", pos: "RB",
    height: "6'0\"", weight: "202 lbs", grade: "7.8", proComp: "Raheem Mostert",
    stats: { "Speed": 92, "Cutback": 88, "Power": 80 }, image: "bg-red-600/20",
    fantasyOdds: { top25: 8, top50: 22, top100: 48, top150: 70 },
    strengths: [
      "Track speed in the open field.",
      "Good receiver out of the backfield.",
      "Patient runner."
    ],
    weaknesses: [
      "Runs high and takes big hits.",
      "Lacks power for short-yardage situations."
    ]
  },
  {
    id: 30, rank: 30, name: "J'Mari Taylor", school: "North Texas", pos: "RB",
    height: "5'10\"", weight: "200 lbs", grade: "7.7", proComp: "Khalil Herbert",
    stats: { "Agility": 88, "Vision": 85, "Speed": 88 }, image: "bg-green-700/20",
    fantasyOdds: { top25: 6, top50: 20, top100: 45, top150: 68 },
    strengths: [
      "Versatile back who can do it all.",
      "Solid vision and decision making.",
      "Reliable hands."
    ],
    weaknesses: [
      "Lacks elite physical traits.",
      "Competition level concerns."
    ]
  },
  {
    id: 31, rank: 31, name: "Michael Trigg", school: "Baylor", pos: "TE",
    height: "6'3\"", weight: "240 lbs", grade: "7.7", proComp: "Evan Engram",
    stats: { "Athleticism": 92, "Receiving": 88, "Blocking": 60 }, image: "bg-green-800/20",
    fantasyOdds: { top25: 4, top50: 15, top100: 40, top150: 65 },
    strengths: [
      "Elite athleticism for the position.",
      "Basketball background shows in jump balls.",
      "Dynamic after the catch."
    ],
    weaknesses: [
      "Inconsistent motor and focus.",
      "Blocking is a major liability."
    ]
  },
  {
    id: 32, rank: 32, name: "Deion Burks", school: "Oklahoma", pos: "WR",
    height: "5'11\"", weight: "195 lbs", grade: "7.6", proComp: "Wan'Dale Robinson",
    stats: { "Quickness": 92, "YAC": 90, "Size": 78 }, image: "bg-red-800/20",
    fantasyOdds: { top25: 5, top50: 18, top100: 42, top150: 65 },
    strengths: [
      "Twitchy athlete who creates separation instantly.",
      "Dangerous with the ball in his hands.",
      "Vertical speed to threaten seams."
    ],
    weaknesses: [
      "Small catch radius.",
      "Can get bullied by physical defenders."
    ]
  },
  {
    id: 33, rank: 33, name: "Jamarion Miller", school: "Alabama", pos: "RB",
    height: "5'10\"", weight: "206 lbs", grade: "7.6", proComp: "Jerome Ford",
    stats: { "Speed": 90, "Power": 85, "Receiving": 80 }, image: "bg-red-900/20",
    fantasyOdds: { top25: 6, top50: 20, top100: 45, top150: 68 },
    strengths: [
      "Efficient runner with no wasted motion.",
      "Good burst through the line.",
      "Capable pass catcher."
    ],
    weaknesses: [
      "Stuck in a committee role in college.",
      "Lacks a defining elite trait."
    ]
  },
  {
    id: 34, rank: 34, name: "Skyler Bell", school: "UConn", pos: "WR",
    height: "6'0\"", weight: "195 lbs", grade: "7.5", proComp: "Darnell Mooney",
    stats: { "Speed": 92, "Deep Threat": 88, "Hands": 80 }, image: "bg-blue-800/20",
    fantasyOdds: { top25: 4, top50: 15, top100: 40, top150: 62 },
    strengths: [
      "Legitimate deep speed.",
      "Tracks the ball well downfield.",
      "Quick feet."
    ],
    weaknesses: [
      "Inconsistent hands.",
      "Struggles with physical coverage."
    ]
  },
  {
    id: 35, rank: 35, name: "Le'Veon Moss", school: "Texas A&M", pos: "RB",
    height: "6'0\"", weight: "215 lbs", grade: "7.5", proComp: "Isiah Pacheco",
    stats: { "Power": 92, "Aggression": 95, "Vision": 78 }, image: "bg-red-900/20",
    fantasyOdds: { top25: 5, top50: 18, top100: 42, top150: 65 },
    strengths: [
      "Violent running style.",
      "Finishes every run with power.",
      "Good size for the position."
    ],
    weaknesses: [
      "Aggression can lead to missed cutback lanes.",
      "Limited value in the passing game."
    ]
  },
  {
    id: 36, rank: 36, name: "Max Klare", school: "Purdue", pos: "TE",
    height: "6'4\"", weight: "245 lbs", grade: "7.5", proComp: "Dalton Schultz",
    stats: { "Reliability": 90, "Blocking": 85, "Speed": 75 }, image: "bg-yellow-600/20",
    fantasyOdds: { top25: 3, top50: 12, top100: 38, top150: 62 },
    strengths: [
      "Reliable safety valve for QBs.",
      "Solid blocker in the run game.",
      "Good size and frame."
    ],
    weaknesses: [
      "Lacks dynamic athleticism.",
      "Low ceiling as a receiver."
    ]
  },
  {
    id: 37, rank: 37, name: "Carson Beck", school: "Miami", pos: "QB",
    height: "6'4\"", weight: "220 lbs", grade: "7.4", proComp: "Geno Smith",
    stats: { "Experience": 95, "Accuracy": 85, "Mobility": 75 }, image: "bg-green-700/20",
    fantasyOdds: { top25: 2, top50: 10, top100: 40, top150: 75 },
    strengths: [
      "Highly experienced starter.",
      "Quick release and decision making.",
      "Accurate in the short to intermediate game."
    ],
    weaknesses: [
      "Mobility is functional but not a weapon.",
      "Arm strength is average."
    ]
  },
  {
    id: 38, rank: 38, name: "Jaydn Ott", school: "Cal", pos: "RB",
    height: "6'0\"", weight: "200 lbs", grade: "7.4", proComp: "Rachaad White",
    stats: { "Receiving": 92, "Speed": 88, "Power": 75 }, image: "bg-yellow-600/20",
    fantasyOdds: { top25: 4, top50: 15, top100: 40, top150: 65 },
    strengths: [
      "Excellent receiver out of the backfield.",
      "Fluid runner in open space.",
      "Good vision."
    ],
    weaknesses: [
      "Lacks power between the tackles.",
      "Vision can be inconsistent."
    ]
  },
  {
    id: 39, rank: 39, name: "Justin Joly", school: "NC State", pos: "TE",
    height: "6'3\"", weight: "235 lbs", grade: "7.4", proComp: "Isaiah Likely",
    stats: { "Receiving": 90, "Athleticism": 88, "Blocking": 65 }, image: "bg-red-700/20",
    fantasyOdds: { top25: 3, top50: 10, top100: 35, top150: 60 },
    strengths: [
      "Receiver-first tight end.",
      "Good route runner for the position.",
      "Creates mismatches against LBs."
    ],
    weaknesses: [
      "Undersized for a traditional TE role.",
      "Blocking is a liability."
    ]
  },
  {
    id: 40, rank: 40, name: "Drew Allar", school: "Penn State", pos: "QB",
    height: "6'5\"", weight: "240 lbs", grade: "7.3", proComp: "Will Levis",
    stats: { "Arm Strength": 98, "Size": 98, "Accuracy": 70 }, image: "bg-blue-900/20",
    fantasyOdds: { top25: 2, top50: 8, top100: 35, top150: 70 },
    strengths: [
      "Prototype NFL size and frame.",
      "Cannon for an arm.",
      "Can make every throw on the field."
    ],
    weaknesses: [
      "Inconsistent accuracy and touch.",
      "Decision making under pressure needs work."
    ]
  },
  {
    id: 41, rank: 41, name: "Cade Klubnik", school: "Clemson", pos: "QB",
    height: "6'2\"", weight: "205 lbs", grade: "7.3", proComp: "Derek Carr",
    stats: { "Mobility": 85, "Accuracy": 85, "Decision Making": 75 }, image: "bg-orange-700/20",
    fantasyOdds: { top25: 2, top50: 8, top100: 35, top150: 70 },
    strengths: [
      "Good athlete who can extend plays.",
      "Accurate on the run.",
      "Quick release."
    ],
    weaknesses: [
      "Arm strength limits deep ball effectiveness.",
      "Can be too reckless with the ball."
    ]
  },
  {
    id: 42, rank: 42, name: "Seth McGowan", school: "NMSU", pos: "RB",
    height: "5'11\"", weight: "215 lbs", grade: "7.3", proComp: "Zack Moss",
    stats: { "Contact Balance": 90, "Power": 88, "Speed": 80 }, image: "bg-red-900/20",
    fantasyOdds: { top25: 3, top50: 12, top100: 35, top150: 60 },
    strengths: [
      "Tough runner who breaks tackles.",
      "Good balance through contact.",
      "Productive in a heavy workload."
    ],
    weaknesses: [
      "Lacks breakaway speed.",
      "Off-field history may be a concern for teams."
    ]
  },
  {
    id: 43, rank: 43, name: "Brenen Thompson", school: "Oklahoma", pos: "WR",
    height: "5'9\"", weight: "165 lbs", grade: "7.2", proComp: "Tut Atwell",
    stats: { "Speed": 98, "Agility": 90, "Size": 60 }, image: "bg-red-800/20",
    fantasyOdds: { top25: 2, top50: 10, top100: 32, top150: 55 },
    strengths: [
      "World-class speed.",
      "Instant acceleration.",
      "Deep threat specialist."
    ],
    weaknesses: [
      "Extremely small frame.",
      "Limited route tree and usage."
    ]
  },
  {
    id: 44, rank: 44, name: "Romello Brinson", school: "SMU", pos: "WR",
    height: "6'2\"", weight: "185 lbs", grade: "7.2", proComp: "Rashod Bateman",
    stats: { "Route": 88, "Hands": 85, "Speed": 82 }, image: "bg-blue-800/20",
    fantasyOdds: { top25: 2, top50: 10, top100: 32, top150: 55 },
    strengths: [
      "Smooth route runner.",
      "Good length and catch radius.",
      "Reliable hands."
    ],
    weaknesses: [
      "Thin frame needs bulk.",
      "Lacks explosive traits."
    ]
  },
  {
    id: 45, rank: 45, name: "Noah Whittington", school: "Oregon", pos: "RB",
    height: "5'8\"", weight: "194 lbs", grade: "7.2", proComp: "Chase Edmonds",
    stats: { "Speed": 88, "Receiving": 85, "Power": 70 }, image: "bg-green-800/20",
    fantasyOdds: { top25: 3, top50: 12, top100: 35, top150: 58 },
    strengths: [
      "Quick and decisive runner.",
      "Good receiver out of the backfield.",
      "Change of pace option."
    ],
    weaknesses: [
      "Undersized for an every-down role.",
      "Struggles in pass protection."
    ]
  },
  {
    id: 46, rank: 46, name: "Ted Hurst", school: "Georgia State", pos: "WR",
    height: "6'2\"", weight: "195 lbs", grade: "7.1", proComp: "Darius Slayton",
    stats: { "Deep Threat": 88, "Size": 85, "Consistency": 75 }, image: "bg-blue-600/20",
    fantasyOdds: { top25: 1, top50: 8, top100: 28, top150: 50 },
    strengths: [
      "Vertical field stretcher.",
      "Good size and speed combination.",
      "Productive deep threat."
    ],
    weaknesses: [
      "Inconsistent hands.",
      "Limited route runner."
    ]
  },
  {
    id: 47, rank: 47, name: "Rahsul Faison", school: "Utah State", pos: "RB",
    height: "5'11\"", weight: "205 lbs", grade: "7.1", proComp: "Jeff Wilson Jr.",
    stats: { "Vision": 85, "Speed": 85, "Power": 80 }, image: "bg-blue-900/20",
    fantasyOdds: { top25: 2, top50: 10, top100: 30, top150: 55 },
    strengths: [
      "Physical runner who finishes forward.",
      "Good vision in traffic.",
      "Reliable workload handler."
    ],
    weaknesses: [
      "Average athleticism.",
      "Limited upside."
    ]
  },
  {
    id: 48, rank: 48, name: "Barion Brown", school: "Kentucky", pos: "WR",
    height: "6'1\"", weight: "175 lbs", grade: "7.0", proComp: "Marquez Valdes-Scantling",
    stats: { "Speed": 95, "Return": 95, "Hands": 65 }, image: "bg-blue-800/20",
    fantasyOdds: { top25: 1, top50: 5, top100: 25, top150: 45 },
    strengths: [
      "Elite speed and return ability.",
      "Dynamic with the ball in space.",
      "Deep threat."
    ],
    weaknesses: [
      "Major issues with drops.",
      "Very thin frame."
    ]
  },
  {
    id: 49, rank: 49, name: "Joe Royer", school: "Cincinnati", pos: "TE",
    height: "6'5\"", weight: "250 lbs", grade: "7.0", proComp: "Tyler Conklin",
    stats: { "Hands": 88, "Blocking": 80, "Speed": 70 }, image: "bg-red-600/20",
    fantasyOdds: { top25: 1, top50: 5, top100: 25, top150: 45 },
    strengths: [
      "Reliable hands catcher.",
      "Solid size and frame.",
      "Capable blocker."
    ],
    weaknesses: [
      "Lacks speed and explosiveness.",
      "Just a guy (JAG) athletically."
    ]
  },
  {
    id: 50, rank: 50, name: "Aaron Anderson", school: "LSU", pos: "WR",
    height: "5'9\"", weight: "185 lbs", grade: "7.0", proComp: "KaVontae Turpin",
    stats: { "Agility": 95, "Return": 95, "Size": 65 }, image: "bg-purple-800/20",
    fantasyOdds: { top25: 1, top50: 5, top100: 25, top150: 45 },
    strengths: [
      "Electric quickness and agility.",
      "Dangerous return man.",
      "Hard to tackle in a phone booth."
    ],
    weaknesses: [
      "Tiny frame.",
      "Gadget player profile."
    ]
  }
];