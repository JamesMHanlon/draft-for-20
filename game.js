(() => {
'use strict';
/* =====================================================================
   Draft for 20 — online auction draft.
   The host's browser owns the game state. Clients send intents
   (join / bid / nominate / vote) and render the "view" the host sends
   back. Views never contain hidden ranks or unrevealed blind items.
   ===================================================================== */
const $ = s => document.querySelector(s);
const MAX_PLAYERS = 8;
const COLORS = ['#FE2C55', '#25F4EE', '#FFC83D', '#9B6BFF', '#7CFF6B', '#FF8A3D', '#FF6BD6', '#4D8DFF'];
const ID_PREFIX = 'draft20-room-';
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const store = {
  get(k, d) { try { const v = localStorage.getItem('d420:' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('d420:' + k, JSON.stringify(v)); } catch {} },
};

/* ---------------- sound / toast / confetti ---------------- */
let muted = store.get('muted', false), actx;
function tone(f, dur = .12, type = 'triangle', vol = .14, when = 0) {
  if (muted) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime + when, o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + .02);
  } catch {}
}
const sfx = {
  bid() { tone(660, .08, 'square', .06); },
  sold() { tone(520, .1); tone(780, .16, 'triangle', .14, .07); },
  tick() { tone(950, .05, 'square', .05); },
  join() { tone(440, .1); tone(660, .12, 'triangle', .12, .08); },
  reveal(r, n) { const f = 300 + (n - r) * (600 / n); tone(f, .18); tone(f * 1.5, .22, 'sine', .1, .1); },
  win() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .3, 'triangle', .16, i * .11)); },
};
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
const cv = $('#confetti'), cx = cv.getContext('2d');
let parts = [], confRaf = 0;
function confetti(colors, n = 220) {
  cv.width = innerWidth; cv.height = innerHeight;
  for (let i = 0; i < n; i++) parts.push({ x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * .5, vx: (Math.random() - .5) * 4, vy: 2 + Math.random() * 4, r: Math.random() * 6.28, vr: (Math.random() - .5) * .3, s: 6 + Math.random() * 8, c: colors[i % colors.length] });
  if (!confRaf) confRaf = requestAnimationFrame(confStep);
}
function confStep() {
  cx.clearRect(0, 0, cv.width, cv.height);
  parts = parts.filter(p => p.y < cv.height + 30);
  for (const p of parts) { p.x += p.vx; p.y += p.vy; p.vy += .04; p.r += p.vr; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); cx.restore(); }
  confRaf = parts.length ? requestAnimationFrame(confStep) : 0;
}
function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id)); }

/* ---------------- genres ---------------- */
let custom = store.get('custom', []);
const allGenres = () => [...GENRES.map(g => ({ ...g, ranked: true })), ...custom];
const findGenre = id => allGenres().find(g => g.id === id) || allGenres()[0];
const genreInfo = g => ({ id: g.id, name: g.name, emoji: g.emoji || '⭐', basis: g.basis, ranked: !!g.ranked, count: g.items.length });

/* =====================================================================
   HOST
   ===================================================================== */
const H = { peer: null, room: null, conns: new Map() };
const makeCode = () => Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.random() * 32 | 0]).join('');

function hostCreate(name, plays) {
  status('Creating room…');
  const code = makeCode();
  const peer = new Peer(ID_PREFIX + code);
  peer.on('open', () => {
    H.peer = peer; ME.role = 'host';
    H.room = {
      code, phase: 'lobby', players: [], g: null,
      settings: Object.assign({ genreId: 'nba', picks: 5, budget: 20, timer: 15, blind: true, scoring: 'rank' }, store.get('hostSettings', {})),
    };
    if (plays) addPlayer('host', name);
    status(''); hostUpdate();
  });
  peer.on('connection', conn => {
    conn.on('data', d => onClientMsg(conn, d));
    conn.on('close', () => onClientClose(conn));
    conn.on('error', () => onClientClose(conn));
  });
  peer.on('error', e => {
    if (e.type === 'unavailable-id') { peer.destroy(); hostCreate(name, plays); }
    else if (!H.room) { status(`Couldn't create room (${e.type}). Check your internet connection.`); }
  });
  peer.on('disconnected', () => { try { peer.reconnect(); } catch {} });
}
function addPlayer(pid, name) {
  const used = new Set(H.room.players.map(p => p.color));
  H.room.players.push({ pid, name, color: COLORS.find(c => !used.has(c)), connected: true });
}
const pidIdx = pid => H.room.players.findIndex(p => p.pid === pid);
const hostIdx = () => pidIdx('host');

function onClientMsg(conn, m) {
  const r = H.room; if (!r || !m || typeof m !== 'object') return;
  if (m.t === 'join') {
    const name = String(m.name || '').trim().slice(0, 16) || 'Player';
    H.conns.set(conn.peer, conn);
    const same = r.players.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (same && !same.connected) { same.pid = conn.peer; same.connected = true; hostEvent({ toast: `${name} reconnected`, sfx: 'join' }); }
    else if (same) { send(conn, { t: 'fatal', msg: `Someone called "${name}" is already in this room. Pick another name.` }); return; }
    else if (r.phase === 'lobby' && r.players.length < MAX_PLAYERS) { addPlayer(conn.peer, name); hostEvent({ toast: `${name} joined`, sfx: 'join' }); }
    else { conn.spectator = name; hostEvent({ toast: `${name} is watching` }); }
    return hostUpdate();
  }
  const i = pidIdx(conn.peer);
  if (m.t === 'bid' && i >= 0) doBid(i, +m.to, conn);
  else if (m.t === 'nominate' && i >= 0) doNominate(i, +m.tile, conn);
  else if (m.t === 'vote' && i >= 0) doVote(i, +m.target, conn);
}
function onClientClose(conn) {
  const r = H.room; if (!r || !H.conns.has(conn.peer)) return;
  H.conns.delete(conn.peer);
  const i = pidIdx(conn.peer);
  if (i < 0) return hostUpdate();
  const p = r.players[i];
  if (r.phase === 'lobby') r.players.splice(i, 1); else p.connected = false;
  hostEvent({ toast: `${p.name} left${r.phase === 'lobby' ? '' : '. They can rejoin with the same name'}` });
  hostUpdate();
}
function send(conn, m) { try { if (conn && conn.open) conn.send(m); } catch {} }
function hostEvent(ev) { for (const c of H.conns.values()) send(c, { t: 'event', ...ev }); onEvent(ev); }
function denyTo(conn, msg) { if (conn) send(conn, { t: 'event', toast: msg }); else toast(msg); }

/* ---------- game logic (host) ---------- */
function hostStart() {
  const r = H.room, s = r.settings, genre = findGenre(s.genreId);
  const np = r.players.length, per = s.picks, total = np * per;
  if (np < 2) return toast('You need at least 2 players');
  if (total > genre.items.length) return toast(`This genre only has ${genre.items.length} items. Lower the picks`);
  const pool = shuffle([...genre.items.keys()]).slice(0, total).sort((a, b) => a - b).map(i => genre.items[i]);
  r.g = {
    genre: genreInfo(genre), items: pool, np, per, total, budgetStart: s.budget,
    tiles: shuffle([...Array(total).keys()]), owner: {}, price: {}, teams: r.players.map(() => []), budget: Array(np).fill(s.budget),
    pick: 0, nom: 0, lot: null, last: null, history: [],
    timer: s.timer, blind: s.blind, scoring: genre.ranked ? s.scoring : 'vote',
    deadline: 0, remaining: 0, paused: false, reveal: 0, votes: {},
  };
  r.phase = 'auction';
  openLot(); hostUpdate();
}
const G = () => H.room.g;
const needs = i => G().per - G().teams[i].length;
const maxBid = i => needs(i) > 0 ? G().budget[i] - (needs(i) - 1) : 0; // keep £1 for every empty slot
const done = () => G().pick >= G().total;
function resetClock() { const g = G(); g.paused = false; if (g.timer) g.deadline = Date.now() + g.timer * 1000; }
function openLot(item = null) {
  const g = G();
  if (done()) { g.lot = null; return; }
  let nominator = 0;
  for (let k = 0; k < g.np; k++) { const i = (g.nom + k) % g.np; if (needs(i) > 0) { nominator = i; g.nom = i; break; } }
  if (item == null) { const open = g.tiles.filter(i => g.owner[i] == null); item = open[Math.random() * open.length | 0]; }
  g.lot = { item, bid: 1, leader: nominator, nominator, log: [] };
  resetClock();
}
function doBid(i, to, conn) {
  const g = G(); if (!g || H.room.phase !== 'auction' || !g.lot || done()) return;
  const l = g.lot, p = H.room.players[i];
  if (!Number.isFinite(to)) return;
  if (needs(i) <= 0) return denyTo(conn, 'Your team is full');
  if (l.leader === i) return denyTo(conn, "You're already winning");
  if (to <= l.bid) return denyTo(conn, `Too late! The bid is already £${l.bid}`);
  if (to > maxBid(i)) return denyTo(conn, `You can only bid up to £${maxBid(i)}`);
  l.log.push({ bid: l.bid, leader: l.leader });
  l.bid = to; l.leader = i;
  resetClock();
  hostEvent({ sfx: 'bid', toast: `${p.name} bids £${to}` });
  hostUpdate();
}
function doNominate(i, tile, conn) {
  const g = G(); if (!g || !g.lot || g.blind) return;
  if (i !== g.lot.nominator && i !== -1) return denyTo(conn, 'Only the player whose turn it is can choose the item');
  if (g.lot.log.length) return denyTo(conn, 'Bidding has already started');
  const item = g.tiles[tile];
  if (item == null || g.owner[item] != null) return;
  g.lot.item = item; resetClock(); hostUpdate();
}
function reroll() {
  const g = G(); if (!g || !g.lot || g.lot.log.length) return toast('Bidding has already started');
  const open = g.tiles.filter(i => g.owner[i] == null && i !== g.lot.item); if (!open.length) return;
  g.lot.item = open[Math.random() * open.length | 0]; resetClock(); hostUpdate();
}
function snapshot() {
  const g = G();
  g.history.push(JSON.stringify({ owner: g.owner, price: g.price, teams: g.teams, budget: g.budget, pick: g.pick, nom: g.nom, lot: g.lot, last: g.last }));
}
function sell(auto = false) {
  const g = G(); if (!g || !g.lot || done()) return;
  snapshot();
  const l = g.lot, i = l.leader, p = H.room.players[i];
  g.owner[l.item] = i; g.price[l.item] = l.bid; g.teams[i].push(l.item); g.budget[i] -= l.bid;
  g.pick++; g.last = l.item; g.nom = (g.nom + 1) % g.np;
  const msg = `${auto ? '⏰ ' : ''}SOLD! ${g.items[l.item]} goes to ${p.name} for £${l.bid}`;
  openLot();
  hostEvent({ toast: done() ? 'Auction complete!' : msg, sfx: done() ? 'win' : 'sold', confetti: done() });
  hostUpdate();
}
function undo() {
  const g = G(); if (!g) return;
  if (g.lot && g.lot.log.length) { const l = g.lot.log.pop(); g.lot.bid = l.bid; g.lot.leader = l.leader; resetClock(); hostEvent({ toast: '↶ Last bid undone' }); return hostUpdate(); }
  if (!g.history.length) return toast('Nothing to undo');
  Object.assign(g, JSON.parse(g.history.pop()));
  resetClock(); hostEvent({ toast: '↶ Last sale undone' }); hostUpdate();
}
function togglePause() {
  const g = G(); if (!g || !g.timer || done()) return;
  if (g.paused) { g.deadline = Date.now() + g.remaining; g.paused = false; }
  else { g.remaining = g.deadline - Date.now(); g.paused = true; }
  hostUpdate();
}
setInterval(() => {
  const r = H.room; if (!r || r.phase !== 'auction') return;
  const g = r.g; if (!g.timer || g.paused || done() || !g.lot) return;
  if (Date.now() >= g.deadline) sell(true);
}, 150);

const pts = it => G().total - it; // index 0 = #1
const revealSeq = () => [...Array(G().total).keys()].reverse();
function scores() {
  const g = G(), s = Array(g.np).fill(0);
  if (g.scoring === 'vote') { Object.values(g.votes).forEach(t => s[t]++); return s; }
  revealSeq().slice(0, g.reveal).forEach(it => { if (g.owner[it] != null) s[g.owner[it]] += pts(it); });
  return s;
}
function revealNext() {
  const g = G(); if (H.room.phase !== 'results' || g.scoring === 'vote' || g.reveal >= g.total) return;
  g.reveal++;
  const it = revealSeq()[g.reveal - 1];
  hostEvent({ sfx: 'reveal', rank: it + 1, n: g.total, confetti: it < 3 ? [H.room.players[g.owner[it]].color] : null });
  hostUpdate();
}
function doVote(i, target, conn) {
  const g = G(); if (H.room.phase !== 'results' || g.scoring !== 'vote') return;
  if (!(target >= 0 && target < g.np)) return;
  if (target === i) return denyTo(conn, "You can't vote for your own team");
  g.votes[i] = target; hostUpdate();
}
function awards() {
  const g = G(); if (g.scoring !== 'rank') return [];
  const sold = Object.keys(g.price).map(Number);
  const bargain = sold.reduce((a, b) => pts(b) / g.price[b] > pts(a) / g.price[a] ? b : a);
  const splurge = sold.reduce((a, b) => g.price[b] > g.price[a] || (g.price[b] === g.price[a] && b > a) ? b : a);
  return [['💎 Bargain of the auction', bargain], ['💸 Big spender', splurge]]
    .map(([label, it]) => ({ label, name: g.items[it], rank: it + 1, owner: g.owner[it], price: g.price[it] }));
}

/* ---------- views (what each screen is allowed to see) ---------- */
function makeView(you) {
  const r = H.room, g = r.g;
  const v = { t: 'state', you, code: r.code, phase: r.phase, settings: r.settings, genre: genreInfo(findGenre(r.settings.genreId)),
    players: r.players.map(p => ({ name: p.name, color: p.color, connected: p.connected, host: p.pid === 'host' })),
    spectators: [...H.conns.values()].filter(c => c.spectator).map(c => c.spectator) };
  if (!g || r.phase === 'lobby') return v;
  const revealed = new Set(revealSeq().slice(0, g.reveal));
  const item = it => ({ name: g.items[it], price: g.price[it], rank: revealed.has(it) ? it + 1 : null, pts: revealed.has(it) ? pts(it) : null, last: it === g.last });
  v.g = {
    genre: g.genre, np: g.np, per: g.per, total: g.total, pick: g.pick, done: done(), budgetStart: g.budgetStart,
    timer: g.timer, paused: g.paused, endsIn: g.timer ? (g.paused ? g.remaining : g.deadline - Date.now()) : null,
    blind: g.blind, scoring: g.scoring,
    budget: g.budget, maxBid: g.teams.map((_, i) => maxBid(i)), needs: g.teams.map((_, i) => needs(i)),
    teams: g.teams.map(t => t.map(item)),
    board: g.tiles.map((it, k) => {
      const isLot = g.lot && g.lot.item === it, owned = g.owner[it] != null;
      return { k: k + 1, name: owned || isLot || !g.blind ? g.items[it] : null, owner: owned ? g.owner[it] : null, price: g.price[it] ?? null, lot: !!isLot, last: it === g.last };
    }),
    lot: g.lot && { name: g.items[g.lot.item], k: g.tiles.indexOf(g.lot.item) + 1, bid: g.lot.bid, leader: g.lot.leader, nominator: g.lot.nominator, bids: g.lot.log.length },
    reveal: g.reveal, scores: scores(), myVote: g.votes[you] ?? null, voteCount: Object.keys(g.votes).length,
  };
  if (g.reveal) { const it = revealSeq()[g.reveal - 1]; v.g.cur = { rank: it + 1, name: g.items[it], owner: g.owner[it] ?? null, pts: pts(it) }; }
  if (r.phase === 'winner') v.g.awards = awards();
  return v;
}
function hostUpdate() {
  const r = H.room; if (!r) return;
  for (const c of H.conns.values()) send(c, makeView(pidIdx(c.peer)));
  render(makeView(hostIdx()));
}

/* =====================================================================
   CLIENT
   ===================================================================== */
const ME = { role: null, conn: null, peer: null, view: null, prev: null, recvAt: 0 };
function clientJoin(code, name) {
  status('Connecting…');
  const peer = new Peer();
  ME.peer = peer;
  peer.on('open', () => {
    const conn = peer.connect(ID_PREFIX + code, { reliable: true });
    ME.conn = conn;
    const t = setTimeout(() => { if (!ME.view) { status("Couldn't reach that room. Check the code."); peer.destroy(); } }, 10000);
    conn.on('open', () => { ME.role = 'client'; send(conn, { t: 'join', name }); });
    conn.on('data', m => { clearTimeout(t); onHostMsg(m); });
    conn.on('close', () => { if (ME.role === 'client') { toast('Disconnected from the host'); goHome(); } });
  });
  peer.on('error', e => { status(e.type === 'peer-unavailable' ? 'Room not found. Check the code.' : `Connection problem (${e.type}).`); });
}
function onHostMsg(m) {
  if (m.t === 'state') { ME.recvAt = Date.now(); if (!ME.view) status(''); render(m); }
  else if (m.t === 'event') onEvent(m);
  else if (m.t === 'fatal') { status(m.msg); toast(m.msg); leave(); }
}
function onEvent(ev) {
  if (ev.toast) toast(ev.toast);
  if (ev.sfx === 'reveal') sfx.reveal(ev.rank, ev.n); else if (ev.sfx && sfx[ev.sfx]) sfx[ev.sfx]();
  if (ev.confetti) confetti(Array.isArray(ev.confetti) ? ev.confetti : COLORS, Array.isArray(ev.confetti) ? 60 : 140);
}
// actions: host runs them directly, clients send them to the host
const act = {
  bid(to) { if (ME.role === 'host') doBid(hostIdx(), to, null); else send(ME.conn, { t: 'bid', to }); },
  nominate(tile) { if (ME.role === 'host') doNominate(-1, tile - 1, null); else send(ME.conn, { t: 'nominate', tile: tile - 1 }); },
  vote(target) { if (ME.role === 'host') doVote(hostIdx(), target, null); else send(ME.conn, { t: 'vote', target }); },
};
function leave() {
  const role = ME.role; ME.role = null;
  try { if (role === 'host') { H.peer.destroy(); H.room = null; H.conns.clear(); } else if (ME.peer) ME.peer.destroy(); } catch {}
  goHome();
}
function goHome() { ME.role = null; ME.view = null; ME.prev = null; document.body.classList.remove('is-host'); show('home'); }

/* =====================================================================
   RENDER (same for host and clients — driven only by the view)
   ===================================================================== */
const isHost = () => ME.role === 'host';
function render(v) {
  ME.prev = ME.view; ME.view = v;
  document.body.classList.toggle('is-host', isHost());
  show(v.phase);
  if (v.phase === 'lobby') renderLobby(v);
  else if (v.phase === 'auction') renderAuction(v);
  else if (v.phase === 'results') renderResults(v);
  else renderWinner(v);
}

/* ---------- lobby ---------- */
function renderLobby(v) {
  $('#roomCode').textContent = v.code;
  $('#pCount').textContent = `${v.players.length}/${MAX_PLAYERS}`;
  $('#lobbyPlayers').innerHTML = v.players.map((p, i) => `
    <div class="lp" style="--pc:${p.color}"><span class="sw"></span><span class="nm">${esc(p.name)}</span>
      ${p.host ? '<span class="tag">HOST</span>' : ''}${i === v.you ? '<span class="tag you">YOU</span>' : ''}
      ${isHost() && !p.host ? `<button class="kick" data-kick="${i}" title="Remove">✕</button>` : ''}</div>`).join('') ||
    '<p class="hint">Waiting for players. Share the room code!</p>';
  $('#spectators').textContent = v.spectators.length ? `👀 Watching: ${v.spectators.join(', ')}` : '';
  $('#hostPlaysLobby').checked = v.players.some(p => p.host);
  const s = v.settings;
  document.querySelectorAll('#rulesBox .seg').forEach(seg => {
    const k = seg.dataset.opt;
    seg.querySelectorAll('button').forEach(b => {
      const val = JSON.parse(b.dataset.val);
      b.classList.toggle('on', s[k] === val);
      b.disabled = !isHost() || (k === 'scoring' && val === 'rank' && !v.genre.ranked);
    });
  });
  const total = v.players.length * s.picks, tooFew = total > v.genre.count;
  $('#rulesHint').textContent = tooFew
    ? `⚠️ ${v.players.length} × ${s.picks} needs ${total} items, but this genre only has ${v.genre.count}. Lower the picks.`
    : `${v.players.length} players × ${s.picks} picks = ${total} items. Everyone gets £${s.budget}. ${s.blind ? 'Items pop up one at a time.' : 'All items are visible, and whoever opens the bidding chooses the item.'} ${s.timer ? `The timer resets to ${s.timer}s on every bid.` : 'The host presses SOLD.'}`;
  if (isHost()) {
    $('#genreGrid').hidden = false; $('#genreView').hidden = true;
    renderGenreGrid(s.genreId);
  } else {
    $('#genreGrid').hidden = true; $('#genreView').hidden = false;
    $('#genreView').innerHTML = `<div class="gcard on big-genre"><span class="ge">${esc(v.genre.emoji)}</span><span class="gn">${esc(v.genre.name)}</span><span class="gb">${v.genre.ranked ? 'Ranked by ' + esc(v.genre.basis) : 'Vote only'}</span></div><p class="hint">The host chooses the genre and rules.</p>`;
  }
  $('#startBtn').disabled = v.players.length < 2 || tooFew;
  $('#waitMsg').textContent = isHost() ? (v.players.length < 2 ? 'You need at least 2 players to start' : '') : 'Waiting for the host to start…';
}
function renderGenreGrid(sel) {
  $('#genreGrid').innerHTML = allGenres().map(g =>
    `<button class="gcard ${g.id === sel ? 'on' : ''}" data-g="${esc(g.id)}">
      ${g.custom ? `<span class="del" data-del="${esc(g.id)}" title="Delete">✕</span>` : ''}
      <span class="ge">${esc(g.emoji || '⭐')}</span><span class="gn">${esc(g.name)}</span>
      <span class="gb">${g.ranked ? 'Ranked by ' + esc(g.basis) : 'Vote only'}</span></button>`).join('') +
    `<button class="gcard" data-g="__random"><span class="ge">🎲</span><span class="gn">Surprise me</span><span class="gb">Random genre</span></button>
     <button class="gcard add" data-g="__add"><span class="ge">＋</span><span class="gn">Create your own</span></button>`;
}
function setSetting(k, val) {
  const s = H.room.settings; s[k] = val;
  if (k === 'genreId' && !findGenre(val).ranked) s.scoring = 'vote';
  store.set('hostSettings', s); hostUpdate();
}

/* ---------- auction ---------- */
let lastPickSeen = -1;
function teamHTML(v, i, animate) {
  const g = v.g, p = v.players[i], lot = g.lot;
  const slots = [];
  for (let k = 0; k < g.per; k++) {
    const it = g.teams[i][k];
    slots.push(it
      ? `<li class="slot filled ${it.last && animate ? 'new' : ''}"><span class="n">${k + 1}</span><span class="t">${esc(it.name)}</span><span class="pr">£${it.price}</span></li>`
      : `<li class="slot"><span class="n">${k + 1}</span></li>`);
  }
  const lead = lot && lot.leader === i && !g.done;
  return `<div class="team ${lead ? 'active' : ''} ${p.connected ? '' : 'offline'}" style="--pc:${p.color}">
    <div class="team-head"><span class="nm">${esc(p.name)}${i === v.you ? ' (you)' : ''}</span>${p.connected ? '' : '<span class="tok">offline</span>'}<span class="tok cash">£${g.budget[i]}</span></div>
    <ol class="slots">${slots.join('')}</ol></div>`;
}
function renderAuction(v) {
  const g = v.g, lot = g.lot, me = v.you;
  const prev = ME.prev && ME.prev.g;
  const animate = g.pick !== lastPickSeen;
  $('#aGenre').textContent = `${g.genre.emoji} ${g.genre.name}`;
  const half = Math.ceil(g.np / 2), idx = [...Array(g.np).keys()];
  $('#teamsLeft').innerHTML = idx.slice(0, half).map(i => teamHTML(v, i, animate)).join('');
  $('#teamsRight').innerHTML = idx.slice(half).map(i => teamHTML(v, i, animate)).join('');

  const tb = $('#turnBanner');
  if (g.done) { tb.style.setProperty('--pc', '#25F4EE'); tb.innerHTML = '<small>EVERY ITEM IS SOLD</small><b>AUCTION OVER</b>'; }
  else { const L = v.players[lot.leader]; tb.style.setProperty('--pc', L.color); tb.innerHTML = `<small>${lot.leader === me ? "YOU'RE WINNING" : 'HIGHEST BIDDER'} · £${lot.bid}</small><b>${esc(L.name)}</b>`; }
  $('#pickCount').textContent = g.done ? `${g.total}/${g.total}` : `Lot ${g.pick + 1}/${g.total}`;

  if (g.done) $('#lotBox').innerHTML = `<div class="lot done-lot"><div class="lot-main"><div class="lot-name">All ${g.total} items are sold!</div><small>${isHost() ? 'Click "Go to the reveal" when everyone is ready.' : 'Waiting for the host to start the reveal…'}</small></div></div>`;
  else {
    const L = v.players[lot.leader];
    $('#lotBox').innerHTML = `<div class="lot ${prev && prev.lot && prev.lot.bid !== lot.bid ? 'bump' : ''}" style="--pc:${L.color}">
      <div class="lot-main"><small>LOT ${g.pick + 1} OF ${g.total} · opened by ${esc(v.players[lot.nominator].name)}</small>
        <div class="lot-name">${esc(lot.name)}</div></div>
      <div class="lot-bid"><small>HIGH BID</small><b>£${lot.bid}</b><span>${esc(L.name)}</span></div></div>`;
  }

  const mb = $('#myBid');
  if (g.done) mb.innerHTML = '';
  else if (me < 0) mb.innerHTML = `<div class="mybid spectate">👀 You're watching. ${isHost() ? 'You run the auction with the buttons below.' : ''}</div>`;
  else {
    const max = g.maxBid[me], full = g.needs[me] <= 0, leading = lot.leader === me;
    const btn = a => { const to = lot.bid + a; return `<button class="btn bidbtn" data-to="${to}" ${full || leading || to > max ? 'disabled' : ''}>+£${a}<small>£${to}</small></button>`; };
    mb.innerHTML = `<div class="mybid ${leading ? 'leading' : ''}" style="--pc:${v.players[me].color}">
      <div class="mb-info"><b>£${g.budget[me]}</b><small>${full ? 'Team full' : `${g.needs[me]} slot${g.needs[me] > 1 ? 's' : ''} left · max bid £${max}`}</small></div>
      ${leading ? `<div class="mb-lead">🏆 You're winning at £${lot.bid}</div>` : full ? '<div class="mb-lead">Your team is full. Enjoy the show!</div>' : `<div class="mb-btns">${btn(1)}${btn(2)}${btn(5)}${btn(10)}</div>`}
    </div>`;
  }

  const board = $('#board'), n = g.total;
  const cols = n <= 20 ? 5 : n <= 30 ? 6 : n <= 35 ? 7 : 8;
  board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  board.style.gridTemplateRows = `repeat(${Math.ceil(n / cols)}, 1fr)`;
  const canNominate = !g.done && !g.blind && lot && lot.bids === 0 && (isHost() || lot.nominator === me);
  board.innerHTML = g.board.map(t => {
    if (t.owner != null) {
      const p = v.players[t.owner];
      return `<div class="tile taken ${t.last && animate ? 'flip' : ''}" style="--pc:${p.color}"><span class="num">${t.k}</span>${esc(t.name)}<span class="own">${esc(p.name)} · £${t.price}</span></div>`;
    }
    if (t.lot) return `<div class="tile lot-tile"><span class="num">${t.k}</span>${esc(t.name)}</div>`;
    if (t.name == null) return `<div class="tile blind"><span class="big">?</span></div>`;
    return `<button class="tile ${canNominate ? 'pickable' : ''}" data-k="${t.k}" ${canNominate ? '' : 'disabled'}><span class="num">${t.k}</span>${esc(t.name)}</button>`;
  }).join('');
  const left = g.total - g.pick - 1;
  $('#upNext').textContent = g.done ? '' : canNominate ? 'No bids yet, so you can click a different item to put up.'
    : `${left} item${left === 1 ? '' : 's'} left after this one · Space +£1 · 2 +£2 · 5 +£5 · 0 +£10`;

  $('#pauseBtn').hidden = !g.timer || g.done;
  $('#pauseBtn').textContent = g.paused ? '▶ Resume' : '⏸ Pause';
  $('#rerollBtn').disabled = g.done || (lot && lot.bids > 0);
  $('#soldBtn').hidden = g.done;
  $('#toResultsBtn').hidden = !g.done;
  $('#muteBtn').textContent = muted ? '🔇' : '🔊';
  lastPickSeen = g.pick;
  renderTimer();
}
let lastSecShown = -1;
function renderTimer() {
  const v = ME.view, el = $('#timer');
  if (!v || v.phase !== 'auction' || !v.g.timer || v.g.done || v.g.endsIn == null) { el.textContent = ''; return; }
  const ms = v.g.paused ? v.g.endsIn : v.g.endsIn - (Date.now() - ME.recvAt);
  const s = Math.max(0, Math.ceil(ms / 1000));
  el.textContent = v.g.paused ? '⏸' : s;
  el.classList.toggle('low', s <= 3 && !v.g.paused); el.classList.toggle('paused', v.g.paused);
  if (s !== lastSecShown) { if (s <= 3 && s > 0 && !v.g.paused) sfx.tick(); lastSecShown = s; }
}
setInterval(renderTimer, 200);

/* ---------- results ---------- */
function renderResults(v) {
  const g = v.g, vote = g.scoring === 'vote', sc = g.scores, max = Math.max(...sc);
  const cap = vote ? Math.max(1, max) : Array.from({ length: g.per }, (_, k) => g.total - k).reduce((a, b) => a + b, 0);
  const allIn = vote || g.reveal >= g.total;
  $('#resultsTitle').textContent = vote ? 'VOTE FOR THE BEST TEAM' : 'THE REVEAL';
  $('#resultsSub').textContent = vote
    ? `${g.genre.name}: click a team to vote. You can't vote for your own. ${g.voteCount}/${v.players.length} have voted.`
    : `${g.genre.name}, ranked by ${g.genre.basis}. #1 is worth ${g.total} pts and #${g.total} is worth 1.`;
  const sp = $('#spotlight'), cur = g.cur;
  if (vote) sp.innerHTML = `<span class="muted">🗳️ ${g.voteCount} vote${g.voteCount === 1 ? '' : 's'} in</span>`;
  else if (!cur) sp.innerHTML = `<span class="muted">Ranks are revealed from #${g.total} up to #1. ${isHost() ? 'Press <kbd>Space</kbd> to start.' : 'Waiting for the host…'}</span>`;
  else if (!ME.prev || !ME.prev.g || ME.prev.g.reveal !== g.reveal) {
    const p = cur.owner != null ? v.players[cur.owner] : null;
    sp.style.setProperty('--pc', p ? p.color : '#9a9ab3');
    sp.innerHTML = `<span class="rk">#${cur.rank}</span><div><div class="it">${esc(cur.name)}</div><div class="by">${p ? `${esc(p.name)} +${cur.pts}` : 'Nobody'}</div></div>`;
    sp.classList.remove('pop'); void sp.offsetWidth; sp.classList.add('pop');
  }
  const grid = $('#resultsGrid');
  grid.style.gridTemplateColumns = `repeat(${g.np > 6 ? Math.ceil(g.np / 2) : g.np}, 1fr)`;
  grid.innerHTML = v.players.map((p, i) => {
    const items = g.teams[i].map(it => `<li class="ritem ${it.rank ? 'rev' : ''} ${cur && it.rank === cur.rank ? 'now' : ''}"><span class="rb">${vote ? '•' : it.rank ? '#' + it.rank : '?'}</span><span class="t">${esc(it.name)}</span>${it.pts ? `<span class="pt">+${it.pts}</span>` : ''}<span class="pt">£${it.price}</span></li>`).join('');
    const lead = sc[i] === max && max > 0;
    const canVote = vote && v.you >= 0 && v.you !== i;
    return `<div class="rteam ${lead ? 'lead' : ''} ${g.myVote === i ? 'voted' : ''} ${canVote ? 'votable' : ''}" style="--pc:${p.color}" ${canVote ? `data-vote="${i}"` : ''}>
      <div class="head"><span class="nm">${lead ? '👑 ' : ''}${esc(p.name)}</span><span class="sc">${sc[i]}</span></div>
      <div class="bar"><i style="width:${(sc[i] / cap * 100).toFixed(1)}%"></i></div>
      <ol class="ritems">${items}</ol>
      ${vote ? `<div class="vote-tag">${g.myVote === i ? '✅ Your vote' : canVote ? 'Click to vote' : v.you === i ? 'Your team' : ''}</div>` : ''}
    </div>`;
  }).join('');
  $('#revealBtn').hidden = allIn; $('#revealAllBtn').hidden = allIn; $('#crownBtn').hidden = !allIn;
  $('#resultsWait').textContent = isHost() ? '' : 'The host controls the reveal';
}

/* ---------- winner ---------- */
function renderWinner(v) {
  const g = v.g, sc = g.scores, max = Math.max(...sc);
  const winners = v.players.map((_, i) => i).filter(i => sc[i] === max);
  const ranked = v.players.map((_, i) => i).sort((a, b) => sc[b] - sc[a]);
  const w = v.players[winners[0]];
  $('#winnerKicker').textContent = winners.length > 1 ? "IT'S A TIE!" : `${g.genre.emoji} ${g.genre.name.toUpperCase()} CHAMPION`;
  $('#winnerName').style.setProperty('--pc', winners.length > 1 ? '#fff' : w.color);
  $('#winnerName').textContent = winners.map(i => v.players[i].name).join(' & ');
  const heights = [100, 80, 64, 52, 42, 34, 28, 22];
  let place = 0;
  $('#podium').innerHTML = ranked.map((pi, k) => {
    if (k && sc[pi] < sc[ranked[k - 1]]) place = k;
    const p = v.players[pi];
    return `<div class="pod" style="--pc:${p.color};height:${heights[place] * 2}px;animation-delay:${(g.np - 1 - k) * .12}s"><span class="pl">${['🥇', '🥈', '🥉'][place] || place + 1 + 'th'}</span><span class="pn">${esc(p.name)}</span><span class="ps">${sc[pi]} ${g.scoring === 'vote' ? 'votes' : 'pts'}</span></div>`;
  }).join('');
  $('#awards').innerHTML = (g.awards || []).map(a => { const p = v.players[a.owner]; return `<div class="award" style="border-color:${p.color}"><small>${a.label}</small><div>${esc(a.name)} (#${a.rank})</div><span style="color:${p.color}">${esc(p.name)} paid £${a.price}</span></div>`; }).join('');
  $('#winnerWait').textContent = isHost() ? '' : 'Waiting for the host…';
  if (!ME.prev || ME.prev.phase !== 'winner') { sfx.win(); confetti(winners.map(i => v.players[i].color).concat('#ffffff'), 320); }
}

/* =====================================================================
   UI wiring
   ===================================================================== */
function status(msg) { $('#homeStatus').textContent = msg; }
$('#myName').value = store.get('myname', '');
const qsRoom = new URLSearchParams(location.search).get('room');
if (qsRoom) $('#joinCode').value = qsRoom.toUpperCase();
function myName() {
  const n = $('#myName').value.trim().slice(0, 16);
  if (!n) { $('#myName').focus(); status('Enter your name first'); return null; }
  store.set('myname', n); return n;
}
const noPeer = () => typeof Peer === 'undefined' && (status("Couldn't load the networking library. Check your internet connection."), true);
$('#hostBtn').onclick = () => { if (noPeer()) return; const n = myName(); if (n) hostCreate(n, $('#hostPlays').checked); };
$('#joinBtn').onclick = () => {
  if (noPeer()) return;
  const n = myName(); if (!n) return;
  const code = $('#joinCode').value.trim().toUpperCase();
  if (code.length !== 5) return status('Room codes are 5 characters');
  clientJoin(code, n);
};
$('#joinCode').addEventListener('keydown', e => { if (e.key === 'Enter') $('#joinBtn').click(); });
$('#leaveBtn').onclick = () => { if (!isHost() || confirm('Close the room for everyone?')) leave(); };
$('#copyLink').onclick = () => {
  const web = location.protocol.startsWith('http');
  const url = web ? `${location.origin}${location.pathname}?room=${ME.view.code}` : ME.view.code;
  (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast(web ? 'Invite link copied!' : 'Room code copied!'), () => toast(url));
};

// lobby (host)
$('#rulesBox').addEventListener('click', e => {
  const b = e.target.closest('.seg button'); if (!b || b.disabled || !isHost()) return;
  setSetting(b.closest('.seg').dataset.opt, JSON.parse(b.dataset.val));
});
$('#genreGrid').addEventListener('click', e => {
  if (!isHost()) return;
  const del = e.target.closest('[data-del]');
  if (del) {
    e.stopPropagation();
    custom = custom.filter(g => g.id !== del.dataset.del); store.set('custom', custom);
    if (H.room.settings.genreId === del.dataset.del) setSetting('genreId', 'nba'); else hostUpdate();
    return;
  }
  const c = e.target.closest('[data-g]'); if (!c) return;
  let id = c.dataset.g;
  if (id === '__add') return openModal('#customModal');
  if (id === '__random') { const l = allGenres(); id = l[Math.random() * l.length | 0].id; hostEvent({ toast: `🎲 ${findGenre(id).name}!` }); }
  setSetting('genreId', id);
});
$('#lobbyPlayers').addEventListener('click', e => {
  const k = e.target.closest('[data-kick]'); if (!k || !isHost()) return;
  const p = H.room.players[+k.dataset.kick]; const c = H.conns.get(p.pid);
  if (c) { send(c, { t: 'fatal', msg: 'The host removed you from the room' }); H.conns.delete(p.pid); setTimeout(() => c.close(), 300); }
  H.room.players.splice(+k.dataset.kick, 1); hostUpdate();
});
$('#shuffleOrder').onclick = () => { shuffle(H.room.players); hostEvent({ toast: '🎲 Order shuffled' }); hostUpdate(); };
$('#hostPlaysLobby').onchange = e => {
  const i = hostIdx();
  if (e.target.checked && i < 0) { if (H.room.players.length >= MAX_PLAYERS) { e.target.checked = false; return toast('The room is full'); } addPlayer('host', store.get('myname', 'Host')); }
  else if (!e.target.checked && i >= 0) H.room.players.splice(i, 1);
  hostUpdate();
};
$('#startBtn').onclick = () => hostStart();

// auction
$('#myBid').addEventListener('click', e => { const b = e.target.closest('[data-to]'); if (b && !b.disabled) act.bid(+b.dataset.to); });
$('#board').addEventListener('click', e => { const t = e.target.closest('.tile.pickable'); if (t) act.nominate(+t.dataset.k); });
$('#soldBtn').onclick = () => sell();
$('#undoBtn').onclick = undo;
$('#pauseBtn').onclick = togglePause;
$('#rerollBtn').onclick = reroll;
$('#endBtn').onclick = () => { if (confirm('End this game and go back to the lobby?')) { H.room.phase = 'lobby'; H.room.g = null; H.room.players = H.room.players.filter(p => p.connected); hostUpdate(); } };
$('#toResultsBtn').onclick = () => { H.room.phase = 'results'; hostUpdate(); };

// results / winner
$('#resultsGrid').addEventListener('click', e => { const t = e.target.closest('[data-vote]'); if (t) act.vote(+t.dataset.vote); });
$('#revealBtn').onclick = revealNext;
$('#revealAllBtn').onclick = () => { G().reveal = G().total; hostEvent({ sfx: 'reveal', rank: 1, n: G().total }); hostUpdate(); };
$('#crownBtn').onclick = () => { H.room.phase = 'winner'; hostUpdate(); };
$('#lobbyBtn').onclick = () => {
  const r = H.room, sc = scores();
  // last place goes first next time; drop anyone who left
  r.players = r.players.map((p, i) => ({ p, s: sc[i] })).sort((a, b) => a.s - b.s).map(o => o.p).filter(p => p.connected);
  r.phase = 'lobby'; r.g = null; hostUpdate();
};

// custom genre modal
function openModal(sel) { $(sel).hidden = false; }
function closeModals() { document.querySelectorAll('.modal').forEach(m => m.hidden = true); }
document.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModals);
document.querySelectorAll('[data-help]').forEach(b => b.onclick = () => openModal('#helpModal'));
document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) closeModals(); }));
const cLines = () => $('#cItems').value.split('\n').map(s => s.trim()).filter(Boolean);
$('#cItems').addEventListener('input', () => { const n = cLines().length; $('#cCount').textContent = `${n} items` + (n < 20 ? ' (need at least 20)' : ''); });
$('#cSave').onclick = () => {
  const items = cLines(), name = $('#cName').value.trim();
  if (!name) return toast('Give it a name');
  if (items.length < 20) return toast(`Need at least 20 items (have ${items.length})`);
  if (new Set(items).size !== items.length) return toast('Remove duplicate items');
  const g = { id: 'c_' + Date.now(), name, emoji: $('#cEmoji').value.trim() || '⭐', items, ranked: $('#cRanked').checked, custom: true, basis: $('#cBasis').value.trim() || 'your list' };
  custom.push(g); store.set('custom', custom);
  closeModals(); ['#cName', '#cEmoji', '#cItems', '#cBasis'].forEach(s => $(s).value = ''); $('#cRanked').checked = false;
  setSetting('genreId', g.id); toast('Genre saved!');
};

// global keys
function toggleMute() { muted = !muted; store.set('muted', muted); $('#muteBtn').textContent = muted ? '🔇' : '🔊'; toast(muted ? '🔇 Muted' : '🔊 Sound on'); }
function toggleFs() { if (document.fullscreenElement) document.exitFullscreen(); else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {}); }
$('#muteBtn').onclick = toggleMute;
$('#fsBtn').onclick = toggleFs;
document.addEventListener('keydown', e => {
  if (e.target.matches('input,textarea')) { if (e.key === 'Escape') closeModals(); return; }
  const v = ME.view, k = e.key.toLowerCase();
  if (k === 'escape') return closeModals();
  if (k === 'm') return toggleMute();
  if (k === 'f') return toggleFs();
  if (!v) return;
  if (v.phase === 'auction' && v.g.lot && !v.g.done) {
    const amt = { ' ': 1, '1': 1, '2': 2, '5': 5, '0': 10 }[k];
    if (amt && v.you >= 0) { e.preventDefault(); const b = document.querySelector(`#myBid [data-to="${v.g.lot.bid + amt}"]`); if (b && !b.disabled) act.bid(v.g.lot.bid + amt); return; }
    if (isHost()) {
      if (k === 'enter') { e.preventDefault(); sell(); }
      else if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); undo(); }
      else if (k === 'p') togglePause();
    }
  } else if (v.phase === 'results' && isHost() && (k === ' ' || k === 'enter')) {
    e.preventDefault();
    if (v.g.scoring === 'rank' && v.g.reveal < v.g.total) revealNext(); else $('#crownBtn').click();
  }
});
addEventListener('resize', () => { cv.width = innerWidth; cv.height = innerHeight; });
addEventListener('beforeunload', e => { if (ME.role === 'host' && H.room && H.room.phase !== 'lobby') { e.preventDefault(); e.returnValue = ''; } });
})();
