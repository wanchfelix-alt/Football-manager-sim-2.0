// game/football/matchSim.js — [Innovation] weighted-random season/match simulation
import { rand, clamp } from "../state.js";
import { squadQuality } from "./squad.js";

const TACTICS = {
  possession: { vsHighPress: -5, vsDefensive: 8, base: 3 },
  counter: { vsPossession: 6, vsHighPress: 4, base: 0 },
  high_press: { vsPossession: 5, vsCounter: -4, base: 2 },
  defensive: { vsPossession: -6, vsCounter: 2, base: -2 }
};

export function simulateMatch(myQuality, oppQuality, tactic = "possession", oppTactic = "possession", fatigue = 0) {
  const tacticMod = (TACTICS[tactic]?.base || 0) - fatigue * 0.15;
  const myScore = myQuality + tacticMod + rand(-15, 15);
  const oppScore = oppQuality + rand(-15, 15);
  const diff = myScore - oppScore;
  let result, myGoals, oppGoals;
  if (diff > 8) { result = "win"; myGoals = rand(2,4); oppGoals = rand(0,1); }
  else if (diff > -8) { result = Math.random() < 0.4 ? "draw" : (diff > 0 ? "win" : "loss");
    myGoals = rand(0,2); oppGoals = rand(0,2); if (result==="draw") oppGoals = myGoals; }
  else { result = "loss"; myGoals = rand(0,1); oppGoals = rand(2,4); }
  return { result, myGoals, oppGoals, report: `${result === "win" ? "W" : result === "loss" ? "L" : "D"} ${myGoals}-${oppGoals}` };
}

export function simulateSeasonQuarter(footballState, opponents, tactic, fatigue) {
  const myQ = squadQuality(footballState.squad);
  const results = opponents.map(opp => {
    const r = simulateMatch(myQ, opp.quality, tactic, opp.tactic, fatigue);
    return { opponent: opp.name, ...r };
  });
  const points = results.reduce((s, r) => s + (r.result === "win" ? 3 : r.result === "draw" ? 1 : 0), 0);
  return { results, points };
}
