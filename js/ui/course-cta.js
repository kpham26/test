/* ==========================================================================
   HocLab — Course CTA
   Decides what a course's action button should say and link to, given the
   current login/ownership state. Shared by home.js and my-courses.js so
   "what button does a paid-but-owned course show" is answered in one place.
   ========================================================================== */
(function (window) {
  'use strict';

  var HV = window.HV;

  /**
   * @param {object} course a HV.COURSES entry
   * @param {string} base   HV_BASE for the current page ("" or "../")
   * @returns {{label:string, href:string, kind:'start'|'continue'|'buy'}}
   */
  function getCTA(course, base) {
    base = base || '';
    var user = HV.Auth.getCurrentUser();
    var owned = !!user && HV.Purchases.hasAccess(user.id, course.id);

    if (course.isFree) {
      return { label: '▶ Bắt đầu học', href: base + course.lessonPath, kind: 'start' };
    }
    if (owned) {
      return { label: '▶ Tiếp tục học', href: base + course.lessonPath, kind: 'continue' };
    }
    return { label: 'Mua khoá học', href: base + 'payment/checkout.html?id=' + encodeURIComponent(course.id), kind: 'buy' };
  }

  HV.CourseCTA = { get: getCTA };
})(window);
