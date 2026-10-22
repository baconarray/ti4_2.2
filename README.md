# TwilightWars.com Game Log Analysis
Analysis of game logs from an asynchronous game of Twilight Imperium 4th Edition played on TwilightWars.com. Data analysis using Observable Framework.

## Getting the data
The game log isn't included in this repo. Export your own from [twilightwars.com](https://twilightwars.com) into `data-raw/`:

1. Open your game on twilightwars.com in a desktop browser and open the game log panel.
2. Open the developer tools (F12) and switch to the **Console** tab.
3. Paste the contents of [`scripts/export-log-json.js`](scripts/export-log-json.js) and press Enter. The script scrolls the log until every entry has loaded, which can take a while for a long game, then downloads `log.json`.
4. Do the same with [`scripts/export-log-txt.js`](scripts/export-log-txt.js), which downloads `log.txt`.
5. Move both files into `data-raw/`.

Export both files from the same page load. The data loader joins them line by line and stops with an error if their entry counts differ.

## Running
```
npm install
npm run dev
```

## Publishing
The site is published to GitHub Pages from the `gh-pages` branch. GitHub can't build it because the logs aren't in the repo, so build and publish locally (with `data-raw/` filled in):

```
npm run pages
```

This clears the data loader cache, builds the site into `dist/`, and pushes `dist/` to the `gh-pages` branch. Commits to `main` don't change the live site until you run this again.

One-time setup, after the first `npm run pages`: on GitHub go to **Settings → Pages**, set **Source** to **Deploy from a branch**, choose **gh-pages** and **/ (root)**, and save.
