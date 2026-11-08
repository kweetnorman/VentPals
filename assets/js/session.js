/**
 * session.js – VentPals child session helper
 *
 * Handles:
 *  1. Tracking the last visited child page (ventpals_last_url)
 *  2. Injecting a shared bottom tab bar (Home, World, Nests, My Bird, Me, Log Out)
 *  3. Logout function that clears the session but preserves user data
 *
 * Scoped to child sessions only (ventpals_logged_in === 'true').
 * Does NOT interfere with adult/parent flows.
 */
(function () {
  'use strict';

  var LOGGED_IN_KEY = 'ventpals_logged_in';
  var LAST_URL_KEY  = 'ventpals_last_url';

  var isLoggedIn = localStorage.getItem(LOGGED_IN_KEY) === 'true';
  if (!isLoggedIn) return; // Not an active child session — do nothing

  /* ── 1. Resolve root path (handles pages inside subdirectories) ── */
  function resolveRoot() {
    // Count path segments before the filename to determine directory depth
    var parts = window.location.pathname.split('/').filter(Boolean);
    // Remove the filename (last segment)
    var depth = Math.max(0, parts.length - 1);
    return depth > 0 ? '../'.repeat(depth) : '';
  }

  /* ── 2. Track last meaningful page ── */
  var path = window.location.pathname;
  var skipPages = ['/login', '/signup', '/set-pin', '/app-switcher', '/onboarding'];
  var shouldTrack = !skipPages.some(function (s) { return path.indexOf(s) !== -1; });
  if (shouldTrack) {
    localStorage.setItem(LAST_URL_KEY, window.location.href);
  }

  /* ── 3. Logout ── */
  function doLogout() {
    localStorage.removeItem(LOGGED_IN_KEY);
    // Preserve ventpals_user and ventpals_last_url so the child can resume later
    window.location.href = resolveRoot() + 'login.html';
  }

  /* ── 4. Inject the shared bottom tab bar (same on every child page) ── */
  function injectTabBar() {
    if (document.getElementById('vp-tabbar')) return;
    var root = resolveRoot();
    var tabs = [
      { href: 'dashboard.html',  icon: '\u{1F3E0}', label: 'Home',    match: ['dashboard'] },
      { href: 'world.html',      icon: '\u{1F30D}', label: 'World',   match: ['world'] },
      { href: 'circles-dashboard.html', icon: '\u{1FAB9}', label: 'Nests',   match: ['nest', 'circle'] },
      { href: 'bird-growth.html',icon: '\u{1F423}', label: 'My Bird', match: ['bird-growth'] },
      { href: 'profile.html',    icon: '\u{1F642}', label: 'Me',      match: ['profile', 'settings'] }
    ];
    var file = (window.location.pathname.split('/').pop() || '').replace('.html', '');
    var bar = document.createElement('nav');
    bar.id = 'vp-tabbar';
    bar.setAttribute('aria-label', 'VentPals navigation');
    bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9999;display:flex;justify-content:space-around;' +
      'background:rgba(255,255,255,.96);border-top:1px solid rgba(17,24,39,.1);box-shadow:0 -4px 18px rgba(46,26,71,.08);' +
      'padding:6px 4px calc(6px + env(safe-area-inset-bottom));font-family:inherit';
    function item(href, icon, label, active, onclick) {
      var a = document.createElement(onclick ? 'button' : 'a');
      if (!onclick) a.href = href;
      a.style.cssText = 'flex:1;max-width:96px;display:flex;flex-direction:column;align-items:center;gap:1px;padding:4px 2px;' +
        'border:none;background:none;cursor:pointer;text-decoration:none;font:inherit;font-size:11px;font-weight:700;' +
        'color:' + (active ? '#A259FF' : '#6B7280') + ';border-radius:12px;' + (active ? 'background:rgba(162,89,255,.1)' : '');
      a.innerHTML = '<span style="font-size:20px;line-height:1.1" aria-hidden="true">' + icon + '</span><span>' + label + '</span>';
      if (onclick) a.addEventListener('click', onclick);
      return a;
    }
    tabs.forEach(function (t) {
      var active = t.match.some(function (m) { return file.indexOf(m) !== -1; });
      bar.appendChild(item(root + t.href, t.icon, t.label, active));
    });
    var out = item('', '\u{1F6AA}', 'Log Out', false, doLogout);
    out.id = 'vp-logout-btn';
    out.setAttribute('aria-label', 'Log out of VentPals');
    bar.appendChild(out);
    document.body.appendChild(bar);
    document.body.style.paddingBottom = 'calc(' + (parseInt(document.body.style.paddingBottom) || 0) + 'px + 72px)';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectTabBar);
  } else {
    injectTabBar();
  }

  /* ── 5. Expose helpers for other scripts ── */
  window.VPSession = {
    logout:    doLogout,
    isLoggedIn: true,
  };
})();
