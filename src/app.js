'use strict';
const nm = () => esc(S.name || '');
const g = (m, f) => S.sex === 'f' ? f : m;
const KEY = 'gniewko-polska-v1';
const ROUND = 5, FINAL_N = 10;
const $app = document.getElementById('app');

/* ---------------- helpers ---------------- */
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const QMAP = {}; STATIONS.forEach(s => s.q.forEach(q => QMAP[q.id] = { q, sid: s.id }));
const stById = id => id === 'fin' ? FINAL : STATIONS.find(s => s.id === id);

/* option string → {e, x, say, vis} */
function opt(str) {
  const p = String(str).split('|');
  let e = p[0] || '', x = p[1] || '', say = p[2] || x;
  if (p.length === 1) { x = ''; }
  return { e, x, say };
}
function emHTML(e) { return e && e[0] === '#' ? vis(e.slice(1)) : esc(e); }

/* ---------------- drawings ---------------- */
function flag(c) {
  const b = 'stroke="#9aa3b5" stroke-width="2"';
  const f = {
    pl: `<rect width="90" height="30" fill="#fff"/><rect y="30" width="90" height="30" fill="#dc143c"/>`,
    mc: `<rect width="90" height="30" fill="#dc143c"/><rect y="30" width="90" height="30" fill="#fff"/>`,
    fr: `<rect width="30" height="60" fill="#0055a4"/><rect x="30" width="30" height="60" fill="#fff"/><rect x="60" width="30" height="60" fill="#ef4135"/>`,
    de: `<rect width="90" height="20" fill="#111"/><rect y="20" width="90" height="20" fill="#dd0000"/><rect y="40" width="90" height="20" fill="#ffce00"/>`
  }[c];
  return `<svg viewBox="-2 -2 94 64" role="img" aria-label="flaga">${f}<rect width="90" height="60" fill="none" ${b}/></svg>`;
}
function eagle(fill, crown, stroke) {
  const g = '#f2c230', s = stroke || 'rgba(0,0,0,.25)';
  const wl = '44,40 31,28 19,23 10,28 12,36 7,42 13,47 9,53 15,57 13,63 21,64 30,62 38,58 44,54';
  const wr = wl.split(' ').map(p => { const [x, y] = p.split(','); return (100 - x) + ',' + y; }).join(' ');
  return `<g stroke="${s}" stroke-width="1.2" stroke-linejoin="round">
    <polygon points="${wl}" fill="${fill}"/><polygon points="${wr}" fill="${fill}"/>
    <polygon points="44,64 56,64 61,82 50,77 39,82" fill="${fill}"/>
    <path d="M45,64 L40,74 M40,74 l-4,2 M40,74 l0,4 M55,64 L60,74 M60,74 l4,2 M60,74 l0,4" stroke="${g}" stroke-width="2.6" fill="none"/>
    <ellipse cx="50" cy="50" rx="9" ry="16" fill="${fill}"/>
    <circle cx="47" cy="31" r="6.5" fill="${fill}"/>
    <polygon points="41,30 35,33 41,35" fill="${g}"/>
    ${crown ? `<polygon points="41,25 41,16 44.5,20.5 47.5,13 50.5,20.5 54,16 54,25" fill="${g}" stroke="#b88a10"/>` : ''}
  </g>`;
}
function emblem(v) {
  const m = { pl: ['#dc143c', '#fff', 1], blue: ['#2f6fd0', '#fff', 1], yellow: ['#f2c230', '#222', 1], nocrown: ['#dc143c', '#fff', 0] }[v];
  return `<svg viewBox="0 0 100 100" role="img" aria-label="godło"><path d="M10,6 H90 V58 Q90,88 50,97 Q10,88 10,58 Z" fill="${m[0]}" stroke="#7a1020" stroke-width="2"/>${eagle(m[1], m[2], m[1] === '#fff' ? 'rgba(0,0,0,.25)' : '#000')}</svg>`;
}
function stork() {
  return `<svg viewBox="0 0 100 100" role="img" aria-label="bocian"><g stroke="#333" stroke-width="1.5" stroke-linejoin="round">
  <path d="M30,52 Q34,34 56,36 L74,44 Q66,62 44,64 Q32,64 30,52Z" fill="#fff"/>
  <path d="M48,40 Q64,36 76,46 L70,58 Q60,52 50,52Z" fill="#222"/>
  <path d="M34,46 Q30,30 30,20" fill="none" stroke="#fff" stroke-width="7"/><path d="M34,46 Q30,30 30,20" fill="none"/>
  <circle cx="30" cy="18" r="6" fill="#fff"/><circle cx="29" cy="16.5" r="1.3" fill="#222"/>
  <polygon points="24,17 6,22 24,20" fill="#e8423f"/>
  <path d="M44,63 L42,92 M50,62 L54,92 M38,92 h8 M50,92 h8" stroke="#e8423f" stroke-width="3" fill="none"/></g></svg>`;
}
function plMap(opts) {
  const g = GEO.pl; opts = opts || {};
  let s = `<svg viewBox="0 0 ${g.w} ${g.h}" role="img" aria-label="mapa Polski"><rect width="${g.w}" height="${g.h}" fill="var(--sea)"/>
   <path d="${g.neigh}" fill="var(--neigh)" stroke="#b9b2a0" stroke-width="1"/>
   <path d="${g.path}" fill="var(--land)" stroke="#3f8a3a" stroke-width="2.5"/>
   <path d="${g.rivers.wisla}" fill="none" stroke="#2f8fd8" stroke-width="4" stroke-linecap="round"/>
   <path d="${g.rivers.odra}" fill="none" stroke="#2f8fd8" stroke-width="3" stroke-linecap="round"/>`;
  if (opts.labels) {
    opts.labels.forEach(([k, n]) => {
      const [x, y] = g.points[k];
      const sea = k === 'baltyk', mnt = k === 'tatry';
      if (mnt) s += `<path d="M${x - 26},${y + 6} l14,-20 l9,11 l8,-15 l16,24z" fill="#8a6d4b" stroke="#5a442c"/>`;
      else if (!sea) s += `<circle cx="${x}" cy="${y}" r="${k === 'warszawa' ? 8 : 6}" fill="${k === 'warszawa' ? '#e8423f' : '#23324a'}" stroke="#fff" stroke-width="2"/>`;
      const ty = mnt ? y - 18 : y - 11;
      s += `<text x="${x}" y="${ty}" text-anchor="middle" font-size="${sea ? 22 : 19}" font-weight="800" fill="${sea ? '#1d6aa6' : '#23324a'}" stroke="#fff" stroke-width="4" paint-order="stroke" font-family="inherit">${n}</text>`;
    });
  }
  if (opts.dots) opts.dots.forEach((k, i) => {
    const [x, y] = g.points[k];
    s += `<g class="dot" data-k="${opts.keys[i]}"><circle cx="${x}" cy="${y}" r="30" fill="transparent"/><circle class="c" cx="${x}" cy="${y}" r="15"/></g>`;
  });
  return s + '</svg>';
}
function euMap(cands, keys) {
  const g = GEO.eu;
  let s = `<svg viewBox="0 0 ${g.w} ${g.h}" role="img" aria-label="mapa Europy"><rect width="${g.w}" height="${g.h}" fill="var(--sea)"/>
   <path d="${g.other}" fill="var(--neigh)" stroke="#a89f8a" stroke-width=".8"/>`;
  cands.forEach((c, i) => { s += `<g class="cty" data-k="${keys[i]}"><path d="${g.cand[c]}"/></g>`; });
  return s + '</svg>';
}
function vis(key) {
  const [k, v] = key.split(':');
  if (k === 'flag') return flag(v);
  if (k === 'emblem') return emblem(v);
  if (k === 'stork') return stork();
  if (k === 'map') return plMap({ labels: MAP_LABELS });
  return '';
}

/* ---------------- state ---------------- */
function fresh() { return { v: 1, stars: 0, st: {}, fin: { best: 0, done: 0, pending: null }, cur: { scr: 'intro' }, sfx: true, all: false }; }
function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return s; } catch (e) { } return null; }
let S = load() || fresh();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
function stS(id) { return S.st[id] || (S.st[id] = { rounds: 0, best: 0, known: [], wrong: [], seen: [], learned: false, pending: null }); }
const roundOf = sid => sid === 'fin' ? S.fin.pending : stS(sid).pending;
const setRound = (sid, r) => { if (sid === 'fin') S.fin.pending = r; else stS(sid).pending = r; };
const unlocked = i => S.all || i === 0 || stS(STATIONS[i - 1].id).rounds > 0;
const finalUnlocked = () => S.all || STATIONS.every(s => stS(s.id).rounds > 0);
const mastered = sid => { const s = stById(sid); return s.q.every(q => stS(sid).known.includes(q.id)); };
function nextSid() {
  for (const s of STATIONS) if (stS(s.id).pending) return s.id;
  for (let i = 0; i < STATIONS.length; i++) if (unlocked(i) && stS(STATIONS[i].id).rounds === 0) return STATIONS[i].id;
  if (finalUnlocked() && !S.fin.done) return 'fin';
  return null;
}

/* ---------------- round building ---------------- */
function buildList(qs, st, n) {
  const W = shuffle(qs.filter(q => st.wrong.includes(q.id)));
  const U = shuffle(qs.filter(q => !st.seen.includes(q.id) && !st.wrong.includes(q.id)));
  const N = shuffle(qs.filter(q => st.seen.includes(q.id) && !st.known.includes(q.id) && !st.wrong.includes(q.id)));
  const K = shuffle(qs.filter(q => st.known.includes(q.id) && !st.wrong.includes(q.id)));
  const order = [...W.slice(0, 2), ...U, ...N, ...W.slice(2), ...K];
  const out = [], later = [], cnt = {};
  const lim = t => t === 'choice' ? 3 : (t === 'tf' ? 2 : 1);
  for (const q of order) {
    if (out.length >= n) break;
    if ((cnt[q.t] || 0) < lim(q.t)) { out.push(q); cnt[q.t] = (cnt[q.t] || 0) + 1; } else later.push(q);
  }
  for (const q of later) { if (out.length >= n) break; out.push(q); }
  return shuffle(out).map(q => q.id);
}
function newRound(sid) {
  let ids;
  if (sid === 'fin') {
    ids = [];
    STATIONS.forEach(s => ids.push(buildList(s.q, stS(s.id), 1)[0]));
    const rest = shuffle(STATIONS.flatMap(s => s.q).filter(q => !ids.includes(q.id) && q.t !== 'order'));
    ids = shuffle(ids.concat(rest.slice(0, FINAL_N - ids.length).map(q => q.id)));
  } else ids = buildList(stById(sid).q, stS(sid), ROUND);
  const r = { sid, ids, i: 0, res: [], miss: false, solved: false };
  setRound(sid, r); return r;
}

/* ---------------- speech & sound ---------------- */
const ORD = ['', 'pierwszego', 'drugiego', 'trzeciego', 'czwartego', 'piątego', 'szóstego', 'siódmego', 'ósmego', 'dziewiątego', 'dziesiątego', 'jedenastego', 'dwunastego', 'trzynastego', 'czternastego', 'piętnastego', 'szesnastego', 'siedemnastego', 'osiemnastego', 'dziewiętnastego', 'dwudziestego', 'dwudziestego pierwszego', 'dwudziestego drugiego', 'dwudziestego trzeciego', 'dwudziestego czwartego', 'dwudziestego piątego', 'dwudziestego szóstego', 'dwudziestego siódmego', 'dwudziestego ósmego', 'dwudziestego dziewiątego', 'trzydziestego', 'trzydziestego pierwszego'];
const YEARS = { '966': 'dziewięćset sześćdziesiątym szóstym', '1410': 'tysiąc czterysta dziesiątym', '1918': 'tysiąc dziewięćset osiemnastym', '1791': 'tysiąc siedemset dziewięćdziesiątym pierwszym' };
function forSpeech(t) {
  return String(t)
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{1F1E6}-\u{1F1FF}]/gu, '')
    .replace(/Mieszk(o|a) I\b/g, (m, e) => 'Mieszk' + e + (e === 'o' ? ' Pierwszy' : ' Pierwszego'))
    .replace(/Jan Paweł II/g, 'Jan Paweł Drugi')
    .replace(/\bw (\d{3,4}) roku/g, (m, y) => YEARS[y] ? 'w ' + YEARS[y] + ' roku' : m)
    .replace(/\b(\d{1,2}) (stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia|Maja|Listopada)/g, (m, d, mo) => (ORD[+d] || d) + ' ' + mo.toLowerCase())
    .replace(/[„”"…]/g, ' ').replace(/\s+/g, ' ').trim();
}
let voice = null, speakBtn = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices();
  voice = vs.find(v => /^pl/i.test(v.lang) && /google|zosia|natural|online/i.test(v.name)) || vs.find(v => /^pl/i.test(v.lang)) || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
let warnedVoice = false;
function speak(text, btn) {
  if (!('speechSynthesis' in window)) { toast('Ten telefon nie umie czytać na głos 😕'); return; }
  const was = speakBtn === btn && speechSynthesis.speaking;
  stopSpeak();
  if (was) return;
  if (!voice) pickVoice();
  if (!voice && !warnedVoice) { warnedVoice = true; toast('Brak polskiego głosu w telefonie – czytam, jak umiem'); }
  const u = new SpeechSynthesisUtterance(forSpeech(text));
  u.lang = 'pl-PL'; if (voice) u.voice = voice; u.rate = 0.88; u.pitch = 1.05;
  speakBtn = btn || null; if (btn) btn.classList.add('on');
  u.onend = u.onerror = () => { if (btn) btn.classList.remove('on'); if (speakBtn === btn) speakBtn = null; };
  speechSynthesis.speak(u);
}
function stopSpeak() { try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) { } document.querySelectorAll('.speak.on').forEach(b => b.classList.remove('on')); speakBtn = null; }
let actx = null;
function beep(kind) {
  if (!S.sfx) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = kind === 'ok' ? [523, 659, 784] : kind === 'win' ? [523, 659, 784, 1046] : kind === 'tap' ? [440] : [330, 262];
    notes.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * 0.11;
      o.type = kind === 'bad' ? 'triangle' : 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + 0.25);
    });
  } catch (e) { }
}
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }
const spk = (cls = '') => `<button class="speak ${cls}" aria-label="Przeczytaj na głos">🔊</button>`;
function bindSpeak(root, text) { const b = root.querySelector('.speak'); if (b) b.onclick = e => { e.stopPropagation(); speak(text, b); }; }

/* ---------------- navigation ---------------- */
function go(cur) { stopSpeak(); closeSheet(); document.querySelectorAll('.confetti').forEach(e => e.remove()); S.cur = cur; save(); render(); window.scrollTo(0, 0); }
function render() {
  const c = S.cur || { scr: 'map' };
  ({ intro: rIntro, map: rMap, learn: rLearn, quiz: rQuiz, end: rEnd, album: rAlbum, parent: rParent, diploma: rDiploma }[c.scr] || rMap)(c);
}
function screen(html) { $app.innerHTML = `<div class="scr">${html}</div>`; return $app.firstElementChild; }
function closeSheet() { document.querySelectorAll('.sheet,.veil').forEach(e => e.remove()); }
function sheet(cls, html, veil) {
  closeSheet();
  if (veil) { const v = document.createElement('div'); v.className = 'veil'; v.onclick = closeSheet; document.body.appendChild(v); }
  const d = document.createElement('div'); d.className = 'sheet ' + cls; d.innerHTML = `<div class="in">${html}</div>`;
  document.body.appendChild(d); return d;
}

/* ---------------- screens ---------------- */
function rIntro(c) {
  const edit = !!(c && c.edit), sex = S.sex || '';
  const el = screen(`<div class="intro">
    <div class="logo">${emblem('pl')}</div>
    <h1>Cześć! 👋</h1>
    <div class="row" style="align-items:center"><p>Wyruszamy w podróż po Polsce!</p>${spk()}</div>
    <div class="namebox"><label for="nm">Jak masz na imię?</label>
      <input id="nm" type="text" maxlength="20" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="Imię" value="${nm()}">
      <div class="sexrow"><button class="opt ${sex === 'm' ? 'sel' : ''}" data-sex="m"><span class="em">👦</span>Chłopiec</button><button class="opt ${sex === 'f' ? 'sel' : ''}" data-sex="f"><span class="em">👧</span>Dziewczynka</button></div>
      <div class="err" id="err" role="alert"></div></div>
    <button class="big" id="start">${edit ? 'Zapisz ✓' : 'Start ▶'}</button>
    <p class="qsub">Imię wpisuje rodzic. Kliknij 🔊, a przeczytam na głos.</p></div>`);
  bindSpeak(el, 'Cześć! Wyruszamy w podróż po Polsce! Odpowiadaj na pytania i zbieraj naklejki. Jak masz na imię? Poproś rodzica, żeby wpisał twoje imię.');
  const inp = el.querySelector('#nm'), err = el.querySelector('#err');
  let pickSex = sex;
  inp.oninput = () => { err.textContent = ''; };
  el.querySelectorAll('[data-sex]').forEach(b => b.onclick = () => {
    pickSex = b.dataset.sex; err.textContent = ''; beep('tap');
    el.querySelectorAll('[data-sex]').forEach(x => x.classList.toggle('sel', x === b));
  });
  el.querySelector('#start').onclick = () => {
    let v = inp.value.replace(/\s+/g, ' ').trim();
    if (!v) { err.textContent = 'Wpisz imię 🙂'; inp.focus(); beep('bad'); return; }
    if (!pickSex) { err.textContent = 'Wybierz: chłopiec czy dziewczynka'; beep('bad'); return; }
    S.name = v.charAt(0).toUpperCase() + v.slice(1); S.sex = pickSex;
    beep('tap'); go({ scr: edit ? 'parent' : 'map' });
  };
}

const POS = [50, 24, 72, 30, 74, 28, 70, 50];
function rMap() {
  const all = [...STATIONS, FINAL], rowH = 118, h = 70 + (all.length - 1) * rowH + 70, nx = nextSid();
  let line = '';
  all.forEach((s, i) => { const x = POS[i], y = 70 + i * rowH; line += i === 0 ? `M${x},${y}` : ` C${POS[i - 1]},${y - rowH / 2} ${x},${y - rowH / 2} ${x},${y}`; });
  const nodes = all.map((s, i) => {
    const isF = s.id === 'fin', st = isF ? null : stS(s.id), open = isF ? finalUnlocked() : unlocked(i);
    const best = isF ? S.fin.best : st.best, gold = isF ? S.fin.done > 0 : mastered(s.id);
    const pend = isF ? S.fin.pending : st.pending;
    const stars = best ? '★'.repeat(best) + '☆'.repeat(3 - best) : '';
    return `<button class="node ${open ? '' : 'locked'} ${nx === s.id ? 'next' : ''}" data-sid="${s.id}" style="left:${POS[i]}%;top:${70 + i * rowH}px">
      <span class="disc" style="background:${s.color}">${s.vis ? vis(s.vis) : s.icon}${!open ? '<span class="badge">🔒</span>' : gold ? '<span class="badge">👑</span>' : pend ? '<span class="badge">⏸️</span>' : ''}</span>
      <span class="lbl">${esc(s.name)}</span><span class="stars">${stars}</span></button>`;
  }).join('');
  const el = screen(`<div class="top"><span class="hello grow">Cześć, ${nm()}!</span><span class="pill">⭐ ${S.stars}</span><button class="ibtn" id="alb" aria-label="Album naklejek">📒</button></div>
    <div class="trail" style="height:${h}px"><svg class="line" viewBox="0 0 100 ${h}" preserveAspectRatio="none"><path d="${line}" fill="none" stroke="var(--line)" stroke-width="8" stroke-dasharray="2 14" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>${nodes}</div>
    <div class="footer"><button class="link" id="par">Dla rodzica</button></div>`);
  el.querySelector('#alb').onclick = () => go({ scr: 'album' });
  el.querySelector('#par').onclick = parentGate;
  el.querySelectorAll('.node').forEach(b => b.onclick = () => stationTap(b.dataset.sid, b));
  const n = el.querySelector('.node.next'); if (n && n.offsetTop > window.innerHeight - 200) setTimeout(() => n.scrollIntoView({ block: 'center', behavior: 'smooth' }), 150);
}
function stationTap(sid, btn) {
  const isF = sid === 'fin', i = STATIONS.findIndex(s => s.id === sid);
  if (isF ? !finalUnlocked() : !unlocked(i)) { beep('bad'); if (btn) { btn.classList.add('shake'); setTimeout(() => btn.classList.remove('shake'), 450); } toast(isF ? 'Finał otworzy się po wszystkich przystankach' : 'Najpierw poprzedni przystanek 🙂'); return; }
  beep('tap');
  if (!isF && !stS(sid).learned) return go({ scr: 'learn', sid, i: 0 });
  const s = stById(sid), r = roundOf(sid);
  const known = isF ? '' : `<p class="qsub" style="margin:0 0 12px">Umiesz ${stS(sid).known.length} z ${s.q.length} ${mastered(sid) ? '👑' : ''}</p>`;
  const d = sheet('neu', `<div class="row" style="align-items:center;margin-bottom:6px"><span style="font-size:46px">${s.icon}</span><h3 style="margin:0">${esc(s.name)}</h3></div>${known}
    <div class="list"><button class="big" id="play">${r ? `▶ Dokończ (${Math.min(r.i + (r.solved ? 2 : 1), r.ids.length)}/${r.ids.length})` : '▶ Graj'}</button>
    ${isF ? '' : '<button class="big alt" id="learn">📖 Poznaj</button>'}</div>`, true);
  d.querySelector('#play').onclick = () => startQuiz(sid);
  const l = d.querySelector('#learn'); if (l) l.onclick = () => go({ scr: 'learn', sid, i: 0 });
}
function startQuiz(sid) { if (!roundOf(sid)) newRound(sid); go({ scr: 'quiz', sid }); }

function rLearn(c) {
  const s = stById(c.sid), cards = s.cards, i = Math.min(c.i || 0, cards.length - 1), cd = cards[i], last = i === cards.length - 1;
  const pic = cd.v ? vis(cd.v) : esc(cd.e);
  const el = screen(`<div class="top"><button class="ibtn" id="home" aria-label="Mapa">🏠</button><span class="hello grow">${s.icon} ${esc(s.name)}</span></div>
    <div class="learn"><div class="pic ${cd.v === 'map:labels' ? 'map' : ''}">${pic}</div><h2>${esc(cd.t)}</h2>
    <div class="row" style="align-items:center;text-align:left"><p>${esc(cd.s)}</p>${spk()}</div></div>
    <div class="dots" style="margin:10px 0 14px">${cards.map((_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</div>
    <div class="row">${i > 0 ? '<button class="big alt" id="prev" style="width:90px;flex:none">◀</button>' : ''}<button class="big ${last ? '' : 'blue'}" id="nx">${last ? 'Zaczynamy! ▶' : 'Dalej ▶'}</button></div>`);
  bindSpeak(el, cd.t + '. ' + cd.s);
  el.querySelector('#home').onclick = () => go({ scr: 'map' });
  const p = el.querySelector('#prev'); if (p) p.onclick = () => go({ scr: 'learn', sid: c.sid, i: i - 1 });
  el.querySelector('#nx').onclick = () => {
    beep('tap');
    if (!last) return go({ scr: 'learn', sid: c.sid, i: i + 1 });
    stS(c.sid).learned = true; startQuiz(c.sid);
  };
}

/* ---------------- quiz ---------------- */
let Q = null; // current question runtime
function rQuiz(c) {
  const r = roundOf(c.sid);
  if (!r) return go({ scr: 'map' });
  if (r.solved) { r.i++; r.solved = false; r.miss = false; save(); }
  if (r.i >= r.ids.length) return finishRound(c.sid);
  const q = QMAP[r.ids[r.i]].q;
  const prog = r.ids.map((_, k) => `<i class="${k < r.i ? (r.res[k] ? 'ok' : 'miss') : k === r.i ? 'cur' : ''}"></i>`).join('');
  const el = screen(`<div class="top"><button class="ibtn" id="home" aria-label="Mapa">🏠</button><div class="prog">${prog}</div></div>
    <div class="qhead">${spk()}<div class="qtext">${q.t === 'tf' ? '<div class="qsub">Prawda czy nie?</div>' : ''}${esc(q.q)}</div></div>
    <div id="hint"></div><div class="ans" id="ans"></div>`);
  el.querySelector('#home').onclick = () => go({ scr: 'map' });
  Q = { q, r, sid: c.sid, mistakes: r.miss ? 1 : 0, done: false, el };
  const ans = el.querySelector('#ans');
  let say = q.q;
  if (q.t === 'choice') say = renderChoice(q, ans);
  else if (q.t === 'tf') say = renderTF(q, ans);
  else if (q.t === 'map') renderMap(q, ans);
  else if (q.t === 'eu') renderEU(q, ans);
  else if (q.t === 'match') say = renderMatch(q, ans);
  else if (q.t === 'order') say = renderOrder(q, ans);
  bindSpeak(el.querySelector('.qhead'), say);
}
function optSay(list) { const t = list.filter(Boolean); return t.length > 1 ? t.slice(0, -1).join(', ') + ' czy ' + t[t.length - 1] + '?' : (t[0] || ''); }
function renderChoice(q, ans) {
  const os = q.o.map((s, k) => ({ k, ...opt(s) }));
  const order = shuffle(os);
  const allVis = os.every(o => o.e[0] === '#' && !o.x);
  const short = os.every(o => (o.x || '').length <= 13);
  const layout = allVis || (short && os.length !== 3) ? 'grid' : 'list';
  ans.innerHTML = `<div class="${layout}">${order.map(o => `<button class="opt ${allVis ? 'vis' : ''}" data-k="${o.k}">${o.e ? `<span class="em">${emHTML(o.e)}</span>` : ''}${o.x ? `<span>${esc(o.x)}</span>` : ''}</button>`).join('')}</div>`;
  ans.querySelectorAll('.opt').forEach(b => b.onclick = () => pickChoice(b, +b.dataset.k === q.a, os.length));
  return q.q + ' ' + (allVis ? '' : optSay(order.map(o => o.say)));
}
function renderTF(q, ans) {
  ans.innerHTML = `<div class="tf"><button class="opt" data-k="1"><span class="em">👍</span>Tak</button><button class="opt" data-k="0"><span class="em">👎</span>Nie</button></div>`;
  ans.querySelectorAll('.opt').forEach(b => b.onclick = () => pickChoice(b, (b.dataset.k === '1') === q.a, 2));
  return q.q + ' Tak czy nie?';
}
function renderMap(q, ans) {
  const keys = q.o.map((_, k) => k);
  ans.innerHTML = `<div class="mapbox">${plMap({ dots: q.o, keys })}</div><p class="qsub" style="text-align:center;margin:8px 0 0">Dotknij kropkę 👆</p>`;
  ans.querySelectorAll('.dot').forEach(d => d.onclick = () => pickChoice(d, +d.dataset.k === q.a, q.o.length));
}
function renderEU(q, ans) {
  ans.innerHTML = `<div class="mapbox">${euMap(q.o, q.o.map((_, k) => k))}</div><p class="qsub" style="text-align:center;margin:8px 0 0">Dotknij żółty kraj 👆</p>`;
  ans.querySelectorAll('.cty').forEach(d => d.onclick = () => pickChoice(d, +d.dataset.k === q.a, q.o.length));
}
function pickChoice(b, ok, n) {
  if (Q.done || b.classList.contains('bad')) return;
  stopSpeak();
  if (ok) { b.classList.add('ok'); return solve(true); }
  beep('bad'); b.classList.add('bad', 'shake'); markMiss();
  if (Q.mistakes >= 2 || n <= 2) { revealCorrect(); return solve(false); }
  showHint(Q.q.h || 'Spróbuj jeszcze raz!');
}
function revealCorrect() {
  const q = Q.q, ans = Q.el.querySelector('#ans');
  let k = q.t === 'tf' ? (q.a ? '1' : '0') : String(q.a);
  const t = ans.querySelector(`[data-k="${k}"]`); if (t) t.classList.add('ok');
}
function showHint(h) {
  const box = Q.el.querySelector('#hint');
  box.innerHTML = `<div class="hint">${spk('sm')}<span>💡 ${esc(h)}</span></div>`;
  bindSpeak(box, h);
}
function markMiss() { Q.mistakes++; if (!Q.r.miss) { Q.r.miss = true; save(); } }

function renderMatch(q, ans) {
  const L = shuffle(q.p.map((p, k) => ({ k, x: p[0] }))), R = shuffle(q.p.map((p, k) => ({ k, e: p[1] })));
  ans.innerHTML = `<div class="match"><div class="col">${L.map(o => `<button class="opt" data-side="L" data-k="${o.k}"><span>${esc(o.x)}</span></button>`).join('')}</div>
    <div class="col">${R.map(o => `<button class="opt ${o.e[0] === '#' ? 'vis' : ''}" data-side="R" data-k="${o.k}"><span class="em">${emHTML(o.e)}</span></button>`).join('')}</div></div>
    <p class="qsub" style="text-align:center;margin:10px 0 0">Dotknij imię, potem obrazek 👆</p>`;
  let sel = null, left = q.p.length;
  ans.querySelectorAll('.opt').forEach(b => b.onclick = () => {
    if (Q.done || b.classList.contains('done')) return;
    if (!sel || sel.dataset.side === b.dataset.side) {
      ans.querySelectorAll('.sel').forEach(x => x.classList.remove('sel'));
      sel = b; b.classList.add('sel'); beep('tap');
      if (Q.mistakes >= 2) { ans.querySelectorAll('.help').forEach(x => x.classList.remove('help')); const m = ans.querySelector(`[data-side="${b.dataset.side === 'L' ? 'R' : 'L'}"][data-k="${b.dataset.k}"]`); if (m) m.classList.add('help'); }
      return;
    }
    if (sel.dataset.k === b.dataset.k) {
      [sel, b].forEach(x => { x.classList.remove('sel', 'help'); x.classList.add('done'); });
      sel = null; left--; beep(left ? 'tap' : 'ok');
      if (!left) solve(Q.mistakes === 0, true);
    } else {
      beep('bad'); [sel, b].forEach(x => { x.classList.add('shake'); setTimeout(() => x.classList.remove('shake'), 450); });
      sel.classList.remove('sel'); sel = null; markMiss();
      showHint(Q.mistakes >= 2 ? 'Pomogę Ci! Dotknij imię, a dobry obrazek zacznie mrugać.' : 'Spróbuj jeszcze raz!');
    }
  });
  return q.q + ': ' + q.p.map(p => p[0]).join(', ');
}
function renderOrder(q, ans) {
  const items = q.o.map((s, k) => ({ k, ...opt(s) })), sh = shuffle(items);
  if (sh.every((o, i) => o.k === i)) sh.push(sh.shift());
  ans.innerHTML = `<div class="order"><div class="tiles">${sh.map(o => `<button class="opt" data-k="${o.k}"><span class="em">${emHTML(o.e)}</span><span>${esc(o.x)}</span></button>`).join('')}</div>
    <div class="slots">${items.map((_, i) => `<div class="slot" data-i="${i}">${i + 1}</div>`).join('')}</div>
    <p class="qsub" style="text-align:center;margin:10px 0 0">Dotykaj po kolei: co było pierwsze? 👆</p></div>`;
  let n = 0;
  ans.querySelectorAll('.tiles .opt').forEach(b => b.onclick = () => {
    if (Q.done || b.classList.contains('ghost')) return;
    if (+b.dataset.k === n) {
      const slot = ans.querySelector(`.slot[data-i="${n}"]`);
      slot.innerHTML = `<div class="opt">${b.innerHTML}</div>`; b.classList.add('ghost'); b.classList.remove('help');
      n++; beep(n < items.length ? 'tap' : 'ok');
      if (n === items.length) solve(Q.mistakes === 0, true);
      else if (Q.mistakes >= 2) { const nx = ans.querySelector(`.tiles .opt[data-k="${n}"]`); if (nx) nx.classList.add('help'); }
    } else {
      beep('bad'); b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 450); markMiss();
      if (Q.mistakes >= 2) { const nx = ans.querySelector(`.tiles .opt[data-k="${n}"]`); if (nx) nx.classList.add('help'); showHint('Pomogę Ci! Mrugający obrazek jest następny.'); }
      else showHint('Pomyśl, co było najpierw.');
    }
  });
  return q.q + ': ' + items.map(o => o.say).join(', ');
}

const PRAISE = ['Brawo', 'Super', 'Świetnie', 'Ekstra', 'Wspaniale', 'Doskonale', 'Mistrzowsko'];
function solve(firstOk, silent) {
  if (Q.done) return; Q.done = true;
  const { q, r, sid } = Q;
  const ok = firstOk && Q.mistakes === 0;
  r.res[r.i] = ok; r.solved = true;
  const home = QMAP[q.id].sid, st = stS(home);
  if (!st.seen.includes(q.id)) st.seen.push(q.id);
  if (ok) { if (!st.known.includes(q.id)) st.known.push(q.id); st.wrong = st.wrong.filter(x => x !== q.id); }
  else { st.known = st.known.filter(x => x !== q.id); if (!st.wrong.includes(q.id)) st.wrong.push(q.id); }
  save();
  if (!silent || firstOk) beep(firstOk ? 'ok' : 'bad');
  const solvedRight = firstOk || q.t === 'match' || q.t === 'order';
  const title = ok ? `${pick(PRAISE)}, ${nm()}! 🎉` : solvedRight ? 'Udało się! 💪' : 'Nic nie szkodzi! 💪';
  const pre = ok || solvedRight ? '' : 'Dobra odpowiedź świeci na zielono. ';
  const d = sheet(ok ? 'good' : 'meh', `<h3>${title}</h3><div class="fact">${spk('sm')}<span>${esc(q.f || '')}</span></div>
     <button class="big" id="next">Dalej ▶</button>`);
  bindSpeak(d, (ok ? title : pre) + ' ' + (q.f || ''));
  d.querySelector('#next').onclick = () => { beep('tap'); go({ scr: 'quiz', sid }); };
}
function finishRound(sid) {
  const r = roundOf(sid), n = r.ids.length, good = r.res.filter(Boolean).length;
  const stars = sid === 'fin' ? (good >= 9 ? 3 : good >= 6 ? 2 : 1) : (good === n ? 3 : good >= 3 ? 2 : 1);
  let first = false, gold = false;
  if (sid === 'fin') { first = S.fin.done === 0; S.fin.done++; S.fin.best = Math.max(S.fin.best, stars); S.fin.pending = null; }
  else { const st = stS(sid); const wasGold = mastered(sid); first = st.rounds === 0; st.rounds++; st.best = Math.max(st.best, stars); st.pending = null; gold = !wasGold && mastered(sid); }
  S.stars += stars;
  go({ scr: 'end', sid, stars, good, n, first, gold });
}
function rEnd(c) {
  const s = stById(c.sid), isF = c.sid === 'fin';
  const msg = c.gold ? `Złota korona! Umiesz cały przystanek „${s.name}”! 👑` : c.first ? (isF ? g('Zdobyłeś Puchar Mistrza!', 'Zdobyłaś Puchar Mistrzyni!') : 'Nowa naklejka w albumie!') : `Dobre odpowiedzi: ${c.good} z ${c.n}`;
  const el = screen(`<div class="end"><h2>${c.stars === 3 ? 'Wspaniale' : c.stars === 2 ? 'Brawo' : 'Dobra robota'}, ${nm()}!</h2>
    <div class="bigstars">${[0, 1, 2].map(k => `<span class="${k < c.stars ? '' : 'off'}" style="animation-delay:${k * 0.25}s">⭐</span>`).join('')}</div>
    ${c.first || c.gold ? `<div class="stk">${c.gold ? '👑' : s.sticker}</div>` : ''}
    <div class="row" style="align-items:center"><p>${esc(msg)}</p>${spk('sm')}</div>
    <div class="list" style="width:100%;margin-top:10px">
      ${isF ? '<button class="big" id="dip">📜 Mój dyplom</button>' : ''}
      <button class="big ${isF ? 'blue' : ''}" id="map">🗺️ Mapa</button><button class="big alt" id="again">🔁 Jeszcze raz</button></div></div>`);
  bindSpeak(el, `${c.stars} gwiazdki. ${msg}`.replace('1 gwiazdki', 'Jedna gwiazdka').replace('3 gwiazdki', 'Trzy gwiazdki').replace('2 gwiazdki', 'Dwie gwiazdki'));
  el.querySelector('#map').onclick = () => go({ scr: 'map' });
  el.querySelector('#again').onclick = () => startQuiz(c.sid);
  const dp = el.querySelector('#dip'); if (dp) dp.onclick = () => go({ scr: 'diploma' });
  beep('win'); confetti(c.stars * 25);
}
function confetti(n) {
  const box = document.createElement('div'); box.className = 'confetti';
  const cols = ['#e8423f', '#ffffff', '#f2c230', '#2fa65a', '#2f8fd8', '#c0479a'];
  for (let i = 0; i < n; i++) { const p = document.createElement('i'); p.style.left = Math.random() * 100 + '%'; p.style.background = pick(cols); p.style.animationDuration = 1.8 + Math.random() * 1.8 + 's'; p.style.animationDelay = Math.random() * 0.6 + 's'; box.appendChild(p); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 4500);
}

/* ---------------- album, diploma ---------------- */
function rAlbum() {
  const cells = [...STATIONS, FINAL].map(s => {
    const isF = s.id === 'fin', has = isF ? S.fin.done > 0 : stS(s.id).rounds > 0, gold = isF ? S.fin.best === 3 : mastered(s.id);
    return `<div class="cell ${has ? '' : 'no'} ${has && gold ? 'gold' : ''}"><div class="e">${has ? s.sticker : '❔'}</div><div class="n">${esc(s.name)}</div><div class="s">${has ? (gold ? '👑 Złota!' : '★'.repeat((isF ? S.fin.best : stS(s.id).best)) ) : 'Jeszcze nie'}</div></div>`;
  }).join('');
  const el = screen(`<div class="top"><button class="ibtn" id="home" aria-label="Mapa">🏠</button><span class="hello grow">📒 Naklejki</span><span class="pill">⭐ ${S.stars}</span></div>
    <div class="album">${cells}</div>${S.fin.done ? '<button class="big blue" id="dip" style="margin-top:16px">📜 Mój dyplom</button>' : ''}`);
  el.querySelector('#home').onclick = () => go({ scr: 'map' });
  const dp = el.querySelector('#dip'); if (dp) dp.onclick = () => go({ scr: 'diploma' });
}
function rDiploma() {
  const d = new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
  const el = screen(`<div class="top"><button class="ibtn" id="home" aria-label="Mapa">🏠</button><span class="grow"></span></div>
    <div class="dip"><div style="width:110px;margin:0 auto">${emblem('pl')}</div><h1>DYPLOM</h1><p>otrzymuje</p><div class="who">${nm()}</div>
    <p>${g('Mistrz', 'Mistrzyni')} Wiedzy o Polsce 🏆</p><p>Zebrane gwiazdki: ⭐ ${S.stars}</p><p style="font-size:16px;font-weight:600">${d}</p></div>
    <div class="row" style="align-items:center;justify-content:center">${spk()}</div>`);
  bindSpeak(el, `Dyplom otrzymuje ${S.name}. ${g('Mistrz', 'Mistrzyni')} wiedzy o Polsce! Gratulacje!`);
  el.querySelector('#home').onclick = () => go({ scr: 'map' });
  confetti(60);
}

/* ---------------- parent ---------------- */
function parentGate() {
  const a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4), ok = a * b;
  const opts = shuffle([ok, ok + a, ok - b, ok + 10]);
  const d = sheet('neu', `<h3>Dla rodzica</h3><p class="qsub" style="margin:0">Ile to ${a} × ${b}?</p><div class="gate">${opts.map(v => `<button class="big alt" data-v="${v}">${v}</button>`).join('')}</div>`, true);
  d.querySelectorAll('[data-v]').forEach(x => x.onclick = () => { if (+x.dataset.v === ok) go({ scr: 'parent' }); else { closeSheet(); toast('To miejsce dla rodzica 🙂'); } });
}
function rParent(c) {
  const rows = STATIONS.map(s => {
    const st = stS(s.id), k = st.known.length, n = s.q.length;
    const wr = st.wrong.map(id => QMAP[id] ? `<div class="wr">• ${esc(QMAP[id].q.q)}</div>` : '').join('');
    return `<div class="st"><b>${s.icon} ${esc(s.name)}</b> <span class="small">– umie ${k}/${n}, rund: ${st.rounds}</span><div class="bar"><b style="width:${Math.round(k / n * 100)}%"></b></div>${wr ? `<div class="small" style="margin-top:4px">Do powtórki:</div>${wr}` : ''}</div>`;
  }).join('');
  const el = screen(`<div class="top"><button class="ibtn" id="home" aria-label="Mapa">🏠</button><span class="hello grow">Panel rodzica</span></div>
    <div class="par"><h2>Postępy</h2>${rows}<div class="st"><b>🏆 Wielki Finał</b> <span class="small">– rozegrany ${S.fin.done}×, najlepiej ${S.fin.best}/3 ★</span></div>
    <h2>Ustawienia</h2>
    <button class="tog" id="name">Imię: ${nm()} ${S.sex === 'f' ? '👧' : '👦'} <b>Zmień</b></button>
    <button class="tog" id="sfx">Dźwięki (dzyń przy odpowiedzi) <b class="${S.sfx ? 'on' : ''}">${S.sfx ? 'WŁ' : 'WYŁ'}</b></button>
    <button class="tog" id="all">Odblokuj wszystkie przystanki <b class="${S.all ? 'on' : ''}">${S.all ? 'WŁ' : 'WYŁ'}</b></button>
    <p class="small">Lektor: dziecko klika 🔊 przy pytaniu, karcie lub podpowiedzi. Postęp zapisuje się sam w tym telefonie i przeglądarce – po zamknięciu gra wraca do tego samego miejsca.</p>
    <p class="small">Każda runda to 5 pytań (finał: 10). Pytania z błędem wracają w następnych rundach. Złota korona 👑 = wszystkie pytania z przystanku zaliczone za pierwszym razem.</p>
    <button class="big danger" id="reset" style="margin-top:10px">Zacznij od nowa</button></div>`);
  el.querySelector('#home').onclick = () => go({ scr: 'map' });
  el.querySelector('#name').onclick = () => go({ scr: 'intro', edit: true });
  el.querySelector('#sfx').onclick = () => { S.sfx = !S.sfx; save(); render(); };
  el.querySelector('#all').onclick = () => { S.all = !S.all; save(); render(); };
  el.querySelector('#reset').onclick = () => {
    const d = sheet('neu', `<h3>Na pewno?</h3><p class="qsub">Wszystkie gwiazdki i naklejki zostaną usunięte.</p><div class="list"><button class="big danger" id="yes">Tak, usuń</button><button class="big alt" id="no">Anuluj</button></div>`, true);
    d.querySelector('#yes').onclick = () => { S = fresh(); save(); go({ scr: 'intro' }); };
    d.querySelector('#no').onclick = closeSheet;
  };
}

/* ---------------- start ---------------- */
function boot() {
  if (!S.name || !S.sex) { S.cur = { scr: 'intro' }; return render(); }
  const c = S.cur || { scr: 'map' };
  if (c.scr === 'quiz' || c.scr === 'learn') {
    const s = stById(c.sid);
    if (!s) { S.cur = { scr: 'map' }; return render(); }
    const r = roundOf(c.sid);
    const where = c.scr === 'quiz' && r ? `pytanie ${Math.min(r.i + (r.solved ? 2 : 1), r.ids.length)} z ${r.ids.length}` : 'karty „Poznaj”';
    S.cur = { scr: 'map' }; render();
    const d = sheet('neu', `<h3>Witaj z powrotem, ${nm()}! 👋</h3><div class="fact">${spk('sm')}<span>${g('Skończyłeś', 'Skończyłaś')} tutaj: ${s.icon} ${esc(s.name)}, ${where}.</span></div>
      <div class="list"><button class="big" id="cont">▶ Graj dalej</button><button class="big alt" id="tomap">🗺️ Mapa</button></div>`, true);
    bindSpeak(d, `Witaj z powrotem, ${S.name}! ${g('Skończyłeś', 'Skończyłaś')} tutaj: ${s.name}.`);
    d.querySelector('#cont').onclick = () => go(c);
    d.querySelector('#tomap').onclick = () => { closeSheet(); save(); };
    return;
  }
  if (c.scr === 'end' || c.scr === 'parent') S.cur = { scr: 'map' };
  render();
  if (S.cur.scr === 'map' && S.stars > 0) toast(`Witaj z powrotem, ${S.name}! 👋`);
}
window.__T = { get S() { return S; }, get Q() { return Q; }, QMAP, STATIONS, reset() { S = fresh(); save(); } };
boot();
