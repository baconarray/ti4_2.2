# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working agreement

### Ask, don't guess
- If a requirement is ambiguous, stop and ask. One clarifying question is
  always cheaper than a wrong implementation I have to review and revert.
- Never invent data shapes, field names, or file paths. Check the actual
  file first, or ask.
- If you can't confirm how a library or API works, say so and ask rather
  than writing plausible-looking code.
- If a fix could be done several ways with real tradeoffs, present the
  options and let me pick. Don't choose silently.
- Uncertainty is information. Tell me what you're unsure about instead of
  hiding it behind confident prose.

### No edits without approval
- Do not create, modify, or delete any file until I have approved that
  specific change.
- Propose first: say which files you intend to touch and what will change.
  Wait for my yes.
- Never edit anything under `data-raw/`. Those are source exports.
- Don't run `npm run dev`. I run it myself in a separate terminal.
- Read-only exploration (reading files, grep, git status, running the
  loader with output discarded) needs no approval.
  
# TI4 log analysis (Observable Framework)

Turns a Twilight Imperium play-by-web log export into a game breakdown page.

## Layout
- `data-raw/log.json`, `data-raw/log.txt` — raw exports scraped from twilightwars.com.
  Never edit. Do NOT read these directly: log.json is ~3 MB and will flood context.
  Inspect with targeted node/grep one-liners instead.
- `src/data/events.json.js` — data loader. Joins the two files by line index,
  derives rounds, emits trimmed JSON (~0.7 MB).
- `src/index.md` — hero summary, filters, searchable log table.

## Rules learned the hard way
- Loaders run in Node from the project root. No DOMParser available;
  parse the HTML field with regex.
- log.txt may arrive with CRLF. Always split on /\r?\n/, never "\n".
- Timestamps are wall-clock with no timezone. The loader stores them via Date.UTC;
  render with timeZone "UTC" or just use the raw `time` string.
- Rounds come from counting strategy card picks in groups of PICKS_PER_ROUND
  (6 for a 6-player game), not from public objective reveals, which fire at
  round end and include two at setup.
- The loader throws if the json and txt lengths disagree. That check is deliberate:
  mismatched exports would silently misalign every actor.

## Workflow
- Test the loader with: node src/data/events.json.js > /dev/null
- I run `npm run dev` myself in a separate terminal. Don't start it.