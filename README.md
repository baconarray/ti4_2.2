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
