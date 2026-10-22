// Exports the full game log as log.json (one object per entry, with the raw message HTML).
// Paste into the browser console on your twilightwars.com game page; see README "Getting the data".
// It scrolls the log panel to the top repeatedly until every entry has loaded, then downloads the file.
(async () => {
  const el = document.getElementById('game-logs');
  el.scrollTop = 0;
  let n = -1;
  while (el.querySelectorAll('.game-log').length !== n) {
    n = el.querySelectorAll('.game-log').length;
    el.scrollTop = 0;
    if (el.onscroll) await el.onscroll();
    await new Promise(r => setTimeout(r, 400));
  }

  const entries = [...el.querySelectorAll('.game-log')].map(node => {
    const msg = node.querySelector('.message');
    const refs = [...msg.querySelectorAll('*')]
      .filter(sub => sub.tagName.includes('-') || sub.classList.contains('system-link'))
      .map(sub => ({
        element: sub.tagName.toLowerCase(),
        text: (sub.shadowRoot?.textContent || sub.innerText || '').trim(),
        data: { ...sub.dataset }
      }));

    return {
      id: node.id,
      time: node.querySelector('.timestamp')?.title ?? null,
      icon: node.querySelector('.icon i')?.className ?? null,
      html: msg.innerHTML,
      references: refs
    };
  });

  const a = document.createElement('a');
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' }));
  a.download = 'log.json';
  a.click();
  console.log(`${entries.length} entries exported`);
})();
