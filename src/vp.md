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
// Referencing dark re-reads the page background whenever the theme flips.
const surface = (dark, getComputedStyle(document.body).backgroundColor);
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
  color: {domain: players, range: seriesColors, legend: true},
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
