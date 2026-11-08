/**
 * keepsakes.js: keepsake requests between a child and their grown-up, plus the Shopify hand-off.
 *
 * DEMO STORAGE: requests live in this browser's localStorage, so the child and grown-up must use
 * the same browser for now. The functions below are the only place that touches storage, so moving
 * to Firestore later means changing this one file.
 *
 * Request life cycle:  requested -> approved -> ordered      (or: requested -> declined, feathers returned)
 */
(function () {
  'use strict';
  var REQ_KEY = 'ventpals_keepsake_requests';
  var INBOX_KEY = 'ventpals_parent_inbox';
  var CFG = window.VP_SHOP || { domain: '', items: [] };

  function read(k, fb) { try { return JSON.parse(localStorage.getItem(k)) || fb; } catch (e) { return fb; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function uid() { return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function child() { return read('ventpals_user', {}); }

  function item(id) { return CFG.items.filter(function (i) { return i.id === id; })[0] || null; }
  function isConnected(i) { return !!(CFG.domain && i && i.variantId); }
  function requests() { return read(REQ_KEY, []); }
  function activeFor(itemId) { return requests().filter(function (r) { return r.itemId === itemId && r.status !== 'declined'; })[0] || null; }

  function submitRequest(itemId, note) {
    var it = item(itemId); if (!it) return { ok: false, error: 'Unknown keepsake.' };
    if (activeFor(itemId)) return { ok: false, error: 'You already asked for this one.' };
    var fe = window.VPGrowth ? VPGrowth.getFeathers() : { balance: 0 };
    if (fe.balance < it.cost) return { ok: false, error: 'Not enough feathers yet.' };
    var u = child();
    var req = {
      id: uid(), itemId: it.id, name: it.name, cost: it.cost, note: (note || '').slice(0, 140),
      childName: u.displayName || u.nickname || 'Your child', birdName: u.birdName || '',
      parentCode: u.parentCode || '', status: 'requested', createdAt: Date.now()
    };
    var all = requests(); all.push(req); write(REQ_KEY, all);
    return { ok: true, request: req };
  }
  function setStatus(id, status) {
    var all = requests();
    all.forEach(function (r) { if (r.id === id) { r.status = status; r[status + 'At'] = Date.now(); } });
    write(REQ_KEY, all);
  }

  // Shopify cart permalink: opens a cart with the product already in it. Works without any backend.
  function cartUrl(req) {
    var it = item(req.itemId);
    if (!isConnected(it)) return null;
    var q = ['note=' + encodeURIComponent('VentPals keepsake for ' + req.childName + ' (request ' + req.id + ')'),
             'attributes[ventpals_request]=' + encodeURIComponent(req.id),
             'attributes[child]=' + encodeURIComponent(req.childName)];
    if (CFG.discountCode) q.push('discount=' + encodeURIComponent(CFG.discountCode));
    return 'https://' + CFG.domain + '/cart/' + it.variantId + ':1?' + q.join('&');
  }
  // Optional: tell an automation (Zapier / Shopify Flow / Cloud Function) about the approved request.
  function notifyWebhook(req) {
    if (!CFG.orderWebhook) return false;
    try {
      fetch(CFG.orderWebhook, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ event: 'keepsake_approved', request: req, variantId: (item(req.itemId) || {}).variantId || null }) });
      return true;
    } catch (e) { return false; }
  }

  // "Share with my grown-up": a child sends a finished milestone to the grown-up's inbox.
  function shareCompletion(kind, key, label, icon) {
    var all = read(INBOX_KEY, []), id = kind + ':' + key;
    if (all.some(function (x) { return x.id === id; })) return false;
    var u = child();
    all.push({ id: id, kind: kind, label: label, icon: icon || '🎉', childName: u.displayName || u.nickname || 'Your child', ts: Date.now(), celebrated: false });
    write(INBOX_KEY, all); return true;
  }
  function inbox() { return read(INBOX_KEY, []); }
  function isShared(kind, key) { return inbox().some(function (x) { return x.id === kind + ':' + key; }); }
  function celebrate(id) { var all = inbox(); all.forEach(function (x) { if (x.id === id) x.celebrated = true; }); write(INBOX_KEY, all); }

  window.VPShop = {
    config: CFG, item: item, isConnected: isConnected, requests: requests, activeFor: activeFor,
    submitRequest: submitRequest, setStatus: setStatus, cartUrl: cartUrl, notifyWebhook: notifyWebhook,
    shareCompletion: shareCompletion, inbox: inbox, isShared: isShared, celebrate: celebrate
  };
})();
