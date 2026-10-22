---
title: Victory Points
toc: false
---

```js
import {allNone} from "./components/filters.js";
```

```js
const events = FileAttachment("./data/events.json").json();
```

```js
const players = [...new Set(events.map((d) => d.actor).filter(Boolean))].sort();
const rounds = [...new Set(events.map((d) => d.round))].sort((a, b) => a - b);
const wrapEvent = (e) => html`<span class="event-text">${e}</span>`;
```

# Victory Points

```js
// One row per player per VP gain; Seed of an Empire splits into several rows.
const scoring = events.flatMap((d) =>
  Object.entries(d.points).map(([player, pts]) => ({n: d.n, round: d.round, player, pts, event: d.event}))
);
{
  const totals = new Map();
  for (const r of scoring) totals.set(r.player, r.total = (totals.get(r.player) ?? 0) + r.pts);
}

const roundStarts = rounds.filter((r) => r > 0).map((r) => events.find((d) => d.round === r));
const seriesColors = dark
  ? ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300"]
  : ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"];

// In-game color names mapped to shades tuned for each theme. Red/green are hard to tell apart
// for colorblind viewers, so the chart keeps its end-of-line name labels.
const GAME_COLORS = dark
  ? {red: "#c42e2e", pink: "#f08cc4", orange: "#f0832a", yellow: "#e8cc4a", green: "#4cc06a", blue: "#5b9cf0"}
  : {red: "#9e2626", pink: "#e06aae", orange: "#e0650f", yellow: "#cfae00", green: "#3fae5a", blue: "#2a6fd6"};

// Each player's in-game color, falling back to the default palette for names not in GAME_COLORS.
const playerColors = players.map((player, i) =>
  GAME_COLORS[events.find((d) => d.actor === player && d.color)?.color] ?? seriesColors[i]
);
// Referencing dark re-reads the page background whenever the theme flips.
const surface = (dark, getComputedStyle(document.body).backgroundColor);
```

```js
// FileAttachment needs literal paths, so every faction icon is listed; the browser only downloads the ones shown.
const FACTION_ICONS = {
  "Arborec": FileAttachment("./icons/Race Icons/Arborec.png"),
  "Argent": FileAttachment("./icons/Race Icons/Argent.png"),
  "Creuss": FileAttachment("./icons/Race Icons/Creuss.png"),
  "Empyrean": FileAttachment("./icons/Race Icons/Empyrean.png"),
  "Hacan": FileAttachment("./icons/Race Icons/Hacan.png"),
  "Jol Nar": FileAttachment("./icons/Race Icons/Jol Nar.png"),
  "Keleres": FileAttachment("./icons/Race Icons/Keleres.png"),
  "L1Z1X": FileAttachment("./icons/Race Icons/L1Z1X.png"),
  "Letnev": FileAttachment("./icons/Race Icons/Letnev.png"),
  "Mahact": FileAttachment("./icons/Race Icons/Mahact.png"),
  "Mentak": FileAttachment("./icons/Race Icons/Mentak.png"),
  "Muaat": FileAttachment("./icons/Race Icons/Muaat.png"),
  "Naalu": FileAttachment("./icons/Race Icons/Naalu.png"),
  "Naaz-Rokha": FileAttachment("./icons/Race Icons/Naaz-Rokha.png"),
  "Nekro": FileAttachment("./icons/Race Icons/Nekro.png"),
  "Nomad": FileAttachment("./icons/Race Icons/Nomad.png"),
  "Saar": FileAttachment("./icons/Race Icons/Saar.png"),
  "Sardakk": FileAttachment("./icons/Race Icons/Sardakk.png"),
  "Sol": FileAttachment("./icons/Race Icons/Sol.png"),
  "Titans": FileAttachment("./icons/Race Icons/Titans.png"),
  "Vuil'Raith": FileAttachment("./icons/Race Icons/Vuil'Raith.png"),
  "Winnu": FileAttachment("./icons/Race Icons/Winnu.png"),
  "Xxcha": FileAttachment("./icons/Race Icons/Xxcha.png"),
  "Yin": FileAttachment("./icons/Race Icons/Yin.png"),
  "Yssaril": FileAttachment("./icons/Race Icons/Yssaril.png")
};

// "The Universities of Jol-Nar" -> "Jol Nar": compare letters and digits only, longest key wins.
const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
function iconFor(faction) {
  if (!faction) return null;
  const key = Object.keys(FACTION_ICONS)
    .filter((k) => normalize(faction).includes(normalize(k)))
    .sort((a, b) => b.length - a.length)[0];
  return key ? FACTION_ICONS[key] : null;
}
```

```js
// Final standings use every scoring row, so the chart's player filter doesn't change them.
const standings = players
  .map((player) => ({
    player,
    faction: events.find((d) => d.actor === player && d.faction)?.faction ?? null,
    vp: d3.sum(scoring.filter((r) => r.player === player), (r) => r.pts),
    color: playerColors[players.indexOf(player)]
  }))
  .sort((a, b) => b.vp - a.vp || a.player.localeCompare(b.player));
const topVp = d3.max(standings, (d) => d.vp);

display(html`<div class="standings">${standings.map((d) => {
  const icon = iconFor(d.faction);
  return html`<div class=${d.vp === topVp ? "standing winner" : "standing"} style=${{borderTopColor: d.color}}>
    ${d.vp === topVp ? html`<span class="winner-tag">Winner</span>` : ""}
    ${icon ? html`<img src=${icon.href} alt=${d.faction}>` : ""}
    <div class="who">
      <strong>${d.player}</strong>
      <span>${d.faction ?? "Unknown faction"}</span>
    </div>
    <div class="vp"><span>${d.vp}</span> VP</div>
  </div>`;
})}</div>`);
```

```js
const vpInput = Inputs.checkbox(players, {label: "Player", value: players});
const vpFilter = Generators.input(vpInput);
```

```js
html`<section class="filters">
  <h2>Filters</h2>
  <div class="grid">
    <div class="card">${allNone(vpInput, players)}${vpInput}</div>
  </div>
</section>`
```

```js
const vpShown = scoring.filter((r) => vpFilter.includes(r.player));

// Step lines start at 0 and run to the last log entry so every player's line spans the game.
const vpLines = vpFilter.flatMap((player) => {
  const rows = vpShown.filter((r) => r.player === player);
  const last = rows.at(-1)?.total ?? 0;
  return [{player, n: 0, total: 0}, ...rows, {player, n: events.length, total: last}];
});

// Players tied at the end get their labels fanned out so they don't overprint.
const endLabels = d3.groups(vpFilter.map((player) => ({player, total: vpLines.findLast((r) => r.player === player).total})), (d) => d.total)
  .flatMap(([, group]) => group.map((d, i) => ({...d, y: d.total + (i - (group.length - 1) / 2) * 0.4})));

display(Plot.plot({
  width,
  height: 380,
  marginRight: 110,
  x: {label: "Log entry", domain: [0, events.length]},
  y: {label: "Victory points", domain: [0, 10], ticks: 10, grid: true},
  color: {domain: players, range: playerColors, legend: true},
  marks: [
    Plot.ruleX(roundStarts, {x: "n", stroke: "currentColor", strokeOpacity: 0.12}),
    Plot.text(roundStarts, {x: "n", text: (d) => `R${d.round}`, frameAnchor: "top", dy: -10, dx: 4, textAnchor: "start", fill: "currentColor", fillOpacity: 0.6}),
    Plot.ruleY([10], {stroke: "currentColor", strokeOpacity: 0.5, strokeDasharray: "4,4"}),
    Plot.line(vpLines, {x: "n", y: "total", z: "player", stroke: "player", strokeWidth: 2, curve: "step-after"}),
    Plot.text(endLabels, {x: events.length, y: "y", text: "player", dx: 8, textAnchor: "start", fill: "currentColor"}),
    Plot.dot(vpShown, Plot.pointer({x: "n", y: "total", fill: "player", r: 5, stroke: surface, strokeWidth: 2})),
    Plot.tip(vpShown, Plot.pointer({
      x: "n",
      y: "total",
      title: (d) => `${d.player}: ${d.total} VP (+${d.pts})\n#${d.n} · ${d.round === 0 ? "setup" : `R${d.round}`}\n${d.event}`
    }))
  ]
}));
```

```js
const vpTable = Inputs.table(vpShown, {
  columns: ["n", "round", "player", "pts", "total", "event"],
  header: {n: "#", round: "Rd", player: "Player", pts: "+VP", total: "Total", event: "Event"},
  width: {n: 55, round: 45, player: 110, pts: 50, total: 55},
  format: {
    round: (r) => (r === 0 ? "—" : r),
    pts: (p) => `+${p}`,
    event: wrapEvent
  },
  rows: 12,
  select: false,
  layout: "fixed"
});
vpTable.classList.add("log-table");
display(vpTable);
```

<style>

.standings {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin: 1rem 0 2rem;
}

.standing {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  text-align: center;
  border: 1px solid var(--theme-foreground-faintest);
  border-top: 4px solid;
  border-radius: 12px;
  background: var(--theme-background-alt);
}

.standing.winner {
  border-color: var(--theme-foreground-focus);
  border-width: 2px;
  border-top-width: 4px;
}

.standing img {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.standing .who {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.standing .who span {
  font-size: 12px;
  color: var(--theme-foreground-muted);
}

.standing .vp {
  font-size: 12px;
  color: var(--theme-foreground-muted);
}

.standing .vp span {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  color: var(--theme-foreground);
}

.winner-tag {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: var(--theme-foreground-focus);
  color: var(--theme-background);
}

</style>
