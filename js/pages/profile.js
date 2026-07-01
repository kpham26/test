/* ==========================================================================
   HocLab — Profile page (profile/index.html)
   ========================================================================== */
(function (window, document) {
  'use strict';

  var HV = window.HV;
  var BASE = typeof window.HV_BASE === 'string' ? window.HV_BASE : '../';

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return iso;
    }
  }

  function render() {
    var root = document.getElementById('profile-root');
    if (!root) return;

    var user = HV.Auth.getCurrentUser();
    if (!user) {
      window.location.href = BASE + 'auth/login.html?redirect=' + encodeURIComponent('profile/index.html');
      return;
    }

    var purchases = HV.Purchases.getPurchases(user.id);
    var ownedPaidCount = purchases.length;
    var initials = user.username.trim().charAt(0).toUpperCase();

    document.getElementById('account-hero-root').innerHTML =
      '<div class="hv-container hv-account-hero-inner">' +
        '<div class="hv-account-avatar">' + initials + '</div>' +
        '<div>' +
          '<h1>' + HV.Utils.escapeHtml(user.username) + '</h1>' +
          '<p>' + HV.Utils.escapeHtml(user.email) + '</p>' +
          (user.role === 'admin' ? '<span class="hv-account-role">Quản trị viên</span>' : '') +
        '</div>' +
      '</div>';

    root.innerHTML =
      '<div class="hv-info-grid">' +
        '<div class="hv-info-card"><span>Tên đăng nhập</span><strong>' + HV.Utils.escapeHtml(user.username) + '</strong></div>' +
        '<div class="hv-info-card"><span>Email</span><strong>' + HV.Utils.escapeHtml(user.email) + '</strong></div>' +
        '<div class="hv-info-card"><span>Ngày tham gia</span><strong>' + formatDate(user.createdAt) + '</strong></div>' +
        '<div class="hv-info-card"><span>Khoá học đã mua</span><strong>' + ownedPaidCount + '</strong></div>' +
      '</div>' +
      '<div style="display:flex; gap:10px; flex-wrap:wrap;">' +
        '<a class="hv-btn hv-btn-light" href="' + BASE + 'profile/my-courses.html">Xem khoá học của tôi</a>' +
        '<button type="button" class="hv-btn hv-btn-light" id="btn-toggle-password">Đổi mật khẩu</button>' +
      '</div>' +
      '<div id="password-form-wrap" style="display:none; max-width:420px; margin-top:var(--hv-space-5);">' +
        '<form id="form-change-password" novalidate>' +
          '<div class="hv-auth-form-error"></div>' +
          '<div class="hv-form-success"></div>' +
          '<div class="hv-field">' +
            '<label class="hv-label" for="current-password">Mật khẩu hiện tại</label>' +
            '<input class="hv-input" type="password" id="current-password" name="currentPassword" autocomplete="current-password" required>' +
          '</div>' +
          '<div class="hv-field">' +
            '<label class="hv-label" for="new-password">Mật khẩu mới</label>' +
            '<input class="hv-input" type="password" id="new-password" name="newPassword" autocomplete="new-password" required minlength="6">' +
          '</div>' +
          '<div class="hv-field">' +
            '<label class="hv-label" for="confirm-new-password">Xác nhận mật khẩu mới</label>' +
            '<input class="hv-input" type="password" id="confirm-new-password" name="confirmNewPassword" autocomplete="new-password" required minlength="6">' +
          '</div>' +
          '<div style="display:flex; gap:10px;">' +
            '<button type="submit" class="hv-btn hv-btn-primary">Lưu mật khẩu mới</button>' +
            '<button type="button" class="hv-btn hv-btn-ghost" id="btn-cancel-password">Huỷ</button>' +
          '</div>' +
        '</form>' +
      '</div>';

    var wrap = document.getElementById('password-form-wrap');
    var toggleBtn = document.getElementById('btn-toggle-password');
    var form = document.getElementById('form-change-password');
    var errorBox = form.querySelector('.hv-auth-form-error');
    var successBox = form.querySelector('.hv-form-success');

    function closeForm() {
      wrap.style.display = 'none';
      form.reset();
      errorBox.classList.remove('hv-show');
      successBox.classList.remove('hv-show');
    }

    toggleBtn.addEventListener('click', function () {
      wrap.style.display = wrap.style.display === 'none' ? 'block' : 'none';
    });
    document.getElementById('btn-cancel-password').addEventListener('click', closeForm);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errorBox.classList.remove('hv-show');
      successBox.classList.remove('hv-show');

      var result = HV.Auth.changePassword(
        user.id,
        form.elements.namedItem('currentPassword').value,
        form.elements.namedItem('newPassword').value,
        form.elements.namedItem('confirmNewPassword').value
      );

      if (!result.success) {
        errorBox.textContent = result.error;
        errorBox.classList.add('hv-show');
        return;
      }

      form.reset();
      successBox.textContent = 'Đổi mật khẩu thành công.';
      successBox.classList.add('hv-show');
      HV.Toast.success('Đổi mật khẩu thành công!');
    });
  }

  document.addEventListener('DOMContentLoaded', render);
})(window, document);
