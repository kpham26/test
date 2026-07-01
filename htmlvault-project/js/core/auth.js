/* ==========================================================================
   HTMLVault — Auth
   Front-end-only authentication simulation backed by HV.Storage.
   Public API: register(), login(), logout(), getCurrentUser(), isLoggedIn()

   SECURITY NOTE: everything here lives in the browser's localStorage.
   That is fine for an MVP demo, but it is not real authentication — see
   docs/DEVELOPER_GUIDE.md → Security Notes before this ever touches a
   real user's real password.
   ========================================================================== */
(function (window) {
  'use strict';

  var HV = window.HV = window.HV || {};
  var Storage = HV.Storage;
  var Utils = HV.Utils;

  var USERS_KEY = 'users';
  var SESSION_KEY = 'session';

  var ADMIN_USERNAME = 'admin';
  var ADMIN_EMAIL = 'admin@htmlvault.local';
  var ADMIN_PASSWORD = 'Admin@123'; // seeded on first load — see DEVELOPER_GUIDE.md

  function getUsers() {
    return Storage.get(USERS_KEY, []);
  }
  function saveUsers(users) {
    return Storage.set(USERS_KEY, users);
  }
  function findByUsername(users, username) {
    var needle = String(username || '').trim().toLowerCase();
    for (var i = 0; i < users.length; i++) {
      if (users[i].username.toLowerCase() === needle) return users[i];
    }
    return null;
  }
  function findByEmail(users, email) {
    var needle = String(email || '').trim().toLowerCase();
    for (var i = 0; i < users.length; i++) {
      if (users[i].email.toLowerCase() === needle) return users[i];
    }
    return null;
  }
  function publicUser(user) {
    if (!user) return null;
    return { id: user.id, username: user.username, email: user.email, role: user.role, createdAt: user.createdAt };
  }

  /** Seeds one default admin account the first time the site ever loads. */
  function seedAdmin() {
    var users = getUsers();
    var existingAdmin = findByUsername(users, ADMIN_USERNAME);
    if (existingAdmin) return;
    users.push({
      id: Utils.uid('user'),
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      passwordHash: Utils.weakHash(ADMIN_PASSWORD),
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    saveUsers(users);
  }

  var Auth = {
    ADMIN_USERNAME: ADMIN_USERNAME,
    ADMIN_PASSWORD: ADMIN_PASSWORD,

    /**
     * Validates and creates a new account.
     * @param {{username:string,email:string,password:string,confirmPassword:string}} data
     * @returns {{success:boolean,error?:string,user?:object}}
     */
    register: function (data) {
      data = data || {};
      var username = String(data.username || '').trim();
      var email = String(data.email || '').trim();
      var password = String(data.password || '');
      var confirmPassword = String(data.confirmPassword || '');

      if (!username || !email || !password || !confirmPassword) {
        return { success: false, error: 'Vui lòng điền đầy đủ tất cả các trường.' };
      }
      if (username.length < 3) {
        return { success: false, error: 'Tên đăng nhập phải có ít nhất 3 ký tự.' };
      }
      if (!Utils.isValidEmail(email)) {
        return { success: false, error: 'Địa chỉ email không hợp lệ.' };
      }
      if (password.length < 6) {
        return { success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự.' };
      }
      if (password !== confirmPassword) {
        return { success: false, error: 'Mật khẩu xác nhận không khớp.' };
      }

      var users = getUsers();
      if (findByUsername(users, username)) {
        return { success: false, error: 'Tên đăng nhập này đã được sử dụng.' };
      }
      if (findByEmail(users, email)) {
        return { success: false, error: 'Email này đã được đăng ký.' };
      }

      var user = {
        id: Utils.uid('user'),
        username: username,
        email: email,
        passwordHash: Utils.weakHash(password),
        role: 'student',
        createdAt: new Date().toISOString()
      };
      users.push(user);
      saveUsers(users);
      Storage.set(SESSION_KEY, { userId: user.id });

      return { success: true, user: publicUser(user) };
    },

    /**
     * Logs in with a username OR email, plus password.
     * @returns {{success:boolean,error?:string,user?:object}}
     */
    login: function (identifier, password) {
      identifier = String(identifier || '').trim();
      password = String(password || '');

      if (!identifier || !password) {
        return { success: false, error: 'Vui lòng nhập tên đăng nhập/email và mật khẩu.' };
      }

      var users = getUsers();
      var user = identifier.indexOf('@') !== -1
        ? findByEmail(users, identifier)
        : findByUsername(users, identifier);

      if (!user || user.passwordHash !== Utils.weakHash(password)) {
        return { success: false, error: 'Tên đăng nhập/email hoặc mật khẩu không đúng.' };
      }

      Storage.set(SESSION_KEY, { userId: user.id });
      return { success: true, user: publicUser(user) };
    },

    logout: function () {
      Storage.remove(SESSION_KEY);
    },

    /** Returns the logged-in user (never includes passwordHash), or null. */
    getCurrentUser: function () {
      var session = Storage.get(SESSION_KEY, null);
      if (!session || !session.userId) return null;
      var users = getUsers();
      for (var i = 0; i < users.length; i++) {
        if (users[i].id === session.userId) return publicUser(users[i]);
      }
      return null;
    },

    isLoggedIn: function () {
      return Auth.getCurrentUser() !== null;
    }
  };

  seedAdmin();

  HV.Auth = Auth;
})(typeof window !== 'undefined' ? window : globalThis);
