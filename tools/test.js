// Full playthrough test on an emulated phone.
const { chromium, devices } = require('playwright');
const URL = 'file://' + (process.argv[2] || '/home/claude/gra/dist/index.html');
const OUT = process.argv[3] || '.';
const fail = []; const log = (...a) => console.log(...a);
function check(c, msg) { if (!c) { fail.push(msg); log('FAIL:', msg); } }

(async () => {
  const b = await chromium.launch();
  for (const dev of (process.env.DEV ? [process.env.DEV] : ['Pixel 7', 'iPhone SE'])) {
    const ctx = await b.newContext({ ...devices[dev] });
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });
    await p.goto(URL);
    const seen = new Set();
    const T = (fn, arg) => p.evaluate(fn, arg);

    // horizontal overflow check helper
    const noOverflow = async (where) => { const o = await T(() => document.documentElement.scrollWidth - window.innerWidth); check(o <= 1, `${dev}: overflow ${o}px on ${where}`); };

    await p.click('#start');
    check(/Wpisz imię/.test(await p.locator('#err').innerText()), `${dev}: empty name error`);
    check(await p.locator('#nm').count() === 1, `${dev}: stays on name screen`);
    await p.fill('#nm', 'Gniewko'); await p.click('#start');
    check(/chłopiec czy dziewczynka/.test(await p.locator('#err').innerText()), `${dev}: sex error`);
    await p.click('[data-sex=m]'); await p.click('#start');
    check(await p.locator('.hello').innerText() === 'Cześć, Gniewko!', `${dev}: greeting with name`);
    await noOverflow('map');
    check(await p.locator('.node.locked').count() === 7, `${dev}: 7 locked at start`);

    async function answer(correct) {
      const q = await T(() => { const Q = __T.Q; return { id: Q.q.id, t: Q.q.t, a: Q.q.a, n: (Q.q.o || Q.q.p || [1, 0]).length }; });
      seen.add(q.id);
      const ans = p.locator('#ans');
      if (q.t === 'choice' || q.t === 'map' || q.t === 'eu' || q.t === 'tf') {
        const good = q.t === 'tf' ? (q.a ? '1' : '0') : String(q.a);
        if (!correct) {
          const bad = q.t === 'tf' ? (q.a ? '0' : '1') : String((q.a + 1) % q.n);
          await ans.locator(`[data-k="${bad}"]`).click();
          if (q.t !== 'tf' && q.n > 2) {
            check(await p.locator('.hint').count() === 1, `${dev}: hint after wrong ${q.id}`);
            check(await p.locator('#next').count() === 0, `${dev}: no next after 1st wrong ${q.id}`);
          }
        }
        if (await p.locator('#next').count() === 0) await ans.locator(`[data-k="${good}"]`).click();
      } else if (q.t === 'match') {
        if (!correct) { await ans.locator('[data-side=L][data-k="0"]').click(); await ans.locator('[data-side=R][data-k="1"]').click(); }
        for (let k = 0; k < q.n; k++) { await ans.locator(`[data-side=L][data-k="${k}"]`).click(); await ans.locator(`[data-side=R][data-k="${k}"]`).click(); }
      } else if (q.t === 'order') {
        if (!correct) await ans.locator('.tiles [data-k="1"]').click();
        for (let k = 0; k < q.n; k++) await ans.locator(`.tiles [data-k="${k}"]`).click();
      } else check(false, 'unknown type ' + q.t);
      await p.locator('#next').waitFor({ timeout: 3000 }).catch(() => check(false, `${dev}: no next for ${q.id}`));
      const good = await p.locator('.sheet.good').count();
      check(!!good === !!correct, `${dev}: feedback color for ${q.id} correct=${correct}`);
      await p.click('#next', { timeout: 5000 }).catch(async e => { await p.screenshot({ path: OUT + '/fail.png' }); console.log('FAILQ', q.id, await p.evaluate(() => document.querySelectorAll('.sheet').length)); throw e; });
      return q;
    }
    async function playRound(mistakes) {
      let n = 0;
      while (await p.locator('#ans').count()) { await answer(!(mistakes && n % 2 === 0)); n++; if (n > 12) { check(false, 'round too long'); break; } }
      check(await p.locator('.end').count() === 1, `${dev}: end screen`);
      return n;
    }
    async function openStation(sid) {
      await p.click(`.node[data-sid="${sid}"]`);
      if (await p.locator('.learn').count()) { while (await p.locator('.learn').count()) await p.click('#nx'); return; }
      await p.click('#play');
    }

    const ids = await T(() => __T.STATIONS.map(s => s.id));
    for (const [si, sid] of ids.entries()) {
      let rounds = 0;
      // round 1 with mistakes
      await openStation(sid);
      if (sid === 's3') {
        // interrupt test: answer 2, reload, resume
        await answer(true); await answer(true);
        const before = await T(() => ({ i: __T.S.st.s3.pending.i, id: __T.Q.q.id }));
        await p.reload();
        check(await p.locator('#cont').count() === 1, `${dev}: resume dialog shown`);
        const txt = await p.locator('.sheet').innerText();
        check(/Skończyłeś tutaj/.test(txt), `${dev}: masculine form`);
        check(/pytanie 3 z 5/.test(txt), `${dev}: resume text says question 3: ${txt}`);
        await p.click('#cont');
        const after = await T(() => ({ i: __T.S.st.s3.pending.i, id: __T.Q.q.id }));
        check(before.i === after.i && before.id === after.id, `${dev}: resumed at same question`);
        // leave via home mid-round and come back
        await p.click('#home');
        check(await p.locator('.node[data-sid="s3"] .badge').innerText() === '⏸️', `${dev}: paused badge`);
        await p.click('.node[data-sid="s3"]');
        check(/Dokończ \(3\/5\)/.test(await p.locator('#play').innerText()), `${dev}: Dokończ button`);
        await p.click('#play');
      }
      await playRound(true); rounds++;
      await noOverflow('end ' + sid);
      await p.click('#map');
      // keep playing until mastered
      while (!(await T(s => __T.STATIONS.find(x => x.id === s).q.every(q => __T.S.st[s].known.includes(q.id)), sid))) {
        await openStation(sid); await playRound(false); rounds++;
        if (rounds > 12) { check(false, `${dev}: ${sid} never mastered`); break; }
        await p.click('#map');
      }
      check(await p.locator(`.node[data-sid="${sid}"] .badge`).innerText() === '👑', `${dev}: crown on ${sid}`);
      if (si < ids.length - 1) check(!(await p.locator(`.node[data-sid="${ids[si + 1]}"]`).getAttribute('class')).includes('locked'), `${dev}: next unlocked after ${sid}`);
      log(dev, sid, 'rounds to master:', rounds);
    }
    // all questions seen?
    const total = await T(() => Object.keys(__T.QMAP).length);
    check(seen.size === total, `${dev}: seen ${seen.size}/${total} questions`);
    // final
    await p.click('.node[data-sid="fin"]'); await p.click('#play');
    const fn = await playRound(false);
    check(fn === 10, `${dev}: final has 10 questions (${fn})`);
    await p.screenshot({ path: `${OUT}/t_${dev.replace(' ', '')}_final_end.png` });
    await p.click('#dip'); check(await p.locator('.dip .who').innerText() === 'Gniewko', `${dev}: diploma name`);
    await p.screenshot({ path: `${OUT}/t_${dev.replace(' ', '')}_diploma.png` });
    await p.click('#home'); await p.click('#alb');
    check(await p.locator('.album .cell.gold').count() === 8, `${dev}: 8 gold stickers (${await p.locator('.album .cell.gold').count()})`);
    await p.screenshot({ path: `${OUT}/t_${dev.replace(' ', '')}_album.png`, fullPage: true });
    await p.click('#home');
    await p.screenshot({ path: `${OUT}/t_${dev.replace(' ', '')}_map_done.png`, fullPage: true });
    // persistence after full reload
    const stars = await T(() => __T.S.stars);
    await p.reload();
    check(await T(() => __T.S.stars) === stars && stars > 0, `${dev}: stars persisted (${stars})`);
    // parent gate + panel
    await p.click('#par');
    const qtxt = await p.locator('.sheet .qsub').innerText(); const [x, y] = qtxt.match(/(\d+) × (\d+)/).slice(1).map(Number);
    await p.click(`[data-v="${x * y}"]`);
    check(await p.locator('.par').count() === 1, `${dev}: parent panel`);
    await p.screenshot({ path: `${OUT}/t_${dev.replace(' ', '')}_parent.png`, fullPage: true });
    await p.click('#sfx'); check(await T(() => __T.S.sfx) === false, `${dev}: sfx toggle`);
    await p.click('#reset'); await p.click('#yes');
    check(await p.locator('#start').count() === 1 && await T(() => __T.S.stars) === 0, `${dev}: reset works`);
    // speech button doesn't crash
    await p.click('.speak');
    check(errs.length === 0, `${dev}: page errors: ${errs.join(' | ')}`);
    log(dev, 'done, stars', stars, 'errors', errs.length);
    await ctx.close();
  }
  { // girl, name editing and migration of old saves without a name
    const ctx = await b.newContext({ ...devices['Pixel 7'] }); await ctx.route(/fonts\./, r => r.abort());
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL);
    await p.fill('#nm', '  zosia  '); await p.click('[data-sex=f]'); await p.click('#start');
    check(await p.locator('.hello').innerText() === 'Cześć, Zosia!', 'girl: greeting capitalised');
    await p.click('.node[data-sid=s1]'); while (await p.locator('.learn').count()) await p.click('#nx');
    await p.reload();
    check(/Skończyłaś tutaj/.test(await p.locator('.sheet').innerText()), 'girl: feminine resume text');
    await p.click('#tomap');
    await p.click('#par'); const qt = await p.locator('.sheet .qsub').innerText(); const [x, y] = qt.match(/(\d+) × (\d+)/).slice(1).map(Number);
    await p.click(`[data-v="${x * y}"]`); await p.click('#name');
    check(await p.inputValue('#nm') === 'Zosia', 'edit: name prefilled');
    await p.fill('#nm', 'Ola'); await p.click('#start');
    check(await p.locator('.par').count() === 1 && /Ola/.test(await p.locator('#name').innerText()), 'edit: back to parent with new name');
    // old save (no name) keeps progress and asks for the name
    await p.evaluate(() => { const S = JSON.parse(localStorage.getItem('gniewko-polska-v1')); delete S.name; delete S.sex; S.stars = 42; localStorage.setItem('gniewko-polska-v1', JSON.stringify(S)); });
    await p.reload();
    check(await p.locator('#nm').count() === 1, 'migration: asks for name');
    await p.fill('#nm', 'Gniewko'); await p.click('[data-sex=m]'); await p.click('#start');
    check(/42/.test(await p.locator('.pill').innerText()), 'migration: stars kept');
    check(errs.length === 0, 'girl test errors: ' + errs.join('|'));
    await p.screenshot({ path: `${OUT}/t_girl_map.png` });
    await ctx.close();
  }
  await b.close();
  log(fail.length ? `\n${fail.length} FAILURES` : '\nALL TESTS PASSED');
  process.exit(fail.length ? 1 : 0);
})();
