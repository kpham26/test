/* ==========================================================================
   HocLab — My Courses page (profile/my-courses.html)
   ========================================================================== */
(function (window, document) {
  'use strict';

  var HV = window.HV;
  var BASE = typeof window.HV_BASE === 'string' ? window.HV_BASE : '../';

  function courseRow(course) {
    var cta = HV.CourseCTA.get(course, BASE);
    return (
      '<div class="hv-mycourse-row">' +
        '<a class="hv-mycourse-thumb" href="' + BASE + 'courses/course.html?id=' + encodeURIComponent(course.id) + '">' +
          '<img src="' + BASE + course.thumbnail + '" alt="' + HV.Utils.escapeHtml(course.title) + '">' +
        '</a>' +
        '<div class="hv-mycourse-info">' +
          '<h3>' + HV.Utils.escapeHtml(course.title) + '</h3>' +
          '<p>' + HV.Utils.escapeHtml(course.shortDesc) + '</p>' +
        '</div>' +
        '<div class="hv-mycourse-actions">' +
          '<a class="hv-btn hv-btn-sm ' + (cta.kind === 'buy' ? 'hv-btn-light' : 'hv-btn-primary') + '" href="' + cta.href + '">' + cta.label + '</a>' +
        '</div>' +
      '</div>'
    );
  }

  function section(label, courses) {
    if (!courses.length) return '';
    return (
      '<div class="hv-section-label">' + label + '</div>' +
      '<div class="hv-mycourse-list">' + courses.map(courseRow).join('') + '</div>'
    );
  }

  function render() {
    var root = document.getElementById('mycourses-root');
    if (!root) return;

    var user = HV.Auth.getCurrentUser();
    if (!user) {
      window.location.href = BASE + 'auth/login.html?redirect=' + encodeURIComponent('profile/my-courses.html');
      return;
    }

    var free = [], purchased = [], locked = [];
    HV.COURSES.forEach(function (course) {
      if (course.isFree) { free.push(course); return; }
      if (HV.Purchases.hasAccess(user.id, course.id)) { purchased.push(course); }
      else { locked.push(course); }
    });

    if (!free.length && !purchased.length && !locked.length) {
      root.innerHTML = '<div class="hv-empty"><div class="hv-empty-icon">📚</div><h2>Chưa có khoá học nào</h2><p>Hãy khám phá các khoá học trên trang chủ.</p></div>';
      return;
    }

    root.innerHTML =
      section('Đã mua', purchased) +
      section('Miễn phí', free) +
      section('Chưa mở khoá', locked);
  }

  document.addEventListener('DOMContentLoaded', render);
})(window, document);
