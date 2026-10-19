---
title: Twilight Imperium 2026
toc: false
---


<div class="hero">
  <h1>Twilight Imperium 4</h1>
  <h2>Round 2.2</h2>
  <p><i>From Thursday, March 26, 2026 to Friday, October 16, 2026.</i></p>
</div>

```js
const events = FileAttachment("./data/events.json").json();
```

```js
const players = [...new Set(events.map((d) => d.actor).filter(Boolean))].sort();
const kinds = [...new Set(events.map((d) => d.kind))].sort();
const rounds = [...new Set(events.map((d) => d.round))].sort((a, b) => a - b);
```

```js
const whoFilter = view(Inputs.checkbox(players, {label: "Player", value: players}));
const roundFilter = view(Inputs.checkbox(rounds, {label: "Round", value: rounds, format: (r) => (r === 0 ? "setup" : `R${r}`)}));
const kindFilter = view(Inputs.checkbox(kinds, {label: "Kind", value: kinds}));
```

```js
const filtered = events.filter((d) =>
  roundFilter.includes(d.round) &&
  kindFilter.includes(d.kind) &&
  (d.actor === null || whoFilter.includes(d.actor))
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
  height: 640,
  select: false,
  layout: "fixed"
})
```

<div class="grid grid-cols-2" style="grid-auto-rows: 504px;">
  <div class="card">${
    resize((width) => Plot.plot({
      title: "Your awesomeness over time 🚀",
      subtitle: "Up and to the right!",
      width,
      y: {grid: true, label: "Awesomeness"},
      marks: [
        Plot.ruleY([0]),
        Plot.lineY(aapl, {x: "Date", y: "Close", tip: true})
      ]
    }))
  }</div>
  <div class="card">${
    resize((width) => Plot.plot({
      title: "How big are penguins, anyway? 🐧",
      width,
      grid: true,
      x: {label: "Body mass (g)"},
      y: {label: "Flipper length (mm)"},
      color: {legend: true},
      marks: [
        Plot.linearRegressionY(penguins, {x: "body_mass_g", y: "flipper_length_mm", stroke: "species"}),
        Plot.dot(penguins, {x: "body_mass_g", y: "flipper_length_mm", stroke: "species", tip: true})
      ]
    }))
  }</div>
</div>

---

## Next steps

Here are some ideas of things you could try…

<div class="grid grid-cols-4">
  <div class="card">
    Chart your own data using <a href="https://observablehq.com/framework/lib/plot"><code>Plot</code></a> and <a href="https://observablehq.com/framework/files"><code>FileAttachment</code></a>. Make it responsive using <a href="https://observablehq.com/framework/javascript#resize(render)"><code>resize</code></a>.
  </div>
  <div class="card">
    Create a <a href="https://observablehq.com/framework/project-structure">new page</a> by adding a Markdown file (<code>whatever.md</code>) to the <code>src</code> folder.
  </div>
  <div class="card">
    Add a drop-down menu using <a href="https://observablehq.com/framework/inputs/select"><code>Inputs.select</code></a> and use it to filter the data shown in a chart.
  </div>
  <div class="card">
    Write a <a href="https://observablehq.com/framework/loaders">data loader</a> that queries a local database or API, generating a data snapshot on build.
  </div>
  <div class="card">
    Import a <a href="https://observablehq.com/framework/imports">recommended library</a> from npm, such as <a href="https://observablehq.com/framework/lib/leaflet">Leaflet</a>, <a href="https://observablehq.com/framework/lib/dot">GraphViz</a>, <a href="https://observablehq.com/framework/lib/tex">TeX</a>, or <a href="https://observablehq.com/framework/lib/duckdb">DuckDB</a>.
  </div>
  <div class="card">
    Ask for help, or share your work or ideas, on our <a href="https://github.com/observablehq/framework/discussions">GitHub discussions</a>.
  </div>
  <div class="card">
    Visit <a href="https://github.com/observablehq/framework">Framework on GitHub</a> and give us a star. Or file an issue if you’ve found a bug!
  </div>
</div>

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

</style>
