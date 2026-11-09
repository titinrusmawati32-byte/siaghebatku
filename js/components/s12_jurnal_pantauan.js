/**
 * =========================================================================
 * S12: JURNAL (PANTAUAN) - KEPALA SEKOLAH & ADMIN
 * File: s12_jurnal_pantauan.js
 * Deskripsi: Tabel pemantauan seluruh jurnal mengajar guru (read-only),
 *            filter guru, filter rentang tanggal, tanpa tombol ubah/hapus
 * =========================================================================
 */

App.registerRoute("#/jurnal-pantauan", function(container) {
  container.innerHTML = '<div class="page-header">' +
    '<div class="page-title-group">' +
      '<h1>Pantauan Jurnal Mengajar</h1>' +
      '<p class="page-subtitle">Daftar rekaman kegiatan belajar mengajar harian guru</p>' +
    '</div>' +
  '</div>' +
  '<div class="card" style="padding: var(--space-4); margin-bottom: var(--space-4);">' +
    '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-3);">' +
      '<div class="form-group" style="margin-bottom:0;">' +
        '<label class="form-label" for="pantau-sel-teacher">Pilih Guru</label>' +
        '<select id="pantau-sel-teacher" class="form-select" onchange="loadPantauanJournals()">' +
          '<option value="">Semua Guru</option>' +
        '</select>' +
      '</div>' +
      '<div class="form-group" style="margin-bottom:0;">' +
        '<label class="form-label" for="pantau-date-from">Dari Tanggal</label>' +
        '<input type="date" id="pantau-date-from" class="form-input" onchange="loadPantauanJournals()">' +
      '</div>' +
      '<div class="form-group" style="margin-bottom:0;">' +
        '<label class="form-label" for="pantau-date-to">Sampai Tanggal</label>' +
        '<input type="date" id="pantau-date-to" class="form-input" onchange="loadPantauanJournals()">' +
      '</div>' +
    '</div>' +
  '</div>' +
  '<div id="pantauan-journals-container">' +
    App.skeleton("table") +
  '</div>';

  initPantauanJournals();
});

function initPantauanJournals() {
  API.teachersList({ page_size: 100 })
    .then(function(res) {
      var teachers = res.items || [];
      var sel = document.getElementById("pantau-sel-teacher");
      if (!sel) return;

      var html = '<option value="">Semua Guru</option>';
      for (var t = 0; t < teachers.length; t++) {
        html += '<option value="' + teachers[t].id + '">' + App.escapeHtml(teachers[t].full_name) + '</option>';
      }
      sel.innerHTML = html;

      loadPantauanJournals();
    })
    .catch(function() {
      loadPantauanJournals();
    });
}

function loadPantauanJournals() {
  var container = document.getElementById("pantauan-journals-container");
  if (!container) return;

  var teacherId = document.getElementById("pantau-sel-teacher").value;
  var dateFrom = document.getElementById("pantau-date-from").value;
  var dateTo = document.getElementById("pantau-date-to").value;

  container.innerHTML = App.skeleton("table");

  API.journalsList({
    teacher_id: teacherId,
    date_from: dateFrom,
    date_to: dateTo,
    page_size: 100
  })
  .then(function(res) {
    var journals = res.items || [];

    if (journals.length === 0) {
      container.innerHTML = App.emptyState("bookOpen", "Belum Ada Jurnal", "Tidak ada jurnal mengajar yang memenuhi kriteria filter ini.");
      return;
    }

    var html = '<div class="table-responsive"><table class="table">' +
      '<thead><tr>' +
        '<th style="width: 40px;">No</th>' +
        '<th>Tanggal</th>' +
        '<th>Jam</th>' +
        '<th>Nama Guru</th>' +
        '<th>Kelas & Mapel</th>' +
        '<th>Materi Pembelajaran</th>' +
        '<th>Kegiatan</th>' +
        '<th>Catatan / Kendala</th>' +
        '<th>Perangkat Ajar</th>' +
      '</tr></thead><tbody>';

    for (var i = 0; i < journals.length; i++) {
      var j = journals[i];
      var linkHtml = j.material_url
        ? '<a href="' + App.escapeHtml(j.material_url) + '" target="_blank" rel="noopener" class="btn-ghost" style="padding:0 4px; display:inline-flex; align-items:center; gap:4px;">' + App.icon("externalLink", 14) + ' Buka Drive</a>'
        : '-';

      html += '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td style="white-space:nowrap;"><strong>' + App.escapeHtml(j.session_date) + '</strong></td>' +
        '<td style="white-space:nowrap;">' + App.escapeHtml(j.lesson_hour) + '</td>' +
        '<td><strong>' + App.escapeHtml(j.teacher_name || "-") + '</strong></td>' +
        '<td>' + App.escapeHtml((j.class_name || "") + " · " + (j.subject_name || "")) + '</td>' +
        '<td><strong>' + App.escapeHtml(j.topic) + '</strong></td>' +
        '<td style="max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="' + App.escapeHtml(j.activities || '') + '">' + App.escapeHtml(j.activities || "-") + '</td>' +
        '<td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="' + App.escapeHtml(j.notes || '') + '">' + App.escapeHtml(j.notes || "-") + '</td>' +
        '<td>' + linkHtml + '</td>' +
      '</tr>';
    }

    html += '</tbody></table></div>';
    container.innerHTML = html;
  })
  .catch(function(err) {
    container.innerHTML = App.errorState(err.message, "loadPantauanJournals");
  });
}
