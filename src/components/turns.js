const TURN_END = /ended their turn/;
const PASS = /passed\.$/;
const PICK = / picked the .+ strategy card/;

const minutes = (from, to) => (new Date(to) - new Date(from)) / 60000;

// A turn starts at the handoff: the previous turn end or pass, or the latest strategy card pick.
// Resetting on picks keeps the status, agenda and strategy phases out of the round's first turn.
// Passes hand the turn on but aren't counted as turns themselves.
export function buildTurns(events) {
  const turns = [];
  let handoff = null;
  events.forEach((d, i) => {
    if (PICK.test(d.event) || PASS.test(d.event)) {
      handoff = i;
      return;
    }
    if (!TURN_END.test(d.event) || handoff === null) return;
    const start = events[handoff];
    const first = events.slice(handoff + 1, i + 1).find((e) => e.actor === d.actor);
    const wait = minutes(start.date, first.date);
    const acting = minutes(first.date, d.date);
    turns.push({
      n: d.n,
      round: d.round,
      player: d.actor,
      start: start.time,
      wait,
      acting,
      total: wait + acting,
      firstEvent: first.event
    });
    handoff = i;
  });
  return turns;
}

// Timestamps only have minute precision, so a zero means "under a minute".
export function fmtMinutes(m) {
  if (m < 1) return "<1 min";
  if (m < 60) return `${Math.round(m)} min`;
  if (m < 60 * 48) return `${(m / 60).toFixed(1)} h`;
  return `${(m / 1440).toFixed(1)} d`;
}
