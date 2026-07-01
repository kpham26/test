/* ==========================================================================
   HocLab — Lesson Guard
   This is the ONLY file referenced from inside /lessons/*.html, via a single
   line added near the top of <head>:

     <script src="../js/lesson-guard.js" data-course-id="COURSE_ID"></script>

   It has no markup or logic duplicated from core/auth.js or core/purchases.js
   — it loads those same files (via document.write, which is safe and
   standard for synchronous head-time script injection like this) and calls
   the exact same HV.Purchases.hasAccess() every other page uses, so "does
   this user have access" is answered in exactly one place in the project.
   ========================================================================== */
(function (window, document) {
  'use strict';

  var scriptEl = document.currentScript;
  var courseId = scriptEl ? scriptEl.getAttribute('data-course-id') : null;
  var BASE = '../'; // /lessons/*.html is always exactly one level below root

  // Hide the page immediately so paid content can never flash on screen
  // before the entitlement check runs. Removed again in reveal() below.
  document.write('<style id="hvg-pre">body{opacity:0}</style>');

  var DEPENDENCIES = [
    'js/config/courses.config.js',
    'js/core/utils.js',
    'js/core/storage.js',
    'js/core/auth.js',
    'js/core/purchases.js'
  ];

  document.write('<link rel="stylesheet" href="' + BASE + 'css/lesson-guard.css">');
  DEPENDENCIES.forEach(function (src) {
    document.write('<scr' + 'ipt src="' + BASE + src + '"></scr' + 'ipt>');
  });
  // Runs after the dependencies above have loaded, because document.write
  // keeps everything in strict, blocking, in-order execution.
  document.write('<scr' + 'ipt>window.HVGuard.run(' + JSON.stringify(courseId) + ');</scr' + 'ipt>');

  function reveal(base) {
    var bar = document.createElement('div');
    bar.className = 'hvg-backbar';
    var user = window.HV.Auth.getCurrentUser();
    bar.innerHTML =
      '<a class="hvg-back-btn" href="' + base + 'index.html">← Về trang chủ HocLab</a>' +
      (user ? '<span class="hvg-user-chip">👤 ' + window.HV.Utils.escapeHtml(user.username) + '</span>' : '<a class="hvg-back-btn" href="' + base + 'auth/login.html">Đăng nhập</a>');
    document.body.insertBefore(bar, document.body.firstChild);

    var pre = document.getElementById('hvg-pre');
    if (pre) pre.remove();
  }

  function lock(base, course, user) {
    var title = course ? course.title : 'Khoá học này';
    var overlay = document.createElement('div');
    overlay.className = 'hvg-lock-overlay';
    var message = user
      ? 'Bạn chưa mua khoá học "' + window.HV.Utils.escapeHtml(title) + '". Vui lòng mua để tiếp tục.'
      : 'Vui lòng đăng nhập để truy cập "' + window.HV.Utils.escapeHtml(title) + '".';
    var primaryAction = user
      ? '<a class="hvg-btn hvg-btn-primary" href="' + base + 'payment/checkout.html?id=' + encodeURIComponent(course ? course.id : '') + '">Mua khoá học</a>'
      : '<a class="hvg-btn hvg-btn-primary" href="' + base + 'auth/login.html?redirect=' + encodeURIComponent('lessons/' + (course ? course.lessonPath.split('/').pop() : '')) + '">Đăng nhập</a>';

    overlay.innerHTML =
      '<div class="hvg-lock-card">' +
        '<div class="hvg-lock-icon">🔒</div>' +
        '<h2>Nội dung đã khoá</h2>' +
        '<p>' + message + '</p>' +
        '<div class="hvg-lock-actions">' +
          primaryAction +
          '<a class="hvg-btn hvg-btn-ghost" href="' + base + 'index.html">Về trang chủ</a>' +
        '</div>' +
      '</div>';

    // Replace the page outright rather than leaving hidden markup behind.
    document.body.innerHTML = '';
    document.body.appendChild(overlay);
    document.body.style.opacity = '1';
  }

  window.HVGuard = {
    run: function (id) {
      function onReady() {
        try {
          var HV = window.HV;
          var course = HV && HV.getCourse ? HV.getCourse(id) : null;
          var user = HV && HV.Auth ? HV.Auth.getCurrentUser() : null;
          var allowed = course && (course.isFree || (user && HV.Purchases.hasAccess(user.id, id)));

          if (allowed) {
            reveal(BASE);
          } else {
            lock(BASE, course, user);
          }
        } catch (err) {
          // Fail OPEN, not locked: this is a client-side demo gate, not real
          // security (see docs/DEVELOPER_GUIDE.md → Security Notes), so a
          // script error should never trap a legitimate visitor behind a
          // broken lock screen. Real protection happens server-side later.
          console.error('[HVGuard] entitlement check failed, revealing content:', err);
          var pre = document.getElementById('hvg-pre');
          if (pre) pre.remove();
          document.body.style.opacity = '1';
        }
      }

      // document.write's own script tags can occasionally finish executing
      // after the parser has already reached "interactive" — if so,
      // DOMContentLoaded has already fired and a fresh listener would never
      // run, so check current readiness first instead of only listening.
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady);
      } else {
        onReady();
      }
    }
  };
})(window, document);
