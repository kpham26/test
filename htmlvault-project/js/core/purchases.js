/* ==========================================================================
   HTMLVault — Purchases
   Owns purchase records and answers the one question every protected page
   asks: "does this user have access to this course?"
   ========================================================================== */
(function (window) {
  'use strict';

  var HV = window.HV = window.HV || {};
  var Storage = HV.Storage;

  var PURCHASES_KEY = 'purchases'; // shape: { [userId]: [courseId, courseId, ...] }

  function getAllPurchases() {
    return Storage.get(PURCHASES_KEY, {});
  }
  function saveAllPurchases(map) {
    return Storage.set(PURCHASES_KEY, map);
  }

  var Purchases = {
    /** Returns the array of course ids a user owns (empty if none / no user). */
    getPurchases: function (userId) {
      if (!userId) return [];
      var map = getAllPurchases();
      return map[userId] || [];
    },

    /** True if the course is free, or the given user has purchased it. */
    hasAccess: function (userId, courseId) {
      var course = HV.getCourse(courseId);
      if (!course) return false;
      if (course.isFree) return true;
      if (!userId) return false;
      return this.getPurchases(userId).indexOf(courseId) !== -1;
    },

    /**
     * Records a purchase for a user. Idempotent — buying twice is a no-op
     * success rather than a duplicate entry.
     * @returns {{success:boolean, error?:string}}
     */
    purchaseCourse: function (userId, courseId) {
      if (!userId) {
        return { success: false, error: 'Bạn cần đăng nhập để mua khoá học.' };
      }
      var course = HV.getCourse(courseId);
      if (!course) {
        return { success: false, error: 'Không tìm thấy khoá học.' };
      }
      if (course.isFree) {
        return { success: true }; // nothing to record, already accessible
      }

      var map = getAllPurchases();
      var owned = map[userId] || [];
      if (owned.indexOf(courseId) === -1) {
        owned.push(courseId);
        map[userId] = owned;
        saveAllPurchases(map);
      }
      return { success: true };
    }
  };

  HV.Purchases = Purchases;
})(typeof window !== 'undefined' ? window : globalThis);
