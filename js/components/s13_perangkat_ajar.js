/**
 * =========================================================================
 * S13: PERANGKAT AJAR (GURU)
 * File: s13_perangkat_ajar.js
 * Deskripsi: RPP/Modul Ajar/ATP guru, tautan Google Drive, alur status
 *            draft -> diajukan -> disetujui / perlu_revisi, catatan telaah
 * =========================================================================
 */

App.registerRoute("#/perangkat-ajar", function(container) {
  container.innerHTML = '<div class="page-header">' +
    '<div class="page-title-group">' +
      '<h1>Perangkat Ajar</h1>' +
      '<p class="page-subtitle">Pendaftaran RPP, Modul Ajar, dan ATP untuk ditelaah Kepala Sekolah</p>' +
    '</div>' +
    '<div class="page-actions">' +
      '<button class="btn btn-primary" onclick="openNewMaterialModal()">' + App.icon("plus", 16) + ' Tambah Perangkat Ajar</button>' +
    '</div>' +
  '</div>' +
  '<div class="card" style="padding: var(--space-4); margin-bottom: var(--space-4);">' +
    '<div style="display:flex; align-items:center; gap: var(--space-3);">' +
      '<label class="form-label" style="margin-bottom:0;">Filter Status:</label>' +
      '<select id="mat-filter-status" class="form-select" style="max-width:200px;" onchange="loadTeacherMaterials()">' +
        '<option value="">Semua Status</option>' +
        '<option value="draft">Draft</option>' +
        '<option value="diajukan">Menunggu Telaah (Diajukan)</option>' +
        '<option value="disetujui">Disetujui</option>' +
        '<option value="perlu_revisi">Perlu Revisi</option>' +
      '</select>' +
    '</div>' +
  '</div>' +
  '<div id="teacher-materials-container">' +
    App.skeleton("table") +
  '</div>';

  initTeacherMaterials();
});

var materialState = {
  materials: [],
  subjects: []
};

function initTeacherMaterials() {
  API.subjectsList({ page_size: 100 })
    .then(function(res) {
      materialState.subjects = res.items || [];
      loadTeacherMaterials();
    })
    .catch(function() {
      loadTeacherMaterials();
    });
}

function loadTeacherMaterials() {
  var container = document.getElementById("teacher-materials-container");
  if (!container) return;

  var status = document.getElementById("mat-filter-status").value;
  container.innerHTML = App.skeleton("table");

  API.materialsList({ status: status, page_size: 100 })
    .then(function(res) {
      materialState.materials = res.items || [];

      if (materialState.materials.length === 0) {
        container.innerHTML = App.emptyState(
          "folder",
          "Belum Ada Perangkat Ajar",
          "Daftarkan tautan Modul Ajar atau RPP Google Drive Anda untuk ditelaah Kepala Sekolah.",
          '<button class="btn btn-primary" onclick="openNewMaterialModal()">' + App.icon("plus", 16) + ' Tambah Sekarang</button>'
        );
        return;
      }

      var html = '<div class="table-responsive"><table class="table">' +
        '<thead><tr>' +
          '<th>Judul</th>' +
          '<th>Jenis</th>' +
          '<th>Mata Pelajaran</th>' +
          '<th>Status</th>' +
          '<th>Tautan Drive</th>' +
          '<th>Catatan Telaah</th>' +
          '<th style="text-align:right;">Tindakan</th>' +
        '</tr></thead><tbody>';

      for (var m = 0; m < materialState.materials.length; m++) {
        var it = materialState.materials[m];
        var badgeClass = "badge-neutral";
        var statusLabel = "Draft";

        if (it.status === "diajukan") {
          badgeClass = "badge-info";
          statusLabel = "Diajukan";
        } else if (it.status === "disetujui") {
          badgeClass = "badge-success";
          statusLabel = "Disetujui";
        } else if (it.status === "perlu_revisi") {
          badgeClass = "badge-warning";
          statusLabel = "Perlu Revisi";
        }

        var typeLabel = it.type === "modul_ajar" ? "Modul Ajar" : (it.type === "rpp" ? "RPP" : (it.type === "atp" ? "ATP" : "Lainnya"));

        var actionsHtml = "";
        if (it.status === "draft" || it.status === "perlu_revisi") {
          actionsHtml += '<button class="btn btn-secondary" style="height:32px; padding:0 8px; font-size:12px; margin-right:4px;" onclick="submitMaterialForReview(\'' + it.id + '\')">' + App.icon("upload", 14) + ' Ajukan</button>';
        }
        if (it.status !== "diajukan") {
          actionsHtml += '<button class="btn btn-ghost" style="height:32px; padding:0 8px; font-size:12px;" onclick="openEditMaterialModal(\'' + it.id + '\')">' + App.icon("edit", 14) + ' Ubah</button>';
        } else {
          actionsHtml += '<span style="font-size:12px; color:var(--color-text-muted);">Sedang ditelaah</span>';
        }

        html += '<tr>' +
          '<td><strong>' + App.escapeHtml(it.title) + '</strong></td>' +
          '<td><span class="badge badge-neutral">' + typeLabel + '</span></td>' +
          '<td>' + App.escapeHtml(it.subject_name || "-") + '</td>' +
          '<td><span class="badge ' + badgeClass + '">' + statusLabel + '</span></td>' +
          '<td><a href="' + App.escapeHtml(it.drive_url) + '" target="_blank" rel="noopener" class="btn-ghost" style="padding:0 4px; display:inline-flex; align-items:center; gap:4px;">' + App.icon("externalLink", 14) + ' Buka Drive</a></td>' +
          '<td style="max-width:200px; font-size:12px; color:' + (it.status === 'perlu_revisi' ? 'var(--color-warning-text)' : 'inherit') + ';">' + (it.review_note ? App.escapeHtml(it.review_note) : '-') + '</td>' +
          '<td style="text-align:right; white-space:nowrap;">' + actionsHtml + '</td>' +
        '</tr>';
      }

      html += '</tbody></table></div>';
      container.innerHTML = html;
    })
    .catch(function(err) {
      container.innerHTML = App.errorState(err.message, "loadTeacherMaterials");
    });
}

function openNewMaterialModal() {
  var subOptions = "";
  for (var s = 0; s < materialState.subjects.length; s++) {
    subOptions += '<option value="' + materialState.subjects[s].id + '">' + App.escapeHtml(materialState.subjects[s].name) + '</option>';
  }

  var modalBody = '<form id="form-new-mat">' +
    '<div class="form-group">' +
      '<label class="form-label" for="inp-mat-title">Judul Perangkat Ajar</label>' +
      '<input type="text" id="inp-mat-title" class="form-input" placeholder="contoh: Modul Ajar Persamaan Linear Kelas 7" maxlength="150" required>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label" for="inp-mat-type">Jenis Perangkat</label>' +
      '<select id="inp-mat-type" class="form-select" required>' +
        '<option value="modul_ajar">Modul Ajar</option>' +
        '<option value="rpp">RPP</option>' +
        '<option value="atp">ATP (Alur Tujuan Pembelajaran)</option>' +
        '<option value="lainnya">Lainnya</option>' +
      '</select>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label" for="inp-mat-subject">Mata Pelajaran</label>' +
      '<select id="inp-mat-subject" class="form-select" required>' + subOptions + '</select>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label" for="inp-mat-url">Tautan Google Drive (Wajib diawali https://)</label>' +
      '<input type="url" id="inp-mat-url" class="form-input" placeholder="https://drive.google.com/file/d/..." required>' +
      '<div class="form-help">Pastikan setelan berbagi di Google Drive sudah "Siapa saja yang memiliki tautan dapat melihat".</div>' +
    '</div>' +
  '</form>';

  App.showModal({
    title: "Tambah Perangkat Ajar",
    body: modalBody,
    footer: '<button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>' +
            '<button type="button" class="btn btn-primary" onclick="submitNewMaterial()">Simpan Draft</button>'
  });
}

function submitNewMaterial() {
  var title = (document.getElementById("inp-mat-title").value || "").trim();
  var type = document.getElementById("inp-mat-type").value;
  var subId = document.getElementById("inp-mat-subject").value;
  var driveUrl = (document.getElementById("inp-mat-url").value || "").trim();

  if (!title || !type || !subId || !driveUrl) {
    App.toast("warning", "Semua kolom wajib diisi");
    return;
  }

  if (!/^https:\/\//i.test(driveUrl)) {
    App.toast("warning", "Tautan Google Drive harus diawali https://");
    return;
  }

  API.materialsCreate({
    title: title,
    type: type,
    subject_id: subId,
    drive_url: driveUrl
  })
  .then(function() {
    App.closeModal();
    App.toast("success", "Perangkat ajar berhasil disimpan sebagai draft!");
    loadTeacherMaterials();
  })
  .catch(function(err) {
    App.toast("danger", err.message || "Gagal menyimpan perangkat ajar.");
  });
}

function openEditMaterialModal(materialId) {
  var item = materialState.materials.find(function(m) { return m.id === materialId; });
  if (!item) return;

  var subOptions = "";
  for (var s = 0; s < materialState.subjects.length; s++) {
    var isSel = materialState.subjects[s].id === item.subject_id ? " selected" : "";
    subOptions += '<option value="' + materialState.subjects[s].id + '"' + isSel + '>' + App.escapeHtml(materialState.subjects[s].name) + '</option>';
  }

  var isApprovedOrReview = item.status === "disetujui" || item.status === "perlu_revisi";

  var modalBody = '<form id="form-edit-mat">' +
    (isApprovedOrReview ? '<div class="banner banner-warning" style="margin-bottom:12px;">' + App.icon("alertCircle", 18) + ' Menyimpan perubahan pada perangkat ajar ini akan mengembalikan status ke Draft.</div>' : '') +
    '<div class="form-group">' +
      '<label class="form-label" for="edit-mat-title">Judul Perangkat Ajar</label>' +
      '<input type="text" id="edit-mat-title" class="form-input" value="' + App.escapeHtml(item.title) + '" maxlength="150" required>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label" for="edit-mat-type">Jenis Perangkat</label>' +
      '<select id="edit-mat-type" class="form-select" required>' +
        '<option value="modul_ajar"' + (item.type === "modul_ajar" ? " selected" : "") + '>Modul Ajar</option>' +
        '<option value="rpp"' + (item.type === "rpp" ? " selected" : "") + '>RPP</option>' +
        '<option value="atp"' + (item.type === "atp" ? " selected" : "") + '>ATP</option>' +
        '<option value="lainnya"' + (item.type === "lainnya" ? " selected" : "") + '>Lainnya</option>' +
      '</select>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label" for="edit-mat-url">Tautan Google Drive</label>' +
      '<input type="url" id="edit-mat-url" class="form-input" value="' + App.escapeHtml(item.drive_url) + '" required>' +
    '</div>' +
  '</form>';

  App.showModal({
    title: "Ubah Perangkat Ajar",
    body: modalBody,
    footer: '<button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>' +
            '<button type="button" class="btn btn-primary" onclick="submitEditMaterial(\'' + item.id + '\')">Simpan Perubahan</button>'
  });
}

function submitEditMaterial(matId) {
  var title = (document.getElementById("edit-mat-title").value || "").trim();
  var type = document.getElementById("edit-mat-type").value;
  var driveUrl = (document.getElementById("edit-mat-url").value || "").trim();

  if (!title || !type || !driveUrl) {
    App.toast("warning", "Semua kolom wajib diisi");
    return;
  }

  if (!/^https:\/\//i.test(driveUrl)) {
    App.toast("warning", "Tautan Google Drive harus diawali https://");
    return;
  }

  API.materialsUpdate({
    id: matId,
    title: title,
    type: type,
    drive_url: driveUrl
  })
  .then(function() {
    App.closeModal();
    App.toast("success", "Perangkat ajar berhasil diperbarui!");
    loadTeacherMaterials();
  })
  .catch(function(err) {
    App.toast("danger", err.message || "Gagal mengubah perangkat ajar.");
  });
}

function submitMaterialForReview(matId) {
  if (confirm("Ajukan perangkat ajar ini ke Kepala Sekolah untuk ditelaah?")) {
    API.materialsSubmit({ id: matId })
      .then(function() {
        App.toast("success", "Perangkat ajar berhasil diajukan!");
        loadTeacherMaterials();
      })
      .catch(function(err) {
        App.toast("danger", err.message || "Gagal mengajukan.");
      });
  }
}
