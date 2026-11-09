/**
 * =========================================================================
 * S01: LOGIN SCREEN
 * File: s01_login.js
 * Deskripsi: Form login email + password, show/hide password, publicInfo,
 *            loading state, pesan galat inline, proteksi submit ganda
 * =========================================================================
 */

App.registerRoute("#/login", function(container) {
  container.innerHTML = '<div style="max-width: 400px; margin: 40px auto;">' +
    '<div class="card" style="padding: var(--space-6);">' +
      '<div style="text-align: center; margin-bottom: var(--space-5);">' +
        '<div style="width: 48px; height: 48px; background: var(--color-accent-tint); color: var(--color-accent); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-weight: 700; font-size: 1.25rem;">SIAG</div>' +
        '<h1 style="font-size: 1.5rem; margin-bottom: 4px;" id="login-school-name">SIAG</h1>' +
        '<p style="color: var(--color-text-muted); font-size: var(--font-size-small);">Sistem Informasi Administrasi Guru</p>' +
      '</div>' +
      '<div id="login-error-banner" style="display: none;" class="banner banner-danger"></div>' +
      '<form id="form-login">' +
        '<div class="form-group">' +
          '<label class="form-label" for="login-email">Email</label>' +
          '<input type="email" id="login-email" class="form-input" placeholder="nama@sekolah.sch.id" required autocomplete="email">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="login-password">Password</label>' +
          '<div style="position: relative;">' +
            '<input type="password" id="login-password" class="form-input" style="width: 100%; padding-right: 44px;" placeholder="••••••••" required autocomplete="current-password">' +
            '<button type="button" id="btn-toggle-pwd" class="btn-ghost" style="position: absolute; right: 0; top: 0; height: 44px; width: 44px; padding: 0;" aria-label="Tampilkan Password">' +
              App.icon("eye", 18) +
            '</button>' +
          '</div>' +
        '</div>' +
        '<button type="submit" id="btn-login-submit" class="btn btn-primary btn-full" style="margin-top: var(--space-4);">' +
          '<span>Masuk</span>' +
        '</button>' +
      '</form>' +
    '</div>' +
    '<div style="text-align: center; font-size: var(--font-size-caption); color: var(--color-text-muted);">' +
      '<p>Hubungi Administrator bila lupa password atau akun terkunci.</p>' +
    '</div>' +
  '</div>';

  // Muat info publik sekolah
  API.publicInfo().then(function(info) {
    var schoolEl = document.getElementById("login-school-name");
    if (schoolEl && info && info.school_name) {
      schoolEl.textContent = info.school_name;
    }
  }).catch(function() {});

  // Toggle tampil/sembunyi password
  var pwdInput = document.getElementById("login-password");
  var toggleBtn = document.getElementById("btn-toggle-pwd");
  var isPwdVisible = false;

  toggleBtn.onclick = function() {
    isPwdVisible = !isPwdVisible;
    pwdInput.type = isPwdVisible ? "text" : "password";
    toggleBtn.innerHTML = App.icon(isPwdVisible ? "eyeOff" : "eye", 18);
  };

  // Submit Handler
  var form = document.getElementById("form-login");
  var submitBtn = document.getElementById("btn-login-submit");
  var errorBanner = document.getElementById("login-error-banner");

  form.onsubmit = function(e) {
    e.preventDefault();
    errorBanner.style.display = "none";

    var email = document.getElementById("login-email").value.trim();
    var password = pwdInput.value;

    if (!email || !password) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner"></div> <span>Memverifikasi...</span>';

    API.authLogin({ email: email, password: password })
      .then(function(res) {
        if (res.user && res.user.must_change_password) {
          window.location.hash = "#/ganti-password";
        } else {
          window.location.hash = "#/dashboard";
        }
      })
      .catch(function(err) {
        errorBanner.textContent = err.message || "Email atau password salah";
        errorBanner.style.display = "flex";
        pwdInput.value = "";
        pwdInput.focus();
      })
      .finally(function() {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Masuk</span>';
      });
  };
});
