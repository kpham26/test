/* ==========================================================================
   HTMLVault — Profile page (profile/index.html)
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
        '<button type="button" class="hv-btn hv-btn-danger" id="btn-profile-logout">Đăng xuất</button>' +
      '</div>';

    document.getElementById('btn-profile-logout').addEventListener('click', function () {
      HV.Modal.confirm('Bạn có chắc muốn đăng xuất không?', { title: 'Đăng xuất', confirmLabel: 'Đăng xuất', cancelLabel: 'Huỷ' })
        .then(function (confirmed) {
          if (!confirmed) return;
          HV.Auth.logout();
          window.location.href = BASE + 'index.html';
        });
    });
  }

  document.addEventListener('DOMContentLoaded', render);
})(window, document);
