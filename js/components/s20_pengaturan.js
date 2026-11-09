/**
 * =========================================================================
 * S20: PENGATURAN SEKOLAH & LOG AUDIT (ADMIN)
 * File: s20_pengaturan.js
 * Deskripsi: Setelan identitas sekolah, ambang batas predikat nilai, KKM standar,
 *            serta pemantauan Log Audit aktivitas sensitif sistem
 * =========================================================================
 */

App.registerRoute("#/pengaturan", function(container) {
  container.innerHTML = '<div class="page-header">' +
    '<div class="page-title-group">' +
      '<h1>Pengaturan Sekolah</h1>' +
      '<p class="page-subtitle">Konfigurasi profil institusi, ambang predikat rapor, dan toleransi edit</p>' +
    '</div>' +
    '<div class="page-actions">' +
      '<button class="btn btn-secondary" onclick="App.navigate(\'#/audit-log\')">' + App.icon("fileText", 16) + ' Buka Log Audit</button>' +
      '<button id="btn-save-settings" class="btn btn-primary" onclick="saveSchoolSettings()">' + App.icon("checkSquare", 16) + ' Simpan Pengaturan</button>' +
    '</div>' +
  '</div>' +
  '<div id="settings-form-container">' +
    App.skeleton("card") +
  '</div>';

  loadSchoolSettings();
});

function loadSchoolSettings() {
  var container = document.getElementById("settings-form-container");
  if (!container) return;

  container.innerHTML = App.skeleton("card");

  API.settingsGet()
    .then(function(s) {
      var thresholds = s.grade_thresholds || { A: 90, B: 80, C: 70 };

      var html = '<div class="card">' +
        '<h3 style="margin-bottom: var(--space-4);">Profil Sekolah & Pejabat Penandatangan</h3>' +
        '<div class="form-group">' +
          '<label class="form-label" for="set-school-name">Nama Resmi Sekolah</label>' +
          '<input type="text" id="set-school-name" class="form-input" value="' + App.escapeHtml(s.school_name || '') + '" maxlength="100" required>' +
        '</div>' +
        '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">' +
          '<div class="form-group">' +
            '<label class="form-label" for="set-headmaster-name">Nama Lengkap Kepala Sekolah</label>' +
            '<input type="text" id="set-headmaster-name" class="form-input" value="' + App.escapeHtml(s.headmaster_name || '') + '" placeholder="contoh: Drs. H. Ahmad Dahlan, M.Pd.">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="set-headmaster-nip">NIP Kepala Sekolah</label>' +
            '<input type="text" id="set-headmaster-nip" class="form-input" value="' + App.escapeHtml(s.headmaster_nip || '') + '" placeholder="contoh: 19700101...">' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<h3 style="margin-bottom: var(--space-4);">Ambang Batas Predikat Rapor</h3>' +
        '<p class="page-subtitle" style="margin-bottom: var(--space-4);">Nilai akhir akan otomatis dikonversikan ke predikat huruf berdasarkan batas minimal ini:</p>' +
        '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--space-3);">' +
          '<div class="form-group">' +
            '<label class="form-label" for="set-pred-a">Minimal Predikat A</label>' +
            '<input type="number" id="set-pred-a" class="form-input" min="0" max="100" value="' + (thresholds.A || 90) + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="set-pred-b">Minimal Predikat B</label>' +
            '<input type="number" id="set-pred-b" class="form-input" min="0" max="100" value="' + (thresholds.B || 80) + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="set-pred-c">Minimal Predikat C</label>' +
            '<input type="number" id="set-pred-c" class="form-input" min="0" max="100" value="' + (thresholds.C || 70) + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">Predikat D</label>' +
            '<input type="text" class="form-input" value="Di bawah batas C" disabled>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<h3 style="margin-bottom: var(--space-4);">Parameter Operasional</h3>' +
        '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">' +
          '<div class="form-group">' +
            '<label class="form-label" for="set-default-kkm">KKM Standar Sekolah</label>' +
            '<input type="number" id="set-default-kkm" class="form-input" min="0" max="100" value="' + (s.default_kkm || 75) + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="set-edit-window">Toleransi Edit Guru (Hari)</label>' +
            '<input type="number" id="set-edit-window" class="form-input" min="1" max="30" value="' + (s.edit_window_days || 7) + '">' +
            '<div class="form-help">Batas waktu hari bagi guru untuk mengubah presensi & jurnal mandiri.</div>' +
          '</div>' +
        '</div>' +
      '</div>';

      container.innerHTML = html;
    })
    .catch(function(err) {
      container.innerHTML = App.errorState(err.message, loadSchoolSettings);
    });
}

function saveSchoolSettings() {
  var schoolName = (document.getElementById("set-school-name").value || "").trim();
  var headName = (document.getElementById("set-headmaster-name").value || "").trim();
  var headNip = (document.getElementById("set-headmaster-nip").value || "").trim();

  var predA = Number(document.getElementById("set-pred-a").value) || 90;
  var predB = Number(document.getElementById("set-pred-b").value) || 80;
  var predC = Number(document.getElementById("set-pred-c").value) || 70;

  var kkm = Number(document.getElementById("set-default-kkm").value) || 75;
  var editWindow = Number(document.getElementById("set-edit-window").value) || 7;

  if (!schoolName) {
    App.toast("warning", "Nama sekolah wajib diisi");
    return;
  }

  var btn = document.getElementById("btn-save-settings");
  if (btn) btn.disabled = true;

  API.settingsUpdate({
    school_name: schoolName,
    headmaster_name: headName,
    headmaster_nip: headNip,
    grade_thresholds: { A: predA, B: predB, C: predC },
    default_kkm: kkm,
    edit_window_days: editWindow
  })
  .then(function() {
    App.toast("success", "Pengaturan sekolah berhasil disimpan!");
  })
  .catch(function(err) {
    App.toast("danger", err.message || "Gagal menyimpan pengaturan.");
  })
  .finally(function() {
    if (btn) btn.disabled = false;
  });
}

// =========================================================================
// ROUTE: LOG AUDIT (ADMIN)
// =========================================================================

App.registerRoute("#/audit-log", function(container) {
  container.innerHTML = '<div class="page-header">' +
    '<div class="page-title-group">' +
      '<h1>Log Audit Aktivitas Sistem</h1>' +
      '<p class="page-subtitle">Rekam jejak tindakan sensitif (login, reset password, kunci semester, koreksi)</p>' +
    '</div>' +
    '<div class="page-actions">' +
      '<button class="btn btn-secondary" onclick="App.navigate(\'#/pengaturan\')">' + App.icon("settings", 16) + ' Pengaturan</button>' +
    '</div>' +
  '</div>' +
  '<div class="card" style="padding: var(--space-4); margin-bottom: var(--space-4);">' +
    '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-3);">' +
      '<div class="form-group" style="margin-bottom:0;">' +
        '<label class="form-label" for="audit-filter-action">Filter Aksi</label>' +
        '<select id="audit-filter-action" class="form-select" onchange="loadAuditLogs()">' +
          '<option value="">Semua Aksi</option>' +
          '<option value="authLogin">authLogin</option>' +
          '<option value="authLoginLocked">authLoginLocked</option>' +
          '<option value="usersCreate">usersCreate</option>' +
          '<option value="usersUpdate">usersUpdate</option>' +
          '<option value="usersResetPassword">usersResetPassword</option>' +
          '<option value="semestersLock">semestersLock</option>' +
          '<option value="semestersUnlock">semestersUnlock</option>' +
          '<option value="attendanceCreate">attendanceCreate (Koreksi)</option>' +
          '<option value="attendanceUpdate">attendanceUpdate (Koreksi)</option>' +
          '<option value="materialsReview">materialsReview</option>' +
        '</select>' +
      '</div>' +
      '<div class="form-group" style="margin-bottom:0;">' +
        '<label class="form-label" for="audit-filter-date">Dari Tanggal</label>' +
        '<input type="date" id="audit-filter-date" class="form-input" onchange="loadAuditLogs()">' +
      '</div>' +
    '</div>' +
  '</div>' +
  '<div id="audit-table-container">' +
    App.skeleton("table") +
  '</div>';

  loadAuditLogs();
});

function loadAuditLogs() {
  var container = document.getElementById("audit-table-container");
  if (!container) return;

  var action = document.getElementById("audit-filter-action") ? document.getElementById("audit-filter-action").value : "";
  var dateFrom = document.getElementById("audit-filter-date") ? document.getElementById("audit-filter-date").value : "";

  container.innerHTML = App.skeleton("table");

  API.auditList({ action: action, date_from: dateFrom, page_size: 100 })
    .then(function(res) {
      var items = res.items || [];

      if (items.length === 0) {
        container.innerHTML = App.emptyState("fileText", "Belum Ada Catatan Audit", "Tidak ada peristiwa sensitif yang tercatat untuk filter ini.");
        return;
      }

      var html = '<div class="table-responsive"><table class="table">' +
        '<thead><tr>' +
          '<th>Waktu Kejadian</th>' +
          '<th>Aktor (Pengguna)</th>' +
          '<th>Aksi</th>' +
          '<th>Entitas Terdampak</th>' +
          '<th>Rincian Catatan</th>' +
        '</tr></thead><tbody>';

      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var detailStr = it.detail ? (typeof it.detail === "object" ? JSON.stringify(it.detail) : it.detail) : "-";

        html += '<tr>' +
          '<td style="white-space:nowrap; font-size:12px;" class="tabular-nums">' + (it.created_at ? it.created_at.replace("T", " ").substring(0, 19) : "-") + '</td>' +
          '<td><strong>' + App.escapeHtml(it.actor_name || it.actor_user_id || "Sistem") + '</strong></td>' +
          '<td><code>' + App.escapeHtml(it.action) + '</code></td>' +
          '<td>' + (it.entity ? it.entity + ' (' + (it.entity_id || '') + ')' : '-') + '</td>' +
          '<td style="font-size:12px; font-family:monospace; max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="' + App.escapeHtml(detailStr) + '">' +
            App.escapeHtml(detailStr) +
          '</td>' +
        '</tr>';
      }

      html += '</tbody></table></div>';
      container.innerHTML = html;
    })
    .catch(function(err) {
      container.innerHTML = App.errorState(err.message, loadAuditLogs);
    });
}
