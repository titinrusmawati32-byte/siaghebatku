/**
 * =========================================================================
 * S03: DASHBOARD GURU
 * File: s03_dashboard_guru.js
 * Deskripsi: Sesi hari ini, jurnal belum terisi, kelengkapan nilai, perangkat ajar
 * =========================================================================
 */

App.registerRoute("#/dashboard", function(container) {
  var user = API.getCurrentUser();
  if (!user) return;

  // Router internal dashboard berdasarkan peran
  if (user.role === "admin") {
    renderDashboardAdmin(container);
    return;
  }
  if (user.role === "kepala_sekolah") {
    renderDashboardKepsek(container);
    return;
  }

  // Role Guru
  container.innerHTML = '<div class="page-header">' +
    '<div class="page-title-group">' +
      '<h1>Dashboard Guru</h1>' +
      '<p class="page-subtitle">Selamat datang, ' + App.escapeHtml(user.full_name) + '</p>' +
    '</div>' +
  '</div>' +
  '<div id="guru-dashboard-content">' +
    App.skeleton("card") +
  '</div>';

  loadGuruDashboard();
});

function loadGuruDashboard() {
  var contentEl = document.getElementById("guru-dashboard-content");
  if (!contentEl) return;

  API.dashboardGet()
    .then(function(data) {
      if (data.no_active_semester) {
        contentEl.innerHTML = App.emptyState("calendar", "Belum Ada Semester Aktif", "Silakan hubungi administrator sekolah untuk mengaktifkan semester berjalan.");
        return;
      }

      var html = "";

      // 1. Kartu Peringatan Sesi Hari Ini
      var sessions = data.today_sessions || [];
      var unrecorded = sessions.filter(function(s) { return !s.has_attendance; });

      if (unrecorded.length > 0) {
        html += '<div class="banner banner-warning" style="margin-bottom: var(--space-5);">' +
          App.icon("alertCircle", 24) +
          '<div style="flex:1;">' +
            '<strong>' + unrecorded.length + ' sesi mengajar hari ini belum dicatat presensinya.</strong>' +
            '<div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px;">';
        for (var u = 0; u < unrecorded.length; u++) {
          var item = unrecorded[u];
          var label = (item.class_name || "") + " · " + (item.subject_name || "") + (item.lesson_hour ? " (Jam " + item.lesson_hour + ")" : "");
          html += '<button class="btn btn-primary" style="height: 36px; padding: 0 12px; font-size: 13px;" onclick="App.navigate(\'#/presensi?assignment_id=' + item.assignment_id + '\')">' +
            App.icon("checkSquare", 16) + ' Catat ' + App.escapeHtml(label) +
          '</button>';
        }
        html += '</div></div></div>';
      }

      // 2. Grid Statistik Ringkas
      html += '<div class="stat-grid">' +
        '<div class="stat-card">' +
          '<div class="stat-label">Sesi Belum Dipresensi</div>' +
          '<div class="stat-value" style="color: ' + (data.unattended_count > 0 ? 'var(--color-warning)' : 'var(--color-text-heading)') + ';">' + data.unattended_count + '</div>' +
          '<div class="stat-desc">Sesi jadwal hari ini</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-label">Jurnal Belum Diisi</div>' +
          '<div class="stat-value" style="color: ' + (data.pending_journals > 0 ? 'var(--color-danger)' : 'var(--color-text-heading)') + ';">' + data.pending_journals + '</div>' +
          '<div class="stat-desc">' + (data.overdue_journals > 0 ? '<span class="badge badge-danger">' + data.overdue_journals + ' melewati 7 hari</span>' : 'Sesi presensi aktif') + '</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-label">Penilaian Belum Lengkap</div>' +
          '<div class="stat-value">' + (data.incomplete_assessments ? data.incomplete_assessments.length : 0) + '</div>' +
          '<div class="stat-desc">Penugasan kelas berjalan</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-label">Perangkat Ajar Disetujui</div>' +
          '<div class="stat-value" style="color: var(--color-success);">' + (data.materials ? data.materials.disetujui : 0) + '</div>' +
          '<div class="stat-desc">' + (data.materials ? data.materials.diajukan : 0) + ' menunggu telaah</div>' +
        '</div>' +
      '</div>';

      // 3. Daftar Sesi Hari Ini
      html += '<div class="card">' +
        '<div class="page-header" style="margin-bottom: var(--space-4);">' +
          '<h3>Jadwal Sesi Hari Ini</h3>' +
          '<button class="btn btn-secondary" onclick="App.navigate(\'#/presensi\')">' + App.icon("checkSquare", 16) + ' Buka Menu Presensi</button>' +
        '</div>';

      if (sessions.length === 0) {
        html += '<p style="color: var(--color-text-muted); font-size: var(--font-size-small);">Tidak ada jadwal sesi mengajar hari ini.</p>';
      } else {
        html += '<div class="table-responsive"><table class="table">' +
          '<thead><tr><th>Kelas</th><th>Mata Pelajaran</th><th>Jam</th><th>Status Presensi</th><th>Tindakan</th></tr></thead><tbody>';
        for (var s = 0; s < sessions.length; s++) {
          var ses = sessions[s];
          html += '<tr>' +
            '<td><strong>' + App.escapeHtml(ses.class_name) + '</strong></td>' +
            '<td>' + App.escapeHtml(ses.subject_name) + '</td>' +
            '<td>' + (ses.lesson_hour ? App.escapeHtml(ses.lesson_hour) : '-') + '</td>' +
            '<td>' + (ses.has_attendance ? '<span class="badge badge-success">Sudah Dicatat</span>' : '<span class="badge badge-warning">Belum Dicatat</span>') + '</td>' +
            '<td>' +
              '<button class="btn btn-ghost" style="height:32px; padding:0 8px; font-size:13px;" onclick="App.navigate(\'#/presensi?assignment_id=' + ses.assignment_id + '\')">' +
                App.icon("checkSquare", 16) + ' Presensi' +
              '</button>' +
            '</td>' +
          '</tr>';
        }
        html += '</tbody></table></div>';
      }
      html += '</div>';

      // 4. Perangkat Ajar & Kelengkapan Nilai
      if (data.incomplete_assessments && data.incomplete_assessments.length > 0) {
        html += '<div class="card">' +
          '<h3 style="margin-bottom: var(--space-4);">Kelengkapan Penilaian Belum Tuntas</h3>' +
          '<div style="display: flex; flex-direction: column; gap: var(--space-3);">';
        for (var ia = 0; ia < data.incomplete_assessments.length; ia++) {
          var incomp = data.incomplete_assessments[ia];
          html += '<div>' +
            '<div style="display: flex; justify-content: space-between; font-size: var(--font-size-small); margin-bottom: 4px;">' +
              '<span><strong>' + App.escapeHtml(incomp.label) + '</strong></span>' +
              '<span class="tabular-nums">' + incomp.filled_percent + '% terisi</span>' +
            '</div>' +
            '<div class="progress-bar"><div class="progress-fill" style="width: ' + incomp.filled_percent + '%;"></div></div>' +
          '</div>';
        }
        html += '</div></div>';
      }

      contentEl.innerHTML = html;
    })
    .catch(function(err) {
      contentEl.innerHTML = App.errorState(err.message, "loadGuruDashboard");
    });
}
