// main.js — vanilla bootstrap (lighter footprint chosen over Phaser 3 scene overhead
// since this game is fully text/UI-driven with no sprite rendering needs)
import { Engine } from "./game/engine.js";
import { renderStats, renderClubDashboard, appendLogEntries, renderActionTabs, renderActionList, renderDeathScreen, openModal, closeModal } from "./ui/render.js";
import { interact } from "./game/relationships.js";

const engine = new Engine();
let activeCategory = "Activities";

const screens = { start: "startScreen", game: "gameScreen", death: "deathScreen" };
function showScreen(name) {
  Object.values(screens).forEach(id => document.getElementById(id).classList.add("hidden"));
  document.getElementById(screens[name]).classList.remove("hidden");
}

function refreshUI() {
  const c = engine.char;
  if (!c) return;
  renderStats(c);
  renderClubDashboard(c);
  const actions = engine.getAvailableActions();
  const categories = renderActionTabs(actions, activeCategory, (cat) => { activeCategory = cat; refreshUI(); });
  if (!categories.includes(activeCategory)) activeCategory = categories[0] || "Activities";
  renderActionList(actions, activeCategory, (actionId) => {
    const log = engine.performAction(actionId);
    appendLogEntries(log, c.age);
    refreshUI();
  });
}

document.getElementById("newLifeBtn").onclick = () => {
  engine.newLife();
  document.getElementById("eventLog").innerHTML = "";
  showScreen("game");
  const c = engine.char;
  appendLogEntries([{ text: `${c.backstory} Born in ${c.birthCity}, ${c.birthCountry} under ${c.starSign}.`, tone: "neutral" }], 0);
  refreshUI();
};

document.getElementById("careerModeBtn").onclick = () => {
  engine.newLife({ careerModeOnly: true });
  document.getElementById("eventLog").innerHTML = "";
  showScreen("game");
  appendLogEntries([{ text: "Skipping childhood — you're a 16-year-old football prospect ready to make your mark.", tone: "football" }], 16);
  refreshUI();
};

document.getElementById("loadBtn").onclick = () => {
  if (engine.char) {
    showScreen("game");
    document.getElementById("eventLog").innerHTML = "";
    appendLogEntries([{ text: "Welcome back.", tone: "neutral" }], engine.char.age);
    refreshUI();
  } else {
    alert("No saved life found. Start a New Life first.");
  }
};

document.getElementById("ageUpBtn").onclick = () => {
  const result = engine.ageUp();
  const c = engine.char;
  appendLogEntries(result.log || [], c.age);
  if (result.died) {
    renderDeathScreen(c);
    showScreen("death");
  } else {
    refreshUI();
  }
};

document.getElementById("continueLegacyBtn").onclick = () => {
  engine.legacyContinue();
  document.getElementById("eventLog").innerHTML = "";
  showScreen("game");
  const c = engine.char;
  appendLogEntries([{ text: `Generation ${c.generation}: ${c.backstory} You inherited $${Math.round(c.money).toLocaleString()} from your family.`, tone: "neutral" }], 0);
  refreshUI();
};

document.getElementById("newLifeAfterDeathBtn").onclick = () => {
  engine.newLife();
  document.getElementById("eventLog").innerHTML = "";
  showScreen("game");
  refreshUI();
};

document.getElementById("menuBtn").onclick = () => document.getElementById("sideMenu").classList.remove("hidden");
document.getElementById("closeMenuBtn").onclick = () => document.getElementById("sideMenu").classList.add("hidden");

document.getElementById("cdToggle").onclick = () => document.getElementById("cdBody").classList.toggle("collapsed");

document.getElementById("viewRelationshipsBtn").onclick = () => {
  const c = engine.char;
  const rows = c.relationships.map(r => `
    <div class="rel-row">
      <span>${r.name} (${r.type})</span>
      <span>${r.meter}/100
        <button class="btn btn-small" data-rid="${r.id}" data-act="gift">🎁</button>
        <button class="btn btn-small" data-rid="${r.id}" data-act="spend_time">🕐</button>
      </span>
    </div>`).join("");
  openModal(`<h2>👥 Relationships</h2>${rows || "<p>No relationships yet.</p>"}<button class="btn" id="closeModalBtn">Close</button>`);
  document.querySelectorAll("[data-rid]").forEach(btn => {
    btn.onclick = () => { interact(c, btn.dataset.rid, btn.dataset.act); engine.save(); document.getElementById("viewRelationshipsBtn").onclick(); };
  });
  document.getElementById("closeModalBtn").onclick = closeModal;
};

document.getElementById("viewAssetsBtn").onclick = () => {
  const c = engine.char;
  const rows = c.assets.map(a => `<div class="asset-row"><span>${a.name}</span><span>$${a.value.toLocaleString()}</span></div>`).join("");
  openModal(`<h2>🏠 Assets & Bank</h2><p>Balance: $${Math.round(c.money).toLocaleString()}</p><p>Loan: $${Math.round(c.loanBalance).toLocaleString()}</p>${rows}<button class="btn" id="closeModalBtn">Close</button>`);
  document.getElementById("closeModalBtn").onclick = closeModal;
};

document.getElementById("viewTrophyBtn").onclick = () => {
  const c = engine.char;
  const rows = c.football.trophyCabinet.map(t => `<div class="trophy-row">🏆 ${t}</div>`).join("");
  openModal(`<h2>🏆 Trophy Cabinet</h2>${rows || "<p>No trophies yet.</p>"}<p>Times sacked: ${c.football.sackedCount}</p><button class="btn" id="closeModalBtn">Close</button>`);
  document.getElementById("closeModalBtn").onclick = closeModal;
};

document.getElementById("viewLegacyBtn").onclick = () => {
  const chars = Object.values(engine.state.characters).sort((a,b) => a.generation - b.generation);
  const rows = chars.map(c => `<div class="rel-row"><span>Gen ${c.generation}: ${c.name}</span><span>${c.alive ? "Alive" : `Died age ${c.age}`}</span></div>`).join("");
  openModal(`<h2>🌳 Family Legacy</h2>${rows}<button class="btn" id="closeModalBtn">Close</button>`);
  document.getElementById("closeModalBtn").onclick = closeModal;
};

document.getElementById("exportBtn").onclick = () => {
  const blob = new Blob([JSON.stringify(engine.state.achievements, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "lifepath_achievements.json"; a.click();
};

document.getElementById("resetBtn").onclick = () => {
  if (confirm("Reset your current life? This cannot be undone.")) {
    engine.reset();
    showScreen("start");
    document.getElementById("sideMenu").classList.add("hidden");
  }
};

if (engine.char && engine.char.alive) {
  showScreen("game");
  refreshUI();
} else {
  showScreen("start");
}
