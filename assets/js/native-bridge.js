/**
 * native-bridge.js — VentPals native feature bridge
 *
 * Provides a unified API for:
 *   - Native share sheet          (Share plugin / Web Share API fallback)
 *   - Haptic feedback             (Haptics plugin)
 *   - Local notifications         (LocalNotifications plugin)
 *   - Network / offline detection (Network plugin)
 *   - Deep link routing           (App plugin — ventpals:// scheme)
 *   - In-app browser              (Browser plugin)
 *   - Offline banner              (injected automatically)
 *
 * Works in both native Capacitor apps and plain-browser sessions.
 * All Capacitor plugin calls are guarded so the file loads safely in a browser.
 */

(function (global) {
  'use strict';

  /* ── Capacitor detection ── */
  var Cap     = global.Capacitor  || null;
  var Plugins = (Cap && Cap.Plugins) ? Cap.Plugins : {};
  var isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());

  /* ================================================================
   * 1. HAPTICS
   * ============================================================== */
  var VP_Haptics = {
    /**
     * Light tap — e.g., button press
     */
    tap: function () {
      if (isNative && Plugins.Haptics) {
        Plugins.Haptics.impact({ style: 'LIGHT' });
      }
    },

    /**
     * Medium impact — e.g., successful form submit
     */
    medium: function () {
      if (isNative && Plugins.Haptics) {
        Plugins.Haptics.impact({ style: 'MEDIUM' });
      }
    },

    /**
     * Success notification — e.g., correct PIN, onboarding complete
     */
    success: function () {
      if (isNative && Plugins.Haptics) {
        Plugins.Haptics.notification({ type: 'SUCCESS' });
      }
    },

    /**
     * Warning notification — e.g., wrong PIN
     */
    warning: function () {
      if (isNative && Plugins.Haptics) {
        Plugins.Haptics.notification({ type: 'WARNING' });
      }
    },

    /**
     * Error notification
     */
    error: function () {
      if (isNative && Plugins.Haptics) {
        Plugins.Haptics.notification({ type: 'ERROR' });
      }
    },
  };

  /* ================================================================
   * 2. SHARE
   * ============================================================== */
  var VP_Share = {
    /**
     * Opens native share sheet.
     * Falls back to Web Share API, then clipboard copy.
     *
     * @param {Object} opts  { title, text, url, dialogTitle }
     * @returns {Promise}
     */
    share: function (opts) {
      opts = opts || {};

      // Capacitor Share plugin
      if (isNative && Plugins.Share) {
        return Plugins.Share.share({
          title:       opts.title       || 'VentPals',
          text:        opts.text        || '',
          url:         opts.url         || '',
          dialogTitle: opts.dialogTitle || 'Share via',
        });
      }

      // Web Share API (mobile browsers, PWA)
      if (navigator.share) {
        return navigator.share({
          title: opts.title || 'VentPals',
          text:  opts.text  || '',
          url:   opts.url   || '',
        });
      }

      // Clipboard fallback
      var combined = [opts.title, opts.text, opts.url].filter(Boolean).join('\n');
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(combined).then(function () {
          VP_Share._toast('Copied to clipboard!');
        });
      }
      return VP_Share._legacyCopy(combined);
    },

    _legacyCopy: function (text) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand('copy'); VP_Share._toast('Copied!'); } catch (e) {}
      document.body.removeChild(ta);
      return Promise.resolve();
    },

    _toast: function (msg) {
      var el = document.createElement('div');
      el.textContent = msg;
      el.style.cssText = [
        'position:fixed','bottom:90px','left:50%','transform:translateX(-50%)',
        'background:rgba(46,26,71,0.9)','color:#fff','padding:10px 20px',
        'border-radius:999px','font-size:14px','font-weight:600',
        'z-index:99999','pointer-events:none','transition:opacity .4s',
      ].join(';');
      document.body.appendChild(el);
      setTimeout(function () { el.style.opacity = '0'; }, 1600);
      setTimeout(function () { document.body.removeChild(el); }, 2200);
    },
  };

  /* ================================================================
   * 3. LOCAL NOTIFICATIONS (check-in reminders)
   * ============================================================== */
  var NOTIF_PREF_KEY      = 'ventpals_notif_enabled';
  var NOTIF_TIME_KEY      = 'ventpals_notif_time';   // "HH:MM"
  var NOTIF_PERMISSION_KEY = 'ventpals_notif_permission'; // 'granted'|'denied'

  var VP_Notifications = {
    /**
     * Request permission and store result.
     * @returns {Promise<string>} 'granted' | 'denied' | 'prompt'
     */
    requestPermission: function () {
      if (isNative && Plugins.LocalNotifications) {
        return Plugins.LocalNotifications.requestPermissions().then(function (res) {
          var status = (res && res.display) ? res.display : 'denied';
          localStorage.setItem(NOTIF_PERMISSION_KEY, status);
          return status;
        });
      }
      // Browser fallback (Notification API)
      if ('Notification' in window) {
        return Notification.requestPermission().then(function (perm) {
          localStorage.setItem(NOTIF_PERMISSION_KEY, perm);
          return perm;
        });
      }
      return Promise.resolve('denied');
    },

    /**
     * Schedule (or reschedule) daily check-in reminder.
     * Reads time from localStorage (ventpals_notif_time).
     */
    scheduleDailyReminder: function () {
      if (!VP_Notifications.isEnabled()) return Promise.resolve();

      var timeStr = localStorage.getItem(NOTIF_TIME_KEY) || '09:00';
      var parts   = timeStr.split(':');
      var hour    = parseInt(parts[0], 10);
      var minute  = parseInt(parts[1], 10);

      if (isNative && Plugins.LocalNotifications) {
        // Cancel existing daily reminder first
        return Plugins.LocalNotifications.cancel({ notifications: [{ id: 1001 }] })
          .catch(function () {})
          .then(function () {
            var now       = new Date();
            var scheduled = new Date();
            scheduled.setHours(hour, minute, 0, 0);
            if (scheduled <= now) {
              scheduled.setDate(scheduled.getDate() + 1);
            }
            return Plugins.LocalNotifications.schedule({
              notifications: [{
                id:       1001,
                title:    '🐦 VentPals check-in time!',
                body:     'How are you feeling today? Your VentPal is waiting.',
                schedule: {
                  at:       scheduled,
                  repeats:  true,
                  every:    'day',
                },
                extra: { type: 'daily-checkin' },
              }],
            });
          });
      }

      // Browser fallback: schedule a one-off Notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        var delay = VP_Notifications._msUntil(hour, minute);
        setTimeout(function () {
          /* eslint-disable no-new */
          new Notification('🐦 VentPals check-in time!', {
            body: 'How are you feeling today? Your VentPal is waiting.',
            icon: '/assets/images/logo.png',
          });
        }, delay);
      }
      return Promise.resolve();
    },

    /**
     * Cancel all scheduled reminders.
     */
    cancelReminders: function () {
      if (isNative && Plugins.LocalNotifications) {
        return Plugins.LocalNotifications.cancel({ notifications: [{ id: 1001 }] });
      }
      return Promise.resolve();
    },

    isEnabled: function () {
      return localStorage.getItem(NOTIF_PREF_KEY) === 'true';
    },

    setEnabled: function (enabled) {
      localStorage.setItem(NOTIF_PREF_KEY, enabled ? 'true' : 'false');
      if (enabled) {
        VP_Notifications.requestPermission().then(function (status) {
          if (status === 'granted') {
            VP_Notifications.scheduleDailyReminder();
          }
        });
      } else {
        VP_Notifications.cancelReminders();
      }
    },

    getTime: function () {
      return localStorage.getItem(NOTIF_TIME_KEY) || '09:00';
    },

    setTime: function (hhmm) {
      localStorage.setItem(NOTIF_TIME_KEY, hhmm);
      if (VP_Notifications.isEnabled()) {
        VP_Notifications.scheduleDailyReminder();
      }
    },

    _msUntil: function (hour, minute) {
      var now  = new Date();
      var then = new Date();
      then.setHours(hour, minute, 0, 0);
      if (then <= now) then.setDate(then.getDate() + 1);
      return then - now;
    },
  };

  /* ================================================================
   * 4. NETWORK / OFFLINE DETECTION
   * ============================================================== */
  var VP_Network = {
    _banner: null,
    _connected: true,

    init: function () {
      VP_Network._createBanner();

      if (isNative && Plugins.Network) {
        // Get initial status
        Plugins.Network.getStatus().then(function (status) {
          VP_Network._setConnected(status.connected);
        });
        // Listen for changes
        Plugins.Network.addListener('networkStatusChange', function (status) {
          VP_Network._setConnected(status.connected);
        });
      } else {
        // Browser fallback
        VP_Network._setConnected(navigator.onLine);
        window.addEventListener('online',  function () { VP_Network._setConnected(true);  });
        window.addEventListener('offline', function () { VP_Network._setConnected(false); });
      }
    },

    _createBanner: function () {
      if (document.getElementById('vp-offline-banner')) return;
      var banner = document.createElement('div');
      banner.id = 'vp-offline-banner';
      banner.innerHTML = '🌿 You\'re offline — some features may be unavailable';
      banner.style.cssText = [
        'position:fixed','top:0','left:0','right:0',
        'background:linear-gradient(90deg,#A259FF,#7ED957)',
        'color:#fff','text-align:center',
        'padding:10px 16px','font-size:13px','font-weight:600',
        'z-index:99998','display:none',
        'transition:transform .3s',
      ].join(';');
      document.body.appendChild(banner);
      VP_Network._banner = banner;
    },

    _setConnected: function (connected) {
      VP_Network._connected = connected;
      if (VP_Network._banner) {
        VP_Network._banner.style.display = connected ? 'none' : 'block';
      }
      // Emit a custom event so pages can react if needed
      try {
        window.dispatchEvent(new CustomEvent('vp:network', { detail: { connected: connected } }));
      } catch (e) {}
    },

    isConnected: function () {
      return VP_Network._connected;
    },
  };

  /* ================================================================
   * 5. DEEP LINK ROUTING  (ventpals://<path>)
   * ============================================================== */
  var DEEP_LINK_MAP = {
    '':           'index.html',
    'home':       'index.html',
    'login':      'login.html',
    'signup':     'signup.html',
    'dashboard':  'dashboard.html',
    'onboarding': 'onboarding/onboarding.html',
    'settings':   'settings.html',
    'nest':       'circles-dashboard.html',
    'world':      'world.html',
    'calming':    'calming-skills.html',
    'feelings':   'start-feeling.html',
  };

  var VP_DeepLinks = {
    init: function () {
      if (isNative && Plugins.App) {
        Plugins.App.addListener('appUrlOpen', function (data) {
          VP_DeepLinks.route(data.url);
        });
      }
    },

    route: function (url) {
      if (!url) return;
      // Parse ventpals://<path>[?query]
      var match = url.match(/^ventpals:\/\/([^?#]*)/i);
      if (!match) return;
      var key  = match[1].replace(/^\/+|\/+$/g, '').toLowerCase();
      var dest = DEEP_LINK_MAP[key] || null;
      if (dest) {
        window.location.href = '/' + dest;
      }
    },
  };

  /* ================================================================
   * 6. IN-APP BROWSER (external links)
   * ============================================================== */
  var VP_Browser = {
    /**
     * Open a URL in the in-app browser (Capacitor Browser) or system browser.
     * @param {string} url
     * @param {Object} [opts]  { presentationStyle: 'popover'|'fullscreen' }
     */
    open: function (url, opts) {
      opts = opts || {};
      if (isNative && Plugins.Browser) {
        return Plugins.Browser.open({
          url:               url,
          presentationStyle: opts.presentationStyle || 'popover',
          toolbarColor:      '#A259FF',
        });
      }
      window.open(url, '_blank', 'noopener,noreferrer');
      return Promise.resolve();
    },

    /**
     * Intercept external anchor clicks so they open in in-app browser.
     * Call once on DOMContentLoaded.
     */
    interceptExternalLinks: function () {
      document.addEventListener('click', function (e) {
        var a = e.target.closest('a[href]');
        if (!a) return;
        var href = a.getAttribute('href');
        if (!href) return;
        // Only intercept absolute http/https links
        if (!/^https?:\/\//i.test(href)) return;
        // Allow same-origin links to navigate normally
        try {
          var parsed = new URL(href);
          if (parsed.origin === window.location.origin) return;
        } catch (err) { return; }
        e.preventDefault();
        VP_Browser.open(href);
      });
    },
  };

  /* ================================================================
   * 7. STATUS BAR (iOS / Android cosmetics)
   * ============================================================== */
  function initStatusBar() {
    if (isNative && Plugins.StatusBar) {
      Plugins.StatusBar.setStyle({ style: 'LIGHT' });
      Plugins.StatusBar.setBackgroundColor({ color: '#A259FF' });
    }
  }

  /* ================================================================
   * AUTO-INIT on DOMContentLoaded
   * ============================================================== */
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(function () {
    VP_Network.init();
    VP_DeepLinks.init();
    VP_Browser.interceptExternalLinks();
    initStatusBar();
  });

  /* ================================================================
   * PUBLIC API on window.VentPalsNative
   * ============================================================== */
  global.VentPalsNative = {
    isNative:      isNative,
    Haptics:       VP_Haptics,
    Share:         VP_Share,
    Notifications: VP_Notifications,
    Network:       VP_Network,
    DeepLinks:     VP_DeepLinks,
    Browser:       VP_Browser,
  };

})(window);
