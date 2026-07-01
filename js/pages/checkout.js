/* ==========================================================================
   HocLab — Checkout page (payment/checkout.html)
   Supports two entry points:
     ?id=COURSE_ID              single course
     ?ids=A,B,C&combo=1         multiple courses (e.g. from the combo banner)
   Either way, the page always shows every not-yet-owned paid course as a
   selectable checkbox (pre-checking whichever ones brought the visitor
   here), so someone buying one course can add others — or complete a full
   combo — without leaving the page. Selecting every available paid course
   automatically applies the combo discount from courses.config.js.
   ========================================================================== */
(function (window, document) {
  'use strict';

  var HV = window.HV;
  var BASE = typeof window.HV_BASE === 'string' ? window.HV_BASE : '../';

  // Payment details for the demo bank-transfer flow. Swap qrImage / account
  // details here when real payment details change, or replace this whole
  // block with a Stripe/PayPal integration per docs/DEVELOPER_GUIDE.md.
  var BANK_INFO = {
    qrImage: 'assets/images/payment-qr.png',
    accountName: 'PHAM HUY LAI',
    accountNumber: '1790208648',
    bank: 'BIDV - CN Bình Hưng Sài Gòn'
  };

  function parseRequestedIds() {
    var multi = HV.Utils.qs('ids');
    if (multi) return multi.split(',').map(function (s) { return decodeURIComponent(s.trim()); }).filter(Boolean);
    var single = HV.Utils.qs('id');
    return single ? [single] : [];
  }

  function orderRef(user) {
    return 'HOCLAB' + user.username.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) + Date.now().toString(36).slice(-4).toUpperCase();
  }

  function renderNotice(root, icon, title, message, actions) {
    root.innerHTML =
      '<div class="hv-checkout-card hv-checkout-lock-notice">' +
        '<div class="hv-empty-icon">' + icon + '</div>' +
        '<h2>' + HV.Utils.escapeHtml(title) + '</h2>' +
        '<p style="color:var(--hv-ink-soft);margin:10px 0 22px;">' + HV.Utils.escapeHtml(message) + '</p>' +
        '<div style="display:flex; flex-direction:column; gap:10px;">' + actions + '</div>' +
      '</div>';
  }

  function fieldError(form, name) {
    return form.querySelector('[data-error-for="' + name + '"]');
  }

  /** Recomputes and re-renders the total row based on which checkboxes are checked. */
  function updateTotal(root, availableCourses) {
    var checked = Array.prototype.slice.call(root.querySelectorAll('.hv-checkout-product-row input:checked'))
      .map(function (cb) { return cb.value; });
    var combo = HV.getComboPricing();
    var isFullCombo = availableCourses.length > 1 && checked.length === availableCourses.length &&
      availableCourses.every(function (c) { return checked.indexOf(c.id) !== -1; });

    var selectedCourses = availableCourses.filter(function (c) { return checked.indexOf(c.id) !== -1; });
    var rawTotal = selectedCourses.reduce(function (sum, c) { return sum + c.price; }, 0);
    var finalTotal = isFullCombo ? combo.discountedTotal : rawTotal;

    var totalRow = root.querySelector('#checkout-total-row');
    var discountNote = root.querySelector('#checkout-discount-note');
    var submitBtn = root.querySelector('#btn-purchase');

    totalRow.innerHTML =
      (isFullCombo ? '<span class="hv-checkout-total-original">' + HV.Utils.formatPrice(rawTotal) + '</span>' : '') +
      '<strong>' + HV.Utils.formatPrice(finalTotal) + '</strong>';

    if (isFullCombo) {
      discountNote.style.display = 'flex';
      discountNote.innerHTML = '🎉 Áp dụng giảm ' + combo.discountPercent + '% cho combo trọn bộ — tiết kiệm ' + HV.Utils.formatPrice(combo.savings) + '!';
    } else {
      discountNote.style.display = 'none';
    }

    submitBtn.disabled = selectedCourses.length === 0;
    root.dataset.finalTotal = finalTotal;
    return selectedCourses;
  }

  function renderCheckoutForm(root, availableCourses, preselectedIds, user) {
    var productsHtml = availableCourses.map(function (c) {
      var checked = preselectedIds.indexOf(c.id) !== -1 ? ' checked' : '';
      return (
        '<label class="hv-checkout-product-row' + (checked ? ' hv-checked' : '') + '">' +
          '<input type="checkbox" value="' + c.id + '"' + checked + '>' +
          '<div class="hv-checkout-product-info">' +
            '<strong>' + HV.Utils.escapeHtml(c.title) + '</strong>' +
            '<span>' + HV.Utils.escapeHtml(c.subject) + ' · ' + HV.Utils.escapeHtml(c.level) + '</span>' +
          '</div>' +
          '<span class="hv-checkout-product-price">' + HV.Utils.formatPrice(c.price) + '</span>' +
        '</label>'
      );
    }).join('');

    root.innerHTML =
      '<div class="hv-checkout-card">' +
        '<p class="hv-checkout-section-title">Thông tin liên hệ</p>' +
        '<div class="hv-checkout-contact-grid">' +
          '<div class="hv-field">' +
            '<label class="hv-label" for="checkout-name">Họ và tên</label>' +
            '<input class="hv-input" type="text" id="checkout-name" placeholder="Nguyễn Văn A" value="' + HV.Utils.escapeHtml(user.fullName || '') + '">' +
            '<div class="hv-error-text" data-error-for="name">Vui lòng nhập họ và tên.</div>' +
          '</div>' +
          '<div class="hv-field">' +
            '<label class="hv-label" for="checkout-phone">Số điện thoại</label>' +
            '<input class="hv-input" type="tel" id="checkout-phone" placeholder="0912 345 678" value="' + HV.Utils.escapeHtml(user.phone || '') + '">' +
            '<div class="hv-error-text" data-error-for="phone">Số điện thoại không hợp lệ.</div>' +
          '</div>' +
        '</div>' +
        '<div class="hv-field">' +
          '<label class="hv-label">Email tài khoản</label>' +
          '<div class="hv-checkout-email-display">' + HV.Utils.escapeHtml(user.email) + '</div>' +
        '</div>' +

        '<p class="hv-checkout-section-title">Chọn khoá học (chọn 1 hoặc nhiều)</p>' +
        '<div class="hv-checkout-products" id="checkout-products">' + productsHtml + '</div>' +
        '<div class="hv-checkout-discount-note" id="checkout-discount-note" style="display:none;"></div>' +

        '<div class="hv-checkout-total-row" id="checkout-total-row"></div>' +

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

    updateTotal(root, availableCourses);

    root.querySelectorAll('.hv-checkout-product-row input').forEach(function (cb) {
      cb.addEventListener('change', function () {
        cb.closest('.hv-checkout-product-row').classList.toggle('hv-checked', cb.checked);
        updateTotal(root, availableCourses);
      });
    });

    document.getElementById('btn-purchase').addEventListener('click', function (e) {
      var btn = e.currentTarget;
      var nameInput = document.getElementById('checkout-name');
      var phoneInput = document.getElementById('checkout-phone');

      fieldError(root, 'name').classList.remove('hv-show');
      fieldError(root, 'phone').classList.remove('hv-show');
      nameInput.classList.remove('hv-input-error');
      phoneInput.classList.remove('hv-input-error');

      var valid = true;
      if (!nameInput.value.trim()) {
        fieldError(root, 'name').classList.add('hv-show');
        nameInput.classList.add('hv-input-error');
        valid = false;
      }
      if (!HV.Utils.isValidPhone(phoneInput.value)) {
        fieldError(root, 'phone').classList.add('hv-show');
        phoneInput.classList.add('hv-input-error');
        valid = false;
      }
      var selectedCourses = updateTotal(root, availableCourses);
      if (!selectedCourses.length) valid = false;
      if (!valid) {
        if (!fieldError(root, 'name').classList.contains('hv-show') && !fieldError(root, 'phone').classList.contains('hv-show')) {
          HV.Toast.error('Vui lòng chọn ít nhất một khoá học.');
        }
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="hv-spinner"></span> Đang xác nhận...';

      setTimeout(function () { // tiny delay so the loading state is perceptible, like a real gateway
        HV.Auth.updateContactInfo(user.id, nameInput.value, phoneInput.value);
        var unlockedTitles = [];
        selectedCourses.forEach(function (c) {
          var result = HV.Purchases.purchaseCourse(user.id, c.id);
          if (result.success) unlockedTitles.push(c.title);
        });

        HV.Toast.success('Mua khoá học thành công!');
        var listHtml = '<ul style="text-align:left; margin:0 0 20px; padding-left:20px; color:var(--hv-ink-soft); font-size:0.88rem;">' +
          unlockedTitles.map(function (t) { return '<li>' + HV.Utils.escapeHtml(t) + '</li>'; }).join('') + '</ul>';

        root.innerHTML =
          '<div class="hv-checkout-card hv-checkout-lock-notice">' +
            '<div class="hv-empty-icon">🎉</div>' +
            '<h2>Thanh toán thành công!</h2>' +
            '<p style="color:var(--hv-ink-soft);margin:10px 0 4px;">Đã mở khoá ' + unlockedTitles.length + ' khoá học:</p>' +
            listHtml +
            '<p style="font-size:0.75rem;color:var(--hv-ink-soft);margin-bottom:20px;">Mã đơn hàng: ' + orderRef(user) + '</p>' +
            '<div style="display:flex; flex-direction:column; gap:10px;">' +
              '<a class="hv-btn hv-btn-primary" href="' + BASE + 'profile/my-courses.html">Xem khoá học của tôi</a>' +
              '<a class="hv-btn hv-btn-ghost" href="' + BASE + 'index.html">Về trang chủ</a>' +
            '</div>' +
          '</div>';
      }, 500);
    });
  }

  function render() {
    var root = document.getElementById('checkout-root');
    if (!root) return;

    var requestedIds = parseRequestedIds();
    if (!requestedIds.length) {
      renderNotice(root, '🔍', 'Không tìm thấy khoá học', 'Không có khoá học nào được chọn.',
        '<a class="hv-btn hv-btn-primary" href="' + BASE + 'index.html">Về trang chủ</a>');
      return;
    }

    var requestedCourses = requestedIds.map(function (id) { return HV.getCourse(id); });
    if (requestedCourses.indexOf(null) !== -1) {
      renderNotice(root, '🔍', 'Không tìm thấy khoá học', 'Một trong các khoá học bạn chọn không tồn tại.',
        '<a class="hv-btn hv-btn-primary" href="' + BASE + 'index.html">Về trang chủ</a>');
      return;
    }

    document.title = (requestedCourses.length > 1 ? 'Thanh toán combo' : 'Thanh toán — ' + requestedCourses[0].title) + ' · HocLab';

    var paidRequested = requestedCourses.filter(function (c) { return !c.isFree; });
    if (!paidRequested.length) {
      var freeCourse = requestedCourses[0];
      renderNotice(root, '🎁', 'Khoá học này miễn phí', 'Bạn không cần thanh toán để học "' + freeCourse.title + '".',
        '<a class="hv-btn hv-btn-primary" href="' + BASE + freeCourse.lessonPath + '">Bắt đầu học ngay</a>');
      return;
    }

    var user = HV.Auth.getCurrentUser();
    if (!user) {
      var redirectTarget = window.location.pathname.split('/').slice(-2).join('/') + window.location.search;
      renderNotice(root, '🔒', 'Vui lòng đăng nhập', 'Bạn cần đăng nhập để mua khoá học đã chọn.',
        '<a class="hv-btn hv-btn-primary" href="' + BASE + 'auth/login.html?redirect=' + encodeURIComponent(redirectTarget) + '">Đăng nhập</a>' +
        '<a class="hv-btn hv-btn-ghost" href="' + BASE + 'auth/register.html?redirect=' + encodeURIComponent(redirectTarget) + '">Tạo tài khoản mới</a>');
      return;
    }

    var allPaid = HV.COURSES.filter(function (c) { return !c.isFree; });
    var availableCourses = allPaid.filter(function (c) { return !HV.Purchases.hasAccess(user.id, c.id); });

    if (!availableCourses.length) {
      renderNotice(root, '✅', 'Bạn đã sở hữu tất cả khoá học trả phí', 'Không còn khoá học nào để mua thêm.',
        '<a class="hv-btn hv-btn-primary" href="' + BASE + 'profile/my-courses.html">Khoá học của tôi</a>');
      return;
    }

    var preselectedIds = paidRequested.map(function (c) { return c.id; }).filter(function (id) {
      return availableCourses.some(function (c) { return c.id === id; });
    });
    if (!preselectedIds.length) preselectedIds = [availableCourses[0].id];

    renderCheckoutForm(root, availableCourses, preselectedIds, user);
  }

  document.addEventListener('DOMContentLoaded', render);
})(window, document);
