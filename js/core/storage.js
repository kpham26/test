/* ==========================================================================
   HocLab — Storage
   Thin, namespaced wrapper around localStorage. This is intentionally the
   ONLY file in the whole project that calls localStorage directly, so a
   future backend migration only ever has to change what happens inside
   these three methods (e.g. swap them for fetch() calls) — every other
   file keeps calling Storage.get/set/remove exactly as it does today.
   ========================================================================== */
(function (window) {
  'use strict';

  var HV = window.HV = window.HV || {};

  var PREFIX = 'hv_';

  var Storage = {
    PREFIX: PREFIX,

    get: function (key, fallback) {
      if (fallback === undefined) fallback = null;
      try {
        var raw = window.localStorage.getItem(PREFIX + key);
        return raw !== null ? JSON.parse(raw) : fallback;
      } catch (e) {
        console.error('[HV.Storage] get failed for key "' + key + '":', e);
        return fallback;
      }
    },

    set: function (key, value) {
      try {
        window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error('[HV.Storage] set failed for key "' + key + '":', e);
        return false;
      }
    },

    remove: function (key) {
      try {
        window.localStorage.removeItem(PREFIX + key);
        return true;
      } catch (e) {
        console.error('[HV.Storage] remove failed for key "' + key + '":', e);
        return false;
      }
    }
  };

  HV.Storage = Storage;
})(typeof window !== 'undefined' ? window : globalThis);
