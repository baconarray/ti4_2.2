---
title: Whose Move?
toc: false
---

```js
import {allNone} from "./components/filters.js";
import {buildTurns, fmtMinutes} from "./components/turns.js";
```

```js
const events = FileAttachment("./data/events.json").json();
```

```js
const turns = buildTurns(events);
const players = [...new Set(turns.map((d) => d.player))].sort();
const rounds = [...new Set(turns.map((d) => d.round))].sort((a, b) => a - b);
const wrapEvent = (e) => html`<span class="event-text">${e}</span>`;
```

# Whose Move?

A turn starts when the previous player ends their turn or passes, or at the last strategy card pick for a round's first turn, so status, agenda and strategy phases never count against anyone. Passing isn't counted as a turn. Timestamps are wall clock, to the minute.

## Log entries by day and hour

```js
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// The loader stores wall-clock times as UTC, so read them back with the UTC getters.
const dated = events.filter((d) => d.date).map((d) => new Date(d.date));

display(Plot.plot({
  width,
  height: 260,
  marginLeft: 40,
  padding: 0,
  x: {domain: d3.range(24), label: "Hour of day", tickFormat: (h) => (h % 3 === 0 ? h : "")},
  y: {domain: [1, 2, 3, 4, 5, 6, 0], tickFormat: (d) => DAYS[d], label: null},
  color: {scheme: "blues", legend: true, label: "Log entries"},
  marks: [
    Plot.cell(dated, Plot.group({fill: "count"}, {
      x: (d) => d.getUTCHours(),
      y: (d) => d.getUTCDay(),
      inset: 1,
      rx: 2,
      tip: true
    }))
  ]
}));
```

## Waiting for them vs taking the turn

```js
// One summary row per player, slowest median turn first.
const turnStats = d3.groups(turns, (d) => d.player)
  .map(([player, rows]) => {
    const longest = d3.greatest(rows, (d) => d.total);
    const shortest = d3.least(rows, (d) => d.total);
    return {
      player,
      turns: rows.length,
      medianWait: d3.median(rows, (d) => d.wait),
      medianActing: d3.median(rows, (d) => d.acting),
      medianTotal: d3.median(rows, (d) => d.total),
      longest: longest.total,
      longestOn: longest.start,
      shortest: shortest.total,
      shortestOn: shortest.start
    };
  })
  .sort((a, b) => b.medianTotal - a.medianTotal);

const phaseRows = turnStats.flatMap((d) => [
  {player: d.player, phase: "Waiting for them", minutes: d.medianWait},
  {player: d.player, phase: "Taking the turn", minutes: d.medianActing}
]);
```

```js
display(Plot.plot({
  width,
  height: 420,
  marginLeft: 110,
  x: {grid: true, label: "Median hours", transform: (m) => m / 60},
  y: {axis: null, domain: ["Waiting for them", "Taking the turn"]},
  fy: {label: null, domain: turnStats.map((d) => d.player)},
  color: {
    domain: ["Waiting for them", "Taking the turn"],
    range: dark ? ["#3987e5", "#d95926"] : ["#2a78d6", "#eb6834"],
    legend: true
  },
  marks: [
    Plot.barX(phaseRows, {
      fy: "player",
      y: "phase",
      x: "minutes",
      fill: "phase",
      insetTop: 1,
      insetBottom: 1,
      rx: 2,
      channels: {median: {value: (d) => fmtMinutes(d.minutes), label: "Median"}},
      tip: {format: {x: false, y: false, median: true}}
    }),
    Plot.ruleX([0])
  ]
}));
```

<p class="note">Each median is taken on its own, so waiting + taking the turn won't add up to the median turn below.</p>

## Longest and shortest turns

```js
display(Inputs.table(turnStats, {
  columns: ["player", "turns", "medianTotal", "longest", "longestOn", "shortest", "shortestOn"],
  header: {
    player: "Player",
    turns: "Turns",
    medianTotal: "Median turn",
    longest: "Longest",
    longestOn: "Longest started",
    shortest: "Shortest",
    shortestOn: "Shortest started"
  },
  format: {medianTotal: fmtMinutes, longest: fmtMinutes, shortest: fmtMinutes},
  select: false,
  layout: "auto"
}));
```

## Turn log

```js
const whoInput = Inputs.checkbox(players, {label: "Player", value: players});
const roundInput = Inputs.checkbox(rounds, {label: "Round", value: rounds, format: (r) => `R${r}`});
const whoFilter = Generators.input(whoInput);
const roundFilter = Generators.input(roundInput);
```

```js
html`<section class="filters">
  <h2>Filters</h2>
  <div class="grid grid-cols-2">
    <div class="card">${allNone(whoInput, players)}${whoInput}</div>
    <div class="card">${allNone(roundInput, rounds)}${roundInput}</div>
  </div>
</section>`
```

```js
const shownTurns = turns.filter((d) => whoFilter.includes(d.player) && roundFilter.includes(d.round));

const turnTable = Inputs.table(shownTurns, {
  columns: ["n", "round", "player", "start", "wait", "acting", "total", "firstEvent"],
  header: {
    n: "#",
    round: "Rd",
    player: "Player",
    start: "Turn started",
    wait: "Wait",
    acting: "Acting",
    total: "Total",
    firstEvent: "First action"
  },
  width: {n: 55, round: 45, player: 110, start: 200, wait: 75, acting: 75, total: 75},
  format: {wait: fmtMinutes, acting: fmtMinutes, total: fmtMinutes, firstEvent: wrapEvent},
  rows: 12,
  select: false,
  layout: "fixed"
});
turnTable.classList.add("log-table");
display(turnTable);
```
