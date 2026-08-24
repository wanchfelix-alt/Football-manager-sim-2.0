// game/state.js — Character + core state model (JS, browser-native; mirrors state.ts contract)
export const STORAGE_KEY = "lifepath_save_v1";

export function newStats() {
  return {
    happiness: rand(55, 90),
    health: rand(60, 95),
    smarts: rand(40, 85),
    looks: rand(40, 85),
    athleticism: 0 // hidden until age 5 [Innovation]
  };
}

export function newCharacter({ generation = 1, familyTraits = { athleticismBonus: 0, smartsBonus: 0 }, inheritedMoney = 0, parentOccupations = [] } = {}) {
  const sex = Math.random() < 0.5 ? "M" : "F";
  const names = sex === "M"
    ? ["James","Liam","Noah","Ethan","Marcus","Kai","Theo","Ravi","Chen","Diego"]
    : ["Olivia","Emma","Ava","Sophia","Mia","Aisha","Yuki","Nina","Zara","Elena"];
  const surnames = ["Walker","Chen","Okafor","Silva","Kowalski","Tanaka","Novak","Reyes","Berg","Haddad"];
  const cities = [["USA","New York"],["UK","Manchester"],["Brazil","Sao Paulo"],["Japan","Osaka"],["HK","Hong Kong"],["Nigeria","Lagos"],["Poland","Krakow"],["Spain","Madrid"]];
  const [birthCountry, birthCity] = cities[rand(0, cities.length - 1)];
  const signs = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  const backstories = ["You were an accident.","You were planned and much-wanted.","Your parents weren't ready but tried their best.","You were born during a family crisis.","You were the answer to your parents' prayers."];

  const stats = newStats();
  stats.smarts = clamp(stats.smarts + familyTraits.smartsBonus);

  const parentIsAthlete = parentOccupations.some(o => /athlet|football|manager|coach/i.test(o));
  const hiddenAthleticismSeed = clamp(rand(30, 70) + (parentIsAthlete ? rand(10, 25) : 0) + familyTraits.athleticismBonus);

  const char = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
    generation,
    name: `${names[rand(0, names.length - 1)]} ${surnames[rand(0, surnames.length - 1)]}`,
    sex, birthCountry, birthCity, birthYear: 2026 - 0,
    age: 0, alive: true,
    starSign: signs[rand(0, signs.length - 1)],
    backstory: backstories[rand(0, backstories.length - 1)],
    stats,
    karma: 50,
    fame: 0,
    money: inheritedMoney,
    loanBalance: 0,
    relationships: [],
    assets: [],
    education: { stage: "none", gpa: 0, graduated: [] },
    career: { track: null, title: null, level: 0, salary: 0, performance: 50, yearsInRole: 0 },
    football: {
      reputation: 0, injuryRisk: 0, boardConfidence: 50,
      coachingBadge: "none", playerTier: "none", managerTier: "none",
      club: null, transferBudget: 0, trophyCabinet: [], sackedCount: 0, matchesPlayed: 0
    },
    flags: { _hiddenAthleticismSeed: hiddenAthleticismSeed },
    criminalRecord: { arrests: 0, heat: 0, incarcerated: false, yearsLeft: 0 },
    familyTraits,
    ribbons: [],
    eventLog: []
  };

  // Parents
  const occupations = ["Teacher","Engineer","Nurse","Football Manager","Shopkeeper","Lawyer","Chef","Mechanic","Athlete","Accountant","Unemployed","Doctor"];
  const personalities = ["Warm","Strict","Distant","Nurturing","Anxious","Easygoing","Ambitious"];
  char.relationships.push(
    { id: "mother", name: "Mother", type: "parent", meter: rand(60, 90), alive: true, occupation: occupations[rand(0, occupations.length - 1)], personality: personalities[rand(0, personalities.length - 1)] },
    { id: "father", name: "Father", type: "parent", meter: rand(55, 90), alive: true, occupation: occupations[rand(0, occupations.length - 1)], personality: personalities[rand(0, personalities.length - 1)] }
  );
  if (Math.random() < 0.4) {
    char.relationships.push({ id: "sibling1", name: sex === "M" ? "Sister" : "Brother", type: "sibling", meter: rand(40, 80), alive: true });
  }
  if (Math.random() < 0.3) {
    char.relationships.push({ id: "pet1", name: "Family Dog", type: "pet", meter: rand(60, 100), alive: true });
  }
  return char;
}

export function newGameState() {
  return { currentCharacterId: null, characters: {}, achievements: [] };
}

export function saveGame(state) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
export function loadGame() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
export function clearGame() { localStorage.removeItem(STORAGE_KEY); }

export function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
export function clamp(v, min = 0, max = 100) { return Math.max(min, Math.min(max, v)); }

export function weightedPick(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1] ?? null;
}
