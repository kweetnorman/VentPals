/**
 * keepsakes.js: earned keepsakes, parent address confirmation, and moments a grown-up verifies.
 *
 * Keepsakes are EARNED automatically (growth.js creates them when a bird reaches a stage, or after
 * grown-up verified moments). A grown-up then confirms a shipping address, and the order is sent.
 *
 * DEMO STORAGE: everything lives in this browser's localStorage, so the child and grown-up must use
 * the same browser for now. The functions here are the only place that touches storage, so moving
 * to Firestore later means changing this one file. Do not collect real addresses until then.
 *
 * Keepsake life cycle:  earned -> confirmed (address given) -> shipped
 */
(function () {
  'use strict';
  var REQ_KEY = 'ventpals_keepsake_requests';
  var INBOX_KEY = 'ventpals_parent_inbox';
  var MOMENTS_KEY = 'ventpals_moments';
  var CFG = window.VP_SHOP || { domain: '', items: [] };

  function read(k, fb) { try { return JSON.parse(localStorage.getItem(k)) || fb; } catch (e) { return fb; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function item(id) { return CFG.items.filter(function (i) { return i.id === id; })[0] || null; }
  function isConnected(i) { return !!(CFG.domain && i && i.variantId); }
  function keepsakes() { return read(REQ_KEY, []); }

  // Physical fulfillment is disabled in the development preview. Never collect addresses here.
  function confirmAddress(id, address) {
    if (localStorage.getItem('ventpals_development_mode') === 'true') return false;
    var all = keepsakes(), k = all.filter(function (r) { return r.id === id; })[0];
    if (!k) return false;
    k.address = address; k.status = 'confirmed'; k.confirmedAt = Date.now();
    write(REQ_KEY, all);
    notifyWebhook(k);
    return true;
  }
  function setStatus(id, status) {
    var all = keepsakes();
    all.forEach(function (r) { if (r.id === id) { r.status = status; r[status + 'At'] = Date.now(); } });
    write(REQ_KEY, all);
  }
  function notifyWebhook(k) {
    if (!CFG.orderWebhook) return false;
    try {
      fetch(CFG.orderWebhook, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ event: 'keepsake_confirmed', keepsake: { id: k.id, itemId: k.itemId, name: k.name, source: k.source },
                               child: k.childName, bird: k.birdName, address: k.address, variantId: (item(k.itemId) || {}).variantId || null }) });
      return true;
    } catch (e) { return false; }
  }

  // Cart link for when a grown-up wants to BUY a keepsake themselves (supports VentPals and their child's bird).
  function buyUrl(itemId) {
    var it = item(itemId);
    if (!isConnected(it)) return CFG.storefront || ('https://' + CFG.domain);
    return 'https://' + CFG.domain + '/cart/' + it.variantId + ':1';
  }

  // Moments a child chooses to share. Adult acknowledgement is not a condition for progress.
  function moments() { return read(MOMENTS_KEY, []); }
  function verifyMoment(id) {
    var all = moments();
    all.forEach(function (m) { if (m.id === id) { m.status = 'verified'; m.verifiedAt = Date.now(); } });
    write(MOMENTS_KEY, all);
  }

  function inbox() { return read(INBOX_KEY, []); }
  // Child tells a grown-up about a badge they earned.
  function isShared(kind, key) { return inbox().some(function (x) { return x.id === kind + ':' + key; }); }
  function shareCompletion(kind, key, label, icon) {
    if (isShared(kind, key)) return;
    var u = read('ventpals_user', {}), all = inbox();
    all.push({ id: kind + ':' + key, kind: kind, label: label, icon: icon, childName: u.displayName || u.nickname || 'Your child', ts: Date.now(), celebrated: false });
    write(INBOX_KEY, all);
  }
  function celebrate(id) { var all = inbox(); all.forEach(function (x) { if (x.id === id) x.celebrated = true; }); write(INBOX_KEY, all); }

  window.VPShop = {
    config: CFG, item: item, isConnected: isConnected, keepsakes: keepsakes, confirmAddress: confirmAddress, setStatus: setStatus,
    buyUrl: buyUrl, moments: moments, verifyMoment: verifyMoment, inbox: inbox, celebrate: celebrate, isShared: isShared, shareCompletion: shareCompletion
  };
})();
