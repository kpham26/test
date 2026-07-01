/* ==========================================================================
   HocLab — Home page
   ========================================================================== */
(function (window, document) {
  'use strict';

  var HV = window.HV;
  var BASE = typeof window.HV_BASE === 'string' ? window.HV_BASE : '';
  var activeFilter = 'all';

  // Illustrative placeholder testimonials — swap for real ones once you have them.
  var REVIEWS = [
    {
      stars: 5,
      quote: 'Con nhà mình rất thích Đấu Trường Anh Ngữ, tự mở lên học mà không cần nhắc. Điểm tiếng Anh trên lớp tiến bộ rõ rệt sau một tháng.',
      author: '— Chị Lan, phụ huynh học sinh lớp 3, TP.HCM'
    },
    {
      stars: 5,
      quote: 'Mở bằng Chrome là chạy ngay, không cần cài gì cả. Cho con luyện Toán 20 phút mỗi tối trước khi ngủ, cháu thấy như đang chơi game.',
      author: '— Anh Minh, phụ huynh học sinh lớp 3, Hà Nội'
    },
    {
      stars: 5,
      quote: 'IELTS Master giúp con tự luyện nói mà không cần thuê gia sư riêng — con tự chỉnh tốc độ nghe và luyện phát âm mỗi ngày.',
      author: '— Chị Hương, phụ huynh học sinh THPT, Đà Nẵng'
    }
  ];

  function badgeMarkup(course, owned) {
    if (course.isFree) return '<span class="hv-badge hv-badge-free">Miễn phí</span>';
    if (owned) return '<span class="hv-badge hv-badge-owned">Đã sở hữu</span>';
    return '<span class="hv-badge hv-badge-paid">Trả phí</span>';
  }

  function tagsMarkup(course) {
    if (!course.tags || !course.tags.length) return '';
    return '<div class="hv-course-tags">' +
      course.tags.map(function (t) { return '<span class="hv-course-tag">' + HV.Utils.escapeHtml(t) + '</span>'; }).join('') +
      '</div>';
  }

  function checklistMarkup(course) {
    var items = (course.highlights || []).slice(0, 2);
    if (!items.length) return '';
    return '<ul class="hv-course-checklist">' +
      items.map(function (h) { return '<li>' + HV.Utils.escapeHtml(h) + '</li>'; }).join('') +
      '</ul>';
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
          tagsMarkup(course) +
          '<p class="hv-course-desc">' + HV.Utils.escapeHtml(course.shortDesc) + '</p>' +
          checklistMarkup(course) +
          '<div class="hv-course-footer">' +
            '<span class="hv-course-price' + priceClass + '">' + priceLabel + (course.isFree ? '' : '<span class="hv-course-price-unit">/ file HTML</span>') + '</span>' +
            '<a href="' + cta.href + '" class="hv-btn hv-btn-sm hv-btn-primary">' + cta.label + '</a>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function matchesFilter(course, filter) {
    if (filter === 'all') return true;
    if (filter === 'free') return course.isFree;
    return course.subject === filter;
  }

  function renderFilters() {
    var row = document.getElementById('filter-row');
    if (!row) return;

    var subjects = [];
    HV.COURSES.forEach(function (c) {
      if (subjects.indexOf(c.subject) === -1) subjects.push(c.subject);
    });
    var filters = [{ key: 'all', label: 'Tất cả' }]
      .concat(subjects.map(function (s) { return { key: s, label: s }; }))
      .concat([{ key: 'free', label: '🎁 Miễn phí' }]);

    row.innerHTML = filters.map(function (f) {
      var active = f.key === activeFilter ? ' hv-active' : '';
      return '<button type="button" class="hv-filter-pill' + active + '" data-filter="' + HV.Utils.escapeHtml(f.key) + '">' + HV.Utils.escapeHtml(f.label) + '</button>';
    }).join('');

    // Delegate once; on click just toggle classes on the existing pills and
    // re-render the grid — rebuilding the row's innerHTML here too would
    // detach the very node the click came from mid-handler.
    row.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-filter]');
      if (!btn) return;
      activeFilter = btn.getAttribute('data-filter');
      row.querySelectorAll('.hv-filter-pill').forEach(function (p) {
        p.classList.toggle('hv-active', p.getAttribute('data-filter') === activeFilter);
      });
      renderGrid();
    });
  }

  function renderGrid() {
    var grid = document.getElementById('courses-grid');
    if (!grid) return;
    var filtered = HV.COURSES.filter(function (c) { return matchesFilter(c, activeFilter); });

    grid.innerHTML = filtered.length
      ? filtered.map(cardMarkup).join('')
      : '<div class="hv-empty" style="grid-column:1/-1;"><div class="hv-empty-icon">🔍</div><h3>Không có khoá học phù hợp</h3><p>Thử chọn bộ lọc khác.</p></div>';
  }

  function renderComboBanner() {
    var el = document.getElementById('combo-banner');
    if (!el) return;
    var combo = HV.getComboPricing();
    if (combo.courses.length < 2) { el.innerHTML = ''; return; }

    var user = HV.Auth.getCurrentUser();
    var alreadyOwnsAll = !!user && combo.courseIds.every(function (id) { return HV.Purchases.hasAccess(user.id, id); });
    if (alreadyOwnsAll) { el.innerHTML = ''; return; }

    var href = BASE + 'payment/checkout.html?ids=' + combo.courseIds.map(encodeURIComponent).join(',') + '&combo=1';

    el.innerHTML =
      '<div class="hv-combo-text">' +
        '<h3>🎁 Mua trọn bộ ' + combo.courses.length + ' khoá học trả phí — Tiết kiệm hơn</h3>' +
        '<p>Nhận toàn bộ khoá học trả phí, giảm ' + combo.discountPercent + '% so với mua lẻ.</p>' +
        '<a href="' + href + '" class="hv-btn hv-btn-primary hv-btn-sm">Mua trọn bộ ngay</a>' +
      '</div>' +
      '<div class="hv-combo-price-block">' +
        '<div class="hv-combo-original">' + combo.courses.length + ' × giá lẻ = ' + HV.Utils.formatPrice(combo.originalTotal) + '</div>' +
        '<div class="hv-combo-price-row">' +
          '<span class="hv-combo-discounted">' + HV.Utils.formatPrice(combo.discountedTotal) + '</span>' +
          '<span class="hv-combo-save">Tiết kiệm ' + Math.round(combo.savings / 1000) + 'K</span>' +
        '</div>' +
      '</div>';
  }

  function renderReviews() {
    var grid = document.getElementById('review-grid');
    if (!grid) return;
    grid.innerHTML = REVIEWS.map(function (r) {
      return (
        '<div class="hv-review-card">' +
          '<div class="hv-review-stars">' + '★★★★★'.slice(0, r.stars) + '</div>' +
          '<p class="hv-review-quote">"' + HV.Utils.escapeHtml(r.quote) + '"</p>' +
          '<div class="hv-review-author">' + HV.Utils.escapeHtml(r.author) + '</div>' +
        '</div>'
      );
    }).join('');
  }

  function render() {
    renderFilters();
    renderGrid();
    renderComboBanner();
    renderReviews();

    var totalEl = document.getElementById('stat-total-courses');
    var freeEl = document.getElementById('stat-free-courses');
    if (totalEl) totalEl.textContent = HV.COURSES.length;
    if (freeEl) freeEl.textContent = HV.COURSES.filter(function (c) { return c.isFree; }).length;
  }

  document.addEventListener('DOMContentLoaded', render);
})(window, document);
