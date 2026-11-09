/**
 * growth.js – the VentPals bird economy (demo: stored in this browser's localStorage)
 *
 *   ACTIVITY  --earns-->  BUG  --child feeds it to the bird-->  GROWTH points  (permanent, never lost)
 *                                                          \->  FEATHERS       (spendable on the avatar closet)
 *
 * - The bird is chosen once in onboarding and then LOCKED (user.birdLocked).
 * - Growth points move the bird: egg -> baby -> nestling -> feathered -> percher.
 * - Each new stage automatically earns a keepsake and notifies the grown-up (to confirm the address).
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
  var STAGES = [
    { id: 'egg',       name: 'Egg',       min: 0,   blurb: 'Your VentPal is safe and warm inside, waiting for you. Feed it a bug to help it hatch!' },
    { id: 'baby',      name: 'Baby',      min: 10,  blurb: 'Your VentPal just hatched. Soft, new, and full of possibility.' },
    { id: 'nestling',  name: 'Nestling',  min: 50,  blurb: 'Learning, growing, and finding a voice, one gentle step at a time.' },
    { id: 'feathered', name: 'Feathered', min: 120, blurb: 'More confident and steady. Feelings make more sense now.' },
    { id: 'percher',   name: 'Percher',   min: 220, blurb: 'Calm, wise, and grounded. Always here for you.' }
  ];

  /* ───────────── bugs: the food. Bigger effort = bigger bug ───────────── */
  var BUG_TYPES = {
    mosquito: { icon: '🦟', name: 'Mosquito', size: 'a tiny snack',  growth: 2,  feathers: 1 },
    worm:     { icon: '🪱', name: 'Worm',     size: 'a good snack',  growth: 4,  feathers: 2 },
    ladybug:  { icon: '🐞', name: 'Ladybug',  size: 'a tasty treat', growth: 6,  feathers: 3 },
    butterfly:{ icon: '🦋', name: 'Butterfly',size: 'a big feast',   growth: 12, feathers: 6 }
  };
  var BUG_ORDER = ['mosquito', 'worm', 'ladybug', 'butterfly'];

  /* ───────────── activities: what earns which bug (once per activity per day) ───────────── */
  var ACTIVITIES = {
    login:      { bug: 'mosquito',  label: 'Came back to visit',        badge: null },
    calming:    { bug: 'mosquito',  label: 'Explored calming skills',   badge: 'skill-explorer' },
    world:      { bug: 'mosquito',  label: 'Visited the World',         badge: 'world-explorer' },
    nest:       { bug: 'mosquito',  label: 'Visited a Nest',            badge: 'nest-visitor' },
    water:      { bug: 'worm',      label: 'Took a mindful sip',        badge: 'sip-and-settle' },
    butterfly:  { bug: 'worm',      label: 'Did a butterfly hug',       badge: 'butterfly-hugger' },
    breathing:  { bug: 'worm',      label: 'Practiced slow breathing',  badge: 'deep-breather' },
    grounding:  { bug: 'worm',      label: 'Did a grounding exercise',  badge: 'grounded' },
    feeling:    { bug: 'ladybug',   label: 'Checked in with a feeling', badge: 'first-feeling' },
    reflection: { bug: 'ladybug',   label: 'Wrote a reflection',        badge: 'reflector' },
    module:     { bug: 'butterfly', label: 'Finished a learning module', badge: 'learner' },
    streak7:    { bug: 'butterfly', label: 'Kept a 7-day streak',       badge: null },
    moment:     { bug: 'butterfly', label: 'A grown-up saw how you handled a feeling', badge: 'showed-grownup' }
  };

  /* ───────────── badges ───────────── */
  var BADGES = {
    'hatched':          { icon: '🐣', name: 'Hatched!',          how: 'Feed your egg until it hatches' },
    'nestling':         { icon: '🪺', name: 'Nestling Reached',  how: 'Grow to Nestling' },
    'feathered':        { icon: '🪶', name: 'Feathered Reached', how: 'Grow to Feathered' },
    'percher':          { icon: '🌟', name: 'Percher Reached',   how: 'Grow to Percher' },
    'first-feeling':    { icon: '💜', name: 'First Feeling',     how: 'Check in with a feeling' },
    'reflector':        { icon: '📓', name: 'Reflector',         how: 'Write a reflection' },
    'deep-breather':    { icon: '🌬️', name: 'Deep Breather',     how: 'Try slow breathing' },
    'grounded':         { icon: '🌳', name: 'Grounded',          how: 'Do a grounding exercise' },
    'butterfly-hugger': { icon: '🦋', name: 'Butterfly Hugger',  how: 'Do a butterfly hug' },
    'sip-and-settle':   { icon: '💧', name: 'Sip & Settle',      how: 'Take a mindful sip' },
    'skill-explorer':   { icon: '🧰', name: 'Skill Explorer',    how: 'Explore calming skills' },
    'world-explorer':   { icon: '🌍', name: 'World Explorer',    how: 'Visit the World' },
    'nest-visitor':     { icon: '🪹', name: 'Nest Visitor',      how: 'Visit a Nest' },
    'learner':          { icon: '🎓', name: 'Feeling Learner',   how: 'Finish a learning module' },
    'showed-grownup':   { icon: '🤝', name: 'Showed a Grown-Up', how: 'Show a grown-up how you handled a feeling' },
    'worm-gatherer':    { icon: '🪱', name: 'Worm Gatherer',     how: 'Feed your bird 10 bugs' },
    'bug-sharer':       { icon: '🐞', name: 'Bug Sharer',        how: 'Feed your bird 50 bugs' },
    'butterfly-feeder': { icon: '🦋', name: 'Butterfly Feeder',  how: 'Feed your bird 100 bugs' },
    'streak-3':         { icon: '🔥', name: '3-Day Streak',      how: 'Be active 3 days in a row' },
    'streak-7':         { icon: '🌈', name: '7-Day Streak',      how: 'Be active 7 days in a row' },
    'forager':          { icon: '🍂', name: 'Forager',           how: 'Be part of VentPals for 1 month' },
    'nest-builder':     { icon: '🌿', name: 'Nest Builder',      how: 'Be part of VentPals for 3 months' },
    'tree-percher':     { icon: '🌳', name: 'Tree Percher',      how: 'Be part of VentPals for 6 months' },
    'sky-soarer':       { icon: '☀️', name: 'Sky Soarer',        how: 'Be part of VentPals for 1 year' }
  };
  var STAGE_BADGES = ['hatched', 'nestling', 'feathered', 'percher'];
  var TIME_BADGES = [['forager', 30], ['nest-builder', 90], ['tree-percher', 180], ['sky-soarer', 365]];
  var FEED_BADGES = [['worm-gatherer', 10], ['bug-sharer', 50], ['butterfly-feeder', 100]];

  /* ───────────── milestone keepsakes: earned automatically when the bird reaches a stage ───────────── */
  var MILESTONES = {
    baby:      { itemId: 'stickers',  name: 'Bug & Feather Sticker Sheet', emoji: '✨' },
    nestling:  { itemId: 'pin',       name: 'VentPals Bird Pin',           emoji: '📌' },
    feathered: { itemId: 'pen',       name: 'VP Pen',                      emoji: '🖊️' },
    percher:   { itemId: 'hourglass', name: 'Conversation Hourglass',      emoji: '⏳' }
  };

  // Every 3 moments a grown-up verifies earns a keepsake (the child showed real skill, not just activity).
  var MOMENT_KEEPSAKE = { every: 3, itemId: 'journal', name: 'Circles Journal', emoji: '📓' };

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
    s.xp = s.xp || 0; s.badges = s.badges || {}; s.daily = s.daily || {}; s.days = s.days || []; s.log = s.log || [];
    s.bugs = s.bugs || {}; s.fed = s.fed || {};
    BUG_ORDER.forEach(function (b) { s.bugs[b] = s.bugs[b] || 0; s.fed[b] = s.fed[b] || 0; });
    s.feathers = s.feathers || { earned: 0, spent: 0 };
    s.closet = s.closet || { owned: [], worn: {} };
    s.milestones = s.milestones || {};
    s.joined = s.joined || Date.now();
    return s;
  }
  function saveState(s) { writeJSON(GROWTH_KEY, s); }

  function stageIndexFor(xp) {
    var idx = 0;
    STAGES.forEach(function (st, i) { if (xp >= st.min) idx = i; });
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
    var pct = next ? Math.round(((s.xp - cur.min) / (next.min - cur.min)) * 100) : 100;
    return { xp: s.xp, index: i, stage: cur, next: next, pct: pct, toNext: next ? next.min - s.xp : 0, badges: s.badges };
  }

  // Keep user.stage in sync so older pages that read it stay correct.
  function syncUserStage() {
    var u = getUser();
    var st = STAGES[stageIndexFor(getState().xp)].id;
    if (u.stage !== st) { u.stage = st; saveUser(u); }
  }

  function streakLength(days) {
    var set = {}; days.forEach(function (x) { set[x] = 1; });
    var n = 0, d = new Date();
    if (!set[today()]) d.setDate(d.getDate() - 1);
    while (set[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
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

  // Badges that depend on counts, time and streaks. Returns the list of newly earned badge ids.
  function checkBadges(s) {
    var d = today(), fresh = [];
    function give(id) { if (!s.badges[id]) { s.badges[id] = d; fresh.push(id); } }
    var idx = stageIndexFor(s.xp);
    if (idx >= 1) give('hatched');
    for (var i = 2; i <= idx; i++) give(STAGES[i].id);
    var fed = totalFed(s);
    FEED_BADGES.forEach(function (p) { if (fed >= p[1]) give(p[0]); });
    var age = Math.floor((Date.now() - s.joined) / 86400000);
    TIME_BADGES.forEach(function (p) { if (age >= p[1]) give(p[0]); });
    var st = streakLength(s.days);
    if (st >= 3) give('streak-3');
    if (st >= 7) give('streak-7');
    return fresh;
  }

  function award(activityId) {
    var act = ACTIVITIES[activityId];
    if (!act || !IS_KID) return null;
    var s = getState(), d = today();
    s.daily[d] = s.daily[d] || {};
    Object.keys(s.daily).forEach(function (k) { if (k !== d) delete s.daily[k]; });   // keep only today
    var first = !s.daily[d][activityId];
    var newBadges = [];
    if (first) {
      s.daily[d][activityId] = true;
      s.bugs[act.bug] += 1;
      if (s.days.indexOf(d) === -1) s.days.push(d);
      s.days = s.days.slice(-400);
      addLog(s, activityId, act.label, { bug: act.bug });
    }
    if (act.badge && !s.badges[act.badge]) { s.badges[act.badge] = d; newBadges.push(act.badge); }
    newBadges = newBadges.concat(checkBadges(s));
    var gotSeven = streakLength(s.days) >= 7 && !s.milestones.streak7;
    if (gotSeven) { s.milestones.streak7 = true; s.bugs.butterfly += 1; addLog(s, 'streak7', ACTIVITIES.streak7.label, { bug: 'butterfly' }); }
    saveState(s);

    var lines = [];
    if (first) {
      var b = BUG_TYPES[act.bug];
      lines.push(b.icon + ' You earned a ' + b.name.toLowerCase() + '!');
      lines.push('<span style="font-weight:500;font-size:12px">' + act.label + '. Tap to feed ' + getBird().name + '.</span>');
    }
    newBadges.forEach(function (id) {
      if (STAGE_BADGES.indexOf(id) === -1) lines.push(BADGES[id].icon + ' New badge: ' + BADGES[id].name);
    });
    if (gotSeven) lines.push('🦋 7-day streak! A butterfly for you!');
    if (lines.length && (activityId !== 'login' || first)) toast(lines, false, 'bird-growth.html#feed');
    return { first: first, bug: first ? act.bug : null, badges: newBadges };
  }

  function getBasket() {
    var s = getState();
    return BUG_ORDER.map(function (b) { return { type: b, count: s.bugs[b], info: BUG_TYPES[b] }; });
  }
  function basketTotal() { var s = getState(); return BUG_ORDER.reduce(function (n, b) { return n + s.bugs[b]; }, 0); }

  /* ───────────── feeding: this is what makes the bird grow ───────────── */
  function createKeepsake(source, itemId, name, emoji, inboxLabel) {
    var u = getUser(), reqs = readJSON(REQ_KEY, []);
    if (reqs.some(function (r) { return r.source === source; })) return;
    var id = 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    var childName = u.displayName || u.nickname || 'Your child';
    reqs.push({ id: id, itemId: itemId, name: name, emoji: emoji, source: source, status: 'earned',
                childName: childName, birdName: u.birdName || '', parentCode: u.parentCode || '', createdAt: Date.now() });
    writeJSON(REQ_KEY, reqs);
    var inbox = readJSON(INBOX_KEY, []);
    inbox.push({ id: 'keepsake:' + id, kind: 'keepsake', label: inboxLabel || (name + '. Please confirm a shipping address.'), icon: emoji,
                 childName: childName, ts: Date.now(), celebrated: false });
    writeJSON(INBOX_KEY, inbox);
  }
  function createMilestoneKeepsake(stageId) {
    var m = MILESTONES[stageId]; if (m) createKeepsake('milestone:' + stageId, m.itemId, m.name, m.emoji);
  }

  /* A child tells a trusted grown-up how they handled a feeling. The grown-up verifies it on their side. */
  function submitMoment(feeling, emoji, note) {
    if (!IS_KID) return false;
    var u = getUser(), all = readJSON(MOMENTS_KEY, []);
    var m = { id: 'mo' + Date.now().toString(36), feeling: feeling || 'a feeling', emoji: emoji || '💛', note: (note || '').slice(0, 200),
              childName: u.displayName || u.nickname || 'Your child', status: 'pending', createdAt: Date.now() };
    all.push(m); writeJSON(MOMENTS_KEY, all);
    var inbox = readJSON(INBOX_KEY, []);
    inbox.push({ id: 'moment:' + m.id, kind: 'moment', label: 'wants to show you how they handled feeling ' + m.feeling.toLowerCase(), icon: m.emoji, childName: m.childName, ts: Date.now(), celebrated: false });
    writeJSON(INBOX_KEY, inbox);
    return m;
  }
  function getMoments() { return readJSON(MOMENTS_KEY, []); }

  // When the child next opens the app, credit moments a grown-up has verified.
  function creditVerifiedMoments() {
    var all = readJSON(MOMENTS_KEY, []), changed = false, s = getState(), lines = [];
    all.forEach(function (m) {
      if (m.status === 'verified' && !m.credited) {
        m.credited = true; changed = true;
        s.bugs.butterfly += 1; addLog(s, 'moment', ACTIVITIES.moment.label, { bug: 'butterfly' });
        if (!s.badges['showed-grownup']) s.badges['showed-grownup'] = today();
        lines.push('🦋 A grown-up verified how you handled feeling ' + m.feeling.toLowerCase() + '! You earned a butterfly.');
      }
    });
    if (!changed) return;
    var verified = all.filter(function (m) { return m.status === 'verified'; }).length;
    saveState(s); writeJSON(MOMENTS_KEY, all);
    for (var n = MOMENT_KEEPSAKE.every; n <= verified; n += MOMENT_KEEPSAKE.every) {
      createKeepsake('moments:' + n, MOMENT_KEEPSAKE.itemId, MOMENT_KEEPSAKE.name, MOMENT_KEEPSAKE.emoji);
      lines.push(MOMENT_KEEPSAKE.emoji + ' You earned a ' + MOMENT_KEEPSAKE.name + '!');
    }
    toast(lines, true, 'rewards.html');
  }

  function feed(type, count) {
    if (!IS_KID || !BUG_TYPES[type]) return null;
    var s = getState(), n = Math.min(count || 1, s.bugs[type]);
    if (n < 1) return { fed: 0 };
    var before = stageIndexFor(s.xp), info = BUG_TYPES[type];
    s.bugs[type] -= n; s.fed[type] += n;
    s.xp += info.growth * n;
    s.feathers.earned += info.feathers * n;
    addLog(s, 'fed', 'Fed ' + n + ' ' + info.name.toLowerCase() + (n > 1 ? 's' : ''), { fed: type });
    var fresh = checkBadges(s);
    var after = stageIndexFor(s.xp);
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
    function dwell(id, secs) { setTimeout(function () { if (!document.hidden) award(id); }, secs * 1000); }
    function onClick(sel, id) {
      document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest(sel)) award(id); });
    }
    award('login');
    if (file === 'calming-skills') award('calming');
    else if (file === 'world') award('world');
    else if (/-nest$/.test(file)) { award('nest'); onClick('button[onclick="saveReflection()"]', 'reflection'); }
    else if (file === 'breathing') dwell('breathing', 20);
    else if (file === 'grounding') dwell('grounding', 30);
    else if (file === 'butterfly-hug') dwell('butterfly', 25);
    else if (file === 'water') dwell('water', 15);
    else if (file === 'feeling-reflection') onClick('#saveReflection', 'reflection');
    else if (file === 'feeling-selected') award('feeling');
  }

  window.VPGrowth = {
    STAGES: STAGES, BADGES: BADGES, ACTIVITIES: ACTIVITIES, BUG_TYPES: BUG_TYPES, BUG_ORDER: BUG_ORDER,
    MILESTONES: MILESTONES, MOMENT_KEEPSAKE: MOMENT_KEEPSAKE, submitMoment: submitMoment, getMoments: getMoments, CLOSET: CLOSET, STAGE_BADGES: STAGE_BADGES,
    getBird: getBird, getProgress: getProgress, getLog: getLog,
    award: award, getBasket: getBasket, basketTotal: basketTotal, feed: feed, feedAll: feedAll,
    getFeathers: getFeathers, getCloset: getCloset, setGoal: setGoal, buy: buy, wear: wear, item: item,
    renderAvatar: renderAvatar, renderStagesGrid: renderStagesGrid, toast: toast,
    totalFed: function () { return totalFed(getState()); },
    streak: function () { return streakLength(getState().days); }
  };

  if (IS_KID) { syncUserStage(); creditVerifiedMoments(); wirePage(); }
})();
