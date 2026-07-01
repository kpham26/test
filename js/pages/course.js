/* ==========================================================================
   HTMLVault — Course detail page (courses/course.html?id=...)
   ========================================================================== */
(function (window, document) {
  'use strict';

  var HV = window.HV;
  var BASE = typeof window.HV_BASE === 'string' ? window.HV_BASE : '../';

  function notFound(root) {
    root.innerHTML =
      '<div class="hv-empty">' +
        '<div class="hv-empty-icon">🔍</div>' +
        '<h2>Không tìm thấy khoá học</h2>' +
        '<p>Khoá học bạn đang tìm không tồn tại hoặc đã bị gỡ bỏ.</p>' +
        '<a class="hv-btn hv-btn-primary" href="' + BASE + 'index.html" style="margin-top:16px;">Về trang chủ</a>' +
      '</div>';
  }

  function render() {
    var courseId = HV.Utils.qs('id');
    var course = courseId ? HV.getCourse(courseId) : null;
    var root = document.getElementById('course-detail-root');
    if (!root) return;
    if (!course) { notFound(root); document.title = 'Không tìm thấy khoá học · HTMLVault'; return; }

    document.title = course.title + ' · HTMLVault';

    var user = HV.Auth.getCurrentUser();
    var owned = !!user && HV.Purchases.hasAccess(user.id, course.id);
    var cta = HV.CourseCTA.get(course, BASE);
    var priceLabel = course.isFree ? 'Miễn phí' : HV.Utils.formatPrice(course.price);
    var priceClass = course.isFree ? ' hv-price-free' : '';
    var badge = course.isFree
      ? '<span class="hv-badge hv-badge-free">Miễn phí</span>'
      : (owned ? '<span class="hv-badge hv-badge-owned">Đã sở hữu</span>' : '<span class="hv-badge hv-badge-paid">Trả phí</span>');

    root.innerHTML =
      '<section class="hv-detail-hero">' +
        '<div class="hv-container">' +
          '<a class="hv-back-link" href="' + BASE + 'index.html#course-grid">← Tất cả khoá học</a>' +
          '<div class="hv-detail-grid">' +
            '<div>' +
              '<div class="hv-detail-subject">' + HV.Utils.escapeHtml(course.subject) + ' · ' + HV.Utils.escapeHtml(course.level) + '</div>' +
              '<h1>' + HV.Utils.escapeHtml(course.title) + '</h1>' +
              '<div class="hv-detail-badges">' + badge + '</div>' +
              '<p class="hv-detail-desc">' + HV.Utils.escapeHtml(course.description) + '</p>' +
            '</div>' +
            '<div class="hv-detail-thumb">' +
              '<img src="' + BASE + course.thumbnail + '" alt="' + HV.Utils.escapeHtml(course.title) + '">' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section class="hv-detail-body">' +
        '<div class="hv-container hv-detail-grid">' +
          '<div>' +
            '<h2>Bạn sẽ học được gì</h2>' +
            '<ul class="hv-buy-list">' +
              course.highlights.map(function (h) { return '<li>' + HV.Utils.escapeHtml(h) + '</li>'; }).join('') +
            '</ul>' +
          '</div>' +
          '<div class="hv-buy-card">' +
            '<div class="hv-buy-price-row">' +
              '<span class="hv-buy-price' + priceClass + '">' + priceLabel + '</span>' +
            '</div>' +
            '<a href="' + cta.href + '" class="hv-btn hv-btn-primary hv-btn-block">' + cta.label + '</a>' +
            '<ul class="hv-buy-list">' +
              '<li>Truy cập trọn đời, học lại bao nhiêu lần cũng được</li>' +
              '<li>Học trực tiếp trên trình duyệt, không cần cài đặt</li>' +
              '<li>Hoạt động tốt trên máy tính, tablet và điện thoại</li>' +
            '</ul>' +
            '<div class="hv-lesson-included">' + (course.isFree ? 'Khoá học miễn phí — bắt đầu ngay, không cần thanh toán.' : 'Mở khoá vĩnh viễn sau khi mua, gắn với tài khoản của bạn.') + '</div>' +
          '</div>' +
        '</div>' +
      '</section>';
  }

  document.addEventListener('DOMContentLoaded', render);
})(window, document);
