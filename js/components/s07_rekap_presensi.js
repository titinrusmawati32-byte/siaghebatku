/**
 * =========================================================================
 * S07: REKAP PRESENSI SCREEN
 * File: s07_rekap_presensi.js
 * Deskripsi: Rekap presensi bulanan/kelas, persentase kehadiran, status siswa
 * =========================================================================
 */

App.registerRoute("#/rekap-presensi", function(container) {
  var now = new Date();
  var currentMonth = now.toISOString().substring(0, 7); // 'YYYY-MM'

  container.innerHTML = '<div class="page-header">' +
    '<div class="page-title-group">' +
      '<h1>Rekap Presensi Siswa</h1>' +
      '<p class="page-subtitle">Statistik kehadiran siswa dalam rentang bulan atau kelas</p>' +
    '</div>' +
    '<div class="page-actions">' +
      '<button class="btn btn-secondary" onclick="window.print()">' + App.icon("printer", 16) + ' Cetak Rekap</button>' +
    '</div>' +
  '</div>' +
  '<div class="card" style="padding: var(--space-4);">' +
    '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-3);">' +
      '<div class="form-group" style="margin-bottom:0;">' +
        '<label class="form-label" for="rekap-sel-class">Pilih Kelas</label>' +
        '<select id="rekap-sel-class" class="form-select" onchange="loadAttendanceRecap()">' +
          '<option value="">Semua Kelas</option>' +
        '</select>' +
      '</div>' +
      '<div class="form-group" style="margin-bottom:0;">' +
        '<label class="form-label" for="rekap-inp-month">Bulan</label>' +
        '<input type="month" id="rekap-inp-month" class="form-input" value="' + currentMonth + '" onchange="loadAttendanceRecap()">' +
      '</div>' +
    '</div>' +
  '</div>' +
  '<div id="rekap-presensi-content">' +
    App.skeleton("table") +
  '</div>';

  initRekapPresensi();
});

function initRekapPresensi() {
  API.classesList({ page_size: 100 })
    .then(function(res) {
      var classes = res.items || [];
      var sel = document.getElementById("rekap-sel-class");
      if (!sel) return;

      var html = '<option value="">Semua Kelas</option>';
      for (var c = 0; c < classes.length; c++) {
        html += '<option value="' + classes[c].id + '">' + App.escapeHtml(classes[c].name) + '</option>';
      }
      sel.innerHTML = html;

      loadAttendanceRecap();
    })
    .catch(function() {
      loadAttendanceRecap();
    });
}

function loadAttendanceRecap() {
  var contentEl = document.getElementById("rekap-presensi-content");
  if (!contentEl) return;

  var classId = document.getElementById("rekap-sel-class").value;
  var month = document.getElementById("rekap-inp-month").value;

  contentEl.innerHTML = App.skeleton("table");

  API.attendanceRecap({ class_id: classId, month: month })
    .then(function(data) {
      var students = data.students || [];

      var html = '<div class="card" style="padding: var(--space-4); margin-bottom: var(--space-4); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">' +
        '<div>' +
          '<strong>Total Sesi Presensi: ' + data.total_sessions + ' sesi</strong>' +
        '</div>' +
        '<div style="font-weight: 600;">' +
          'Rata-rata Kehadiran: <span class="tabular-nums" style="color:var(--color-accent); font-size:1.125rem;">' + data.overall_attendance_percent + '%</span>' +
        '</div>' +
      '</div>';

      if (students.length === 0) {
        html += App.emptyState("calendar", "Belum Ada Data Presensi", "Belum ada sesi presensi yang tercatat untuk kriteria filter ini.");
        contentEl.innerHTML = html;
        return;
      }

      html += '<div class="table-responsive"><table class="table">' +
        '<thead><tr>' +
          '<th style="width: 40px;">No</th>' +
          '<th>NIS</th>' +
          '<th>Nama Siswa</th>' +
          '<th style="text-align:right;">Hadir</th>' +
          '<th style="text-align:right;">Sakit</th>' +
          '<th style="text-align:right;">Izin</th>' +
          '<th style="text-align:right;">Alfa</th>' +
          '<th style="text-align:right;">% Kehadiran</th>' +
          '<th>Status</th>' +
        '</tr></thead><tbody>';

      for (var i = 0; i < students.length; i++) {
        var s = students[i];
        var isUnder = s.attendance_percent < 90;
        var badgeClass = isUnder ? "badge-warning" : "badge-success";
        var badgeText = isUnder ? "Perlu Perhatian" : "Baik";

        html += '<tr>' +
          '<td>' + (i + 1) + '</td>' +
          '<td class="tabular-nums">' + App.escapeHtml(s.nis) + '</td>' +
          '<td><strong>' + App.escapeHtml(s.full_name) + '</strong></td>' +
          '<td style="text-align:right;" class="tabular-nums">' + s.present + '</td>' +
          '<td style="text-align:right;" class="tabular-nums" style="color:var(--color-info);">' + s.sick + '</td>' +
          '<td style="text-align:right;" class="tabular-nums" style="color:var(--color-warning);">' + s.permit + '</td>' +
          '<td style="text-align:right;" class="tabular-nums" style="color:var(--color-danger);">' + s.absent + '</td>' +
          '<td style="text-align:right; font-weight:600;" class="tabular-nums">' + s.attendance_percent + '%</td>' +
          '<td><span class="badge ' + badgeClass + '">' + badgeText + '</span></td>' +
        '</tr>';
      }

      html += '</tbody></table></div>';
      contentEl.innerHTML = html;
    })
    .catch(function(err) {
      contentEl.innerHTML = App.errorState(err.message, "loadAttendanceRecap");
    });
}
