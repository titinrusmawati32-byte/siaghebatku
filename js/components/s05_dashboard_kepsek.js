/**
 * =========================================================================
 * S05: DASHBOARD KEPALA SEKOLAH
 * File: s05_dashboard_kepsek.js
 * Deskripsi: Kehadiran sekolah, grafik batang per kelas (HTML/CSS),
 *            kelengkapan nilai & jurnal per guru, antrean telaah perangkat
 * =========================================================================
 */

function renderDashboardKepsek(container) {
  container.innerHTML = '<div class="page-header">' +
    '<div class="page-title-group">' +
      '<h1>Dashboard Kepala Sekolah</h1>' +
      '<p class="page-subtitle">Pemantauan menyeluruh mutu dan kelengkapan administrasi guru</p>' +
    '</div>' +
    '<div class="page-actions">' +
      '<button class="btn btn-secondary" onclick="App.navigate(\'#/telaah-perangkat\')">' + App.icon("folder", 16) + ' Telaah Perangkat</button>' +
      '<button class="btn btn-secondary" onclick="App.navigate(\'#/rekap-nilai\')">' + App.icon("barChart", 16) + ' Rekap Nilai</button>' +
    '</div>' +
  '</div>' +
  '<div id="kepsek-dashboard-content">' +
    App.skeleton("card") +
  '</div>';

  loadKepsekDashboard();
}

function loadKepsekDashboard() {
  var contentEl = document.getElementById("kepsek-dashboard-content");
  if (!contentEl) return;

  API.dashboardGet()
    .then(function(data) {
      if (data.no_active_semester) {
        contentEl.innerHTML = App.emptyState("calendar", "Belum Ada Semester Aktif", "Belum ada semester yang diaktifkan oleh administrator.");
        return;
      }

      var html = "";

      // 1. Grid 4 Kartu Statistik
      html += '<div class="stat-grid">' +
        '<div class="stat-card">' +
          '<div class="stat-label">Kehadiran Siswa Bulan Ini</div>' +
          '<div class="stat-value tabular-nums">' + (data.school_attendance_percent || 0) + '%</div>' +
          '<div class="stat-desc">Rata-rata seluruh kelas</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-label">Kelengkapan Nilai</div>' +
          '<div class="stat-value tabular-nums">' + (data.grade_completeness_percent || 0) + '%</div>' +
          '<div class="stat-desc">Nilai terisi semester ini</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-label">Jurnal Terisi</div>' +
          '<div class="stat-value tabular-nums">' + (data.journal_filled_percent || 0) + '%</div>' +
          '<div class="stat-desc">Dari seluruh sesi presensi</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-label">Menunggu Telaah Perangkat</div>' +
          '<div class="stat-value" style="color: ' + (data.pending_materials > 0 ? 'var(--color-warning)' : 'var(--color-text-heading)') + ';">' + (data.pending_materials || 0) + '</div>' +
          '<div class="stat-desc"><a href="#/telaah-perangkat">Buka antrean telaah &rarr;</a></div>' +
        '</div>' +
      '</div>';

      // 2. Baris 2: Grafik Batang Kehadiran per Kelas (HTML/CSS) + Panel Antrean Telaah
      var classList = data.attendance_by_class || [];

      html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--space-5); margin-bottom: var(--space-5);">' +
        '<div class="card" style="margin-bottom: 0;">' +
          '<h3>Tingkat Kehadiran per Kelas (Bulan Berjalan)</h3>' +
          '<p class="page-subtitle">Target kehadiran minimal 90%</p>' +
          '<div class="bar-chart-container">';

      if (classList.length === 0) {
        html += '<p style="color: var(--color-text-muted); font-size: 14px; margin-top: 12px;">Belum ada sesi presensi bulan ini.</p>';
      } else {
        for (var c = 0; c < classList.length; c++) {
          var clsItem = classList[c];
          var isUnder90 = clsItem.percent < 90;
          html += '<div class="bar-row">' +
            '<div class="bar-label">' + App.escapeHtml(clsItem.class_name) + '</div>' +
            '<div class="bar-track">' +
              '<div class="bar-fill' + (isUnder90 ? ' warning' : '') + '" style="width: ' + clsItem.percent + '%;"></div>' +
            '</div>' +
            '<div class="bar-value' + (isUnder90 ? ' style="color: var(--color-warning);"' : '') + '">' + clsItem.percent + '%</div>' +
          '</div>';
        }
      }

      html += '</div></div>' +
        '<div class="card" style="margin-bottom: 0; display:flex; flex-direction:column; justify-content:space-between;">' +
          '<div>' +
            '<h3>Antrean Perangkat Ajar</h3>' +
            '<p class="page-subtitle">Modul Ajar / RPP yang diajukan guru</p>' +
            '<div style="text-align: center; padding: 24px 0;">' +
              '<div style="font-size: 3rem; font-weight: 700; color: ' + (data.pending_materials > 0 ? 'var(--color-warning)' : 'var(--color-success)') + ';">' + (data.pending_materials || 0) + '</div>' +
              '<p style="color: var(--color-text-muted); font-size: 14px;">perangkat ajar butuh persetujuan Anda</p>' +
            '</div>' +
          '</div>' +
          '<button class="btn btn-primary btn-full" onclick="App.navigate(\'#/telaah-perangkat\')">' +
            App.icon("folder", 16) + ' Buka Antrean Telaah' +
          '</button>' +
        '</div>' +
      '</div>';

      // 3. Baris 3: Tabel Kelengkapan per Guru
      var teachers = data.teachers || [];
      html += '<div class="card">' +
        '<h3>Kelengkapan Administrasi per Guru</h3>' +
        '<p class="page-subtitle" style="margin-bottom: var(--space-4);">Kinerja pengisian nilai, jurnal mengajar, dan status modul ajar</p>' +
        '<div class="table-responsive"><table class="table">' +
          '<thead><tr>' +
            '<th>Nama Guru</th>' +
            '<th>Kelengkapan Nilai</th>' +
            '<th>Jurnal Mengajar Terisi</th>' +
            '<th>Perangkat Ajar Disetujui</th>' +
          '</tr></thead><tbody>';

      if (teachers.length === 0) {
        html += '<tr><td colspan="4" style="text-align:center; color:var(--color-text-muted);">Belum ada data guru terdaftar.</td></tr>';
      } else {
        for (var t = 0; t < teachers.length; t++) {
          var tch = teachers[t];
          html += '<tr>' +
            '<td><strong>' + App.escapeHtml(tch.full_name) + '</strong></td>' +
            '<td>' +
              '<div style="display:flex; align-items:center; gap:8px;">' +
                '<div class="progress-bar" style="width:80px;"><div class="progress-fill" style="width:' + tch.grades_filled_percent + '%;"></div></div>' +
                '<span class="tabular-nums">' + tch.grades_filled_percent + '%</span>' +
              '</div>' +
            '</td>' +
            '<td>' +
              '<div style="display:flex; align-items:center; gap:8px;">' +
                '<div class="progress-bar" style="width:80px;"><div class="progress-fill" style="width:' + tch.journals_filled_percent + '%;"></div></div>' +
                '<span class="tabular-nums">' + tch.journals_filled_percent + '%</span>' +
              '</div>' +
            '</td>' +
            '<td>' +
              '<span class="badge ' + (tch.materials_approved > 0 ? 'badge-success' : 'badge-neutral') + '">' +
                tch.materials_approved + ' / ' + tch.materials_total + ' disetujui' +
              '</span>' +
            '</td>' +
          '</tr>';
        }
      }

      html += '</tbody></table></div></div>';

      contentEl.innerHTML = html;
    })
    .catch(function(err) {
      contentEl.innerHTML = App.errorState(err.message, "loadKepsekDashboard");
    });
}
