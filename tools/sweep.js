// Renders every question on small phones and reports text that does not fit.
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const dev of ['iPhone SE', 'Pixel 7']) {
    const ctx = await b.newContext({ ...devices[dev] }); await ctx.route(/fonts\./, r => r.abort());
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + process.argv[2]); await p.fill('#nm', 'Gniewko'); await p.click('[data-sex=m]'); await p.click('#start');
    const res = await p.evaluate(async () => {
      const out = [];
      for (const id of Object.keys(__T.QMAP)) {
        const sid = __T.QMAP[id].sid, S = __T.S;
        S.st[sid] = S.st[sid] || { rounds: 0, best: 0, known: [], wrong: [], seen: [], learned: true, pending: null };
        S.st[sid].pending = { sid, ids: [id], i: 0, res: [], miss: false, solved: false };
        __T.go({ scr: 'quiz', sid });
        await new Promise(r => setTimeout(r, 0));
        document.querySelectorAll('#app .opt, #app .qtext, .lvtab').forEach(e => {
          const r = e.getBoundingClientRect();
          if (e.scrollWidth > e.clientWidth + 1 || r.right > innerWidth + 1 || r.left < -1) out.push(id + ': ' + e.textContent.trim().slice(0, 30) + ` (${e.scrollWidth}>${e.clientWidth})`);
        });
        if (document.documentElement.scrollHeight > innerHeight * 1.6) out.push(id + ': very tall page ' + document.documentElement.scrollHeight);
      }
      return out;
    });
    res.forEach(r => console.log(dev, r)); bad += res.length + errs.length; errs.forEach(e => console.log(dev, 'ERR', e));
    console.log(dev, 'issues:', res.length);
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
