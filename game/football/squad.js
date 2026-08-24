// game/football/squad.js — [Innovation] procedural squad generation & player attributes
import { rand, clamp } from "../state.js";

const FIRST = ["Marco","Kwame","Jonas","Diego","Yuto","Ivan","Bruno","Femi","Tomas","Leon","Rico","Sami"];
const LAST = ["Silva","Adeyemi","Novak","Ferreira","Ito","Kravchenko","Costa","Balogun","Kowal","Duarte"];
const POSITIONS = ["GK","CB","LB","RB","CM","CAM","LW","RW","ST"];

export function generatePlayer(clubPrestige = 50) {
  const pos = POSITIONS[rand(0, POSITIONS.length - 1)];
  const base = clamp(clubPrestige + rand(-20, 20), 10, 95);
  return {
    id: `p_${Date.now()}_${rand(0,99999)}`,
    name: `${FIRST[rand(0,FIRST.length-1)]} ${LAST[rand(0,LAST.length-1)]}`,
    position: pos,
    age: rand(17, 34),
    pace: clamp(base + rand(-15,15)),
    passing: clamp(base + rand(-15,15)),
    defending: pos.includes("B") || pos==="GK" ? clamp(base + rand(-5,20)) : clamp(base + rand(-20,10)),
    finishing: pos==="ST"||pos==="CAM" ? clamp(base + rand(-5,20)) : clamp(base + rand(-20,10)),
    overall: base,
    wageDemand: Math.round(base * rand(300, 900)),
    marketValue: Math.round(base * rand(20000, 90000)),
    morale: rand(50, 85)
  };
}

export function generateSquad(clubPrestige = 50, size = 20) {
  return Array.from({ length: size }, () => generatePlayer(clubPrestige));
}

export function squadQuality(squad) {
  if (!squad || squad.length === 0) return 40;
  const avg = squad.reduce((s, p) => s + p.overall, 0) / squad.length;
  const moraleAvg = squad.reduce((s, p) => s + p.morale, 0) / squad.length;
  return clamp(avg * 0.8 + moraleAvg * 0.2);
}
