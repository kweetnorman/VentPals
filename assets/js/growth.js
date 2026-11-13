/**
 * growth.js – the VentPals bird economy (demo: stored in this browser's localStorage)
 *
 *   COMPLETED LEARNING ACTIVITY  --earns-->  BUG  --child feeds it to the bird-->  GROWTH points
 *                                                          \->  FEATHERS       (spendable on the avatar closet)
 *
 * - The bird is chosen once in onboarding and then LOCKED (user.birdLocked).
 * - Growth points move the bird: egg -> baby -> nestling -> feathered -> percher.
 * - Distinct learning activities earn once; feelings, logins, page visits, and streaks never earn points.
 * - Each new stage adds a keepsake milestone to the local demo collection; shipping is not active.
 * - Feathers are a tiny money lesson: earn, save toward a goal, then spend. Spending never shrinks growth.
 * - Pages self-configure by file name (see wirePage), so most pages need no wiring.
 *
 * Tune the pace by editing STAGES, BUG_TYPES and ACTIVITIES.
 */
(function () {
  'use strict';
  // Parent pages also load this file to READ progress; only a signed-in child can earn.
  var IS_KID = localStorage.getItem('ventpals_logged_in') === 'true';

  var GROWTH_KEY = 'ventpals_growth';
  var USER_KEY = 'ventpals_user';
  var REQ_KEY = 'ventpals_keepsake_requests';
  var INBOX_KEY = 'ventpals_parent_inbox';
  var MOMENTS_KEY = 'ventpals_moments';

  /* ───────────── growth stages (growth points) ───────────── */
  // Hatching is quick: one first activity cracks the egg. Every later stage takes real time AND learning:
  // `modules` is how many feeling-learning modules must be finished before the bird can reach that stage.
  var STAGES = [
    { id: 'egg',       name: 'Egg',       min: 0,   modules: 0,  blurb: 'Your VentPal is safe and warm inside, waiting for you. Feed it a snack to help it hatch!' },
    { id: 'baby',      name: 'Baby',      min: 3,   modules: 0,  blurb: 'Your VentPal just hatched. Soft, new, and full of possibility.' },
    { id: 'nestling',  name: 'Nestling',  min: 120,  modules: 2,  blurb: 'Learning, growing, and finding a voice, one gentle step at a time.' },
    { id: 'feathered', name: 'Feathered', min: 300, modules: 6,  blurb: 'You have tried new ideas and built skills at your own pace.' },
    { id: 'percher',   name: 'Percher',   min: 700, modules: 12, blurb: 'You and your VentPal have explored, practiced, and discovered many new things.' }
  ];


  /* ───────────── bugs: discovery tokens earned by completing activities ───────────── */
  var TIERS = {
    small:  { name: 'Small snack',  growth: 1,  feathers: 1 },
    medium: { name: 'Good snack',   growth: 3,  feathers: 2 },
    large:  { name: 'Tasty treat',  growth: 6,  feathers: 4 },
    feast:  { name: 'Big feast',    growth: 12, feathers: 8 }
  };
  var TIER_ORDER = ['small', 'medium', 'large', 'feast'];
  // kind -> tier -> foods. Birds only find foods from the kinds they eat (DIET below).
  var FOOD_KINDS = {
    bugs:    { name: 'Bugs',    small: [['mosquito','🦟','Mosquito'], ['ant','🐜','Ant'], ['fly','🪰','Fly']],
               medium: [['worm','🪱','Worm'], ['cricket','🦗','Cricket'], ['caterpillar','🐛','Caterpillar']],
               large: [['ladybug','🐞','Ladybug'], ['beetle','🪲','Beetle']], feast: [['butterfly','🦋','Butterfly']] },
    berries: { name: 'Berries', small: [['blueberry','🫐','Blueberry']], medium: [['strawberry','🍓','Strawberry'], ['cherry','🍒','Cherry']],
               large: [['grapes','🍇','Grapes']], feast: [['peach','🍑','Juicy peach']] },
    seeds:   { name: 'Seeds',   small: [['grain','🌾','Grain']], medium: [['sunflower','🌻','Sunflower seeds']],
               large: [['acorn','🌰','Acorn']], feast: [['corn','🌽','Corn']] },
    fish:    { name: 'Fish',    small: [['shrimp','🦐','Shrimp']], medium: [['minnow','🐟','Minnow']],
               large: [['fish','🐠','Tropical fish']], feast: [['squid','🦑','Squid']] },
    nectar:  { name: 'Nectar',  small: [['blossom','🌸','Blossom']], medium: [['nectar','🌺','Sweet nectar']],
               large: [['honey','🍯','Honey']], feast: [['mango','🥭','Mango']] }
  };
  // What each VentPal likes to eat (first kind is its favourite).
  var DIET = {
    flamez: ['bugs','berries'], echo: ['bugs','seeds'], guardian: ['seeds','bugs'], sable: ['bugs','berries'],
    breezy: ['nectar','bugs'], clover: ['seeds','berries'], cove: ['fish','bugs'], solace: ['nectar','berries'],
    drift: ['fish','bugs'], pebble: ['seeds','bugs'], flicker: ['seeds','nectar'], twig: ['seeds','bugs'],
    flare: ['bugs','nectar'], aura: ['nectar','berries'], nova: ['berries','nectar'], lumen: ['fish','berries']
  };
  var BUG_TYPES = {}, FOOD_TIER = {}, FOOD_KIND = {};
  Object.keys(FOOD_KINDS).forEach(function (k) {
    TIER_ORDER.forEach(function (t) {
      FOOD_KINDS[k][t].forEach(function (f) {
        BUG_TYPES[f[0]] = { icon: f[1], name: f[2], size: TIERS[t].name.toLowerCase(), tier: t, kind: k, growth: TIERS[t].growth, feathers: TIERS[t].feathers };
        FOOD_TIER[f[0]] = t; FOOD_KIND[f[0]] = k;
      });
    });
  });
  var BUG_ORDER = Object.keys(BUG_TYPES).sort(function (a, b) { return TIER_ORDER.indexOf(FOOD_TIER[a]) - TIER_ORDER.indexOf(FOOD_TIER[b]); });
  function dietFor(birdId) { return DIET[birdId] || ['bugs', 'berries']; }
  // foods a given bird can find, optionally for one tier
  function foodsFor(birdId, tier) {
    var out = [];
    dietFor(birdId).forEach(function (k) { TIER_ORDER.forEach(function (t) { if (!tier || tier === t) FOOD_KINDS[k][t].forEach(function (f) { out.push(f[0]); }); }); });
    return out;
  }

  /* ───────────── discovery activities: each distinct activity earns once ───────────── */
  // tier = how big a snack it earns. daily = can be earned once per day (practice); otherwise once ever per key.
  var ACTIVITIES = {
    water:      { tier: 'medium', daily: true, label: 'Took a mindful sip',         badge: 'sip-and-settle' },
    butterfly:  { tier: 'medium', daily: true, label: 'Did a butterfly hug',        badge: 'butterfly-hugger' },
    breathing:  { tier: 'medium', daily: true, label: 'Practiced slow breathing',   badge: 'deep-breather' },
    grounding:  { tier: 'medium', daily: true, label: 'Did a grounding exercise',   badge: 'grounded' },
    reflection: { tier: 'large',  daily: true, label: 'Wrote a reflection',         badge: 'reflector' },
    module:     { tier: 'feast',               label: 'Finished a learning module', badge: 'learner' }
  };


  /* ───────────── badges ───────────── */
  var BADGES = {
    'hatched':          { icon: '🐣', name: 'Hatched!',          how: 'Feed your egg until it hatches' },
    'nestling':         { icon: '🪺', name: 'Nestling Reached',  how: 'Grow to Nestling' },
    'feathered':        { icon: '🪶', name: 'Feathered Reached', how: 'Grow to Feathered' },
    'percher':          { icon: '🌟', name: 'Percher Reached',   how: 'Grow to Percher' },
    'reflector':        { icon: '📓', name: 'Reflector',         how: 'Write a reflection' },
    'deep-breather':    { icon: '🌬️', name: 'Deep Breather',     how: 'Try slow breathing' },
    'grounded':         { icon: '🌳', name: 'Grounded',          how: 'Do a grounding exercise' },
    'butterfly-hugger': { icon: '🦋', name: 'Butterfly Hugger',  how: 'Do a butterfly hug' },
    'sip-and-settle':   { icon: '💧', name: 'Sip & Settle',      how: 'Take a mindful sip' },
    'learner':          { icon: '🎓', name: 'Feeling Learner',   how: 'Finish a learning module' },
    'worm-gatherer':    { icon: '🍽️', name: 'Snack Sharer',      how: 'Feed your bird 5 snacks' },
    'bug-sharer':       { icon: '🧺', name: 'Picnic Host',       how: 'Feed your bird 25 snacks' },
    'butterfly-feeder': { icon: '🌟', name: 'Feast Maker',       how: 'Feed your bird 75 snacks' }
  };
  var STAGE_BADGES = ['hatched', 'nestling', 'feathered', 'percher'];
  var FEED_BADGES = [['worm-gatherer', 5], ['bug-sharer', 25], ['butterfly-feeder', 75]];

  /* ───────────── milestone keepsakes: earned automatically when the bird reaches a stage ───────────── */
  var MILESTONES = {
    baby:      { itemId: 'stickers',  name: 'Bug & Feather Sticker Sheet', emoji: '✨' },
    nestling:  { itemId: 'pin',       name: 'VentPals Bird Pin',           emoji: '📌' },
    feathered: { itemId: 'pen',       name: 'VP Pen',                      emoji: '🖊️' },
    percher:   { itemId: 'hourglass', name: 'Conversation Hourglass',      emoji: '⏳' }
  };


  /* ───────────── avatar closet (bought with feathers) ───────────── */
  var CLOSET = [
    { id: 'flower',  slot: 'head', name: 'Flower',        cost: 6,  svg: '<g transform="translate(50 30)"><g fill="#ff8fb8"><circle cx="0" cy="-12" r="10"/><circle cx="12" cy="-4" r="10"/><circle cx="7" cy="10" r="10"/><circle cx="-7" cy="10" r="10"/><circle cx="-12" cy="-4" r="10"/></g><circle r="7" fill="#ffd93b"/></g>', vb: '0 0 100 60' },
    { id: 'bow',     slot: 'head', name: 'Bow',           cost: 8,  svg: '<path d="M50 30 L18 10 Q10 30 18 50 Z" fill="#ff6fa5"/><path d="M50 30 L82 10 Q90 30 82 50 Z" fill="#ff6fa5"/><circle cx="50" cy="30" r="9" fill="#e64a8a"/>', vb: '0 0 100 60' },
    { id: 'cap',     slot: 'head', name: 'Ball cap',      cost: 12, svg: '<path d="M18 40 Q18 8 50 8 Q82 8 82 40 Z" fill="#4f8cff"/><path d="M70 36 Q96 34 98 44 Q80 46 66 42 Z" fill="#2f66d8"/><circle cx="50" cy="8" r="4" fill="#2f66d8"/>', vb: '0 0 100 60' },
    { id: 'tophat',  slot: 'head', name: 'Top hat',       cost: 20, svg: '<rect x="30" y="2" width="40" height="38" rx="4" fill="#2b1b3d"/><rect x="30" y="28" width="40" height="7" fill="#a259ff"/><rect x="14" y="38" width="72" height="8" rx="4" fill="#2b1b3d"/>', vb: '0 0 100 60' },
    { id: 'crown',   slot: 'head', name: 'Golden crown',  cost: 40, svg: '<path d="M16 44 L16 14 L34 28 L50 8 L66 28 L84 14 L84 44 Z" fill="#ffc93b"/><rect x="16" y="40" width="68" height="8" rx="3" fill="#e0a410"/><circle cx="50" cy="26" r="4" fill="#ff5a7a"/><circle cx="30" cy="34" r="3" fill="#6ad0ff"/><circle cx="70" cy="34" r="3" fill="#6ad0ff"/>', vb: '0 0 100 60' },
    { id: 'roundglasses', slot: 'face', name: 'Round glasses', cost: 12, svg: '<circle cx="30" cy="30" r="17" fill="rgba(255,255,255,.25)" stroke="#6b4a2b" stroke-width="5"/><circle cx="70" cy="30" r="17" fill="rgba(255,255,255,.25)" stroke="#6b4a2b" stroke-width="5"/><path d="M47 30 H53" stroke="#6b4a2b" stroke-width="5"/>', vb: '0 0 100 60' },
    { id: 'sunglasses',   slot: 'face', name: 'Sunglasses',    cost: 15, svg: '<rect x="10" y="16" width="36" height="26" rx="10" fill="#2b1b3d"/><rect x="54" y="16" width="36" height="26" rx="10" fill="#2b1b3d"/><path d="M46 26 H54" stroke="#2b1b3d" stroke-width="5"/><path d="M16 22 L26 22" stroke="#7b6a9a" stroke-width="3"/>', vb: '0 0 100 60' },
    { id: 'bowtie',  slot: 'neck', name: 'Bow tie',       cost: 10, svg: '<path d="M50 30 L14 12 L14 48 Z" fill="#a259ff"/><path d="M50 30 L86 12 L86 48 Z" fill="#a259ff"/><rect x="42" y="22" width="16" height="16" rx="4" fill="#7a3fe0"/>', vb: '0 0 100 60' },
    { id: 'scarf',   slot: 'neck', name: 'Cozy scarf',    cost: 18, svg: '<rect x="6" y="10" width="88" height="20" rx="10" fill="#ff7a59"/><rect x="62" y="22" width="20" height="34" rx="6" fill="#ff7a59"/><path d="M62 34 H82 M62 42 H82" stroke="#fff" stroke-width="3" opacity=".7"/>', vb: '0 0 100 60' }
  ];
  var SLOT_BOX = { // where each accessory sits over the bird art (percent of the avatar box)
    head: { top: 4,  left: 29, width: 42 },
    face: { top: 30, left: 27, width: 46 },
    neck: { top: 56, left: 29, width: 42 }
  };

  var BIRD_META = {
    aura: ['Aura', '🕊️'], breezy: ['Breezy', '🍃'], clover: ['Clover', '🍀'], cove: ['Cove', '🌊'],
    drift: ['Drift', '🌙'], echo: ['Echo', '🔔'], flamez: ['Flamez', '🔥'], flare: ['Flare', '⚡'],
    flicker: ['Flicker', '💫'], guardian: ['Guardian', '🛡️'], lumen: ['Lumen', '💡'], nova: ['Nova', '🌟'],
    pebble: ['Pebble', '🪨'], sable: ['Sable', '⭐'], solace: ['Solace', '🌿'], twig: ['Twig', '🌱']
  };

  /* ───────────── storage helpers ───────────── */
  function pad(n) { return ('0' + n).slice(-2); }
  function dayKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return dayKey(new Date()); }
  function readJSON(k, fb) { try { return JSON.parse(localStorage.getItem(k)) || fb; } catch (e) { return fb; } }
  function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function getUser() { return readJSON(USER_KEY, {}); }
  function saveUser(u) { writeJSON(USER_KEY, u); }

  function getState() {
    var s = readJSON(GROWTH_KEY, null) || {};
    s.xp = s.xp || 0; s.badges = s.badges || {}; s.completed = s.completed || {}; s.log = s.log || [];
    s.bugs = s.bugs || {}; s.fed = s.fed || {};
    BUG_ORDER.forEach(function (b) { s.bugs[b] = s.bugs[b] || 0; s.fed[b] = s.fed[b] || 0; });
    s.feathers = s.feathers || { earned: 0, spent: 0 };
    s.closet = s.closet || { owned: [], worn: {} };
    s.milestones = s.milestones || {};
    return s;
  }
  function saveState(s) { writeJSON(GROWTH_KEY, s); }

  function modulesDone(s) { return Object.keys(s.completed).filter(function (k) { return k.indexOf('module') === 0; }).length; }
  // A stage needs enough growth points AND enough finished learning modules.
  function stageIndexFor(xp, s) {
    var mods = modulesDone(s || getState()), idx = 0;
    STAGES.forEach(function (st, i) { if (xp >= st.min && mods >= (st.modules || 0)) idx = i; });
    return idx;
  }
  function totalFed(s) { return BUG_ORDER.reduce(function (n, b) { return n + s.fed[b]; }, 0); }

  // The bird comes ONLY from the saved profile (never from the URL), so it can't be swapped.
  function getBird() {
    var u = getUser();
    var id = BIRD_META[u.birdId] ? u.birdId : 'aura';
    return { id: id, name: BIRD_META[id][0], emoji: BIRD_META[id][1] };
  }

  function getProgress() {
    var s = getState();
    var i = stageIndexFor(s.xp);
    var cur = STAGES[i], next = STAGES[i + 1] || null;
    var mods = modulesDone(s);
    var pct = next ? Math.min(100, Math.round(((s.xp - cur.min) / (next.min - cur.min)) * 100)) : 100;
    var needModules = next ? Math.max(0, (next.modules || 0) - mods) : 0;
    if (needModules && pct >= 100) pct = 99;
    return { xp: s.xp, index: i, stage: cur, next: next, pct: pct, toNext: next ? Math.max(0, next.min - s.xp) : 0,
             needModules: needModules, modulesDone: mods, badges: s.badges };
  }

  // Keep user.stage in sync so older pages that read it stay correct.
  function syncUserStage() {
    var u = getUser();
    var st = STAGES[stageIndexFor(getState().xp)].id;
    if (u.stage !== st) { u.stage = st; saveUser(u); }
  }


  /* ───────────── toast ───────────── */
  function toast(lines, big, href) {
    if (!document.body) { document.addEventListener('DOMContentLoaded', function () { toast(lines, big, href); }); return; }
    var el = document.createElement(href ? 'a' : 'div');
    if (href) el.href = href;
    el.setAttribute('role', 'status');
    el.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:92px;z-index:10000;max-width:92vw;text-decoration:none;' +
      'background:' + (big ? '#7c3aed' : '#2E1A47') + ';color:#fff;border-radius:18px;padding:' + (big ? '16px 22px' : '10px 16px') +
      ';font:600 ' + (big ? '16px' : '13px') + '/1.4 system-ui,sans-serif;text-align:center;box-shadow:0 10px 30px rgba(46,26,71,.35);' +
      'opacity:0;transition:opacity .3s';
    el.innerHTML = lines.join('<br>');
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.style.opacity = '1'; });
    setTimeout(function () { el.style.opacity = '0'; setTimeout(function () { el.remove(); }, 400); }, big ? 5200 : 3600);
  }

  /* ───────────── earning bugs ───────────── */
  function addLog(s, id, label, extra) {
    s.log = s.log.concat([{ t: Date.now(), id: id, label: label, bug: extra && extra.bug, fed: extra && extra.fed }]).slice(-30);
  }

  // Badges are tied to learning milestones and exploration, never streaks or feelings.
  function checkBadges(s) {
    var d = today(), fresh = [];
    function give(id) { if (!s.badges[id]) { s.badges[id] = d; fresh.push(id); } }
    var idx = stageIndexFor(s.xp, s);
    if (idx >= 1) give('hatched');
    for (var i = 2; i <= idx; i++) give(STAGES[i].id);
    var fed = totalFed(s);
    FEED_BADGES.forEach(function (p) { if (fed >= p[1]) give(p[0]); });
    return fresh;
  }

  // Each distinct activity can earn its discovery reward once. Feelings and repeat visits are never scored.
  function award(activityId, uniqueKey) {
    var act = ACTIVITIES[activityId];
    if (!act || !IS_KID) return null;
    var completionId = activityId;
    if (uniqueKey != null && String(uniqueKey).trim()) {
      completionId += ':' + String(uniqueKey).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 60);
    }
    if (act.daily) completionId += '@' + today();
    var s = getState();
    var first = !s.completed[completionId];
    var newBadges = [];
    var pool = foodsFor(getBird().id, act.tier);
    var food = pool[Math.floor(Math.random() * pool.length)] || 'worm';
    if (first) {
      s.completed[completionId] = true;
      s.bugs[food] += 1;
      addLog(s, completionId, act.label, { bug: food });
    }
    if (first && act.badge && !s.badges[act.badge]) { s.badges[act.badge] = today(); newBadges.push(act.badge); }
    newBadges = newBadges.concat(checkBadges(s));
    saveState(s);
    var lines = [];
    if (first) {
      var b = BUG_TYPES[food];
      lines.push(b.icon + ' You found ' + b.name.toLowerCase() + '!');
      lines.push('<span style="font-weight:500;font-size:12px">' + act.label + '. You can feed it to ' + getBird().name + '.</span>');
    }
    newBadges.forEach(function (id) {
      if (STAGE_BADGES.indexOf(id) === -1) lines.push(BADGES[id].icon + ' New badge: ' + BADGES[id].name);
    });
    if (lines.length) toast(lines, false, 'bird-growth.html#feed');
    return { first: first, bug: first ? food : null, badges: newBadges };
  }

  function getBasket() {
    var s = getState();
    var mine = foodsFor(getBird().id);
    return BUG_ORDER.filter(function (b) { return mine.indexOf(b) !== -1 || s.bugs[b] > 0; })
      .map(function (b) { return { type: b, count: s.bugs[b], info: BUG_TYPES[b] }; });
  }
  function basketTotal() { var s = getState(); return BUG_ORDER.reduce(function (n, b) { return n + s.bugs[b]; }, 0); }

  /* ───────────── feeding: this is what makes the bird grow ───────────── */
  // Add a non-sensitive milestone entry to the local demo collection and shareable inbox.
  function createKeepsake(source, itemId, name, emoji, inboxLabel) {
    var u = getUser(), reqs = readJSON(REQ_KEY, []);
    if (reqs.some(function (r) { return r.source === source; })) return;
    var id = 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    var childName = u.displayName || u.nickname || 'Your child';
    reqs.push({ id: id, itemId: itemId, name: name, emoji: emoji, source: source, status: 'earned',
                childName: childName, birdName: u.birdName || '', parentCode: u.parentCode || '', createdAt: Date.now() });
    writeJSON(REQ_KEY, reqs);
    var inbox = readJSON(INBOX_KEY, []);
    inbox.push({ id: 'keepsake:' + id, kind: 'keepsake', label: inboxLabel || ('earned the ' + name + ' milestone'), icon: emoji,
                 childName: childName, ts: Date.now(), celebrated: false });
    writeJSON(INBOX_KEY, inbox);
  }
  function createMilestoneKeepsake(stageId) {
    var m = MILESTONES[stageId]; if (m) createKeepsake('milestone:' + stageId, m.itemId, m.name, m.emoji);
  }

  /* A child may choose to share a moment with a trusted grown-up. Sharing is optional and earns no points. */
  function submitMoment(feeling, emoji, note) {
    if (!IS_KID) return false;
    var u = getUser(), all = readJSON(MOMENTS_KEY, []);
    var m = { id: 'mo' + Date.now().toString(36), feeling: feeling || 'a feeling', emoji: emoji || '💛', note: (note || '').slice(0, 200),
              childName: u.displayName || u.nickname || 'Your child', status: 'shared', createdAt: Date.now() };
    all.push(m); writeJSON(MOMENTS_KEY, all);
    var inbox = readJSON(INBOX_KEY, []);
    inbox.push({ id: 'moment:' + m.id, kind: 'moment', label: 'chose to share a moment about ' + m.feeling.toLowerCase(), icon: m.emoji, childName: m.childName, ts: Date.now(), celebrated: false });
    writeJSON(INBOX_KEY, inbox);
    return m;
  }
  function getMoments() { return readJSON(MOMENTS_KEY, []); }


  function feed(type, count) {
    if (!IS_KID || !BUG_TYPES[type]) return null;
    var s = getState(), n = Math.min(count || 1, s.bugs[type]);
    if (n < 1) return { fed: 0 };
    var before = stageIndexFor(s.xp, s), info = BUG_TYPES[type];
    s.bugs[type] -= n; s.fed[type] += n;
    s.xp += info.growth * n;
    s.feathers.earned += info.feathers * n;
    addLog(s, 'fed', 'Fed ' + n + ' ' + info.name.toLowerCase() + (n > 1 ? 's' : ''), { fed: type });
    var fresh = checkBadges(s);
    var after = stageIndexFor(s.xp, s);
    var newStages = [];
    for (var i = before + 1; i <= after; i++) { newStages.push(STAGES[i].id); s.milestones[STAGES[i].id] = true; }
    saveState(s); syncUserStage();
    newStages.forEach(createMilestoneKeepsake);
    return { fed: n, growth: info.growth * n, feathers: info.feathers * n, stageUp: after > before, stage: STAGES[after], newStages: newStages, badges: fresh };
  }
  function feedAll() {
    var total = { fed: 0, growth: 0, feathers: 0, stageUp: false, newStages: [], badges: [], stage: null };
    BUG_ORDER.forEach(function (t) {
      var r = feed(t, 9999);
      if (r && r.fed) { total.fed += r.fed; total.growth += r.growth; total.feathers += r.feathers; total.stageUp = total.stageUp || r.stageUp; total.newStages = total.newStages.concat(r.newStages); total.badges = total.badges.concat(r.badges); total.stage = r.stage || total.stage; }
    });
    return total;
  }

  /* ───────────── feathers wallet, saving goal, closet ───────────── */
  function getFeathers() {
    var s = getState();
    return { earned: s.feathers.earned, spent: s.feathers.spent, balance: s.feathers.earned - s.feathers.spent };
  }
  function getCloset() {
    var s = getState(), c = s.closet;
    return { owned: c.owned.slice(), worn: Object.assign({}, c.worn), goal: s.goal || null };
  }
  function item(id) { return CLOSET.filter(function (c) { return c.id === id; })[0] || null; }
  function setGoal(id) { var s = getState(); s.goal = id || null; saveState(s); }
  function buy(id) {
    if (!IS_KID) return { ok: false, error: 'Sign in as a child to shop.' };
    var it = item(id), s = getState();
    if (!it) return { ok: false, error: 'Unknown item.' };
    if (s.closet.owned.indexOf(id) !== -1) return { ok: false, error: 'You already own this.' };
    var bal = s.feathers.earned - s.feathers.spent;
    if (bal < it.cost) return { ok: false, error: 'You need ' + (it.cost - bal) + ' more feathers.' };
    s.feathers.spent += it.cost; s.closet.owned.push(id);
    s.closet.worn[it.slot] = id;                      // wear it right away
    var wasGoal = s.goal === id; if (wasGoal) s.goal = null;
    saveState(s);
    return { ok: true, item: it, wasGoal: wasGoal };
  }
  function wear(id) {
    var s = getState(), it = item(id);
    if (!it || s.closet.owned.indexOf(id) === -1) return false;
    if (s.closet.worn[it.slot] === id) delete s.closet.worn[it.slot]; else s.closet.worn[it.slot] = id;
    saveState(s); return true;
  }

  function svgUri(it) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + it.vb + '">' + it.svg + '</svg>';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  /**
   * Draw the child's own bird at its current stage, wearing whatever it owns.
   * opts: { height: px, stage: 'baby' (override), bare: true (ignore clothes), class: 'extra classes' }
   */
  function renderAvatar(el, opts) {
    if (!el) return;
    opts = opts || {};
    var b = getBird(), p = getProgress(), s = getState();
    var stage = opts.stage || p.stage.id, h = opts.height || 120;
    var file = stage === 'egg' ? 'egg' : stage;
    var box = document.createElement('div');
    box.style.cssText = 'position:relative;display:inline-block;height:' + h + 'px;line-height:0';
    var img = document.createElement('img');
    img.src = 'assets/images/' + b.id + '-' + file + '.png';
    img.alt = ''; img.style.cssText = 'height:100%;width:auto;display:block';
    img.onerror = function () { box.innerHTML = '<span style="font-size:' + Math.round(h * .6) + 'px;line-height:1">' + (stage === 'egg' ? '🥚' : b.emoji) + '</span>'; };
    box.appendChild(img);
    if (!opts.bare && stage !== 'egg') {
      Object.keys(s.closet.worn).forEach(function (slot) {
        var it = item(s.closet.worn[slot]), pos = SLOT_BOX[slot];
        if (!it || !pos) return;
        var o = document.createElement('img');
        o.src = svgUri(it); o.alt = ''; o.setAttribute('data-slot', slot);
        o.style.cssText = 'position:absolute;pointer-events:none;top:' + pos.top + '%;left:' + pos.left + '%;width:' + pos.width + '%;height:auto';
        box.appendChild(o);
      });
    }
    el.innerHTML = ''; el.appendChild(box);
  }

  // Stage tiles used on nest pages. Only the child's own bird shows progress.
  function renderStagesGrid(el, birdId) {
    if (!el) return;
    var mine = getBird().id === birdId, p = getProgress();
    el.className = 'grid grid-cols-5 gap-2';
    el.innerHTML = '';
    STAGES.forEach(function (st, i) {
      var active = mine && i === p.index, past = mine && i < p.index;
      var div = document.createElement('div');
      div.className = 'text-center p-2 rounded-2xl border-2 ' + (active ? 'border-purple-400 bg-purple-50' : past ? 'border-green-300 bg-green-50 opacity-70' : 'border-gray-200 bg-gray-50 opacity-40');
      var art = '<img src="assets/images/' + birdId + '-' + (st.id === 'egg' ? 'egg' : st.id) + '.png" class="h-12 mx-auto mb-1 object-contain" alt="' + st.name + '" onerror="this.style.display=\'none\'">';
      div.innerHTML = art + '<p class="text-xs font-semibold text-gray-600">' + st.name + '</p>' +
        (active ? '<p class="text-xs text-purple-500 mt-1">★ Now</p>' : '') + (past ? '<p class="text-xs text-green-500 mt-1">✔</p>' : '');
      el.appendChild(div);
    });
  }

  function getLog() { return getState().log.slice().reverse(); }

  /* ───────────── automatic wiring by page ───────────── */
  function wirePage() {
    var file = (location.pathname.split('/').pop() || '').replace('.html', '');
    function onClick(sel, id, uniqueKey) {
      document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest(sel)) award(id, uniqueKey); });
    }
    if (file === 'nest') { onClick('#saveReflection, button[onclick="saveReflection()"]', 'reflection'); }
    else if (file === 'feeling-reflection') {
      var topic = new URLSearchParams(location.search).get('feeling') || 'first-reflection';
      onClick('#saveReflection', 'reflection', topic);
    }
  }

  window.VPGrowth = {
    STAGES: STAGES, BADGES: BADGES, ACTIVITIES: ACTIVITIES, BUG_TYPES: BUG_TYPES, BUG_ORDER: BUG_ORDER, TIERS: TIERS, TIER_ORDER: TIER_ORDER, DIET: DIET, FOOD_KINDS: FOOD_KINDS, foodsFor: foodsFor, dietFor: dietFor,
    MILESTONES: MILESTONES, submitMoment: submitMoment, getMoments: getMoments, CLOSET: CLOSET, STAGE_BADGES: STAGE_BADGES,
    getBird: getBird, getProgress: getProgress, getLog: getLog,
    award: award, getBasket: getBasket, basketTotal: basketTotal, feed: feed, feedAll: feedAll,
    getFeathers: getFeathers, getCloset: getCloset, setGoal: setGoal, buy: buy, wear: wear, item: item,
    renderAvatar: renderAvatar, renderStagesGrid: renderStagesGrid, toast: toast,
    totalFed: function () { return totalFed(getState()); },
  };

  if (IS_KID) { syncUserStage(); wirePage(); }
})();
