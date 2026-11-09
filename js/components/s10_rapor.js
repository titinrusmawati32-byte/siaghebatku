/**
 * =========================================================================
 * S10: RAPOR SISWA & CETAK A4
 * File: s10_rapor.js
 * Deskripsi: Pratinjau rapor lembar A4, evaluasi nilai akhir seluruh mapel,
 *            rekap presensi semester, catatan wali kelas (maks 500 karakter),
 *            pencetakan browser window.print()
 * =========================================================================
 */

App.registerRoute("#/rapor", function(container) {
  var user = API.getCurrentUser();
  var session = API.getSession();

  container.innerHTML = '<div class="page-header">' +
    '<div class="page-title-group">' +
      '<h1>Rapor Siswa</h1>' +
      '<p class="page-subtitle">Penyusunan catatan wali kelas dan cetak lembar rapor A4</p>' +
    '</div>' +
    '<div class="page-actions">' +
      '<div id="rapor-class-select-container" style="display:inline-block;"></div>' +
      '<button class="btn btn-primary" onclick="window.print()">' + App.icon("printer", 16) + ' Cetak Rapor (A4)</button>' +
    '</div>' +
  '</div>' +
  '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-5);">' +
    // Kolom Kiri: Daftar Siswa Kelas
    '<div class="card" style="padding: var(--space-4); max-height: 850px; overflow-y: auto;">' +
      '<h3 style="margin-bottom: var(--space-3);">Daftar Siswa</h3>' +
      '<input type="text" id="rapor-search-input" class="form-input" style="height:38px; margin-bottom:12px; font-size:14px;" placeholder="Cari nama siswa..." oninput="filterRaporStudents()">' +
      '<div id="rapor-student-list">' + App.skeleton("card") + '</div>' +
    '</div>' +
    // Kolom Kanan: Pratinjau Lembar Rapor A4
    '<div id="rapor-preview-container">' +
      App.emptyState("fileText", "Pilih Siswa", "Pilih salah satu siswa dari daftar di sebelah kiri untuk melihat pratinjau lembar rapor.") +
    '</div>' +
  '</div>';

  initRaporScreen();
});

var raporState = {
  selectedClassId: "",
  selectedStudentId: "",
  students: [],
  currentRaporData: null
};

function initRaporScreen() {
  var user = API.getCurrentUser();
  var session = API.getSession();

  // Jika guru, otomatis gunakan homeroom_class
  if (user.role === "guru" && session && session.homeroom_class) {
    raporState.selectedClassId = session.homeroom_class.id;
    loadRaporStudentList();
  } else {
    // Admin / Kepala sekolah: tampilkan pemilih kelas
    API.classesList({ page_size: 100 }).then(function(res) {
      var classes = res.items || [];
      var selContainer = document.getElementById("rapor-class-select-container");
      if (!selContainer) return;

      var html = '<select id="rapor-class-picker" class="form-select" style="height:44px;" onchange="onRaporClassChange()">' +
        '<option value="">-- Pilih Kelas --</option>';
      for (var c = 0; c < classes.length; c++) {
        html += '<option value="' + classes[c].id + '">' + App.escapeHtml(classes[c].name) + '</option>';
      }
      html += '</select>';
      selContainer.innerHTML = html;

      if (classes.length > 0) {
        raporState.selectedClassId = classes[0].id;
        document.getElementById("rapor-class-picker").value = classes[0].id;
        loadRaporStudentList();
      }
    });
  }
}

function onRaporClassChange() {
  raporState.selectedClassId = document.getElementById("rapor-class-picker").value;
  raporState.selectedStudentId = "";
  document.getElementById("rapor-preview-container").innerHTML = App.emptyState("fileText", "Pilih Siswa", "Pilih salah satu siswa dari daftar untuk melihat rapor.");
  loadRaporStudentList();
}

function loadRaporStudentList() {
  var listEl = document.getElementById("rapor-student-list");
  if (!listEl) return;
  listEl.innerHTML = App.skeleton("card");

  API.reportsList({ class_id: raporState.selectedClassId })
    .then(function(res) {
      raporState.students = res.students || [];

      if (raporState.students.length === 0) {
        listEl.innerHTML = '<p style="color:var(--color-text-muted); font-size:14px;">Belum ada siswa di kelas ini.</p>';
        return;
      }

      var html = '<div style="display:flex; flex-direction:column; gap:8px;">';
      for (var i = 0; i < raporState.students.length; i++) {
        var s = raporState.students[i];
        html += '<div class="card card-clickable student-rapor-item" id="rapor-item-' + s.student_id + '" style="margin-bottom:0; padding:12px; cursor:pointer;" onclick="selectRaporStudent(\'' + s.student_id + '\')" data-name="' + App.escapeHtml(s.full_name.toLowerCase()) + '">' +
          '<div style="font-weight:600; font-size:14px; color:var(--color-text-heading);">' + App.escapeHtml(s.full_name) + '</div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; font-size:12px; color:var(--color-text-muted);">' +
            '<span>NIS: ' + App.escapeHtml(s.nis) + '</span>' +
            (s.has_homeroom_note ? '<span class="badge badge-success">Catatan Ada</span>' : '<span class="badge badge-neutral">Tanpa Catatan</span>') +
          '</div>' +
        '</div>';
      }
      html += '</div>';

      listEl.innerHTML = html;

      // Otomatis pilih siswa pertama
      if (raporState.students.length > 0 && !raporState.selectedStudentId) {
        selectRaporStudent(raporState.students[0].student_id);
      }
    })
    .catch(function(err) {
      listEl.innerHTML = App.errorState(err.message, "loadRaporStudentList");
    });
}

function selectRaporStudent(studentId) {
  raporState.selectedStudentId = studentId;

  // Highlight item terpilih
  document.querySelectorAll(".student-rapor-item").forEach(function(el) {
    el.style.borderLeft = "none";
    el.style.backgroundColor = "var(--color-surface)";
  });
  var activeItem = document.getElementById("rapor-item-" + studentId);
  if (activeItem) {
    activeItem.style.borderLeft = "4px solid var(--color-accent)";
    activeItem.style.backgroundColor = "var(--color-accent-tint)";
  }

  var previewEl = document.getElementById("rapor-preview-container");
  if (!previewEl) return;
  previewEl.innerHTML = App.skeleton("card");

  API.reportsGet({ student_id: studentId })
    .then(function(data) {
      raporState.currentRaporData = data;
      renderRaporPreview(data);
    })
    .catch(function(err) {
      previewEl.innerHTML = App.errorState(err.message, function() { selectRaporStudent(studentId); });
    });
}

function renderRaporPreview(data) {
  var previewEl = document.getElementById("rapor-preview-container");
  if (!previewEl) return;

  var st = data.student || {};
  var grades = data.grades || [];
  var att = data.attendance || {};

  var html = "";

  // Banner Peringatan jika ada Mapel tanpa Nilai
  if (data.missing_grades_warning && data.missing_grades_warning.length > 0) {
    html += '<div class="banner banner-warning">' +
      App.icon("alertCircle", 20) +
      '<div style="flex:1;">' +
        '<strong>Terdapat mata pelajaran yang belum memiliki nilai:</strong><br>';
    for (var m = 0; m < data.missing_grades_warning.length; m++) {
      html += '• ' + App.escapeHtml(data.missing_grades_warning[m].subject_name) + ' (Guru: ' + App.escapeHtml(data.missing_grades_warning[m].teacher_name) + ')<br>';
    }
    html += '</div></div>';
  }

  // LEMBAR RAPOR A4
  html += '<div class="rapor-paper">' +
    // Kop Rapor
    '<div class="rapor-kop">' +
      '<h2>' + App.escapeHtml(data.school_name || "SEKOLAH INDONESIA") + '</h2>' +
      '<p>LAPORAN CAPAIAN HASIL BELAJAR PESERTA DIDIK</p>' +
    '</div>' +

    // Identitas Siswa
    '<div class="rapor-student-info">' +
      '<div>' +
        '<div><strong>Nama Peserta Didik:</strong> ' + App.escapeHtml(st.full_name) + '</div>' +
        '<div><strong>NIS / NISN:</strong> ' + App.escapeHtml(st.nis) + ' / ' + App.escapeHtml(st.nisn || "-") + '</div>' +
        '<div><strong>Kelas:</strong> ' + App.escapeHtml(st.class_name) + '</div>' +
      '</div>' +
      '<div>' +
        '<div><strong>Tahun Ajaran:</strong> ' + App.escapeHtml(st.academic_year) + '</div>' +
        '<div><strong>Semester:</strong> ' + App.escapeHtml(st.term ? st.term.toUpperCase() : "-") + '</div>' +
      '</div>' +
    '</div>' +

    // Tabel Nilai Mata Pelajaran
    '<h4 style="margin-bottom:8px;">A. Capaian Akademik</h4>' +
    '<table class="table" style="margin-bottom: 24px; border: 1px solid var(--color-border);">' +
      '<thead><tr>' +
        '<th style="width: 40px;">No</th>' +
        '<th>Mata Pelajaran</th>' +
        '<th style="width: 60px; text-align:center;">KKM</th>' +
        '<th style="width: 90px; text-align:right;">Nilai Akhir</th>' +
        '<th style="width: 80px; text-align:center;">Predikat</th>' +
      '</tr></thead><tbody>';

  if (grades.length === 0) {
    html += '<tr><td colspan="5" style="text-align:center; color:var(--color-text-muted);">Belum ada data mata pelajaran.</td></tr>';
  } else {
    for (var g = 0; g < grades.length; g++) {
      var gr = grades[g];
      html += '<tr>' +
        '<td>' + (g + 1) + '</td>' +
        '<td><strong>' + App.escapeHtml(gr.subject_name) + '</strong></td>' +
        '<td style="text-align:center;" class="tabular-nums">' + gr.kkm + '</td>' +
        '<td style="text-align:right; font-weight:600;" class="tabular-nums">' + (gr.final_score !== null ? gr.final_score : '<span style="color:var(--color-warning);">Belum Ada</span>') + '</td>' +
        '<td style="text-align:center;">' + (gr.predicate || "-") + '</td>' +
      '</tr>';
    }
  }

  html += '</tbody></table>' +

    // Tabel Rekap Presensi (Satuan Sesi)
    '<h4 style="margin-bottom:8px;">B. Rekap Kehadiran (Semester Berjalan)</h4>' +
    '<table class="table" style="width: 320px; margin-bottom: 24px; border: 1px solid var(--color-border);">' +
      '<tbody>' +
        '<tr><td>Sakit (S)</td><td style="text-align:right; font-weight:600;" class="tabular-nums">' + (att.sick_sessions || 0) + ' sesi</td></tr>' +
        '<tr><td>Izin (I)</td><td style="text-align:right; font-weight:600;" class="tabular-nums">' + (att.permit_sessions || 0) + ' sesi</td></tr>' +
        '<tr><td>Tanpa Keterangan (A)</td><td style="text-align:right; font-weight:600;" class="tabular-nums">' + (att.absent_sessions || 0) + ' sesi</td></tr>' +
      '</tbody>' +
    '</table>' +

    // Catatan Wali Kelas
    '<h4 style="margin-bottom:8px;">C. Catatan Wali Kelas</h4>' +
    '<div style="border: 1px solid var(--color-border); padding: 12px; border-radius: var(--radius-sm); min-height: 72px; font-size: 14px; font-style: italic; background-color: var(--color-surface-alt); margin-bottom: 32px;">' +
      (data.homeroom_note ? App.escapeHtml(data.homeroom_note) : 'Belum ada catatan wali kelas.') +
    '</div>' +

    // Bagian Tanda Tangan
    '<div class="rapor-signature-section">' +
      '<div class="rapor-signature-box">' +
        '<div>Mengetahui,</div>' +
        '<div>Kepala Sekolah</div>' +
        '<div class="signature-line">' + App.escapeHtml(data.headmaster_name || "(...................................)") + '</div>' +
        '<div style="font-size:12px; margin-top:4px;">NIP. ' + App.escapeHtml(data.headmaster_nip || "-") + '</div>' +
      '</div>' +
      '<div class="rapor-signature-box">' +
        '<div>Wali Kelas</div>' +
        '<div style="margin-bottom:4px;">' + App.escapeHtml(st.class_name) + '</div>' +
        '<div class="signature-line">' + App.escapeHtml(data.homeroom_teacher_name || "(...................................)") + '</div>' +
      '</div>' +
    '</div>' +
  '</div>'; // Penutup rapor-paper

  // Form Input Catatan Wali Kelas (Hanya tampil di layar, tidak saat cetak)
  html += '<div class="card" style="margin-top: var(--space-5);">' +
    '<h3>Edit Catatan Wali Kelas</h3>' +
    '<p class="page-subtitle" style="margin-bottom: var(--space-3);">Tulis catatan perkembangan dan motivasi siswa (maksimal 500 karakter)</p>' +
    '<div class="form-group">' +
      '<textarea id="inp-homeroom-note" class="form-textarea" maxlength="500" placeholder="Tulis catatan wali kelas di sini..." oninput="updateNoteCounter()">' + App.escapeHtml(data.homeroom_note || "") + '</textarea>' +
      '<div style="display:flex; justify-content:space-between; font-size:var(--font-size-caption); color:var(--color-text-muted); margin-top:4px;">' +
        '<span>Maksimal 500 karakter</span>' +
        '<span id="note-char-counter">0 / 500</span>' +
      '</div>' +
    '</div>' +
    '<div style="display:flex; justify-content:flex-end;">' +
      '<button id="btn-save-note" class="btn btn-primary" onclick="saveHomeroomNote()">' + App.icon("checkSquare", 16) + ' Simpan Catatan</button>' +
    '</div>' +
  '</div>';

  previewEl.innerHTML = html;
  updateNoteCounter();
}

function updateNoteCounter() {
  var textarea = document.getElementById("inp-homeroom-note");
  var counter = document.getElementById("note-char-counter");
  if (textarea && counter) {
    counter.textContent = textarea.value.length + " / 500";
  }
}

function saveHomeroomNote() {
  var textarea = document.getElementById("inp-homeroom-note");
  var note = textarea ? textarea.value.trim() : "";
  var studentId = raporState.selectedStudentId;

  if (!studentId) return;

  var btn = document.getElementById("btn-save-note");
  if (btn) btn.disabled = true;

  API.reportsSaveNote({
    student_id: studentId,
    homeroom_note: note
  })
  .then(function() {
    App.toast("success", "Catatan wali kelas berhasil disimpan!");
    selectRaporStudent(studentId);
  })
  .catch(function(err) {
    App.toast("danger", err.message || "Gagal menyimpan catatan.");
  })
  .finally(function() {
    if (btn) btn.disabled = false;
  });
}

function filterRaporStudents() {
  var q = (document.getElementById("rapor-search-input").value || "").toLowerCase().trim();
  var items = document.querySelectorAll(".student-rapor-item");
  items.forEach(function(item) {
    var name = item.getAttribute("data-name") || "";
    item.style.display = (name.indexOf(q) !== -1) ? "block" : "none";
  });
}
