/**
 * growth.js – VentPals bird growth engine (demo: stored in this browser's localStorage)
 *
 * - The bird is chosen once in onboarding and then LOCKED (user.birdLocked).
 * - Doing calming/feeling activities earns XP (once per activity per day) and badges.
 * - XP moves the bird: egg -> baby -> nestling -> feathered -> percher.
 * - Pages self-configure by file name below (no per-page wiring needed).
 *
 * Tune the pace by editing STAGES and ACTIVITIES.
 */
(function () {
  'use strict';
  // Parent pages also load this file to READ progress; only a signed-in child can earn.
  var IS_KID = localStorage.getItem('ventpals_logged_in') === 'true';

  var GROWTH_KEY = 'ventpals_growth';
  var USER_KEY = 'ventpals_user';

  var STAGES = [
    { id: 'egg',       name: 'Egg',       min: 0,   blurb: 'Your VentPal is safe and warm inside, waiting for you. Do a calming activity to help it hatch!' },
    { id: 'baby',      name: 'Baby',      min: 10,  blurb: 'Your VentPal just hatched. Soft, new, and full of possibility.' },
    { id: 'nestling',  name: 'Nestling',  min: 50,  blurb: 'Learning, growing, and finding a voice, one gentle step at a time.' },
    { id: 'feathered', name: 'Feathered', min: 120, blurb: 'More confident and steady. Feelings make more sense now.' },
    { id: 'percher',   name: 'Percher',   min: 220, blurb: 'Calm, wise, and grounded. Always here for you.' }
  ];

  // xp = points per day for that activity (once per day each)
  var ACTIVITIES = {
    feeling:    { xp: 10, label: 'Checked in with a feeling',  badge: 'first-feeling' },
    reflection: { xp: 10, label: 'Wrote a reflection',         badge: 'reflector' },
    breathing:  { xp: 8,  label: 'Practiced slow breathing',   badge: 'deep-breather' },
    grounding:  { xp: 8,  label: 'Did a grounding exercise',   badge: 'grounded' },
    butterfly:  { xp: 8,  label: 'Did a butterfly hug',        badge: 'butterfly-hugger' },
    water:      { xp: 5,  label: 'Took a mindful sip',         badge: 'sip-and-settle' },
    calming:    { xp: 3,  label: 'Explored calming skills',    badge: 'skill-explorer' },
    world:      { xp: 3,  label: 'Visited the World',          badge: 'world-explorer' },
    nest:       { xp: 3,  label: 'Visited a Nest',             badge: 'nest-visitor' }
  };

  var BADGES = {
    'hatched':          { icon: '🐣', name: 'Hatched!',          how: 'Help your egg hatch' },
    'first-feeling':    { icon: '💜', name: 'First Feeling',     how: 'Check in with a feeling' },
    'reflector':        { icon: '📓', name: 'Reflector',         how: 'Write a reflection' },
    'deep-breather':    { icon: '🌬️', name: 'Deep Breather',     how: 'Try slow breathing' },
    'grounded':         { icon: '🌳', name: 'Grounded',          how: 'Do a grounding exercise' },
    'butterfly-hugger': { icon: '🦋', name: 'Butterfly Hugger',  how: 'Do a butterfly hug' },
    'sip-and-settle':   { icon: '💧', name: 'Sip & Settle',      how: 'Take a mindful sip' },
    'skill-explorer':   { icon: '🧰', name: 'Skill Explorer',    how: 'Explore calming skills' },
    'world-explorer':   { icon: '🌍', name: 'World Explorer',    how: 'Visit the World' },
    'nest-visitor':     { icon: '🪹', name: 'Nest Visitor',      how: 'Visit a Nest' },
    'streak-3':         { icon: '🔥', name: '3-Day Streak',      how: 'Be active 3 days' },
    'streak-7':         { icon: '🌈', name: '7-Day Streak',      how: 'Be active 7 days' },
    'nestling':         { icon: '🪺', name: 'Nestling Reached',  how: 'Grow to Nestling' },
    'feathered':        { icon: '🪶', name: 'Feathered Reached', how: 'Grow to Feathered' },
    'percher':          { icon: '🌟', name: 'Percher Reached',   how: 'Grow to Percher' }
  };

  var BIRD_META = {
    aura: ['Aura', '🕊️'], breezy: ['Breezy', '🍃'], clover: ['Clover', '🍀'], cove: ['Cove', '🌊'],
    drift: ['Drift', '🌙'], echo: ['Echo', '🔔'], flamez: ['Flamez', '🔥'], flare: ['Flare', '⚡'],
    flicker: ['Flicker', '💫'], guardian: ['Guardian', '🛡️'], lumen: ['Lumen', '💡'], nova: ['Nova', '🌟'],
    pebble: ['Pebble', '🪨'], sable: ['Sable', '⭐'], solace: ['Solace', '🌿'], twig: ['Twig', '🌱']
  };

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function readJSON(k, fb) { try { return JSON.parse(localStorage.getItem(k)) || fb; } catch (e) { return fb; } }
  function getUser() { return readJSON(USER_KEY, {}); }
  function saveUser(u) { try { localStorage.setItem(USER_KEY, JSON.stringify(u)); } catch (e) {} }
  function getState() {
    var s = readJSON(GROWTH_KEY, null) || {};
    s.xp = s.xp || 0; s.badges = s.badges || {}; s.daily = s.daily || {}; s.days = s.days || [];
    return s;
  }
  // Feathers: the spendable keepsake currency, always derived (never drifts out of sync).
  var FEATHER_RULES = { perBadge: 5, perStage: 20, xpPerFeather: 10 };
  function getFeathers() {
    var s = getState(), stageIdx = stageIndexFor(s.xp);
    var earned = Object.keys(s.badges).length * FEATHER_RULES.perBadge + stageIdx * FEATHER_RULES.perStage + Math.floor(s.xp / FEATHER_RULES.xpPerFeather);
    var spent = 0;
    readJSON('ventpals_keepsake_requests', []).forEach(function (r) { if (r.status !== 'declined') spent += r.cost || 0; });
    return { earned: earned, spent: spent, balance: earned - spent };
  }
  function getLog() { return (getState().log || []).slice().reverse(); }
  function saveState(s) { try { localStorage.setItem(GROWTH_KEY, JSON.stringify(s)); } catch (e) {} }

  function stageIndexFor(xp) {
    var idx = 0;
    STAGES.forEach(function (st, i) { if (xp >= st.min) idx = i; });
    return idx;
  }

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

  function toast(lines, big) {
    if (!document.body) { document.addEventListener('DOMContentLoaded', function () { toast(lines, big); }); return; }
    var el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:92px;z-index:10000;max-width:92vw;' +
      'background:' + (big ? '#7c3aed' : '#2E1A47') + ';color:#fff;border-radius:18px;padding:' + (big ? '16px 22px' : '10px 16px') +
      ';font:600 ' + (big ? '16px' : '13px') + '/1.4 system-ui,sans-serif;text-align:center;box-shadow:0 10px 30px rgba(46,26,71,.35);' +
      'opacity:0;transition:opacity .3s,transform .3s';
    el.innerHTML = lines.join('<br>');
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.style.opacity = '1'; });
    setTimeout(function () { el.style.opacity = '0'; setTimeout(function () { el.remove(); }, 400); }, big ? 5000 : 3200);
  }

  function award(activityId) {
    var act = ACTIVITIES[activityId];
    if (!act || !IS_KID) return null;
    var s = getState(), d = today();
    s.daily[d] = s.daily[d] || {};
    // prune old days
    Object.keys(s.daily).forEach(function (k) { if (k !== d) delete s.daily[k]; });
    var firstToday = !s.daily[d][activityId];
    var beforeIdx = stageIndexFor(s.xp);
    var gained = 0, newBadges = [];

    if (firstToday) {
      s.daily[d][activityId] = true;
      gained = act.xp;
      s.xp += gained;
      if (s.days.indexOf(d) === -1) s.days.push(d);
      s.days = s.days.slice(-60);
      s.log = (s.log || []).concat([{ t: Date.now(), id: activityId, label: act.label, xp: gained }]).slice(-20);
    }
    function give(id) { if (!s.badges[id]) { s.badges[id] = d; newBadges.push(id); } }
    if (act.badge) give(act.badge);

    var afterIdx = stageIndexFor(s.xp);
    if (afterIdx >= 1) give('hatched');
    for (var i = 2; i <= afterIdx; i++) give(STAGES[i].id);
    if (streakLength(s.days) >= 3) give('streak-3');
    if (streakLength(s.days) >= 7) give('streak-7');

    saveState(s);
    syncUserStage();

    var lines = [];
    if (gained) lines.push('+' + gained + ' ✨ ' + act.label);
    newBadges.forEach(function (b) { if (b !== 'hatched' && b !== 'nestling' && b !== 'feathered' && b !== 'percher') lines.push(BADGES[b].icon + ' New badge: ' + BADGES[b].name); });
    if (afterIdx > beforeIdx) {
      var st = STAGES[afterIdx], bird = getBird();
      toast([afterIdx === 1 ? '🐣 ' + bird.name + ' hatched!' : '🎉 ' + bird.name + ' grew to ' + st.name + '!', '<span style="font-weight:500;font-size:13px">See it on the My Bird tab</span>'], true);
    } else if (lines.length) {
      toast(lines, false);
    }
    return { gained: gained, badges: newBadges, stageUp: afterIdx > beforeIdx };
  }

  function streakLength(days) {
    // consecutive days ending today or yesterday
    var set = {}; days.forEach(function (x) { set[x] = 1; });
    var n = 0, d = new Date();
    if (!set[today()]) d.setDate(d.getDate() - 1);
    for (;;) {
      var k = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
      if (!set[k]) break;
      n++; d.setDate(d.getDate() - 1);
    }
    return n;
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

  // ---- automatic wiring by page ----
  function wirePage() {
    var file = (location.pathname.split('/').pop() || '').replace('.html', '');
    function dwell(id, secs) { setTimeout(function () { if (!document.hidden) award(id); }, secs * 1000); }
    function onClick(sel, id) {
      document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest(sel)) award(id); });
    }
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
    STAGES: STAGES, BADGES: BADGES, ACTIVITIES: ACTIVITIES,
    FEATHER_RULES: FEATHER_RULES, getFeathers: getFeathers, getLog: getLog,
    getBird: getBird, getProgress: getProgress, award: award, renderStagesGrid: renderStagesGrid,
    streak: function () { return streakLength(getState().days); }
  };

  if (IS_KID) { syncUserStage(); wirePage(); }
})();
