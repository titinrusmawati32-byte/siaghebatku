/**
 * =========================================================================
 * S19: MANAJEMEN AKUN PENGGUNA (ADMIN)
 * File: s19_akun.js
 * Deskripsi: Kelola akun admin, kepala_sekolah, dan guru, pembuatan akun baru
 *            dengan password awal sekali tampil, reset password, status aktif
 * =========================================================================
 */

App.registerRoute("#/akun", function(container) {
  container.innerHTML = '<div class="page-header">' +
    '<div class="page-title-group">' +
      '<h1>Manajemen Akun Pengguna</h1>' +
      '<p class="page-subtitle">Kelola akses sistem untuk Administrator, Kepala Sekolah, dan Guru</p>' +
    '</div>' +
    '<div class="page-actions">' +
      '<button class="btn btn-primary" onclick="openNewUserModal()">' + App.icon("plus", 16) + ' Buat Akun Baru</button>' +
    '</div>' +
  '</div>' +
  '<div id="users-table-container">' +
    App.skeleton("table") +
  '</div>';

  loadUsersList();
});

var akunState = {
  users: []
};

function loadUsersList() {
  var container = document.getElementById("users-table-container");
  if (!container) return;

  container.innerHTML = App.skeleton("table");

  API.usersList({ page_size: 100 })
    .then(function(res) {
      akunState.users = res.items || [];

      if (akunState.users.length === 0) {
        container.innerHTML = App.emptyState("users", "Belum Ada Pengguna", "Mulai buat akun pengguna untuk guru dan pimpinan sekolah.");
        return;
      }

      var html = '<div class="table-responsive"><table class="table">' +
        '<thead><tr>' +
          '<th>Nama Lengkap</th>' +
          '<th>Email</th>' +
          '<th>Peran</th>' +
          '<th>Status Akun</th>' +
          '<th>Kondisi Password</th>' +
          '<th>Terakhir Masuk</th>' +
          '<th style="text-align:right;">Tindakan</th>' +
        '</tr></thead><tbody>';

      for (var u = 0; u < akunState.users.length; u++) {
        var it = akunState.users[u];
        var roleLabel = it.role === "guru" ? "Guru" : (it.role === "kepala_sekolah" ? "Kepala Sekolah" : "Admin");
        var roleBadge = it.role === "admin" ? "badge-danger" : (it.role === "kepala_sekolah" ? "badge-info" : "badge-neutral");

        var statusBadge = it.is_active ? '<span class="badge badge-success">Aktif</span>' : '<span class="badge badge-neutral">Nonaktif</span>';
        if (it.locked_until) {
          statusBadge = '<span class="badge badge-warning">Terkunci (15 m)</span>';
        }

        var pwdStatus = it.must_change_password
          ? '<span style="color:var(--color-warning-text); font-size:12px; font-weight:600;">Wajib Ganti</span>'
          : '<span style="color:var(--color-success-text); font-size:12px;">Normal</span>';

        html += '<tr>' +
          '<td><strong>' + App.escapeHtml(it.full_name) + '</strong>' + (it.nip ? '<br><small style="color:var(--color-text-muted);">NIP. ' + App.escapeHtml(it.nip) + '</small>' : '') + '</td>' +
          '<td>' + App.escapeHtml(it.email) + '</td>' +
          '<td><span class="badge ' + roleBadge + '">' + roleLabel + '</span></td>' +
          '<td>' + statusBadge + '</td>' +
          '<td>' + pwdStatus + '</td>' +
          '<td style="font-size:12px; color:var(--color-text-muted);">' + (it.last_login_at ? it.last_login_at.replace("T", " ").substring(0, 16) : 'Belum pernah') + '</td>' +
          '<td style="text-align:right; white-space:nowrap;">' +
            '<button class="btn btn-ghost" style="height:32px; padding:0 8px; font-size:13px;" onclick="openEditUserModal(\'' + it.id + '\')">' + App.icon("edit", 14) + ' Ubah</button>' +
            '<button class="btn btn-ghost" style="height:32px; padding:0 8px; font-size:13px; color:var(--color-warning-text);" onclick="resetUserPassword(\'' + it.id + '\', \'' + App.escapeHtml(it.full_name) + '\')">' + App.icon("key", 14) + ' Reset Pwd</button>' +
          '</td>' +
        '</tr>';
      }

      html += '</tbody></table></div>';
      container.innerHTML = html;
    })
    .catch(function(err) {
      container.innerHTML = App.errorState(err.message, loadUsersList);
    });
}

function openNewUserModal() {
  var modalBody = '<form id="form-new-usr">' +
    '<div class="form-group">' +
      '<label class="form-label" for="inp-usr-name">Nama Lengkap & Gelar</label>' +
      '<input type="text" id="inp-usr-name" class="form-input" placeholder="contoh: Siti Aminah, S.Pd." maxlength="100" required>' +
    '</div>' +
    '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">' +
      '<div class="form-group">' +
        '<label class="form-label" for="inp-usr-email">Email Login (Unik)</label>' +
        '<input type="email" id="inp-usr-email" class="form-input" placeholder="siti@sekolah.sch.id" required>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label" for="inp-usr-role">Peran (Role)</label>' +
        '<select id="inp-usr-role" class="form-select" onchange="toggleTeacherFields()">' +
          '<option value="guru">Guru</option>' +
          '<option value="kepala_sekolah">Kepala Sekolah</option>' +
          '<option value="admin">Administrator</option>' +
        '</select>' +
      '</div>' +
    '</div>' +
    '<div id="teacher-extra-fields" style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">' +
      '<div class="form-group">' +
        '<label class="form-label" for="inp-usr-nip">NIP (Opsional)</label>' +
        '<input type="text" id="inp-usr-nip" class="form-input" placeholder="contoh: 19850412...">' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label" for="inp-usr-phone">Nomor HP / WhatsApp (Opsional)</label>' +
        '<input type="text" id="inp-usr-phone" class="form-input" placeholder="contoh: 081234567890">' +
      '</div>' +
    '</div>' +
    '<div class="form-help">Password awal acak akan dihasilkan oleh sistem dan hanya ditampilkan satu kali setelah disimpan.</div>' +
  '</form>';

  App.showModal({
    title: "Buat Akun Pengguna Baru",
    body: modalBody,
    footer: '<button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>' +
            '<button type="button" class="btn btn-primary" onclick="submitNewUser()">Buat Akun</button>'
  });
}

function toggleTeacherFields() {
  var role = document.getElementById("inp-usr-role").value;
  var extra = document.getElementById("teacher-extra-fields");
  if (extra) {
    extra.style.display = (role === "guru") ? "grid" : "none";
  }
}

function submitNewUser() {
  var name = (document.getElementById("inp-usr-name").value || "").trim();
  var email = (document.getElementById("inp-usr-email").value || "").trim();
  var role = document.getElementById("inp-usr-role").value;
  var nip = document.getElementById("inp-usr-nip") ? (document.getElementById("inp-usr-nip").value || "").trim() : "";
  var phone = document.getElementById("inp-usr-phone") ? (document.getElementById("inp-usr-phone").value || "").trim() : "";

  if (!name || !email || !role) {
    App.toast("warning", "Nama, Email, dan Peran wajib diisi");
    return;
  }

  API.usersCreate({
    full_name: name,
    email: email,
    role: role,
    nip: nip,
    phone: phone
  })
  .then(function(res) {
    App.closeModal();
    loadUsersList();

    // Tampilkan modal password awal yang hanya tampil satu kali
    var initPwd = res.user.initial_password;
    var successBody = '<div style="text-align:center; padding:16px 0;">' +
      App.icon("checkCircle", 48, "text-success") +
      '<h3 style="margin-top:12px; margin-bottom:8px;">Akun Berhasil Dibuat!</h3>' +
      '<p style="color:var(--color-text-muted); font-size:14px; margin-bottom:16px;">Salin dan berikan kredensial login berikut kepada pemilik akun. Password ini <strong>hanya ditampilkan satu kali</strong> dan pengguna wajib menggantinya saat login pertama.</p>' +
      '<div style="background:var(--color-surface-alt); border:1px solid var(--color-border); padding:16px; border-radius:var(--radius-md); text-align:left; font-family:monospace; font-size:14px;">' +
        '<div><strong>Email:</strong> ' + App.escapeHtml(res.user.email) + '</div>' +
        '<div style="margin-top:8px;"><strong>Password Awal:</strong> <span style="color:var(--color-accent); font-weight:700; font-size:16px;">' + App.escapeHtml(initPwd) + '</span></div>' +
      '</div>' +
    '</div>';

    App.showModal({
      title: "Kredensial Akun Baru",
      body: successBody,
      footer: '<button type="button" class="btn btn-primary" onclick="App.closeModal()">Tutup & Selesai</button>'
    });
  })
  .catch(function(err) {
    App.toast("danger", err.message || "Gagal membuat akun.");
  });
}

function openEditUserModal(userId) {
  var user = akunState.users.find(function(u) { return u.id === userId; });
  if (!user) return;

  var modalBody = '<form id="form-edit-usr">' +
    '<div class="form-group">' +
      '<label class="form-label" for="edit-usr-name">Nama Lengkap</label>' +
      '<input type="text" id="edit-usr-name" class="form-input" value="' + App.escapeHtml(user.full_name) + '" required>' +
    '</div>' +
    '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">' +
      '<div class="form-group">' +
        '<label class="form-label" for="edit-usr-email">Email</label>' +
        '<input type="email" id="edit-usr-email" class="form-input" value="' + App.escapeHtml(user.email) + '" required>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label" for="edit-usr-role">Peran (Role)</label>' +
        '<select id="edit-usr-role" class="form-select">' +
          '<option value="guru"' + (user.role === "guru" ? " selected" : "") + '>Guru</option>' +
          '<option value="kepala_sekolah"' + (user.role === "kepala_sekolah" ? " selected" : "") + '>Kepala Sekolah</option>' +
          '<option value="admin"' + (user.role === "admin" ? " selected" : "") + '>Administrator</option>' +
        '</select>' +
      '</div>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label" for="edit-usr-active">Status Akun</label>' +
      '<select id="edit-usr-active" class="form-select">' +
        '<option value="true"' + (user.is_active ? " selected" : "") + '>Aktif</option>' +
        '<option value="false"' + (!user.is_active ? " selected" : "") + '>Nonaktif</option>' +
      '</select>' +
      '<div class="form-help">Menonaktifkan akun akan langsung mencabut seluruh sesi login akun tersebut.</div>' +
    '</div>' +
  '</form>';

  App.showModal({
    title: "Ubah Pengguna",
    body: modalBody,
    footer: '<button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>' +
            '<button type="button" class="btn btn-primary" onclick="submitEditUser(\'' + user.id + '\')">Simpan Perubahan</button>'
  });
}

function submitEditUser(userId) {
  var name = (document.getElementById("edit-usr-name").value || "").trim();
  var email = (document.getElementById("edit-usr-email").value || "").trim();
  var role = document.getElementById("edit-usr-role").value;
  var isActive = document.getElementById("edit-usr-active").value === "true";

  API.usersUpdate({
    id: userId,
    full_name: name,
    email: email,
    role: role,
    is_active: isActive
  })
  .then(function() {
    App.closeModal();
    App.toast("success", "Akun berhasil diperbarui!");
    loadUsersList();
  })
  .catch(function(err) {
    App.toast("danger", err.message || "Gagal mengubah akun.");
  });
}

function resetUserPassword(userId, name) {
  if (confirm("Reset password akun '" + name + "'? Sistem akan menghasilkan password sementara baru dan akun diwajibkan ganti password saat login berikutnya.")) {
    API.usersResetPassword({ id: userId })
      .then(function(res) {
        var tempPwd = res.temporary_password;
        var resetBody = '<div style="text-align:center; padding:16px 0;">' +
          App.icon("key", 48, "text-warning") +
          '<h3 style="margin-top:12px; margin-bottom:8px;">Password Berhasil Direset</h3>' +
          '<p style="color:var(--color-text-muted); font-size:14px; margin-bottom:16px;">Berikan password sementara di bawah kepada pengguna. Sesi aktif pengguna telah dicabut otomatis.</p>' +
          '<div style="background:var(--color-surface-alt); border:1px solid var(--color-border); padding:16px; border-radius:var(--radius-md); text-align:center; font-family:monospace;">' +
            '<div style="color:var(--color-accent); font-weight:700; font-size:18px;">' + App.escapeHtml(tempPwd) + '</div>' +
          '</div>' +
        '</div>';

        App.showModal({
          title: "Password Sementara",
          body: resetBody,
          footer: '<button type="button" class="btn btn-primary" onclick="App.closeModal()">Tutup</button>'
        });

        loadUsersList();
      })
      .catch(function(err) {
        App.toast("danger", err.message || "Gagal mereset password.");
      });
  }
}
