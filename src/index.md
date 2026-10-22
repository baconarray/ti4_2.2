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
function allNone(input, values) {
  const set = (v) => { input.value = v; input.dispatchEvent(new Event("input", {bubbles: true})); };
  return html`<div class="filter-actions">
    <button type="button" onclick=${() => set(values)}>All</button>
    <span>·</span>
    <button type="button" onclick=${() => set([])}>None</button>
  </div>`;
}
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
Inputs.table(results, {
  columns: ["n", "round", "time", "actor", "kind", "event"],
  header: {n: "#", round: "Rd", time: "When", actor: "Player", kind: "Kind", event: "Event"},
  width: {n: 55, round: 45, time: 200, actor: 110, kind: 90},
  format: {round: (r) => (r === 0 ? "—" : r)},
  rows: 28,
  select: false,
  layout: "fixed"
})
```

<style>

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--sans-serif);
  margin: 4rem 0 8rem;
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

.filters {
  margin: 1rem 0;
  padding: 1rem 1.25rem;
  border: 1px solid var(--theme-foreground-faintest);
  border-radius: 12px;
  background: var(--theme-background);
}

.filters > h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.filters > .grid {
  margin-bottom: 0;
}

.filters .card {
  position: relative;
  margin: 0;
}

.filter-actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 4px;
  font-size: 12px;
  color: var(--theme-foreground-faint);
}

.filter-actions button {
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  color: var(--theme-foreground-focus);
  cursor: pointer;
}

.filter-actions button:hover {
  text-decoration: underline;
}

.filter-actions button:focus-visible {
  outline: 2px solid var(--theme-foreground-focus);
  outline-offset: 2px;
}

.filters .card form {
  flex-direction: column;
  align-items: stretch;
  width: auto;
  margin: 0;
}

.filters .card form > label {
  width: auto;
  margin: 0 0 0.5rem;
  padding: 0;
  font-weight: 600;
  color: var(--theme-foreground-muted);
}

.filters .card form > div {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filters .card label:has(> input) {
  margin: 0;
  padding: 4px 12px;
  border: 1px solid var(--theme-foreground-faint);
  border-radius: 999px;
  color: var(--theme-foreground-muted);
  cursor: pointer;
  user-select: none;
  transition: background 120ms, border-color 120ms, color 120ms;
}

.filters .card label:has(> input:checked) {
  background: var(--theme-foreground-focus);
  border-color: var(--theme-foreground-focus);
  color: var(--theme-background);
}

.filters .card label:has(> input:focus-visible) {
  outline: 2px solid var(--theme-foreground-focus);
  outline-offset: 2px;
}

.filters .card label > input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  margin: 0;
}

</style>
