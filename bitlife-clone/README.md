# LifePath: Football Legacy

A browser-based, text-driven life simulation game inspired by BitLife, built with vanilla HTML/CSS/JS using a state-machine architecture (no Phaser 3 — chosen for minimal footprint since the game is UI/text-driven, not sprite-rendered).

## Running locally
```
cd bitlife-clone
python3 -m http.server 8000
# open http://localhost:8000
```
No build step or dependencies required — pure ES modules, runs directly in any modern browser.

## Structure
- `game/state.js` — character model, save/load to localStorage, RNG helpers
- `game/events.js` — data-driven random event pool (15+ seed events incl. football-flavored)
- `game/careers.js` — 5 seed careers (doctor, lawyer, teacher, actor, organized crime) with promotion logic
- `game/relationships.js` — relationship meters, dating/marriage/children
- `game/crime.js` — tiered crime system incl. football scandal branch (match-fixing, tax evasion, touchline misconduct)
- `game/engine.js` — core Age Up loop, action resolution, death/ribbons, multigenerational legacy
- `game/football/` — self-contained module (squad.js, transfers.js, matchSim.js, season.js, pathway.js) exposing a `CareerModule` interface so the football branch can be toggled independently
- `ui/render.js` — vanilla DOM rendering (stat bars, event log, action tabs, modals, club dashboard)
- `main.js` — bootstraps the Engine and wires UI events

## Innovation-tagged features (original design, not sourced from any specific game)
Athleticism/Reputation(Football) stats, player-to-manager pipeline, coaching badges, manager job ladder, season simulation loop (pre-season/transfer windows/quarterly matches/end-of-season board review), Chairman/Board relationship meter, football scandal crime branch, family football/smarts traits for legacy mode, football-specific ribbons, Career Mode Only launch option, and the collapsible Club Dashboard overlay.

All logic was smoke-tested via headless Node simulations (40+ simulated years, career-mode start, legacy continuation) with no runtime errors.
