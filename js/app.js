/**
 * =========================================================================
 * APLIKASI ADMINISTRASI GURU (SIAG) - CORE APP & ROUTER
 * File: app.js
 * Deskripsi: Manajemen status, hash router, navigasi dinamis per peran,
 *            toast, modal, unsaved changes guard, dan icon renderer
 * Rujukan: PRD.md, DESIGN_SYSTEM.md (Clean Corporate)
 * =========================================================================
 */

var App = (function() {
  var currentRoute = "";
  var hasUnsavedChanges = false;
  var routes = {};

  // =========================================================================
  // LUCIDE SVG INLINE ICON SPRITE HELPER
  // =========================================================================

  var ICONS = {
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    checkSquare: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    fileText: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>',
    bookOpen: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    barChart: '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>',
    logOut: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    unlock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/>',
    plus: '<line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    edit: '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
    alertCircle: '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
    checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    refreshCw: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    eye: '<path d="2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>',
    x: '<line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/>',
    moreHorizontal: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    externalLink: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/>'
  };

  function icon(name, size, className) {
    size = size || 20;
    className = className || "";
    var svgContent = ICONS[name] || ICONS.fileText;
    return '<svg class="' + className + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + svgContent + '</svg>';
  }

  // =========================================================================
  // NOTIFIKASI TOAST & BANNER
  // =========================================================================

  function toast(type, message, title) {
    var container = document.getElementById("toast-container");
    if (!container) return;

    var toastEl = document.createElement("div");
    toastEl.className = "toast toast-" + (type || "info");
    toastEl.setAttribute("role", type === "danger" ? "alert" : "status");

    var iconName = "alertCircle";
    if (type === "success") iconName = "checkCircle";
    if (type === "info") iconName = "alertCircle";
    if (type === "warning") iconName = "alertCircle";

    toastEl.innerHTML = icon(iconName, 20) + '<div style="flex:1;">' + (title ? '<strong>' + escapeHtml(title) + '</strong><br>' : '') + escapeHtml(message) + '</div>';

    container.appendChild(toastEl);

    // Auto dismiss dalam 4 detik, kecuali galat (danger)
    if (type !== "danger") {
      setTimeout(function() {
        if (toastEl.parentNode) {
          toastEl.parentNode.removeChild(toastEl);
        }
      }, 4000);
    } else {
      // Tombol tutup manual untuk galat
      var closeBtn = document.createElement("button");
      closeBtn.className = "btn-ghost";
      closeBtn.style.padding = "0 4px";
      closeBtn.style.minHeight = "auto";
      closeBtn.innerHTML = icon("x", 16);
      closeBtn.onclick = function() {
        if (toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
      };
      toastEl.appendChild(closeBtn);
    }
  }

  // =========================================================================
  // MODAL & BOTTOM SHEET MANAGER
  // =========================================================================

  function showModal(options) {
    closeModal();
    var overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "active-modal-overlay";

    var dialog = document.createElement("div");
    dialog.className = "modal-dialog";

    var headerHtml = '<div class="modal-header"><h3>' + escapeHtml(options.title || "") + '</h3><button class="btn-ghost" id="modal-close-x" aria-label="Tutup">' + icon("x", 20) + '</button></div>';
    var bodyHtml = '<div class="modal-body">' + (options.body || "") + '</div>';
    var footerHtml = options.footer ? '<div class="modal-footer">' + options.footer + '</div>' : '';

    dialog.innerHTML = headerHtml + bodyHtml + footerHtml;
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    document.getElementById("modal-close-x").onclick = closeModal;
    overlay.onclick = function(e) {
      if (e.target === overlay) closeModal();
    };

    // ESC to close
    var escHandler = function(e) {
      if (e.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);

    if (options.onReady) {
      options.onReady(dialog);
    }
  }

  function closeModal() {
    var overlay = document.getElementById("active-modal-overlay");
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }

  // =========================================================================
  // UNSAVED CHANGES GUARD
  // =========================================================================

  function setUnsavedChanges(status) {
    hasUnsavedChanges = !!status;
  }

  window.addEventListener("beforeunload", function(e) {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = "Ada perubahan data yang belum disimpan. Yakin ingin meninggalkan halaman?";
      return e.returnValue;
    }
  });

  // =========================================================================
  // SKELETON, EMPTY STATE & ERROR STATE HELPERS
  // =========================================================================

  function skeleton(type) {
    if (type === "card") {
      return '<div class="card"><div class="skeleton" style="height: 24px; width: 40%; margin-bottom: 12px;"></div><div class="skeleton" style="height: 16px; width: 80%;"></div></div>';
    }
    if (type === "table") {
      return '<div class="table-responsive"><table class="table"><thead><tr><th style="height: 48px;"><div class="skeleton" style="height: 16px; width: 60%;"></div></th></tr></thead><tbody><tr><td style="height: 48px;"><div class="skeleton" style="height: 16px; width: 90%;"></div></td></tr><tr><td style="height: 48px;"><div class="skeleton" style="height: 16px; width: 85%;"></div></td></tr><tr><td style="height: 48px;"><div class="skeleton" style="height: 16px; width: 70%;"></div></td></tr></tbody></table></div>';
    }
    return '<div class="skeleton" style="height: 80px; width: 100%;"></div>';
  }

  function emptyState(iconName, title, desc, actionBtnHtml) {
    return '<div class="empty-state">' +
      '<div class="state-icon">' + icon(iconName || "folder", 40) + '</div>' +
      '<h3 class="state-title">' + escapeHtml(title) + '</h3>' +
      '<p class="state-desc">' + escapeHtml(desc) + '</p>' +
      (actionBtnHtml || '') +
    '</div>';
  }

  function errorState(message, retryFnName) {
    var retryBtn = retryFnName ? '<button class="btn btn-secondary" onclick="' + retryFnName + '()">' + icon("refreshCw", 16) + ' Coba Lagi</button>' : '';
    return '<div class="error-state">' +
      '<div class="state-icon">' + icon("alertCircle", 40) + '</div>' +
      '<h3 class="state-title">Terjadi Kesalahan</h3>' +
      '<p class="state-desc">' + escapeHtml(message || "Tidak dapat memuat data") + '</p>' +
      retryBtn +
    '</div>';
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // =========================================================================
  // ROUTING & NAVIGASI DINAMIS
  // =========================================================================

  function registerRoute(path, renderFn) {
    routes[path] = renderFn;
  }

  function navigate(path) {
    if (hasUnsavedChanges) {
      if (!confirm("Ada perubahan data yang belum disimpan. Yakin ingin pindah halaman?")) {
        return;
      }
      setUnsavedChanges(false);
    }
    window.location.hash = path;
  }

  function handleRoute() {
    var hash = window.location.hash || "#/dashboard";
    var parts = hash.split("?");
    var route = parts[0];
    currentRoute = route;

    var user = API.getCurrentUser();

    // Jika belum login dan bukan di #/login, arahkan ke login
    if (!user && route !== "#/login") {
      window.location.hash = "#/login";
      return;
    }

    // Jika sudah login tapi buka #/login, arahkan ke dashboard
    if (user && route === "#/login") {
      window.location.hash = "#/dashboard";
      return;
    }

    // Jika user must_change_password dan bukan di #/ganti-password
    if (user && user.must_change_password && route !== "#/ganti-password") {
      window.location.hash = "#/ganti-password";
      return;
    }

    renderShell(user);

    var mainEl = document.getElementById("main-content");
    if (!mainEl) return;

    var handler = routes[route];
    if (handler) {
      handler(mainEl, parts[1] || "");
    } else {
      // Fallback
      if (routes["#/dashboard"]) {
        routes["#/dashboard"](mainEl, "");
      } else {
        mainEl.innerHTML = emptyState("alertCircle", "Halaman Tidak Ditemukan", "Rute URL " + route + " tidak terdaftar");
      }
    }
  }

  /**
   * Render navigasi per peran (PRD Bagian 7 & DESIGN_SYSTEM.md Bagian 4)
   */
  function renderShell(user) {
    var sidebarEl = document.getElementById("sidebar");
    var topbarEl = document.getElementById("topbar");
    var bottomNavEl = document.getElementById("bottom-nav");

    if (!user) {
      if (sidebarEl) sidebarEl.style.display = "none";
      if (topbarEl) topbarEl.style.display = "none";
      if (bottomNavEl) bottomNavEl.style.display = "none";
      var mainEl = document.getElementById("main-content");
      if (mainEl) {
        mainEl.style.marginLeft = "0";
        mainEl.style.padding = "var(--space-6)";
      }
      return;
    }

    if (sidebarEl) sidebarEl.style.display = "flex";
    if (topbarEl) topbarEl.style.display = "";
    if (bottomNavEl) bottomNavEl.style.display = "";
    var mainEl = document.getElementById("main-content");
    if (mainEl && window.innerWidth >= 1024) {
      mainEl.style.marginLeft = "var(--sidebar-width)";
    }

    // Bangun menu desktop & mobile sesuai peran
    var role = user.role;
    var navItems = [];
    var bottomNavItems = [];

    if (role === "guru") {
      navItems = [
        { path: "#/dashboard", label: "Dashboard", icon: "home" },
        { path: "#/presensi", label: "Presensi", icon: "checkSquare" },
        { path: "#/rekap-presensi", label: "Rekap Presensi", icon: "calendar" },
        { path: "#/penilaian", label: "Penilaian", icon: "award" },
        { path: "#/rekap-nilai", label: "Rekap Nilai", icon: "barChart" },
        { path: "#/jurnal", label: "Jurnal Mengajar", icon: "bookOpen" },
        { path: "#/perangkat-ajar", label: "Perangkat Ajar", icon: "folder" }
      ];
      // Hanya wali kelas yang melihat menu Rapor
      var session = API.getSession();
      if (session && session.is_homeroom) {
        navItems.push({ path: "#/rapor", label: "Rapor", icon: "fileText" });
      }

      bottomNavItems = [
        { path: "#/dashboard", label: "Beranda", icon: "home" },
        { path: "#/presensi", label: "Presensi", icon: "checkSquare" },
        { path: "#/penilaian", label: "Nilai", icon: "award" },
        { path: "#/jurnal", label: "Jurnal", icon: "bookOpen" },
        { path: "#/lainnya", label: "Lainnya", icon: "moreHorizontal", isMore: true }
      ];
    } else if (role === "admin") {
      navItems = [
        { path: "#/dashboard", label: "Dashboard", icon: "home" },
        { path: "#/siswa", label: "Data Siswa", icon: "users" },
        { path: "#/master-akademik", label: "Kelas & Mapel", icon: "calendar" },
        { path: "#/penugasan", label: "Penugasan Mengajar", icon: "bookOpen" },
        { path: "#/akun", label: "Manajemen Akun", icon: "user" },
        { path: "#/rekap-presensi", label: "Rekap Presensi", icon: "checkSquare" },
        { path: "#/rekap-nilai", label: "Rekap Nilai", icon: "barChart" },
        { path: "#/rapor", label: "Rapor", icon: "fileText" },
        { path: "#/pengaturan", label: "Pengaturan Sekolah", icon: "settings" },
        { path: "#/audit-log", label: "Log Audit", icon: "fileText" }
      ];

      bottomNavItems = [
        { path: "#/dashboard", label: "Beranda", icon: "home" },
        { path: "#/siswa", label: "Siswa", icon: "users" },
        { path: "#/akun", label: "Akun", icon: "user" },
        { path: "#/master-akademik", label: "Akademik", icon: "calendar" },
        { path: "#/lainnya", label: "Lainnya", icon: "moreHorizontal", isMore: true }
      ];
    } else if (role === "kepala_sekolah") {
      navItems = [
        { path: "#/dashboard", label: "Dashboard", icon: "home" },
        { path: "#/rekap-presensi", label: "Rekap Presensi", icon: "checkSquare" },
        { path: "#/rekap-nilai", label: "Rekap Nilai", icon: "barChart" },
        { path: "#/jurnal-pantauan", label: "Jurnal (Pantauan)", icon: "bookOpen" },
        { path: "#/telaah-perangkat", label: "Telaah Perangkat", icon: "folder" },
        { path: "#/rapor", label: "Rapor", icon: "fileText" }
      ];

      bottomNavItems = [
        { path: "#/dashboard", label: "Beranda", icon: "home" },
        { path: "#/telaah-perangkat", label: "Telaah", icon: "folder" },
        { path: "#/rekap-presensi", label: "Presensi", icon: "checkSquare" },
        { path: "#/jurnal-pantauan", label: "Jurnal", icon: "bookOpen" },
        { path: "#/lainnya", label: "Lainnya", icon: "moreHorizontal", isMore: true }
      ];
    }

    // Render Sidebar Items
    var navContainer = document.getElementById("sidebar-nav-container");
    if (navContainer) {
      var navHtml = "";
      for (var i = 0; i < navItems.length; i++) {
        var it = navItems[i];
        var isActive = currentRoute === it.path ? " active" : "";
        navHtml += '<div class="nav-item' + isActive + '" onclick="App.navigate(\'' + it.path + '\')">' +
          icon(it.icon, 20) +
          '<span>' + escapeHtml(it.label) + '</span>' +
        '</div>';
      }
      navContainer.innerHTML = navHtml;
    }

    // Render Bottom Nav Items (Mobile)
    if (bottomNavEl) {
      var bNavHtml = "";
      for (var b = 0; b < bottomNavItems.length; b++) {
        var bIt = bottomNavItems[b];
        var isBActive = currentRoute === bIt.path ? " active" : "";
        var clickAction = bIt.isMore ? 'App.showMobileMenu()' : 'App.navigate(\'' + bIt.path + '\')';
        bNavHtml += '<div class="bottom-nav-item' + isBActive + '" onclick="' + clickAction + '">' +
          icon(bIt.icon, 20) +
          '<span>' + escapeHtml(bIt.label) + '</span>' +
        '</div>';
      }
      bottomNavEl.innerHTML = bNavHtml;
    }

    // Update User Profile di Sidebar
    var nameEl = document.getElementById("sidebar-user-name");
    var roleEl = document.getElementById("sidebar-user-role");
    var avatarEl = document.getElementById("sidebar-user-avatar");
    if (nameEl) nameEl.textContent = user.full_name;
    if (roleEl) {
      var roleText = user.role === "guru" ? "Guru" : (user.role === "kepala_sekolah" ? "Kepala Sekolah" : "Admin");
      roleEl.textContent = roleText;
    }
    if (avatarEl && user.full_name) {
      avatarEl.textContent = user.full_name.charAt(0).toUpperCase();
    }
  }

  function showMobileMenu() {
    var user = API.getCurrentUser();
    if (!user) return;
    var role = user.role;
    var extraItems = [];

    if (role === "guru") {
      extraItems = [
        { path: "#/rekap-presensi", label: "Rekap Presensi", icon: "calendar" },
        { path: "#/rekap-nilai", label: "Rekap Nilai", icon: "barChart" },
        { path: "#/perangkat-ajar", label: "Perangkat Ajar", icon: "folder" }
      ];
      var s = API.getSession();
      if (s && s.is_homeroom) {
        extraItems.push({ path: "#/rapor", label: "Rapor", icon: "fileText" });
      }
    } else if (role === "admin") {
      extraItems = [
        { path: "#/penugasan", label: "Penugasan Mengajar", icon: "bookOpen" },
        { path: "#/rekap-presensi", label: "Rekap Presensi", icon: "checkSquare" },
        { path: "#/rekap-nilai", label: "Rekap Nilai", icon: "barChart" },
        { path: "#/rapor", label: "Rapor", icon: "fileText" },
        { path: "#/pengaturan", label: "Pengaturan Sekolah", icon: "settings" },
        { path: "#/audit-log", label: "Log Audit", icon: "fileText" }
      ];
    } else if (role === "kepala_sekolah") {
      extraItems = [
        { path: "#/rekap-nilai", label: "Rekap Nilai", icon: "barChart" },
        { path: "#/rapor", label: "Rapor", icon: "fileText" }
      ];
    }

    var menuHtml = '<div style="display:flex; flex-direction:column; gap:8px;">';
    for (var m = 0; m < extraItems.length; m++) {
      var item = extraItems[m];
      menuHtml += '<button class="btn btn-secondary btn-full" style="justify-content:flex-start;" onclick="App.closeModal(); App.navigate(\'' + item.path + '\')">' +
        icon(item.icon, 20) + ' ' + escapeHtml(item.label) +
      '</button>';
    }
    menuHtml += '<hr style="border:none; border-top:1px solid var(--color-border); margin:8px 0;">' +
      '<button class="btn btn-secondary btn-full" style="justify-content:flex-start;" onclick="App.closeModal(); App.navigate(\'#/ganti-password\')">' + icon("key", 20) + ' Ganti Password</button>' +
      '<button class="btn btn-danger btn-full" style="justify-content:flex-start;" onclick="App.closeModal(); App.logout()">' + icon("logOut", 20) + ' Keluar</button>' +
    '</div>';

    showModal({
      title: "Menu Lainnya",
      body: menuHtml
    });
  }

  function logout() {
    if (confirm("Yakin ingin keluar dari SIAG?")) {
      API.authLogout().finally(function() {
        window.location.hash = "#/login";
      });
    }
  }

  function init() {
    window.addEventListener("hashchange", handleRoute);
    handleRoute();

    // Pastikan status info wali kelas diperbarui jika user guru
    var user = API.getCurrentUser();
    if (user && user.role === "guru") {
      API.authMe().then(function(res) {
        var s = API.getSession();
        if (s) {
          s.is_homeroom = !!res.is_homeroom;
          s.homeroom_class = res.homeroom_class || null;
          API.setSession(s);
          renderShell(user);
        }
      }).catch(function() {});
    }
  }

  return {
    init: init,
    navigate: navigate,
    registerRoute: registerRoute,
    icon: icon,
    toast: toast,
    showModal: showModal,
    closeModal: closeModal,
    setUnsavedChanges: setUnsavedChanges,
    skeleton: skeleton,
    emptyState: emptyState,
    errorState: errorState,
    showMobileMenu: showMobileMenu,
    logout: logout,
    escapeHtml: escapeHtml
  };
})();
