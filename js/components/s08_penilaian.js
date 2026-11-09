/**
 * =========================================================================
 * S08: PENILAIAN SISWA
 * File: s08_penilaian.js
 * Deskripsi: Tab Komponen (bobot = 100), Tab Penilaian (input nilai siswa),
 *            kolom nama sticky, simpan batch, validasi 0-100 maks 2 desimal
 * =========================================================================
 */

App.registerRoute("#/penilaian", function(container, queryString) {
  var params = new URLSearchParams(queryString || "");
  var preselectedAssignId = params.get("assignment_id") || "";

  container.innerHTML = '<div class="page-header">' +
    '<div class="page-title-group">' +
      '<h1>Penilaian Siswa</h1>' +
      '<p class="page-subtitle">Kelola komponen nilai, input penilaian, dan rekap capaian</p>' +
    '</div>' +
    '<div class="page-actions">' +
      '<button class="btn btn-secondary" onclick="App.navigate(\'#/rekap-nilai\')">' + App.icon("barChart", 16) + ' Rekap Nilai</button>' +
    '</div>' +
  '</div>' +
  '<div class="card" style="padding: var(--space-4); margin-bottom: var(--space-4);">' +
    '<div class="form-group" style="margin-bottom:0;">' +
      '<label class="form-label" for="penilaian-sel-assign">Pilih Kelas & Mata Pelajaran</label>' +
      '<select id="penilaian-sel-assign" class="form-select" onchange="onPenilaianAssignChange()">' +
        '<option value="">Memuat penugasan...</option>' +
      '</select>' +
    '</div>' +
  '</div>' +
  // Tab Bar
  '<div class="tab-bar">' +
    '<div class="tab-item active" id="tab-btn-komponen" onclick="switchPenilaianTab(\'komponen\')">Komponen & Bobot</div>' +
    '<div class="tab-item" id="tab-btn-penilaian" onclick="switchPenilaianTab(\'penilaian\')">Input Penilaian</div>' +
    '<div class="tab-item" id="tab-btn-rekap" onclick="App.navigate(\'#/rekap-nilai\')">Rekap Nilai</div>' +
  '</div>' +
  '<div id="penilaian-tab-content">' +
    App.emptyState("award", "Pilih Penugasan", "Silakan pilih penugasan mengajar di atas untuk memulai.") +
  '</div>';

  initPenilaian(preselectedAssignId);
});

var penilaianState = {
  assignmentId: "",
  classId: "",
  kkm: 75,
  activeTab: "komponen",
  components: [],
  assessments: [],
  selectedAssessmentId: "",
  students: []
};

function initPenilaian(preselectedId) {
  API.assignmentsList({ page_size: 100 })
    .then(function(res) {
      var assignments = res.items || [];
      var sel = document.getElementById("penilaian-sel-assign");
      if (!sel) return;

      if (assignments.length === 0) {
        sel.innerHTML = '<option value="">Tidak ada penugasan aktif</option>';
        return;
      }

      var html = '<option value="">-- Pilih Penugasan Mengajar --</option>';
      for (var i = 0; i < assignments.length; i++) {
        var a = assignments[i];
        var isSelected = a.id === preselectedId ? " selected" : "";
        html += '<option value="' + a.id + '"' + isSelected + '>' +
          App.escapeHtml(a.class_name + ' · ' + a.subject_name + ' (KKM: ' + a.kkm + ')') +
        '</option>';
      }
      sel.innerHTML = html;

      if (preselectedId) {
        onPenilaianAssignChange();
      }
    });
}

function onPenilaianAssignChange() {
  var sel = document.getElementById("penilaian-sel-assign");
  penilaianState.assignmentId = sel.value;

  if (!penilaianState.assignmentId) {
    document.getElementById("penilaian-tab-content").innerHTML = App.emptyState("award", "Pilih Penugasan", "Pilih penugasan mengajar di atas.");
    return;
  }

  // Muat data komponen & siswa
  loadPenilaianTabData();
}

function switchPenilaianTab(tab) {
  penilaianState.activeTab = tab;
  var btnK = document.getElementById("tab-btn-komponen");
  var btnP = document.getElementById("tab-btn-penilaian");
  if (btnK) btnK.classList.toggle("active", tab === "komponen");
  if (btnP) btnP.classList.toggle("active", tab === "penilaian");

  if (penilaianState.assignmentId) {
    loadPenilaianTabData();
  }
}

function loadPenilaianTabData() {
  var contentEl = document.getElementById("penilaian-tab-content");
  if (!contentEl) return;
  contentEl.innerHTML = App.skeleton("card");

  if (penilaianState.activeTab === "komponen") {
    API.scoreComponentsGet({ assignment_id: penilaianState.assignmentId })
      .then(function(res) {
        penilaianState.components = res.components || [];
        renderKomponenTab();
      })
      .catch(function(err) {
        contentEl.innerHTML = App.errorState(err.message, "loadPenilaianTabData");
      });
  } else if (penilaianState.activeTab === "penilaian") {
    Promise.all([
      API.scoreComponentsGet({ assignment_id: penilaianState.assignmentId }),
      API.assessmentsList({ assignment_id: penilaianState.assignmentId })
    ])
    .then(function(results) {
      penilaianState.components = results[0].components || [];
      penilaianState.assessments = results[1].assessments || [];

      // Pilih penilaian pertama jika ada
      if (!penilaianState.selectedAssessmentId && penilaianState.assessments.length > 0) {
        penilaianState.selectedAssessmentId = penilaianState.assessments[0].id;
      }
      renderPenilaianTab();
    })
    .catch(function(err) {
      contentEl.innerHTML = App.errorState(err.message, "loadPenilaianTabData");
    });
  }
}

// -------------------------------------------------------------------------
// TAB 1: KOMPONEN & BOBOT
// -------------------------------------------------------------------------

function renderKomponenTab() {
  var contentEl = document.getElementById("penilaian-tab-content");
  if (!contentEl) return;

  var comps = penilaianState.components;
  var totalWeight = 0;
  for (var c = 0; c < comps.length; c++) totalWeight += Number(comps[c].weight) || 0;

  var isWeightValid = totalWeight === 100;

  var html = '<div class="card">' +
    '<div class="page-header" style="margin-bottom: var(--space-4);">' +
      '<div>' +
        '<h3>Pengaturan Komponen Nilai</h3>' +
        '<p class="page-subtitle">Tentukan jenis tagihan penilaian dan bobot persentase (Total harus tepat 100%)</p>' +
      '</div>' +
      '<button class="btn btn-secondary" onclick="addKomponenRow()">' + App.icon("plus", 16) + ' Tambah Komponen</button>' +
    '</div>' +
    '<div id="total-weight-indicator" class="banner ' + (isWeightValid ? 'banner-info' : 'banner-warning') + '" style="margin-bottom: var(--space-4);">' +
      App.icon(isWeightValid ? "checkCircle" : "alertCircle", 20) +
      '<div>' +
        '<strong>Total Bobot: <span id="weight-sum-val" class="tabular-nums">' + totalWeight + '</span>%</strong> ' +
        (isWeightValid ? '(Sesuai ketentuan 100%)' : '<span style="color:var(--color-danger); font-weight:600;">(Belum tepat 100%, simpan akan ditolak)</span>') +
      '</div>' +
    '</div>' +
    '<div id="komponen-rows-container" style="display:flex; flex-direction:column; gap: var(--space-3); margin-bottom: var(--space-5);">';

  for (var i = 0; i < comps.length; i++) {
    html += getKomponenRowHtml(i, comps[i].name, comps[i].weight);
  }

  html += '</div>' +
    '<div style="display:flex; justify-content:flex-end;">' +
      '<button id="btn-save-komponen" class="btn btn-primary" onclick="saveKomponen()">' +
        App.icon("checkSquare", 16) + ' Simpan Komponen & Bobot' +
      '</button>' +
    '</div>' +
  '</div>';

  contentEl.innerHTML = html;
}

function getKomponenRowHtml(idx, name, weight) {
  return '<div class="card komponen-row" style="margin-bottom:0; padding: var(--space-3) var(--space-4); display:flex; align-items:center; gap: var(--space-3); flex-wrap:wrap;">' +
    '<div style="font-weight:600; width:24px;">' + (idx + 1) + '.</div>' +
    '<div style="flex:2; min-width:180px;">' +
      '<input type="text" class="form-input comp-name" style="width:100%;" placeholder="Nama Komponen (contoh: Tugas)" value="' + App.escapeHtml(name || '') + '" oninput="recalculateWeights()">' +
    '</div>' +
    '<div style="flex:1; min-width:120px; display:flex; align-items:center; gap:6px;">' +
      '<input type="number" class="form-input comp-weight" style="width:80px; text-align:right;" min="1" max="100" value="' + (weight || 0) + '" oninput="recalculateWeights()">' +
      '<span style="font-weight:600;">%</span>' +
    '</div>' +
    '<button type="button" class="btn-ghost" style="color:var(--color-danger);" onclick="removeKomponenRow(this)" aria-label="Hapus Komponen">' +
      App.icon("trash", 18) +
    '</button>' +
  '</div>';
}

function addKomponenRow() {
  var container = document.getElementById("komponen-rows-container");
  if (!container) return;
  var count = container.querySelectorAll(".komponen-row").length;
  var div = document.createElement("div");
  div.innerHTML = getKomponenRowHtml(count, "", 0);
  container.appendChild(div.firstElementChild);
  recalculateWeights();
}

function removeKomponenRow(btn) {
  var row = btn.closest(".komponen-row");
  if (row) {
    row.remove();
    recalculateWeights();
  }
}

function recalculateWeights() {
  var rows = document.querySelectorAll(".komponen-row");
  var sum = 0;
  rows.forEach(function(r) {
    var wInput = r.querySelector(".comp-weight");
    if (wInput) sum += Number(wInput.value) || 0;
  });

  var valEl = document.getElementById("weight-sum-val");
  if (valEl) valEl.textContent = sum;

  var ind = document.getElementById("total-weight-indicator");
  if (ind) {
    var isValid = sum === 100;
    ind.className = "banner " + (isValid ? "banner-info" : "banner-warning");
    ind.innerHTML = App.icon(isValid ? "checkCircle" : "alertCircle", 20) +
      '<div><strong>Total Bobot: <span id="weight-sum-val" class="tabular-nums">' + sum + '</span>%</strong> ' +
      (isValid ? '(Sesuai ketentuan 100%)' : '<span style="color:var(--color-danger); font-weight:600;">(Belum tepat 100%, simpan akan ditolak)</span>') +
      '</div>';
  }
}

function saveKomponen() {
  var rows = document.querySelectorAll(".komponen-row");
  var comps = [];
  var sum = 0;

  for (var i = 0; i < rows.length; i++) {
    var name = (rows[i].querySelector(".comp-name").value || "").trim();
    var weight = Number(rows[i].querySelector(".comp-weight").value) || 0;
    if (!name) {
      App.toast("warning", "Nama komponen baris " + (i + 1) + " belum diisi");
      return;
    }
    sum += weight;
    comps.push({ name: name, weight: weight });
  }

  if (sum !== 100) {
    App.toast("danger", "Total bobot harus 100, saat ini " + sum);
    return;
  }

  var btn = document.getElementById("btn-save-komponen");
  if (btn) btn.disabled = true;

  API.scoreComponentsSave({
    assignment_id: penilaianState.assignmentId,
    components: comps
  })
  .then(function() {
    App.toast("success", "Komponen dan bobot nilai berhasil disimpan!");
    loadPenilaianTabData();
  })
  .catch(function(err) {
    App.toast("danger", err.message || "Gagal menyimpan komponen.");
  })
  .finally(function() {
    if (btn) btn.disabled = false;
  });
}

// -------------------------------------------------------------------------
// TAB 2: INPUT PENILAIAN PER SISWA
// -------------------------------------------------------------------------

function renderPenilaianTab() {
  var contentEl = document.getElementById("penilaian-tab-content");
  if (!contentEl) return;

  var asms = penilaianState.assessments;
  var comps = penilaianState.components;

  if (comps.length === 0) {
    contentEl.innerHTML = App.emptyState(
      "alertCircle",
      "Belum Ada Komponen Nilai",
      "Atur terlebih dahulu komponen dan bobot nilai pada tab 'Komponen & Bobot' sebelum membuat penilaian.",
      '<button class="btn btn-primary" onclick="switchPenilaianTab(\'komponen\')">Atur Komponen Sekarang</button>'
    );
    return;
  }

  var html = '<div class="card" style="padding: var(--space-4); margin-bottom: var(--space-4);">' +
    '<div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap: var(--space-3);">' +
      '<div style="flex:1; min-width:240px; display:flex; align-items:center; gap:8px;">' +
        '<label class="form-label" style="margin-bottom:0; white-space:nowrap;">Pilih Penilaian:</label>' +
        '<select id="sel-assessment-item" class="form-select" style="flex:1;" onchange="onAssessmentItemChange()">' +
          '<option value="">-- Buat atau Pilih Penilaian --</option>';

  for (var a = 0; a < asms.length; a++) {
    var isSel = asms[a].id === penilaianState.selectedAssessmentId ? " selected" : "";
    html += '<option value="' + asms[a].id + '"' + isSel + '>' +
      App.escapeHtml(asms[a].name + ' (' + asms[a].component_name + ' · ' + asms[a].assessment_date + ')') +
    '</option>';
  }

  html += '</select></div>' +
      '<div style="display:flex; gap:8px;">' +
        '<button class="btn btn-secondary" onclick="openNewAssessmentModal()">' + App.icon("plus", 16) + ' Buat Penilaian Baru</button>' +
        '<button id="btn-save-scores" class="btn btn-primary" onclick="saveStudentScores()">' + App.icon("checkSquare", 16) + ' Simpan Nilai</button>' +
      '</div>' +
    '</div>' +
  '</div>' +
  '<div id="assessment-scores-table-container">' +
    App.skeleton("table") +
  '</div>';

  contentEl.innerHTML = html;
  loadAssessmentScores();
}

function onAssessmentItemChange() {
  var sel = document.getElementById("sel-assessment-item");
  penilaianState.selectedAssessmentId = sel.value;
  loadAssessmentScores();
}

function openNewAssessmentModal() {
  var comps = penilaianState.components;
  var compOptions = "";
  for (var c = 0; c < comps.length; c++) {
    compOptions += '<option value="' + comps[c].id + '">' + App.escapeHtml(comps[c].name) + ' (' + comps[c].weight + '%)</option>';
  }

  var today = new Date().toISOString().split("T")[0];

  var modalBody = '<form id="form-new-asm">' +
    '<div class="form-group">' +
      '<label class="form-label" for="asm-name">Nama Penilaian</label>' +
      '<input type="text" id="asm-name" class="form-input" placeholder="contoh: Ulangan Harian 1" required>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label" for="asm-comp">Kategori Komponen</label>' +
      '<select id="asm-comp" class="form-select" required>' + compOptions + '</select>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label" for="asm-date">Tanggal Penilaian</label>' +
      '<input type="date" id="asm-date" class="form-input" value="' + today + '" required>' +
    '</div>' +
  '</form>';

  App.showModal({
    title: "Buat Penilaian Baru",
    body: modalBody,
    footer: '<button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>' +
            '<button type="button" class="btn btn-primary" onclick="submitNewAssessment()">Buat Penilaian</button>'
  });
}

function submitNewAssessment() {
  var name = (document.getElementById("asm-name").value || "").trim();
  var compId = document.getElementById("asm-comp").value;
  var dateStr = document.getElementById("asm-date").value;

  if (!name || !compId || !dateStr) {
    App.toast("warning", "Semua kolom wajib diisi");
    return;
  }

  API.assessmentsCreate({
    assignment_id: penilaianState.assignmentId,
    component_id: compId,
    name: name,
    assessment_date: dateStr
  })
  .then(function(newAsm) {
    App.closeModal();
    App.toast("success", "Penilaian '" + name + "' berhasil dibuat!");
    penilaianState.selectedAssessmentId = newAsm.id;
    loadPenilaianTabData();
  })
  .catch(function(err) {
    App.toast("danger", err.message || "Gagal membuat penilaian.");
  });
}

function loadAssessmentScores() {
  var container = document.getElementById("assessment-scores-table-container");
  if (!container) return;

  var asmId = penilaianState.selectedAssessmentId;
  if (!asmId) {
    container.innerHTML = App.emptyState("fileText", "Pilih Penilaian", "Pilih penilaian dari menu dropdown di atas atau klik 'Buat Penilaian Baru'.");
    return;
  }

  var currentAsm = penilaianState.assessments.find(function(a) { return a.id === asmId; });
  var existingScores = currentAsm ? (currentAsm.scores || {}) : {};

  // Muat siswa kelas
  var tas = API.assignmentsList({ page_size: 100 }).then(function(res) {
    var match = (res.items || []).find(function(a) { return a.id === penilaianState.assignmentId; });
    var classId = match ? match.class_id : "";

    return API.studentsList({ class_id: classId, status: "aktif", page_size: 100 });
  })
  .then(function(res) {
    var students = res.items || [];
    if (students.length === 0) {
      container.innerHTML = App.emptyState("users", "Tidak Ada Siswa", "Kelas ini belum memiliki siswa aktif.");
      return;
    }

    var html = '<div class="table-responsive" style="max-height: 560px;"><table class="table">' +
      '<thead><tr>' +
        '<th style="width: 40px;">No</th>' +
        '<th class="table-sticky-col">Nama Siswa</th>' +
        '<th>NIS</th>' +
        '<th style="text-align:right; width: 120px;">Nilai (0–100)</th>' +
      '</tr></thead><tbody>';

    for (var i = 0; i < students.length; i++) {
      var s = students[i];
      var val = (existingScores[s.id] !== undefined && existingScores[s.id] !== null) ? existingScores[s.id] : "";

      html += '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td class="table-sticky-col"><strong>' + App.escapeHtml(s.full_name) + '</strong></td>' +
        '<td class="tabular-nums">' + App.escapeHtml(s.nis) + '</td>' +
        '<td style="text-align:right;">' +
          '<input type="number" step="any" min="0" max="100" class="input-score score-entry" data-student-id="' + s.id + '" value="' + val + '" placeholder="-" oninput="App.setUnsavedChanges(true)">' +
        '</td>' +
      '</tr>';
    }

    html += '</tbody></table></div>';
    container.innerHTML = html;
  })
  .catch(function(err) {
    container.innerHTML = App.errorState(err.message, "loadAssessmentScores");
  });
}

function saveStudentScores() {
  var asmId = penilaianState.selectedAssessmentId;
  if (!asmId) {
    App.toast("warning", "Pilih penilaian terlebih dahulu");
    return;
  }

  var entries = document.querySelectorAll(".score-entry");
  var scores = {};
  var hasInvalid = false;

  entries.forEach(function(inp) {
    inp.classList.remove("is-invalid");
    var val = inp.value.trim();
    var stId = inp.getAttribute("data-student-id");

    if (val !== "") {
      var num = Number(val);
      if (isNaN(num) || num < 0 || num > 100) {
        inp.classList.add("is-invalid");
        hasInvalid = true;
      } else {
        // Periksa 2 desimal
        if (val.indexOf(".") !== -1 && val.split(".")[1].length > 2) {
          inp.classList.add("is-invalid");
          hasInvalid = true;
        } else {
          scores[stId] = num;
        }
      }
    } else {
      scores[stId] = null;
    }
  });

  if (hasInvalid) {
    App.toast("danger", "Nilai harus berupa angka 0 sampai 100 dengan maksimal 2 angka di belakang koma.");
    return;
  }

  var btn = document.getElementById("btn-save-scores");
  if (btn) btn.disabled = true;

  API.assessmentsSaveScores({
    id: asmId,
    scores: scores
  })
  .then(function() {
    App.setUnsavedChanges(false);
    App.toast("success", "Nilai seluruh siswa berhasil disimpan!");
  })
  .catch(function(err) {
    App.toast("danger", err.message || "Gagal menyimpan nilai.");
  })
  .finally(function() {
    if (btn) btn.disabled = false;
  });
}
