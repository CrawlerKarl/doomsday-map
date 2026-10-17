/* Doomsday prep map — a pannable, zoomable timeline of everything that leads into
   Avengers: Doomsday. Vector zoom (the SVG viewBox moves, so it stays crisp), edges
   bundled per lane, labels that keep a readable size at any zoom. Mounted by tracker.js. */
(function () {
  'use strict';
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var W = 3400, H = 1180, LEFT = 400, RIGHT = 120, TOP = 70, LANE_H = 150;
  var LANE_SHORT = { premcu: 'Before the MCU', xmen: 'X-Men (Fox)', spidey: 'Spider-Man', core: 'Avengers films', newavengers: 'Cap → New Avengers', cosmic: 'Cosmic', multiverse: 'Multiverse & TVA', ff: 'Fantastic Four & Doom', wakanda: 'Wakanda & Namor', street: 'Street level', tv: 'Marvel TV' };
  var R = { target: 46, essential: 36, recommended: 28, background: 20, catalog: 15, future: 26 };
  // short map labels; the full title is in the panel
  var SHORT = { mom: 'Multiverse of Madness', nwh: 'Spider-Man: No Way Home', bnw: 'Cap: Brave New World', ff: 'Fantastic Four', tbolts: 'Thunderbolts*',
    shangchi: 'Shang-Chi', wf: 'Wakanda Forever', quantumania: 'Quantumania', dofp: 'Days of Future Past', x3: 'X-Men: The Last Stand',
    iw: 'Infinity War', endgame: 'Endgame', thor4: 'Thor: Love and Thunder', civilwar: 'Civil War', fatws: 'Falcon & Winter Soldier',
    bnd: 'Spider-Man: Brand New Day', secretwars: 'Secret Wars (2027)', doomsday: 'Avengers: Doomsday', loki1: 'Loki S1', loki2: 'Loki S2',
    apoc: 'X-Men: Apocalypse', phoenix: 'Dark Phoenix', dpw: 'Deadpool & Wolverine', ddba: 'Daredevil: Born Again', whatif: 'What If…?',
    agatha: 'Agatha All Along', msmarvel: 'Ms. Marvel', ironheart: 'Ironheart', hawkeye: 'Hawkeye', bw: 'Black Widow', marvels: 'The Marvels',
    wanda: 'WandaVision', eternals: 'Eternals', x2: 'X2', xmen1: 'X-Men', ironman: 'Iron Man', avengers1: 'The Avengers',
    tws: 'The Winter Soldier', ragnarok: 'Thor: Ragnarok', captfirst: 'Cap: The First Avenger', origins: 'Origins: Wolverine',
    xfirstclass: 'X-Men: First Class', wolverine13: 'The Wolverine', agentsshield: 'Agents of S.H.I.E.L.D.', asm1: 'Amazing Spider-Man',
    asm2: 'Amazing Spider-Man 2', gotg1: 'Guardians Vol. 1', gotg2: 'Guardians Vol. 2', gotg3: 'Guardians Vol. 3', gotgholiday: 'Guardians Holiday Special',
    ultron: 'Age of Ultron', spiderverse: 'Into the Spider-Verse', spiderverse2: 'Across the Spider-Verse', shehulk: 'She-Hulk',
    werewolf: 'Werewolf by Night', secretinvasion: 'Secret Invasion', yfnsm: 'Friendly Neighborhood Spider-Man', ff05: 'Fantastic Four (2005)',
    ff07: 'FF: Rise of the Silver Surfer', ff15: 'Fantastic Four (2015)', ghostrider2: 'Ghost Rider 2', punisher08: 'Punisher: War Zone',
    spiderman1: 'Spider-Man (2002)', spiderman2: 'Spider-Man 2', spiderman3: 'Spider-Man 3', hulk03: 'Hulk (2003)', hulk08: 'The Incredible Hulk',
    daredevil03: 'Daredevil (2003)', punisher04: 'The Punisher (2004)', cloakdagger: 'Cloak & Dagger', blade3: 'Blade: Trinity',
    drstrange: 'Doctor Strange', captmarvel: 'Captain Marvel', blackpanther: 'Black Panther', homecoming: 'Spider-Man: Homecoming',
    ffh: 'Far From Home', moonknight: 'Moon Knight', newmutants: 'The New Mutants', antman1: 'Ant-Man', antman2: 'Ant-Man and the Wasp',
    deadpool1: 'Deadpool', deadpool2: 'Deadpool 2', xmen97: "X-Men '97", visionquest: 'VisionQuest', wonderman: 'Wonder Man',
    eyeswakanda: 'Eyes of Wakanda', zombies: 'Marvel Zombies', ironman2: 'Iron Man 2', ironman3: 'Iron Man 3', thor1: 'Thor',
    thor2: 'Thor: The Dark World', jessicajones: 'Jessica Jones', lukecage: 'Luke Cage', ironfist: 'Iron Fist', defenders: 'The Defenders',
    punisher: 'The Punisher', inhumans: 'Inhumans', runaways: 'Runaways', helstrom: 'Helstrom', agentcarter: 'Agent Carter', echo: 'Echo',
    madameweb: 'Madame Web', kraven: 'Kraven the Hunter', venom: 'Venom', venom2: 'Venom 2', venom3: 'Venom: The Last Dance',
    morbius: 'Morbius', elektra: 'Elektra', ghostrider: 'Ghost Rider', blade: 'Blade', blade2: 'Blade II', logan: 'Logan',
    ironheart: 'Ironheart', ddba: 'Daredevil: Born Again', daredevil: 'Daredevil (2015)' };
  var root = null, data = null, view = { x: 0, y: 0, k: 1 }, dragging = null, pinch = null, selected = null, anim = null;
  var STATIC = !!window.DM_STATIC, DATA_URL = STATIC ? 'doomsday.json' : '/doomsday.json';
  function localState() { try { return JSON.parse(localStorage.getItem('dm_state') || '{"seen":{},"queue":{}}'); } catch (e) { return { seen: {}, queue: {} }; } }
  function saveLocalState(st) { try { localStorage.setItem('dm_state', JSON.stringify(st)); } catch (e) {} }
  function applyLocal(j) {
    // the shared site carries no personal marks; each visitor's seen/queue come from their browser
    if (!STATIC) return j;
    var st = localState(), ORDER = { target: 0, essential: 1, recommended: 2, background: 3, catalog: 4, future: 5 };
    j.nodes.forEach(function (n) { n.seen = !!st.seen[n.id]; n.seen_source = n.seen ? 'you' : ''; n.queued = !!st.queue[n.id]; n.on_your_list = false; n.list_bucket = ''; });
    var ess = j.nodes.filter(function (n) { return n.tier === 'essential'; });
    var prep = j.nodes.filter(function (n) { return n.tier === 'essential' || n.tier === 'recommended'; }).sort(function (a, b) { return (ORDER[a.tier] - ORDER[b.tier]) || (a.date || '9999').localeCompare(b.date || '9999'); });
    var q = j.nodes.filter(function (n) { return n.queued; });
    j.prep_order = prep.map(function (n) { return n.id; }); j.queue_order = q.map(function (n) { return n.id; });
    j.stats = { essential: ess.length, essential_unseen: ess.filter(function (n) { return !n.seen; }).length,
      prep_minutes_left: prep.filter(function (n) { return !n.seen; }).reduce(function (a, n) { return a + (n.runtime || 0); }, 0),
      seen: j.nodes.filter(function (n) { return n.seen && n.tier !== 'target' && n.tier !== 'future'; }).length,
      queued: q.length, queue_minutes: q.reduce(function (a, n) { return a + (n.runtime || 0); }, 0), total: j.nodes.length };
    return j;
  }
  var mode = 'map', filt = { tiers: {}, lanes: {}, hideSeen: false, queuedOnly: false };
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  (function () { try { var f = JSON.parse(store('dm_filters') || 'null'); if (f) filt = f; } catch (e) {} var m = store('dm_mode'); if (m === 'list') mode = 'list'; })();
  function saveFilt() { store('dm_filters', JSON.stringify(filt)); }
  function tiersOn() { return Object.keys(filt.tiers).filter(function (k) { return filt.tiers[k]; }); }
  function lanesOn() { return Object.keys(filt.lanes || {}).filter(function (k) { return filt.lanes[k]; }); }
  function passes(n) {
    if (n.tier === 'target' || n.tier === 'future') return !filt.queuedOnly && !(filt.hideSeen && n.seen) || n.tier === 'target';
    var ts = tiersOn(); if (ts.length && ts.indexOf(n.tier) < 0) return false;
    var ls = lanesOn(); if (ls.length && ls.indexOf(n.lane) < 0) return false;
    if (filt.hideSeen && n.seen) return false;
    if (filt.queuedOnly && !n.queued) return false;
    return true;
  }
  function anyFilter() { return tiersOn().length > 0 || lanesOn().length > 0 || filt.hideSeen || filt.queuedOnly; }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function mins(n) { if (!n) return ''; return n >= 60 ? Math.floor(n / 60) + ' h ' + (n % 60 ? (n % 60) + ' min' : '') : n + ' min'; }
  function fmt(iso) { if (!iso) return 'date TBA'; var p = iso.split('-'); return MONTHS[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0]; }
  function haptic() { try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {} }
  function byId(id) { for (var i = 0; i < data.nodes.length; i++) if (data.nodes[i].id === id) return data.nodes[i]; return null; }

  // ---- layout -------------------------------------------------------------
  function xOf(iso) {
    if (!iso) return W - RIGHT - 40;
    var p = iso.split('-'), t = +p[0] + (+p[1] - 1) / 12 + (+p[2] - 1) / 365;
    var a = LEFT + 40, b = LEFT + 420, c = W - RIGHT - 60;
    if (t <= 2008.3) return a + (t - 1998) / 10.3 * (b - a);
    return b + (t - 2008.3) / (2028 - 2008.3) * (c - b);
  }
  var laneY = {};
  function layout() {
    H = TOP + 80 + data.lanes.length * LANE_H + 90;
    data.lanes.forEach(function (l, i) { laneY[l.id] = TOP + 80 + i * LANE_H; });
    data.nodes.forEach(function (n) { n.x = n.x0 = xOf(n.date); n.y = n.y0 = laneY[n.lane] || TOP + 80; n.r = R[n.tier] || 22; n.labelUp = false; });
    var t = byId('doomsday'); if (t) { t.x = t.x0 = W - RIGHT - 70; t.y = t.y0 = laneY.ff; }
    var sw = byId('secretwars'); if (sw) { sw.x = sw.x0 = W - RIGHT + 40; sw.y = sw.y0 = laneY.ff + 120; }
    // relaxation: push overlapping neighbours apart, mostly up/down, staying near their date and lane
    var movable = data.nodes.filter(function (n) { return n.id !== 'doomsday' && n.id !== 'secretwars'; });
    for (var it = 0; it < 24; it++) {
      var moved = false;
      for (var i = 0; i < movable.length; i++) for (var j = i + 1; j < movable.length; j++) {
        var a = movable[i], b = movable[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01;
        var minD = (a.r + b.r) * 1.3 + 48;
        if (d >= minD) continue;
        moved = true;
        var push = (minD - d) / 2, ux = dx / d, uy = dy / d;
        if (Math.abs(dy) < 1) { uy = (a.y0 <= b.y0 ? 1 : -1); ux = 0.35 * (dx >= 0 ? 1 : -1); }  // same height: separate vertically
        a.x -= ux * push * 0.5; a.y -= uy * push; b.x += ux * push * 0.5; b.y += uy * push;
      }
      movable.forEach(function (n) {  // keep within reach of the date and the lane band
        n.x = Math.max(n.x0 - 64, Math.min(n.x0 + 64, n.x));
        n.y = Math.max(n.y0 - 70, Math.min(n.y0 + 70, n.y));
      });
      if (!moved) break;
    }
  }
  function edgePath(n, t) {
    // bundle: every lane funnels into one trunk before the last run into Doomsday
    var fx = t.x - 420, fy = (laneY[n.lane] || n.y) + (n.lane === 'ff' ? -40 : 0);
    if (n.x > fx - 80) {  // already next to the funnel: go straight in, no hairpin
      return 'M' + n.x + ',' + n.y + ' C' + (n.x + (t.x - n.x) * 0.5) + ',' + n.y + ' ' + (t.x - (t.x - n.x) * 0.3) + ',' + t.y + ' ' + (t.x - t.r - 2) + ',' + t.y;
    }
    var c1x = n.x + Math.max(80, (fx - n.x) * 0.45), c2x = fx - 110;
    return 'M' + n.x + ',' + n.y + ' C' + c1x + ',' + n.y + ' ' + c2x + ',' + fy + ' ' + fx + ',' + fy +
      ' C' + (fx + 150) + ',' + fy + ' ' + (t.x - 180) + ',' + t.y + ' ' + (t.x - t.r - 2) + ',' + t.y;
  }

  // ---- svg ------------------------------------------------------------------
  function svg() {
    layout();
    var t = byId('doomsday'), h = '';
    h += '<svg class="dmap-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">';
    h += '<defs><filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="10" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<radialGradient id="bg" cx="80%" cy="45%" r="70%"><stop offset="0" stop-color="#2a1a05" stop-opacity=".9"/><stop offset=".5" stop-color="#0f1620"/><stop offset="1" stop-color="#070a0f"/></radialGradient>' +
      '<linearGradient id="edge-essential" x1="0" x2="1"><stop offset="0" stop-color="#ffcc33" stop-opacity=".25"/><stop offset="1" stop-color="#ffcc33" stop-opacity=".95"/></linearGradient>' +
      '<linearGradient id="edge-recommended" x1="0" x2="1"><stop offset="0" stop-color="#5aa9ff" stop-opacity=".18"/><stop offset="1" stop-color="#5aa9ff" stop-opacity=".8"/></linearGradient>' +
      '<linearGradient id="edge-background" x1="0" x2="1"><stop offset="0" stop-color="#8a95a3" stop-opacity=".08"/><stop offset="1" stop-color="#8a95a3" stop-opacity=".4"/></linearGradient>';
    data.nodes.forEach(function (n) { h += '<clipPath id="clip-' + n.id + '"><circle cx="0" cy="0" r="' + (n.r - 3) + '"/></clipPath>'; });
    h += '</defs>';
    h += '<rect x="-4000" y="-4000" width="12000" height="12000" fill="#070a0f"/><rect width="' + W + '" height="' + H + '" fill="url(#bg)"/>';
    var seed = 7; for (var i = 0; i < 160; i++) { seed = (seed * 9301 + 49297) % 233280; var sx = seed / 233280 * W; seed = (seed * 9301 + 49297) % 233280; var sy = seed / 233280 * H; seed = (seed * 9301 + 49297) % 233280; h += '<circle cx="' + sx.toFixed(0) + '" cy="' + sy.toFixed(0) + '" r="' + (0.6 + seed / 233280 * 1.6).toFixed(1) + '" fill="#fff" opacity="' + (0.15 + seed / 233280 * 0.5).toFixed(2) + '"/>'; }
    for (var y = 1998; y <= 2027; y += (y < 2008 ? 5 : 1)) { var ax = xOf(y + '-01-01'); h += '<line x1="' + ax + '" y1="' + (TOP + 30) + '" x2="' + ax + '" y2="' + (H - 40) + '" class="dm-grid"/><text x="' + ax + '" y="' + (H - 18) + '" class="dm-year" text-anchor="middle">' + y + '</text>'; }
    data.lanes.forEach(function (l) { var ly = laneY[l.id]; h += '<line x1="' + LEFT + '" y1="' + ly + '" x2="' + (W - RIGHT) + '" y2="' + ly + '" class="dm-lanel"/><text x="' + (LEFT - 14) + '" y="' + (ly - 6) + '" class="dm-lane" text-anchor="end">' + esc(LANE_SHORT[l.id] || l.label) + '</text><text x="' + (LEFT - 14) + '" y="' + (ly + 14) + '" class="dm-lane-note" text-anchor="end">' + esc(l.note) + '</text>'; });
    // edges, background first so the important ones draw on top
    data.lanes.forEach(function (l) {  // chronology within each lane for the rest of the catalogue
      var arr = data.nodes.filter(function (n) { return n.lane === l.id && passes(n) && n.id !== 'doomsday' && n.id !== 'secretwars'; }).sort(function (a, b) { return a.x - b.x; });
      for (var i = 1; i < arr.length; i++) h += '<line class="dm-chain" x1="' + arr[i - 1].x + '" y1="' + arr[i - 1].y + '" x2="' + arr[i].x + '" y2="' + arr[i].y + '"/>';
    });
    var order = { background: 0, recommended: 1, essential: 2 };
    if (t) data.nodes.slice().sort(function (a, b) { return (order[a.tier] || 0) - (order[b.tier] || 0); }).forEach(function (n) {
      if (n.id === 'doomsday' || n.tier === 'future' || n.tier === 'catalog') return;
      h += '<path class="dm-edge ' + n.tier + (passes(n) ? '' : ' off') + '" data-for="' + n.id + '" d="' + edgePath(n, t) + '" fill="none" stroke="url(#edge-' + n.tier + ')"/>';
    });
    var sw = byId('secretwars'); if (t && sw) h += '<path class="dm-edge future" d="M' + (t.x + t.r) + ',' + t.y + ' Q' + ((t.x + sw.x) / 2) + ',' + sw.y + ' ' + (sw.x - sw.r) + ',' + sw.y + '" fill="none"/>';
    data.nodes.forEach(function (n) {
      var cls = 'dm-node ' + n.tier + (n.seen ? ' seen' : '') + (n.queued ? ' queued' : '') + (selected === n.id ? ' on' : '') + (passes(n) ? '' : ' off') + (n.crowded ? ' crowded' : '');
      h += '<g class="' + cls + '" data-node="' + n.id + '" transform="translate(' + n.x + ',' + n.y + ')"><g class="dm-s">';
      if (n.tier === 'target') h += '<circle r="' + (n.r + 26) + '" class="dm-halo"/><circle r="' + (n.r + 12) + '" class="dm-halo2"/>';
      if (n.queued) h += '<circle r="' + (n.r + 11) + '" class="dm-qring"/>';
      h += '<circle r="' + (n.r + 4) + '" class="dm-ring"/><circle r="' + (n.r - 3) + '" fill="#1b232c"/>';
      if (n.poster_url) h += '<image href="' + esc(n.poster_url) + '" x="' + (-n.r) + '" y="' + (-n.r * 1.35) + '" width="' + (n.r * 2) + '" height="' + (n.r * 3) + '" clip-path="url(#clip-' + n.id + ')" preserveAspectRatio="xMidYMid slice"/>';
      if (n.seen) h += '<g transform="translate(' + (n.r * 0.72) + ',' + (-n.r * 0.72) + ')"><circle r="11" class="dm-check"/><text y="4" text-anchor="middle" class="dm-check-t">✓</text></g>';
      if (n.queued) h += '<g transform="translate(' + (-n.r * 0.72) + ',' + (-n.r * 0.72) + ')"><circle r="11" class="dm-qmark"/><text y="4" text-anchor="middle" class="dm-check-t">★</text></g>';
      var label = SHORT[n.id] || (n.title.length > 30 ? n.title.slice(0, 29) + '…' : n.title);
      h += '<text y="' + (n.r + 20) + '" text-anchor="middle" class="dm-label">' + esc(label) + '</text>';
      h += '<text y="' + (n.r + 36) + '" text-anchor="middle" class="dm-sub">' + esc(n.year || '') + (n.media_type === 'tv' ? ' · series' : '') + (n.runtime ? ' · ' + esc(mins(n.runtime)) : '') + '</text>';
      h += '</g></g>';
    });
    h += '</svg>';
    return h;
  }

  // ---- chrome ---------------------------------------------------------------
  function legend() {
    var tiers = ['target', 'essential', 'recommended', 'background', 'catalog', 'future'];
    return '<div class="dm-legend">' + tiers.map(function (k) { var t = data.tiers[k]; return '<span class="dm-lg ' + k + '"><i></i>' + esc(t.label) + '</span>'; }).join('') + '<span class="dm-lg seen"><i>✓</i>seen (dimmed poster)</span><span class="dm-lg queued"><i>★</i>in your queue</span></div>';
  }
  function stats() {
    var s = data.stats || {};
    return '<div class="dm-stats"><div><b>' + s.essential_unseen + '</b> of ' + s.essential + ' must-watch left</div><div><b>' + mins(s.prep_minutes_left) + '</b> of prep to go</div><div><b>' + (s.total || data.nodes.length) + '</b> titles mapped</div>' +
      (s.queued ? '<div><b>' + s.queued + '</b> queued · ' + mins(s.queue_minutes) + '</div>' : '') + '</div>';
  }
  function chip(label, on, attr) { return '<button class="fchip' + (on ? ' on' : '') + '" ' + attr + '>' + label + '</button>'; }
  function filtersHtml() {
    var ts = filt.tiers;
    return '<div class="dm-filters">' +
      chip('All', !anyFilter(), 'data-dmf="all"') +
      chip('Must watch', !!ts.essential, 'data-dmf="tier:essential"') +
      chip('Worth watching', !!ts.recommended, 'data-dmf="tier:recommended"') +
      chip('Only if curious', !!ts.background, 'data-dmf="tier:background"') +
      chip('Everything else', !!ts.catalog, 'data-dmf="tier:catalog"') +
      '<span class="dm-fsep"></span>' +
      chip('Hide seen', filt.hideSeen, 'data-dmf="hideSeen"') +
      chip('★ Queued only', filt.queuedOnly, 'data-dmf="queuedOnly"') + '</div>' +
      '<div class="dm-filters lanes">' + chip('All universes', !lanesOn().length, 'data-dmf="lanes:all"') + data.lanes.map(function (l) { return chip(l.label.replace('Marvel Television (ABC, Hulu)', 'Marvel TV').replace('Captain America → New Avengers', 'Cap → New Avengers').replace('Marvel before the MCU', 'Pre-MCU').replace(' (Fox era)', ''), !!(filt.lanes || {})[l.id], 'data-dmf="lane:' + l.id + '"'); }).join('') + '</div>';
  }
  function modeHtml() {
    return '<div class="seg dm-mode"><button data-dm-mode="map" class="' + (mode === 'map' ? 'on' : '') + '">Map</button><button data-dm-mode="list" class="' + (mode === 'list' ? 'on' : '') + '">List</button></div>';
  }
  function seenPill(n) {
    if (n.tier === 'target' || n.tier === 'future') return '';
    return n.seen ? '<span class="dm-seen on">✓ seen</span>' : '<span class="dm-seen">not seen</span>';
  }
  function listRow(n) {
    var tier = data.tiers[n.tier] || {}, dots = (n.services || []).map(function (s) { return '<i class="' + esc(s.id) + '" title="' + esc(s.label) + '"></i>'; }).join('');
    return '<div class="dm-row' + (n.seen ? ' seen' : '') + (n.queued ? ' queued' : '') + '" data-dm-rowopen="' + n.id + '">' +
      (n.poster_url ? '<img src="' + esc(n.poster_url) + '" alt="" loading="lazy">' : '<span class="ph"></span>') +
      '<div class="t"><div class="tt">' + esc(n.title) + '</div><div class="s"><span class="dm-tier ' + n.tier + '">' + esc(tier.label || n.tier) + '</span>' + seenPill(n) + ' ' + esc(n.year || '') + (n.runtime ? ' · ' + mins(n.runtime) : '') + (n.episodes ? ' · ' + n.episodes + ' ep' : '') + (dots ? ' <span class="sdots">' + dots + '</span>' : '') + '</div></div>' +
      (n.tier === 'target' || n.tier === 'future' ? '' : '<button class="dm-tgl' + (n.seen ? ' on' : '') + '" data-dm-toggle="' + n.id + '" title="Seen it">✓</button><button class="dm-tgl star' + (n.queued ? ' on' : '') + '" data-dm-queue="' + n.id + '" title="Watch before Doomsday">★</button>') +
      '</div>';
  }
  function listHtml() {
    var nodes = data.nodes.filter(passes), h = '', byDate = function (a, b) { return (a.date || '9999').localeCompare(b.date || '9999'); };
    var q = nodes.filter(function (n) { return n.queued && n.tier !== 'target' && n.tier !== 'future'; }).sort(byDate);
    if (q.length) {
      var qm = q.reduce(function (a, n) { return a + (n.runtime || 0); }, 0);
      h += '<h3 class="dm-lh">★ Your Doomsday queue <span>' + q.length + ' · ' + mins(qm) + '</span></h3><div class="dm-list">' + q.map(listRow).join('') + '</div>';
    }
    [['essential', 'Must watch'], ['recommended', 'Worth watching'], ['background', 'Only if curious'], ['catalog', 'Everything else']].forEach(function (tr) {
      var l = nodes.filter(function (n) { return n.tier === tr[0]; }).sort(byDate); if (!l.length) return;
      var left = l.filter(function (n) { return !n.seen; }).reduce(function (a, n) { return a + (n.runtime || 0); }, 0);
      if (tr[0] === 'catalog') h += '<details class="dm-cat"><summary class="dm-lh">' + tr[1] + ' <span>' + l.length + ' titles · tap to expand</span></summary><div class="dm-list">' + l.map(listRow).join('') + '</div></details>';
      else h += '<h3 class="dm-lh">' + tr[1] + ' <span>' + l.length + (left ? ' · ' + mins(left) + ' unseen' : ' · all seen') + '</span></h3><div class="dm-list">' + l.map(listRow).join('') + '</div>';
    });
    var tg = nodes.filter(function (n) { return n.tier === 'target' || n.tier === 'future'; }).sort(byDate);
    if (tg.length) h += '<h3 class="dm-lh">The movies <span>' + tg.length + '</span></h3><div class="dm-list">' + tg.map(listRow).join('') + '</div>';
    if (!nodes.length) h += '<p class="empty">Nothing matches those filters.</p>';
    return '<div class="dm-listwrap">' + h + '</div>';
  }
  function panel(n) {
    var tier = data.tiers[n.tier] || {}, isTarget = n.tier === 'target' || n.tier === 'future';
    var pills = (n.services || []).length ? n.services.map(function (s) { return s.url ? '<a class="pill ' + esc(s.id) + '" href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) + ' ↗</a>' : '<span class="pill ' + esc(s.id) + '">' + esc(s.label) + '</span>'; }).join('') : '<span class="pill none">not on your services</span>';
    return '<div class="dm-panel" style="' + (n.backdrop_url ? '--bd:url(' + esc(n.backdrop_url) + ')' : '') + '"><div class="dm-panel-bd"></div><button class="more" data-dm-close="1" aria-label="Close">✕</button>' +
      '<div class="dm-panel-top">' + (n.poster_url ? '<img src="' + esc(n.poster_url) + '" alt="">' : '') + '<div><h3>' + esc(n.title) + '</h3><div class="muted small">' + esc(fmt(n.date)) + (n.runtime ? ' · ' + mins(n.runtime) : '') + (n.episodes ? ' · ' + n.episodes + ' episodes' : '') + (n.rating ? ' · ★ ' + n.rating : '') + '</div></div></div>' +
      '<div class="dm-facts"><div><span class="k">For Doomsday</span><span class="dm-tier ' + n.tier + '">' + esc(tier.label || n.tier) + '</span></div>' +
      (isTarget ? '' : '<div><span class="k">You</span>' + seenPill(n) + (n.queued ? '<span class="dm-tier q">★ queued' + (n.seen ? ' for a rewatch' : '') + '</span>' : '') + '</div>') +
      (!isTarget && n.seen && (n.tier === 'essential' || n.tier === 'recommended') && !n.queued ? '<div class="dm-hint">You\'ve seen this and it matters — ★ queue it if you want a refresher before the movie.</div>' : '') +
      (!isTarget && !n.seen && n.tier === 'essential' && !n.queued ? '<div class="dm-hint">Not seen yet and it\'s a must-watch — ★ queue it.</div>' : '') + '</div>' +
      '<p class="dm-why"><b>Why it matters:</b> ' + esc(n.why) + '</p>' +
      (n.overview ? '<p class="dm-ov">' + esc(n.overview) + '</p>' : '') +
      '<div class="pills">' + pills + '</div>' +
      (isTarget ? '' : '<div class="acts">' +
        '<button class="btn ' + (n.seen ? '' : 'primary') + '" data-dm-toggle="' + n.id + '">' + (n.seen ? '✓ Seen · mark unseen' : 'I’ve seen it') + '</button>' +
        '<button class="btn ' + (n.queued ? 'on' : '') + '" data-dm-queue="' + n.id + '">' + (n.queued ? '★ Queued · remove' : (n.seen ? '★ Rewatch before Doomsday' : '★ Watch before Doomsday')) + '</button>' +
        (STATIC ? '' : (n.on_your_list ? '<span class="badge soft">on your list · ' + esc((n.list_bucket || '').replace('_', ' ')) + '</span>' : '<button class="btn" data-dm-add="' + n.id + '">Add to my list</button>')) +
      '</div>') +
      '<div class="acts"><a class="btn" href="' + esc(n.tmdb_url) + '" target="_blank" rel="noopener">TMDB ↗</a></div></div>';
  }

  // ---- labels: four candidate spots per title, chosen for the current zoom ----------
  var lastNs = -1;
  function placeLabels(ns, force) {
    if (!force && Math.abs(ns - lastNs) < 0.03) return;
    lastNs = ns;
    var order = { target: 0, essential: 1, recommended: 2, background: 3, future: 4 }, placed = [];
    var nodes = data.nodes.filter(passes).sort(function (a, b) { return (order[a.tier] || 0) - (order[b.tier] || 0) || a.x - b.x; });
    nodes.forEach(function (n) {
      var g = root.querySelector('[data-node="' + n.id + '"]'); if (!g) return;
      var lab = g.querySelector('.dm-label'), sub = g.querySelector('.dm-sub');
      if (!n.lw) { try { n.lw = Math.max(lab.getComputedTextLength(), sub.getComputedTextLength()); } catch (e) { n.lw = Math.min(n.title.length, 34) * 8.6; } }
      var w = n.lw + 8, hgt = 36, r = n.r;
      var cands = [
        { anchor: 'middle', x: 0, y1: r + 20, y2: r + 36, box: { x: -w / 2, y: r + 6, w: w, h: hgt } },
        { anchor: 'middle', x: 0, y1: -(r + 22), y2: -(r + 8), box: { x: -w / 2, y: -(r + 22) - 14, w: w, h: hgt } },
        { anchor: 'start', x: r + 12, y1: 0, y2: 15, box: { x: r + 10, y: -13, w: w, h: 32 } },
        { anchor: 'end', x: -(r + 12), y1: 0, y2: 15, box: { x: -(r + 10) - w, y: -13, w: w, h: 32 } },
        { anchor: 'start', x: r * 0.75 + 6, y1: r * 0.75 + 16, y2: r * 0.75 + 31, box: { x: r * 0.75 + 4, y: r * 0.75 + 2, w: w, h: 34 } },
        { anchor: 'end', x: -(r * 0.75 + 6), y1: r * 0.75 + 16, y2: r * 0.75 + 31, box: { x: -(r * 0.75 + 4) - w, y: r * 0.75 + 2, w: w, h: 34 } },
        { anchor: 'start', x: r * 0.75 + 6, y1: -(r * 0.75 + 12), y2: -(r * 0.75 - 3), box: { x: r * 0.75 + 4, y: -(r * 0.75 + 26), w: w, h: 34 } },
        { anchor: 'end', x: -(r * 0.75 + 6), y1: -(r * 0.75 + 12), y2: -(r * 0.75 - 3), box: { x: -(r * 0.75 + 4) - w, y: -(r * 0.75 + 26), w: w, h: 34 } }
      ];
      var worldBox = function (b) { return { x: n.x + b.x * ns, y: n.y + b.y * ns, w: b.w * ns, h: b.h * ns }; };
      var cost = function (wb) {  // 0 = free; otherwise how badly this spot collides
        var c = 0;
        for (var i = 0; i < placed.length; i++) { var o = placed[i]; var ix = Math.min(wb.x + wb.w, o.x + o.w) - Math.max(wb.x, o.x), iy = Math.min(wb.y + wb.h, o.y + o.h) - Math.max(wb.y, o.y); if (ix > 0 && iy > 0) c += ix * iy; }
        for (var j = 0; j < nodes.length; j++) {
          var m = nodes[j]; if (m === n) continue;
          var rr = m.r * ns + 4, cx = Math.max(wb.x, Math.min(m.x, wb.x + wb.w)), cy = Math.max(wb.y, Math.min(m.y, wb.y + wb.h));
          var d2 = (m.x - cx) * (m.x - cx) + (m.y - cy) * (m.y - cy);
          if (d2 < rr * rr) c += 2 * (rr - Math.sqrt(d2)) * Math.min(wb.w, wb.h);
        }
        return c;
      };
      var best = null, bestCost = Infinity, bestBox = null;
      for (var c = 0; c < cands.length; c++) { var wb2 = worldBox(cands[c].box), cc = cost(wb2); if (cc < bestCost) { bestCost = cc; best = cands[c]; bestBox = wb2; } if (cc === 0) break; }
      var free = bestCost === 0, forced = n.tier === 'essential' || n.tier === 'target';
      g.classList.toggle('crowded', !free && !forced);
      var use = best;
      lab.setAttribute('text-anchor', use.anchor); lab.setAttribute('x', use.x); lab.setAttribute('y', use.y1);
      sub.setAttribute('text-anchor', use.anchor); sub.setAttribute('x', use.x); sub.setAttribute('y', use.y2);
      if (free || forced) placed.push(bestBox);
    });
  }

  // ---- view / zoom (viewBox based, so everything stays crisp) ------------------
  function stage() { return root.querySelector('.dm-stage'); }
  function svgEl() { return root.querySelector('.dmap-svg'); }
  function stageRect() { return stage().getBoundingClientRect(); }
  function applyView() {
    var s = svgEl(); if (!s) return;
    if (!stage()) return;
    var r = stageRect(), k = view.k;
    s.setAttribute('viewBox', (-view.x / k) + ' ' + (-view.y / k) + ' ' + (r.width / k) + ' ' + (r.height / k));
    s.style.setProperty('--inv', (1 / k).toFixed(4));
    var ns = Math.min(1.3, Math.pow(k, -0.62) * (r.width < 700 ? 1.15 : 1)), tf = 'scale(' + ns.toFixed(4) + ')';
    if (s.__ns !== tf) { s.__ns = tf; var gs = s.querySelectorAll('.dm-s'); for (var i = 0; i < gs.length; i++) gs[i].setAttribute('transform', tf); }
    placeLabels(ns, false);
    s.setAttribute('class', 'dmap-svg ' + (k < 0.5 ? 'z0' : k < 1.1 ? 'z1' : k < 2 ? 'z2' : 'z3') + (selected ? ' has-sel' : ''));
  }
  function animateTo(target) {
    if (anim) cancelAnimationFrame(anim);
    var from = { x: view.x, y: view.y, k: view.k }, t0 = performance.now(), dur = 380;
    var step = function (now) {
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      view.k = from.k + (target.k - from.k) * e; view.x = from.x + (target.x - from.x) * e; view.y = from.y + (target.y - from.y) * e;
      applyView(); if (p < 1) anim = requestAnimationFrame(step); else anim = null;
    };
    anim = requestAnimationFrame(step);
  }
  function fitTarget() {
    var r = stageRect(), k = Math.min(r.width / W, r.height / H) * 0.98;
    if (r.width < 700) { k = r.height / H * 0.96; var t = byId('doomsday') || { x: W - RIGHT, y: H / 2 }; return { k: k, x: r.width - 60 - t.x * k, y: (r.height - H * k) / 2 }; }
    return { k: k, x: (r.width - W * k) / 2, y: (r.height - H * k) / 2 };
  }
  function fit(animate) { var t = fitTarget(); if (animate) animateTo(t); else { view = t; applyView(); } }
  function zoomAt(f, px, py, animate) {
    var k2 = Math.max(0.12, Math.min(6, view.k * f));
    var t = { k: k2, x: px - (px - view.x) * (k2 / view.k), y: py - (py - view.y) * (k2 / view.k) };
    if (animate) animateTo(t); else { view = t; applyView(); }
  }
  function goTo(id) {
    var n = byId(id); if (!n) return;
    var r = stageRect(), k = Math.max(view.k, 1.1), cy = r.width < 700 ? r.height * 0.28 : r.height / 2;
    animateTo({ k: k, x: r.width / 2 - n.x * k, y: cy - n.y * k });
  }
  function detailEl() { var d = document.getElementById('dmDetail'); if (!d) { d = document.createElement('div'); d.id = 'dmDetail'; d.className = 'dm-detail'; document.body.appendChild(d); d.addEventListener('click', onClick); } return d; }
  function select(id) {
    selected = id; var n = byId(id), side = detailEl();
    root.querySelectorAll('.dm-node.on').forEach(function (g) { g.classList.remove('on'); });
    root.querySelectorAll('.dm-edge.lit').forEach(function (p) { p.classList.remove('lit'); });
    if (!n) { side.classList.remove('open'); setTimeout(function () { if (!side.classList.contains('open')) side.innerHTML = ''; }, 250); if (window.MyShowsLock) window.MyShowsLock.unlock(); if (mode === 'map') applyView(); return; }
    var g = root.querySelector('[data-node="' + id + '"]'); if (g) { g.classList.add('on'); g.parentNode.appendChild(g); }
    var e = root.querySelector('.dm-edge[data-for="' + id + '"]'); if (e) { e.classList.add('lit'); }
    side.innerHTML = panel(n); side.classList.add('open'); if (window.MyShowsLock && innerWidth < 760) window.MyShowsLock.lock(); if (mode === 'map') applyView(); haptic();
  }

  // ---- pointer handling ---------------------------------------------------------
  var pts = {};
  function onPointerDown(ev) {
    var st = stage(); if (!st) return;
    if (!ev.target.closest('.dm-stage') || ev.target.closest('.dm-side') || ev.target.closest('.dm-ctl')) return;  // only the map itself pans
    try { st.setPointerCapture && st.setPointerCapture(ev.pointerId); } catch (e) {}
    pts[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
    if (!dragging) dragging = { id: ev.pointerId, sx: ev.clientX, sy: ev.clientY, vx: view.x, vy: view.y, moved: false, target: ev.target.closest('[data-node]') };
    else if (!pinch) { var r = stageRect(); pinch = { a: dragging.id, b: ev.pointerId, ax: dragging.sx, ay: dragging.sy, bx: ev.clientX, by: ev.clientY, k0: view.k, x0: view.x, y0: view.y, r: r }; }
    ev.preventDefault();
  }
  function onPointerMove(ev) {
    if (!pts[ev.pointerId]) return;
    pts[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
    if (pinch) {
      var a = pts[pinch.a] || { x: pinch.ax, y: pinch.ay }, b = pts[pinch.b] || { x: pinch.bx, y: pinch.by };
      var d0 = Math.hypot(pinch.bx - pinch.ax, pinch.by - pinch.ay), d1 = Math.hypot(b.x - a.x, b.y - a.y);
      var k2 = Math.max(0.12, Math.min(6, pinch.k0 * (d1 / (d0 || 1))));
      var cx = (a.x + b.x) / 2 - pinch.r.left, cy = (a.y + b.y) / 2 - pinch.r.top, c0x = (pinch.ax + pinch.bx) / 2 - pinch.r.left, c0y = (pinch.ay + pinch.by) / 2 - pinch.r.top;
      view.k = k2; view.x = cx - (c0x - pinch.x0) * (k2 / pinch.k0); view.y = cy - (c0y - pinch.y0) * (k2 / pinch.k0); applyView(); return;
    }
    if (!dragging || ev.pointerId !== dragging.id) return;
    var dx = ev.clientX - dragging.sx, dy = ev.clientY - dragging.sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) dragging.moved = true;
    if (dragging.moved) { view.x = dragging.vx + dx; view.y = dragging.vy + dy; applyView(); }
  }
  function onPointerUp(ev) {
    delete pts[ev.pointerId];
    if (pinch && (ev.pointerId === pinch.a || ev.pointerId === pinch.b)) { pinch = null; dragging = null; return; }
    if (!dragging || ev.pointerId !== dragging.id) return;
    if (!dragging.moved) { if (dragging.target) select(dragging.target.dataset.node); else if (!ev.target.closest('.dm-side')) select(null); }
    dragging = null;
  }
  function onWheel(ev) {
    var st = stage(); if (!st) return; ev.preventDefault();
    var r = stageRect(); zoomAt(Math.exp(-ev.deltaY * 0.0016), ev.clientX - r.left, ev.clientY - r.top);
  }
  function onDblClick(ev) { var r = stageRect(); zoomAt(1.7, ev.clientX - r.left, ev.clientY - r.top, true); }

  // ---- actions ---------------------------------------------------------------------
  function post(path, body) {
    if (STATIC) {
      var st = localState();
      if (path === '/api/map/seen') { if (body.seen) st.seen[body.id] = 1; else delete st.seen[body.id]; }
      if (path === '/api/map/queue') { if (body.queued) st.queue[body.id] = 1; else delete st.queue[body.id]; }
      saveLocalState(st); return Promise.resolve({ ok: true });
    }
    return fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  function reload(keepSelection) {
    return fetch(DATA_URL, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(applyLocal).then(function (j) {
      data = j; var v = { x: view.x, y: view.y, k: view.k }, sel = selected; render(false); view = v; applyView();
      if (keepSelection && sel) { var n = byId(sel), d = detailEl(); if (n) { d.innerHTML = panel(n); var g = root.querySelector('[data-node="' + sel + '"]'); if (g) g.classList.add('on'); } }
    });
  }
  function onClick(ev) {
    var t = ev.target, el;
    if ((el = t.closest('[data-dm-zoom]'))) { var r = stageRect(); zoomAt(el.dataset.dmZoom === '1' ? 1.5 : 1 / 1.5, r.width / 2, r.height / 2, true); return; }
    if (t.closest('[data-dm-fit]')) { fit(true); return; }
    if ((el = t.closest('[data-dm-goto]'))) { goTo(el.dataset.dmGoto); select(el.dataset.dmGoto); return; }
    if (t.closest('[data-dm-close]')) { select(null); return; }
    if ((el = t.closest('[data-dm-mode]'))) { mode = el.dataset.dmMode; store('dm_mode', mode); haptic(); select(null); render(mode === 'map'); return; }
    if ((el = t.closest('[data-dmf]'))) {
      var f = el.dataset.dmf; haptic();
      if (f === 'all') filt = { tiers: {}, lanes: {}, hideSeen: false, queuedOnly: false };
      else if (f === 'lanes:all') filt.lanes = {};
      else if (f.indexOf('tier:') === 0) { var tn = f.slice(5); filt.tiers[tn] = !filt.tiers[tn]; }
      else if (f.indexOf('lane:') === 0) { var ln = f.slice(5); filt.lanes = filt.lanes || {}; filt.lanes[ln] = !filt.lanes[ln]; }
      else filt[f] = !filt[f];
      saveFilt(); applyFilters(f); return;
    }
    if ((el = t.closest('[data-dm-rowopen]'))) { if (t.closest('.dm-tgl')) return; select(el.dataset.dmRowopen); return; }
    if ((el = t.closest('[data-dm-toggle]'))) { var n = byId(el.dataset.dmToggle); haptic(); post('/api/map/seen', { id: n.id, seen: !n.seen }).then(function () { return reload(true); }); return; }
    if ((el = t.closest('[data-dm-queue]'))) { var nq = byId(el.dataset.dmQueue); haptic(); post('/api/map/queue', { id: nq.id, queued: !nq.queued }).then(function () { return reload(true); }); return; }
    if ((el = t.closest('[data-dm-add]'))) {
      var n2 = byId(el.dataset.dmAdd); haptic();
      post('/api/list/add', { line: n2.title.replace(/ — Season \d+$/, '') + ' {' + n2.key.replace(':', '/') + '}', section: n2.media_type === 'movie' ? 'movies_to_watch' : 'to_watch_running' })
        .then(function () { el.textContent = 'Added ✓'; el.disabled = true; if (window.MyShowsReload) window.MyShowsReload(); });
      return;
    }
  }

  // ---- filter changes animate in place (no full re-render): chip pops, nodes sweep in left→right, hidden ones shrink away
  var hideTimer = null;
  function popChip(bar, f) {
    var c = f && bar.querySelector('[data-dmf="' + f + '"]'); if (!c) return;
    c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
    setTimeout(function () { c.classList.remove('pop'); }, 650);
  }
  function applyFilters(f) {
    var bar = root.querySelector('.dm-bar');
    if (bar) {
      var rows = bar.querySelectorAll('.dm-filters'), sl = [].map.call(rows, function (r) { return r.scrollLeft; });
      bar.innerHTML = modeHtml() + filtersHtml();
      var rows2 = bar.querySelectorAll('.dm-filters'); for (var i = 0; i < rows2.length; i++) rows2[i].scrollLeft = sl[i] || 0;
      popChip(bar, f);
    }
    if (mode !== 'map') { var w = root.querySelector('.dm-listwrap'); if (w) { w.outerHTML = listHtml(); staggerRows(); } return; }
    animateVisibility();
  }
  function staggerRows() {
    var rows = root.querySelectorAll('.dm-row');
    for (var i = 0; i < rows.length; i++) { rows[i].style.setProperty('--d', Math.min(i * 26, 420) + 'ms'); rows[i].classList.add('dm-in'); }
  }
  function animateVisibility() {
    var s = svgEl(); if (!s) return;
    var vis = {}, shown = [];
    data.nodes.forEach(function (n) { vis[n.id] = passes(n); if (vis[n.id]) shown.push(n); });
    var minX = Infinity, maxX = -Infinity;
    shown.forEach(function (n) { if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x; });
    var span = Math.max(1, maxX - minX), delayOf = function (n) { return Math.round(40 + (n.x - minX) / span * 380) + 'ms'; };
    var finish = function (el) { el.classList.remove('dm-in', 'dm-out'); };
    data.nodes.forEach(function (n) {
      var g = s.querySelector('[data-node="' + n.id + '"]'); if (!g) return;
      var was = !g.classList.contains('off') && !g.classList.contains('dm-out');
      if (vis[n.id] && !was) { finish(g); g.classList.remove('off'); g.style.setProperty('--d', delayOf(n)); void g.getBoundingClientRect(); g.classList.add('dm-in'); }
      else if (!vis[n.id] && was) { finish(g); g.classList.add('dm-out'); }
    });
    var edges = s.querySelectorAll('.dm-edge[data-for]');
    for (var i = 0; i < edges.length; i++) {
      var e = edges[i], n = byId(e.dataset.for), v = n ? vis[n.id] : true, wasE = !e.classList.contains('off') && !e.classList.contains('dm-out');
      if (v && !wasE) { finish(e); e.classList.remove('off'); e.style.setProperty('--d', n ? delayOf(n) : '0ms'); void e.getBoundingClientRect(); e.classList.add('dm-in'); }
      else if (!v && wasE) { finish(e); e.classList.add('dm-out'); }
    }
    // chronology lines depend on which neighbours are visible: fade the old set out, draw the new set in
    var olds = s.querySelectorAll('.dm-chain:not(.dm-out)');
    for (var j = 0; j < olds.length; j++) { olds[j].classList.remove('dm-in'); olds[j].classList.add('dm-out'); }
    var ch = '';
    data.lanes.forEach(function (l) {
      var arr = shown.filter(function (n) { return n.lane === l.id && n.id !== 'doomsday' && n.id !== 'secretwars'; }).sort(function (a, b) { return a.x - b.x; });
      for (var k = 1; k < arr.length; k++) ch += '<line class="dm-chain dm-in" style="--d:' + delayOf(arr[k]) + '" x1="' + arr[k - 1].x + '" y1="' + arr[k - 1].y + '" x2="' + arr[k].x + '" y2="' + arr[k].y + '"/>';
    });
    var anchor = s.querySelector('.dm-edge') || s.querySelector('.dm-node');
    if (ch && anchor) { var tmp = document.createElementNS('http://www.w3.org/2000/svg', 'g'); tmp.innerHTML = ch; while (tmp.firstChild) s.insertBefore(tmp.firstChild, anchor); }
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      var outs = s.querySelectorAll('.dm-out'); for (var a = 0; a < outs.length; a++) { if (outs[a].classList.contains('dm-chain')) outs[a].remove(); else { outs[a].classList.remove('dm-out'); outs[a].classList.add('off'); } }
      var ins = s.querySelectorAll('.dm-in'); for (var b = 0; b < ins.length; b++) ins[b].classList.remove('dm-in');
    }, 900);
    lastNs = -1; applyView();  // labels re-flow for the new set
    updateCount(true);
  }
  function updateCount(bump) {
    var el = root.querySelector('.dm-count'); if (!el) return;
    var shown = data.nodes.filter(passes).length, total = data.nodes.length, filtered = anyFilter();
    el.innerHTML = filtered ? '<b>' + shown + '</b> of ' + total + ' titles' : '<b>' + total + '</b> titles';
    el.classList.toggle('filtered', filtered);
    if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  }

  function render(fitView) {
    var body = mode === 'map'
      ? '<div class="dm-stage" data-dm-stage="1">' + svg() +
        '<div class="dm-ctl"><button data-dm-zoom="1" aria-label="Zoom in">+</button><button data-dm-zoom="-1" aria-label="Zoom out">−</button><button data-dm-fit="1" aria-label="Fit">⤢</button><button data-dm-goto="doomsday" title="Jump to Doomsday">🎯</button></div><div class="dm-count" aria-live="polite"></div></div>'
      : listHtml();
    root.innerHTML = '<div class="dm-top"><div><h2 class="dm-h">Avengers: Doomsday — prep</h2><p class="muted small">Dec 18, 2026 · ' + (mode === 'map' ? 'drag to pan · pinch, scroll or double-tap to zoom · tap a title' : 'tap a title for why it matters · ✓ seen · ★ queue it for before the movie') + '</p></div>' + stats() + '</div>' +
      '<div class="dm-bar">' + modeHtml() + filtersHtml() + '</div>' + (mode === 'map' ? legend() : '') +
      body + '<p class="dm-note muted small">' + esc(data.note || '') + '</p>';
    if (mode === 'map') { lastNs = -1; if (fitView !== false) fit(false); else applyView(); updateCount(false); } else staggerRows();
  }

  window.Doomsday = {
    mount: function (el) {
      root = el;
      root.addEventListener('pointerdown', onPointerDown); root.addEventListener('pointermove', onPointerMove);
      root.addEventListener('pointerup', onPointerUp); root.addEventListener('pointercancel', onPointerUp);
      root.addEventListener('wheel', onWheel, { passive: false }); root.addEventListener('dblclick', onDblClick);
      root.addEventListener('click', onClick);
      root.innerHTML = '<div class="skel" style="height:60vh"></div>';
      fetch(DATA_URL, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(applyLocal).then(function (j) { data = j; render(true); })
        .catch(function (e) { root.innerHTML = '<p class="empty">Could not load the map: ' + esc(e.message) + '</p>'; });
      window.addEventListener('resize', function () { if (root && root.isConnected && data && mode === 'map') applyView(); });
      document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && selected) select(null); });
    }
  };
})();
