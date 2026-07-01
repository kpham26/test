/* ==========================================================================
   HocLab — Toast & Modal
   Shared feedback UI so purchase confirmations, form errors, and
   confirmation dialogs look and behave the same everywhere.
   ========================================================================== */
(function (window, document) {
  'use strict';

  var HV = window.HV;

  function ensureToastRoot() {
    var root = document.getElementById('hv-toast-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'hv-toast-root';
      root.setAttribute('aria-live', 'polite');
      document.body.appendChild(root);
    }
    return root;
  }

  var ICONS = { success: '✅', error: '⚠️', info: 'ℹ️' };

  var Toast = {
    /**
     * @param {string} message
     * @param {'success'|'error'|'info'} [type]
     * @param {number} [duration] ms before auto-dismiss
     */
    show: function (message, type, duration) {
      type = type || 'info';
      duration = duration || 3200;
      var root = ensureToastRoot();

      var el = document.createElement('div');
      el.className = 'hv-toast hv-toast-' + type;
      el.setAttribute('role', 'status');
      el.innerHTML =
        '<span class="hv-toast-icon">' + (ICONS[type] || ICONS.info) + '</span>' +
        '<span>' + HV.Utils.escapeHtml(message) + '</span>';
      root.appendChild(el);

      var remove = function () {
        el.classList.add('hv-toast-out');
        setTimeout(function () { el.remove(); }, 180);
      };
      var timer = setTimeout(remove, duration);
      el.addEventListener('click', function () { clearTimeout(timer); remove(); });
    },
    success: function (message, duration) { Toast.show(message, 'success', duration); },
    error: function (message, duration) { Toast.show(message, 'error', duration); }
  };

  var Modal = {
    /**
     * Shows a confirm/cancel dialog.
     * @param {string} message
     * @param {{title?:string, confirmLabel?:string, cancelLabel?:string, danger?:boolean}} [options]
     * @returns {Promise<boolean>} resolves true if confirmed, false if cancelled
     */
    confirm: function (message, options) {
      options = options || {};
      return new Promise(function (resolve) {
        var overlay = document.createElement('div');
        overlay.className = 'hv-modal-overlay';
        overlay.innerHTML =
          '<div class="hv-modal" role="dialog" aria-modal="true">' +
            (options.title ? '<h3>' + HV.Utils.escapeHtml(options.title) + '</h3>' : '') +
            '<p>' + HV.Utils.escapeHtml(message) + '</p>' +
            '<div class="hv-modal-actions">' +
              '<button type="button" class="hv-btn hv-btn-ghost" data-act="cancel">' + HV.Utils.escapeHtml(options.cancelLabel || 'Huỷ') + '</button>' +
              '<button type="button" class="hv-btn ' + (options.danger ? 'hv-btn-danger' : 'hv-btn-primary') + '" data-act="confirm">' + HV.Utils.escapeHtml(options.confirmLabel || 'Xác nhận') + '</button>' +
            '</div>' +
          '</div>';
        document.body.appendChild(overlay);

        function close(result) {
          overlay.remove();
          document.removeEventListener('keydown', onKey);
          resolve(result);
        }
        function onKey(e) { if (e.key === 'Escape') close(false); }

        overlay.addEventListener('click', function (e) {
          if (e.target === overlay) close(false);
          var act = e.target.closest('[data-act]');
          if (act) close(act.getAttribute('data-act') === 'confirm');
        });
        document.addEventListener('keydown', onKey);
        overlay.querySelector('[data-act="confirm"]').focus();
      });
    }
  };

  HV.Toast = Toast;
  HV.Modal = Modal;
})(window, document);
