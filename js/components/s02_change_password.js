/**
 * =========================================================================
 * S02: GANTI PASSWORD SCREEN
 * File: s02_change_password.js
 * Deskripsi: Form penggantian password lama ke password baru, validasi aturan
 *            (min 8 karakter, huruf + angka), konfirmasi kecocokan
 * =========================================================================
 */

App.registerRoute("#/ganti-password", function(container) {
  var user = API.getCurrentUser();
  var isForced = user && user.must_change_password;

  container.innerHTML = '<div style="max-width: 480px; margin: 24px auto;">' +
    '<div class="card">' +
      '<div class="page-header" style="margin-bottom: var(--space-4);">' +
        '<div>' +
          '<h2>Ganti Password</h2>' +
          '<p class="page-subtitle">' +
            (isForced ? 'Wajib mengganti password awal sebelum melanjutkan.' : 'Perbarui password akun Anda secara berkala.') +
          '</p>' +
        '</div>' +
      '</div>' +
      '<div id="change-pwd-error" style="display:none;" class="banner banner-danger"></div>' +
      '<form id="form-change-pwd">' +
        '<div class="form-group">' +
          '<label class="form-label" for="old-pwd">Password Saat Ini</label>' +
          '<input type="password" id="old-pwd" class="form-input" required autocomplete="current-password">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="new-pwd">Password Baru</label>' +
          '<input type="password" id="new-pwd" class="form-input" required autocomplete="new-password">' +
          '<div class="form-help" id="pwd-strength-help">Minimal 8 karakter, memuat kombinasi huruf dan angka.</div>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="confirm-pwd">Konfirmasi Password Baru</label>' +
          '<input type="password" id="confirm-pwd" class="form-input" required autocomplete="new-password">' +
        '</div>' +
        '<div style="display: flex; gap: var(--space-3); justify-content: flex-end; margin-top: var(--space-5);">' +
          (!isForced ? '<button type="button" class="btn btn-secondary" onclick="App.navigate(\'#/dashboard\')">Batal</button>' : '') +
          '<button type="submit" id="btn-save-pwd" class="btn btn-primary">' +
            '<span>Simpan Password</span>' +
          '</button>' +
        '</div>' +
      '</form>' +
    '</div>' +
  '</div>';

  var form = document.getElementById("form-change-pwd");
  var submitBtn = document.getElementById("btn-save-pwd");
  var errorEl = document.getElementById("change-pwd-error");
  var newPwdInput = document.getElementById("new-pwd");
  var helpEl = document.getElementById("pwd-strength-help");

  newPwdInput.oninput = function() {
    var val = newPwdInput.value;
    var hasLen = val.length >= 8;
    var hasLetter = /[a-zA-Z]/.test(val);
    var hasDigit = /[0-9]/.test(val);

    if (hasLen && hasLetter && hasDigit) {
      helpEl.style.color = "var(--color-success)";
      helpEl.textContent = "Kombinasi password memenuhi syarat.";
    } else {
      helpEl.style.color = "var(--color-text-muted)";
      helpEl.textContent = "Minimal 8 karakter, memuat kombinasi huruf dan angka.";
    }
  };

  form.onsubmit = function(e) {
    e.preventDefault();
    errorEl.style.display = "none";

    var oldPwd = document.getElementById("old-pwd").value;
    var newPwd = newPwdInput.value;
    var confirmPwd = document.getElementById("confirm-pwd").value;

    if (newPwd !== confirmPwd) {
      errorEl.textContent = "Konfirmasi password baru tidak cocok.";
      errorEl.style.display = "flex";
      return;
    }

    if (newPwd.length < 8 || !/[a-zA-Z]/.test(newPwd) || !/[0-9]/.test(newPwd)) {
      errorEl.textContent = "Password baru harus minimal 8 karakter dan memuat kombinasi huruf serta angka.";
      errorEl.style.display = "flex";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner"></div> <span>Menyimpan...</span>';

    API.authChangePassword({
      old_password: oldPwd,
      new_password: newPwd
    })
    .then(function() {
      App.toast("success", "Password berhasil diubah!");
      var u = API.getCurrentUser();
      if (u) {
        u.must_change_password = false;
        var s = API.getSession();
        if (s) {
          s.user = u;
          API.setSession(s);
        }
      }
      setTimeout(function() {
        window.location.hash = "#/dashboard";
      }, 500);
    })
    .catch(function(err) {
      errorEl.textContent = err.message || "Gagal mengganti password.";
      errorEl.style.display = "flex";
    })
    .finally(function() {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Simpan Password</span>';
    });
  };
});
