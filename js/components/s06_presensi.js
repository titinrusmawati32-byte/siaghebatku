/**
 * =========================================================================
 * S06: PRESENSI SISWA (MOBILE-FIRST)
 * File: s06_presensi.js
 * Deskripsi: Catat presensi per sesi, segmented control H/S/I/A, catatan S/I/A,
 *            ringkasan sticky real-time, tombol Semua Hadir, tawaran Buat Jurnal
 * =========================================================================
 */

App.registerRoute("#/presensi", function(container, queryString) {
  var params = new URLSearchParams(queryString || "");
  var preselectedAssignmentId = params.get("assignment_id") || "";

  container.innerHTML = '<div class="page-header">' +
    '<div class="page-title-group">' +
      '<h1>Pencatatan Presensi</h1>' +
      '<p class="page-subtitle">Pilih penugasan kelas, tanggal sesi, dan jam pelajaran</p>' +
    '</div>' +
    '<div class="page-actions">' +
      '<button class="btn btn-secondary" onclick="App.navigate(\'#/rekap-presensi\')">' + App.icon("calendar", 16) + ' Rekap Presensi</button>' +
      '<button id="btn-save-attendance-top" class="btn btn-primary" onclick="saveAttendance()">' + App.icon("checkSquare", 16) + ' Simpan Presensi</button>' +
    '</div>' +
  '</div>' +
  '<div id="post-attendance-banner" style="display:none;"></div>' +
  '<div class="card" style="padding: var(--space-4);">' +
    '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-3);">' +
      '<div class="form-group" style="margin-bottom:0;">' +
        '<label class="form-label" for="sel-assignment">Kelas & Mata Pelajaran</label>' +
        '<select id="sel-assignment" class="form-select" onchange="onAssignmentChange()">' +
          '<option value="">Memuat penugasan...</option>' +
        '</select>' +
      '</div>' +
      '<div class="form-group" style="margin-bottom:0;">' +
        '<label class="form-label" for="inp-session-date">Tanggal Sesi</label>' +
        '<input type="date" id="inp-session-date" class="form-input" onchange="onSessionHeaderChange()">' +
      '</div>' +
      '<div class="form-group" style="margin-bottom:0;">' +
        '<label class="form-label" for="inp-lesson-hour">Jam Pelajaran</label>' +
        '<input type="text" id="inp-lesson-hour" class="form-input" placeholder="contoh: 1-2 atau 3" onchange="onSessionHeaderChange()">' +
      '</div>' +
    '</div>' +
  '</div>' +
  // Ringkasan Sticky
  '<div id="sticky-attendance-summary" class="card" style="position: sticky; top: 12px; z-index: 20; padding: var(--space-3) var(--space-4); margin-bottom: var(--space-4); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">' +
    '<div id="summary-counters" style="font-size: var(--font-size-small); font-weight: 600;">' +
      'Pilih penugasan untuk memuat daftar siswa' +
    '</div>' +
    '<div style="display:flex; align-items:center; gap:8px;">' +
      '<button class="btn btn-secondary" style="height:36px; padding:0 12px; font-size:13px;" onclick="setAllPresent()">' +
        App.icon("checkSquare", 16) + ' Semua Hadir' +
      '</button>' +
      '<input type="text" id="inp-search-student" class="form-input" style="height:36px; width:160px; font-size:13px;" placeholder="Cari nama siswa..." oninput="filterStudentList()">' +
    '</div>' +
  '</div>' +
  '<div id="students-attendance-list">' +
    App.emptyState("users", "Belum Ada Siswa Dipilih", "Pilih penugasan mengajar di atas untuk menampilkan siswa kelas.") +
  '</div>' +
  // Sticky Bottom Bar untuk Mobile
  '<div class="mobile-sticky-footer">' +
    '<button id="btn-save-attendance-mobile" class="btn btn-primary btn-full" onclick="saveAttendance()">' +
      App.icon("checkSquare", 18) + ' <span>Simpan Presensi</span>' +
    '</button>' +
  '</div>';

  initAttendance(preselectedAssignmentId);
});

// State lokal presensi
var presensiState = {
  assignmentId: "",
  classId: "",
  semesterId: "",
  students: [],
  attendanceData: {}, // student_id -> { status: 'H'|'S'|'I'|'A', note: '' }
  assignments: [],
  existingSessionId: null
};

function initAttendance(preselectedId) {
  var dateInput = document.getElementById("inp-session-date");
  if (dateInput) {
    var today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
    dateInput.max = today; // Tanggal tidak boleh di masa depan
  }

  var hourInput = document.getElementById("inp-lesson-hour");
  if (hourInput && !hourInput.value) {
    hourInput.value = "1-2";
  }

  // Muat daftar penugasan
  API.assignmentsList({ page_size: 100 })
    .then(function(res) {
      presensiState.assignments = res.items || [];
      var sel = document.getElementById("sel-assignment");
      if (!sel) return;

      if (presensiState.assignments.length === 0) {
        sel.innerHTML = '<option value="">Tidak ada penugasan aktif</option>';
        return;
      }

      var html = '<option value="">-- Pilih Penugasan Mengajar --</option>';
      for (var i = 0; i < presensiState.assignments.length; i++) {
        var a = presensiState.assignments[i];
        var isSelected = a.id === preselectedId ? " selected" : "";
        html += '<option value="' + a.id + '"' + isSelected + '>' +
          App.escapeHtml(a.class_name + ' · ' + a.subject_name) +
        '</option>';
      }
      sel.innerHTML = html;

      if (preselectedId) {
        onAssignmentChange();
      }
    })
    .catch(function(err) {
      App.toast("danger", err.message || "Gagal memuat penugasan");
    });
}

function onAssignmentChange() {
  var sel = document.getElementById("sel-assignment");
  var assignId = sel.value;
  presensiState.assignmentId = assignId;

  if (!assignId) {
    document.getElementById("students-attendance-list").innerHTML = App.emptyState("users", "Belum Ada Siswa", "Pilih penugasan mengajar di atas.");
    updateSummaryText();
    return;
  }

  var matched = presensiState.assignments.find(function(a) { return a.id === assignId; });
  if (matched) {
    presensiState.classId = matched.class_id;
    presensiState.semesterId = matched.semester_id;
  }

  // Muat siswa kelas
  document.getElementById("students-attendance-list").innerHTML = App.skeleton("table");

  API.studentsList({ class_id: presensiState.classId, status: "aktif", page_size: 100 })
    .then(function(res) {
      presensiState.students = res.items || [];
      presensiState.attendanceData = {};

      // Default seluruh siswa Hadir (H)
      for (var s = 0; s < presensiState.students.length; s++) {
        presensiState.attendanceData[presensiState.students[s].id] = {
          status: "H",
          note: ""
        };
      }

      checkExistingSession();
    })
    .catch(function(err) {
      document.getElementById("students-attendance-list").innerHTML = App.errorState(err.message, "onAssignmentChange");
    });
}

function onSessionHeaderChange() {
  checkExistingSession();
}

function checkExistingSession() {
  var assignId = presensiState.assignmentId;
  var sDate = document.getElementById("inp-session-date").value;
  var lHour = document.getElementById("inp-lesson-hour").value.trim();

  if (!assignId || !sDate || !lHour) {
    renderStudentAttendanceList();
    return;
  }

  // Cek apakah sesi ini sudah pernah dicatat sebelumnya
  API.attendanceList({ assignment_id: assignId, session_date: sDate })
    .then(function(res) {
      var items = res.items || [];
      var matched = items.find(function(it) { return it.lesson_hour === lHour; });
      if (matched) {
        presensiState.existingSessionId = matched.id;
        // Ambil detail sesi untuk mengisi status S/I/A yang tersimpan
        API.attendanceGet({ id: matched.id }).then(function(detail) {
          var absences = detail.session.absences || [];
          for (var a = 0; a < absences.length; a++) {
            if (presensiState.attendanceData[absences[a].student_id]) {
              presensiState.attendanceData[absences[a].student_id].status = absences[a].status;
              presensiState.attendanceData[absences[a].student_id].note = absences[a].note || "";
            }
          }
          App.toast("info", "Memuat data presensi sesi yang sudah tersimpan sebelumnya.");
          renderStudentAttendanceList();
        });
      } else {
        presensiState.existingSessionId = null;
        renderStudentAttendanceList();
      }
    })
    .catch(function() {
      renderStudentAttendanceList();
    });
}

function renderStudentAttendanceList() {
  var listEl = document.getElementById("students-attendance-list");
  if (!listEl) return;

  var students = presensiState.students;
  if (students.length === 0) {
    listEl.innerHTML = App.emptyState("users", "Tidak Ada Siswa Aktif", "Kelas ini belum memiliki siswa aktif.");
    updateSummaryText();
    return;
  }

  var html = '<div style="display: flex; flex-direction: column; gap: var(--space-3);">';
  for (var i = 0; i < students.length; i++) {
    var s = students[i];
    var att = presensiState.attendanceData[s.id] || { status: "H", note: "" };
    var isAbsentState = att.status !== "H";

    html += '<div class="card student-row" id="row-stu-' + s.id + '" style="margin-bottom:0; padding: var(--space-4);" data-name="' + App.escapeHtml(s.full_name.toLowerCase()) + '">' +
      '<div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">' +
        '<div style="display:flex; align-items:center; gap: 12px;">' +
          '<div style="width:28px; height:28px; border-radius:var(--radius-pill); background:var(--color-surface-alt); display:flex; align-items:center; justify-content:center; font-weight:600; font-size:13px;">' + (i + 1) + '</div>' +
          '<div>' +
            '<div style="font-weight: 600; color: var(--color-text-heading);">' + App.escapeHtml(s.full_name) + '</div>' +
            '<div style="font-size: var(--font-size-caption); color: var(--color-text-muted);">NIS: ' + App.escapeHtml(s.nis) + ' · ' + s.gender + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="segmented-control">' +
          '<button type="button" class="segmented-btn' + (att.status === "H" ? " active" : "") + '" data-val="H" onclick="setStudentStatus(\'' + s.id + '\', \'H\')">H</button>' +
          '<button type="button" class="segmented-btn' + (att.status === "S" ? " active" : "") + '" data-val="S" onclick="setStudentStatus(\'' + s.id + '\', \'S\')">S</button>' +
          '<button type="button" class="segmented-btn' + (att.status === "I" ? " active" : "") + '" data-val="I" onclick="setStudentStatus(\'' + s.id + '\', \'I\')">I</button>' +
          '<button type="button" class="segmented-btn' + (att.status === "A" ? " active" : "") + '" data-val="A" onclick="setStudentStatus(\'' + s.id + '\', \'A\')">A</button>' +
        '</div>' +
      '</div>' +
      // Drawer Catatan S/I/A
      '<div id="drawer-note-' + s.id + '" style="margin-top: 10px; display: ' + (isAbsentState ? 'block' : 'none') + ';">' +
        '<input type="text" class="form-input" style="height: 38px; font-size: 14px; width: 100%;" placeholder="Catatan ketidakhadiran (opsional, maks 100 karakter)..." value="' + App.escapeHtml(att.note) + '" oninput="setStudentNote(\'' + s.id + '\', this.value)">' +
      '</div>' +
    '</div>';
  }
  html += '</div>';

  listEl.innerHTML = html;
  updateSummaryText();
}

function setStudentStatus(studentId, status) {
  if (!presensiState.attendanceData[studentId]) {
    presensiState.attendanceData[studentId] = { status: "H", note: "" };
  }
  presensiState.attendanceData[studentId].status = status;
  App.setUnsavedChanges(true);

  // Perbarui UI segmented buttons pada baris terkait
  var rowEl = document.getElementById("row-stu-" + studentId);
  if (rowEl) {
    var btns = rowEl.querySelectorAll(".segmented-btn");
    btns.forEach(function(b) {
      if (b.getAttribute("data-val") === status) {
        b.classList.add("active");
      } else {
        b.classList.remove("active");
      }
    });

    var drawer = document.getElementById("drawer-note-" + studentId);
    if (drawer) {
      drawer.style.display = status !== "H" ? "block" : "none";
    }
  }

  updateSummaryText();
}

function setStudentNote(studentId, note) {
  if (presensiState.attendanceData[studentId]) {
    presensiState.attendanceData[studentId].note = note.substring(0, 100);
    App.setUnsavedChanges(true);
  }
}

function setAllPresent() {
  for (var stId in presensiState.attendanceData) {
    presensiState.attendanceData[stId].status = "H";
    presensiState.attendanceData[stId].note = "";
  }
  App.setUnsavedChanges(true);
  renderStudentAttendanceList();
  App.toast("info", "Semua siswa disetel Hadir");
}

function updateSummaryText() {
  var summaryEl = document.getElementById("summary-counters");
  if (!summaryEl) return;

  var total = presensiState.students.length;
  if (total === 0) {
    summaryEl.textContent = "Pilih penugasan untuk memuat daftar siswa";
    return;
  }

  var h = 0, s = 0, i = 0, a = 0;
  for (var stId in presensiState.attendanceData) {
    var st = presensiState.attendanceData[stId].status;
    if (st === "H") h++;
    else if (st === "S") s++;
    else if (st === "I") i++;
    else if (st === "A") a++;
  }

  summaryEl.innerHTML = total + ' siswa · ' +
    '<span style="color:var(--color-success); font-weight:700;">' + h + ' H</span> · ' +
    '<span style="color:var(--color-info); font-weight:700;">' + s + ' S</span> · ' +
    '<span style="color:var(--color-warning); font-weight:700;">' + i + ' I</span> · ' +
    '<span style="color:var(--color-danger); font-weight:700;">' + a + ' A</span>';
}

function filterStudentList() {
  var q = (document.getElementById("inp-search-student").value || "").toLowerCase().trim();
  var rows = document.querySelectorAll(".student-row");
  rows.forEach(function(row) {
    var name = row.getAttribute("data-name") || "";
    row.style.display = (name.indexOf(q) !== -1) ? "block" : "none";
  });
}

function saveAttendance() {
  var assignId = presensiState.assignmentId;
  var sDate = document.getElementById("inp-session-date").value;
  var lHour = document.getElementById("inp-lesson-hour").value.trim();

  if (!assignId) {
    App.toast("warning", "Pilih kelas & mata pelajaran terlebih dahulu");
    return;
  }
  if (!sDate) {
    App.toast("warning", "Pilih tanggal sesi");
    return;
  }
  if (!lHour) {
    App.toast("warning", "Isi jam pelajaran");
    return;
  }

  var btnTop = document.getElementById("btn-save-attendance-top");
  var btnMob = document.getElementById("btn-save-attendance-mobile");
  if (btnTop) btnTop.disabled = true;
  if (btnMob) btnMob.disabled = true;

  // Siapkan pengecualian (absences: hanya S, I, A)
  var absences = [];
  for (var stId in presensiState.attendanceData) {
    var item = presensiState.attendanceData[stId];
    if (item.status !== "H") {
      absences.push({
        student_id: stId,
        status: item.status,
        note: item.note || ""
      });
    }
  }

  var actionPromise;
  if (presensiState.existingSessionId) {
    actionPromise = API.attendanceUpdate({
      id: presensiState.existingSessionId,
      absences: absences
    });
  } else {
    actionPromise = API.attendanceCreate({
      assignment_id: assignId,
      session_date: sDate,
      lesson_hour: lHour,
      absences: absences
    });
  }

  actionPromise
    .then(function(res) {
      App.setUnsavedChanges(false);
      App.toast("success", "Presensi berhasil disimpan!");

      var createdId = (res && res.id) ? res.id : presensiState.existingSessionId;
      var bannerEl = document.getElementById("post-attendance-banner");
      if (bannerEl) {
        bannerEl.className = "banner banner-info";
        bannerEl.style.display = "flex";
        bannerEl.innerHTML = App.icon("bookOpen", 24) +
          '<div style="flex:1;">' +
            '<strong>Presensi sesi berhasil disimpan.</strong>' +
            '<p style="font-size:13px; margin-top:2px;">Apakah Anda ingin langsung mendokumentasikan kegiatan pembelajaran di Jurnal Mengajar?</p>' +
          '</div>' +
          '<button class="btn btn-primary" style="height:36px; padding:0 12px; font-size:13px;" onclick="App.navigate(\'#/jurnal?create_from=' + (createdId || '') + '&assignment_id=' + assignId + '&session_date=' + sDate + '&lesson_hour=' + encodeURIComponent(lHour) + '\')">' +
            App.icon("plus", 16) + ' Buat Jurnal untuk Sesi Ini' +
          '</button>';
      }
    })
    .catch(function(err) {
      App.toast("danger", err.message || "Gagal menyimpan presensi.");
    })
    .finally(function() {
      if (btnTop) btnTop.disabled = false;
      if (btnMob) btnMob.disabled = false;
    });
}
