/* =========================================================================
   HocVui demo account / course / payment system
   ------------------------------------------------------------------------
   Everything here runs entirely in the browser (localStorage). There is
   NO real server, NO real password security, and NO real payment
   processing. It exists to demonstrate the *flow* of a course-selling
   site (accounts, admin panel, checkout, paywalls) before wiring up a
   real backend (Firebase Auth + Stripe, for example).
   ========================================================================= */
(function (global) {
  "use strict";

  var LS = {
    users: "hv_users",
    session: "hv_session",
    courses: "hv_courses",
    discounts: "hv_discounts",
    orders: "hv_orders"
  };

  var ADMIN_EMAIL = "admin@hocvui.com";
  var ADMIN_PASSWORD = "admin123";

  /* ---------------------------- storage io ---------------------------- */

  function read(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ------------------------------ seed data ----------------------------- */

  function defaultCourses() {
    return [
      {
        id: "math32",
        title: "Toán Lớp 3 – Kết Nối Tri Thức Với Cuộc Sống",
        desc: "Luyện tập bám sát chương trình SGK mới: 9 chương đầy đủ từ số học, hình học, đo lường đến tiền Việt Nam và thống kê.",
        price: 0,
        free: true,
        file: "math32.html",
        badgeText: "Toán lớp 3 · KNTT",
        tags: ["9 chương", "3 cấp độ", "Trắc nghiệm & điền số"],
        category: "math",
        icon: "🎓",
        colorClass: "cc-blue",
        preview: "Xem thử: Chương 1 ôn tập các số đến 1000, cộng trừ trong phạm vi 1000 có nhớ, và làm quen giao diện luyện tập có chấm điểm tức thì."
      },
      {
        id: "math3",
        title: "Vui Học Toán 3 – Đấu Trường Trí Tuệ",
        desc: "Thi đấu toán học theo phong cách đấu trường: 6 vòng đấu, 30 câu mỗi vòng, có tính giờ để bé rèn tốc độ và sự tự tin.",
        price: 299000,
        free: false,
        file: "math3.html",
        badgeText: "Toán lớp 3 · Đấu trường",
        tags: ["6 vòng đấu", "Tính giờ", "3 cấp độ"],
        category: "math",
        icon: "🏆",
        colorClass: "cc-vio",
        preview: "Xem thử: Vòng 1 khởi động với 10 câu hỏi tốc độ về bảng cửu chương và phép tính nhẩm, có huy hiệu chuỗi câu đúng."
      },
      {
        id: "ielts",
        title: "IELTS Master – Luyện Thi 4 Kỹ Năng",
        desc: "Luyện Listening, Reading, Writing, Speaking theo từng mức band điểm từ 5.0 đến 8.0+, kèm lý thuyết, mẹo làm bài và chấm điểm AI.",
        price: 499000,
        free: false,
        file: "ielts.html",
        badgeText: "IELTS · 4 kỹ năng",
        tags: ["4 kỹ năng", "Theo band điểm", "Chấm điểm AI"],
        category: "english",
        icon: "🎯",
        colorClass: "cc-ielts",
        preview: "Xem thử: Bài học mẫu Listening Section 1 (band 5.0) kèm transcript, chiến thuật nghe số điện thoại/địa chỉ và 5 câu luyện tập."
      }
    ];
  }

  function init() {
    if (read(LS.users, null) === null) {
      var users = {};
      users[ADMIN_EMAIL] = {
        name: "Quản Trị Viên",
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: "admin",
        createdAt: new Date().toISOString(),
        purchases: []
      };
      write(LS.users, users);
    }
    if (read(LS.courses, null) === null) write(LS.courses, defaultCourses());
    if (read(LS.discounts, null) === null) {
      write(LS.discounts, [
        { code: "WELCOME10", percent: 10, active: true },
        { code: "SUMMER20", percent: 20, active: true }
      ]);
    }
    if (read(LS.orders, null) === null) write(LS.orders, []);
    if (read(LS.session, undefined) === undefined) write(LS.session, null);
  }

  /* ------------------------------ getters/setters ------------------------------ */

  function getUsers() { return read(LS.users, {}); }
  function saveUsers(u) { return write(LS.users, u); }
  function getCourses() { return read(LS.courses, []); }
  function saveCourses(c) { return write(LS.courses, c); }
  function getDiscounts() { return read(LS.discounts, []); }
  function saveDiscounts(d) { return write(LS.discounts, d); }
  function getOrders() { return read(LS.orders, []); }
  function saveOrders(o) { return write(LS.orders, o); }

  function getSessionEmail() { return read(LS.session, null); }
  function setSessionEmail(email) { write(LS.session, email); }
  function clearSession() { write(LS.session, null); }

  function currentUser() {
    var email = getSessionEmail();
    if (!email) return null;
    var users = getUsers();
    return users[email] || null;
  }

  function isLoggedIn() { return currentUser() !== null; }
  function isAdmin() {
    var u = currentUser();
    return !!(u && u.role === "admin");
  }

  function getCourseById(id) {
    var courses = getCourses();
    for (var i = 0; i < courses.length; i++) {
      if (courses[i].id === id) return courses[i];
    }
    return null;
  }

  /* ------------------------------ auth actions ------------------------------ */

  function normEmail(e) { return String(e || "").trim().toLowerCase(); }

  function register(data) {
    var name = String(data.name || "").trim();
    var email = normEmail(data.email);
    var password = String(data.password || "");

    if (!name) return { ok: false, message: "Vui lòng nhập họ tên." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, message: "Email không hợp lệ." };
    }
    if (password.length < 4) {
      return { ok: false, message: "Mật khẩu cần tối thiểu 4 ký tự." };
    }

    var users = getUsers();
    if (users[email]) {
      return { ok: false, message: "Email này đã được đăng ký." };
    }

    users[email] = {
      name: name,
      email: email,
      password: password,
      role: "customer", // public registration can NEVER create an admin account
      createdAt: new Date().toISOString(),
      purchases: []
    };
    saveUsers(users);
    setSessionEmail(email);
    return { ok: true, message: "Tạo tài khoản thành công!" };
  }

  function login(email, password) {
    email = normEmail(email);
    var users = getUsers();
    var u = users[email];
    if (!u || u.password !== String(password || "")) {
      return { ok: false, message: "Email hoặc mật khẩu không đúng." };
    }
    setSessionEmail(email);
    return { ok: true, message: "Đăng nhập thành công!", user: u };
  }

  function loginPasswordless(email) {
    email = normEmail(email);
    var users = getUsers();
    var u = users[email];
    if (!u) {
      return { ok: false, message: "Email chưa có tài khoản. Vui lòng đăng ký trước." };
    }
    setSessionEmail(email);
    return { ok: true, message: "Xác thực thành công!", user: u };
  }

  function logout() { clearSession(); }

  function updateProfile(patch) {
    var email = getSessionEmail();
    if (!email) return { ok: false, message: "Bạn chưa đăng nhập." };
    var users = getUsers();
    var u = users[email];
    if (!u) return { ok: false, message: "Không tìm thấy tài khoản." };
    if (patch.name !== undefined) u.name = String(patch.name).trim() || u.name;
    users[email] = u;
    saveUsers(users);
    return { ok: true, message: "Đã cập nhật thông tin." };
  }

  /* Admin-only: create any account, including other admins */
  function adminCreateUser(data) {
    if (!isAdmin()) return { ok: false, message: "Bạn không có quyền thực hiện thao tác này." };
    var name = String(data.name || "").trim();
    var email = normEmail(data.email);
    var password = String(data.password || "");
    var role = data.role === "admin" ? "admin" : "customer";

    if (!name) return { ok: false, message: "Vui lòng nhập họ tên." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, message: "Email không hợp lệ." };
    }
    if (password.length < 4) {
      return { ok: false, message: "Mật khẩu cần tối thiểu 4 ký tự." };
    }
    var users = getUsers();
    if (users[email]) return { ok: false, message: "Email này đã tồn tại." };

    users[email] = {
      name: name,
      email: email,
      password: password,
      role: role,
      createdAt: new Date().toISOString(),
      purchases: []
    };
    saveUsers(users);
    return { ok: true, message: "Đã tạo tài khoản " + email + "." };
  }

  function adminSetRole(email, role) {
    if (!isAdmin()) return { ok: false, message: "Không có quyền." };
    email = normEmail(email);
    if (email === normEmail(getSessionEmail())) {
      return { ok: false, message: "Không thể tự đổi vai trò của chính mình." };
    }
    var users = getUsers();
    if (!users[email]) return { ok: false, message: "Không tìm thấy người dùng." };
    users[email].role = role === "admin" ? "admin" : "customer";
    saveUsers(users);
    return { ok: true };
  }

  function adminDeleteUser(email) {
    if (!isAdmin()) return { ok: false, message: "Không có quyền." };
    email = normEmail(email);
    if (email === normEmail(getSessionEmail())) {
      return { ok: false, message: "Không thể tự xoá tài khoản đang đăng nhập." };
    }
    var users = getUsers();
    delete users[email];
    saveUsers(users);
    return { ok: true };
  }

  /* ------------------------------ purchases ------------------------------ */

  function hasPurchased(courseId) {
    var course = getCourseById(courseId);
    if (course && course.free) return true;
    var u = currentUser();
    if (!u) return false;
    return (u.purchases || []).indexOf(courseId) !== -1;
  }

  function applyDiscount(code) {
    code = String(code || "").trim().toUpperCase();
    if (!code) return { ok: false, message: "Vui lòng nhập mã giảm giá." };
    var list = getDiscounts();
    for (var i = 0; i < list.length; i++) {
      if (list[i].code.toUpperCase() === code && list[i].active) {
        return { ok: true, percent: list[i].percent, code: list[i].code };
      }
    }
    return { ok: false, message: "Mã giảm giá không hợp lệ hoặc đã hết hạn." };
  }

  function purchaseCourse(courseId, discountCode) {
    var u = currentUser();
    if (!u) return { ok: false, message: "Bạn cần đăng nhập để mua khóa học." };
    var course = getCourseById(courseId);
    if (!course) return { ok: false, message: "Không tìm thấy khóa học." };

    var amount = course.price;
    var percent = 0;
    var appliedCode = null;
    if (discountCode) {
      var d = applyDiscount(discountCode);
      if (d.ok) {
        percent = d.percent;
        appliedCode = d.code;
        amount = Math.round(amount * (100 - percent) / 100);
      }
    }

    var users = getUsers();
    var stored = users[u.email];
    stored.purchases = stored.purchases || [];
    if (stored.purchases.indexOf(courseId) === -1) stored.purchases.push(courseId);
    users[u.email] = stored;
    saveUsers(users);

    var order = {
      id: "HV" + Date.now().toString().slice(-8),
      userEmail: u.email,
      userName: u.name,
      courseId: courseId,
      courseTitle: course.title,
      amount: amount,
      originalAmount: course.price,
      discountCode: appliedCode,
      discountPercent: percent,
      date: new Date().toISOString()
    };
    var orders = getOrders();
    orders.unshift(order);
    saveOrders(orders);

    return { ok: true, order: order };
  }

  /* ------------------------------ utils ------------------------------ */

  function formatVND(n) {
    n = Number(n) || 0;
    return n.toLocaleString("vi-VN") + "đ";
  }

  function formatDate(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    } catch (e) { return iso; }
  }

  function escapeHtml(str) {
    return String(str === undefined || str === null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function qs(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function currentPathWithQuery() {
    return window.location.pathname.split("/").pop() + window.location.search;
  }

  function initials(name) {
    name = String(name || "?").trim();
    if (!name) return "?";
    var parts = name.split(/\s+/);
    var last = parts[parts.length - 1];
    return last.charAt(0).toUpperCase();
  }

  /* ------------------------------ toast ------------------------------ */

  function ensureToastContainer() {
    var el = document.getElementById("hvToastContainer");
    if (!el) {
      el = document.createElement("div");
      el.id = "hvToastContainer";
      el.className = "hv-toast-container";
      document.body.appendChild(el);
    }
    return el;
  }

  function toast(message, type, duration) {
    type = type || "success";
    duration = duration || 3200;
    var container = ensureToastContainer();
    var el = document.createElement("div");
    el.className = "hv-toast hv-toast-" + type;
    var icon = type === "success" ? "✅" : type === "error" ? "⚠️" : "ℹ️";
    el.innerHTML = '<span class="hv-toast-icon">' + icon + '</span><span>' + escapeHtml(message) + "</span>";
    container.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("show"); });
    setTimeout(function () {
      el.classList.remove("show");
      setTimeout(function () { el.remove(); }, 250);
    }, duration);
  }

  /* ------------------------------ guards ------------------------------ */

  function requireLogin(redirectTarget) {
    if (isLoggedIn()) return true;
    var target = redirectTarget || currentPathWithQuery();
    window.location.href = "login.html?redirect=" + encodeURIComponent(target);
    return false;
  }

  function requireAdmin() {
    if (isAdmin()) return true;
    if (isLoggedIn()) {
      window.location.href = "index.html";
    } else {
      window.location.href = "login.html?redirect=" + encodeURIComponent("admin.html");
    }
    return false;
  }

  function guardPaidLesson(courseId) {
    var course = getCourseById(courseId);
    if (course && course.free) return true;
    if (hasPurchased(courseId)) return true;
    window.location.href = "checkout.html?course=" + encodeURIComponent(courseId);
    return false;
  }

  /* ------------------------------ styles ------------------------------ */

  var STYLE_ID = "hv-base-styles";
  function injectBaseStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css = [
      ":root{",
      "--hv-navy:#0b1f3a;--hv-blue:#1565C0;--hv-blue2:#2563eb;--hv-sky:#38bdf8;",
      "--hv-gold:#ffb627;--hv-gold2:#ffd166;--hv-coral:#ff6b6b;--hv-mint:#2ec4b6;",
      "--hv-teal:#0d9488;--hv-ink:#1c2b3a;--hv-muted:#64748b;--hv-bg:#F0F6FF;--hv-border:#e2e8f0;",
      "}",

      /* toast */
      ".hv-toast-container{position:fixed;bottom:20px;right:18px;z-index:4000;display:flex;flex-direction:column;gap:10px;max-width:320px;}",
      ".hv-toast{display:flex;align-items:center;gap:10px;background:#0b1f3a;color:#fff;padding:13px 16px;border-radius:12px;font-size:13.5px;font-weight:600;box-shadow:0 10px 26px rgba(0,0,0,0.25);opacity:0;transform:translateY(12px);transition:all .25s ease;font-family:'Segoe UI',system-ui,sans-serif;}",
      ".hv-toast.show{opacity:1;transform:translateY(0);}",
      ".hv-toast-success{background:#0f5132;}",
      ".hv-toast-error{background:#7a2222;}",
      ".hv-toast-info{background:#0b1f3a;}",
      ".hv-toast-icon{font-size:15px;}",

      /* account widget */
      ".hv-account-widget{position:fixed;top:14px;right:14px;z-index:1000;font-family:'Segoe UI',system-ui,sans-serif;}",
      ".hv-acct-guest{display:flex;gap:8px;}",
      ".hv-btn-mini{padding:8px 15px;border-radius:20px;font-size:12.5px;font-weight:700;text-decoration:none;cursor:pointer;border:1.5px solid transparent;transition:all .15s;white-space:nowrap;}",
      ".hv-btn-mini-outline{background:rgba(255,255,255,0.95);color:#0b1f3a;border-color:#fff;}",
      ".hv-btn-mini-outline:hover{background:#fff;transform:translateY(-1px);}",
      ".hv-btn-mini-solid{background:#0b1f3a;color:#fff;}",
      ".hv-btn-mini-solid:hover{background:#13294f;transform:translateY(-1px);}",
      ".hv-profile-btn{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.97);border:1.5px solid #fff;border-radius:24px;padding:6px 14px 6px 6px;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,0.15);font-size:13px;font-weight:700;color:#0b1f3a;}",
      ".hv-avatar{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#1565C0,#38bdf8);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:800;flex-shrink:0;}",
      ".hv-avatar-admin{background:linear-gradient(135deg,#ffb627,#ff6b6b);}",
      ".hv-caret{font-size:10px;opacity:0.6;}",
      ".hv-dropdown{position:absolute;top:calc(100% + 8px);right:0;background:#fff;border-radius:16px;box-shadow:0 14px 34px rgba(11,31,58,0.22);width:230px;overflow:hidden;border:1px solid #eef1f6;display:none;}",
      ".hv-dropdown.open{display:block;animation:hvFadeIn .15s ease;}",
      "@keyframes hvFadeIn{from{opacity:0;transform:translateY(-4px);}to{opacity:1;transform:translateY(0);}}",
      ".hv-dropdown-header{padding:14px 16px;background:#F0F6FF;border-bottom:1px solid #eef1f6;}",
      ".hv-dropdown-name{font-weight:800;font-size:13.5px;color:#0b1f3a;}",
      ".hv-dropdown-email{font-size:11.5px;color:#64748b;margin-top:2px;word-break:break-all;}",
      ".hv-role-badge{display:inline-block;margin-top:6px;font-size:9.5px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;padding:2px 8px;border-radius:20px;background:#E3F2FD;color:#0D47A1;}",
      ".hv-role-badge.admin{background:#FFF3E0;color:#BF360C;}",
      ".hv-dropdown a,.hv-dropdown button{display:flex;align-items:center;gap:9px;width:100%;text-align:left;padding:11px 16px;font-size:13px;font-weight:600;color:#1c2b3a;text-decoration:none;background:none;border:none;cursor:pointer;font-family:inherit;}",
      ".hv-dropdown a:hover,.hv-dropdown button:hover{background:#F0F6FF;}",
      ".hv-dropdown-divider{height:1px;background:#eef1f6;margin:4px 0;}",
      ".hv-logout-btn{color:#c0392b !important;}",

      /* generic buttons/inputs reused across new pages */
      ".hv-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 22px;border-radius:12px;font-size:14px;font-weight:800;cursor:pointer;border:none;text-decoration:none;transition:all .15s;font-family:inherit;}",
      ".hv-btn-primary{background:linear-gradient(135deg,#0b1f3a,#1565C0);color:#fff;}",
      ".hv-btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(21,101,192,0.32);}",
      ".hv-btn-secondary{background:#F0F6FF;color:#1565C0;border:1.5px solid #dbe8ff;}",
      ".hv-btn-secondary:hover{background:#e3efff;}",
      ".hv-btn-danger{background:#fdecec;color:#c0392b;}",
      ".hv-btn-danger:hover{background:#fbdada;}",
      ".hv-btn:disabled{opacity:.6;cursor:not-allowed;transform:none !important;}",
      ".hv-btn-block{width:100%;}",
      ".hv-btn-sm{padding:7px 13px;font-size:12px;border-radius:9px;}",

      ".hv-field{margin-bottom:16px;text-align:left;}",
      ".hv-field label{display:block;font-size:12.5px;font-weight:700;color:#334155;margin-bottom:6px;}",
      ".hv-input,.hv-select{width:100%;padding:12px 14px;border-radius:11px;border:1.5px solid #e2e8f0;font-size:14px;font-family:inherit;background:#fff;color:#1c2b3a;}",
      ".hv-input:focus,.hv-select:focus{outline:none;border-color:#1565C0;box-shadow:0 0 0 3px rgba(21,101,192,0.12);}",
      ".hv-hint{font-size:11.5px;color:#94a3b8;margin-top:5px;}",
      ".hv-error-text{font-size:12px;color:#c0392b;font-weight:700;margin-top:8px;}",
      ".hv-checkbox-row{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#334155;}",

      ".hv-card{background:#fff;border-radius:20px;border:1.5px solid #e2e8f0;box-shadow:0 2px 12px rgba(11,31,58,0.06);}",

      /* tables */
      ".hv-table-wrap{overflow-x:auto;border-radius:14px;border:1.5px solid #e2e8f0;}",
      ".hv-table{width:100%;border-collapse:collapse;font-size:13px;min-width:520px;}",
      ".hv-table th{text-align:left;background:#F0F6FF;color:#334155;font-weight:800;padding:11px 14px;font-size:11.5px;text-transform:uppercase;letter-spacing:.3px;white-space:nowrap;}",
      ".hv-table td{padding:12px 14px;border-top:1px solid #eef1f6;color:#1c2b3a;vertical-align:middle;}",
      ".hv-table tr:hover td{background:#FAFCFF;}",

      /* badges */
      ".hv-badge{display:inline-block;font-size:10px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;padding:4px 10px;border-radius:20px;}",
      ".hv-badge-free{background:#E8F8F0;color:#0f5132;}",
      ".hv-badge-paid{background:#FFF3E0;color:#BF360C;}",
      ".hv-badge-admin{background:#FFF3E0;color:#BF360C;}",
      ".hv-badge-customer{background:#E3F2FD;color:#0D47A1;}",
      ".hv-badge-active{background:#E8F8F0;color:#0f5132;}",
      ".hv-badge-inactive{background:#f1f5f9;color:#64748b;}",

      /* tabs */
      ".hv-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:22px;border-bottom:2px solid #e2e8f0;}",
      ".hv-tab{padding:11px 18px;font-size:13.5px;font-weight:700;color:#64748b;cursor:pointer;border-bottom:3px solid transparent;margin-bottom:-2px;transition:all .15s;}",
      ".hv-tab:hover{color:#1565C0;}",
      ".hv-tab.active{color:#0b1f3a;border-bottom-color:#1565C0;}",
      ".hv-tab-panel{display:none;}",
      ".hv-tab-panel.active{display:block;animation:hvFadeIn .2s ease;}",

      /* modal */
      ".hv-modal-overlay{position:fixed;inset:0;background:rgba(11,31,58,0.55);z-index:5000;display:none;align-items:center;justify-content:center;padding:20px;}",
      ".hv-modal-overlay.open{display:flex;}",
      ".hv-modal{background:#fff;border-radius:20px;max-width:440px;width:100%;padding:28px;position:relative;box-shadow:0 24px 60px rgba(0,0,0,0.3);max-height:88vh;overflow-y:auto;}",
      ".hv-modal-close{position:absolute;top:14px;right:14px;background:#F0F6FF;border:none;width:32px;height:32px;border-radius:50%;font-size:16px;cursor:pointer;color:#334155;}",
      ".hv-modal h3{font-size:1.15rem;font-weight:800;color:#0b1f3a;margin-bottom:10px;padding-right:24px;}",
      ".hv-modal p{font-size:13.5px;color:#475569;line-height:1.6;margin-bottom:10px;}",

      "@media (max-width:480px){",
      ".hv-account-widget{top:10px;right:10px;}",
      ".hv-btn-mini{padding:7px 11px;font-size:11.5px;}",
      ".hv-dropdown{width:200px;}",
      "}"
    ].join("\n");

    var styleEl = document.createElement("style");
    styleEl.id = STYLE_ID;
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  /* ------------------------------ account widget ------------------------------ */

  function renderAccountWidget() {
    var existing = document.querySelector(".hv-account-widget");
    if (existing) existing.remove();

    var wrap = document.createElement("div");
    wrap.className = "hv-account-widget";

    var u = currentUser();
    if (!u) {
      wrap.innerHTML =
        '<div class="hv-acct-guest">' +
        '<a class="hv-btn-mini hv-btn-mini-outline" href="login.html">Đăng nhập</a>' +
        '<a class="hv-btn-mini hv-btn-mini-solid" href="login.html?tab=register">Đăng ký</a>' +
        "</div>";
      document.body.appendChild(wrap);
      return;
    }

    var admin = u.role === "admin";
    var roleLabel = admin ? "Quản trị viên" : "Khách hàng";
    var avatarClass = admin ? "hv-avatar hv-avatar-admin" : "hv-avatar";

    wrap.innerHTML =
      '<button class="hv-profile-btn" id="hvProfileBtn" type="button">' +
      '<span class="' + avatarClass + '">' + escapeHtml(initials(u.name)) + "</span>" +
      "<span>" + escapeHtml(u.name.split(" ")[0]) + '</span><span class="hv-caret">▾</span>' +
      "</button>" +
      '<div class="hv-dropdown" id="hvDropdown">' +
      '<div class="hv-dropdown-header">' +
      '<div class="hv-dropdown-name">' + escapeHtml(u.name) + "</div>" +
      '<div class="hv-dropdown-email">' + escapeHtml(u.email) + "</div>" +
      '<span class="hv-role-badge' + (admin ? " admin" : "") + '">' + roleLabel + "</span>" +
      "</div>" +
      '<a href="account.html">📚 Khóa học của tôi</a>' +
      '<a href="account.html#profile">⚙️ Thông tin tài khoản</a>' +
      (admin ? '<a href="admin.html">🛠️ Trang quản trị</a>' : "") +
      '<div class="hv-dropdown-divider"></div>' +
      '<button type="button" class="hv-logout-btn" id="hvLogoutBtn">🚪 Đăng xuất</button>' +
      "</div>";

    document.body.appendChild(wrap);

    var btn = document.getElementById("hvProfileBtn");
    var dd = document.getElementById("hvDropdown");
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      dd.classList.toggle("open");
    });
    document.addEventListener("click", function (e) {
      if (!wrap.contains(e.target)) dd.classList.remove("open");
    });
    document.getElementById("hvLogoutBtn").addEventListener("click", function () {
      logout();
      toast("Đã đăng xuất.", "info");
      setTimeout(function () {
        // if leaving a page that requires login, bounce to homepage
        window.location.href = "index.html";
      }, 500);
    });
  }

  /* ------------------------------ preview modal ------------------------------ */

  function ensurePreviewModal() {
    var el = document.getElementById("hvPreviewModal");
    if (el) return el;
    el = document.createElement("div");
    el.className = "hv-modal-overlay";
    el.id = "hvPreviewModal";
    el.innerHTML =
      '<div class="hv-modal">' +
      '<button class="hv-modal-close" id="hvPreviewClose" type="button">✕</button>' +
      '<div id="hvPreviewBody"></div>' +
      "</div>";
    document.body.appendChild(el);
    el.addEventListener("click", function (e) {
      if (e.target === el) closePreviewModal();
    });
    document.getElementById("hvPreviewClose").addEventListener("click", closePreviewModal);
    return el;
  }

  function openPreviewModal(courseId) {
    var course = getCourseById(courseId);
    if (!course) return;
    var modal = ensurePreviewModal();
    var body = document.getElementById("hvPreviewBody");
    body.innerHTML =
      '<h3>' + course.icon + " " + escapeHtml(course.title) + "</h3>" +
      "<p><strong>👀 Xem thử miễn phí</strong></p>" +
      "<p>" + escapeHtml(course.preview || "") + "</p>" +
      '<p style="margin-top:16px;">' + (course.free ? "Khóa học này hoàn toàn miễn phí!" : "Mua khóa học để mở khoá toàn bộ nội dung, luyện tập không giới hạn và theo dõi tiến độ.") + "</p>" +
      '<div style="display:flex;gap:10px;margin-top:18px;">' +
      (course.free
        ? '<a class="hv-btn hv-btn-primary hv-btn-block" href="' + escapeHtml(course.file) + '">Vào học ngay</a>'
        : '<a class="hv-btn hv-btn-primary hv-btn-block" href="checkout.html?course=' + encodeURIComponent(course.id) + '">Mua khóa học</a>') +
      "</div>";
    modal.classList.add("open");
  }

  function closePreviewModal() {
    var modal = document.getElementById("hvPreviewModal");
    if (modal) modal.classList.remove("open");
  }

  /* ------------------------------ boot ------------------------------ */

  init();
  injectBaseStyles();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderAccountWidget);
  } else {
    renderAccountWidget();
  }

  global.HV = {
    ADMIN_EMAIL: ADMIN_EMAIL,
    init: init,
    getUsers: getUsers, saveUsers: saveUsers,
    getCourses: getCourses, saveCourses: saveCourses, getCourseById: getCourseById,
    getDiscounts: getDiscounts, saveDiscounts: saveDiscounts,
    getOrders: getOrders, saveOrders: saveOrders,
    getSessionEmail: getSessionEmail,
    currentUser: currentUser, isLoggedIn: isLoggedIn, isAdmin: isAdmin,
    register: register, login: login, loginPasswordless: loginPasswordless, logout: logout,
    updateProfile: updateProfile,
    adminCreateUser: adminCreateUser, adminSetRole: adminSetRole, adminDeleteUser: adminDeleteUser,
    hasPurchased: hasPurchased, applyDiscount: applyDiscount, purchaseCourse: purchaseCourse,
    formatVND: formatVND, formatDate: formatDate, escapeHtml: escapeHtml, qs: qs, initials: initials,
    toast: toast,
    requireLogin: requireLogin, requireAdmin: requireAdmin, guardPaidLesson: guardPaidLesson,
    renderAccountWidget: renderAccountWidget,
    openPreviewModal: openPreviewModal, closePreviewModal: closePreviewModal,
    injectBaseStyles: injectBaseStyles
  };
})(window);
