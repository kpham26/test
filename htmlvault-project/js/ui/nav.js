/* ==========================================================================
   HTMLVault — Nav
   Renders into #site-header / #site-footer on every shell page. This is the
   single place nav markup and behavior live — edit this file and every page
   that includes it updates automatically.

   Expects window.HV_BASE to be set (a small inline <script> on each page,
   "" at the project root or "../" one level down) so links resolve
   correctly no matter which page includes this file.
   ========================================================================== */
(function (window, document) {
  'use strict';

  var HV = window.HV;
  var BASE = typeof window.HV_BASE === 'string' ? window.HV_BASE : '';

  function initials(name) {
    return String(name || '?').trim().charAt(0).toUpperCase();
  }

  function linksMarkup(user, currentPath) {
    var items = [
      { href: BASE + 'index.html', label: 'Trang chủ', match: /(^|\/)index\.html$|\/$/ },
      { href: BASE + 'index.html#course-grid', label: 'Khoá học', match: /courses\/course\.html$/ }
    ];
    if (user) {
      items.push({ href: BASE + 'profile/my-courses.html', label: 'Khoá học của tôi', match: /my-courses\.html$/ });
      items.push({ href: BASE + 'profile/index.html', label: 'Tài khoản', match: /profile\/index\.html$/ });
    }
    return items.map(function (item) {
      var active = item.match.test(currentPath) ? ' hv-active' : '';
      return '<a class="hv-nav-link' + active + '" href="' + item.href + '">' + item.label + '</a>';
    }).join('');
  }

  function actionsMarkup(user, sizeClass) {
    var sm = sizeClass ? ' ' + sizeClass : '';
    if (user) {
      return (
        '<span class="hv-nav-user">' +
          '<span class="hv-nav-avatar">' + initials(user.username) + '</span>' +
          HV.Utils.escapeHtml(user.username) +
        '</span>' +
        '<button type="button" class="hv-btn hv-btn-ghost' + sm + '" data-action="logout">Đăng xuất</button>'
      );
    }
    return (
      '<a class="hv-btn hv-btn-ghost' + sm + '" href="' + BASE + 'auth/login.html">Đăng nhập</a>' +
      '<a class="hv-btn hv-btn-primary' + sm + '" href="' + BASE + 'auth/register.html">Đăng ký</a>'
    );
  }

  function render() {
    var header = document.getElementById('site-header');
    var footer = document.getElementById('site-footer');
    if (!header && !footer) return;

    var user = HV.Auth.getCurrentUser();
    var currentPath = window.location.pathname;

    if (header) {
      header.innerHTML =
        '<nav class="hv-nav" aria-label="Điều hướng chính">' +
          '<div class="hv-nav-inner">' +
            '<a class="hv-brand" href="' + BASE + 'index.html">' +
              '<span class="hv-brand-mark">🎓</span> HTMLVault' +
            '</a>' +
            '<button type="button" class="hv-nav-toggle" id="hv-nav-toggle" aria-label="Mở menu" aria-expanded="false" aria-controls="hv-nav-links">☰</button>' +
            '<div class="hv-nav-links" id="hv-nav-links">' +
              linksMarkup(user, currentPath) +
              '<div class="hv-nav-actions-mobile">' + actionsMarkup(user, 'hv-btn-sm') + '</div>' +
            '</div>' +
            '<div class="hv-nav-actions hv-nav-actions-desktop">' + actionsMarkup(user) + '</div>' +
          '</div>' +
        '</nav>';

      var toggle = document.getElementById('hv-nav-toggle');
      var links = document.getElementById('hv-nav-links');
      toggle.addEventListener('click', function () {
        var open = links.classList.toggle('hv-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      header.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-action="logout"]');
        if (!btn) return;
        HV.Modal.confirm('Bạn có chắc muốn đăng xuất không?', { title: 'Đăng xuất', confirmLabel: 'Đăng xuất', cancelLabel: 'Huỷ' })
          .then(function (confirmed) {
            if (!confirmed) return;
            HV.Auth.logout();
            window.location.href = BASE + 'index.html';
          });
      });
    }

    if (footer) {
      var year = new Date().getFullYear();
      footer.innerHTML =
        '<footer class="hv-footer">' +
          '<div class="hv-footer-inner">' +
            '<span>© ' + year + ' HTMLVault. Front-end MVP.</span>' +
            '<div class="hv-footer-links">' +
              '<a href="' + BASE + 'index.html">Trang chủ</a>' +
              '<a href="' + BASE + 'index.html#course-grid">Khoá học</a>' +
            '</div>' +
          '</div>' +
        '</footer>';
    }
  }

  HV.Nav = { render: render };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})(window, document);
