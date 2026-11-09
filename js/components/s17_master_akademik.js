/**
 * =========================================================================
 * S17: KELAS, MAPEL, TAHUN AJARAN & KUNCI SEMESTER (ADMIN)
 * File: s17_master_akademik.js
 * Deskripsi: Kelola Semester, Kelas, dan Mata Pelajaran dalam satu modul
 * =========================================================================
 */

App.registerRoute("#/master-akademik", function(container) {
  container.innerHTML = '<div class="page-header">' +
    '<div class="page-title-group">' +
      '<h1>Data Master Akademik</h1>' +
      '<p class="page-subtitle">Kelola tahun ajaran & semester, kelas rombel, dan mata pelajaran</p>' +
    '</div>' +
  '</div>' +
  '<div class="tab-bar">' +
    '<div class="tab-item active" id="tab-akademik-sem" onclick="switchAkademikTab(\'sem\')">Tahun Ajaran & Semester</div>' +
    '<div class="tab-item" id="tab-akademik-cls" onclick="switchAkademikTab(\'cls\')">Kelas (Rombel)</div>' +
    '<div class="tab-item" id="tab-akademik-sub" onclick="switchAkademikTab(\'sub\')">Mata Pelajaran</div>' +
  '</div>' +
  '<div id="master-akademik-content">' +
    App.skeleton("table") +
  '</div>';

  switchAkademikTab("sem");
});

var akademikState = {
  activeTab: "sem",
  semesters: [],
  classes: [],
  subjects: [],
  teachers: []
};

function switchAkademikTab(tab) {
  akademikState.activeTab = tab;
  var bSem = document.getElementById("tab-akademik-sem");
  var bCls = document.getElementById("tab-akademik-cls");
  var bSub = document.getElementById("tab-akademik-sub");

  if (bSem) bSem.classList.toggle("active", tab === "sem");
  if (bCls) bCls.classList.toggle("active", tab === "cls");
  if (bSub) bSub.classList.toggle("active", tab === "sub");

  var content = document.getElementById("master-akademik-content");
  if (!content) return;
  content.innerHTML = App.skeleton("table");

  if (tab === "sem") loadSemesters();
  else if (tab === "cls") loadClasses();
  else if (tab === "sub") loadSubjects();
}

// -------------------------------------------------------------------------
// 1. SEMESTERS
// -------------------------------------------------------------------------

function loadSemesters() {
  var content = document.getElementById("master-akademik-content");
  API.semestersList({ page_size: 50 })
    .then(function(res) {
      akademikState.semesters = res.items || [];
      var html = '<div class="card">' +
        '<div class="page-header" style="margin-bottom: var(--space-4);">' +
          '<h3>Daftar Tahun Ajaran & Semester</h3>' +
          '<button class="btn btn-primary" onclick="openNewSemesterModal()">' + App.icon("plus", 16) + ' Tambah Semester</button>' +
        '</div>' +
        '<div class="table-responsive"><table class="table">' +
          '<thead><tr>' +
            '<th>Tahun Ajaran</th>' +
            '<th>Semester</th>' +
            '<th>Rentang Tanggal</th>' +
            '<th>Status Aktif</th>' +
            '<th>Status Kunci</th>' +
            '<th style="text-align:right;">Tindakan</th>' +
          '</tr></thead><tbody>';

      for (var s = 0; s < akademikState.semesters.length; s++) {
        var it = akademikState.semesters[s];
        var lockBtn = it.is_locked
          ? '<button class="btn btn-ghost" style="height:32px; padding:0 8px; color:var(--color-warning);" onclick="openUnlockModal(\'' + it.id + '\')">' + App.icon("unlock", 14) + ' Buka Kunci</button>'
          : '<button class="btn btn-ghost" style="height:32px; padding:0 8px;" onclick="lockSemester(\'' + it.id + '\')">' + App.icon("lock", 14) + ' Kunci</button>';

        var activateBtn = !it.is_active
          ? '<button class="btn btn-secondary" style="height:32px; padding:0 8px; font-size:12px; margin-right:4px;" onclick="activateSemester(\'' + it.id + '\')">Aktifkan</button>'
          : '';

        html += '<tr>' +
          '<td><strong>' + App.escapeHtml(it.academic_year) + '</strong></td>' +
          '<td>' + (it.term === "ganjil" ? "Ganjil" : "Genap") + '</td>' +
          '<td>' + it.start_date + ' s/d ' + it.end_date + '</td>' +
          '<td>' + (it.is_active ? '<span class="badge badge-success">AKTIF</span>' : '<span class="badge badge-neutral">Tidak Aktif</span>') + '</td>' +
          '<td>' + (it.is_locked ? '<span class="badge badge-danger">TERKUNCI</span>' : '<span class="badge badge-success">Terbuka</span>') + '</td>' +
          '<td style="text-align:right; white-space:nowrap;">' + activateBtn + lockBtn + '</td>' +
        '</tr>';
      }

      html += '</tbody></table></div></div>';
      content.innerHTML = html;
    })
    .catch(function(err) {
      content.innerHTML = App.errorState(err.message, loadSemesters);
    });
}

function openNewSemesterModal() {
  var modalBody = '<form id="form-new-sem">' +
    '<div class="form-group">' +
      '<label class="form-label" for="inp-sem-ay">Tahun Ajaran (Format YYYY/YYYY)</label>' +
      '<input type="text" id="inp-sem-ay" class="form-input" placeholder="contoh: 2026/2027" required>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label" for="inp-sem-term">Semester</label>' +
      '<select id="inp-sem-term" class="form-select">' +
        '<option value="ganjil">Ganjil</option>' +
        '<option value="genap">Genap</option>' +
      '</select>' +
    '</div>' +
    '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">' +
      '<div class="form-group">' +
        '<label class="form-label" for="inp-sem-start">Tanggal Mulai</label>' +
        '<input type="date" id="inp-sem-start" class="form-input" required>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label" for="inp-sem-end">Tanggal Selesai</label>' +
        '<input type="date" id="inp-sem-end" class="form-input" required>' +
      '</div>' +
    '</div>' +
  '</form>';

  App.showModal({
    title: "Tambah Semester Baru",
    body: modalBody,
    footer: '<button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>' +
            '<button type="button" class="btn btn-primary" onclick="submitNewSemester()">Simpan Semester</button>'
  });
}

function submitNewSemester() {
  var ay = (document.getElementById("inp-sem-ay").value || "").trim();
  var term = document.getElementById("inp-sem-term").value;
  var start = document.getElementById("inp-sem-start").value;
  var end = document.getElementById("inp-sem-end").value;

  if (!ay || !term || !start || !end) {
    App.toast("warning", "Semua kolom wajib diisi");
    return;
  }

  API.semestersCreate({
    academic_year: ay,
    term: term,
    start_date: start,
    end_date: end
  })
  .then(function() {
    App.closeModal();
    App.toast("success", "Semester berhasil dibuat!");
    loadSemesters();
  })
  .catch(function(err) {
    App.toast("danger", err.message || "Gagal membuat semester.");
  });
}

function activateSemester(semId) {
  if (confirm("Aktifkan semester ini? Hanya satu semester yang dapat aktif pada satu waktu.")) {
    API.semestersActivate({ id: semId })
      .then(function() {
        App.toast("success", "Semester aktif berhasil diperbarui!");
        loadSemesters();
      })
      .catch(function(err) {
        App.toast("danger", err.message || "Gagal mengaktifkan.");
      });
  }
}

function lockSemester(semId) {
  if (confirm("Kunci semester ini? Setelah terkunci, guru tidak dapat mengubah presensi, penilaian, atau rapor.")) {
    API.semestersLock({ id: semId })
      .then(function() {
        App.toast("success", "Semester berhasil dikunci!");
        loadSemesters();
      })
      .catch(function(err) {
        App.toast("danger", err.message || "Gagal mengunci semester.");
      });
  }
}

function openUnlockModal(semId) {
  var modalBody = '<form id="form-unlock">' +
    '<div class="form-group">' +
      '<label class="form-label" for="inp-unlock-reason">Alasan Buka Kunci (Wajib Diisi)</label>' +
      '<textarea id="inp-unlock-reason" class="form-textarea" placeholder="Tulis alasan pembukaan kunci, misal: Koreksi nilai susulan siswa..." maxlength="200" required></textarea>' +
      '<div class="form-help">Alasan ini akan dicatat secara permanen di Log Audit.</div>' +
    '</div>' +
  '</form>';

  App.showModal({
    title: "Buka Kunci Semester",
    body: modalBody,
    footer: '<button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>' +
            '<button type="button" class="btn btn-primary" onclick="submitUnlock(\'' + semId + '\')">Buka Kunci</button>'
  });
}

function submitUnlock(semId) {
  var reason = (document.getElementById("inp-unlock-reason").value || "").trim();
  if (!reason) {
    App.toast("warning", "Alasan wajib diisi");
    return;
  }

  API.semestersUnlock({ id: semId, reason: reason })
    .then(function() {
      App.closeModal();
      App.toast("info", "Kunci semester berhasil dibuka!");
      loadSemesters();
    })
    .catch(function(err) {
      App.toast("danger", err.message || "Gagal membuka kunci.");
    });
}

// -------------------------------------------------------------------------
// 2. CLASSES
// -------------------------------------------------------------------------

function loadClasses() {
  var content = document.getElementById("master-akademik-content");

  Promise.all([
    API.classesList({ page_size: 100 }),
    API.teachersList({ page_size: 100 })
  ])
  .then(function(results) {
    akademikState.classes = results[0].items || [];
    akademikState.teachers = results[1].items || [];

    var html = '<div class="card">' +
      '<div class="page-header" style="margin-bottom: var(--space-4);">' +
        '<h3>Daftar Kelas (Rombongan Belajar)</h3>' +
        '<button class="btn btn-primary" onclick="openNewClassModal()">' + App.icon("plus", 16) + ' Tambah Kelas</button>' +
      '</div>' +
      '<div class="table-responsive"><table class="table">' +
        '<thead><tr>' +
          '<th>Nama Kelas</th>' +
          '<th>Tingkat</th>' +
          '<th>Tahun Ajaran</th>' +
          '<th>Wali Kelas</th>' +
          '<th style="text-align:right;">Tindakan</th>' +
        '</tr></thead><tbody>';

    for (var c = 0; c < akademikState.classes.length; c++) {
      var cls = akademikState.classes[c];
      html += '<tr>' +
        '<td><strong>' + App.escapeHtml(cls.name) + '</strong></td>' +
        '<td>Tingkat ' + cls.grade_level + '</td>' +
        '<td>' + App.escapeHtml(cls.academic_year) + '</td>' +
        '<td>' + (cls.homeroom_teacher_name ? App.escapeHtml(cls.homeroom_teacher_name) : '<span style="color:var(--color-text-muted);">Belum ditentukan</span>') + '</td>' +
        '<td style="text-align:right; white-space:nowrap;">' +
          '<button class="btn btn-ghost" style="height:32px; padding:0 8px;" onclick="openEditClassModal(\'' + cls.id + '\')">' + App.icon("edit", 14) + ' Ubah</button>' +
          '<button class="btn btn-ghost" style="height:32px; padding:0 8px; color:var(--color-danger);" onclick="deleteClass(\'' + cls.id + '\', \'' + App.escapeHtml(cls.name) + '\')">' + App.icon("trash", 14) + ' Hapus</button>' +
        '</td>' +
      '</tr>';
    }

    html += '</tbody></table></div></div>';
    content.innerHTML = html;
  })
  .catch(function(err) {
    content.innerHTML = App.errorState(err.message, loadClasses);
  });
}

function openNewClassModal() {
  var teacherOpts = '<option value="">-- Tanpa Wali Kelas --</option>';
  for (var t = 0; t < akademikState.teachers.length; t++) {
    teacherOpts += '<option value="' + akademikState.teachers[t].id + '">' + App.escapeHtml(akademikState.teachers[t].full_name) + '</option>';
  }

  var currentAy = akademikState.semesters.length > 0 ? akademikState.semesters[0].academic_year : "2026/2027";

  var modalBody = '<form id="form-new-cls">' +
    '<div class="form-group">' +
      '<label class="form-label" for="inp-cls-name">Nama Kelas (contoh: 7A)</label>' +
      '<input type="text" id="inp-cls-name" class="form-input" placeholder="contoh: 7A" maxlength="20" required>' +
    '</div>' +
    '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">' +
      '<div class="form-group">' +
        '<label class="form-label" for="inp-cls-grade">Tingkat (1–12)</label>' +
        '<input type="number" id="inp-cls-grade" class="form-input" min="1" max="12" value="7" required>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label" for="inp-cls-ay">Tahun Ajaran</label>' +
        '<input type="text" id="inp-cls-ay" class="form-input" value="' + currentAy + '" required>' +
      '</div>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label" for="inp-cls-teacher">Wali Kelas</label>' +
      '<select id="inp-cls-teacher" class="form-select">' + teacherOpts + '</select>' +
    '</div>' +
  '</form>';

  App.showModal({
    title: "Tambah Kelas Baru",
    body: modalBody,
    footer: '<button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>' +
            '<button type="button" class="btn btn-primary" onclick="submitNewClass()">Simpan Kelas</button>'
  });
}

function submitNewClass() {
  var name = (document.getElementById("inp-cls-name").value || "").trim();
  var grade = document.getElementById("inp-cls-grade").value;
  var ay = (document.getElementById("inp-cls-ay").value || "").trim();
  var teacherId = document.getElementById("inp-cls-teacher").value;

  if (!name || !grade || !ay) {
    App.toast("warning", "Nama kelas, tingkat, dan tahun ajaran wajib diisi");
    return;
  }

  API.classesCreate({
    name: name,
    grade_level: grade,
    academic_year: ay,
    homeroom_teacher_id: teacherId || null
  })
  .then(function() {
    App.closeModal();
    App.toast("success", "Kelas berhasil dibuat!");
    loadClasses();
  })
  .catch(function(err) {
    App.toast("danger", err.message || "Gagal membuat kelas.");
  });
}

function openEditClassModal(classId) {
  var cls = akademikState.classes.find(function(c) { return c.id === classId; });
  if (!cls) return;

  var teacherOpts = '<option value="">-- Tanpa Wali Kelas --</option>';
  for (var t = 0; t < akademikState.teachers.length; t++) {
    var isSel = akademikState.teachers[t].id === cls.homeroom_teacher_id ? " selected" : "";
    teacherOpts += '<option value="' + akademikState.teachers[t].id + '"' + isSel + '>' + App.escapeHtml(akademikState.teachers[t].full_name) + '</option>';
  }

  var modalBody = '<form id="form-edit-cls">' +
    '<div class="form-group">' +
      '<label class="form-label" for="edit-cls-name">Nama Kelas</label>' +
      '<input type="text" id="edit-cls-name" class="form-input" value="' + App.escapeHtml(cls.name) + '" required>' +
    '</div>' +
    '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">' +
      '<div class="form-group">' +
        '<label class="form-label" for="edit-cls-grade">Tingkat</label>' +
        '<input type="number" id="edit-cls-grade" class="form-input" min="1" max="12" value="' + cls.grade_level + '" required>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label" for="edit-cls-ay">Tahun Ajaran</label>' +
        '<input type="text" id="edit-cls-ay" class="form-input" value="' + App.escapeHtml(cls.academic_year) + '" required>' +
      '</div>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label" for="edit-cls-teacher">Wali Kelas</label>' +
      '<select id="edit-cls-teacher" class="form-select">' + teacherOpts + '</select>' +
    '</div>' +
  '</form>';

  App.showModal({
    title: "Ubah Kelas",
    body: modalBody,
    footer: '<button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>' +
            '<button type="button" class="btn btn-primary" onclick="submitEditClass(\'' + cls.id + '\')">Simpan Perubahan</button>'
  });
}

function submitEditClass(classId) {
  var name = (document.getElementById("edit-cls-name").value || "").trim();
  var grade = document.getElementById("edit-cls-grade").value;
  var ay = (document.getElementById("edit-cls-ay").value || "").trim();
  var teacherId = document.getElementById("edit-cls-teacher").value;

  API.classesUpdate({
    id: classId,
    name: name,
    grade_level: grade,
    academic_year: ay,
    homeroom_teacher_id: teacherId || ""
  })
  .then(function() {
    App.closeModal();
    App.toast("success", "Kelas berhasil diperbarui!");
    loadClasses();
  })
  .catch(function(err) {
    App.toast("danger", err.message || "Gagal mengubah kelas.");
  });
}

function deleteClass(classId, name) {
  if (confirm("Hapus kelas '" + name + "'? Pastikan kelas tidak memiliki siswa atau penugasan mengajar.")) {
    API.classesDelete({ id: classId })
      .then(function() {
        App.toast("success", "Kelas berhasil dihapus.");
        loadClasses();
      })
      .catch(function(err) {
        App.toast("danger", err.message || "Gagal menghapus kelas.");
      });
  }
}

// -------------------------------------------------------------------------
// 3. SUBJECTS
// -------------------------------------------------------------------------

function loadSubjects() {
  var content = document.getElementById("master-akademik-content");
  API.subjectsList({ page_size: 100 })
    .then(function(res) {
      akademikState.subjects = res.items || [];
      var html = '<div class="card">' +
        '<div class="page-header" style="margin-bottom: var(--space-4);">' +
          '<h3>Daftar Mata Pelajaran</h3>' +
          '<button class="btn btn-primary" onclick="openNewSubjectModal()">' + App.icon("plus", 16) + ' Tambah Mata Pelajaran</button>' +
        '</div>' +
        '<div class="table-responsive"><table class="table">' +
          '<thead><tr>' +
            '<th>Kode</th>' +
            '<th>Nama Mata Pelajaran</th>' +
            '<th style="text-align:right;">KKM Standar</th>' +
            '<th style="text-align:right;">Tindakan</th>' +
          '</tr></thead><tbody>';

      for (var s = 0; s < akademikState.subjects.length; s++) {
        var sub = akademikState.subjects[s];
        html += '<tr>' +
          '<td><strong>' + App.escapeHtml(sub.code) + '</strong></td>' +
          '<td>' + App.escapeHtml(sub.name) + '</td>' +
          '<td style="text-align:right;" class="tabular-nums">' + sub.default_kkm + '</td>' +
          '<td style="text-align:right; white-space:nowrap;">' +
            '<button class="btn btn-ghost" style="height:32px; padding:0 8px;" onclick="openEditSubjectModal(\'' + sub.id + '\')">' + App.icon("edit", 14) + ' Ubah</button>' +
            '<button class="btn btn-ghost" style="height:32px; padding:0 8px; color:var(--color-danger);" onclick="deleteSubject(\'' + sub.id + '\', \'' + App.escapeHtml(sub.name) + '\')">' + App.icon("trash", 14) + ' Hapus</button>' +
          '</td>' +
        '</tr>';
      }

      html += '</tbody></table></div></div>';
      content.innerHTML = html;
    })
    .catch(function(err) {
      content.innerHTML = App.errorState(err.message, loadSubjects);
    });
}

function openNewSubjectModal() {
  var modalBody = '<form id="form-new-sub">' +
    '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">' +
      '<div class="form-group">' +
        '<label class="form-label" for="inp-sub-code">Kode Mapel (Huruf Besar)</label>' +
        '<input type="text" id="inp-sub-code" class="form-input" placeholder="contoh: MTK" maxlength="10" required>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label" for="inp-sub-kkm">KKM Default (0–100)</label>' +
        '<input type="number" id="inp-sub-kkm" class="form-input" min="0" max="100" value="75" required>' +
      '</div>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label" for="inp-sub-name">Nama Mata Pelajaran</label>' +
      '<input type="text" id="inp-sub-name" class="form-input" placeholder="contoh: Matematika" maxlength="100" required>' +
    '</div>' +
  '</form>';

  App.showModal({
    title: "Tambah Mata Pelajaran",
    body: modalBody,
    footer: '<button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>' +
            '<button type="button" class="btn btn-primary" onclick="submitNewSubject()">Simpan Mapel</button>'
  });
}

function submitNewSubject() {
  var code = (document.getElementById("inp-sub-code").value || "").trim().toUpperCase();
  var name = (document.getElementById("inp-sub-name").value || "").trim();
  var kkm = document.getElementById("inp-sub-kkm").value;

  if (!code || !name) {
    App.toast("warning", "Kode dan nama mata pelajaran wajib diisi");
    return;
  }

  API.subjectsCreate({
    code: code,
    name: name,
    default_kkm: kkm
  })
  .then(function() {
    App.closeModal();
    App.toast("success", "Mata pelajaran berhasil ditambahkan!");
    loadSubjects();
  })
  .catch(function(err) {
    App.toast("danger", err.message || "Gagal menambahkan mata pelajaran.");
  });
}

function openEditSubjectModal(subjectId) {
  var sub = akademikState.subjects.find(function(s) { return s.id === subjectId; });
  if (!sub) return;

  var modalBody = '<form id="form-edit-sub">' +
    '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">' +
      '<div class="form-group">' +
        '<label class="form-label" for="edit-sub-code">Kode Mapel</label>' +
        '<input type="text" id="edit-sub-code" class="form-input" value="' + App.escapeHtml(sub.code) + '" maxlength="10" required>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label" for="edit-sub-kkm">KKM Default</label>' +
        '<input type="number" id="edit-sub-kkm" class="form-input" min="0" max="100" value="' + sub.default_kkm + '" required>' +
      '</div>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label" for="edit-sub-name">Nama Mata Pelajaran</label>' +
      '<input type="text" id="edit-sub-name" class="form-input" value="' + App.escapeHtml(sub.name) + '" maxlength="100" required>' +
    '</div>' +
  '</form>';

  App.showModal({
    title: "Ubah Mata Pelajaran",
    body: modalBody,
    footer: '<button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>' +
            '<button type="button" class="btn btn-primary" onclick="submitEditSubject(\'' + sub.id + '\')">Simpan Perubahan</button>'
  });
}

function submitEditSubject(subjectId) {
  var code = (document.getElementById("edit-sub-code").value || "").trim().toUpperCase();
  var name = (document.getElementById("edit-sub-name").value || "").trim();
  var kkm = document.getElementById("edit-sub-kkm").value;

  API.subjectsUpdate({
    id: subjectId,
    code: code,
    name: name,
    default_kkm: kkm
  })
  .then(function() {
    App.closeModal();
    App.toast("success", "Mata pelajaran berhasil diperbarui!");
    loadSubjects();
  })
  .catch(function(err) {
    App.toast("danger", err.message || "Gagal mengubah mata pelajaran.");
  });
}

function deleteSubject(subjectId, name) {
  if (confirm("Hapus mata pelajaran '" + name + "'? Pastikan belum digunakan di penugasan mengajar.")) {
    API.subjectsDelete({ id: subjectId })
      .then(function() {
        App.toast("success", "Mata pelajaran berhasil dihapus.");
        loadSubjects();
      })
      .catch(function(err) {
        App.toast("danger", err.message || "Gagal menghapus mata pelajaran.");
      });
  }
}
