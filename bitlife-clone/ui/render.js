// ui/render.js — DOM rendering helpers (no framework, vanilla for minimal footprint)
export function renderStats(char) {
  document.getElementById("charName").textContent = char.name;
  document.getElementById("charAge").textContent = `Age ${char.age}`;
  document.getElementById("bar-happiness").style.width = char.stats.happiness + "%";
  document.getElementById("bar-health").style.width = char.stats.health + "%";
  document.getElementById("bar-smarts").style.width = char.stats.smarts + "%";
  document.getElementById("bar-looks").style.width = char.stats.looks + "%";
  document.getElementById("moneyDisplay").textContent = `💰 $${Math.round(char.money).toLocaleString()}`;
}

export function renderClubDashboard(char) {
  const dash = document.getElementById("clubDashboard");
  const body = document.getElementById("cdBody");
  if (char.football.managerTier === "none" || !char.football.club) {
    dash.classList.add("hidden");
    return;
  }
  dash.classList.remove("hidden");
  body.innerHTML = `
    <div>🏟️ ${char.football.club}</div>
    <div>📊 Pos: ${char.football.leaguePosition ?? "-"}</div>
    <div>💷 Budget: $${(char.football.transferBudget||0).toLocaleString()}</div>
    <div>🤝 Board: ${char.football.boardConfidence}%</div>
  `;
}

export function appendLogEntries(entries, age) {
  const log = document.getElementById("eventLog");
  const marker = document.createElement("div");
  marker.className = "log-entry age-marker";
  marker.textContent = `— Age ${age} —`;
  log.appendChild(marker);
  entries.forEach(e => {
    const div = document.createElement("div");
    div.className = `log-entry ${e.tone || "neutral"}`;
    div.textContent = e.text;
    log.appendChild(div);
  });
  log.scrollTop = log.scrollHeight;
}

export function renderActionTabs(actions, activeCategory, onSelect) {
  const categories = [...new Set(actions.map(a => a.category))];
  const tabsEl = document.getElementById("actionTabs");
  tabsEl.innerHTML = "";
  categories.forEach(cat => {
    const tab = document.createElement("div");
    tab.className = "tab" + (cat === activeCategory ? " active" : "");
    tab.textContent = cat;
    tab.onclick = () => onSelect(cat);
    tabsEl.appendChild(tab);
  });
  return categories;
}

export function renderActionList(actions, category, onAction) {
  const listEl = document.getElementById("actionList");
  listEl.innerHTML = "";
  actions.filter(a => a.category === category).forEach(a => {
    const item = document.createElement("div");
    item.className = "action-item";
    item.innerHTML = `<span>${a.label}</span>`;
    item.onclick = () => onAction(a.id);
    listEl.appendChild(item);
  });
}

export function renderDeathScreen(char) {
  const el = document.getElementById("deathSummary");
  const ribbons = char.ribbons.map(r => `<span class="ribbon">${r}</span>`).join(" ");
  el.innerHTML = `
    <p><strong>${char.name}</strong> died at age ${char.age} (${char.deathCause || "unknown causes"}).</p>
    <p>Career: ${char.career.title || "None"} ${char.career.track ? `(${char.career.track})` : ""}</p>
    <p>Final stats — Happiness ${char.stats.happiness}, Health ${char.stats.health}, Smarts ${char.stats.smarts}, Looks ${char.stats.looks}</p>
    <p>Net worth: $${Math.round(char.money).toLocaleString()}</p>
    <p>Karma: ${char.karma}</p>
    ${char.football.trophyCabinet.length ? `<p>Trophy Cabinet: ${char.football.trophyCabinet.join(", ")}</p>` : ""}
    <div>${ribbons}</div>
  `;
}

export function openModal(html) {
  document.getElementById("modalContent").innerHTML = html;
  document.getElementById("modal").classList.remove("hidden");
}
export function closeModal() { document.getElementById("modal").classList.add("hidden"); }
