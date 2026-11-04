// Static checks of the question data.
const fs = require('fs');
const src = ['geo.js', 'data.js', 'data2.js'].map(f => fs.readFileSync(__dirname + '/../src/' + f, 'utf8')).join('\n');
const { GEO, STATIONS, MAP_LABELS, LEVELS } = new Function(src + '; return {GEO, STATIONS, MAP_LABELS, LEVELS};')();
const errs = [], warn = [], ids = new Set();
const VIS = ['flag:pl', 'flag:mc', 'flag:fr', 'flag:de', 'emblem:pl', 'emblem:blue', 'emblem:yellow', 'emblem:nocrown', 'stork', 'map:labels'];
const chkVis = (s, id) => { const e = String(s).split('|')[0]; if (e[0] === '#' && !VIS.includes(e.slice(1))) errs.push(`${id}: bad visual ${e}`); };
let n = 0;
const ALL = [...STATIONS.map(s => ({ ...s, lv: 1 }))];
for (const lv of [2, 3]) for (const s of STATIONS) { if (!LEVELS[lv][s.id]) { errs.push(`level ${lv} missing ${s.id}`); continue; } ALL.push({ id: s.id + '@' + lv, lv, cards: LEVELS[lv][s.id].cards, q: LEVELS[lv][s.id].q }); }
const perLv = {};
for (const s of ALL) {
  perLv[s.lv] = (perLv[s.lv] || 0) + s.q.length;
  const types = new Set(s.q.map(q => q.t)); if (types.size < 3) warn.push(`${s.id}: only types ${[...types]}`);
  if (!s.cards || s.cards.length < 3) errs.push(`${s.id}: few cards`);
  s.cards.forEach(c => { if (c.v && !VIS.includes(c.v)) errs.push(`${s.id}: card visual ${c.v}`); if (c.s.split(' ').length > 16) warn.push(`${s.id} card long: ${c.s}`); });
  if (s.q.length < 12) errs.push(`${s.id}: only ${s.q.length} questions`);
  for (const q of s.q) {
    n++;
    if (ids.has(q.id)) errs.push('dup id ' + q.id); ids.add(q.id);
    if (!q.f) errs.push(q.id + ': no fact');
    if (q.q.split(' ').length > 8) warn.push(`${q.id} question ${q.q.split(' ').length} words: ${q.q}`);
    if (['choice', 'map', 'eu'].includes(q.t)) {
      if (!(q.a >= 0 && q.a < q.o.length)) errs.push(q.id + ': bad answer index');
      if (q.o.length < 2) errs.push(q.id + ': too few options');
      if (new Set(q.o).size !== q.o.length) errs.push(q.id + ': duplicate options');
      if (q.o.length > 2 && !q.h) errs.push(q.id + ': no hint');
    }
    if (q.t === 'choice') q.o.forEach(o => chkVis(o, q.id));
    if (q.t === 'map') q.o.forEach(k => { if (!GEO.pl.points[k]) errs.push(`${q.id}: no point ${k}`); });
    if (q.t === 'map') { // dots must be far apart
      for (let i = 0; i < q.o.length; i++) for (let j = i + 1; j < q.o.length; j++) {
        const [a, b] = [GEO.pl.points[q.o[i]], GEO.pl.points[q.o[j]]]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (d < 60) errs.push(`${q.id}: dots ${q.o[i]}/${q.o[j]} too close (${d.toFixed(0)})`);
      }
    }
    if (q.t === 'eu') q.o.forEach(k => { if (!GEO.eu.cand[k]) errs.push(`${q.id}: no country ${k}`); });
    if (q.t === 'tf' && typeof q.a !== 'boolean') errs.push(q.id + ': tf answer');
    if (q.t === 'match') { if (q.p.length !== 3) errs.push(q.id + ': match pairs'); q.p.forEach(p => chkVis(p[1], q.id)); }
    if (q.t === 'order') { if (q.o.length !== 3) errs.push(q.id + ': order len'); q.o.forEach(o => chkVis(o, q.id)); }
  }
}
// every map point inside the drawing
for (const [k, [x, y]] of Object.entries(GEO.pl.points)) if (x < 10 || x > GEO.pl.w - 10 || y < 10 || y > GEO.pl.h - 10) errs.push('point near edge ' + k);
MAP_LABELS.forEach(([k]) => { if (!GEO.pl.points[k]) errs.push('label point ' + k); });
console.log(`questions: ${n}, per level: ${JSON.stringify(perLv)}`);
warn.forEach(w => console.log('WARN', w));
errs.forEach(e => console.log('ERR', e));
console.log(errs.length ? 'VALIDATION FAILED' : 'VALIDATION OK');
process.exit(errs.length ? 1 : 0);
