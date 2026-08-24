// game/football/season.js — [Innovation] pre-season, transfer windows, mid-season checkpoints, end-of-season
import { rand, clamp } from "../state.js";
import { simulateSeasonQuarter } from "./matchSim.js";
import { squadQuality } from "./squad.js";

export const CareerModule = {
  id: "football",
  label: "⚽ Football",
  onSeasonStart(char) {
    const fb = char.football;
    fb.leaguePosition = fb.leaguePosition || rand(8, 16);
    fb.seasonPoints = 0;
    fb.tactic = fb.tactic || "possession";
    return { text: `Pre-season begins at ${fb.club || "your club"}. Set your tactics and season target.`, tone: "football" };
  },
  runQuarter(char, quarterIndex) {
    const fb = char.football;
    const clubPrestige = 40 + (fb.leaguePosition ? (20 - fb.leaguePosition) * 3 : 0);
    const opponents = Array.from({ length: 3 }, (_, i) => ({
      name: `Rival FC ${quarterIndex}-${i}`,
      quality: clamp(clubPrestige + rand(-15, 15)),
      tactic: "possession"
    }));
    const fatigue = fb.squadFatigue || 0;
    const { results, points } = simulateSeasonQuarter(fb, opponents, fb.tactic, fatigue);
    fb.seasonPoints = (fb.seasonPoints || 0) + points;
    fb.squadFatigue = clamp((fb.squadFatigue || 0) + rand(5, 15), 0, 100);
    fb.matchesPlayed = (fb.matchesPlayed || 0) + results.length;
    const summary = results.map(r => `${r.opponent}: ${r.report}`).join(" | ");
    return { text: `Quarter ${quarterIndex} results — ${summary} (+${points} pts)`, tone: "football", results };
  },
  endOfSeason(char) {
    const fb = char.football;
    const totalPoints = fb.seasonPoints || 0;
    let outcome;
    if (totalPoints >= 60) { outcome = "title_challenge"; fb.reputation = clamp(fb.reputation + 15, 0, 100); fb.boardConfidence = clamp(fb.boardConfidence + 20, 0, 100); fb.trophyCabinet.push(`League Title (Age ${char.age})`); }
    else if (totalPoints >= 45) { outcome = "top_half"; fb.reputation = clamp(fb.reputation + 6, 0, 100); fb.boardConfidence = clamp(fb.boardConfidence + 8, 0, 100); }
    else if (totalPoints >= 30) { outcome = "mid_table"; fb.boardConfidence = clamp(fb.boardConfidence - 2, 0, 100); }
    else { outcome = "relegation_battle"; fb.reputation = clamp(fb.reputation - 10, 0, 100); fb.boardConfidence = clamp(fb.boardConfidence - 25, 0, 100); }

    fb.squadFatigue = 0;
    let sacked = false;
    if (fb.boardConfidence < 20 && Math.random() < 0.6) {
      sacked = true;
      fb.sackedCount = (fb.sackedCount || 0) + 1;
      fb.managerTier = "none";
      fb.club = null;
      fb.boardConfidence = 50;
    }
    return { outcome, sacked, text: sacked
      ? `The board has sacked you after a ${outcome.replace("_"," ")} season.`
      : `Season ended: ${outcome.replace("_"," ")}. Board confidence now ${fb.boardConfidence}.`,
      tone: sacked ? "bad" : "football" };
  }
};
