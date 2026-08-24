// game/events.js — data-driven random event system
// Event schema: { id, minAge, maxAge, requires(char)->bool, weight, text(char)->string, tone,
//                 choices: [{ label, apply(char, engine) }] }  or single-outcome events with `apply`.
import { clamp, rand } from "./state.js";

export const EVENTS = [
  {
    id: "toddler_tantrum", minAge: 1, maxAge: 4, weight: 10, tone: "neutral",
    requires: () => true,
    text: (c) => `${c.name} threw a tantrum in the supermarket.`,
    choices: [
      { label: "Comfort them", apply: (c) => { c.stats.happiness = clamp(c.stats.happiness + 4); } },
      { label: "Ignore it", apply: (c) => { c.stats.happiness = clamp(c.stats.happiness - 2); } }
    ]
  },
  {
    id: "first_words", minAge: 1, maxAge: 2, weight: 8, tone: "good",
    requires: (c) => !c.flags.saidFirstWord,
    text: (c) => `${c.name} said their first word!`,
    choices: [{ label: "Cherish it", apply: (c) => { c.flags.saidFirstWord = true; c.stats.happiness = clamp(c.stats.happiness + 3); } }]
  },
  {
    id: "bullying", minAge: 6, maxAge: 15, weight: 9, tone: "bad",
    requires: () => true,
    text: () => `A classmate has been bullying you at school.`,
    choices: [
      { label: "Stand up to them", apply: (c) => { const win = Math.random() < (c.stats.athleticism || 30)/100 + 0.2; c.stats.happiness = clamp(c.stats.happiness + (win?6:-8)); c.karma += win?2:0; } },
      { label: "Tell a teacher", apply: (c) => { c.stats.happiness = clamp(c.stats.happiness + 2); } },
      { label: "Suffer in silence", apply: (c) => { c.stats.happiness = clamp(c.stats.happiness - 6); } }
    ]
  },
  {
    id: "found_wallet", minAge: 8, maxAge: 90, weight: 6, tone: "neutral",
    requires: () => true,
    text: () => `You found a wallet with cash on the sidewalk.`,
    choices: [
      { label: "Return it to the owner", apply: (c) => { c.karma = clamp(c.karma + 8, 0, 100); c.stats.happiness = clamp(c.stats.happiness + 3); } },
      { label: "Keep the cash", apply: (c) => { c.money += rand(20, 200); c.karma = clamp(c.karma - 6, 0, 100); } }
    ]
  },
  {
    id: "lottery_windfall", minAge: 18, maxAge: 90, weight: 2, tone: "good",
    requires: () => true,
    text: () => `You bought a lottery ticket on a whim.`,
    choices: [{ label: "Check the numbers", apply: (c) => { const won = Math.random() < 0.05; if (won) { const amt = rand(5000, 500000); c.money += amt; c.eventLog.push({age:c.age, text:`🎉 You won $${amt.toLocaleString()} in the lottery!`, tone:"good"}); } else { c.money -= 10; } } }]
  },
  {
    id: "alien_abduction", minAge: 10, maxAge: 90, weight: 1, tone: "good",
    requires: () => true,
    text: () => `You woke up in a field with no memory of the night before. Strange lights were seen in the area.`,
    choices: [{ label: "Investigate", apply: (c) => { c.stats.happiness = clamp(c.stats.happiness + 5); c.flags.abducted = true; } }]
  },
  {
    id: "illness", minAge: 0, maxAge: 90, weight: 8, tone: "bad",
    requires: (c) => c.stats.health < 60,
    text: () => `You've come down with a nasty flu.`,
    choices: [
      { label: "Rest and recover", apply: (c) => { c.stats.health = clamp(c.stats.health + 5); } },
      { label: "Push through it", apply: (c) => { c.stats.health = clamp(c.stats.health - 8); } }
    ]
  },
  {
    id: "freak_accident", minAge: 5, maxAge: 90, weight: 2, tone: "bad",
    requires: () => true,
    text: () => `A vending machine tipped over near you!`,
    choices: [{ label: "React", apply: (c) => { const hurt = Math.random() < 0.3; if (hurt) { c.stats.health = clamp(c.stats.health - rand(10,25)); c.eventLog.push({age:c.age, text:"You were injured by the falling machine.", tone:"bad"}); } } }]
  },
  {
    id: "friend_request", minAge: 6, maxAge: 90, weight: 7, tone: "neutral",
    requires: () => true,
    text: () => `A classmate wants to be your friend.`,
    choices: [
      { label: "Accept", apply: (c, engine) => { engine.addRelationship(c, "friend", "New Friend"); c.stats.happiness = clamp(c.stats.happiness + 3); } },
      { label: "Decline", apply: () => {} }
    ]
  },
  {
    id: "exam_stress", minAge: 10, maxAge: 18, weight: 6, tone: "neutral",
    requires: () => true,
    text: () => `Big exams are coming up.`,
    choices: [
      { label: "Study hard", apply: (c) => { c.education.gpa = clamp(c.education.gpa + rand(3,8), 0, 100); c.stats.happiness = clamp(c.stats.happiness - 3); c.stats.smarts = clamp(c.stats.smarts + 2); } },
      { label: "Slack off", apply: (c) => { c.education.gpa = clamp(c.education.gpa - rand(2,6), 0, 100); c.stats.happiness = clamp(c.stats.happiness + 3); } }
    ]
  },
  {
    id: "family_dinner", minAge: 3, maxAge: 90, weight: 5, tone: "neutral",
    requires: (c) => c.relationships.some(r => r.type === "parent" && r.alive),
    text: () => `Your family invites you to a Sunday dinner.`,
    choices: [
      { label: "Go and bond", apply: (c, engine) => { engine.adjustAllRelationships(c, "parent", 6); c.stats.happiness = clamp(c.stats.happiness + 2); } },
      { label: "Skip it", apply: (c, engine) => { engine.adjustAllRelationships(c, "parent", -4); } }
    ]
  },
  {
    id: "job_offer_luck", minAge: 18, maxAge: 90, weight: 4, tone: "good",
    requires: (c) => !c.career.track,
    text: () => `A distant contact mentions a job opening.`,
    choices: [{ label: "Look into it", apply: (c) => { c.flags.jobLead = true; } }]
  },
  {
    id: "scandal_rumor", minAge: 16, maxAge: 90, weight: 3, tone: "bad",
    requires: (c) => c.fame > 40,
    text: () => `A tabloid is running a rumor about you.`,
    choices: [
      { label: "Deny publicly", apply: (c) => { c.fame = clamp(c.fame - 4, 0, 100); } },
      { label: "Ignore the press", apply: (c) => { c.karma = clamp(c.karma + 1); } }
    ]
  },
  {
    id: "windfall_inheritance", minAge: 18, maxAge: 90, weight: 1, tone: "good",
    requires: () => true,
    text: () => `A distant relative you barely knew has passed away and left you something.`,
    choices: [{ label: "Accept the inheritance", apply: (c) => { const amt = rand(1000, 20000); c.money += amt; c.eventLog.push({age:c.age, text:`You inherited $${amt.toLocaleString()}.`, tone:"good"}); } }]
  },
  {
    id: "heartbreak", minAge: 16, maxAge: 90, weight: 4, tone: "bad",
    requires: (c) => c.relationships.some(r => r.type === "partner" && r.alive),
    text: () => `Things have been tense with your partner lately.`,
    choices: [
      { label: "Have a heart-to-heart", apply: (c, engine) => { engine.adjustAllRelationships(c, "partner", 10); } },
      { label: "Avoid the conversation", apply: (c, engine) => { engine.adjustAllRelationships(c, "partner", -10); } }
    ]
  },
  // Football-flavored events [Innovation]
  {
    id: "fb_wonderkid_trial", minAge: 5, maxAge: 15, weight: 5, tone: "football",
    requires: (c) => c.flags.inYouthFootball,
    text: () => `A scout is watching the youth trial today.`,
    choices: [{ label: "Show off your skills", apply: (c) => { const boost = Math.random() < ((c.stats.athleticism||0)/150); if (boost) { c.stats.athleticism = clamp(c.stats.athleticism + 5); c.eventLog.push({age:c.age, text:"The scout was impressed with your trial performance!", tone:"football"}); } } }]
  },
  {
    id: "fb_locker_room_bustup", minAge: 16, maxAge: 90, weight: 4, tone: "football",
    requires: (c) => c.football.managerTier !== "none",
    text: () => `Two of your players clashed in the dressing room after training.`,
    choices: [
      { label: "Discipline both", apply: (c) => { c.football.boardConfidence = clamp(c.football.boardConfidence + 2, 0, 100); } },
      { label: "Let it slide", apply: (c) => { c.football.boardConfidence = clamp(c.football.boardConfidence - 3, 0, 100); } }
    ]
  },
  {
    id: "fb_transfer_request", minAge: 16, maxAge: 90, weight: 3, tone: "football",
    requires: (c) => c.football.managerTier !== "none" && (c.football.squad?.length || 0) > 0,
    text: () => `Your star player has handed in a transfer request.`,
    choices: [
      { label: "Try to convince them to stay", apply: (c) => { c.football.reputation = clamp(c.football.reputation + (Math.random()<0.5?4:-4), 0, 100); } },
      { label: "Let them go", apply: (c) => { c.football.transferBudget += rand(2,15) * 1000000; } }
    ]
  },
  {
    id: "fb_giant_killing", minAge: 16, maxAge: 90, weight: 2, tone: "football",
    requires: (c) => c.football.managerTier !== "none",
    text: () => `Your side has drawn a top-flight giant in the cup!`,
    choices: [{ label: "Set up for the underdog run", apply: (c) => { const win = Math.random() < 0.25; if (win) { c.football.reputation = clamp(c.football.reputation + 10, 0, 100); c.eventLog.push({age:c.age, text:"🏆 GIANT KILLING! Your underdogs stunned the big club!", tone:"football"}); } } }]
  },
  {
    id: "fb_rival_mindgames", minAge: 16, maxAge: 90, weight: 3, tone: "football",
    requires: (c) => c.football.managerTier !== "none",
    text: () => `A rival manager took a swipe at you in a press conference.`,
    choices: [
      { label: "Fire back", apply: (c) => { c.football.reputation = clamp(c.football.reputation + 2, 0, 100); c.karma = clamp(c.karma - 1); } },
      { label: "Stay diplomatic", apply: (c) => { c.football.boardConfidence = clamp(c.football.boardConfidence + 2, 0, 100); } }
    ]
  },
  {
    id: "fb_matchfix_offer", minAge: 18, maxAge: 90, weight: 1, tone: "football",
    requires: (c) => c.football.reputation > 60,
    text: () => `A stranger approaches with a match-fixing "opportunity."`,
    choices: [
      { label: "Refuse", apply: (c) => { c.karma = clamp(c.karma + 3); } },
      { label: "Accept the bribe", apply: (c) => { c.money += rand(10000, 100000); c.karma = clamp(c.karma - 20, 0, 100); c.football.flags_scandalHeat = (c.football.flags_scandalHeat||0) + 25; } }
    ]
  }
];

export function getEligibleEvents(char) {
  return EVENTS.filter(e => char.age >= e.minAge && char.age <= e.maxAge && e.requires(char));
}
