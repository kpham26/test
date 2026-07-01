/* ==========================================================================
   HTMLVault — Utils
   Small stateless helpers shared across every page.
   ========================================================================== */
(function (window) {
  'use strict';

  var HV = window.HV = window.HV || {};

  var Utils = {
    /**
     * Escapes HTML special characters before injecting user-provided
     * strings (username, email, etc.) into innerHTML, so a crafted
     * registration value can never break out into markup.
     */
    escapeHtml: function (str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    /** Formats a VND integer amount as "199.000₫", or "Miễn phí" for 0. */
    formatPrice: function (amount) {
      if (!amount || amount <= 0) return 'Miễn phí';
      var str = Math.round(amount).toString();
      var withDots = str.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return withDots + '₫';
    },

    /** Reads a query-string parameter from the current URL. */
    qs: function (name) {
      var params = new URLSearchParams(window.location.search);
      return params.get(name);
    },

    /** Generates a reasonably-unique id for new records (users, etc.). */
    uid: function (prefix) {
      var rand = Math.random().toString(36).slice(2, 9);
      return (prefix || 'id') + '_' + Date.now().toString(36) + rand;
    },

    /** Very small, deterministic, NON-cryptographic string hash.
     *  Used only so a password never sits in localStorage as plain,
     *  human-readable text. This is NOT real security — anyone with
     *  devtools access to this browser can still read/edit localStorage,
     *  and the hash is trivially brute-forceable offline. Real auth must
     *  move server-side (bcrypt/argon2 + HTTPS) before this ever handles
     *  a real password. See docs/DEVELOPER_GUIDE.md → Security Notes.
     */
    weakHash: function (str) {
      var hash = 0;
      str = String(str);
      for (var i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return 'h' + Math.abs(hash).toString(36) + str.length.toString(36);
    },

    /** Basic, forgiving email format check for client-side validation. */
    isValidEmail: function (email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
    },

    /** Debounce helper (used for live validation on input). */
    debounce: function (fn, wait) {
      var t;
      return function () {
        var args = arguments, ctx = this;
        clearTimeout(t);
        t = setTimeout(function () { fn.apply(ctx, args); }, wait);
      };
    }
  };

  HV.Utils = Utils;
})(typeof window !== 'undefined' ? window : globalThis);
