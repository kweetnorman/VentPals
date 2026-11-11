/**
 * keepsakes.js: local demo keepsake collection and child-chosen sharing.
 *
 * Keepsakes are added to the local demo collection when a bird reaches a growth stage. Physical
 * fulfillment, shipping addresses, and order webhooks are intentionally disabled in this preview.
 *
 * DEMO STORAGE: everything lives in this browser's localStorage, so the child and grown-up must use
 * the same browser for now. The functions here are the only place that touches storage, so moving
 * to secure cloud storage later means changing this one file. Never collect real addresses in this preview.
 *
 * Keepsake life cycle: earned in the demo collection; fulfillment will be designed separately.
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


  // Cart link for when a grown-up wants to BUY a keepsake themselves (supports VentPals and their child's bird).
  function buyUrl(itemId) {
    var it = item(itemId);
    if (!isConnected(it)) return CFG.storefront || ('https://' + CFG.domain);
    return 'https://' + CFG.domain + '/cart/' + it.variantId + ':1';
  }

  // Moments a child chooses to share. Adult acknowledgement is not a condition for progress.
  function moments() { return read(MOMENTS_KEY, []); }
  function acknowledgeMoment(id) {
    var all = moments();
    all.forEach(function (m) { if (m.id === id) { m.status = 'acknowledged'; m.acknowledgedAt = Date.now(); } });
    write(MOMENTS_KEY, all);
    celebrate('moment:' + id);
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
    config: CFG, item: item, isConnected: isConnected, keepsakes: keepsakes,
    buyUrl: buyUrl, moments: moments, acknowledgeMoment: acknowledgeMoment, inbox: inbox, celebrate: celebrate, isShared: isShared, shareCompletion: shareCompletion
  };
})();
