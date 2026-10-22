import {readFileSync} from "node:fs";

const RAW_JSON = "data-raw/log.json";
const RAW_TEXT = "data-raw/log.txt";

// 6-player game: each player picks exactly one strategy card per round.
// In a 3- or 4-player game each player picks two, so double this.
const PICKS_PER_ROUND = 6;

const MONTHS = "January February March April May June July August September October November December".split(" ");

function parseTime(s) {
  const m = /(\w+) (\d+), (\d{4}) at (\d+):(\d+)\s*(AM|PM)/.exec(s);
  if (!m) return null;
  const [, mon, day, year, h, min, ap] = m;
  return new Date(Date.UTC(+year, MONTHS.indexOf(mon), +day, (+h % 12) + (ap === "PM" ? 12 : 0), +min));
}

function attr(tag, name) {
  const m = new RegExp(`${name}="([^"]*)"`).exec(tag);
  return m ? m[1] : null;
}

function classify(text) {
  if (/^Game (created|over)/.test(text)) return "setup";
  if (/rolled dice|produced \d+ hit|assigned hits/.test(text)) return "combat";
  if (/activated the|moved .* into the active system|retreated|committed ground forces/.test(text)) return "movement";
  if (/established control|produced .* in the|placed 1 (PDS|space dock)/.test(text)) return "expansion";
  if (/traded|commodities|trade good/.test(text)) return "economy";
  if (/strategy card|resolved the (primary|secondary) ability/.test(text)) return "strategy";
  if (/agenda|cast \d+ vote|abstained/.test(text)) return "politics";
  if (/technology|researched/.test(text)) return "technology";
  if (/explor|relic fragment|frontier/i.test(text) && !/scored the .+ objective/.test(text)) return "exploration";
  if (/scored the|victory point|objective revealed/.test(text)) return "scoring";
  if (/action card/.test(text)) return "cards";
  if (/faction ability|flagship ability|ability of their|played .*legendary|Sustain Damage/.test(text)) return "abilities";
  if (/ended their turn|passed\.$/.test(text)) return "turn";
  return "other";
}

const raw = JSON.parse(readFileSync(RAW_JSON, "utf-8"));
const lines = readFileSync(RAW_TEXT, "utf-8").trim().split(/\r?\n/);

if (raw.length !== lines.length) {
  throw new Error(`length mismatch: ${raw.length} json entries vs ${lines.length} text lines`);
}

let picks = 0;
let round = 0;

const events = raw.map((entry, i) => {
  const [, time, rawText] = /^\[([^\]]+)\]\s+(.*)$/.exec(lines[i]);
  const text = rawText.replace(/\s+([.,])/g, "$1");

  const playerTags = entry.html.match(/<ti-player-tag[^>]*>/g) ?? [];
  const players = playerTags.map((t) => attr(t, "name")).filter(Boolean);
  const factions = playerTags.map((t) => attr(t, "faction")).filter(Boolean);

  const cards = (entry.html.match(/<ti-preview-link[^>]*>/g) ?? [])
    .map((t) => ({name: attr(t, "data-name"), type: attr(t, "data-type")}))
    .filter((c) => c.name);

  const systems = [...entry.html.matchAll(/class="system-link" data-number="(\d+)"/g)].map((m) => +m[1]);

  if (/ picked the .+ strategy card/.test(text)) {
    if (picks % PICKS_PER_ROUND === 0) round += 1;
    picks += 1;
  }

  return {
    n: i + 1,
    time,
    date: parseTime(time)?.toISOString() ?? null,
    round,
    actor: players[0] ?? null,
    faction: factions[0] ?? null,
    players,
    kind: classify(text),
    // Victory points can come from any kind (e.g. Imperial is "strategy"), so flag them separately.
    scored: /scored the .+ objective|gained \d+ victory points?/.test(text),
    event: text,
    cards,
    systems
  };
});

process.stdout.write(JSON.stringify(events));