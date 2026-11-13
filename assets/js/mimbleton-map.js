/**
 * mimbleton-map.js: draws the one Mimbleton world map and brings it to life.
 *
 * Data first (so the world is easy to expand): HABITATS, HOMES, PATHS, DISCOVERIES, UNEXPLORED.
 * To add a region later, add an entry to UNEXPLORED (or promote it to a habitat) and a path that reaches it.
 *
 * Geography (one connected world, 1600 x 1000):
 *   Sky Bridge (top, between two cliffs) -> waterfall -> SPARKLE STREAM winds down through the whole world
 *   Nesting Tree (west) and Feelings Forest (south-west) sit on the stream's west bank,
 *   Firefly Meadow (south-east) on its east bank, Quiet Caves in the eastern mountain.
 *   Trails and bridges join every habitat in a ring; a high "cloud trail" joins the Bridge back to the Tree.
 */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg', XL = 'http://www.w3.org/1999/xlink';
  var W = 1600, H = 1000;
  var SPRITES = 'assets/world/sprites/';

  /* ───────────────── data ───────────────── */
  var HABITATS = {
    'nesting-tree':    { name: 'Nesting Tree',    halo: [300, 400, 230, 250], label: [300, 600, 'Nesting Tree',    '#315f48', '#74aa70'], gather: [330, 585] },
    'feelings-forest': { name: 'Feelings Forest', halo: [470, 760, 230, 140], label: [470, 880, 'Feelings Forest', '#315f48', '#5d9f79'], gather: [520, 790] },
    'quiet-caves':     { name: 'Quiet Caves',     halo: [1390, 580, 230, 190], label: [1390, 800, 'Quiet Caves',    '#3f4e7b', '#7987bb'], gather: [1300, 720] },
    'firefly-meadow':  { name: 'Firefly Meadow',  halo: [1060, 790, 210, 110], label: [1090, 930, 'Firefly Meadow', '#805b28', '#d7ae55'], gather: [1060, 800] },
    'sky-bridge':      { name: 'Sky Bridge',      halo: [1020, 215, 260, 130], label: [1020, 70,  'Sky Bridge',     '#356b82', '#82b9cb'], gather: [1020, 232] },
    'sparkle-stream':  { name: 'Sparkle Stream',  halo: [790, 640, 110, 190],  label: [700, 560, 'Sparkle Stream', '#286b7d', '#62b7c5'], gather: [790, 735] }
  };
  // bird id -> where its home is and what it looks like
  var HOMES = [
    { bird: 'clover',   zone: 'nesting-tree',    x: 205, y: 330, type: 'treehouse', c: '#f6d38c' },
    { bird: 'pebble',   zone: 'nesting-tree',    x: 268, y: 556, type: 'rootnook',  c: '#d9d2c4' },
    { bird: 'twig',     zone: 'nesting-tree',    x: 372, y: 290, type: 'branch',    c: '#c79b6b' },
    { bird: 'aura',     zone: 'feelings-forest', x: 395, y: 735, type: 'blossom',   c: '#f7b6d2' },
    { bird: 'breezy',   zone: 'feelings-forest', x: 520, y: 690, type: 'canopy',    c: '#a9dcf5' },
    { bird: 'flicker',  zone: 'feelings-forest', x: 565, y: 800, type: 'sunnest',   c: '#ffd75e' },
    { bird: 'drift',    zone: 'quiet-caves',     x: 1262, y: 690, type: 'cave',     c: '#79c4ff' },
    { bird: 'echo',     zone: 'quiet-caves',     x: 1345, y: 585, type: 'cave',     c: '#c5a2ff' },
    { bird: 'sable',    zone: 'quiet-caves',     x: 1450, y: 650, type: 'cave',     c: '#8b8cff' },
    { bird: 'lumen',    zone: 'quiet-caves',     x: 1505, y: 530, type: 'cave',     c: '#7ff0e0' },
    { bird: 'flamez',   zone: 'firefly-meadow',  x: 955,  y: 805, type: 'hut',      c: '#ff9a5a' },
    { bird: 'flare',    zone: 'firefly-meadow',  x: 1065, y: 745, type: 'lookout',  c: '#ffd36a' },
    { bird: 'solace',   zone: 'firefly-meadow',  x: 1170, y: 830, type: 'shelter',  c: '#8fd49a' },
    { bird: 'nova',     zone: 'sky-bridge',      x: 842,  y: 205, type: 'aerie',    c: '#dfe8ff' },
    { bird: 'guardian', zone: 'sky-bridge',      x: 1196, y: 200, type: 'roost',    c: '#b9c2d6' },
    { bird: 'cove',     zone: 'sparkle-stream',  x: 668,  y: 700, type: 'cottage',  c: '#9fdcf0' }
  ];
  // trails and bridges; each joins two habitats (used for drawing AND for birds walking to visit each other)
  var PATHS = [
    { id: 'tree-forest',   a: 'nesting-tree',    b: 'feelings-forest', d: 'M335 590 C340 650 390 690 470 745' },
    { id: 'forest-stream', a: 'feelings-forest', b: 'sparkle-stream',  d: 'M520 790 C590 790 650 775 720 745 S760 735 790 735' },
    { id: 'stream-meadow', a: 'sparkle-stream',  b: 'firefly-meadow',  d: 'M790 735 C850 735 900 790 960 805 S1030 805 1060 800' },
    { id: 'meadow-caves',  a: 'firefly-meadow',  b: 'quiet-caves',     d: 'M1060 800 C1150 800 1230 770 1300 720' },
    { id: 'caves-bridge',  a: 'quiet-caves',     b: 'sky-bridge',      d: 'M1300 720 C1360 600 1380 470 1290 380 S1120 280 1020 232' },
    { id: 'bridge-tree',   a: 'sky-bridge',      b: 'nesting-tree',    d: 'M1020 232 C900 160 650 170 520 250 S390 380 330 585', high: true }
  ];
  // discoveries: the 3 per habitat from the habitat panel, positioned on the map (index matches ZONES[].discoveries)
  var DISC_POS = {
    'nesting-tree':    [[255, 505], [160, 420], [330, 520]],
    'feelings-forest': [[430, 800], [600, 745], [330, 690]],
    'quiet-caves':     [[1310, 740], [1395, 605], [1480, 600]],
    'firefly-meadow':  [[1010, 850], [1120, 760], [905, 780]],
    'sky-bridge':      [[1070, 150], [960, 200], [1130, 235]],
    'sparkle-stream':  [[735, 640], [840, 690], [775, 800]]
  };
  // hidden story moments: tiny glints with no label. Short, warm, and sometimes a nudge toward an app tool.
  var HIDDEN = [
    { id: 'h-door',   zone: 'nesting-tree',    x: 232, y: 470, name: 'A tiny door in the roots',     text: 'Behind the roots is a door no taller than a pebble. Someone left a note: "Come back when you want to be brave."', action: { label: 'Visit your Nest', href: 'nest.html' } },
    { id: 'h-leaf',   zone: 'feelings-forest', x: 470, y: 660, name: 'A leaf that changed color',    text: 'One leaf turned from green to gold while you watched. Feelings change like that, too.', action: { label: 'Check in with a feeling', href: 'start-with-a-feeling.html?mode=check-in' } },
    { id: 'h-echo',   zone: 'quiet-caves',     x: 1420, y: 700, name: 'A whisper in the stone',       text: 'If you whisper something kind into this crack, the cave whispers it right back.', action: { label: 'Try calming skills', href: 'calming-skills.html' } },
    { id: 'h-spark',  zone: 'firefly-meadow',  x: 1240, y: 770, name: 'The firefly that waited',      text: 'One firefly is still glowing after sunset, waiting for someone to notice. It noticed you.', action: { label: 'Feed your bird', href: 'bird-growth.html#feed' } },
    { id: 'h-wind',   zone: 'sky-bridge',      x: 900,  y: 300, name: 'The wind bell',                text: 'A tiny bell rings when you take one slow breath beside it.', action: { label: 'Breathe with a skill', href: 'breathing.html' } },
    { id: 'h-pearl',  zone: 'sparkle-stream',  x: 700,  y: 850, name: 'A pearl in the pebbles',       text: 'The stream keeps a record of everything you have collected. Look closely and you will see it shine.', action: { label: 'See the Sparkle Stream', href: 'sparkle-stream.html' } }
  ];
  // places no one has explored yet: fog now, future adventures later
  var UNEXPLORED = [
    { id: 'beyond-peaks', x: 1490, y: 215, label: 'Beyond',   teaser: 'Snowy peaks rise out of the mist. No VentPal has been up there yet. A future adventure is waiting.' },
    { id: 'west-mist',    x: 95,   y: 760, label: '?',        teaser: 'A soft mist hangs over the far west. Something is stirring in there.' },
    { id: 'cloud-isles',  x: 560,  y: 100, label: '?',        teaser: 'Little clouds drift in a ring way up high. They look like they could hold a whole island.' },
    { id: 'river-mouth',  x: 1490, y: 945, label: '?',        teaser: 'The Sparkle Stream flows out of the map here. Where does it go? Nobody knows yet.' }
  ];

  /* ───────────────── helpers ───────────────── */
  var seed = 11; function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function R(a, b) { return a + rnd() * (b - a); }
  function sc(y) { return Math.max(.52, Math.min(1.35, .55 + (y - 250) / 800 * .8)); }
  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) { if (k === 'href') e.setAttributeNS(XL, 'href', attrs[k]); else e.setAttribute(k, attrs[k]); } if (parent) parent.appendChild(e); return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function cloud(x, y, s, o, cls) { return '<g class="' + cls + '" opacity="' + o + '" transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="#fff"><ellipse cx="0" cy="12" rx="90" ry="24"/><ellipse cx="-30" cy="-2" rx="48" ry="32"/><ellipse cx="22" cy="-12" rx="56" ry="38"/><ellipse cx="62" cy="6" rx="40" ry="26"/></g>'; }
  function leafCluster(cx, cy, r, fill, hi) {
    return '<g><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '"/><circle cx="' + (cx - r * .7) + '" cy="' + (cy + r * .25) + '" r="' + r * .72 + '" fill="' + fill + '"/><circle cx="' + (cx + r * .72) + '" cy="' + (cy + r * .2) + '" r="' + r * .7 + '" fill="' + fill + '"/><circle cx="' + (cx - r * .25) + '" cy="' + (cy - r * .45) + '" r="' + r * .45 + '" fill="' + hi + '" opacity=".55"/></g>';
  }
  function tree(x, base, h, leaf, hi, sway) {
    var w = h * .09;
    return '<g class="' + (sway ? 'sway' : '') + '" style="transform-origin:' + x + 'px ' + base + 'px"><ellipse cx="' + x + '" cy="' + base + '" rx="' + h * .24 + '" ry="' + h * .04 + '" fill="#2d4a40" opacity=".22"/>' +
      '<path d="M' + (x - w) + ' ' + base + ' Q' + x + ' ' + (base - h * .4) + ' ' + (x - w * .45) + ' ' + (base - h * .62) + ' L' + (x + w * .45) + ' ' + (base - h * .62) + ' Q' + x + ' ' + (base - h * .4) + ' ' + (x + w) + ' ' + base + 'Z" fill="#8a6044"/>' +
      leafCluster(x, base - h * .72, h * .26, leaf, hi) + leafCluster(x - h * .2, base - h * .58, h * .18, leaf, hi) + leafCluster(x + h * .21, base - h * .6, h * .17, leaf, hi) + '</g>';
  }

  /* ───────────────── static scenery ───────────────── */
  function defs() {
    return '<defs>' +
      '<linearGradient id="mmSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8eb2ff"/><stop offset=".42" stop-color="#e7d3ff"/><stop offset=".75" stop-color="#ffe4d6"/><stop offset="1" stop-color="#fff0c9"/></linearGradient>' +
      '<radialGradient id="mmSun"><stop offset="0" stop-color="#fffbe0"/><stop offset=".3" stop-color="#fff0a8" stop-opacity=".85"/><stop offset="1" stop-color="#fff0a8" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="mmFar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b5b0e6"/><stop offset="1" stop-color="#d9cff3"/></linearGradient>' +
      '<linearGradient id="mmMid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a7c6e0"/><stop offset="1" stop-color="#cfe0ee"/></linearGradient>' +
      '<linearGradient id="mmLand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a6dca0"/><stop offset=".55" stop-color="#7cc590"/><stop offset="1" stop-color="#5aa88a"/></linearGradient>' +
      '<linearGradient id="mmLand2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3e8a2"/><stop offset="1" stop-color="#8fd09b"/></linearGradient>' +
      '<linearGradient id="mmRock" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a39bd0"/><stop offset="1" stop-color="#5d5a92"/></linearGradient>' +
      '<linearGradient id="mmCliff" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b6a9cf"/><stop offset="1" stop-color="#7d73ac"/></linearGradient>' +
      '<linearGradient id="mmWater" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b6f1f4"/><stop offset=".5" stop-color="#63c9dc"/><stop offset="1" stop-color="#3aa9cf"/></linearGradient>' +
      '<linearGradient id="mmFall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9fbff"/><stop offset="1" stop-color="#8fdcf0"/></linearGradient>' +
      '<radialGradient id="mmGlowW"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="mmGlowY"><stop offset="0" stop-color="#fff7a8"/><stop offset="1" stop-color="#fff7a8" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="mmHaze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9ddff" stop-opacity=".0"/><stop offset="1" stop-color="#e9ddff" stop-opacity=".55"/></linearGradient>' +
      '<filter id="mmBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>' +
      '<filter id="mmBlurS" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>' +
      '<filter id="mmDrop" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#3a2a5a" flood-opacity=".28"/></filter>' +
      '</defs>';
  }
  function backdrop() {
    var s = '<rect width="1600" height="1000" fill="url(#mmSky)"/>';
    s += '<circle cx="1290" cy="120" r="170" fill="url(#mmSun)"/><circle cx="1290" cy="120" r="54" fill="#fff6bf"/>';
    s += cloud(260, 120, 1, .8, 'cloud') + cloud(700, 70, .7, .7, 'cloud c2') + cloud(1480, 110, .8, .65, 'cloud c3') + cloud(120, 250, .6, .55, 'cloud c2');
    // far mountains and the unexplored 'Beyond'
    s += '<g opacity=".7"><path d="M0 330 L120 230 210 300 330 190 460 310 580 250 700 330 820 270 900 340 V420 H0Z" fill="url(#mmFar)"/></g>';
    s += '<g><path d="M1180 330 L1290 200 1360 270 1450 130 1540 250 1600 210 V430 H1180Z" fill="url(#mmFar)" opacity=".85"/><path d="M1450 130 l-34 70 26-10 18 22 20-30 20 24z M1290 200 l-26 52 22-10 14 14 16-24z" fill="#fff" opacity=".9"/></g>';
    s += '<path d="M0 400 Q220 300 430 390 T860 360 T1250 400 T1600 360 V520 H0Z" fill="url(#mmMid)" opacity=".85"/>';
    s += '<rect y="250" width="1600" height="260" fill="url(#mmHaze)"/>';
    return s;
  }
  function land() {
    var s = '<path d="M0 470 Q200 410 420 460 T820 450 T1200 480 T1600 450 V1000 H0Z" fill="url(#mmLand)"/>';
    s += '<path d="M0 700 Q260 650 520 700 T1000 690 T1600 700 V1000 H0Z" fill="url(#mmLand2)" opacity=".55"/>'; // sunlit meadow bands
    s += '<ellipse cx="1080" cy="800" rx="330" ry="120" fill="#d7f2a8" opacity=".55" filter="url(#mmBlur)"/>'; // meadow glow
    s += '<ellipse cx="470" cy="770" rx="290" ry="130" fill="#3f8c77" opacity=".3" filter="url(#mmBlur)"/>'; // forest shade
    return s;
  }
  function mountainAndCaves() {
    var s = '<g>';
    s += '<path d="M1170 760 C1190 640 1230 520 1270 450 L1330 380 L1420 330 L1500 380 L1560 330 L1600 350 V780 Z" fill="url(#mmRock)"/>';
    s += '<path d="M1270 450 L1330 380 L1420 330 L1450 420 L1380 480 L1300 520Z" fill="#c7bff0" opacity=".35"/>';
    for (var i = 0; i < 9; i++) { var y = 430 + i * 38; s += '<path d="M' + (1190 + i * 4) + ' ' + y + ' Q1390 ' + (y - 24) + ' 1600 ' + (y + 6) + '" fill="none" stroke="#4d4a82" stroke-width="2" opacity=".18"/>'; }
    s += '<path d="M1160 770 Q1400 730 1600 760 V800 H1160Z" fill="#6aae8c"/>';
    // caves
    [[1345, 575, 62], [1505, 520, 50], [1450, 640, 56], [1262, 680, 54]].forEach(function (c) { s += '<path d="M' + (c[0] - c[2]) + ' ' + (c[1] + c[2] * .8) + ' Q' + (c[0] - c[2]) + ' ' + (c[1] - c[2]) + ' ' + c[0] + ' ' + (c[1] - c[2]) + ' Q' + (c[0] + c[2]) + ' ' + (c[1] - c[2]) + ' ' + (c[0] + c[2]) + ' ' + (c[1] + c[2] * .8) + 'Z" fill="#2a2455"/>'; });
    // glowing pools
    s += '<ellipse cx="1260" cy="748" rx="82" ry="20" fill="#7fd5ff" opacity=".9"/><ellipse cx="1260" cy="745" rx="58" ry="11" fill="#e4fbff" opacity=".85"/>';
    s += '<ellipse cx="1478" cy="735" rx="60" ry="15" fill="#c8b0ff" opacity=".9"/><ellipse cx="1478" cy="732" rx="40" ry="8" fill="#f1e9ff" opacity=".85"/>';
    // crystals
    [[1540, 585, '#9ff5e8'], [1556, 596, '#c5a2ff'], [1214, 612, '#8fd6ff']].forEach(function (c) { s += '<path d="M' + c[0] + ' ' + (c[1] + 30) + ' L' + (c[0] - 9) + ' ' + (c[1] + 6) + ' L' + c[0] + ' ' + (c[1] - 14) + ' L' + (c[0] + 9) + ' ' + (c[1] + 6) + 'Z" fill="' + c[2] + '" opacity=".95" class="crystal"/>'; });
    return s + '</g>';
  }
  function skyBridge() {
    var s = '<g>';
    // cliffs with grassy tops, waterfall between them
    s += '<path d="M700 120 L910 120 L912 440 Q860 470 780 450 L700 440Z" fill="url(#mmCliff)"/><path d="M700 112 Q800 90 912 118 L912 160 Q810 138 700 160Z" fill="#8fd39a"/>';
    s += '<path d="M1130 120 L1330 120 L1340 430 Q1260 470 1190 440 L1130 440Z" fill="url(#mmCliff)"/><path d="M1130 118 Q1230 92 1332 118 L1332 160 Q1230 134 1130 160Z" fill="#8fd39a"/>';
    s += '<path d="M912 240 L1130 240 L1130 440 L912 440Z" fill="#6c63a0" opacity=".55"/>';
    s += '<rect x="990" y="236" width="60" height="196" fill="url(#mmFall)" opacity=".92"/><rect class="fall" x="996" y="236" width="10" height="196" fill="#fff" opacity=".7"/><rect class="fall f2" x="1020" y="236" width="8" height="196" fill="#fff" opacity=".6"/><rect class="fall f3" x="1038" y="236" width="7" height="196" fill="#fff" opacity=".6"/>';
    s += '<ellipse cx="1020" cy="438" rx="96" ry="26" fill="#fff" opacity=".6" filter="url(#mmBlurS)" class="mist"/>';
    // the bridge: a stone arch with railings and lanterns
    s += '<path d="M896 232 Q1020 150 1146 232" fill="none" stroke="#d6c5ec" stroke-width="30" stroke-linecap="round"/><path d="M896 232 Q1020 150 1146 232" fill="none" stroke="#f3e9ff" stroke-width="8" stroke-linecap="round" transform="translate(0 -12)"/>';
    for (var i = 0; i <= 8; i++) { var t = i / 8, x = 896 + t * 250, y = 232 - Math.sin(t * Math.PI) * 63; s += '<line x1="' + x + '" y1="' + (y - 12) + '" x2="' + x + '" y2="' + (y - 34) + '" stroke="#bda9dc" stroke-width="4"/>'; }
    s += '<circle cx="960" cy="178" r="7" fill="#ffe28a" class="firefly"/><circle cx="1080" cy="178" r="7" fill="#ffe28a" class="firefly"/>';
    s += '<g class="cloud c2" opacity=".85" transform="translate(790 470)" fill="#fff"><ellipse cx="0" cy="0" rx="120" ry="30"/><ellipse cx="40" cy="-18" rx="70" ry="30"/></g>';
    return s + '</g>';
  }
  function nestingTree() {
    var x = 270, s = '<g>';
    s += '<ellipse cx="' + x + '" cy="578" rx="150" ry="22" fill="#2d4a40" opacity=".25"/>';
    // roots and trunk
    s += '<path d="M180 580 Q205 540 222 510 Q214 400 222 300 L318 300 Q326 400 318 510 Q335 545 362 580 Q310 560 270 566 Q230 560 180 580Z" fill="#8f6446"/>';
    s += '<path d="M240 520 Q250 400 246 300" stroke="#6c452e" stroke-width="5" fill="none" opacity=".4"/><path d="M296 520 Q300 420 304 300" stroke="#6c452e" stroke-width="5" fill="none" opacity=".4"/>';
    // branches
    s += '<g stroke="#8f6446" stroke-width="26" stroke-linecap="round" fill="none"><path d="M240 360 Q170 330 130 270"/><path d="M300 330 Q370 290 410 230"/><path d="M236 430 Q170 420 120 390"/></g>';
    // canopy
    [[150, 250, 90], [250, 190, 115], [360, 235, 92], [200, 310, 78], [330, 320, 80], [270, 280, 95], [110, 330, 58], [410, 305, 60]].forEach(function (c, i) { s += leafCluster(c[0], c[1], c[2], ['#7cc99a', '#6fbd93', '#85d0a0', '#5fb08c'][i % 4], '#c4f0b0'); });
    s += '<g class="sway" style="transform-origin:270px 130px"><circle cx="190" cy="215" r="14" fill="#ffd1e1"/><circle cx="330" cy="170" r="12" fill="#ffd1e1"/><circle cx="380" cy="270" r="13" fill="#ffe28a"/></g>';
    // lanterns
    [[170, 350], [350, 360], [270, 420]].forEach(function (p) { s += '<line x1="' + p[0] + '" y1="' + (p[1] - 30) + '" x2="' + p[0] + '" y2="' + (p[1] - 6) + '" stroke="#6c452e" stroke-width="3"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="9" fill="#ffe28a" class="firefly"/>'; });
    return s + '</g>';
  }
  function forest() {
    var s = '<g>';
    var cols = [['#f4a3c3', '#ffd6e7'], ['#9bc8f2', '#d3e8ff'], ['#f7d778', '#fff0b0'], ['#9fd9a4', '#d6f5c3'], ['#bba5e9', '#e4d9ff'], ['#74cfc0', '#bff0e5']];
    var pts = [[310, 810, 190], [350, 700, 150], [250, 760, 210], [440, 690, 170], [470, 860, 190], [560, 720, 170], [610, 840, 200], [330, 850, 210], [520, 800, 150], [250, 880, 180], [640, 700, 150], [420, 780, 150]];
    pts.sort(function (a, b) { return a[1] - b[1]; });
    pts.forEach(function (p, i) { var c = cols[i % cols.length]; s += tree(p[0], p[1], p[2], c[0], c[1], true); });
    return s + '</g>';
  }
  function meadow() {
    var s = '<g>';
    for (var i = 0; i < 90; i++) { var x = R(880, 1260), y = R(700, 900); var col = ['#fff5c8', '#ffc4d4', '#ffffff', '#ffd77a'][i % 4]; s += '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + R(2.2, 4.8).toFixed(1) + '" fill="' + col + '"/>'; }
    for (var j = 0; j < 46; j++) { var gx = R(880, 1270), gy = R(720, 920), h = R(18, 40) * sc(gy); s += '<path class="sway" style="transform-origin:' + gx.toFixed(0) + 'px ' + gy.toFixed(0) + 'px;animation-delay:' + (j % 7) * .3 + 's" d="M' + gx.toFixed(0) + ' ' + gy.toFixed(0) + ' q' + (R(-6, 6)).toFixed(1) + ' ' + (-h * .5).toFixed(0) + ' ' + (R(-8, 8)).toFixed(1) + ' ' + (-h).toFixed(0) + '" stroke="#5aa86e" stroke-width="3" fill="none" stroke-linecap="round"/>'; }
    for (var k = 0; k < 18; k++) s += '<circle class="firefly" style="animation-delay:' + (k % 9) * .35 + 's;transform-box:fill-box;transform-origin:center" cx="' + R(900, 1250).toFixed(0) + '" cy="' + R(690, 880).toFixed(0) + '" r="5" fill="#fff7a8"/><circle class="firefly" style="animation-delay:' + (k % 9) * .35 + 's;transform-box:fill-box;transform-origin:center" cx="' + R(900, 1250).toFixed(0) + '" cy="' + R(690, 880).toFixed(0) + '" r="14" fill="url(#mmGlowY)" opacity=".7"/>';
    return s + '</g>';
  }

  /* ───────────────── homes (hand-drawn little houses, one type per bird personality) ───────────────── */
  function homeArt(h) {
    var x = h.x, y = h.y, s = sc(y), c = h.c, t = h.type, g = '<g transform="translate(' + x + ' ' + y + ') scale(' + s.toFixed(2) + ')" filter="url(#mmDrop)">';
    var door = function (w, hh, col) { return '<path d="M' + (-w) + ' 0 V' + (-hh * .55) + ' Q0 ' + (-hh * 1.15) + ' ' + w + ' ' + (-hh * .55) + ' V0Z" fill="' + (col || '#6b4a35') + '"/>'; };
    if (t === 'treehouse') g += '<rect x="-34" y="-52" width="68" height="52" rx="8" fill="' + c + '" stroke="#8a6547" stroke-width="4"/><path d="M-42 -50 L0 -84 L42 -50Z" fill="#c77b55" stroke="#8a6547" stroke-width="4"/>' + door(11, 30, '#7a553b').replace('<path', '<path transform="translate(0 0)"') + '<circle cx="20" cy="-34" r="6" fill="#bfe8ff" stroke="#8a6547" stroke-width="2"/><rect x="-44" y="0" width="88" height="8" rx="4" fill="#8a6547"/>';
    else if (t === 'rootnook') g += '<ellipse cx="0" cy="-4" rx="46" ry="34" fill="#8f6446"/>' + door(20, 42, '#3b2a24') + '<ellipse cx="-34" cy="2" rx="9" ry="6" fill="' + c + '"/><ellipse cx="32" cy="3" rx="11" ry="7" fill="' + c + '"/><circle cx="0" cy="-22" r="5" fill="#ffe28a" class="firefly"/>';
    else if (t === 'branch') g += '<ellipse cx="0" cy="-6" rx="34" ry="18" fill="' + c + '"/><path d="M-34 -8 Q-10 -30 0 -8 Q10 -30 34 -8" fill="none" stroke="#8a6547" stroke-width="5" stroke-linecap="round"/><ellipse cx="0" cy="-12" rx="18" ry="8" fill="#5a3f2b"/>';
    else if (t === 'blossom') g += '<circle cx="0" cy="-30" r="34" fill="' + c + '"/>' + [0, 1, 2, 3, 4, 5].map(function (i) { var a = i * 1.047; return '<circle cx="' + (Math.cos(a) * 30).toFixed(0) + '" cy="' + (-30 + Math.sin(a) * 30).toFixed(0) + '" r="14" fill="#ffd1e3"/>'; }).join('') + door(11, 30, '#9d5a76') + '<circle cx="0" cy="-34" r="7" fill="#ffe28a"/>';
    else if (t === 'canopy') g += '<rect x="-40" y="-8" width="80" height="9" rx="4" fill="#8a6547"/><path d="M-40 -8 L-30 -56 Q0 -76 30 -56 L40 -8Z" fill="' + c + '" opacity=".92" stroke="#7fb8d6" stroke-width="3"/><line x1="-30" y1="0" x2="-30" y2="26" stroke="#8a6547" stroke-width="3"/><line x1="30" y1="0" x2="30" y2="26" stroke="#8a6547" stroke-width="3"/><circle cx="0" cy="-30" r="7" fill="#fff"/>';
    else if (t === 'sunnest') g += '<ellipse cx="0" cy="-8" rx="42" ry="22" fill="' + c + '"/><ellipse cx="0" cy="-14" rx="26" ry="11" fill="#c98a1e"/><circle cx="-34" cy="-6" r="6" fill="#ff9ab5"/><circle cx="36" cy="-4" r="6" fill="#fff"/><circle cx="0" cy="-34" r="9" fill="#fff3a0" class="firefly"/>';
    else if (t === 'cave') g += '<path d="M-34 0 Q-34 -64 0 -64 Q34 -64 34 0Z" fill="#241f4d"/><path d="M-22 0 Q-22 -42 0 -44 Q22 -42 22 0Z" fill="' + c + '" opacity=".5" class="firefly"/><path d="M-44 0 Q-40 -72 0 -74 Q40 -72 44 0" fill="none" stroke="#c9c0ee" stroke-width="5" opacity=".7"/>';
    else if (t === 'hut') g += '<path d="M-38 0 V-44 Q0 -78 38 -44 V0Z" fill="' + c + '" stroke="#b05f2c" stroke-width="4"/>' + door(11, 30, '#7a3f1d') + '<line x1="30" y1="-62" x2="30" y2="-34" stroke="#7a3f1d" stroke-width="3"/><circle cx="30" cy="-28" r="9" fill="#fff0a0" class="firefly"/>';
    else if (t === 'lookout') g += '<path d="M-30 0 L-22 -50 H22 L30 0Z" fill="' + c + '" stroke="#b78722" stroke-width="4"/><rect x="-30" y="-62" width="60" height="12" rx="4" fill="#ffb44a"/><line x1="0" y1="-62" x2="0" y2="-96" stroke="#7a3f1d" stroke-width="3"/><path d="M0 -96 L26 -88 L0 -80Z" fill="#ff7a59"/>';
    else if (t === 'shelter') g += '<path d="M-42 0 Q-38 -58 0 -62 Q38 -58 42 0Z" fill="' + c + '" stroke="#4a9a5c" stroke-width="4"/><path d="M-20 -20 Q0 -48 20 -20" fill="none" stroke="#e8ffe4" stroke-width="4"/>' + door(10, 28, '#3d7a4b');
    else if (t === 'aerie') g += '<ellipse cx="0" cy="-8" rx="44" ry="20" fill="' + c + '" stroke="#9fb0e8" stroke-width="3"/><ellipse cx="0" cy="-14" rx="28" ry="10" fill="#aeb9e8"/><path d="M-50 -2 Q-70 -18 -58 -34 M50 -2 Q70 -18 58 -34" stroke="#cfd8ff" stroke-width="5" fill="none" stroke-linecap="round"/>';
    else if (t === 'roost') g += '<path d="M-36 0 V-46 Q0 -84 36 -46 V0Z" fill="' + c + '" stroke="#7d86a3" stroke-width="4"/>' + door(12, 34, '#4d5575') + '<path d="M-10 -72 H10 V-62 Q0 -52 -10 -62Z" fill="#7a63d1"/>';
    else if (t === 'cottage') g += '<rect x="-30" y="-44" width="60" height="44" rx="6" fill="#fff" stroke="' + '#6ab7cf' + '" stroke-width="4"/><path d="M-38 -44 L0 -78 L38 -44Z" fill="' + c + '" stroke="#6ab7cf" stroke-width="4"/>' + door(10, 28, '#3d8aa3') + '<circle cx="18" cy="-30" r="6" fill="#bfe8ff" stroke="#6ab7cf" stroke-width="2"/><ellipse cx="38" cy="8" rx="16" ry="6" fill="#7fe0a0"/>';
    return g + '</g>';
  }

  /* ───────────────── mount ───────────────── */
  function mount(svg, api) {
    api = api || {};
    var found = api.found || {};
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.innerHTML = defs();
    var scene = el('g', { id: 'mmScene' }, svg); // parallax group
    var layer = function (id) { return el('g', { id: id }, scene); };
    var gBack = layer('mmBack'), gMid = layer('mmMid'), gFront = layer('mmFront');
    gBack.innerHTML = backdrop();
    gMid.innerHTML = land() + mountainAndCaves() + skyBridge();

    // sparkle stream ribbon (sampled from a centre line so it widens as it comes toward us)
    var centre = 'M1020 436 C1012 480 962 508 922 548 S804 596 776 656 S724 764 764 824 S902 890 1002 934 S1220 988 1400 992 S1600 996 1640 1000';
    var cp = el('path', { d: centre, fill: 'none' }, svg); var len = cp.getTotalLength(), L = [], R2 = [], N = 90;
    for (var i = 0; i <= N; i++) {
      var p = cp.getPointAtLength(len * i / N), q = cp.getPointAtLength(Math.min(len, len * i / N + 2)), a = Math.atan2(q.y - p.y, q.x - p.x) + Math.PI / 2, w = 16 + 50 * (i / N);
      L.push([p.x + Math.cos(a) * w, p.y + Math.sin(a) * w]); R2.push([p.x - Math.cos(a) * w, p.y - Math.sin(a) * w]);
    }
    var poly = L.concat(R2.reverse()).map(function (v) { return v[0].toFixed(1) + ',' + v[1].toFixed(1); }).join(' ');
    var stream = '<polygon points="' + poly + '" fill="#4f9a86" opacity=".35" transform="translate(0 8)" filter="url(#mmBlurS)"/><polygon points="' + poly + '" fill="url(#mmWater)" stroke="#f3fcff" stroke-width="6" stroke-linejoin="round"/>' +
      '<path d="' + centre + '" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="7" stroke-linecap="round" class="map-water"/><path d="' + centre + '" fill="none" stroke="#d6faff" stroke-opacity=".9" stroke-width="3" stroke-linecap="round" class="map-water w2" transform="translate(14 8)"/>';
    // sparkles and banks
    for (var s2 = 0; s2 < 34; s2++) { var sp = cp.getPointAtLength(len * (.04 + .94 * rnd())); stream += '<path class="twinkle" style="animation-delay:' + (s2 % 8) * .4 + 's;transform-box:fill-box;transform-origin:center" d="M' + (sp.x + R(-24, 24)).toFixed(0) + ' ' + (sp.y + R(-10, 10)).toFixed(0) + ' l3 -9 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3z" fill="#fff"/>'; }
    for (var b = 0; b < 46; b++) { var bp = cp.getPointAtLength(len * (.05 + .92 * rnd())), side = rnd() < .5 ? -1 : 1, off = 24 + 60 * (len ? 0 : 0) + R(30, 70); stream += '<ellipse cx="' + (bp.x + side * (off + bp.y * .02)).toFixed(0) + '" cy="' + (bp.y + R(-6, 6)).toFixed(0) + '" rx="' + R(5, 10).toFixed(0) + '" ry="' + R(3, 6).toFixed(0) + '" fill="' + ['#e8dfd0', '#cfc6dc', '#f2e3c8'][b % 3] + '"/>'; }
    for (var r = 0; r < 16; r++) { var rp = cp.getPointAtLength(len * (.1 + .8 * rnd())), sd = rnd() < .5 ? -1 : 1, rx = rp.x + sd * (50 + rp.y * .03), ry = rp.y + 4; stream += '<g class="sway" style="transform-origin:' + rx.toFixed(0) + 'px ' + ry.toFixed(0) + 'px;animation-delay:' + (r % 5) * .4 + 's"><path d="M' + rx.toFixed(0) + ' ' + ry.toFixed(0) + ' q-4 -26 2 -50" stroke="#5aa86e" stroke-width="3" fill="none"/><ellipse cx="' + (rx + 2).toFixed(0) + '" cy="' + (ry - 54).toFixed(0) + '" rx="4" ry="10" fill="#8a5a3a"/></g>'; }
    // cascades at the S-bend, stepping stones near the forest, and a wooden footbridge toward the meadow
    var cs = cp.getPointAtLength(len * .3); stream += '<g>' + [0, 1, 2].map(function (k) { return '<ellipse cx="' + (cs.x - 10 + k * 8) + '" cy="' + (cs.y - 10 + k * 14) + '" rx="' + (44 - k * 6) + '" ry="7" fill="#fff" opacity=".8"/>'; }).join('') + '</g>';
    var fp = cp.getPointAtLength(len * .43), ang = 0;
    stream += '<g transform="translate(' + fp.x.toFixed(0) + ' ' + fp.y.toFixed(0) + ')"><path d="M-110 -2 Q0 -26 110 -2" fill="none" stroke="#b98a5a" stroke-width="16" stroke-linecap="round"/><path d="M-110 -12 Q0 -36 110 -12" fill="none" stroke="#e4c08c" stroke-width="5" stroke-linecap="round"/>' + [-90, -60, -30, 0, 30, 60, 90].map(function (x) { return '<line x1="' + x + '" y1="' + (-8 - 18 * (1 - Math.abs(x) / 110) + 10) + '" x2="' + x + '" y2="' + (-30 - 24 * (1 - Math.abs(x) / 110) + 14) + '" stroke="#9a6d42" stroke-width="3"/>'; }).join('') + '</g>';
    [.12, .17, .21].forEach(function (u) { var sp2 = cp.getPointAtLength(len * u); stream += '<ellipse cx="' + sp2.x.toFixed(0) + '" cy="' + sp2.y.toFixed(0) + '" rx="13" ry="6" fill="#cfc6dc" stroke="#fff" stroke-width="2"/>'; });
    var gStream = el('g', { id: 'mmStream' }, scene); gStream.innerHTML = '';
    // draw order: land features, stream, forest/tree/meadow in front by depth
    scene.insertBefore(gStream, gFront);
    gStream.innerHTML = stream;
    gFront.innerHTML = nestingTree() + meadow() + forest();

    // trails and bridges
    var gPath = el('g', { id: 'mmPaths' }, scene), pathEls = {};
    PATHS.forEach(function (p) {
      var under = el('path', { d: p.d, fill: 'none', stroke: p.high ? '#ffffff' : '#c9a57a', 'stroke-width': p.high ? 5 : 20, 'stroke-linecap': 'round', 'stroke-dasharray': p.high ? '2 14' : '', opacity: p.high ? .9 : .85 }, gPath);
      var top = el('path', { d: p.d, fill: 'none', stroke: p.high ? '#ffffff' : '#f6e2bd', 'stroke-width': p.high ? 0 : 11, 'stroke-linecap': 'round', opacity: .95 }, gPath);
      var walk = el('path', { d: p.d, fill: 'none', stroke: 'none', id: 'walk-' + p.id }, gPath); pathEls[p.id] = walk;
    });

    // unexplored fog
    var gFog = el('g', { id: 'mmFog' }, scene);
    UNEXPLORED.forEach(function (u) {
      var g = el('g', { 'class': 'map-unexplored', role: 'button', tabindex: 0, 'aria-label': 'Unexplored: ' + u.teaser, 'data-u': u.id }, gFog);
      g.innerHTML = '<ellipse cx="' + u.x + '" cy="' + u.y + '" rx="130" ry="78" fill="#fff" opacity=".78" filter="url(#mmBlur)"/><ellipse cx="' + (u.x + 36) + '" cy="' + (u.y - 12) + '" rx="90" ry="50" fill="#efe6ff" opacity=".85" filter="url(#mmBlur)" class="mist"/><text x="' + u.x + '" y="' + (u.y + 12) + '" text-anchor="middle" font-size="' + (u.label.length > 1 ? 26 : 44) + '" font-weight="900" fill="#8d79b8" letter-spacing="3">' + esc(u.label) + '</text>';
      g.addEventListener('click', function () { api.onUnexplored && api.onUnexplored(u, g); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); api.onUnexplored && api.onUnexplored(u, g); } });
    });

    // habitat hit areas (hover glow); labels as the accessible buttons
    var gArea = el('g', { id: 'mmAreas' }, scene);
    Object.keys(HABITATS).forEach(function (id) {
      var h = HABITATS[id];
      var a = el('g', { 'class': 'map-hotspot map-area', 'data-zone': id, 'aria-hidden': 'true' }, gArea);
      a.innerHTML = '<ellipse class="hotspot-halo" cx="' + h.halo[0] + '" cy="' + h.halo[1] + '" rx="' + h.halo[2] + '" ry="' + h.halo[3] + '" fill="#fff4bb" opacity=".6"/><ellipse cx="' + h.halo[0] + '" cy="' + h.halo[1] + '" rx="' + h.halo[2] + '" ry="' + h.halo[3] + '" fill="transparent"/>';
    });

    // homes
    var gHomes = el('g', { id: 'mmHomes' }, scene);
    HOMES.forEach(function (h) {
      var g = el('g', { 'class': 'mm-home', role: 'button', tabindex: 0, 'data-bird': h.bird, 'aria-label': 'Visit ' + h.bird.charAt(0).toUpperCase() + h.bird.slice(1) + "'s home" }, gHomes);
      g.innerHTML = homeArt(h) + '<circle cx="' + h.x + '" cy="' + (h.y - 26 * sc(h.y)) + '" r="' + (50 * sc(h.y)) + '" fill="transparent"/>';
      var go = function () { api.onHome && api.onHome(h.bird, g); };
      g.addEventListener('click', function (e) { e.stopPropagation(); go(); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });

    // birds in their neighbourhoods (and out visiting)
    var gBirds = el('g', { id: 'mmBirds' }, scene), birds = {};
    HOMES.forEach(function (h) {
      var sz = 74 * sc(h.y), bx = h.x + 38 * sc(h.y), by = h.y + 20 * sc(h.y);
      var g = el('g', { 'class': 'mm-bird', 'data-bird': h.bird, role: 'button', tabindex: 0, 'aria-label': 'Say hello to ' + h.bird }, gBirds);
      var shadow = el('ellipse', { cx: 0, cy: 0, rx: sz * .34, ry: sz * .07, fill: '#2d3a4a', opacity: .25 }, g);
      var inner = el('g', { 'class': 'bob' }, g);
      var img = el('image', { href: SPRITES + h.bird + '.png', x: -sz / 2, y: -sz, width: sz, height: sz, preserveAspectRatio: 'xMidYMax meet' }, inner);
      g.setAttribute('transform', 'translate(' + bx + ' ' + by + ')');
      birds[h.bird] = { g: g, inner: inner, home: { x: bx, y: by }, zone: h.zone, x: bx, y: by, busy: false };
      g.addEventListener('click', function (e) { e.stopPropagation(); api.onBird && api.onBird(h.bird, g); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); api.onBird && api.onBird(h.bird, g); } });
    });

    // discoveries: sparkles to investigate
    var gDisc = el('g', { id: 'mmDisc' }, scene), discs = [];
    function glint(id, x, y, label, hidden) {
      var g = el('g', { 'class': 'mm-glint' + (found[id] ? ' found' : ''), role: 'button', tabindex: 0, 'data-id': id, 'aria-label': (found[id] ? 'Discovered: ' : 'A sparkle to investigate: ') + label }, gDisc);
      var s = sc(y) * 1.1;
      g.innerHTML = '<circle cx="' + x + '" cy="' + y + '" r="' + (26 * s) + '" fill="transparent"/><path class="glint-star" transform="translate(' + x + ' ' + y + ') scale(' + s + ')" d="M0 -17 L4 -5 L16 0 L4 5 L0 17 L-4 5 L-16 0 L-4 -5Z" fill="' + (found[id] ? '#9be6b4' : '#fff6a8') + '" stroke="#fff" stroke-width="2"/>';
      discs.push({ id: id, g: g }); return g;
    }
    Object.keys(DISC_POS).forEach(function (z) { DISC_POS[z].forEach(function (p, i) { var id = z + ':' + i, g = glint(id, p[0], p[1], 'discovery ' + (i + 1) + ' in ' + HABITATS[z].name); var go = function () { api.onDiscovery && api.onDiscovery({ id: id, zone: z, index: i }, g); }; g.addEventListener('click', function (e) { e.stopPropagation(); go(); }); g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }); }); });
    HIDDEN.forEach(function (d) { var g = glint(d.id, d.x, d.y, d.name, true); var go = function () { api.onDiscovery && api.onDiscovery({ id: d.id, zone: d.zone, hidden: d }, g); }; g.addEventListener('click', function (e) { e.stopPropagation(); go(); }); g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }); });

    // flight path birds (a few small silhouettes sailing the high cloud trail)
    var gFly = el('g', { id: 'mmFly' }, scene);
    for (var f = 0; f < 3; f++) { var fb = el('path', { d: 'M0 0 q8 -9 16 0 q8 -9 16 0', fill: 'none', stroke: '#6b5a99', 'stroke-width': 3, 'stroke-linecap': 'round', 'class': 'flyer', style: 'animation-delay:' + (-f * 6) + 's' }, gFly); fb.style.offsetPath = "path('" + PATHS[5].d + "')"; }

    // habitat labels (the accessible buttons, drawn above everything)
    var gLab = el('g', { id: 'mmLabels' }, scene);
    Object.keys(HABITATS).forEach(function (id) {
      var h = HABITATS[id], lx = h.label[0], ly = h.label[1], tw = h.label[2].length * 13 + 44;
      var g = el('g', { 'class': 'map-hotspot', 'data-zone': id, role: 'button', tabindex: 0, 'aria-label': 'Explore ' + h.name + ', home to ' + HOMES.filter(function (x) { return x.zone === id; }).map(function (x) { return x.bird.charAt(0).toUpperCase() + x.bird.slice(1); }).join(', ') }, gLab);
      g.innerHTML = '<g class="hotspot-label"><rect x="' + (lx - tw / 2) + '" y="' + (ly - 24) + '" width="' + tw + '" height="48" rx="24" fill="#fffaf0" stroke="' + h.label[4] + '" stroke-width="3"/><text x="' + lx + '" y="' + (ly + 8) + '" text-anchor="middle" font-size="23" fill="' + h.label[3] + '">' + esc(h.label[2]) + '</text></g>';
    });

    // foreground framing: soft dark leaves in the lower corners give depth
    var fr = el('g', { id: 'mmFrame', 'pointer-events': 'none' }, svg);
    fr.innerHTML = '<g opacity=".9" filter="url(#mmBlurS)"><path d="M0 1000 V860 Q70 900 100 820 Q150 900 180 1000Z" fill="#2f7a63"/><path d="M0 1000 V930 Q60 930 90 880 Q120 940 150 1000Z" fill="#3f9a78"/><path d="M1600 1000 V870 Q1520 910 1490 830 Q1440 910 1410 1000Z" fill="#2f7a63"/></g>';

    /* ───── life: birds visiting each other along the trails ───── */
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ids = HOMES.map(function (h) { return h.bird; }), walking = 0, MAXW = 3, running = false, raf = 0, last = 0, walkers = [];
    var ORDER = ['nesting-tree', 'feelings-forest', 'sparkle-stream', 'firefly-meadow', 'quiet-caves', 'sky-bridge'];
    function seg(from, to) { // the path between two neighbouring habitats, and which way to walk it
      for (var i = 0; i < PATHS.length; i++) { var p = PATHS[i]; if (p.a === from && p.b === to) return { id: p.id, rev: false }; if (p.b === from && p.a === to) return { id: p.id, rev: true }; } return null;
    }
    function route(from, to) {
      var i = ORDER.indexOf(from), j = ORDER.indexOf(to), n = ORDER.length, fwd = (j - i + n) % n, back = (i - j + n) % n, step = fwd <= back ? 1 : -1, out = [], k = i;
      while (k !== j) { var nk = (k + step + n) % n; var sg = seg(ORDER[k], ORDER[nk]); if (!sg) return null; out.push(sg); k = nk; } return out;
    }
    function startWalk(bird) {
      var b = birds[bird]; if (b.busy) return;
      var dests = ORDER.filter(function (z) { return z !== b.zone; }), dest = dests[Math.floor(rnd() * dests.length)];
      var there = route(b.zone, dest); if (!there) return;
      var back = route(dest, b.zone); b.busy = true; walking++;
      walkers.push({ bird: bird, segs: there.concat([{ pause: 5 + rnd() * 3 }], back), si: 0, d: 0, pause: 0, speed: 46 + rnd() * 18, dest: dest });
    }
    function placeBird(b, x, y, dirRight) {
      var s = sc(y) / sc(b.home.y);
      b.g.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + (dirRight ? -s : s).toFixed(3) + ' ' + s.toFixed(3) + ')');
      b.x = x; b.y = y;
    }
    function step(ts) {
      if (!running) return; var dt = Math.min(.05, (ts - last) / 1000); last = ts;
      for (var i = walkers.length - 1; i >= 0; i--) {
        var w = walkers[i], b = birds[w.bird], sg = w.segs[w.si];
        if (!sg) { placeBird(b, b.home.x, b.home.y, false); b.g.classList.remove('walking'); b.busy = false; walking--; walkers.splice(i, 1); continue; }
        if (sg.pause) { w.pause += dt; b.g.classList.remove('walking'); if (w.pause >= sg.pause) { w.si++; w.d = 0; w.pause = 0; } continue; }
        var path = pathEls[sg.id], L = path.getTotalLength(); w.d += w.speed * dt;
        var dist = sg.rev ? L - w.d : w.d; if (w.d >= L) { w.si++; w.d = 0; continue; }
        var p = path.getPointAtLength(dist), p2 = path.getPointAtLength(Math.max(0, Math.min(L, dist + (sg.rev ? -4 : 4))));
        b.g.classList.add('walking'); placeBird(b, p.x, p.y + 4, p2.x > p.x);
      }
      if (walking < MAXW && rnd() < dt * .22) { var cand = ids.filter(function (id) { return !birds[id].busy; }); startWalk(cand[Math.floor(rnd() * cand.length)]); }
      raf = requestAnimationFrame(step);
    }
    function start() { if (reduce || running) return; running = true; last = performance.now(); raf = requestAnimationFrame(step); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });

    // gentle parallax: the layers drift a few pixels against each other as the pointer moves
    if (!reduce) {
      svg.parentNode.addEventListener('pointermove', function (e) {
        var r = svg.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
        gBack.style.transform = 'translate(' + (-nx * 14).toFixed(1) + 'px,' + (-ny * 6).toFixed(1) + 'px)';
        gMid.style.transform = 'translate(' + (-nx * 6).toFixed(1) + 'px,' + (-ny * 3).toFixed(1) + 'px)';
      });
    }
    start();

    return {
      start: start, stop: stop, birds: birds,
      markFound: function (id) { found[id] = true; discs.forEach(function (d) { if (d.id === id) { d.g.classList.add('found'); var st = d.g.querySelector('.glint-star'); if (st) st.setAttribute('fill', '#9be6b4'); d.g.setAttribute('aria-label', 'Discovered'); } }); },
      focusZone: function (id) { var a = svg.querySelector('.map-area[data-zone="' + id + '"] .hotspot-halo'); if (a) { a.style.opacity = 1; setTimeout(function () { a.style.opacity = ''; }, 2600); } },
      pointOf: function (x, y) { var r = svg.getBoundingClientRect(); return { x: r.left + x / W * r.width, y: r.top + y / H * r.height }; },
      discoveryCount: function () { return DISC_POS_COUNT() + HIDDEN.length; }
    };
  }
  function DISC_POS_COUNT() { var n = 0; Object.keys(DISC_POS).forEach(function (k) { n += DISC_POS[k].length; }); return n; }

  window.MimbletonMap = { mount: mount, HABITATS: HABITATS, HOMES: HOMES, PATHS: PATHS, HIDDEN: HIDDEN, UNEXPLORED: UNEXPLORED, DISC_POS: DISC_POS };
})();
