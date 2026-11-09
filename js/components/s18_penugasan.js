/**
 * =========================================================================
 * S18: PENUGASAN MENGAJAR (ADMIN)
 * File: s18_penugasan.js
 * Deskripsi: Penetapan guru ke mata pelajaran & kelas, KKM, jadwal mingguan
 * =========================================================================
 */

App.registerRoute("#/penugasan", function(container) {
  container.innerHTML = '<div class="page-header">' +
    '<div class="page-title-group">' +
      '<h1>Penugasan Mengajar</h1>' +
      '<p class="page-subtitle">Plotting guru mata pelajaran ke rombel kelas dan penetapan KKM</p>' +
    '</div>' +
    '<div class="page-actions">' +
      '<button class="btn btn-primary" onclick="openNewAssignmentModal()">' + App.icon("plus", 16) + ' Tambah Penugasan</button>' +
    '</div>' +
  '</div>' +
  '<div class="card" style="padding: var(--space-4); margin-bottom: var(--space-4);">' +
    '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-3);">' +
      '<div class="form-group" style="margin-bottom:0;">' +
        '<label class="form-label" for="filter-tas-sem">Filter Semester</label>' +
        '<select id="filter-tas-sem" class="form-select" onchange="loadAssignmentsList()">' +
          '<option value="">Semua Semester</option>' +
        '</select>' +
      '</div>' +
      '<div class="form-group" style="margin-bottom:0;">' +
        '<label class="form-label" for="filter-tas-teacher">Filter Guru</label>' +
        '<select id="filter-tas-teacher" class="form-select" onchange="loadAssignmentsList()">' +
          '<option value="">Semua Guru</option>' +
        '</select>' +
      '</div>' +
    '</div>' +
  '</div>' +
  '<div id="assignments-table-container">' +
    App.skeleton("table") +
  '</div>';

  initAssignmentsScreen();
});

var assignState = {
  assignments: [],
  teachers: [],
  subjects: [],
  classes: [],
  semesters: []
};

function initAssignmentsScreen() {
  Promise.all([
    API.semestersList({ page_size: 50 }),
    API.teachersList({ page_size: 100 }),
    API.subjectsList({ page_size: 100 }),
    API.classesList({ page_size: 100 })
  ])
  .then(function(results) {
    assignState.semesters = results[0].items || [];
    assignState.teachers = results[1].items || [];
    assignState.subjects = results[2].items || [];
    assignState.classes = results[3].items || [];

    var semSel = document.getElementById("filter-tas-sem");
    if (semSel) {
      var sHtml = '<option value="">Semua Semester</option>';
      for (var s = 0; s < assignState.semesters.length; s++) {
        var sem = assignState.semesters[s];
        var isAct = sem.is_active ? " (AKTIF)" : "";
        sHtml += '<option value="' + sem.id + '"' + (sem.is_active ? ' selected' : '') + '>' + App.escapeHtml(sem.academic_year + ' ' + sem.term) + isAct + '</option>';
      }
      semSel.innerHTML = sHtml;
    }

    var tchSel = document.getElementById("filter-tas-teacher");
    if (tchSel) {
      var tHtml = '<option value="">Semua Guru</option>';
      for (var t = 0; t < assignState.teachers.length; t++) {
        tHtml += '<option value="' + assignState.teachers[t].id + '">' + App.escapeHtml(assignState.teachers[t].full_name) + '</option>';
      }
      tchSel.innerHTML = tHtml;
    }

    loadAssignmentsList();
  })
  .catch(function() {
    loadAssignmentsList();
  });
}

function loadAssignmentsList() {
  var container = document.getElementById("assignments-table-container");
  if (!container) return;

  var semId = document.getElementById("filter-tas-sem") ? document.getElementById("filter-tas-sem").value : "";
  var teacherId = document.getElementById("filter-tas-teacher") ? document.getElementById("filter-tas-teacher").value : "";

  container.innerHTML = App.skeleton("table");

  API.assignmentsList({ semester_id: semId, teacher_id: teacherId, page_size: 100 })
    .then(function(res) {
      assignState.assignments = res.items || [];

      if (assignState.assignments.length === 0) {
        container.innerHTML = App.emptyState(
          "bookOpen",
          "Belum Ada Penugasan",
          "Tetapkan guru ke mata pelajaran dan kelas rombel untuk memulai proses pembelajaran.",
          '<button class="btn btn-primary" onclick="openNewAssignmentModal()">' + App.icon("plus", 16) + ' Tambah Penugasan</button>'
        );
        return;
      }

      var html = '<div class="table-responsive"><table class="table">' +
        '<thead><tr>' +
          '<th>Guru Pengampu</th>' +
          '<th>Mata Pelajaran</th>' +
          '<th>Kelas</th>' +
          '<th>Semester</th>' +
          '<th style="text-align:right;">KKM</th>' +
          '<th>Jadwal Mingguan</th>' +
          '<th>Status</th>' +
          '<th style="text-align:right;">Tindakan</th>' +
        '</tr></thead><tbody>';

      var days = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

      for (var i = 0; i < assignState.assignments.length; i++) {
        var it = assignState.assignments[i];
        var scheduleStr = "-";
        if (it.schedule && it.schedule.length > 0) {
          scheduleStr = it.schedule.map(function(sc) {
            return (days[sc.day] || "") + " (" + sc.lesson_hour + ")";
          }).join(", ");
        }

        html += '<tr>' +
          '<td><strong>' + App.escapeHtml(it.teacher_name || "-") + '</strong></td>' +
          '<td>' + App.escapeHtml(it.subject_name || "-") + '</td>' +
          '<td><span class="badge badge-neutral">' + App.escapeHtml(it.class_name || "-") + '</span></td>' +
          '<td>' + App.escapeHtml(it.semester_info || "-") + '</td>' +
          '<td style="text-align:right;" class="tabular-nums">' + it.kkm + '</td>' +
          '<td style="font-size:13px;">' + App.escapeHtml(scheduleStr) + '</td>' +
          '<td>' + (it.is_active ? '<span class="badge badge-success">Aktif</span>' : '<span class="badge badge-neutral">Nonaktif</span>') + '</td>' +
          '<td style="text-align:right; white-space:nowrap;">' +
            '<button class="btn btn-ghost" style="height:32px; padding:0 8px;" onclick="openEditAssignmentModal(\'' + it.id + '\')">' + App.icon("edit", 14) + ' Ubah</button>' +
            '<button class="btn btn-ghost" style="height:32px; padding:0 8px; color:var(--color-danger);" onclick="deleteAssignment(\'' + it.id + '\')">' + App.icon("trash", 14) + ' Hapus</button>' +
          '</td>' +
        '</tr>';
      }

      html += '</tbody></table></div>';
      container.innerHTML = html;
    })
    .catch(function(err) {
      container.innerHTML = App.errorState(err.message, loadAssignmentsList);
    });
}

function openNewAssignmentModal() {
  var tchOpts = "";
  for (var t = 0; t < assignState.teachers.length; t++) {
    tchOpts += '<option value="' + assignState.teachers[t].id + '">' + App.escapeHtml(assignState.teachers[t].full_name) + '</option>';
  }

  var subOpts = "";
  for (var s = 0; s < assignState.subjects.length; s++) {
    subOpts += '<option value="' + assignState.subjects[s].id + '">' + App.escapeHtml(assignState.subjects[s].name + ' (' + assignState.subjects[s].code + ')') + '</option>';
  }

  var clsOpts = "";
  for (var c = 0; c < assignState.classes.length; c++) {
    clsOpts += '<option value="' + assignState.classes[c].id + '">' + App.escapeHtml(assignState.classes[c].name) + '</option>';
  }

  var semOpts = "";
  for (var sm = 0; sm < assignState.semesters.length; sm++) {
    var sem = assignState.semesters[sm];
    semOpts += '<option value="' + sem.id + '"' + (sem.is_active ? ' selected' : '') + '>' + App.escapeHtml(sem.academic_year + ' ' + sem.term) + '</option>';
  }

  var modalBody = '<form id="form-new-tas">' +
    '<div class="form-group">' +
      '<label class="form-label" for="inp-tas-teacher">Guru Pengampu</label>' +
      '<select id="inp-tas-teacher" class="form-select" required>' + tchOpts + '</select>' +
    '</div>' +
    '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">' +
      '<div class="form-group">' +
        '<label class="form-label" for="inp-tas-subject">Mata Pelajaran</label>' +
        '<select id="inp-tas-subject" class="form-select" required>' + subOpts + '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label" for="inp-tas-class">Kelas (Rombel)</label>' +
        '<select id="inp-tas-class" class="form-select" required>' + clsOpts + '</select>' +
      '</div>' +
    '</div>' +
    '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">' +
      '<div class="form-group">' +
        '<label class="form-label" for="inp-tas-sem">Semester</label>' +
        '<select id="inp-tas-sem" class="form-select" required>' + semOpts + '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label" for="inp-tas-kkm">Batas KKM (0–100)</label>' +
        '<input type="number" id="inp-tas-kkm" class="form-input" min="0" max="100" value="75" required>' +
      '</div>' +
    '</div>' +
  '</form>';

  App.showModal({
    title: "Tambah Penugasan Mengajar",
    body: modalBody,
    footer: '<button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>' +
            '<button type="button" class="btn btn-primary" onclick="submitNewAssignment()">Simpan Penugasan</button>'
  });
}

function submitNewAssignment() {
  var teacherId = document.getElementById("inp-tas-teacher").value;
  var subjectId = document.getElementById("inp-tas-subject").value;
  var classId = document.getElementById("inp-tas-class").value;
  var semesterId = document.getElementById("inp-tas-sem").value;
  var kkm = document.getElementById("inp-tas-kkm").value;

  if (!teacherId || !subjectId || !classId || !semesterId) {
    App.toast("warning", "Semua pilihan wajib diisi");
    return;
  }

  API.assignmentsCreate({
    teacher_id: teacherId,
    subject_id: subjectId,
    class_id: classId,
    semester_id: semesterId,
    kkm: kkm
  })
  .then(function() {
    App.closeModal();
    App.toast("success", "Penugasan mengajar berhasil ditambahkan!");
    loadAssignmentsList();
  })
  .catch(function(err) {
    App.toast("danger", err.message || "Gagal menambahkan penugasan.");
  });
}

function openEditAssignmentModal(assignId) {
  var item = assignState.assignments.find(function(a) { return a.id === assignId; });
  if (!item) return;

  var tchOpts = "";
  for (var t = 0; t < assignState.teachers.length; t++) {
    var isSel = assignState.teachers[t].id === item.teacher_id ? " selected" : "";
    tchOpts += '<option value="' + assignState.teachers[t].id + '"' + isSel + '>' + App.escapeHtml(assignState.teachers[t].full_name) + '</option>';
  }

  var modalBody = '<form id="form-edit-tas">' +
    '<div class="form-group">' +
      '<label class="form-label" for="edit-tas-teacher">Guru Pengampu</label>' +
      '<select id="edit-tas-teacher" class="form-select">' + tchOpts + '</select>' +
    '</div>' +
    '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">' +
      '<div class="form-group">' +
        '<label class="form-label" for="edit-tas-kkm">Batas KKM</label>' +
        '<input type="number" id="edit-tas-kkm" class="form-input" min="0" max="100" value="' + item.kkm + '" required>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label" for="edit-tas-active">Status Penugasan</label>' +
        '<select id="edit-tas-active" class="form-select">' +
          '<option value="true"' + (item.is_active ? ' selected' : '') + '>Aktif</option>' +
          '<option value="false"' + (!item.is_active ? ' selected' : '') + '>Nonaktif</option>' +
        '</select>' +
      '</div>' +
    '</div>' +
  '</form>';

  App.showModal({
    title: "Ubah Penugasan Mengajar",
    body: modalBody,
    footer: '<button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>' +
            '<button type="button" class="btn btn-primary" onclick="submitEditAssignment(\'' + item.id + '\')">Simpan Perubahan</button>'
  });
}

function submitEditAssignment(assignId) {
  var teacherId = document.getElementById("edit-tas-teacher").value;
  var kkm = document.getElementById("edit-tas-kkm").value;
  var isActive = document.getElementById("edit-tas-active").value === "true";

  API.assignmentsUpdate({
    id: assignId,
    teacher_id: teacherId,
    kkm: kkm,
    is_active: isActive
  })
  .then(function() {
    App.closeModal();
    App.toast("success", "Penugasan berhasil diperbarui!");
    loadAssignmentsList();
  })
  .catch(function(err) {
    App.toast("danger", err.message || "Gagal mengubah penugasan.");
  });
}

function deleteAssignment(assignId) {
  if (confirm("Hapus penugasan mengajar ini? Jika penugasan sudah memiliki data presensi atau nilai, sistem akan menyarankan untuk dinonaktifkan saja.")) {
    API.assignmentsDelete({ id: assignId })
      .then(function() {
        App.toast("success", "Penugasan berhasil dihapus.");
        loadAssignmentsList();
      })
      .catch(function(err) {
        App.toast("danger", err.message || "Gagal menghapus penugasan.");
      });
  }
}
