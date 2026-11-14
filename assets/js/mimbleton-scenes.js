/**
 * mimbleton-scenes.js: step INTO Mimbleton.
 *
 * Every habitat is a wide, layered, ground-level scene you walk through (drag, arrow keys, edge arrows,
 * or tap the ground). Residents live and wander there, things react when touched, and signposts at either
 * end walk you into the neighbouring habitat, so the world stays one connected place.
 *
 * To add a place: add an entry to SCENES (a builder that returns art layers, things, residents, sparkles)
 * and to ORDER. To add a resident: add a RESIDENTS entry and list it in a scene's `res`.
 *
 *   MimbletonScenes.init({ zones, found, saveFound, onAbout(zoneId), onExit(), onFound() })
 *   MimbletonScenes.enter('quiet-caves', { focus:'echo', show:'Episode title' })
 */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var VW = 1600, VH = 900, GY = 730, SPR = 'assets/world/sprites/';
  var cfg = { zones: [], found: {}, saveFound: function () {}, onAbout: null, onExit: null, onFound: null };

  /* ───────── data ───────── */
  var TOOLS = {
    breathe: ['🌬️', 'Breathe', 'breathing.html'], feel: ['💜', 'Name a feeling', 'start-with-a-feeling.html'],
    ground: ['🌿', 'Find calm', 'grounding.html'], water: ['💧', 'Sip & settle', 'water.html'],
    hug: ['🦋', 'Butterfly hug', 'butterfly-hug.html'], reflect: ['🔍', 'Look back', 'feeling-reflection.html'],
    skills: ['🧰', 'Calming skills', 'calming-skills.html'], nest: ['🪺', 'My nest', 'nest.html'],
    grow: ['🌱', 'Grow my bird', 'bird-growth.html'], feed: ['🐛', 'Feed my bird', 'bird-growth.html#feed'],
    closet: ['👒', 'Closet', 'closet.html'], avatar: ['🎨', 'Build me', 'avatar-customization.html'],
    rewards: ['🪶', 'Rewards', 'rewards.html'], friends: ['🤝', 'My circle', 'nest-connections.html'],
    stream: ['🌈', 'Sparkle Stream', 'sparkle-stream.html'], journal: ['📓', 'Journal', 'reflection-journal.html']
  };
  var RES = {
    clover: ['Welcome! There is always room at the Nesting Tree.', ['nest', 'friends', 'feel']],
    pebble: ['Slow and steady is still moving.', ['ground', 'hug', 'water']],
    twig: ['I am small today, but I am growing!', ['grow', 'feed', 'closet']],
    aura: ['What colour is your feeling right now?', ['feel', 'reflect', 'journal']],
    breezy: ['Take a big breath with me. Whoosh!', ['breathe', 'ground', 'skills']],
    flicker: ['Every day has a little spark in it. Let us find yours.', ['reflect', 'journal', 'rewards']],
    drift: ['It is okay to float for a while.', ['water', 'breathe', 'hug']],
    echo: ['Hello... hello... you are heard.', ['skills', 'feel', 'friends']],
    sable: ['Quiet is a good place to rest.', ['hug', 'ground', 'journal']],
    lumen: ['Look closer. There is light in everything.', ['rewards', 'closet', 'reflect']],
    flamez: ['Big feelings are just big energy!', ['feed', 'grow', 'skills']],
    flare: ['Today feels like a fresh start!', ['closet', 'avatar', 'rewards']],
    solace: ['You can catch your breath here.', ['ground', 'breathe', 'hug']],
    nova: ['The view from up here is big and kind.', ['avatar', 'closet', 'grow']],
    guardian: ['I watch over the valley. You are safe here.', ['friends', 'nest', 'skills']],
    cove: ['Follow the water. It knows the way.', ['stream', 'rewards', 'water']]
  };
  var ORDER = ['nesting-tree', 'feelings-forest', 'sparkle-stream', 'firefly-meadow', 'quiet-caves', 'sky-bridge'];
  var NAMES = { 'nesting-tree': 'Nesting Tree', 'feelings-forest': 'Feelings Forest', 'sparkle-stream': 'Sparkle Stream', 'firefly-meadow': 'Firefly Meadow', 'quiet-caves': 'Quiet Caves', 'sky-bridge': 'Sky Bridge', 'tools-shed': 'Tools Shed', 'reward-tracker': 'Reward Tracker' };

  /* ───────── helpers ───────── */
  var seed = 1; function srand(s) { seed = s; } function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function R(a, b) { return a + rnd() * (b - a); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function ridge(y, amp, color, sd, w, step) {
    srand(sd); step = step || 160; var d = 'M0 ' + VH + ' L0 ' + y;
    for (var x = 0; x < w; x += step) d += ' Q' + (x + step / 2) + ' ' + (y - amp * (.3 + rnd())).toFixed(0) + ' ' + (x + step) + ' ' + (y + R(-amp * .3, amp * .3)).toFixed(0);
    return '<path d="' + d + ' L' + (w + step) + ' ' + VH + 'Z" fill="' + color + '"/>';
  }
  function cloud(x, y, s, o) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" opacity="' + (o || .9) + '" fill="#fff"><ellipse cx="0" cy="0" rx="90" ry="30"/><ellipse cx="-40" cy="-22" rx="50" ry="34"/><ellipse cx="30" cy="-30" rx="58" ry="38"/></g>'; }
  function blob(x, y, s, trunk, c1, c2) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M-16 0 L-11 -130 L11 -130 L16 0Z" fill="' + trunk + '"/><circle cx="-54" cy="-160" r="66" fill="' + c2 + '"/><circle cx="50" cy="-166" r="72" fill="' + c2 + '"/><circle cx="0" cy="-214" r="80" fill="' + c1 + '"/><circle cx="-26" cy="-176" r="52" fill="' + c1 + '"/><circle cx="-44" cy="-228" r="18" fill="#fff" opacity=".25"/></g>';
  }
  function grass(w, y, cols, sd, h, n) {
    srand(sd); var o = '';
    for (var i = 0; i < n; i++) { var x = R(0, w), hh = R(h * .5, h), c = cols[Math.floor(rnd() * cols.length)]; o += '<path d="M' + x.toFixed(0) + ' ' + y + ' q' + R(-10, 10).toFixed(0) + ' ' + (-hh * .6).toFixed(0) + ' ' + R(-18, 18).toFixed(0) + ' ' + (-hh).toFixed(0) + ' q6 ' + (hh * .6).toFixed(0) + ' 10 ' + (hh).toFixed(0) + 'z" fill="' + c + '"/>'; }
    return '<g class="sv-sway">' + o + '</g>';
  }
  function flowers(w, y0, y1, cols, sd, n) {
    srand(sd); var o = '';
    for (var i = 0; i < n; i++) { var x = R(0, w), y = R(y0, y1), c = cols[Math.floor(rnd() * cols.length)], r = R(5, 9); o += '<g transform="translate(' + x.toFixed(0) + ' ' + y.toFixed(0) + ')"><path d="M0 0 v' + R(14, 28).toFixed(0) + '" stroke="#4d8f55" stroke-width="3"/><circle r="' + r.toFixed(1) + '" fill="' + c + '"/><circle r="' + (r * .4).toFixed(1) + '" fill="#fff2a8"/></g>'; }
    return o;
  }
  function motes(w, y0, y1, color, sd, n) {
    srand(sd); var o = '';
    for (var i = 0; i < n; i++) o += '<circle class="sv-float" style="animation-delay:' + (-R(0, 8)).toFixed(1) + 's;animation-duration:' + R(6, 12).toFixed(1) + 's" cx="' + R(0, w).toFixed(0) + '" cy="' + R(y0, y1).toFixed(0) + '" r="' + R(2, 5).toFixed(1) + '" fill="' + color + '"/>';
    return o;
  }
  function crystal(x, y, s, c) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M-30 0 L-18 -90 L0 -140 L20 -84 L32 0Z" fill="' + c + '" stroke="#fff" stroke-width="3" opacity=".95"/><path d="M0 -140 L-6 0 M0 -140 L20 -84" stroke="#fff" stroke-width="2" opacity=".6"/><path d="M-18 -90 L0 -60 L20 -84" fill="#fff" opacity=".35"/></g>';
  }
  function lantern(x, y, c) { return '<g class="sv-lantern" transform="translate(' + x + ' ' + y + ')"><path d="M0 -80 V-24" stroke="#6b5036" stroke-width="3"/><rect x="-16" y="-24" width="32" height="40" rx="10" fill="' + c + '" stroke="#fff" stroke-width="3"/><circle class="sv-glow" cx="0" cy="-4" r="46" fill="' + c + '" opacity=".28"/><rect x="-10" y="-30" width="20" height="8" rx="3" fill="#6b5036"/></g>'; }
  function post(x, y, label, dir) {
    var w = Math.max(150, label.length * 14 + 50);
    return '<g transform="translate(' + x + ' ' + y + ')"><rect x="-8" y="-150" width="16" height="150" rx="5" fill="#9b6b3e"/><g transform="translate(0 -138)"><path d="M' + (dir > 0 ? -10 : 10) + ' 0 h' + (dir * w) + ' l' + (dir * 24) + ' 22 l' + (dir * -24) + ' 22 h' + (dir * -w) + 'z" fill="#e3b277" stroke="#8a5a2f" stroke-width="4"/><text x="' + (dir * (w / 2)) + '" y="28" text-anchor="middle" font-size="22" font-weight="900" fill="#5b3a1d">' + esc(label) + '</text></g></g>';
  }

  /* ───────── scene builders ─────────
     each returns { sky, far, mid, near, fg, things:[], res:[{bird,x,y}], disc:[[x,y],[x,y],[x,y]], W, ambient } */
  var SCENES = {};

  SCENES['nesting-tree'] = function (W) {
    var sky = '<defs><linearGradient id="ntSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd9a8"/><stop offset=".55" stop-color="#fff1c9"/><stop offset="1" stop-color="#d9efb8"/></linearGradient></defs><rect width="1600" height="900" fill="url(#ntSky)"/><circle cx="1180" cy="210" r="90" fill="#fff6c4" opacity=".9"/><circle cx="1180" cy="210" r="150" fill="#fff6c4" opacity=".28"/>';
    var far = '', i; srand(5);
    for (i = 0; i < 14; i++) { var tx = i * 270 + R(-40, 40); far += '<rect x="' + tx + '" y="40" width="' + R(70, 120).toFixed(0) + '" height="900" rx="30" fill="#a8c98a" opacity=".55"/>'; }
    far += ridge(560, 90, '#bcdba0', 3, W);
    var mid = ridge(600, 110, '#8fbf7c', 8, W);
    for (i = 0; i < 10; i++) mid += blob(150 + i * 340 + R(-40, 40), 660, R(.9, 1.3), '#6d4c35', '#6ab36f', '#4f9a63');
    mid += '<g opacity=".35" fill="#fff6bb">' + [0, 1, 2, 3, 4, 5].map(function (k) { return '<path d="M' + (300 + k * 520) + ' 0 L' + (420 + k * 520) + ' 0 L' + (200 + k * 520) + ' 760 L' + (100 + k * 520) + ' 760Z"/>'; }).join('') + '</g>' + motes(W, 150, 700, '#fff6bb', 4, 40);
    var near = '<rect y="' + GY + '" width="' + W + '" height="200" fill="#7fa357"/><rect y="' + (GY + 14) + '" width="' + W + '" height="190" fill="#6a8f48"/>' + grass(W, GY + 4, ['#8fbf5a', '#a5d16a', '#76a548'], 6, 40, 160) + flowers(W, GY + 20, 880, ['#ffd0e2', '#fff0a0', '#c9b6ff'], 3, 70);
    // the great trunk
    near += '<path d="M1640 900 C1700 790 1740 700 1760 560 L1770 -60 L2130 -60 L2140 560 C2160 700 2200 790 2260 900Z" fill="#8b5e3c"/><path d="M1770 -60 C1790 300 1800 600 1700 900 M1900 -60 C1920 300 1930 600 1900 900 M2050 -60 C2040 300 2040 600 2110 900" stroke="#6b4429" stroke-width="10" fill="none" opacity=".55"/><path d="M1640 900 C1560 870 1500 880 1420 900Z M2260 900 C2340 870 2400 880 2480 900Z" fill="#8b5e3c"/>';
    near += '<ellipse cx="1950" cy="660" rx="96" ry="130" fill="#4a2f1d"/><ellipse cx="1950" cy="672" rx="76" ry="108" fill="#ffd98a"/><ellipse class="sv-glow" cx="1950" cy="672" rx="150" ry="170" fill="#ffd98a" opacity=".25"/><path d="M1880 770 h140" stroke="#6b4429" stroke-width="10"/><rect x="1890" y="800" width="120" height="26" rx="8" fill="#e98fa8"/>';
    // right branch with a little nook
    near += '<path d="M2130 520 C2300 500 2500 540 2800 520 L2800 570 C2500 590 2300 570 2130 590Z" fill="#8b5e3c"/><path d="M2480 540 V' + GY + '" stroke="#e6c48a" stroke-width="4" stroke-dasharray="3 22" stroke-linecap="round"/>' +
      [0, 1, 2, 3, 4, 5, 6, 7].map(function (k) { return '<rect x="2466" y="' + (590 + k * 20) + '" width="28" height="6" rx="3" fill="#c79a5f"/>'; }).join('') +
      '<rect x="2540" y="470" width="190" height="14" rx="6" fill="#a47347"/><path d="M2540 470 q95-70 190 0z" fill="#6ab36f"/>';
    // left: Clover's stump house + swing
    near += '<ellipse cx="760" cy="' + (GY + 30) + '" rx="150" ry="26" fill="#000" opacity=".12"/><path d="M640 ' + (GY + 28) + ' q-6-150 20-170 h200 q26 20 20 170z" fill="#a47347"/><ellipse cx="760" cy="' + (GY - 144) + '" rx="110" ry="30" fill="#c79a5f"/><circle cx="760" cy="' + (GY - 60) + '" r="42" fill="#4a2f1d"/><circle cx="760" cy="' + (GY - 56) + '" r="32" fill="#ffd98a"/><rect x="700" y="' + (GY + 8) + '" width="120" height="22" rx="8" fill="#f2b6c8"/>';
    near += '<g fill="#cfc6dc" stroke="#fff" stroke-width="3"><ellipse cx="1490" cy="' + (GY + 54) + '" rx="40" ry="18"/><ellipse cx="1560" cy="' + (GY + 70) + '" rx="26" ry="12"/></g>';
    near += post(160, GY + 30, 'Sky Bridge', -1) + post(W - 160, GY + 30, 'Feelings Forest', 1);
    var fg = '';
    srand(9); for (i = 0; i < 26; i++) fg += '<ellipse cx="' + R(0, W * 1.4).toFixed(0) + '" cy="' + R(-40, 70).toFixed(0) + '" rx="' + R(70, 140).toFixed(0) + '" ry="' + R(40, 80).toFixed(0) + '" fill="' + (i % 2 ? '#3b8a52' : '#2f7a4a') + '"/>';
    fg += '<g stroke="#2f7a4a" stroke-width="6" fill="none">' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (k) { return '<path d="M' + (200 + k * 480) + ' 40 q10 80 -6 150"/>'; }).join('') + '</g>';
    return {
      W: W, sky: sky, far: far, mid: mid, near: near, fg: fg, ambient: 'leaves',
      things: [
        { x: 1000, y: 340, art: lantern(0, 0, '#ffd27a'), hit: [-40, -80, 80, 120], kind: 'lantern', note: 392 },
        { x: 1420, y: 300, art: lantern(0, 0, '#ff9ec2'), hit: [-40, -80, 80, 120], kind: 'lantern', note: 440 },
        { x: 2400, y: 360, art: lantern(0, 0, '#a8e6c8'), hit: [-40, -80, 80, 120], kind: 'lantern', note: 523 },
        { x: 1240, y: GY - 110, art: '<g class="swg"><path d="M-60 -640 V0 M60 -640 V0" stroke="#6b4429" stroke-width="6"/><rect x="-80" y="-4" width="160" height="18" rx="8" fill="#c79a5f" stroke="#8a5d33" stroke-width="3"/></g>', hit: [-90, -60, 180, 120], kind: 'swing', label: 'Rope swing' },
        { x: 2200, y: GY + 20, art: '<g class="sv-sway"><ellipse cx="0" cy="8" rx="90" ry="26" fill="#d9a441"/><ellipse cx="-30" cy="-6" rx="50" ry="22" fill="#e8b94e"/><ellipse cx="34" cy="-10" rx="46" ry="20" fill="#e98a4e"/><ellipse cx="4" cy="-22" rx="34" ry="16" fill="#c96a3c"/></g>', hit: [-100, -50, 200, 80], kind: 'leaves', label: 'Leaf pile' }
      ],
      res: [{ bird: 'clover', x: 940, y: GY + 38 }, { bird: 'pebble', x: 1560, y: GY + 90 }, { bird: 'twig', x: 2640, y: 470 }],
      disc: [[760, GY - 120], [1560, 380], [1500, GY + 20]]
    };
  };

  SCENES['feelings-forest'] = function (W) {
    var sky = '<defs><linearGradient id="ffSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9e8f2"/><stop offset=".6" stop-color="#e6d9ff"/><stop offset="1" stop-color="#ffe2ef"/></linearGradient></defs><rect width="1600" height="900" fill="url(#ffSky)"/>' + cloud(300, 170, 1.4) + cloud(1100, 110, 1.1, .8);
    var far = ridge(480, 130, '#c8d9f0', 2, W, 240) + ridge(560, 100, '#b2d8d6', 4, W, 200), i;
    srand(11); var cols = [['#ff9ec2', '#ff7aa8'], ['#ffd27a', '#f5b23d'], ['#8fd6ff', '#5ab8f0'], ['#b79bff', '#9272e8'], ['#8de6b5', '#58c98c']];
    var mid = ridge(620, 90, '#97cfa8', 6, W);
    for (i = 0; i < 14; i++) { var c = cols[i % 5]; mid += blob(90 + i * 250 + R(-30, 30), 680, R(.8, 1.1), '#7a5b6e', c[0], c[1]); }
    mid += motes(W, 200, 650, '#fff', 3, 30);
    var near = '<rect y="' + GY + '" width="' + W + '" height="200" fill="#8bd09c"/><rect y="' + (GY + 16) + '" width="' + W + '" height="190" fill="#6fbf8a"/>' + grass(W, GY + 4, ['#a4e3a9', '#7fd28f', '#bdf0a8'], 5, 44, 170) + flowers(W, GY + 20, 880, ['#ff9ec2', '#ffe27a', '#b79bff', '#fff'], 2, 90);
    near += '<path d="M0 ' + (GY + 90) + ' Q600 ' + (GY + 40) + ' 1200 ' + (GY + 90) + ' T' + W + ' ' + (GY + 80) + '" fill="none" stroke="#f6e2bd" stroke-width="26" stroke-linecap="round" opacity=".85"/>';
    var feelTrees = [[620, 'Joyful', '#ffd27a', '#f5b23d'], [1180, 'Calm', '#8fd6ff', '#5ab8f0'], [1700, 'Silly', '#ff9ec2', '#ff7aa8'], [2380, 'Brave', '#ff9a62', '#f06a3c'], [2900, 'Gentle', '#b79bff', '#9272e8']], things = [];
    feelTrees.forEach(function (t, k) {
      near += '<g class="ff-tree" id="ffTree' + k + '" transform="translate(' + t[0] + ' ' + (GY + 30) + ') scale(1.55)"><path d="M-18 0 L-12 -140 L12 -140 L18 0Z" fill="#7a5b6e"/><g class="ff-crown"><circle cx="-56" cy="-170" r="70" fill="' + t[3] + '"/><circle cx="54" cy="-176" r="76" fill="' + t[3] + '"/><circle cx="0" cy="-226" r="86" fill="' + t[2] + '"/><circle cx="-28" cy="-186" r="56" fill="' + t[2] + '"/></g></g>';
      things.push({ x: t[0], y: GY - 250, art: '', hit: [-170, -260, 340, 330], kind: 'tree', tree: k, label: 'Feeling tree', cols: t });
    });
    near += [[880, 'Listening stump'], [2120, '']].map(function (m, k) { return k ? '' : '<g transform="translate(880 ' + (GY + 70) + ')"><ellipse cx="0" cy="10" rx="76" ry="20" fill="#000" opacity=".12"/><path d="M-60 0 q0-60 10-70 h100 q10 10 10 70z" fill="#a8825f"/><ellipse cx="0" cy="-70" rx="60" ry="16" fill="#c9a37a"/><ellipse cx="0" cy="-70" rx="34" ry="8" fill="none" stroke="#a8825f" stroke-width="3"/></g>'; }).join('');
    [[1420, '#ff6b9a'], [2640, '#7a8cff']].forEach(function (m) { near += '<g transform="translate(' + m[0] + ' ' + (GY + 70) + ')"><rect x="-8" y="-30" width="16" height="40" rx="6" fill="#fff0d9"/><path d="M-56 -30 q56-90 112 0z" fill="' + m[1] + '" stroke="#fff" stroke-width="4"/><circle cx="-22" cy="-58" r="8" fill="#fff"/><circle cx="18" cy="-48" r="6" fill="#fff"/></g>'; });
    near += post(160, GY + 30, 'Nesting Tree', -1) + post(W - 160, GY + 30, 'Sparkle Stream', 1);
    things.push({ x: 1420, y: GY + 20, art: '', hit: [-70, -80, 140, 110], kind: 'bounce', label: 'Mushroom', note: 330 }, { x: 2640, y: GY + 20, art: '', hit: [-70, -80, 140, 110], kind: 'bounce', label: 'Mushroom', note: 392 });
    var fg = grass(W * 1.4, 900, ['#4fae7a', '#3c9a6a'], 12, 130, 60) + '<g opacity=".8">' + [0, 1, 2, 3, 4].map(function (k) { return '<ellipse cx="' + (k * 520 + 100) + '" cy="-20" rx="150" ry="70" fill="#4fae7a"/>'; }).join('') + '</g>';
    return { W: W, sky: sky, far: far, mid: mid, near: near, fg: fg, ambient: 'leaves', things: things, res: [{ bird: 'aura', x: 1000, y: GY + 60 }, { bird: 'breezy', x: 1960, y: GY + 80 }, { bird: 'flicker', x: 2700, y: GY + 60 }], disc: [[540, GY - 30], [900, GY - 40], [2160, GY - 20]] };
  };

  SCENES['quiet-caves'] = function (W) {
    var sky = '<defs><linearGradient id="qcSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1f4d"/><stop offset=".6" stop-color="#34407a"/><stop offset="1" stop-color="#4a5a9a"/></linearGradient></defs><rect width="1600" height="900" fill="url(#qcSky)"/>' + (function () { srand(4); var o = ''; for (var i = 0; i < 60; i++) o += '<circle class="sv-twinkle" style="animation-delay:' + (-R(0, 3)).toFixed(1) + 's" cx="' + R(0, 1600).toFixed(0) + '" cy="' + R(0, 500).toFixed(0) + '" r="' + R(1, 3).toFixed(1) + '" fill="#fff"/>'; return o; })();
    var far = '<g fill="#232860">' + (function () { srand(7); var o = ''; for (var i = 0; i < 26; i++) { var x = i * 150 + R(-30, 30); o += '<path d="M' + x + ' -10 L' + (x + 60) + ' -10 L' + (x + 30) + ' ' + R(120, 300).toFixed(0) + 'Z"/>'; } return o; })() + '</g>' + ridge(520, 120, '#2b3170', 3, W, 220);
    var mid = ridge(600, 100, '#3a4488', 5, W, 200) + [700, 1700, 2600].map(function (x) { return '<path d="M' + (x - 150) + ' 700 V420 Q' + x + ' 250 ' + (x + 150) + ' 420 V700Z" fill="#141842"/><path d="M' + (x - 110) + ' 700 V440 Q' + x + ' 310 ' + (x + 110) + ' 440 V700Z" fill="#8f7fe8" opacity=".35"/>'; }).join('') + motes(W, 200, 700, '#b9a8ff', 2, 40);
    var near = '<rect y="' + GY + '" width="' + W + '" height="200" fill="#2a2f6e"/><rect y="' + (GY + 14) + '" width="' + W + '" height="190" fill="#212659"/>';
    near += '<ellipse cx="1900" cy="' + (GY + 70) + '" rx="320" ry="60" fill="#5fd0ff" opacity=".85"/><ellipse cx="1900" cy="' + (GY + 70) + '" rx="260" ry="44" fill="#a6ecff" opacity=".7" class="sv-glow"/><ellipse cx="1900" cy="' + (GY + 70) + '" rx="330" ry="66" fill="none" stroke="#c9b6ff" stroke-width="6"/>';
    near += '<g class="sv-twinkle">' + crystal(380, GY + 20, 1.2, '#ff9ee6') + crystal(470, GY + 24, .8, '#9ee6ff') + '</g>' + crystal(2640, GY + 20, 1.3, '#b79bff') + crystal(2740, GY + 26, .85, '#8fffd0') + crystal(3000, GY + 16, 1.0, '#ffe27a');
    near += '<g transform="translate(1200 ' + (GY + 10) + ')"><path d="M-160 0 V-230 Q0 -380 160 -230 V0Z" fill="#1a1d4a"/><path d="M-120 0 V-220 Q0 -330 120 -220 V0Z" fill="#7c6be0" opacity=".45"/><g fill="none" stroke="#c9b6ff" stroke-width="4" opacity=".6" class="sv-ringpulse"><circle cy="-120" r="50"/><circle cy="-120" r="90"/><circle cy="-120" r="130"/></g></g>';
    near += post(160, GY + 30, 'Firefly Meadow', -1) + post(W - 160, GY + 30, 'Sky Bridge', 1);
    var fg = '<g fill="#10133a">' + (function () { srand(14); var o = ''; for (var i = 0; i < 18; i++) { var x = i * 270 + R(-40, 40); o += '<path d="M' + x + ' -10 L' + (x + 90) + ' -10 L' + (x + 45) + ' ' + R(100, 220).toFixed(0) + 'Z"/>'; } return o; })() + '</g>';
    var things = [[380, '#ff9ee6', 262], [470, '#9ee6ff', 330], [2640, '#b79bff', 392], [2740, '#8fffd0', 494], [3000, '#ffe27a', 587]].map(function (c) { return { x: c[0], y: GY - 40, art: '', hit: [-50, -150, 100, 170], kind: 'crystal', note: c[2], label: 'Crystal' }; });
    things.push({ x: 1200, y: GY - 120, art: '', hit: [-150, -250, 300, 270], kind: 'echo', label: 'Echo chamber' }, { x: 1900, y: GY + 70, art: '', hit: [-300, -40, 600, 100], kind: 'ripple', label: 'Stillwater pool', note: 220 });
    return { W: W, sky: sky, far: far, mid: mid, near: near, fg: fg, ambient: 'glow', things: things, res: [{ bird: 'drift', x: 1560, y: GY + 80 }, { bird: 'echo', x: 1200, y: GY + 70 }, { bird: 'sable', x: 700, y: GY + 60 }, { bird: 'lumen', x: 2450, y: GY + 70 }], disc: [[1900, GY + 10], [1200, GY - 330], [2860, GY - 30]] };
  };

  SCENES['firefly-meadow'] = function (W) {
    var sky = '<defs><linearGradient id="fmSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3a7a"/><stop offset=".45" stop-color="#d77fa7"/><stop offset=".8" stop-color="#ffc58a"/><stop offset="1" stop-color="#ffe9a8"/></linearGradient></defs><rect width="1600" height="900" fill="url(#fmSky)"/><circle cx="1100" cy="500" r="110" fill="#fff0b8" opacity=".95"/><circle cx="1100" cy="500" r="200" fill="#fff0b8" opacity=".25"/>' + (function () { srand(3); var o = ''; for (var i = 0; i < 40; i++) o += '<circle class="sv-twinkle" style="animation-delay:' + (-R(0, 3)).toFixed(1) + 's" cx="' + R(0, 1600).toFixed(0) + '" cy="' + R(0, 300).toFixed(0) + '" r="' + R(1, 2.6).toFixed(1) + '" fill="#fff"/>'; return o; })();
    var far = ridge(560, 90, '#7b6aa8', 2, W, 260) + ridge(620, 80, '#6a5a98', 5, W, 220);
    var mid = ridge(660, 70, '#4e7f78', 7, W, 200) + '<g fill="#3a5f60">' + (function () { srand(20); var o = ''; for (var i = 0; i < 20; i++) { var x = i * 190 + R(-30, 30); o += '<path d="M' + x + ' 700 q-4-60 0-110 q4 50 0 110"/>'; } return o; })() + '</g>';
    var near = '<rect y="' + (GY - 6) + '" width="' + W + '" height="200" fill="#4f9a6a"/><rect y="' + (GY + 14) + '" width="' + W + '" height="190" fill="#3f8558"/>' + grass(W, GY, ['#7cc27a', '#5fae6a', '#a3d77c'], 9, 60, 300) + flowers(W, GY + 14, 880, ['#ffd27a', '#ff9ec2', '#fff'], 8, 100);
    near += '<path d="M1900 ' + GY + ' Q2300 420 2800 ' + GY + 'Z" fill="#5aa86e"/><path d="M1960 ' + (GY - 10) + ' Q2300 500 2740 ' + (GY - 10) + '" fill="none" stroke="#8fd08a" stroke-width="6" opacity=".7"/><g transform="translate(2300 ' + (GY - 276) + ')"><path d="M0 0 v-80" stroke="#7a5a3a" stroke-width="6"/><path d="M0 -80 l60 14 l-60 18z" fill="#ff7a5c"/></g>';
    near += '<g transform="translate(1100 ' + (GY + 10) + ')"><ellipse cx="0" cy="10" rx="130" ry="22" fill="#000" opacity=".14"/><path d="M-110 0 q0-110 110-110 q110 0 110 110z" fill="#e87a4a"/><path d="M-80 0 q0-72 80-72 q80 0 80 72z" fill="#c9582e"/><circle cx="0" cy="-30" r="30" fill="#ffd98a"/><ellipse class="sv-glow" cx="0" cy="-30" rx="80" ry="60" fill="#ffd98a" opacity=".3"/></g>';
    near += '<g transform="translate(760 ' + (GY + 30) + ')"><rect x="-70" y="-6" width="140" height="22" rx="8" fill="#b5533c"/><rect x="-60" y="-14" width="120" height="14" rx="6" fill="#ff9ec2"/><path d="M-30 -14 h60" stroke="#fff" stroke-width="3" stroke-dasharray="6 6"/></g>';
    near += post(160, GY + 30, 'Sparkle Stream', -1) + post(W - 160, GY + 30, 'Quiet Caves', 1);
    var fg = grass(W * 1.4, 900, ['#2f6b4a', '#285c40'], 33, 170, 70);
    return {
      W: W, sky: sky, far: far, mid: mid, near: near, fg: fg, ambient: 'catch',
      things: [{ x: 2300, y: GY - 200, art: '', hit: [-200, -200, 400, 220], kind: 'hill', label: 'Firefly Rise' }],
      res: [{ bird: 'flamez', x: 1280, y: GY + 70 }, { bird: 'flare', x: 2250, y: GY - 130 }, { bird: 'solace', x: 780, y: GY + 90 }],
      disc: [[540, GY - 40], [2420, GY - 210], [1000, GY - 60]]
    };
  };

  SCENES['sky-bridge'] = function (W) {
    var sky = '<defs><linearGradient id="sbSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5eb6ff"/><stop offset=".6" stop-color="#bfe6ff"/><stop offset="1" stop-color="#fff1d6"/></linearGradient></defs><rect width="1600" height="900" fill="url(#sbSky)"/><circle cx="1300" cy="170" r="80" fill="#fff6c4"/><circle cx="1300" cy="170" r="160" fill="#fff6c4" opacity=".3"/>';
    var far = cloud(260, 220, 1.6, .85) + cloud(900, 140, 1.2, .7) + cloud(1700, 250, 1.8, .8) + cloud(2500, 170, 1.4, .8) + cloud(3200, 260, 1.7, .8) + ridge(700, 120, '#9cc2e8', 3, W, 300);
    var mid = cloud(400, 820, 2.4, .95) + cloud(1300, 860, 2.8, .95) + cloud(2300, 830, 2.6, .95) + cloud(3100, 860, 2.4, .95) + [500, 1500, 2400, 3300].map(function (x) { return '<path d="M' + (x - 130) + ' 900 L' + x + ' 640 L' + (x + 130) + ' 900Z" fill="#8fb0dd" opacity=".8"/>'; }).join('');
    var near = '<rect y="' + (GY + 40) + '" width="' + W + '" height="26" rx="6" fill="#c79a5f"/><rect y="' + (GY + 66) + '" width="' + W + '" height="20" fill="#8a5d33"/>' + (function () { var o = ''; for (var x = 0; x < W; x += 64) o += '<path d="M' + x + ' ' + (GY + 40) + ' v26" stroke="#8a5d33" stroke-width="3"/>'; for (x = 100; x < W; x += 340) o += '<rect x="' + x + '" y="' + (GY - 120) + '" width="14" height="164" rx="5" fill="#9b6b3e"/><path d="M' + x + ' ' + (GY - 110) + ' h340" stroke="#e6c48a" stroke-width="6"/><path d="M' + x + ' ' + (GY - 40) + ' h340" stroke="#e6c48a" stroke-width="5"/><path d="M' + (x + 14) + ' ' + (GY - 120) + ' l26 12 l-26 14z" fill="' + ['#ff7a8a', '#ffd27a', '#8fd6ff'][(x / 340 | 0) % 3] + '"/>'; return o; })();
    near += '<g transform="translate(120 ' + (GY + 40) + ')"><path d="M-120 0 H120 V300 H-120Z" fill="#8a9bc4"/><path d="M-120 0 H120 L90 -26 H-90Z" fill="#a8b8de"/></g><g transform="translate(' + (W - 200) + ' ' + (GY + 40) + ')"><rect x="-90" y="-250" width="180" height="250" fill="#aebbd8"/><path d="M-110 -250 L0 -350 L110 -250Z" fill="#6d7fb0"/><rect x="-30" y="-180" width="60" height="90" rx="30" fill="#4b5a88"/><path d="M60 -250 V-330 l50 12 l-50 14" fill="#ff7a8a"/></g>';
    near += post(300, GY + 36, 'Quiet Caves', -1) + post(W - 460, GY + 36, 'Nesting Tree', 1);
    var things = [[900, 392], [1500, 440], [2100, 523]].map(function (b, k) { return { x: b[0], y: GY - 190, art: '<g class="sv-swing"><path d="M0 -700 V-20" stroke="#6b5036" stroke-width="3"/><path d="M-24 -20 q24-30 48 0 l6 36 h-60z" fill="#ffd27a" stroke="#fff" stroke-width="4"/><circle cy="20" r="6" fill="#fff"/></g>', hit: [-40, -70, 80, 110], kind: 'bell', note: b[1], label: 'Wind bell' }; });
    things.push({ x: 1850, y: GY - 6, art: '<g transform="translate(0 0)"><path d="M-30 0 L0 -70 L30 0 M0 -70 V-110" stroke="#5b4630" stroke-width="6" fill="none"/><rect x="-50" y="-130" width="100" height="26" rx="10" fill="#4b5a88" transform="rotate(-18 0 -118)"/></g>', hit: [-60, -140, 120, 150], kind: 'scope', label: 'Telescope' });
    var fg = cloud(300, 880, 2.2, .85) + cloud(1400, 900, 2.6, .85);
    return { W: W, sky: sky, far: far, mid: mid, near: near, fg: fg, ambient: 'clouds', things: things, signX: [300, W - 460], res: [{ bird: 'nova', x: 1300, y: GY + 50 }, { bird: 'guardian', x: W - 380, y: GY + 50 }], disc: [[560, GY - 60], [2250, GY - 100], [1650, GY - 160]] };
  };

  SCENES['sparkle-stream'] = function (W) {
    var sky = '<defs><linearGradient id="ssSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ee0ff"/><stop offset=".7" stop-color="#e8f7ff"/><stop offset="1" stop-color="#fff6d9"/></linearGradient></defs><rect width="1600" height="900" fill="url(#ssSky)"/>' + cloud(300, 150, 1.2) + cloud(1200, 220, 1);
    var far = ridge(500, 120, '#a8d4e8', 3, W, 280) + ridge(580, 90, '#8fc9c0', 6, W, 240);
    var mid = ridge(640, 80, '#6fbf9a', 8, W, 220); srand(21);
    for (var i = 0; i < 12; i++) mid += blob(120 + i * 300 + R(-40, 40), 660, R(.7, 1), '#7a5b4e', '#7bd09a', '#4fae7a');
    mid += '<g transform="translate(360 440)"><rect x="-60" y="0" width="120" height="230" fill="url(#ssFall)"/></g><defs><linearGradient id="ssFall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8fbff"/><stop offset="1" stop-color="#7fd2ea"/></linearGradient></defs><path d="M300 440 h120 l30-60 h-180z" fill="#7a8fb0" opacity=".9"/>' + '<g class="sv-fall" stroke="#fff" stroke-width="6" opacity=".75">' + [0, 1, 2, 3].map(function (k) { return '<path d="M' + (330 + k * 22) + ' 440 v230" stroke-dasharray="14 18"/>'; }).join('') + '</g>';
    var near = '<rect y="' + (GY - 120) + '" width="' + W + '" height="100" fill="#8fd09a"/>' + grass(W, GY - 120, ['#a6e3a0', '#7fd28f'], 3, 50, 150) + flowers(W, GY - 116, GY - 60, ['#fff', '#ffd27a', '#ff9ec2'], 3, 50);
    near += '<rect y="' + (GY - 28) + '" width="' + W + '" height="290" fill="url(#ssWater)"/><defs><linearGradient id="ssWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fe6f0"/><stop offset="1" stop-color="#38b4d4"/></linearGradient></defs>' + (function () { srand(19); var o = ''; for (var i = 0; i < 40; i++) o += '<path class="sv-flow" style="animation-delay:' + (-R(0, 6)).toFixed(1) + 's" d="M' + R(0, W).toFixed(0) + ' ' + R(GY - 10, 880).toFixed(0) + ' q30-10 60 0 t60 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>'; return o; })();
    near += '<g transform="translate(1700 ' + (GY + 30) + ')"><ellipse cx="0" cy="10" rx="130" ry="26" fill="#000" opacity=".15"/><path d="M-120 12 Q-100-70 0 -76 Q100 -70 120 12Z" fill="#a9a2c4"/><path d="M-70 -20 Q-30 -60 20 -52" stroke="#d8d2ee" stroke-width="8" fill="none"/></g>';
    var stones = [900, 1100, 1300, 2100, 2300, 2500].map(function (x, k) { return { x: x, y: GY + 80 + (k % 2) * 30, art: '<ellipse cx="0" cy="6" rx="58" ry="20" fill="#000" opacity=".18"/><ellipse cx="0" cy="0" rx="56" ry="22" fill="#cfc6dc" stroke="#fff" stroke-width="4"/>', hit: [-62, -30, 124, 60], kind: 'stone', note: 300 + k * 50, label: 'Stepping stone' }; });
    var things = stones.concat([{ x: 2900, y: GY - 10, art: '<g class="sv-glow-g"><path d="M-46 -10 q0-90 46-90 q46 0 46 90 q0 30-46 30 q-46 0-46-30z" fill="#e8fbff" stroke="#5aa7bd" stroke-width="5" opacity=".95"/><rect x="-28" y="-114" width="56" height="18" rx="6" fill="#c79a5f"/><text id="svJarNum" y="-14" text-anchor="middle" font-size="34" font-weight="900" fill="#e0a83a">0</text><text y="14" text-anchor="middle" font-size="17" font-weight="900" fill="#5a7a8c">feathers</text></g>', hit: [-60, -120, 120, 150], kind: 'jar', label: 'Feather jar' }]);
    near += [1500, 1950, 2750].map(function (x) { return '<g class="sv-boat" transform="translate(' + x + ' ' + (GY + 150) + ')"><path d="M-30 0 q30 26 60 0z" fill="#e98a4e"/><path d="M0 0 V-34 l24 22z" fill="#fff"/></g>'; }).join('');
    near += post(160, GY - 20, 'Feelings Forest', -1) + post(W - 160, GY - 20, 'Firefly Meadow', 1);
    var fg = (function () { srand(30); var o = ''; for (var i = 0; i < 26; i++) { var x = R(0, W * 1.4); o += '<path class="sv-sway" d="M' + x.toFixed(0) + ' 910 q-8-90 -2-' + R(160, 260).toFixed(0) + ' q14 90 8 ' + R(160, 260).toFixed(0) + 'z" fill="#3f9a6a" opacity=".9"/>'; } return o; })();
    return { W: W, sky: sky, far: far, mid: mid, near: near, fg: fg, ambient: 'bubbles', things: things, res: [{ bird: 'cove', x: 1700, y: GY - 12 }], disc: [[800, GY + 20], [1400, GY + 90], [440, GY - 90]] };
  };

  SCENES['tools-shed'] = function () {
    var W = 2800, sky = '<defs><linearGradient id="tsWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9c28a"/><stop offset="1" stop-color="#c99a5f"/></linearGradient></defs><rect width="1600" height="900" fill="url(#tsWall)"/>' + (function () { var o = ''; for (var x = 0; x < 1600; x += 120) o += '<path d="M' + x + ' 0 V900" stroke="#b5834a" stroke-width="4" opacity=".5"/>'; return o; })();
    var far = '<rect x="400" y="120" width="360" height="300" rx="20" fill="#bfe8ff" stroke="#8a5d33" stroke-width="14"/><path d="M580 120 V420 M400 270 H760" stroke="#8a5d33" stroke-width="10"/>' + '<rect x="1700" y="120" width="360" height="300" rx="20" fill="#ffe9a8" stroke="#8a5d33" stroke-width="14"/><path d="M1880 120 V420 M1700 270 H2060" stroke="#8a5d33" stroke-width="10"/>';
    var near = '<rect y="' + (GY + 20) + '" width="' + W + '" height="200" fill="#9b6b3e"/>' + (function () { var o = ''; for (var x = 0; x < W; x += 180) o += '<path d="M' + x + ' ' + (GY + 20) + ' V900" stroke="#7a5230" stroke-width="4"/>'; return o; })();
    [[380, '#a56b3a'], [1000, '#a56b3a'], [1620, '#a56b3a'], [2240, '#a56b3a']].forEach(function (s) { near += '<rect x="' + (s[0] - 280) + '" y="' + (GY - 120) + '" width="560" height="22" rx="8" fill="#7a5230"/><rect x="' + (s[0] - 280) + '" y="' + (GY - 340) + '" width="560" height="22" rx="8" fill="#7a5230"/>'; });
    near += post(160, GY + 40, 'Mimbleton', -1) + post(W - 160, GY + 40, 'Mimbleton', 1);
    var T = [['breathe', 200, '🌬️', '#bfe8ff'], ['ground', 440, '🌿', '#b9e8a8'], ['water', 700, '💧', '#9fe0ff'], ['hug', 960, '🦋', '#ffc2e6'], ['skills', 1220, '🧰', '#ffd27a'], ['reflect', 1480, '🔍', '#d9c9ff'], ['journal', 1740, '📓', '#ffb8a0'], ['feel', 2000, '💜', '#e6c9ff'], ['rewards', 2260, '🪶', '#fff0a0'], ['feed', 2520, '🐛', '#c9f0a0']];
    var things = T.map(function (t, k) { var y = k % 2 ? GY - 120 : GY - 340; return { x: t[1], y: y, art: '<g><ellipse cx="0" cy="8" rx="64" ry="14" fill="#000" opacity=".15"/><circle cy="-52" r="56" fill="' + t[3] + '" stroke="#fff" stroke-width="6"/><circle cy="-52" r="70" fill="' + t[3] + '" opacity=".35" class="sv-glow"/><text y="-36" text-anchor="middle" font-size="58">' + t[2] + '</text></g>', hit: [-70, -120, 140, 140], kind: 'tool', tool: t[0], label: TOOLS[t[0]][1] }; });
    return { W: W, sky: sky, far: far, mid: '', near: near, fg: '', ambient: 'dust', things: things, res: [], disc: [], noDisc: true, tools: true };
  };

  SCENES['reward-tracker'] = function () {
    var W = 2400, sky = '<defs><linearGradient id="rtSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe8ff"/><stop offset="1" stop-color="#fff1d6"/></linearGradient></defs><rect width="1600" height="900" fill="url(#rtSky)"/>' + cloud(300, 160, 1.3) + cloud(1100, 220, 1);
    var far = ridge(540, 100, '#b8d8f0', 3, W, 260);
    var mid = ridge(640, 80, '#8fd0a8', 6, W, 220);
    var near = '<rect y="' + GY + '" width="' + W + '" height="200" fill="#8bd09c"/>' + grass(W, GY, ['#a4e3a9', '#7fd28f'], 5, 46, 120) + '<path d="M0 ' + (GY + 60) + ' Q600 ' + (GY + 20) + ' ' + W + ' ' + (GY + 70) + '" fill="none" stroke="#f6e2bd" stroke-width="30" stroke-linecap="round"/>';
    near += post(160, GY + 30, 'Mimbleton', -1) + post(W - 160, GY + 30, 'Mimbleton', 1);
    function jar(x, col, icon, id, label, href) { return { x: x, y: GY + 20, art: '<ellipse cx="0" cy="12" rx="110" ry="20" fill="#000" opacity=".14"/><path d="M-90 0 q-24-170 20-250 h140 q44 80 20 250z" fill="#fff" fill-opacity=".55" stroke="#5aa7bd" stroke-width="6"/><path d="M-84 0 q-14-80 0-150 h168 q14 70 0 150z" fill="' + col + '" opacity=".85"/><rect x="-64" y="-282" width="128" height="34" rx="10" fill="#c79a5f"/><text y="-130" text-anchor="middle" font-size="64">' + icon + '</text><text id="' + id + '" y="-60" text-anchor="middle" font-size="58" font-weight="900" fill="#4a3a66">0</text><text y="-24" text-anchor="middle" font-size="24" font-weight="900" fill="#4a3a66">' + label + '</text>', hit: [-100, -290, 200, 310], kind: 'go', href: href, label: label }; }
    var things = [jar(520, '#ffe27a', '🪶', 'rtF', 'feathers', 'rewards.html'), jar(1000, '#a8e6a0', '🐛', 'rtB', 'bugs found', 'bird-growth.html#feed'), jar(1480, '#c9b6ff', '🌱', 'rtG', 'growth points', 'bird-growth.html'), jar(1960, '#ffb8d9', '👒', 'rtC', 'closet', 'closet.html')];
    return { W: W, sky: sky, far: far, mid: mid, near: near, fg: '', ambient: 'bubbles', things: things, res: [], disc: [], noDisc: true, stats: true };
  };

  /* ───────── engine ───────── */
  var root, stage, svg, gSky, gFar, gMid, gNear, gFg, gFx, bubble, toast, hud, S = null, audio = null, muted = false, reduce = false, raf = 0, lastT = 0, dragged = false;
  try { muted = localStorage.getItem('ventpals_world_mute') === '1'; } catch (e) {}
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function css() {
    if (document.getElementById('svCss')) return;
    var s = document.createElement('style'); s.id = 'svCss';
    s.textContent = '#sceneView{position:fixed;inset:0;z-index:55;background:#222;opacity:0;pointer-events:none;transition:opacity .35s ease;font-family:Nunito,system-ui,sans-serif}' +
      '#sceneView.on{opacity:1;pointer-events:auto}#sceneView[hidden]{display:none}' +
      '.sv-stage{position:absolute;inset:0;overflow:hidden;touch-action:pan-y;cursor:grab;user-select:none}.sv-stage:active{cursor:grabbing}.sv-svg{width:100%;height:100%;display:block}' +
      '.sv-hud{position:absolute;top:0;left:0;right:0;display:flex;gap:10px;align-items:center;padding:12px;pointer-events:none}.sv-hud>*{pointer-events:auto}' +
      '.sv-btn{border:0;border-radius:999px;background:rgba(255,255,255,.92);color:#59447f;font-weight:900;font-size:15px;padding:10px 16px;box-shadow:0 6px 16px rgba(40,30,70,.25);cursor:pointer;text-decoration:none;display:inline-flex;gap:6px;align-items:center}.sv-btn:hover{background:#fff}.sv-btn:focus-visible{outline:3px solid #7958b8}' +
      '.sv-title{flex:1;text-align:center;pointer-events:none!important}.sv-title span{display:inline-block;background:rgba(255,255,255,.88);color:#59447f;border-radius:999px;padding:8px 20px;font-weight:900;font-size:19px;box-shadow:0 6px 16px rgba(40,30,70,.2)}' +
      '.sv-arrow{position:absolute;top:50%;width:54px;height:54px;margin-top:-27px;border-radius:50%;border:0;background:rgba(255,255,255,.8);color:#59447f;font-size:26px;font-weight:900;cursor:pointer;box-shadow:0 6px 16px rgba(40,30,70,.25)}.sv-arrow:hover{background:#fff}.sv-arrow[hidden]{display:none}.sv-l{left:12px}.sv-r{right:12px}' +
      '.sv-hint{position:absolute;left:50%;bottom:92px;transform:translateX(-50%);background:rgba(255,255,255,.9);color:#59447f;font-weight:900;border-radius:999px;padding:10px 18px;font-size:14px;transition:opacity .6s;pointer-events:none;white-space:nowrap}.sv-hint.off{opacity:0}' +
      '.sv-count{position:absolute;left:12px;bottom:92px;background:rgba(255,255,255,.9);color:#59447f;font-weight:900;border-radius:999px;padding:8px 14px;font-size:14px}' +
      '.sv-bubble{position:absolute;z-index:3;width:min(300px,86vw);background:#fffdfb;border:4px solid #cdb6ef;border-radius:22px;padding:12px 14px 14px;box-shadow:0 14px 34px rgba(40,30,70,.35);color:#4a3a66;text-align:center}.sv-bubble[hidden]{display:none}' +
      '.sv-bubble h4{font-weight:900;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#8a6fc0;margin:0 0 4px}.sv-bubble p{font-weight:800;font-size:15px;line-height:1.35;margin:0 0 10px}' +
      '.sv-tools{display:flex;gap:8px;justify-content:center}.sv-tool{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;text-decoration:none;background:#f3ecff;border-radius:16px;padding:8px 4px;color:#59447f;font-weight:900;font-size:11px;line-height:1.1;transition:transform .15s,background .15s}.sv-tool:hover,.sv-tool:focus-visible{background:#e5d8ff;transform:translateY(-3px);outline:none}.sv-tool b{font-size:26px;font-weight:400}' +
      '.sv-x{position:absolute;top:4px;right:8px;border:0;background:none;font-size:20px;font-weight:900;color:#8a6fc0;cursor:pointer}' +
      '.sv-toast{position:absolute;left:50%;top:78px;transform:translateX(-50%) translateY(-8px);background:#fffdfb;border:3px solid #ffd27a;color:#59447f;font-weight:900;border-radius:999px;padding:9px 18px;opacity:0;transition:all .3s;pointer-events:none;font-size:15px;max-width:90vw;text-align:center}.sv-toast.on{opacity:1;transform:translateX(-50%)}' +
      '.sv-res,.sv-thing,.sv-glint,.sv-sign{cursor:pointer;outline:none}.sv-res:focus-visible .rb,.sv-thing:focus-visible,.sv-glint:focus-visible{filter:drop-shadow(0 0 10px #7958b8)}' +
      '.sv-res:hover .rb{filter:drop-shadow(0 0 8px #fff7b8)}.rb{transform-box:fill-box;transform-origin:50% 100%}.sv-res.walk .rb{animation:svStep .4s ease-in-out infinite}.sv-res.idle .rb{animation:svBob 3.2s ease-in-out infinite}.sv-res.hop .rb{animation:svHop .6s ease-out}' +
      '.sv-thing:hover .art{filter:brightness(1.1) drop-shadow(0 0 8px #fff7b8)}.sv-glint .st{animation:svTw 2.4s ease-in-out infinite;transform-box:fill-box;transform-origin:center;filter:drop-shadow(0 0 6px #fff3a0)}.sv-glint.found .st{animation:none;opacity:.7;filter:none}' +
      '.sv-sway{animation:svSway 5s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 100%}.sv-twinkle{animation:svTw 3s ease-in-out infinite;transform-box:fill-box;transform-origin:center}.sv-float{animation:svFloat 8s ease-in-out infinite alternate}.sv-glow{animation:svGlow 3.4s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:center}' +
      '.sv-flow{animation:svFlow 6s linear infinite}.sv-fall{animation:svFall 1.2s linear infinite}.sv-swing,.sv-lantern{transform-box:fill-box}.sv-swing.ring{animation:svRing 1.2s ease-out}.sv-boat{animation:svBoat 6s ease-in-out infinite alternate}.sv-ringpulse circle{animation:svGlow 3s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:center}' +
      '.sv-thing.lit .sv-glow{opacity:.75!important;animation:none}.sv-thing.hop{animation:svHop .6s ease-out}.sv-swing{transform-origin:50% 0}.swg{transform-box:fill-box;transform-origin:50% 0}.sv-swinging{animation:svRing 2s ease-out;transform-box:fill-box;transform-origin:50% 0}' +
      '@keyframes svStep{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-8px) rotate(3deg)}}@keyframes svBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}@keyframes svHop{0%{transform:translateY(0)}35%{transform:translateY(-34px) scale(1.06)}70%{transform:translateY(0) scale(.96,1.04)}100%{transform:none}}' +
      '@keyframes svSway{from{transform:rotate(-2.5deg)}to{transform:rotate(2.5deg)}}@keyframes svTw{0%,100%{opacity:.3;transform:scale(.7)}50%{opacity:1;transform:scale(1.15)}}@keyframes svFloat{from{transform:translate(0,0)}to{transform:translate(26px,-34px)}}@keyframes svGlow{from{opacity:.25;transform:scale(.92)}to{opacity:.7;transform:scale(1.08)}}' +
      '@keyframes svFlow{from{transform:translateX(0)}to{transform:translateX(120px)}}@keyframes svFall{to{stroke-dashoffset:-64}}@keyframes svRing{0%{transform:rotate(0)}15%{transform:rotate(18deg)}35%{transform:rotate(-14deg)}55%{transform:rotate(9deg)}75%{transform:rotate(-5deg)}100%{transform:rotate(0)}}@keyframes svBoat{from{transform:translateX(-30px)}to{transform:translateX(50px)}}' +
      '@media(prefers-reduced-motion:reduce){#sceneView *{animation:none!important;transition:none!important}}' +
      '@media(max-width:640px){.sv-btn{padding:9px 12px;font-size:13px}.sv-title span{font-size:15px;padding:7px 12px}.sv-arrow{width:44px;height:44px;margin-top:-22px}.sv-hint{font-size:12px;bottom:84px}.sv-count{bottom:136px}}';
    document.head.appendChild(s);
  }
  function mk(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function dom() {
    if (root) return; css();
    root = document.createElement('div'); root.id = 'sceneView'; root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Inside Mimbleton');
    root.innerHTML = '<div class="sv-stage"><svg class="sv-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"></svg></div>' +
      '<div class="sv-hud"><button type="button" class="sv-btn" id="svBack">← Mimbleton map</button><div class="sv-title"><span id="svName"></span></div><button type="button" class="sv-btn" id="svAbout" aria-label="About this place">ⓘ</button><button type="button" class="sv-btn" id="svMute" aria-label="Sound">🔔</button></div>' +
      '<button type="button" class="sv-arrow sv-l" id="svL" aria-label="Walk left">‹</button><button type="button" class="sv-arrow sv-r" id="svR" aria-label="Walk right">›</button>' +
      '<div class="sv-hint" id="svHint">Drag, swipe or use the arrows to walk • Tap friends and things</div><div class="sv-count" id="svCount" hidden></div><div class="sv-bubble" id="svBubble" hidden></div><div class="sv-toast" id="svToast" role="status" aria-live="polite"></div>';
    document.body.appendChild(root);
    stage = root.querySelector('.sv-stage'); svg = root.querySelector('svg'); bubble = root.querySelector('#svBubble'); toast = root.querySelector('#svToast');
    root.querySelector('#svBack').addEventListener('click', function () { exit(); });
    root.querySelector('#svAbout').addEventListener('click', function () { if (cfg.onAbout && S) cfg.onAbout(S.id); });
    var mb = root.querySelector('#svMute'); function paintMute() { mb.textContent = muted ? '🔕' : '🔔'; mb.setAttribute('aria-pressed', String(muted)); } paintMute();
    mb.addEventListener('click', function () { muted = !muted; try { localStorage.setItem('ventpals_world_mute', muted ? '1' : '0'); } catch (e) {} paintMute(); });
    var hold = 0; function go(d) { if (S) S.camT = clamp(S.camT + d * 520); }
    root.querySelector('#svL').addEventListener('click', function () { go(-1); }); root.querySelector('#svR').addEventListener('click', function () { go(1); });
    // drag to walk
    var down = null;
    stage.addEventListener('pointerdown', function (e) { down = { x: e.clientX, cam: S ? S.camT : 0, id: e.pointerId }; dragged = false; });
    window.addEventListener('pointermove', function (e) { if (!down || !S) return; var dx = e.clientX - down.x; if (Math.abs(dx) > 7) { dragged = true; bubbleHide(); } if (dragged) S.camT = clamp(down.cam - dx * (visW() / stage.clientWidth)); });
    window.addEventListener('pointerup', function () { down = null; setTimeout(function () { dragged = false; }, 30); });
    stage.addEventListener('click', onStageClick);
    stage.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { var t = e.target.closest && e.target.closest('.sv-res,.sv-thing,.sv-glint'); if (t) { e.preventDefault(); activate(t); } } });
    document.addEventListener('keydown', function (e) {
      if (!S || root.hidden) return;
      if (document.querySelector('#zonePanel.open,#infoModal.open')) return;
      if (e.key === 'Escape') { if (!bubble.hidden) bubbleHide(); else exit(); }
      else if (e.key === 'ArrowLeft') go(-.6); else if (e.key === 'ArrowRight') go(.6);
    });
    window.addEventListener('resize', function () { bubbleHide(); });
  }
  function visW() { var r = stage.getBoundingClientRect(); return Math.min(VW, r.width * VH / r.height); }
  function clamp(c) { return Math.max(0, Math.min(S.W - visW(), c)); }

  function sfx(freq, dur, type, vol) {
    if (muted) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume();
      var o = audio.createOscillator(), g = audio.createGain(); o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, audio.currentTime); g.gain.linearRampToValueAtTime(vol || .12, audio.currentTime + .02); g.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + (dur || .9));
      o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime + (dur || .9) + .05);
    } catch (e) {}
  }
  function say(msg) { toast.textContent = msg; toast.classList.add('on'); clearTimeout(say.t); say.t = setTimeout(function () { toast.classList.remove('on'); }, 2600); }
  function burst(x, y, cols, n) {
    if (reduce) return; n = n || 10;
    for (var i = 0; i < n; i++) {
      var c = mk('circle', { cx: x, cy: y, r: 5 + Math.random() * 6, fill: cols[i % cols.length] }, gFx), a = Math.random() * 6.28, d = 50 + Math.random() * 90;
      var an = c.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: 'translate(' + Math.cos(a) * d + 'px,' + (Math.sin(a) * d - 40) + 'px)', opacity: 0 }], { duration: 900 + Math.random() * 400, easing: 'ease-out' });
      an.onfinish = (function (cc) { return function () { cc.remove(); }; })(c);
    }
  }
  function ring(x, y, col) {
    if (reduce) return; var c = mk('circle', { cx: x, cy: y, r: 10, fill: 'none', stroke: col || '#fff', 'stroke-width': 6 }, gFx);
    var an = c.animate([{ transform: 'scale(1)', opacity: .9 }, { transform: 'scale(9)', opacity: 0 }], { duration: 1100, easing: 'ease-out' }); c.style.transformOrigin = x + 'px ' + y + 'px'; an.onfinish = function () { c.remove(); };
  }
  function floatWord(x, y, txt, col) {
    var t = mk('text', { x: x, y: y, 'text-anchor': 'middle', 'font-size': 44, 'font-weight': 900, fill: col || '#fff', stroke: '#4a3a66', 'stroke-width': 7, 'paint-order': 'stroke' }, gFx); t.textContent = txt;
    if (t.animate) { var an = t.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-90px)', opacity: 0 }], { duration: 1600, easing: 'ease-out' }); an.onfinish = function () { t.remove(); }; } else setTimeout(function () { t.remove(); }, 1600);
  }

  /* bubble anchored over an element */
  function bubbleHide() { if (bubble) bubble.hidden = true; if (S) S.talking = null; }
  function bubbleShow(el, head, text, toolKeys, extra) {
    var h = '<button type="button" class="sv-x" aria-label="Close">×</button><h4>' + esc(head) + '</h4><p>' + esc(text) + '</p>';
    if (toolKeys && toolKeys.length) h += '<div class="sv-tools">' + toolKeys.map(function (k) { var t = TOOLS[k]; return '<a class="sv-tool" href="' + t[2] + '"><b aria-hidden="true">' + t[0] + '</b>' + esc(t[1]) + '</a>'; }).join('') + '</div>';
    if (extra) h += extra;
    bubble.innerHTML = h; bubble.hidden = false; bubble.querySelector('.sv-x').addEventListener('click', bubbleHide);
    var r = el.getBoundingClientRect(), sr = stage.getBoundingClientRect(), bw = bubble.offsetWidth, bh = bubble.offsetHeight;
    var left = Math.max(10, Math.min(sr.width - bw - 10, r.left + r.width / 2 - bw / 2)), top = r.top - bh - 12;
    if (top < 70) top = Math.min(sr.height - bh - 10, r.bottom + 12);
    bubble.style.left = left + 'px'; bubble.style.top = top + 'px';
  }

  /* ───────── activation ───────── */
  function onStageClick(e) {
    if (dragged) return;
    var t = e.target.closest && e.target.closest('.sv-res,.sv-thing,.sv-glint,.sv-sign');
    if (t) { activate(t); return; }
    if (!e.target.closest('.sv-bubble')) { bubbleHide(); // tap the ground to wander toward it
      var sr = stage.getBoundingClientRect(), vx = (e.clientX - sr.left) / sr.width * visW(); S.camT = clamp(S.camT + (vx - visW() / 2) * .8); }
  }
  function activate(el) {
    if (!S) return;
    if (el.classList.contains('sv-res')) return talkTo(el.getAttribute('data-bird'), el);
    if (el.classList.contains('sv-glint')) return discover(el);
    if (el.classList.contains('sv-sign')) return travel(el.getAttribute('data-to'));
    var th = S.things[+el.getAttribute('data-i')]; if (!th) return; var fx = th.x, fy = th.y; bubbleHide();
    switch (th.kind) {
      case 'sign': travel(th.to); break;
      case 'lantern': el.classList.toggle('lit'); sfx(th.note, 1.2, 'triangle'); burst(fx, fy, ['#fff0a0', '#ffd27a'], 8); say(el.classList.contains('lit') ? 'The lantern glows brighter!' : 'The lantern rests.'); break;
      case 'swing': sfx(262, .8, 'sine', .08); say('Wheee! Back and forth…'); var sw = el.querySelector('.swg'); if (sw) { sw.classList.remove('sv-swinging'); void sw.getBoundingClientRect(); sw.classList.add('sv-swinging'); } break;
      case 'leaves': burst(fx, fy - 20, ['#e8b94e', '#e98a4e', '#c96a3c', '#d9a441'], 18); sfx(300, .4, 'triangle', .08); say('Crunchy, cozy leaves!'); break;
      case 'tree': var t = th.cols, k = (th._k = ((th._k || 0) + 1) % FEEL.length), f = FEEL[k], crown = svg.querySelectorAll('.ff-crown')[th.tree]; if (crown) crown.querySelectorAll('circle').forEach(function (c, i) { c.setAttribute('fill', i < 2 ? f[1] : f[2]); }); burst(fx, fy + 60, [f[1], f[2], '#fff'], 14); floatWord(fx, fy + 100, f[0], f[1]); sfx(f[3], 1, 'sine'); bubbleShow(el, 'This tree feels', f[0] + '. ' + f[4], ['feel']); break;
      case 'bounce': burst(fx, fy - 40, ['#ff9ec2', '#ffe27a', '#8fd6ff'], 10); sfx(th.note, .5, 'square', .05); el.firstChild && el.classList.add('bump'); say('Boing!'); break;
      case 'crystal': sfx(th.note, 1.6, 'sine', .14); ring(fx, fy - 60, '#c9b6ff'); burst(fx, fy - 70, ['#fff', '#c9b6ff', '#9ee6ff'], 8); break;
      case 'echo': sfx(330, .6, 'sine', .1); ring(fx, fy - 40, '#c9b6ff'); floatWord(fx, fy - 90, 'Hello…', '#fff'); setTimeout(function () { sfx(330, .5, 'sine', .06); floatWord(fx, fy - 140, 'hello…', '#d9c9ff'); ring(fx, fy - 40, '#9ee6ff'); }, 700); setTimeout(function () { sfx(330, .4, 'sine', .03); floatWord(fx, fy - 190, 'hello…', '#b9a8ff'); }, 1400); break;
      case 'ripple': sfx(th.note, 1.4, 'sine', .1); ring(fx, fy, '#fff'); setTimeout(function () { ring(fx + 40, fy, '#a6ecff'); }, 250); say('Plink. The pool ripples.'); break;
      case 'hill': say('From up here the whole meadow glows.'); sfx(523, 1, 'sine', .08); burst(fx, fy, ['#fff0a0', '#ffe27a'], 10); break;
      case 'bell': el.querySelector('.sv-swing') && (el.querySelector('.sv-swing').classList.remove('ring'), void el.offsetWidth, el.querySelector('.sv-swing').classList.add('ring')); sfx(th.note, 2, 'sine', .14); sfx(th.note * 2, 1.2, 'sine', .05); ring(fx, fy, '#fff6a8'); say('Ding… the breeze rings the bell.'); break;
      case 'scope': say('You can see all of Mimbleton from here!'); sfx(392, .6, 'triangle', .08); break;
      case 'stone': sfx(th.note, .5, 'triangle', .1); ring(fx, fy + 10, '#fff'); burst(fx, fy, ['#fff', '#a6ecff'], 8); el.classList.add('hop'); setTimeout(function () { el.classList.remove('hop'); }, 700); break;
      case 'jar': say('Feathers saved: ' + (feathers() || 0)); bubbleShow(el, 'Feather jar', 'Every feather you collect ends up here.', ['rewards', 'closet']); break;
      case 'tool': var tl = TOOLS[th.tool]; sfx(440, .6, 'sine', .1); burst(fx, fy - 60, ['#fff', '#ffd27a'], 8); bubbleShow(el, tl[1], toolBlurb(th.tool), [th.tool]); break;
      case 'go': sfx(440, .6, 'sine', .1); bubbleShow(el, th.label, jarBlurb(th.label), [jarTool(th.href)]); break;
    }
  }
  var FEEL = [['Joyful', '#f5b23d', '#ffd27a', 523, 'Bright and bubbly, like sunshine in your tummy.'], ['Calm', '#5ab8f0', '#8fd6ff', 392, 'Slow and soft, like floating on a lake.'], ['Silly', '#ff7aa8', '#ff9ec2', 659, 'Giggly and wiggly. Silly is a feeling too!'], ['Brave', '#f06a3c', '#ff9a62', 330, 'Strong inside, even if you feel a little shaky.'], ['Gentle', '#9272e8', '#b79bff', 294, 'Soft and kind, to others and to yourself.'], ['Worried', '#6f7fb8', '#9fb0e8', 262, 'Buzzy and tight. Naming it helps it shrink.']];
  var TB = { breathe: 'Smell the flower, blow out the candle.', ground: 'Find five things you can see.', water: 'A sip of water helps a busy body settle.', hug: 'Wrap your arms and tap, tap, tap.', skills: 'Pick a skill that fits how you feel.', reflect: 'Look back at your feelings so far.', journal: 'Write or draw what is on your mind.', feel: 'Colour a feeling and give it a name.', rewards: 'See your feathers and what they can buy.', feed: 'Your bird is hungry for the bugs you found.' };
  function toolBlurb(k) { return TB[k] || 'Give it a try.'; }
  function jarBlurb(l) { return { feathers: 'Feathers you have collected.', 'bugs found': 'Every bug you found along the way.', 'growth points': 'How much your bird has grown.', closet: 'Dress up your bird with your feathers.' }[l] || ''; }
  function jarTool(h) { for (var k in TOOLS) if (TOOLS[k][2] === h) return k; return 'rewards'; }
  function feathers() { try { var f = window.VPGrowth.getFeathers(); return typeof f === 'number' ? f : (f && (f.balance != null ? f.balance : f.earned - f.spent)) || 0; } catch (e) { return 0; } }
  function stats() { try { return window.VPGrowth.getRainbowSummary(); } catch (e) { return { points: 0, bugsFound: 0 }; } }

  function talkTo(bird, el) {
    var d = RES[bird]; if (!d) return; var r = S.res[bird]; if (r) { r.pause = 4; r.g.classList.remove('hop'); void r.g.offsetWidth; r.g.classList.add('hop'); }
    sfx(520 + Math.random() * 160, .35, 'triangle', .08); burst(r.x, r.y - 150, ['#fff6a8', '#ffd27a'], 6);
    S.talking = bird; bubbleShow(el, cap(bird), d[0], d[1]);
  }
  function discover(el) {
    var id = el.getAttribute('data-id'), z = cfg.zones.filter(function (x) { return x.id === S.id; })[0], i = +el.getAttribute('data-n'), p = z && z.discoveries[i];
    var first = !cfg.found[id]; cfg.found[id] = true; cfg.saveFound(); el.classList.add('found'); sfx(660, .8, 'sine', .1); sfx(880, .8, 'sine', .06); countUpdate(); if (cfg.onFound) cfg.onFound(id);
    var r = el.getBoundingClientRect(); burst(+el.getAttribute('data-x'), +el.getAttribute('data-y'), ['#fff6a8', '#9be6b4', '#fff'], 12);
    bubbleShow(el, first ? 'You found a place!' : 'A place you found', (p ? p.name + ': ' + p.detail : 'A little discovery.'), null);
  }
  function countUpdate() {
    var c = root.querySelector('#svCount'); if (!S || S.b.noDisc) { c.hidden = true; return; }
    var n = 0; for (var i = 0; i < 3; i++) if (cfg.found[S.id + ':' + i]) n++; c.hidden = false; c.textContent = '✧ Sparkles found ' + n + ' of 3';
  }

  /* ───────── build + run ───────── */
  function layerG(parent) { return mk('g', {}, parent); }
  function build(id, opts) {
    var b = SCENES[id](id === 'tools-shed' || id === 'reward-tracker' ? 0 : 3600);
    svg.innerHTML = ''; var W = b.W;
    gSky = layerG(svg); gFar = layerG(svg); gMid = layerG(svg); gNear = layerG(svg); gFg = layerG(svg);
    gSky.innerHTML = b.sky; gFar.innerHTML = b.far; gMid.innerHTML = b.mid; gNear.innerHTML = '<g class="nr">' + b.near + '</g>';
    var gThings = mk('g', {}, gNear), gRes = mk('g', {}, gNear), gDisc = mk('g', {}, gNear); gFx = mk('g', { 'pointer-events': 'none' }, gNear);
    gFg.innerHTML = b.fg; gFg.setAttribute('pointer-events', 'none');
    S = { id: id, W: W, cam: 0, camT: 0, things: b.things, res: {}, b: b, ambient: [] };
    b.things.forEach(function (t, i) {
      var g = mk('g', { 'class': 'sv-thing', role: 'button', tabindex: 0, 'data-i': i, 'aria-label': t.label || 'Something to touch' }, gThings);
      g.innerHTML = '<g class="art" transform="translate(' + t.x + ' ' + t.y + ')">' + (t.art || '') + '</g>';
      var h = t.hit || [-50, -100, 100, 120]; var hr = mk('rect', { x: t.x + h[0], y: t.y + h[1], width: h[2], height: h[3], fill: 'transparent' }, g);
    });
    var feather = [];
    b.res.forEach(function (r) {
      var sc = .78 + (r.y - 640) / 260 * .42, hgt = 230 * sc;
      var g = mk('g', { 'class': 'sv-res idle', role: 'button', tabindex: 0, 'data-bird': r.bird, 'aria-label': 'Say hello to ' + cap(r.bird) }, gRes);
      g.innerHTML = '<ellipse cx="0" cy="0" rx="' + (hgt * .34) + '" ry="' + (hgt * .06) + '" fill="#2d3a4a" opacity=".25"/><g class="rb"><image href="' + SPR + r.bird + '.png" x="' + (-hgt / 2) + '" y="' + (-hgt) + '" width="' + hgt + '" height="' + hgt + '" preserveAspectRatio="xMidYMax meet"/></g><circle cx="0" cy="' + (-hgt / 2) + '" r="' + (hgt * .55) + '" fill="transparent"/>';
      S.res[r.bird] = { g: g, x: r.x, y: r.y, hx: r.x, dir: 1, tx: r.x, pause: 1 + Math.random() * 3, sc: sc };
      place(S.res[r.bird]);
    });
    if (!b.noDisc) b.disc.forEach(function (p, i) {
      var did = id + ':' + i, g = mk('g', { 'class': 'sv-glint' + (cfg.found[did] ? ' found' : ''), role: 'button', tabindex: 0, 'data-id': did, 'data-n': i, 'data-x': p[0], 'data-y': p[1], 'aria-label': 'A sparkle to investigate' }, gDisc);
      g.innerHTML = '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="34" fill="transparent"/><path class="st" transform="translate(' + p[0] + ' ' + p[1] + ') scale(1.5)" d="M0 -17 L4 -5 L16 0 L4 5 L0 17 L-4 5 L-16 0 L-4 -5Z" fill="#fff6a8" stroke="#fff" stroke-width="2"/>';
    });
    // signposts reach the neighbouring habitat
    var idx = ORDER.indexOf(id);
    if (idx > -1) { // the posts drawn in `near` are decor; clickable hit areas sit over them
      [[-1, (b.signX || [160])[0], ORDER[(idx + ORDER.length - 1) % ORDER.length]], [1, (b.signX || [0, W - 160])[1], ORDER[(idx + 1) % ORDER.length]]].forEach(function (s) {
        var g = mk('g', { 'class': 'sv-sign', role: 'button', tabindex: 0, 'data-to': s[2], 'aria-label': 'Walk to ' + NAMES[s[2]] }, gThings);
        mk('rect', { x: s[1] + (s[0] < 0 ? -260 : -20), y: GY - 120, width: 280, height: 160, fill: 'transparent' }, g);
      });
    } else {
      [[-1, 160], [1, W - 160]].forEach(function (s) { var g = mk('g', { 'class': 'sv-sign', role: 'button', tabindex: 0, 'data-to': '__map', 'aria-label': 'Back to the map' }, gThings); mk('rect', { x: s[1] + (s[0] < 0 ? -260 : -20), y: GY - 120, width: 280, height: 160, fill: 'transparent' }, g); });
    }
    // ambient life
    if (!reduce) ambient(b.ambient, W);
    // opening camera
    var start = 0, f = opts && opts.focus && S.res[opts.focus];
    if (f) start = f.x - visW() / 2; else { var k0 = b.res[0]; start = k0 ? k0.x - visW() / 2 - 200 : 0; }
    S.cam = S.camT = clamp(start);
    if (b.stats) { var s = stats(); setNum('rtF', feathers()); setNum('rtB', s.bugsFound || 0); setNum('rtG', s.points || 0); setNum('rtC', ''); }
    if (id === 'sparkle-stream') setNum('svJarNum', feathers());
    // fireflies to catch
    if (b.ambient === 'catch') { S.catchN = 0; spawnFireflies(W); }
    root.querySelector('#svName').textContent = NAMES[id];
    root.querySelector('#svAbout').hidden = !cfg.zones.some(function (z) { return z.id === id; });
    countUpdate();
  }
  function setNum(id, v) { var e = svg.querySelector('#' + id); if (e) e.textContent = v; }
  function ambient(kind, W) {
    var col = { leaves: ['#f6d57a', '#ffb87a', '#9ee6a0'], glow: ['#b9a8ff', '#9ee6ff'], clouds: ['#fff'], bubbles: ['#fff', '#cff7ff'], dust: ['#fff6bb'], catch: [] }[kind] || ['#fff'], o = '';
    srand(77); for (var i = 0; i < 26; i++) { var c = col[i % col.length]; if (!c) break; o += '<circle class="sv-float" style="animation-delay:' + (-R(0, 8)).toFixed(1) + 's;animation-duration:' + R(5, 11).toFixed(1) + 's" cx="' + R(0, W).toFixed(0) + '" cy="' + R(100, 800).toFixed(0) + '" r="' + R(3, 7).toFixed(1) + '" fill="' + c + '" opacity=".75"/>'; }
    var g = mk('g', { 'pointer-events': 'none' }, gNear); g.innerHTML = o;
  }
  function spawnFireflies(W) {
    var g = mk('g', {}, gNear); S.flies = [];
    srand(55); for (var i = 0; i < 16; i++) {
      var f = { x: R(300, W - 300), y: R(300, 680), vx: R(-20, 20), vy: R(-12, 12), el: mk('g', { 'class': 'sv-fly', role: 'button', tabindex: 0, 'aria-label': 'A firefly to catch' }, g) };
      f.el.innerHTML = '<circle r="40" fill="transparent"/><circle class="sv-glow" r="22" fill="#fff6a8" opacity=".45"/><circle r="7" fill="#fff9c4"/>'; f.el.style.cursor = 'pointer';
      (function (ff) { function catchIt(e) { e.stopPropagation(); if (ff.got) return; ff.got = true; S.catchN++; sfx(700 + S.catchN * 40, .7, 'sine', .1); burst(ff.x, ff.y, ['#fff6a8', '#ffe27a'], 10); ff.el.remove(); say('Caught a firefly! ' + S.catchN + ' of 16 (let them go, they love to dance).'); setTimeout(function () { if (!S) return; ff.got = false; ff.x = R(300, S.W - 300); ff.y = R(300, 680); ff.el = (function () { var e2 = mk('g', { 'class': 'sv-fly', role: 'button', tabindex: 0, 'aria-label': 'A firefly to catch' }, g); e2.innerHTML = '<circle r="40" fill="transparent"/><circle class="sv-glow" r="22" fill="#fff6a8" opacity=".45"/><circle r="7" fill="#fff9c4"/>'; e2.style.cursor = 'pointer'; e2.addEventListener('click', catchIt); return e2; })(); }, 6000); } ff.el.addEventListener('click', catchIt); })(f);
      S.flies.push(f);
    }
  }
  function place(r) {
    var s = r.sc; r.g.setAttribute('transform', 'translate(' + r.x.toFixed(1) + ' ' + r.y.toFixed(1) + ') scale(' + (r.dir > 0 ? -s : s).toFixed(3) + ' ' + s.toFixed(3) + ')');
  }
  function tick(ts) {
    if (!S) return; var dt = Math.min(.05, (ts - lastT) / 1000); lastT = ts;
    S.cam += (S.camT - S.cam) * Math.min(1, dt * (reduce ? 30 : 6));
    var vw = visW(), off = (VW - vw) / 2;
    gFar.setAttribute('transform', 'translate(' + (off - S.cam * .28).toFixed(1) + ' 0)'); gMid.setAttribute('transform', 'translate(' + (off - S.cam * .6).toFixed(1) + ' 0)');
    gNear.setAttribute('transform', 'translate(' + (off - S.cam).toFixed(1) + ' 0)'); gFg.setAttribute('transform', 'translate(' + (off - S.cam * 1.35).toFixed(1) + ' 0)');
    root.querySelector('#svL').hidden = S.camT <= 4; root.querySelector('#svR').hidden = S.camT >= S.W - vw - 4;
    if (!reduce) {
      Object.keys(S.res).forEach(function (k) {
        var r = S.res[k]; if (S.talking === k) { r.g.classList.remove('walk'); return; }
        if (r.pause > 0) { r.pause -= dt; r.g.classList.remove('walk'); r.g.classList.add('idle'); if (r.pause <= 0) r.tx = r.hx + (Math.random() * 2 - 1) * 160; return; }
        var dx = r.tx - r.x; if (Math.abs(dx) < 4) { r.pause = 2 + Math.random() * 4; return; }
        r.dir = dx > 0 ? 1 : -1; r.x += r.dir * 42 * dt; r.g.classList.add('walk'); r.g.classList.remove('idle'); place(r);
      });
      if (S.flies) S.flies.forEach(function (f) { if (f.got) return; f.x += f.vx * dt; f.y += f.vy * dt; if (Math.random() < dt * .8) { f.vx = R(-30, 30); f.vy = R(-20, 20); } f.x = Math.max(100, Math.min(S.W - 100, f.x)); f.y = Math.max(220, Math.min(700, f.y)); f.el.setAttribute('transform', 'translate(' + f.x.toFixed(1) + ' ' + f.y.toFixed(1) + ')'); });
    }
    raf = requestAnimationFrame(tick);
  }

  /* ───────── enter / travel / exit ───────── */
  function tabbar(on) { var t = document.getElementById('vp-tabbar'); if (t) t.style.display = on ? 'flex' : 'none'; }
  var fading = false;
  function enter(id, opts) {
    if (!SCENES[id]) return; dom(); opts = opts || {};
    var was = !root.hidden; root.hidden = false;
    var go = function () {
      build(id, opts); bubbleHide(); root.querySelector('#svHint').classList.remove('off'); clearTimeout(enter.h); enter.h = setTimeout(function () { root.querySelector('#svHint').classList.add('off'); }, 6000);
      document.body.style.overflow = 'hidden'; tabbar(false); cancelAnimationFrame(raf); lastT = performance.now(); raf = requestAnimationFrame(tick);
      root.classList.add('on'); root.querySelector('#svBack').focus({ preventScroll: true });
      if (opts.show) say('From the show: ' + opts.show);
      if (opts.focus && RES[opts.focus] && S.res[opts.focus]) setTimeout(function () { talkTo(opts.focus, S.res[opts.focus].g); }, 700);
      try { history.replaceState(null, '', location.pathname + '?place=' + id + (opts.focus ? '&home=' + opts.focus : '')); } catch (e) {}
    };
    if (was) { root.classList.remove('on'); fading = true; setTimeout(function () { fading = false; go(); }, 360); } else { requestAnimationFrame(go); }
  }
  function travel(to) {
    bubbleHide(); if (fading) return;
    if (to === '__map') return exit();
    sfx(392, .5, 'triangle', .08); enter(to, {});
  }
  function exit() {
    if (!root || root.hidden) return; cancelAnimationFrame(raf); bubbleHide();
    root.classList.remove('on'); setTimeout(function () { root.hidden = true; svg.innerHTML = ''; S = null; document.body.style.overflow = ''; tabbar(true); if (cfg.onExit) cfg.onExit(); }, 360);
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
  }
  function init(c) { for (var k in c) cfg[k] = c[k]; }

  window.MimbletonScenes = { init: init, enter: enter, exit: exit, SCENES: SCENES, RES: RES, TOOLS: TOOLS, NAMES: NAMES, ORDER: ORDER };
})();
