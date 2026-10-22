// Exports the full game log as log.txt, one "[timestamp] message" line per entry.
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

  const SKIP = new Set(['STYLE', 'SCRIPT', 'TEMPLATE', 'LINK']);

  const textOf = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue;
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    if (SKIP.has(node.tagName)) return '';

    // a slot renders whatever light-DOM content was assigned to it
    if (node.tagName === 'SLOT') {
      return node.assignedNodes({ flatten: true }).map(textOf).join('');
    }

    // shadow root wins: its slots pull in the light DOM as needed
    const children = node.shadowRoot
      ? [...node.shadowRoot.childNodes]
      : [...node.childNodes];

    let out = children.map(textOf).join('');

    // fall back to attributes for elements that render no text
    if (!out.trim() && node.dataset) {
      out = node.dataset.name || node.dataset.number || '';
    }
    return out;
  };

  const lines = [...el.querySelectorAll('.game-log')].map(node => {
    const time = node.querySelector('.timestamp')?.title ?? '';
    const msg = textOf(node.querySelector('.message')).replace(/\s+/g, ' ').trim();
    return `[${time}] ${msg}`;
  });

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }));
  a.download = 'log.txt';
  a.click();
  console.log(`${lines.length} entries exported`);
})();
