/**
 * =========================================================================
 * S04: DASHBOARD ADMIN
 * File: s04_dashboard_admin.js
 * Deskripsi: Statistik akun, siswa, kelas, penugasan tanpa guru, status semester
 * =========================================================================
 */

function renderDashboardAdmin(container) {
  var user = API.getCurrentUser();

  container.innerHTML = '<div class="page-header">' +
    '<div class="page-title-group">' +
      '<h1>Dashboard Administrator</h1>' +
      '<p class="page-subtitle">Pusat kendali data master dan operasional sekolah</p>' +
    '</div>' +
    '<div class="page-actions">' +
      '<button class="btn btn-secondary" onclick="App.navigate(\'#/master-akademik\')">' + App.icon("calendar", 16) + ' Kelola Semester</button>' +
      '<button class="btn btn-primary" onclick="App.navigate(\'#/siswa\')">' + App.icon("plus", 16) + ' Tambah Siswa</button>' +
    '</div>' +
  '</div>' +
  '<div id="admin-dashboard-content">' +
    App.skeleton("card") +
  '</div>';

  loadAdminDashboard();
}

function loadAdminDashboard() {
  var contentEl = document.getElementById("admin-dashboard-content");
  if (!contentEl) return;

  API.dashboardGet()
    .then(function(data) {
      if (data.no_active_semester) {
        contentEl.innerHTML = App.emptyState(
          "calendar",
          "Belum Ada Semester Aktif",
          "Pilih atau buat tahun ajaran dan aktifkan semester untuk memulai operasional sekolah.",
          '<button class="btn btn-primary" onclick="App.navigate(\'#/master-akademik\')">' + App.icon("calendar", 16) + ' Aktifkan Semester</button>'
        );
        return;
      }

      var html = "";

      // Status Kunci Semester
      var sem = data.semester || {};
      if (sem.is_locked) {
        html += '<div class="banner banner-warning">' +
          App.icon("lock", 20) +
          '<div style="flex:1;">' +
            '<strong>Semester Aktif (' + App.escapeHtml(sem.academic_year + ' ' + sem.term) + ') saat ini TERKUNCI.</strong>' +
            '<p style="font-size: 13px; margin-top: 2px;">Guru tidak dapat mengubah presensi, penilaian, atau catatan rapor.</p>' +
          '</div>' +
          '<button class="btn btn-secondary" style="height:36px; padding:0 12px; font-size:13px;" onclick="App.navigate(\'#/master-akademik\')">' +
            App.icon("unlock", 16) + ' Buka Kunci' +
          '</button>' +
        '</div>';
      }

      // Grid Statistik
      html += '<div class="stat-grid">' +
        '<div class="stat-card">' +
          '<div class="stat-label">Pengguna Aktif</div>' +
          '<div class="stat-value">' + data.active_users + '</div>' +
          '<div class="stat-desc"><a href="#/akun">Kelola akun &rarr;</a></div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-label">Siswa Aktif</div>' +
          '<div class="stat-value">' + data.active_students + '</div>' +
          '<div class="stat-desc"><a href="#/siswa">Data siswa &rarr;</a></div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-label">Jumlah Kelas</div>' +
          '<div class="stat-value">' + data.classes + '</div>' +
          '<div class="stat-desc">Tahun ajaran ' + App.escapeHtml(sem.academic_year || '-') + '</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-label">Penugasan Belum Ber-Guru</div>' +
          '<div class="stat-value" style="color: ' + (data.assignments_without_active_teacher > 0 ? 'var(--color-warning)' : 'var(--color-text-heading)') + ';">' + data.assignments_without_active_teacher + '</div>' +
          '<div class="stat-desc"><a href="#/penugasan">Atur penugasan &rarr;</a></div>' +
        '</div>' +
      '</div>';

      // Tombol Tindakan Cepat (Quick Actions)
      html += '<div class="card">' +
        '<h3 style="margin-bottom: var(--space-4);">Tindakan Cepat</h3>' +
        '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-3);">' +
          '<button class="btn btn-secondary" style="justify-content: flex-start; height: 52px;" onclick="App.navigate(\'#/siswa\')">' +
            App.icon("users", 20) + ' <span>Kelola Data Siswa</span>' +
          '</button>' +
          '<button class="btn btn-secondary" style="justify-content: flex-start; height: 52px;" onclick="App.navigate(\'#/impor-csv\')">' +
            App.icon("upload", 20) + ' <span>Impor Siswa CSV</span>' +
          '</button>' +
          '<button class="btn btn-secondary" style="justify-content: flex-start; height: 52px;" onclick="App.navigate(\'#/akun\')">' +
            App.icon("user", 20) + ' <span>Manajemen Akun Guru</span>' +
          '</button>' +
          '<button class="btn btn-secondary" style="justify-content: flex-start; height: 52px;" onclick="App.navigate(\'#/penugasan\')">' +
            App.icon("bookOpen", 20) + ' <span>Penugasan Mengajar</span>' +
          '</button>' +
          '<button class="btn btn-secondary" style="justify-content: flex-start; height: 52px;" onclick="App.navigate(\'#/master-akademik\')">' +
            App.icon("calendar", 20) + ' <span>Kelas, Mapel, Semester</span>' +
          '</button>' +
          '<button class="btn btn-secondary" style="justify-content: flex-start; height: 52px;" onclick="App.navigate(\'#/pengaturan\')">' +
            App.icon("settings", 20) + ' <span>Pengaturan Sekolah</span>' +
          '</button>' +
        '</div>' +
      '</div>';

      contentEl.innerHTML = html;
    })
    .catch(function(err) {
      contentEl.innerHTML = App.errorState(err.message, "loadAdminDashboard");
    });
}
