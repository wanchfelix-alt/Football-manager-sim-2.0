// game/engine.js — core game loop: ageUp, action resolution, ribbons, death
import { clamp, rand, weightedPick, newCharacter, newGameState, saveGame, loadGame, clearGame } from "./state.js";
import { getEligibleEvents } from "./events.js";
import { annualCareerTick, attemptHire, CAREERS } from "./careers.js";
import { decayRelationships, addRelationship, adjustAllRelationships, interact, tryDate, tryMarry, haveChild } from "./relationships.js";
import { tickIncarceration, attemptCrime } from "./crime.js";
import { tryYouthAcademy, tryTurnPro, playSeasonAsPlayer, retireFromPlaying, startCoachingBadge, studySportsScience, applyForManagerJob } from "./football/pathway.js";
import { CareerModule } from "./football/season.js";
import { negotiate, buyPlayer, sellPlayer, generateTransferMarket } from "./football/transfers.js";

export class Engine {
  constructor() {
    this.state = loadGame() || newGameState();
  }

  get char() {
    return this.state.characters[this.state.currentCharacterId];
  }

  addRelationship(char, type, name, occupation) { return addRelationship(char, type, name, occupation); }
  adjustAllRelationships(char, type, amount) { return adjustAllRelationships(char, type, amount); }

  newLife({ generation = 1, familyTraits, inheritedMoney = 0, careerModeOnly = false } = {}) {
    const parentOccupations = [];
    const char = newCharacter({ generation, familyTraits: familyTraits || { athleticismBonus: 0, smartsBonus: 0 }, inheritedMoney, parentOccupations });
    if (careerModeOnly) {
      char.age = 16;
      char.stats.athleticism = rand(55, 85);
      char.flags.inYouthFootball = true;
      char.football.playerTier = "amateur";
      char.eventLog.push({ age: 16, text: "You begin your story as a 16-year-old football prospect.", tone: "football" });
    }
    this.state.characters[char.id] = char;
    this.state.currentCharacterId = char.id;
    this.save();
    return char;
  }

  save() { saveGame(this.state); }
  reset() { clearGame(); this.state = newGameState(); }

  // ---- Actions available this year (grouped by category) ----
  getAvailableActions() {
    const c = this.char;
    const actions = [];
    if (c.age <= 4) {
      actions.push({ id: "play_infant", label: "Play with toys", category: "Activities" });
      actions.push({ id: "babble", label: "Babble at parents", category: "Relationships" });
    }
    if (c.age >= 5 && c.age <= 17) {
      actions.push({ id: "study", label: "Study hard", category: "Mind & Body" });
      actions.push({ id: "extracurricular", label: "Join extracurricular club", category: "Activities" });
      if (c.age >= 8) actions.push({ id: "crime_pickpocket", label: "Pickpocket someone", category: "Crime" });
      actions.push({ id: "fb_play_in_park", label: "Play football in the park", category: "Activities" });
      if (c.age >= 5) actions.push({ id: "fb_youth_academy", label: "Try out for youth academy", category: "Activities" });
    }
    if (c.age >= 16) {
      actions.push({ id: "date", label: "Go on a date", category: "Relationships" });
      actions.push({ id: "part_time_job", label: "Get a part-time job", category: "Career" });
      actions.push({ id: "fb_turn_pro", label: "Try to turn pro (football)", category: "Career" });
    }
    if (c.age >= 18) {
      actions.push({ id: "university", label: "Apply to university", category: "Career" });
      actions.push({ id: "marry", label: "Propose marriage", category: "Relationships" });
      actions.push({ id: "have_child", label: "Try for a baby", category: "Relationships" });
      actions.push({ id: "adopt", label: "Adopt a child", category: "Relationships" });
      actions.push({ id: "gamble", label: "Go to the casino", category: "Activities" });
      actions.push({ id: "crime_burglary", label: "Attempt a burglary", category: "Crime" });
      actions.push({ id: "crime_gta", label: "Steal a car", category: "Crime" });
      actions.push({ id: "apply_job", label: "Apply for a job", category: "Career" });
      actions.push({ id: "fb_sports_science", label: "Study Sports Science", category: "Career" });
    }
    if (c.age >= 21 && c.football.playerTier !== "none") {
      actions.push({ id: "fb_coaching_badge", label: "Start coaching badge", category: "Career" });
    }
    if (c.age >= 25 && c.football.coachingBadge !== "none") {
      actions.push({ id: "fb_apply_manager", label: "Apply for manager job", category: "Career" });
    }
    if (c.football.managerTier !== "none") {
      actions.push({ id: "fb_run_season", label: "Run this season", category: "Career" });
      actions.push({ id: "fb_transfer_window", label: "Open transfer window", category: "Career" });
    }
    if (c.football.playerTier !== "none" && c.football.playerTier !== "retired" && c.career.track === "football_player") {
      actions.push({ id: "fb_play_season", label: "Play the season", category: "Career" });
      actions.push({ id: "fb_retire", label: "Retire from playing", category: "Career" });
    }
    actions.push({ id: "gym", label: "Work out at the gym", category: "Mind & Body" });
    actions.push({ id: "doctor_visit", label: "Visit the doctor", category: "Mind & Body" });
    actions.push({ id: "socialize", label: "Hang out with friends", category: "Relationships" });
    return actions;
  }

  performAction(actionId) {
    const c = this.char;
    const log = [];
    switch (actionId) {
      case "play_infant": c.stats.happiness = clamp(c.stats.happiness + 4); log.push({ text: "You played happily.", tone: "good" }); break;
      case "babble": adjustAllRelationships(c, "parent", 3); log.push({ text: "You babbled cutely at your parents.", tone: "good" }); break;
      case "study": c.education.gpa = clamp(c.education.gpa + rand(2, 6), 0, 100); c.stats.smarts = clamp(c.stats.smarts + 1); log.push({ text: "You studied hard.", tone: "good" }); break;
      case "extracurricular": c.stats.happiness = clamp(c.stats.happiness + 3); log.push({ text: "You joined a club.", tone: "good" }); break;
      case "crime_pickpocket": { const r = attemptCrime(c, "pickpocket"); log.push({ text: r.caught ? "You got caught pickpocketing!" : `You pickpocketed $${r.payout}.`, tone: r.caught ? "bad" : "neutral" }); break; }
      case "crime_burglary": { const r = attemptCrime(c, "burglary"); log.push({ text: r.caught ? `Caught! Sentenced to ${r.yearsSentence} years.` : `Burglary netted $${r.payout}.`, tone: r.caught ? "bad" : "neutral" }); break; }
      case "crime_gta": { const r = attemptCrime(c, "grand_theft_auto"); log.push({ text: r.caught ? `Caught! Sentenced to ${r.yearsSentence} years.` : `Stole a car worth $${r.payout}.`, tone: r.caught ? "bad" : "neutral" }); break; }
      case "fb_play_in_park": c.stats.athleticism = clamp((c.stats.athleticism || 0) + rand(1, 4)); log.push({ text: "You played football in the park, honing your skills.", tone: "football" }); break;
      case "fb_youth_academy": { const r = tryYouthAcademy(c); log.push({ text: r.success ? "You made the youth academy!" : "You didn't make the academy cut this time.", tone: r.success ? "football" : "neutral" }); break; }
      case "date": { const r = tryDate(c); log.push({ text: r.success ? "You hit it off with your date!" : (r.reason || "The date didn't go well."), tone: r.success ? "good" : "neutral" }); break; }
      case "part_time_job": c.money += rand(500, 2000); log.push({ text: "You worked a part-time job.", tone: "good" }); break;
      case "fb_turn_pro": { const r = tryTurnPro(c); log.push({ text: r.success ? `You turned ${c.football.playerTier}!` : "The trial didn't work out.", tone: r.success ? "football" : "neutral" }); break; }
      case "university": c.education.stage = "University"; log.push({ text: "You enrolled in university.", tone: "good" }); break;
      case "marry": { const r = tryMarry(c); log.push({ text: r.success ? "You got married! 💍" : (r.reason || "Proposal failed."), tone: r.success ? "good" : "neutral" }); break; }
      case "have_child": { const r = haveChild(c, "birth"); log.push({ text: r.success ? "You welcomed a new baby!" : r.reason, tone: r.success ? "good" : "neutral" }); break; }
      case "adopt": { const r = haveChild(c, "adoption"); log.push({ text: r.success ? "You adopted a child!" : r.reason, tone: r.success ? "good" : "neutral" }); break; }
      case "gamble": { const win = Math.random() < 0.45; const amt = rand(50, 500); c.money += win ? amt : -amt; log.push({ text: win ? `You won $${amt} at the casino!` : `You lost $${amt} at the casino.`, tone: win ? "good" : "bad" }); break; }
      case "apply_job": { const eligible = CAREERS.filter(cr => !cr.legit === false && cr.requires(c) && c.age >= cr.minAge); const pick = eligible[rand(0, eligible.length - 1)]; if (pick) { attemptHire(c, pick.id); log.push({ text: `You got hired as a ${pick.name}!`, tone: "good" }); } else log.push({ text: "No jobs available for your qualifications yet.", tone: "neutral" }); break; }
      case "fb_sports_science": { const r = studySportsScience(c); log.push({ text: r.success ? "You graduated with a Sports Science degree." : "Didn't pass this year — try again.", tone: r.success ? "good" : "neutral" }); break; }
      case "fb_coaching_badge": { const r = startCoachingBadge(c); log.push({ text: r.success ? `You earned your Coaching Badge ${r.badge}!` : r.reason, tone: r.success ? "football" : "neutral" }); break; }
      case "fb_apply_manager": { const r = applyForManagerJob(c); log.push({ text: r.success ? `You were hired as manager of ${r.club}!` : r.reason, tone: r.success ? "football" : "neutral" }); break; }
      case "fb_run_season": {
        const start = CareerModule.onSeasonStart(c); log.push(start);
        for (let q = 1; q <= 4; q++) log.push(CareerModule.runQuarter(c, q));
        const end = CareerModule.endOfSeason(c); log.push(end);
        break;
      }
      case "fb_transfer_window": {
        const market = generateTransferMarket(3, 50);
        const target = market[0];
        const offer = Math.round(target.marketValue * 0.9);
        const result = negotiate(target.marketValue, offer);
        if (result.accepted) { buyPlayer(c.football, target, result.finalPrice); log.push({ text: `Signed ${target.name} for $${result.finalPrice.toLocaleString()}.`, tone: "football" }); }
        else log.push({ text: `Negotiation for ${target.name} stalled (they want $${result.counter || target.marketValue}).`, tone: "neutral" });
        break;
      }
      case "fb_play_season": log.push(playSeasonAsPlayer(c)); break;
      case "fb_retire": retireFromPlaying(c); log.push({ text: "You've retired from playing football.", tone: "football" }); break;
      case "gym": c.stats.health = clamp(c.stats.health + 3); c.stats.looks = clamp(c.stats.looks + 1); log.push({ text: "You worked out at the gym.", tone: "good" }); break;
      case "doctor_visit": c.stats.health = clamp(c.stats.health + 6); c.money -= 100; log.push({ text: "You visited the doctor.", tone: "good" }); break;
      case "socialize": c.stats.happiness = clamp(c.stats.happiness + 4); log.push({ text: "You hung out with friends.", tone: "good" }); break;
      default: log.push({ text: "Nothing happened.", tone: "neutral" });
    }
    log.forEach(l => c.eventLog.push({ age: c.age, text: l.text, tone: l.tone }));
    this.save();
    return log;
  }

  ageUp() {
    const c = this.char;
    if (!c.alive) return { died: true, alreadyDead: true };
    c.age += 1;

    // unlock hidden athleticism at 5
    if (c.age === 5 && c.stats.athleticism === 0) {
      c.stats.athleticism = clamp(c.flags._hiddenAthleticismSeed || rand(30, 60));
    }

    // stat drift
    c.stats.happiness = clamp(c.stats.happiness + rand(-6, 6));
    c.stats.health = clamp(c.stats.health + rand(-5, 4) - (c.age > 60 ? 2 : 0));
    c.stats.smarts = clamp(c.stats.smarts + rand(-1, 3));
    c.stats.looks = clamp(c.stats.looks + rand(-2, 1) - (c.age > 50 ? 1 : 0));
    if (c.stats.athleticism > 0) c.stats.athleticism = clamp(c.stats.athleticism + rand(-3, 2) - (c.age > 32 ? 2 : 0));

    decayRelationships(c);

    // career + prison ticks
    const careerLog = annualCareerTick(c);
    const prisonLog = tickIncarceration(c);

    const log = [...careerLog];
    if (prisonLog) log.push(prisonLog);

    // random events
    const eligible = getEligibleEvents(c);
    const shuffled = eligible.sort(() => Math.random() - 0.5).slice(0, rand(1, 3));
    shuffled.forEach(ev => {
      const choice = ev.choices.length > 1 ? ev.choices[rand(0, ev.choices.length - 1)] : ev.choices[0];
      const text = ev.text(c);
      choice.apply(c, this);
      log.push({ text: `${text} → ${choice.label}`, tone: ev.tone });
    });

    log.forEach(l => c.eventLog.push({ age: c.age, text: l.text, tone: l.tone }));

    // death check
    const deathChance = this.computeDeathChance(c);
    if (Math.random() < deathChance) {
      this.handleDeath(c, "natural causes");
      this.save();
      return { died: true, log };
    }

    this.save();
    return { died: false, log };
  }

  computeDeathChance(c) {
    let base = 0.001;
    if (c.age > 70) base += (c.age - 70) * 0.015;
    if (c.stats.health < 20) base += 0.08;
    if (c.criminalRecord.incarcerated && Math.random() < 0.01) base += 0.02;
    return clamp(base, 0, 0.95);
  }

  handleDeath(c, cause) {
    c.alive = false;
    const ribbons = [];
    if (c.karma > 80) ribbons.push("Hero");
    if (c.karma < 20) ribbons.push("Wicked");
    if (c.education.graduated.length >= 2) ribbons.push("Academic");
    if (c.football.trophyCabinet.length >= 3) ribbons.push("Legendary Manager");
    if (c.football.sackedCount >= 5) ribbons.push("Sacked Serial");
    if (c.football.managerTier === "head_topleague" && c.age < 30 + (c.generation - 1)) ribbons.push("Boy Wonder");
    if (c.football.playerTier === "retired" && c.football.managerTier === "none") ribbons.push("Journeyman");
    if (c.football.trophyCabinet.some(t => t.includes("League")) && c.football.trophyCabinet.length >= 2) ribbons.push("Treble Winner");
    c.ribbons = ribbons;
    c.deathCause = cause;
    this.state.achievements.push({ id: `life_${c.id}`, text: `${c.name} died at age ${c.age} — ${ribbons.join(", ") || "an ordinary life"}.`, age: c.age, date: new Date().toISOString() });
  }

  legacyContinue() {
    const prev = this.char;
    const child = prev.relationships.find(r => r.type === "child" && r.alive);
    const familyTraits = { athleticismBonus: 0, smartsBonus: 0 };
    if (prev.education.gpa > 90) familyTraits.smartsBonus = 5;
    if (prev.football.playerTier !== "none" || prev.football.managerTier !== "none") familyTraits.athleticismBonus = 5;
    const inherited = Math.round((prev.money || 0) * 0.5);
    return this.newLife({ generation: (prev.generation || 1) + 1, familyTraits, inheritedMoney: inherited });
  }
}
