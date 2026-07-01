/* ==========================================================================
   HocLab — Checkout page (payment/checkout.html?id=...)
   ========================================================================== */
(function (window, document) {
  'use strict';

  var HV = window.HV;
  var BASE = typeof window.HV_BASE === 'string' ? window.HV_BASE : '../';

  function renderNotice(root, icon, title, message, actions) {
    root.innerHTML =
      '<div class="hv-checkout-card hv-checkout-lock-notice">' +
        '<div class="hv-empty-icon">' + icon + '</div>' +
        '<h2>' + HV.Utils.escapeHtml(title) + '</h2>' +
        '<p style="color:var(--hv-ink-soft);margin:10px 0 22px;">' + HV.Utils.escapeHtml(message) + '</p>' +
        '<div style="display:flex; flex-direction:column; gap:10px;">' + actions + '</div>' +
      '</div>';
  }

  // Payment details for the demo bank-transfer flow. Swap qrImage / account
  // details here when real payment details change, or replace this whole
  // block with a Stripe/PayPal integration per docs/DEVELOPER_GUIDE.md.
  var BANK_INFO = {
    qrImage: 'assets/images/payment-qr.png',
    accountName: 'PHAM HUY LAI',
    accountNumber: '1790208648',
    bank: 'BIDV - CN Bình Hưng Sài Gòn'
  };

  function renderCheckout(root, course) {
    var priceLabel = HV.Utils.formatPrice(course.price);

    root.innerHTML =
      '<div class="hv-checkout-card">' +
        '<div class="hv-checkout-course">' +
          '<div class="hv-checkout-thumb"><img src="' + BASE + course.thumbnail + '" alt="' + HV.Utils.escapeHtml(course.title) + '"></div>' +
          '<div>' +
            '<h2>' + HV.Utils.escapeHtml(course.title) + '</h2>' +
            '<span style="font-size:0.8rem;color:var(--hv-ink-soft);">' + HV.Utils.escapeHtml(course.subject) + ' · ' + HV.Utils.escapeHtml(course.level) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="hv-checkout-total-row">' +
          '<span>Tổng thanh toán</span>' +
          '<strong>' + priceLabel + '</strong>' +
        '</div>' +

        '<div class="hv-checkout-qr-section">' +
          '<p class="hv-checkout-qr-label">Quét mã để chuyển khoản</p>' +
          '<img class="hv-checkout-qr-img" src="' + BASE + BANK_INFO.qrImage + '" alt="Mã QR chuyển khoản ngân hàng">' +
          '<div class="hv-checkout-bank-info">' +
            '<strong>' + HV.Utils.escapeHtml(BANK_INFO.accountName) + '</strong>' +
            '<span>' + HV.Utils.escapeHtml(BANK_INFO.accountNumber) + '</span>' +
            '<span>' + HV.Utils.escapeHtml(BANK_INFO.bank) + '</span>' +
          '</div>' +
        '</div>' +

        '<button type="button" class="hv-btn hv-btn-primary hv-btn-block" id="btn-purchase">Tôi đã chuyển khoản — Mở khoá ngay</button>' +
        '<p class="hv-checkout-note">Bản demo: chưa kết nối cổng xác minh thanh toán tự động. Nhấn nút trên sau khi chuyển khoản để mở khoá ngay lập tức.</p>' +
      '</div>';

    document.getElementById('btn-purchase').addEventListener('click', function (e) {
      var btn = e.currentTarget;
      btn.disabled = true;
      btn.innerHTML = '<span class="hv-spinner"></span> Đang xác nhận...';

      var user = HV.Auth.getCurrentUser();
      setTimeout(function () { // tiny delay so the loading state is perceptible, like a real gateway
        var result = HV.Purchases.purchaseCourse(user.id, course.id);
        if (!result.success) {
          HV.Toast.error(result.error || 'Có lỗi xảy ra, vui lòng thử lại.');
          btn.disabled = false;
          btn.textContent = 'Tôi đã chuyển khoản — Mở khoá ngay';
          return;
        }
        HV.Toast.success('Mua khoá học thành công!');
        renderNotice(
          root, '🎉', 'Thanh toán thành công!',
          'Bạn đã mở khoá "' + course.title + '". Học ngay bây giờ hoặc quay lại trang chủ sau.',
          '<a class="hv-btn hv-btn-primary" href="' + BASE + course.lessonPath + '">Học ngay</a>' +
          '<a class="hv-btn hv-btn-ghost" href="' + BASE + 'index.html">Về trang chủ</a>'
        );
      }, 500);
    });
  }

  function render() {
    var root = document.getElementById('checkout-root');
    if (!root) return;

    var courseId = HV.Utils.qs('id');
    var course = courseId ? HV.getCourse(courseId) : null;

    if (!course) {
      renderNotice(root, '🔍', 'Không tìm thấy khoá học',
        'Khoá học bạn muốn mua không tồn tại.',
        '<a class="hv-btn hv-btn-primary" href="' + BASE + 'index.html">Về trang chủ</a>');
      return;
    }

    document.title = 'Thanh toán — ' + course.title + ' · HocLab';

    if (course.isFree) {
      renderNotice(root, '🎁', 'Khoá học này miễn phí',
        'Bạn không cần thanh toán để học "' + course.title + '".',
        '<a class="hv-btn hv-btn-primary" href="' + BASE + course.lessonPath + '">Bắt đầu học ngay</a>');
      return;
    }

    var user = HV.Auth.getCurrentUser();
    if (!user) {
      var redirectTarget = 'payment/checkout.html?id=' + encodeURIComponent(course.id);
      renderNotice(root, '🔒', 'Vui lòng đăng nhập',
        'Bạn cần đăng nhập để mua "' + course.title + '".',
        '<a class="hv-btn hv-btn-primary" href="' + BASE + 'auth/login.html?redirect=' + encodeURIComponent(redirectTarget) + '">Đăng nhập</a>' +
        '<a class="hv-btn hv-btn-ghost" href="' + BASE + 'auth/register.html?redirect=' + encodeURIComponent(redirectTarget) + '">Tạo tài khoản mới</a>');
      return;
    }

    if (HV.Purchases.hasAccess(user.id, course.id)) {
      renderNotice(root, '✅', 'Bạn đã sở hữu khoá học này',
        '"' + course.title + '" đã có trong Khoá học của tôi.',
        '<a class="hv-btn hv-btn-primary" href="' + BASE + course.lessonPath + '">Tiếp tục học</a>' +
        '<a class="hv-btn hv-btn-ghost" href="' + BASE + 'profile/my-courses.html">Khoá học của tôi</a>');
      return;
    }

    renderCheckout(root, course);
  }

  document.addEventListener('DOMContentLoaded', render);
})(window, document);
