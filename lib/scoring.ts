// src/lib/scoring.ts

export const SCORING_RULES = {
  passingYards: 0.04,  // 1 pt per 25 yards
  passingTD: 4,
  interception: -2,
  rushingYards: 0.1,   // 1 pt per 10 yards
  rushingTD: 6,
  reception: 1.0,      // PPR
  receivingYards: 0.1,
  receivingTD: 6,
  fumbleLost: -2,
  fgMade: 3,
  xpMade: 1,
  defSack: 1,
  defInt: 2,
  defTd: 6,
  defSafety: 2
};

export const calculateFantasyPoints = (stats: any): number => {
  if (!stats) return 0.0;

  let score = 0;
  score += (stats.pass_yd || 0) * SCORING_RULES.passingYards;
  score += (stats.pass_td || 0) * SCORING_RULES.passingTD;
  score += (stats.int || 0) * SCORING_RULES.interception;
  score += (stats.rush_yd || 0) * SCORING_RULES.rushingYards;
  score += (stats.rush_td || 0) * SCORING_RULES.rushingTD;
  score += (stats.rec || 0) * SCORING_RULES.reception;
  score += (stats.rec_yd || 0) * SCORING_RULES.receivingYards;
  score += (stats.rec_td || 0) * SCORING_RULES.receivingTD;
  score += (stats.fum_lost || 0) * SCORING_RULES.fumbleLost;
  score += (stats.fgm || 0) * SCORING_RULES.fgMade;
  score += (stats.xpm || 0) * SCORING_RULES.xpMade;
  score += (stats.sack || 0) * SCORING_RULES.defSack;
  score += (stats.def_td || 0) * SCORING_RULES.defTd;
  score += (stats.safe || 0) * SCORING_RULES.defSafety;

  return parseFloat(score.toFixed(1));
};