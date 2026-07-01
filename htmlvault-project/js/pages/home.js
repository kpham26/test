/* ==========================================================================
   HTMLVault — Home page
   ========================================================================== */
(function (window, document) {
  'use strict';

  var HV = window.HV;
  var BASE = typeof window.HV_BASE === 'string' ? window.HV_BASE : '';

  function badgeMarkup(course, owned) {
    if (course.isFree) return '<span class="hv-badge hv-badge-free">Miễn phí</span>';
    if (owned) return '<span class="hv-badge hv-badge-owned">Đã sở hữu</span>';
    return '<span class="hv-badge hv-badge-paid">Trả phí</span>';
  }

  function cardMarkup(course) {
    var user = HV.Auth.getCurrentUser();
    var owned = !!user && HV.Purchases.hasAccess(user.id, course.id);
    var cta = HV.CourseCTA.get(course, BASE);
    var priceLabel = course.isFree ? 'Miễn phí' : HV.Utils.formatPrice(course.price);
    var priceClass = course.isFree ? ' hv-price-free' : '';

    return (
      '<article class="hv-course-card hv-fade-up" style="--accent:' + course.accentColor + '; --accent-deep:' + course.accentDeep + '">' +
        '<div class="hv-course-card-accent"></div>' +
        '<a href="' + BASE + 'courses/course.html?id=' + encodeURIComponent(course.id) + '" class="hv-course-thumb">' +
          '<img src="' + BASE + course.thumbnail + '" alt="' + HV.Utils.escapeHtml(course.title) + '" loading="lazy">' +
        '</a>' +
        '<div class="hv-course-body">' +
          '<div class="hv-course-meta-row">' +
            '<span class="hv-course-subject">' + HV.Utils.escapeHtml(course.subject) + ' · ' + HV.Utils.escapeHtml(course.level) + '</span>' +
            badgeMarkup(course, owned) +
          '</div>' +
          '<h3 class="hv-course-title"><a href="' + BASE + 'courses/course.html?id=' + encodeURIComponent(course.id) + '">' + HV.Utils.escapeHtml(course.title) + '</a></h3>' +
          '<p class="hv-course-desc">' + HV.Utils.escapeHtml(course.shortDesc) + '</p>' +
          '<div class="hv-course-footer">' +
            '<span class="hv-course-price' + priceClass + '">' + priceLabel + '</span>' +
            '<a href="' + cta.href + '" class="hv-btn hv-btn-sm hv-btn-primary">' + cta.label + '</a>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function render() {
    var grid = document.getElementById('courses-grid');
    if (grid) {
      grid.innerHTML = HV.COURSES.map(cardMarkup).join('');
    }

    var totalEl = document.getElementById('stat-total-courses');
    var freeEl = document.getElementById('stat-free-courses');
    if (totalEl) totalEl.textContent = HV.COURSES.length;
    if (freeEl) freeEl.textContent = HV.COURSES.filter(function (c) { return c.isFree; }).length;
  }

  document.addEventListener('DOMContentLoaded', render);
})(window, document);
