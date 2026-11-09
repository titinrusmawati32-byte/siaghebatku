/**
 * =========================================================================
 * S16: IMPOR SISWA DARI CSV (ADMIN)
 * File: s16_impor_csv.js
 * Deskripsi: Parser CSV frontend, validasi batch maks 500 baris, pratinjau
 *            baris valid/tidak valid, simpan batch studentsImportCommit
 * =========================================================================
 */

App.registerRoute("#/impor-csv", function(container) {
  container.innerHTML = '<div class="page-header">' +
    '<div class="page-title-group">' +
      '<h1>Impor Siswa dari CSV</h1>' +
      '<p class="page-subtitle">Unggah atau tempel berkas data siswa format CSV (Maksimal 500 baris)</p>' +
    '</div>' +
    '<div class="page-actions">' +
      '<button class="btn btn-secondary" onclick="App.navigate(\'#/siswa\')">' + App.icon("users", 16) + ' Kembali ke Data Siswa</button>' +
    '</div>' +
  '</div>' +
  '<div class="card">' +
    '<h3 style="margin-bottom: var(--space-2);">Format Kolom CSV</h3>' +
    '<p style="font-size: var(--font-size-small); color: var(--color-text-muted); margin-bottom: var(--space-4);">' +
      'Baris pertama harus berisi header: <code>nis,nisn,nama,jenis_kelamin,nama_kelas</code><br>' +
      'Contoh isi:<br>' +
      '<code>0012345,0098765432,Budi Santoso,L,7A</code><br>' +
      '<code>0012346,0098765433,Siti Aminah,P,7A</code>' +
    '</p>' +
    '<div class="form-group">' +
      '<label class="form-label" for="csv-file-input">Pilih File CSV dari Komputer</label>' +
      '<input type="file" id="csv-file-input" class="form-input" accept=".csv,text/csv" onchange="handleCsvFile(this)">' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label" for="csv-text-input">Atau Tempel (Paste) Teks CSV di Bawah</label>' +
      '<textarea id="csv-text-input" class="form-textarea" style="min-height: 120px; font-family: monospace; font-size: 13px;" placeholder="nis,nisn,nama,jenis_kelamin,nama_kelas&#10;0012345,0098765432,Budi Santoso,L,7A"></textarea>' +
    '</div>' +
    '<div style="display: flex; justify-content: flex-end; gap: var(--space-3);">' +
      '<button type="button" id="btn-parse-csv" class="btn btn-primary" onclick="parseAndPreviewCsv()">' +
        App.icon("checkSquare", 16) + ' <span>Periksa & Pratinjau CSV</span>' +
      '</button>' +
    '</div>' +
  '</div>' +
  '<div id="csv-preview-container" style="display: none;"></div>';
});

var parsedValidRows = [];

function handleCsvFile(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById("csv-text-input").value = e.target.result;
      parseAndPreviewCsv();
    };
    reader.readAsText(input.files[0], "UTF-8");
  }
}

function parseAndPreviewCsv() {
  var rawText = (document.getElementById("csv-text-input").value || "").trim();
  if (!rawText) {
    App.toast("warning", "Isi atau pilih berkas CSV terlebih dahulu");
    return;
  }

  var lines = rawText.split(/\r?\n/).filter(function(line) { return line.trim() !== ""; });
  if (lines.length <= 1) {
    App.toast("warning", "CSV harus memiliki header dan setidaknya satu baris data");
    return;
  }

  if (lines.length - 1 > 500) {
    App.toast("danger", "Maksimal 500 baris per impor (saat ini " + (lines.length - 1) + " baris)");
    return;
  }

  var headerLine = lines[0].split(",").map(function(h) { return h.trim().toLowerCase(); });
  var rows = [];

  for (var i = 1; i < lines.length; i++) {
    var cols = lines[i].split(",").map(function(c) { return c.trim(); });
    var obj = {};
    for (var c = 0; c < headerLine.length; c++) {
      obj[headerLine[c]] = cols[c] || "";
    }
    rows.push(obj);
  }

  var btn = document.getElementById("btn-parse-csv");
  if (btn) btn.disabled = true;

  var previewContainer = document.getElementById("csv-preview-container");
  previewContainer.style.display = "block";
  previewContainer.innerHTML = App.skeleton("table");

  API.studentsImportPreview({ rows: rows })
    .then(function(res) {
      parsedValidRows = [];
      var items = res.items || [];

      var html = '<div class="card">' +
        '<div class="page-header" style="margin-bottom: var(--space-4);">' +
          '<div>' +
            '<h3>Hasil Pratinjau Validasi CSV</h3>' +
            '<p class="page-subtitle">Total ' + res.total + ' baris: <span style="color:var(--color-success); font-weight:700;">' + res.valid_count + ' valid</span>, <span style="color:var(--color-danger); font-weight:700;">' + res.invalid_count + ' bermasalah</span></p>' +
          '</div>' +
          '<div>' +
            '<button id="btn-commit-csv" class="btn btn-primary" ' + (res.valid_count === 0 ? 'disabled' : '') + ' onclick="commitValidCsv()">' +
              App.icon("upload", 16) + ' Impor ' + res.valid_count + ' Baris Valid' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="table-responsive" style="max-height: 480px;"><table class="table">' +
          '<thead><tr>' +
            '<th style="width: 40px;">Baris</th>' +
            '<th>NIS</th>' +
            '<th>NISN</th>' +
            '<th>Nama Siswa</th>' +
            '<th>L/P</th>' +
            '<th>Kelas</th>' +
            '<th>Status Validasi</th>' +
          '</tr></thead><tbody>';

      for (var r = 0; r < items.length; r++) {
        var it = items[r];
        if (it.is_valid) {
          parsedValidRows.push({
            nis: it.nis,
            nisn: it.nisn,
            full_name: it.full_name,
            gender: it.gender,
            class_id: it.class_id
          });
        }

        var statusCell = it.is_valid
          ? '<span class="badge badge-success">Valid</span>'
          : '<span class="badge badge-danger" title="' + App.escapeHtml(it.errors.join(", ")) + '">' + App.escapeHtml(it.errors.join("; ")) + '</span>';

        html += '<tr style="' + (!it.is_valid ? 'background-color: var(--color-danger-bg);' : '') + '">' +
          '<td>' + it.row_number + '</td>' +
          '<td class="tabular-nums"><strong>' + App.escapeHtml(it.nis) + '</strong></td>' +
          '<td class="tabular-nums">' + App.escapeHtml(it.nisn || "-") + '</td>' +
          '<td><strong>' + App.escapeHtml(it.full_name) + '</strong></td>' +
          '<td>' + App.escapeHtml(it.gender) + '</td>' +
          '<td>' + App.escapeHtml(it.class_name) + '</td>' +
          '<td>' + statusCell + '</td>' +
        '</tr>';
      }

      html += '</tbody></table></div></div>';
      previewContainer.innerHTML = html;
    })
    .catch(function(err) {
      previewContainer.innerHTML = App.errorState(err.message, "parseAndPreviewCsv");
    })
    .finally(function() {
      if (btn) btn.disabled = false;
    });
}

function commitValidCsv() {
  if (parsedValidRows.length === 0) {
    App.toast("warning", "Tidak ada baris valid untuk diimpor");
    return;
  }

  if (confirm("Impor " + parsedValidRows.length + " data siswa valid ke database?")) {
    var btn = document.getElementById("btn-commit-csv");
    if (btn) btn.disabled = true;

    API.studentsImportCommit({ items: parsedValidRows })
      .then(function(res) {
        App.toast("success", res.imported_count + " siswa berhasil diimpor!");
        setTimeout(function() {
          App.navigate("#/siswa");
        }, 800);
      })
      .catch(function(err) {
        App.toast("danger", err.message || "Gagal mengimpor siswa.");
      })
      .finally(function() {
        if (btn) btn.disabled = false;
      });
  }
}
