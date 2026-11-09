/**
 * =========================================================================
 * S09: REKAP NILAI SISWA
 * File: s09_rekap_nilai.js
 * Deskripsi: Tabel nilai akhir siswa, rata-rata komponen, predikat, penanda KKM
 * =========================================================================
 */

App.registerRoute("#/rekap-nilai", function(container) {
  container.innerHTML = '<div class="page-header">' +
    '<div class="page-title-group">' +
      '<h1>Rekap Nilai Siswa</h1>' +
      '<p class="page-subtitle">Nilai akhir terbobot otomatis per komponen & ketuntasan KKM</p>' +
    '</div>' +
    '<div class="page-actions">' +
      '<button class="btn btn-secondary" onclick="window.print()">' + App.icon("printer", 16) + ' Cetak Rekap</button>' +
    '</div>' +
  '</div>' +
  '<div class="card" style="padding: var(--space-4); margin-bottom: var(--space-4);">' +
    '<div class="form-group" style="margin-bottom:0;">' +
      '<label class="form-label" for="rekap-sel-assign">Pilih Kelas & Mata Pelajaran</label>' +
      '<select id="rekap-sel-assign" class="form-select" onchange="loadGradesRecap()">' +
        '<option value="">Memuat penugasan...</option>' +
      '</select>' +
    '</div>' +
  '</div>' +
  '<div id="rekap-nilai-content">' +
    App.emptyState("barChart", "Pilih Penugasan", "Pilih penugasan mengajar di atas untuk menampilkan rekap nilai.") +
  '</div>';

  initRekapNilai();
});

function initRekapNilai() {
  API.assignmentsList({ page_size: 100 })
    .then(function(res) {
      var assignments = res.items || [];
      var sel = document.getElementById("rekap-sel-assign");
      if (!sel) return;

      if (assignments.length === 0) {
        sel.innerHTML = '<option value="">Tidak ada penugasan aktif</option>';
        return;
      }

      var html = '<option value="">-- Pilih Penugasan Mengajar --</option>';
      for (var i = 0; i < assignments.length; i++) {
        var a = assignments[i];
        html += '<option value="' + a.id + '">' +
          App.escapeHtml(a.class_name + ' · ' + a.subject_name + ' (KKM: ' + a.kkm + ')') +
        '</option>';
      }
      sel.innerHTML = html;
    });
}

function loadGradesRecap() {
  var assignId = document.getElementById("rekap-sel-assign").value;
  var contentEl = document.getElementById("rekap-nilai-content");
  if (!contentEl) return;

  if (!assignId) {
    contentEl.innerHTML = App.emptyState("barChart", "Pilih Penugasan", "Pilih penugasan mengajar di atas.");
    return;
  }

  contentEl.innerHTML = App.skeleton("table");

  API.gradesRecap({ assignment_id: assignId })
    .then(function(data) {
      var comps = data.components || [];
      var students = data.students || [];
      var kkm = data.kkm;

      var html = "";

      // Peringatan jika ada komponen belum terisi
      if (data.empty_components_warning && data.empty_components_warning.length > 0) {
        html += '<div class="banner banner-warning">' +
          App.icon("alertCircle", 20) +
          '<div>' +
            '<strong>Komponen belum memiliki nilai terisi: ' + App.escapeHtml(data.empty_components_warning.join(", ")) + '.</strong>' +
            '<p style="font-size:13px; margin-top:2px;">Bobot komponen kosong secara otomatis dibagi ke komponen yang sudah terisi.</p>' +
          '</div>' +
        '</div>';
      }

      if (students.length === 0) {
        html += App.emptyState("users", "Tidak Ada Siswa", "Kelas ini belum memiliki siswa aktif.");
        contentEl.innerHTML = html;
        return;
      }

      html += '<div class="table-responsive"><table class="table">' +
        '<thead><tr>' +
          '<th style="width: 40px;">No</th>' +
          '<th class="table-sticky-col">Nama Siswa</th>' +
          '<th>NIS</th>';

      for (var c = 0; c < comps.length; c++) {
        html += '<th style="text-align:right;">' + App.escapeHtml(comps[c].name) + ' (' + comps[c].weight + '%)</th>';
      }

      html += '<th style="text-align:right; font-weight:700;">Nilai Akhir</th>' +
        '<th style="text-align:center;">Predikat</th>' +
        '<th>Status KKM (' + kkm + ')</th>' +
      '</tr></thead><tbody>';

      for (var s = 0; s < students.length; s++) {
        var stu = students[s];
        var isBelow = stu.below_kkm;

        html += '<tr>' +
          '<td>' + (s + 1) + '</td>' +
          '<td class="table-sticky-col"><strong>' + App.escapeHtml(stu.full_name) + '</strong></td>' +
          '<td class="tabular-nums">' + App.escapeHtml(stu.nis) + '</td>';

        for (var cp = 0; cp < comps.length; cp++) {
          var avg = stu.component_averages[comps[cp].id];
          var avgDisplay = (avg !== null && avg !== undefined) ? (Math.round(avg * 10) / 10) : "-";
          html += '<td style="text-align:right;" class="tabular-nums">' + avgDisplay + '</td>';
        }

        var finalDisplay = (stu.final_score !== null && stu.final_score !== undefined) ? stu.final_score : "-";
        var predDisplay = stu.predicate || "-";

        html += '<td style="text-align:right; font-weight:700;" class="tabular-nums">' + finalDisplay + '</td>' +
          '<td style="text-align:center;"><span class="badge ' + (predDisplay === 'A' || predDisplay === 'B' ? 'badge-success' : (predDisplay === 'C' ? 'badge-info' : 'badge-warning')) + '">' + predDisplay + '</span></td>' +
          '<td>' +
            (stu.final_score !== null ? (isBelow ? '<span class="badge badge-danger">Di bawah KKM</span>' : '<span class="badge badge-success">Tuntas</span>') : '<span class="badge badge-neutral">Belum Ada Nilai</span>') +
          '</td>' +
        '</tr>';
      }

      html += '</tbody></table></div>';
      contentEl.innerHTML = html;
    })
    .catch(function(err) {
      contentEl.innerHTML = App.errorState(err.message, "loadGradesRecap");
    });
}
