// Phone with voices but no Polish one: clear message, parent instructions, optional fallback voice.
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const fails = []; const ck = (c, m) => { console.log(c ? 'ok  ' : 'FAIL', m); if (!c) fails.push(m); };
  const ctx = await b.newContext({ ...devices['Pixel 7'] }); await ctx.route(/fonts\./, r => r.abort());
  await ctx.addInitScript(() => {
    const VOICES = [{ name: 'English US', lang: 'en-US', localService: true }, { name: 'Deutsch', lang: 'de-DE', localService: true }];
    window.__log = []; let speaking = false;
    const ss = { get speaking() { return speaking }, get pending() { return false }, getVoices: () => VOICES, addEventListener() { }, resume() { }, cancel() { speaking = false },
      speak(u) { window.__log.push((u.lang || 'nolang') + ':' + u.text.slice(0, 15)); if (u.lang === 'pl-PL') { setTimeout(() => u.onerror && u.onerror({ error: 'synthesis-failed' }), 20); return; } speaking = true; setTimeout(() => { u.onstart && u.onstart({}); setTimeout(() => { speaking = false; u.onend && u.onend({}) }, 200) }, 30); } };
    Object.defineProperty(window, 'speechSynthesis', { value: ss }); window.SpeechSynthesisUtterance = function (t) { this.text = t };
  });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + (process.argv[2] || require('path').resolve(__dirname, '../index.html')));
  await p.click('.speak'); await p.waitForTimeout(300);
  ck((await p.locator('.toast').allInnerTexts()).some(t => /nie ma polskiego głosu/.test(t)), 'child sees clear message at once');
  ck(await p.locator('.speak.on').count() === 0, 'button not stuck');
  await p.fill('#nm', 'Gniewko'); await p.click('[data-sex=m]'); await p.click('#start');
  await p.click('#par'); const t = await p.locator('.sheet .qsub').innerText(); const [x, y] = t.match(/(\d+) × (\d+)/).slice(1).map(Number); await p.click(`[data-v="${x * y}"]`);
  await p.click('#ttst'); await p.waitForTimeout(300);
  const info = await p.locator('#ttsinfo').innerText();
  ck(/polskiego brak/.test(info) && /Usługi mowy Google/.test(info) && /Treść mówiona/.test(info), 'parent sees install instructions');
  await p.screenshot({ path: (process.argv[3] || '.') + '/nopl_panel.png', fullPage: true });
  await p.click('#anyv'); ck(await p.evaluate(() => __T.S.anyVoice === true), 'fallback toggle on');
  await p.click('#home'); await p.click('.node[data-sid=s1]'); await p.locator('.learn .speak').click(); await p.waitForTimeout(800);
  const log = await p.evaluate(() => window.__log);
  ck(log.some(l => l.startsWith('nolang:')), 'fallback reads with default voice: ' + log.slice(-2).join(' / '));
  ck(await p.locator('.speak.on').count() === 0, 'button resets after fallback speech');
  ck(errs.length === 0, 'no page errors ' + errs.join('|'));
  await b.close(); console.log(fails.length ? fails.length + ' FAILURES' : 'NO-POLISH TESTS PASSED');
})();
