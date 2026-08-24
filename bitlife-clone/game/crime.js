// game/crime.js — tiered crime system with detection probability & heat meter
import { clamp, rand } from "./state.js";

export const CRIMES = [
  { id: "pickpocket", name: "Pickpocket", minAge: 8, severity: 1, baseDetection: 0.25, payout: [10, 80], karmaHit: -3 },
  { id: "shoplift", name: "Shoplift", minAge: 8, severity: 1, baseDetection: 0.3, payout: [10, 60], karmaHit: -2 },
  { id: "burglary", name: "Burglary", minAge: 16, severity: 3, baseDetection: 0.4, payout: [200, 3000], karmaHit: -10 },
  { id: "grand_theft_auto", name: "Grand Theft Auto", minAge: 16, severity: 4, baseDetection: 0.45, payout: [1000, 15000], karmaHit: -15 },
  { id: "embezzlement", name: "Embezzlement", minAge: 18, severity: 4, baseDetection: 0.35, payout: [5000, 100000], karmaHit: -18, requiresJob: true },
  { id: "murder", name: "Murder", minAge: 18, severity: 5, baseDetection: 0.6, payout: [0, 0], karmaHit: -40 },
  // Football scandal branch [Innovation]
  { id: "match_fixing", name: "Match Fixing", minAge: 18, severity: 4, baseDetection: 0.4, payout: [10000, 100000], karmaHit: -25, footballOnly: true, minReputation: 60 },
  { id: "tax_evasion_imagerights", name: "Tax Evasion (Image Rights)", minAge: 21, severity: 3, baseDetection: 0.3, payout: [20000, 200000], karmaHit: -15, footballOnly: true, minReputation: 40 },
  { id: "touchline_misconduct", name: "Touchline Misconduct", minAge: 18, severity: 1, baseDetection: 0.5, payout: [0, 0], karmaHit: -5, footballOnly: true }
];

export function attemptCrime(char, crimeId) {
  const crime = CRIMES.find(c => c.id === crimeId);
  if (!crime) return { success: false, reason: "Unknown crime." };
  if (char.age < crime.minAge) return { success: false, reason: "Too young." };
  if (crime.footballOnly && (char.football.reputation || 0) < (crime.minReputation || 0)) return { success: false, reason: "Not enough football reputation." };
  if (crime.requiresJob && !char.career.track) return { success: false, reason: "Requires an active job." };

  const heat = char.criminalRecord.heat || 0;
  const smartsMod = (100 - char.stats.smarts) / 300; // higher smarts = lower detection
  const detectionChance = clamp(crime.baseDetection + heat / 200 + smartsMod, 0.05, 0.95);
  const caught = Math.random() < detectionChance;
  char.karma = clamp(char.karma + crime.karmaHit, 0, 100);

  if (!caught) {
    const payout = rand(crime.payout[0], crime.payout[1]);
    char.money += payout;
    char.criminalRecord.heat = clamp(heat + crime.severity * 2, 0, 100);
    if (crime.footballOnly) {
      char.football.reputation = clamp(char.football.reputation - crime.severity * 3, 0, 100);
    }
    return { success: true, caught: false, payout };
  } else {
    char.criminalRecord.arrests += 1;
    char.criminalRecord.heat = clamp(heat + crime.severity * 5, 0, 100);
    const yearsSentence = crime.severity * rand(1, 2);
    if (crime.footballOnly) {
      char.football.boardConfidence = clamp(char.football.boardConfidence - 30, 0, 100);
      char.football.reputation = clamp(char.football.reputation - crime.severity * 8, 0, 100);
      return { success: true, caught: true, footballScandal: true, reason: `Caught for ${crime.name} — media and board trust damaged.` };
    }
    char.criminalRecord.incarcerated = true;
    char.criminalRecord.yearsLeft = yearsSentence;
    return { success: true, caught: true, yearsSentence };
  }
}

export function tickIncarceration(char) {
  if (!char.criminalRecord.incarcerated) return null;
  char.criminalRecord.yearsLeft -= 1;
  char.stats.happiness = clamp(char.stats.happiness - 5, 0, 100);
  if (char.criminalRecord.yearsLeft <= 0) {
    char.criminalRecord.incarcerated = false;
    return { text: "You were released from prison.", tone: "neutral" };
  }
  return { text: `Year ${crimeYearsServedText(char)} served in prison.`, tone: "bad" };
}
function crimeYearsServedText(char) { return `(${char.criminalRecord.yearsLeft} left)`; }
