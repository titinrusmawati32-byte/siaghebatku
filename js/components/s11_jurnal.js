/**
 * =========================================================================
 * S11: JURNAL MENGAJAR (GURU)
 * File: s11_jurnal.js
 * Deskripsi: Form jurnal mengajar, riwayat jurnal sesi, prefill dari presensi,
 *            validasi topic wajib, material_url https://, batas edit 7 hari
 * =========================================================================
 */

App.registerRoute("#/jurnal", function(container, queryString) {
  var params = new URLSearchParams(queryString || "");
  var attSessionId = params.get("create_from") || "";
  var assignId = params.get("assignment_id") || "";
  var sDate = params.get("session_date") || "";
  var lHour = params.get("lesson_hour") || "";

  container.innerHTML = '<div class="page-header">' +
    '<div class="page-title-group">' +
      '<h1>Jurnal Mengajar</h1>' +
      '<p class="page-subtitle">Dokumentasi materi, kegiatan pembelajaran, dan catatan kendala kelas</p>' +
    '</div>' +
    '<div class="page-actions">' +
      '<button class="btn btn-primary" onclick="openNewJournalModal()">' + App.icon("plus", 16) + ' Tulis Jurnal Baru</button>' +
    '</div>' +
  '</div>' +
  '<div class="card" style="padding: var(--space-4); margin-bottom: var(--space-4);">' +
    '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-3);">' +
      '<div class="form-group" style="margin-bottom:0;">' +
        '<label class="form-label" for="jurnal-filter-date-from">Dari Tanggal</label>' +
        '<input type="date" id="jurnal-filter-date-from" class="form-input" onchange="loadTeacherJournals()">' +
      '</div>' +
      '<div class="form-group" style="margin-bottom:0;">' +
        '<label class="form-label" for="jurnal-filter-date-to">Sampai Tanggal</label>' +
        '<input type="date" id="jurnal-filter-date-to" class="form-input" onchange="loadTeacherJournals()">' +
      '</div>' +
    '</div>' +
  '</div>' +
  '<div id="teacher-journals-container">' +
    App.skeleton("table") +
  '</div>';

  initTeacherJournals(attSessionId, assignId, sDate, lHour);
});

var jurnalState = {
  assignments: [],
  journals: []
};

function initTeacherJournals(attId, assignId, sDate, lHour) {
  API.assignmentsList({ page_size: 100 })
    .then(function(res) {
      jurnalState.assignments = res.items || [];
      loadTeacherJournals();

      // Jika diarahkan langsung dari presensi untuk membuat jurnal
      if (attId || assignId) {
        setTimeout(function() {
          openNewJournalModal({
            attendance_session_id: attId,
            assignment_id: assignId,
            session_date: sDate,
            lesson_hour: lHour
          });
        }, 300);
      }
    })
    .catch(function(err) {
      loadTeacherJournals();
    });
}

function loadTeacherJournals() {
  var container = document.getElementById("teacher-journals-container");
  if (!container) return;

  var dateFrom = document.getElementById("jurnal-filter-date-from").value;
  var dateTo = document.getElementById("jurnal-filter-date-to").value;

  container.innerHTML = App.skeleton("table");

  API.journalsList({ date_from: dateFrom, date_to: dateTo, page_size: 100 })
    .then(function(res) {
      jurnalState.journals = res.items || [];

      if (jurnalState.journals.length === 0) {
        container.innerHTML = App.emptyState(
          "bookOpen",
          "Belum Ada Jurnal Mengajar",
          "Mulai tulis jurnal pembelajaran setelah menyelesaikan sesi presensi kelas.",
          '<button class="btn btn-primary" onclick="openNewJournalModal()">' + App.icon("plus", 16) + ' Tulis Jurnal Sekarang</button>'
        );
        return;
      }

      var html = '<div class="table-responsive"><table class="table">' +
        '<thead><tr>' +
          '<th>Tanggal</th>' +
          '<th>Jam</th>' +
          '<th>Kelas & Mapel</th>' +
          '<th>Materi / Topik</th>' +
          '<th>Kegiatan</th>' +
          '<th>Perangkat Ajar</th>' +
          '<th style="text-align:right;">Tindakan</th>' +
        '</tr></thead><tbody>';

      for (var j = 0; j < jurnalState.journals.length; j++) {
        var item = jurnalState.journals[j];
        var linkHtml = item.material_url
          ? '<a href="' + App.escapeHtml(item.material_url) + '" target="_blank" rel="noopener" class="btn-ghost" style="padding:0 4px; display:inline-flex; align-items:center; gap:4px;">' + App.icon("externalLink", 14) + ' Tautan Drive</a>'
          : '-';

        html += '<tr>' +
          '<td><strong>' + App.escapeHtml(item.session_date) + '</strong></td>' +
          '<td>' + App.escapeHtml(item.lesson_hour) + '</td>' +
          '<td>' + App.escapeHtml((item.class_name || "") + " · " + (item.subject_name || "")) + '</td>' +
          '<td><strong>' + App.escapeHtml(item.topic) + '</strong></td>' +
          '<td style="max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + App.escapeHtml(item.activities || "-") + '</td>' +
          '<td>' + linkHtml + '</td>' +
          '<td style="text-align:right;">' +
            '<button class="btn btn-ghost" style="height:32px; padding:0 8px;" onclick="openEditJournalModal(\'' + item.id + '\')">' +
              App.icon("edit", 16) + ' Ubah' +
            '</button>' +
          '</td>' +
        '</tr>';
      }

      html += '</tbody></table></div>';
      container.innerHTML = html;
    })
    .catch(function(err) {
      container.innerHTML = App.errorState(err.message, "loadTeacherJournals");
    });
}

function openNewJournalModal(prefill) {
  prefill = prefill || {};
  var assignOptions = '<option value="">-- Pilih Penugasan --</option>';
  for (var a = 0; a < jurnalState.assignments.length; a++) {
    var tas = jurnalState.assignments[a];
    var isSel = tas.id === prefill.assignment_id ? " selected" : "";
    assignOptions += '<option value="' + tas.id + '"' + isSel + '>' +
      App.escapeHtml(tas.class_name + ' · ' + tas.subject_name) +
    '</option>';
  }

  var today = new Date().toISOString().split("T")[0];
  var sessionDate = prefill.session_date || today;
  var lessonHour = prefill.lesson_hour || "1-2";

  var modalBody = '<form id="form-jurnal">' +
    '<div class="form-group">' +
      '<label class="form-label" for="inp-jrn-assign">Kelas & Mata Pelajaran</label>' +
      '<select id="inp-jrn-assign" class="form-select" required>' + assignOptions + '</select>' +
    '</div>' +
    '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">' +
      '<div class="form-group">' +
        '<label class="form-label" for="inp-jrn-date">Tanggal Sesi</label>' +
        '<input type="date" id="inp-jrn-date" class="form-input" value="' + sessionDate + '" max="' + today + '" required>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label" for="inp-jrn-hour">Jam Pelajaran</label>' +
        '<input type="text" id="inp-jrn-hour" class="form-input" value="' + App.escapeHtml(lessonHour) + '" placeholder="contoh: 1-2" required>' +
      '</div>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label" for="inp-jrn-topic">Materi / Topik Pembelajaran (Wajib)</label>' +
      '<input type="text" id="inp-jrn-topic" class="form-input" placeholder="contoh: Persamaan Linear Satu Variabel" maxlength="200" required>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label" for="inp-jrn-activities">Kegiatan Pembelajaran (Opsional)</label>' +
      '<textarea id="inp-jrn-activities" class="form-textarea" placeholder="Ringkasan aktivitas guru dan siswa di kelas..." maxlength="2000"></textarea>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label" for="inp-jrn-notes">Catatan / Kendala Kelas (Opsional)</label>' +
      '<textarea id="inp-jrn-notes" class="form-textarea" style="min-height:72px;" placeholder="Kendala teknis atau catatan khusus siswa..." maxlength="1000"></textarea>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label" for="inp-jrn-url">Tautan Perangkat Ajar Google Drive (Opsional)</label>' +
      '<input type="url" id="inp-jrn-url" class="form-input" placeholder="https://drive.google.com/file/d/...">' +
    '</div>' +
    '<input type="hidden" id="inp-jrn-att-id" value="' + (prefill.attendance_session_id || '') + '">' +
  '</form>';

  App.showModal({
    title: "Tulis Jurnal Mengajar",
    body: modalBody,
    footer: '<button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>' +
            '<button type="button" class="btn btn-primary" onclick="submitNewJournal()">Simpan Jurnal</button>'
  });
}

function submitNewJournal() {
  var assignId = document.getElementById("inp-jrn-assign").value;
  var sDate = document.getElementById("inp-jrn-date").value;
  var lHour = (document.getElementById("inp-jrn-hour").value || "").trim();
  var topic = (document.getElementById("inp-jrn-topic").value || "").trim();
  var activities = (document.getElementById("inp-jrn-activities").value || "").trim();
  var notes = (document.getElementById("inp-jrn-notes").value || "").trim();
  var matUrl = (document.getElementById("inp-jrn-url").value || "").trim();
  var attId = document.getElementById("inp-jrn-att-id").value;

  if (!assignId || !sDate || !lHour || !topic) {
    App.toast("warning", "Kelas, tanggal, jam pelajaran, dan materi wajib diisi");
    return;
  }

  if (matUrl && !/^https:\/\//i.test(matUrl)) {
    App.toast("warning", "Tautan perangkat ajar harus diawali https://");
    return;
  }

  API.journalsCreate({
    assignment_id: assignId,
    session_date: sDate,
    lesson_hour: lHour,
    topic: topic,
    activities: activities,
    notes: notes,
    material_url: matUrl,
    attendance_session_id: attId || null
  })
  .then(function() {
    App.closeModal();
    App.toast("success", "Jurnal mengajar berhasil disimpan!");
    loadTeacherJournals();
  })
  .catch(function(err) {
    App.toast("danger", err.message || "Gagal menyimpan jurnal.");
  });
}

function openEditJournalModal(journalId) {
  var item = jurnalState.journals.find(function(j) { return j.id === journalId; });
  if (!item) return;

  var modalBody = '<form id="form-edit-jurnal">' +
    '<div class="form-group">' +
      '<label class="form-label">Sesi</label>' +
      '<input type="text" class="form-input" value="' + App.escapeHtml(item.session_date + ' (Jam ' + item.lesson_hour + ') - ' + (item.class_name || '') + ' ' + (item.subject_name || '')) + '" disabled>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label" for="edit-jrn-topic">Materi / Topik Pembelajaran</label>' +
      '<input type="text" id="edit-jrn-topic" class="form-input" value="' + App.escapeHtml(item.topic) + '" maxlength="200" required>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label" for="edit-jrn-activities">Kegiatan Pembelajaran</label>' +
      '<textarea id="edit-jrn-activities" class="form-textarea" maxlength="2000">' + App.escapeHtml(item.activities || '') + '</textarea>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label" for="edit-jrn-notes">Catatan / Kendala Kelas</label>' +
      '<textarea id="edit-jrn-notes" class="form-textarea" style="min-height:72px;" maxlength="1000">' + App.escapeHtml(item.notes || '') + '</textarea>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label" for="edit-jrn-url">Tautan Perangkat Ajar Google Drive</label>' +
      '<input type="url" id="edit-jrn-url" class="form-input" value="' + App.escapeHtml(item.material_url || '') + '">' +
    '</div>' +
  '</form>';

  App.showModal({
    title: "Ubah Jurnal Mengajar",
    body: modalBody,
    footer: '<button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>' +
            '<button type="button" class="btn btn-primary" onclick="submitEditJournal(\'' + item.id + '\')">Simpan Perubahan</button>'
  });
}

function submitEditJournal(journalId) {
  var topic = (document.getElementById("edit-jrn-topic").value || "").trim();
  var activities = (document.getElementById("edit-jrn-activities").value || "").trim();
  var notes = (document.getElementById("edit-jrn-notes").value || "").trim();
  var matUrl = (document.getElementById("edit-jrn-url").value || "").trim();

  if (!topic) {
    App.toast("warning", "Materi wajib diisi");
    return;
  }

  if (matUrl && !/^https:\/\//i.test(matUrl)) {
    App.toast("warning", "Tautan perangkat ajar harus diawali https://");
    return;
  }

  API.journalsUpdate({
    id: journalId,
    topic: topic,
    activities: activities,
    notes: notes,
    material_url: matUrl
  })
  .then(function() {
    App.closeModal();
    App.toast("success", "Jurnal mengajar berhasil diperbarui!");
    loadTeacherJournals();
  })
  .catch(function(err) {
    App.toast("danger", err.message || "Gagal mengubah jurnal.");
  });
}
