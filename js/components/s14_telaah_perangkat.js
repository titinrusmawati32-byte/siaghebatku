/**
 * =========================================================================
 * S14: TELAAH PERANGKAT AJAR (KEPALA SEKOLAH)
 * File: s14_telaah_perangkat.js
 * Deskripsi: Antrean telaah Modul Ajar/RPP guru, buka tautan Drive,
 *            aksi Setujui atau Perlu Revisi (+ catatan wajib), validasi inline
 * =========================================================================
 */

App.registerRoute("#/telaah-perangkat", function(container) {
  container.innerHTML = '<div class="page-header">' +
    '<div class="page-title-group">' +
      '<h1>Telaah Perangkat Ajar</h1>' +
      '<p class="page-subtitle">Verifikasi dan telaah Modul Ajar, RPP, dan ATP yang diajukan guru</p>' +
    '</div>' +
  '</div>' +
  '<div class="tab-bar">' +
    '<div class="tab-item active" id="tab-telaah-antrean" onclick="filterTelaahTab(\'diajukan\')">Menunggu Telaah</div>' +
    '<div class="tab-item" id="tab-telaah-riwayat" onclick="filterTelaahTab(\'\')">Semua Perangkat Ajar</div>' +
  '</div>' +
  '<div id="telaah-content-container">' +
    App.skeleton("table") +
  '</div>';

  loadTelaahMaterials("diajukan");
});

var telaahActiveStatus = "diajukan";

function filterTelaahTab(status) {
  telaahActiveStatus = status;
  var btnA = document.getElementById("tab-telaah-antrean");
  var btnR = document.getElementById("tab-telaah-riwayat");
  if (btnA) btnA.classList.toggle("active", status === "diajukan");
  if (btnR) btnR.classList.toggle("active", status === "");
  loadTelaahMaterials(status);
}

function loadTelaahMaterials(status) {
  var container = document.getElementById("telaah-content-container");
  if (!container) return;

  container.innerHTML = App.skeleton("table");

  API.materialsList({ status: status, page_size: 100 })
    .then(function(res) {
      var items = res.items || [];

      if (items.length === 0) {
        container.innerHTML = App.emptyState(
          "checkCircle",
          status === "diajukan" ? "Semua Perangkat Sudah Ditelaah" : "Belum Ada Perangkat Ajar",
          status === "diajukan" ? "Tidak ada perangkat ajar yang sedang menunggu persetujuan Anda." : "Belum ada perangkat ajar yang diajukan guru."
        );
        return;
      }

      var html = '<div class="table-responsive"><table class="table">' +
        '<thead><tr>' +
          '<th>Judul</th>' +
          '<th>Nama Guru</th>' +
          '<th>Jenis</th>' +
          '<th>Mata Pelajaran</th>' +
          '<th>Status</th>' +
          '<th>Tautan Berkas</th>' +
          '<th style="text-align:right;">Keputusan Telaah</th>' +
        '</tr></thead><tbody>';

      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var badgeClass = it.status === "diajukan" ? "badge-info" : (it.status === "disetujui" ? "badge-success" : (it.status === "perlu_revisi" ? "badge-warning" : "badge-neutral"));
        var typeLabel = it.type === "modul_ajar" ? "Modul Ajar" : (it.type === "rpp" ? "RPP" : (it.type === "atp" ? "ATP" : "Lainnya"));

        var actionsHtml = "";
        if (it.status === "diajukan") {
          actionsHtml = '<div style="display:flex; justify-content:flex-end; gap:6px;">' +
            '<button class="btn btn-primary" style="height:32px; padding:0 10px; font-size:12px;" onclick="approveMaterial(\'' + it.id + '\')">' + App.icon("checkSquare", 14) + ' Setujui</button>' +
            '<button class="btn btn-secondary" style="height:32px; padding:0 10px; font-size:12px; color:var(--color-warning-text);" onclick="openRevisionModal(\'' + it.id + '\')">' + App.icon("edit", 14) + ' Perlu Revisi</button>' +
          '</div>';
        } else {
          actionsHtml = '<span style="font-size:12px; color:var(--color-text-muted);">' + (it.review_note ? App.escapeHtml(it.review_note) : 'Selesai ditelaah') + '</span>';
        }

        html += '<tr>' +
          '<td><strong>' + App.escapeHtml(it.title) + '</strong></td>' +
          '<td>' + App.escapeHtml(it.teacher_name || "-") + '</td>' +
          '<td><span class="badge badge-neutral">' + typeLabel + '</span></td>' +
          '<td>' + App.escapeHtml(it.subject_name || "-") + '</td>' +
          '<td><span class="badge ' + badgeClass + '">' + it.status.toUpperCase() + '</span></td>' +
          '<td><a href="' + App.escapeHtml(it.drive_url) + '" target="_blank" rel="noopener" class="btn-ghost" style="padding:0 4px; display:inline-flex; align-items:center; gap:4px;">' + App.icon("externalLink", 14) + ' Buka Drive</a></td>' +
          '<td style="text-align:right;">' + actionsHtml + '</td>' +
        '</tr>';
      }

      html += '</tbody></table></div>';
      container.innerHTML = html;
    })
    .catch(function(err) {
      container.innerHTML = App.errorState(err.message, function() { loadTelaahMaterials(status); });
    });
}

function approveMaterial(matId) {
  if (confirm("Setujui perangkat ajar ini?")) {
    API.materialsReview({
      id: matId,
      status: "disetujui",
      review_note: "Disetujui tanpa catatan"
    })
    .then(function() {
      App.toast("success", "Perangkat ajar berhasil disetujui!");
      loadTelaahMaterials(telaahActiveStatus);
    })
    .catch(function(err) {
      App.toast("danger", err.message || "Gagal menyetujui.");
    });
  }
}

function openRevisionModal(matId) {
  var modalBody = '<form id="form-revisi">' +
    '<div class="form-group">' +
      '<label class="form-label" for="inp-revisi-note">Catatan Perbaikan / Masukan Guru (Wajib diisi)</label>' +
      '<textarea id="inp-revisi-note" class="form-textarea" style="min-height:120px;" placeholder="Tuliskan alasan perlu revisi, misal: Tujuan pembelajaran belum terukur, atau hak akses link Drive belum dibuka..." maxlength="500" required></textarea>' +
      '<div class="form-help">Maksimal 500 karakter. Catatan ini akan langsung terlihat oleh guru penyusun.</div>' +
    '</div>' +
  '</form>';

  App.showModal({
    title: "Minta Revisi Perangkat Ajar",
    body: modalBody,
    footer: '<button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>' +
            '<button type="button" class="btn btn-primary" style="background-color:var(--color-warning);" onclick="submitRevision(\'' + matId + '\')">Kirim Catatan Revisi</button>'
  });
}

function submitRevision(matId) {
  var note = (document.getElementById("inp-revisi-note").value || "").trim();
  if (!note) {
    App.toast("warning", "Catatan revisi wajib diisi");
    return;
  }

  API.materialsReview({
    id: matId,
    status: "perlu_revisi",
    review_note: note
  })
  .then(function() {
    App.closeModal();
    App.toast("info", "Catatan revisi telah dikirim ke guru.");
    loadTelaahMaterials(telaahActiveStatus);
  })
  .catch(function(err) {
    App.toast("danger", err.message || "Gagal mengirim telaah.");
  });
}
