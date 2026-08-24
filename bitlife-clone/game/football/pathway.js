// game/football/pathway.js — [Innovation] player-to-manager pipeline & job ladder
import { rand, clamp } from "../state.js";
import { generateSquad } from "./squad.js";

export function tryYouthAcademy(char) {
  if (char.age < 5 || char.age > 15) return { success: false, reason: "Wrong age for youth academy." };
  char.flags.inYouthFootball = true;
  const chance = ((char.stats.athleticism || 20) + char.stats.health) / 200;
  const success = Math.random() < chance;
  if (success) char.football.playerTier = "youth";
  return { success, chance };
}

export function tryTurnPro(char) {
  const tierOrder = ["youth", "amateur", "semipro", "pro"];
  const idx = tierOrder.indexOf(char.football.playerTier);
  if (idx === -1 || idx >= tierOrder.length - 1) return { success: false, reason: "Not eligible to progress." };
  if (char.age < 16 || char.age > 34) return { success: false, reason: "Outside playing age window." };
  const chance = clamp((char.stats.athleticism * 0.6 + char.stats.health * 0.4) / 100, 0, 1);
  const success = Math.random() < chance;
  if (success) {
    char.football.playerTier = tierOrder[idx + 1];
    char.career.track = "football_player";
    char.career.title = char.football.playerTier;
    char.career.salary = { amateur: 5000, semipro: 25000, pro: 150000 }[char.football.playerTier] || 5000;
  }
  return { success, chance };
}

export function playSeasonAsPlayer(char) {
  const fb = char.football;
  fb.matchesPlayed = (fb.matchesPlayed || 0) + rand(20, 38);
  fb.injuryRisk = clamp((fb.injuryRisk || 0) + fb.matchesPlayed * 0.15, 0, 100);
  char.stats.athleticism = clamp(char.stats.athleticism - rand(0, 2) + (char.age < 27 ? 1 : 0));
  const careerEndingInjury = Math.random() < (fb.injuryRisk / 100) * 0.08;
  if (careerEndingInjury) {
    fb.playerTier = "retired";
    char.flags.retiredByInjury = true;
    return { text: "A career-ending injury has forced you into early retirement.", tone: "bad" };
  }
  return { text: `You completed another season as a ${fb.playerTier} player. Matches played: ${fb.matchesPlayed}.`, tone: "football" };
}

export function retireFromPlaying(char) {
  char.football.playerTier = "retired";
  char.career.track = null;
  return { success: true };
}

export function startCoachingBadge(char) {
  const order = ["none", "C", "B", "A", "Pro"];
  const idx = order.indexOf(char.football.coachingBadge);
  if (idx === -1 || idx >= order.length - 1) return { success: false, reason: "Already at Pro License or invalid." };
  if (char.money < 3000) return { success: false, reason: "Not enough money for course fees." };
  const pass = Math.random() < clamp(char.stats.smarts / 100 + 0.15, 0, 0.95);
  char.money -= 3000;
  if (pass) {
    char.football.coachingBadge = order[idx + 1];
    return { success: true, badge: char.football.coachingBadge };
  }
  return { success: false, reason: "Failed the badge assessment. Try again next year." };
}

export function studySportsScience(char) {
  if (char.age < 18 || char.age > 22) return { success: false, reason: "University age window is 18-22." };
  const pass = Math.random() < clamp(char.stats.smarts / 100, 0, 0.9);
  if (pass) { char.education.graduated.push("Sports Science Degree"); }
  return { success: pass };
}

const JOB_LADDER = [
  { tier: "youth_coach", minBadge: "C", minRep: 0, minAge: 21, salary: 20000 },
  { tier: "asst_lowerleague", minBadge: "B", minRep: 15, minAge: 25, salary: 45000 },
  { tier: "head_lowerleague", minBadge: "B", minRep: 30, minAge: 30, salary: 90000 },
  { tier: "head_topleague", minBadge: "A", minRep: 55, minAge: 35, salary: 2500000 },
  { tier: "national", minBadge: "Pro", minRep: 80, minAge: 40, salary: 4000000 }
];
const BADGE_RANK = { none: 0, C: 1, B: 2, A: 3, Pro: 4 };

export function applyForManagerJob(char) {
  const fb = char.football;
  const eligible = JOB_LADDER.filter(j =>
    BADGE_RANK[fb.coachingBadge] >= BADGE_RANK[j.minBadge] &&
    fb.reputation >= j.minRep &&
    char.age >= j.minAge
  );
  if (eligible.length === 0) return { success: false, reason: "No eligible vacancies yet." };
  const target = eligible[eligible.length - 1];
  const weight = fb.reputation + char.karma * 0.3 + rand(0, 30);
  const hired = weight > 55;
  if (hired) {
    fb.managerTier = target.tier;
    fb.club = `${["Athletic","United","City","Rovers","Town","Wanderers"][rand(0,5)]} ${["FC","AFC",""][rand(0,2)]}`.trim();
    fb.transferBudget = Math.round(target.salary * rand(2, 8));
    fb.squad = generateSquad(40 + BADGE_RANK[target.tier] * 10);
    fb.boardConfidence = 55;
    char.career.track = "football_manager";
    char.career.title = target.tier.replace("_", " ");
    char.career.salary = target.salary;
    return { success: true, tier: target.tier, club: fb.club };
  }
  return { success: false, reason: "Interview didn't go your way this year." };
}
