---
title: Twilight Imperium 2026
toc: false
---

```js
const events = FileAttachment("./data/events.json").json();
```

```js
function summarize(events) {
  const gameOver = [...events].reverse().find((d) => /^Game over\./.test(d.event));
  return {
    start: events[0].time.split(" at ")[0],
    end: events[events.length - 1].time.split(" at ")[0],
    round: Math.max(...events.map((d) => d.round)),
    winner: gameOver
      ? gameOver.actor ?? /^Game over\. (.+?) wins/.exec(gameOver.event)?.[1] ?? "unknown"
      : null
  };
}

const summary = summarize(events);
```

```js
html`<div class="hero">
  <h1>Twilight Imperium 4</h1>
  <h2>Game Summary</h2>
  <h3>${summary.winner
    ? `Winner: ${summary.winner}`
    : `Game In Progress (Round ${summary.round})`}</h3>
  <p><i>From ${summary.start} to ${summary.end}.</i></p>
</div>`
```
# Game Log

```js
const players = [...new Set(events.map((d) => d.actor).filter(Boolean))].sort();
const playerOptions = [...players, null];
const kinds = [...new Set(events.map((d) => d.kind))].sort();
const rounds = [...new Set(events.map((d) => d.round))].sort((a, b) => a - b);
```

```js
const whoInput = Inputs.checkbox(playerOptions, {label: "Player", value: playerOptions, format: (p) => p ?? "System"});
const roundInput = Inputs.checkbox(rounds, {label: "Round", value: rounds, format: (r) => (r === 0 ? "setup" : `R${r}`)});
const kindInput = Inputs.checkbox(kinds, {label: "Kind", value: kinds});
const whoFilter = Generators.input(whoInput);
const roundFilter = Generators.input(roundInput);
const kindFilter = Generators.input(kindInput);
```

```js
import {allNone} from "./components/filters.js";
```

```js
html`<section class="filters">
  <h2>Filters</h2>
  <div class="grid grid-cols-3">
    <div class="card">${allNone(whoInput, playerOptions)}${whoInput}</div>
    <div class="card">${allNone(roundInput, rounds)}${roundInput}</div>
    <div class="card">${allNone(kindInput, kinds)}${kindInput}</div>
  </div>
</section>`
```

```js
const filtered = events.filter((d) =>
  roundFilter.includes(d.round) &&
  (kindFilter.includes(d.kind) || (d.scored && kindFilter.includes("scoring"))) &&
  whoFilter.includes(d.actor)
);
```

```js
const results = view(Inputs.search(filtered, {
  columns: ["time", "event", "actor"],
  placeholder: "Search the log (planet, card, player, date…)",
  format: (n) => `${n.toLocaleString("en-US")} of ${events.length.toLocaleString("en-US")} entries`
}));
```

```js
const wrapEvent = (e) => html`<span class="event-text">${e}</span>`;
```

```js
const logTable = Inputs.table(results, {
  columns: ["n", "round", "time", "actor", "kind", "event"],
  header: {n: "#", round: "Rd", time: "When", actor: "Player", kind: "Kind", event: "Event"},
  width: {n: 55, round: 45, time: 200, actor: 110, kind: 90},
  format: {
    round: (r) => (r === 0 ? "—" : r),
    event: wrapEvent
  },
  rows: 12,
  select: false,
  layout: "fixed"
});
logTable.classList.add("log-table");
display(logTable);
```

<style>

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--sans-serif);
  margin: 4rem 0 2rem;
  text-wrap: balance;
  text-align: center;
}

.hero h1 {
  margin: 1rem 0;
  padding: 1rem 0;
  max-width: none;
  font-size: 10vw;
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(30deg, var(--theme-foreground-focus), currentColor);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero h2 {
  margin: 0;
  max-width: 34em;
  font-size: 20px;
  font-style: initial;
  font-weight: 500;
  line-height: 1.5;
  color: var(--theme-foreground-muted);
}

@media (min-width: 640px) {
  .hero h1 {
    font-size: 90px;
  }
}

</style>
