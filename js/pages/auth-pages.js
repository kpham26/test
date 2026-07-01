/* ==========================================================================
   HocLab — Auth pages (auth/login.html, auth/register.html)
   Detects which form is present and wires it up. Both pages support an
   optional ?redirect= query param carrying a relative URL to return to
   after a successful login/registration (used by the "buy while logged
   out" and locked-lesson flows).
   ========================================================================== */
(function (window, document) {
  'use strict';

  var HV = window.HV;
  var BASE = typeof window.HV_BASE === 'string' ? window.HV_BASE : '../';

  function redirectTarget() {
    var r = HV.Utils.qs('redirect');
    return r ? BASE + r : BASE + 'index.html';
  }

  function showError(form, message) {
    var box = form.querySelector('.hv-auth-form-error');
    box.textContent = message;
    box.classList.add('hv-show');
  }
  function hideError(form) {
    var box = form.querySelector('.hv-auth-form-error');
    box.classList.remove('hv-show');
  }

  function carryRedirectIntoSwitchLink() {
    var redirect = HV.Utils.qs('redirect');
    if (!redirect) return;
    document.querySelectorAll('[data-auth-switch]').forEach(function (a) {
      var url = new URL(a.href, window.location.href);
      url.searchParams.set('redirect', redirect);
      a.href = url.pathname + url.search;
    });
  }

  function showRedirectBanner() {
    var redirect = HV.Utils.qs('redirect');
    var banner = document.querySelector('.hv-auth-banner');
    if (redirect && banner) {
      banner.textContent = 'Đăng nhập để tiếp tục với khoá học bạn vừa chọn.';
      banner.classList.add('hv-show');
    }
  }

  function initLogin() {
    var form = document.getElementById('form-login');
    if (!form) return;

    if (HV.Auth.isLoggedIn()) { window.location.href = redirectTarget(); return; }
    showRedirectBanner();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideError(form);
      var identifier = form.elements.namedItem('identifier').value;
      var password = form.elements.namedItem('password').value;

      var result = HV.Auth.login(identifier, password);
      if (!result.success) {
        showError(form, result.error);
        return;
      }
      HV.Toast.success('Chào mừng trở lại, ' + result.user.username + '!');
      window.location.href = redirectTarget();
    });
  }

  function initRegister() {
    var form = document.getElementById('form-register');
    if (!form) return;

    if (HV.Auth.isLoggedIn()) { window.location.href = redirectTarget(); return; }
    showRedirectBanner();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideError(form);

      var result = HV.Auth.register({
        username: form.elements.namedItem('username').value,
        email: form.elements.namedItem('email').value,
        password: form.elements.namedItem('password').value,
        confirmPassword: form.elements.namedItem('confirmPassword').value
      });
      if (!result.success) {
        showError(form, result.error);
        return;
      }
      HV.Toast.success('Tạo tài khoản thành công! Xin chào, ' + result.user.username + '.');
      window.location.href = redirectTarget();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    carryRedirectIntoSwitchLink();
    initLogin();
    initRegister();
  });
})(window, document);
