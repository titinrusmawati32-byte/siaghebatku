/**
 * =========================================================================
 * S15: DATA SISWA (ADMIN)
 * File: s15_siswa.js
 * Deskripsi: Manajemen siswa sekolah, filter kelas & status, pencarian,
 *            modal tambah/ubah siswa, riwayat perpindahan rombel, tombol impor
 * =========================================================================
 */

App.registerRoute("#/siswa", function(container) {
  container.innerHTML = '<div class="page-header">' +
    '<div class="page-title-group">' +
      '<h1>Data Siswa</h1>' +
      '<p class="page-subtitle">Kelola data induk siswa dan rombongan belajar aktif</p>' +
    '</div>' +
    '<div class="page-actions">' +
      '<button class="btn btn-secondary" onclick="App.navigate(\'#/impor-csv\')">' + App.icon("upload", 16) + ' Impor CSV</button>' +
      '<button class="btn btn-primary" onclick="openNewStudentModal()">' + App.icon("plus", 16) + ' Tambah Siswa</button>' +
    '</div>' +
  '</div>' +
  '<div class="card" style="padding: var(--space-4); margin-bottom: var(--space-4);">' +
    '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-3);">' +
      '<div class="form-group" style="margin-bottom:0;">' +
        '<label class="form-label" for="filter-stu-class">Pilih Kelas</label>' +
        '<select id="filter-stu-class" class="form-select" onchange="loadStudentsData(1)">' +
          '<option value="">Semua Kelas</option>' +
        '</select>' +
      '</div>' +
      '<div class="form-group" style="margin-bottom:0;">' +
        '<label class="form-label" for="filter-stu-status">Status Siswa</label>' +
        '<select id="filter-stu-status" class="form-select" onchange="loadStudentsData(1)">' +
          '<option value="aktif">Aktif</option>' +
          '<option value="pindah">Pindah</option>' +
          '<option value="lulus">Lulus</option>' +
          '<option value="keluar">Keluar</option>' +
          '<option value="">Semua Status</option>' +
        '</select>' +
      '</div>' +
      '<div class="form-group" style="margin-bottom:0;">' +
        '<label class="form-label" for="filter-stu-search">Pencarian Siswa</label>' +
        '<input type="text" id="filter-stu-search" class="form-input" placeholder="Cari nama atau NIS..." oninput="debounceStudentSearch()">' +
      '</div>' +
    '</div>' +
  '</div>' +
  '<div id="students-table-container">' +
    App.skeleton("table") +
  '</div>';

  initStudentsScreen();
});

var siswaState = {
  classes: [],
  currentPage: 1,
  pageSize: 50,
  totalPages: 1,
  searchTimer: null
};

function initStudentsScreen() {
  API.classesList({ page_size: 100 })
    .then(function(res) {
      siswaState.classes = res.items || [];
      var sel = document.getElementById("filter-stu-class");
      if (!sel) return;

      var html = '<option value="">Semua Kelas</option>';
      for (var c = 0; c < siswaState.classes.length; c++) {
        html += '<option value="' + siswaState.classes[c].id + '">' + App.escapeHtml(siswaState.classes[c].name) + '</option>';
      }
      sel.innerHTML = html;

      loadStudentsData(1);
    })
    .catch(function() {
      loadStudentsData(1);
    });
}

function debounceStudentSearch() {
  clearTimeout(siswaState.searchTimer);
  siswaState.searchTimer = setTimeout(function() {
    loadStudentsData(1);
  }, 350);
}

function loadStudentsData(page) {
  siswaState.currentPage = page || 1;
  var container = document.getElementById("students-table-container");
  if (!container) return;

  var classId = document.getElementById("filter-stu-class").value;
  var status = document.getElementById("filter-stu-status").value;
  var search = document.getElementById("filter-stu-search").value.trim();

  container.innerHTML = App.skeleton("table");

  API.studentsList({
    class_id: classId,
    status: status,
    search: search,
    page: siswaState.currentPage,
    page_size: siswaState.pageSize
  })
  .then(function(res) {
    var items = res.items || [];
    var total = res.total || 0;
    siswaState.totalPages = Math.ceil(total / siswaState.pageSize) || 1;

    if (items.length === 0) {
      container.innerHTML = App.emptyState("users", "Tidak Ada Data Siswa", "Tidak ditemukan data siswa yang cocok dengan filter.");
      return;
    }

    var html = '<div class="table-responsive"><table class="table">' +
      '<thead><tr>' +
        '<th style="width: 40px;">No</th>' +
        '<th>NIS</th>' +
        '<th>NISN</th>' +
        '<th class="table-sticky-col">Nama Lengkap</th>' +
        '<th>L/P</th>' +
        '<th>Kelas</th>' +
        '<th>Status</th>' +
        '<th style="text-align:right;">Tindakan</th>' +
      '</tr></thead><tbody>';

    var startIndex = (siswaState.currentPage - 1) * siswaState.pageSize;
    for (var i = 0; i < items.length; i++) {
      var s = items[i];
      var statusBadge = s.status === "aktif" ? "badge-success" : (s.status === "pindah" ? "badge-warning" : "badge-neutral");

      html += '<tr>' +
        '<td>' + (startIndex + i + 1) + '</td>' +
        '<td class="tabular-nums"><strong>' + App.escapeHtml(s.nis) + '</strong></td>' +
        '<td class="tabular-nums">' + App.escapeHtml(s.nisn || "-") + '</td>' +
        '<td class="table-sticky-col"><strong>' + App.escapeHtml(s.full_name) + '</strong></td>' +
        '<td>' + s.gender + '</td>' +
        '<td>' + App.escapeHtml(s.class_name || "-") + '</td>' +
        '<td><span class="badge ' + statusBadge + '">' + s.status.toUpperCase() + '</span></td>' +
        '<td style="text-align:right; white-space:nowrap;">' +
          '<button class="btn btn-ghost" style="height:32px; padding:0 8px;" onclick="openEditStudentModal(\'' + s.id + '\')">' + App.icon("edit", 14) + ' Ubah</button>' +
          '<button class="btn btn-ghost" style="height:32px; padding:0 8px; color:var(--color-danger);" onclick="deleteStudent(\'' + s.id + '\', \'' + App.escapeHtml(s.full_name) + '\')">' + App.icon("trash", 14) + ' Hapus</button>' +
        '</td>' +
      '</tr>';
    }

    html += '</tbody></table>' +
      '<div class="pagination">' +
        '<span>Menampilkan ' + (startIndex + 1) + '–' + Math.min(startIndex + items.length, total) + ' dari ' + total + ' siswa</span>' +
        '<div style="display:flex; gap:8px;">' +
          '<button class="btn btn-secondary" style="height:32px; padding:0 12px; font-size:13px;" ' + (siswaState.currentPage <= 1 ? 'disabled' : '') + ' onclick="loadStudentsData(' + (siswaState.currentPage - 1) + ')">Sebelumnya</button>' +
          '<button class="btn btn-secondary" style="height:32px; padding:0 12px; font-size:13px;" ' + (siswaState.currentPage >= siswaState.totalPages ? 'disabled' : '') + ' onclick="loadStudentsData(' + (siswaState.currentPage + 1) + ')">Berikutnya</button>' +
        '</div>' +
      '</div></div>';

    container.innerHTML = html;
  })
  .catch(function(err) {
    container.innerHTML = App.errorState(err.message, function() { loadStudentsData(page); });
  });
}

function openNewStudentModal() {
  var classOpts = "";
  for (var c = 0; c < siswaState.classes.length; c++) {
    classOpts += '<option value="' + siswaState.classes[c].id + '">' + App.escapeHtml(siswaState.classes[c].name) + '</option>';
  }

  var modalBody = '<form id="form-new-stu">' +
    '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">' +
      '<div class="form-group">' +
        '<label class="form-label" for="inp-stu-nis">NIS (Wajib, Unik)</label>' +
        '<input type="text" id="inp-stu-nis" class="form-input" placeholder="contoh: 0012345" required>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label" for="inp-stu-nisn">NISN (Opsional)</label>' +
        '<input type="text" id="inp-stu-nisn" class="form-input" placeholder="contoh: 0098765432">' +
      '</div>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label" for="inp-stu-name">Nama Lengkap Siswa</label>' +
      '<input type="text" id="inp-stu-name" class="form-input" placeholder="contoh: Budi Santoso" maxlength="100" required>' +
    '</div>' +
    '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">' +
      '<div class="form-group">' +
        '<label class="form-label" for="inp-stu-gender">Jenis Kelamin</label>' +
        '<select id="inp-stu-gender" class="form-select" required>' +
          '<option value="L">Laki-laki (L)</option>' +
          '<option value="P">Perempuan (P)</option>' +
        '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label" for="inp-stu-class">Kelas Penempatan</label>' +
        '<select id="inp-stu-class" class="form-select" required>' + classOpts + '</select>' +
      '</div>' +
    '</div>' +
  '</form>';

  App.showModal({
    title: "Tambah Siswa Baru",
    body: modalBody,
    footer: '<button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>' +
            '<button type="button" class="btn btn-primary" onclick="submitNewStudent()">Simpan Siswa</button>'
  });
}

function submitNewStudent() {
  var nis = (document.getElementById("inp-stu-nis").value || "").trim();
  var nisn = (document.getElementById("inp-stu-nisn").value || "").trim();
  var name = (document.getElementById("inp-stu-name").value || "").trim();
  var gender = document.getElementById("inp-stu-gender").value;
  var classId = document.getElementById("inp-stu-class").value;

  if (!nis || !name || !gender || !classId) {
    App.toast("warning", "NIS, Nama, Jenis Kelamin, dan Kelas wajib diisi");
    return;
  }

  API.studentsCreate({
    nis: nis,
    nisn: nisn,
    full_name: name,
    gender: gender,
    class_id: classId
  })
  .then(function() {
    App.closeModal();
    App.toast("success", "Siswa berhasil ditambahkan!");
    loadStudentsData(1);
  })
  .catch(function(err) {
    App.toast("danger", err.message || "Gagal menambahkan siswa.");
  });
}

function openEditStudentModal(studentId) {
  API.studentsList({ search: "", page_size: 200 }).then(function(res) {
    var stu = (res.items || []).find(function(s) { return s.id === studentId; });
    if (!stu) return;

    var classOpts = "";
    for (var c = 0; c < siswaState.classes.length; c++) {
      var isSel = siswaState.classes[c].id === stu.class_id ? " selected" : "";
      classOpts += '<option value="' + siswaState.classes[c].id + '"' + isSel + '>' + App.escapeHtml(siswaState.classes[c].name) + '</option>';
    }

    var modalBody = '<form id="form-edit-stu">' +
      '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">' +
        '<div class="form-group">' +
          '<label class="form-label" for="edit-stu-nis">NIS</label>' +
          '<input type="text" id="edit-stu-nis" class="form-input" value="' + App.escapeHtml(stu.nis) + '" required>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="edit-stu-nisn">NISN</label>' +
          '<input type="text" id="edit-stu-nisn" class="form-input" value="' + App.escapeHtml(stu.nisn || '') + '">' +
        '</div>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label" for="edit-stu-name">Nama Lengkap Siswa</label>' +
        '<input type="text" id="edit-stu-name" class="form-input" value="' + App.escapeHtml(stu.full_name) + '" maxlength="100" required>' +
      '</div>' +
      '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">' +
        '<div class="form-group">' +
          '<label class="form-label" for="edit-stu-gender">Jenis Kelamin</label>' +
          '<select id="edit-stu-gender" class="form-select">' +
            '<option value="L"' + (stu.gender === "L" ? " selected" : "") + '>Laki-laki (L)</option>' +
            '<option value="P"' + (stu.gender === "P" ? " selected" : "") + '>Perempuan (P)</option>' +
          '</select>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="edit-stu-class">Kelas (Rombel)</label>' +
          '<select id="edit-stu-class" class="form-select">' + classOpts + '</select>' +
        '</div>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label" for="edit-stu-status">Status</label>' +
        '<select id="edit-stu-status" class="form-select">' +
          '<option value="aktif"' + (stu.status === "aktif" ? " selected" : "") + '>Aktif</option>' +
          '<option value="pindah"' + (stu.status === "pindah" ? " selected" : "") + '>Pindah</option>' +
          '<option value="lulus"' + (stu.status === "lulus" ? " selected" : "") + '>Lulus</option>' +
          '<option value="keluar"' + (stu.status === "keluar" ? " selected" : "") + '>Keluar</option>' +
        '</select>' +
      '</div>' +
    '</form>';

    App.showModal({
      title: "Ubah Data Siswa",
      body: modalBody,
      footer: '<button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>' +
              '<button type="button" class="btn btn-primary" onclick="submitEditStudent(\'' + stu.id + '\')">Simpan Perubahan</button>'
    });
  });
}

function submitEditStudent(studentId) {
  var nis = (document.getElementById("edit-stu-nis").value || "").trim();
  var nisn = (document.getElementById("edit-stu-nisn").value || "").trim();
  var name = (document.getElementById("edit-stu-name").value || "").trim();
  var gender = document.getElementById("edit-stu-gender").value;
  var classId = document.getElementById("edit-stu-class").value;
  var status = document.getElementById("edit-stu-status").value;

  API.studentsUpdate({
    id: studentId,
    nis: nis,
    nisn: nisn,
    full_name: name,
    gender: gender,
    class_id: classId,
    status: status
  })
  .then(function() {
    App.closeModal();
    App.toast("success", "Data siswa berhasil diperbarui!");
    loadStudentsData(siswaState.currentPage);
  })
  .catch(function(err) {
    App.toast("danger", err.message || "Gagal memperbarui data siswa.");
  });
}

function deleteStudent(studentId, name) {
  if (confirm("Hapus data siswa '" + name + "'? Data presensi dan nilai sebelumnya tetap tersimpan di riwayat.")) {
    API.studentsDelete({ id: studentId })
      .then(function() {
        App.toast("success", "Siswa berhasil dihapus.");
        loadStudentsData(siswaState.currentPage);
      })
      .catch(function(err) {
        App.toast("danger", err.message || "Gagal menghapus siswa.");
      });
  }
}
