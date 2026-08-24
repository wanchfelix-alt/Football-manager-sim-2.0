// game/careers.js — 5 sample careers with salary progression, promotion checks
import { clamp, rand } from "./state.js";

export const CAREERS = [
  {
    id: "doctor", name: "Doctor", legit: true, minAge: 24, requires: (c) => c.education.graduated.includes("Med School"),
    baseSalary: 90000, levels: ["Resident","Junior Doctor","Attending","Senior Consultant","Chief of Medicine"],
    promotionCheck: (c) => c.career.performance + c.stats.smarts * 0.3 + rand(-10,10) > 90
  },
  {
    id: "lawyer", name: "Lawyer", legit: true, minAge: 24, requires: (c) => c.education.graduated.includes("Law School"),
    baseSalary: 75000, levels: ["Paralegal","Associate","Senior Associate","Partner","Managing Partner"],
    promotionCheck: (c) => c.career.performance + c.stats.smarts * 0.25 + rand(-10,10) > 85
  },
  {
    id: "teacher", name: "Teacher", legit: true, minAge: 22, requires: (c) => c.education.graduated.includes("University"),
    baseSalary: 42000, levels: ["Substitute Teacher","Teacher","Senior Teacher","Department Head","Principal"],
    promotionCheck: (c) => c.career.performance + rand(-10,15) > 80
  },
  {
    id: "actor", name: "Actor", legit: true, minAge: 16, requires: () => true,
    baseSalary: 25000, levels: ["Extra","Supporting Actor","Lead Actor","Award Nominee","A-List Star"],
    promotionCheck: (c) => c.career.performance + c.stats.looks * 0.3 + rand(-15,15) > 85,
    fameGain: 5
  },
  {
    id: "organized_crime", name: "Organized Crime", legit: false, minAge: 18, requires: (c) => c.karma < 40,
    baseSalary: 15000, levels: ["Street Runner","Associate","Enforcer","Lieutenant","Capo"],
    promotionCheck: (c) => c.career.performance + (100 - c.karma) * 0.2 + rand(-10,10) > 85,
    karmaHitPerYear: -3
  }
];

export function attemptHire(char, careerId) {
  const def = CAREERS.find(c => c.id === careerId);
  if (!def || char.age < def.minAge || !def.requires(char)) return { success: false, reason: "Not eligible." };
  char.career = { track: def.id, title: def.levels[0], level: 0, salary: def.baseSalary, performance: 50, yearsInRole: 0 };
  return { success: true };
}

export function annualCareerTick(char) {
  if (!char.career.track) return [];
  const def = CAREERS.find(c => c.id === char.career.track);
  if (!def) return [];
  const log = [];
  char.career.performance = clamp(char.career.performance + rand(-8, 10), 0, 100);
  char.career.yearsInRole += 1;
  char.money += char.career.salary;
  if (def.karmaHitPerYear) char.karma = clamp(char.karma + def.karmaHitPerYear, 0, 100);
  if (def.fameGain && Math.random() < 0.3) char.fame = clamp(char.fame + def.fameGain, 0, 100);

  if (char.career.performance < 20 && Math.random() < 0.25) {
    char.career = { track: null, title: null, level: 0, salary: 0, performance: 50, yearsInRole: 0 };
    log.push({ text: `You were fired from your job as ${def.name}.`, tone: "bad" });
    return log;
  }
  if (char.career.level < def.levels.length - 1 && def.promotionCheck(char)) {
    char.career.level += 1;
    char.career.title = def.levels[char.career.level];
    char.career.salary = Math.round(char.career.salary * 1.35);
    log.push({ text: `Promoted to ${char.career.title}! New salary: $${char.career.salary.toLocaleString()}.`, tone: "good" });
  }
  return log;
}
