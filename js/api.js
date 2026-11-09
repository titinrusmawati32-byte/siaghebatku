/**
 * =========================================================================
 * APLIKASI ADMINISTRASI GURU (SIAG) - API CLIENT
 * File: api.js
 * Deskripsi: Satu-satunya pemanggil fetch; URL Web App terpusat di sini;
 *            Router 62 action, penanganan sesi lokal dan redirect otomatis
 * Rujukan: API_SPEC.md Bagian 1, 1.1, 1.2, 1.3, 15 dan ANTIGRAVITY_PROMPT.md
 * =========================================================================
 */

var API = (function() {
  // URL Web App Google Apps Script (ganti dengan URL deployment Anda)
  var WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyzMkTKrcxUsKCsCHZI-q4BI0LrT-kjiTiAmp_cbHCYf9AeJua9mWXg8PsQ4XsIY6jc/exec";

  var SESSION_KEY = "siag_session";

  // =========================================================================
  // MANAJEMEN SESI LOKAL (localStorage)
  // =========================================================================

  function getSession() {
    try {
      var item = localStorage.getItem(SESSION_KEY);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      return null;
    }
  }

  function setSession(sessionData) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } catch (e) {}
  }

  function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }

  function getSessionToken() {
    var s = getSession();
    return s ? s.token : null;
  }

  function getCurrentUser() {
    var s = getSession();
    return s ? s.user : null;
  }

  function setApiUrl(url) {
    if (url && typeof url === "string") {
      WEB_APP_URL = url.trim();
    }
  }

  function getApiUrl() {
    return WEB_APP_URL;
  }

  // =========================================================================
  // GENERIK CALL FETCH (POST dengan body JSON, Content-Type text/plain)
  // =========================================================================

  function call(action, params) {
    params = params || {};

    // Khusus GET publicInfo bila URL belum disetel atau uji lokal
    if (action === "publicInfo" && !params.forcePost) {
      // Boleh menggunakan GET
      var getUrl = WEB_APP_URL + (WEB_APP_URL.indexOf("?") === -1 ? "?" : "&") + "action=publicInfo";
      return fetch(getUrl, {
        method: "GET",
        redirect: "follow"
      })
      .then(function(res) { return res.json(); })
      .then(function(json) {
        if (json.ok) return json.data;
        throw json.error;
      })
      .catch(function(err) {
        if (err && err.code) throw err;
        throw { code: "NETWORK_ERROR", message: "Tidak dapat terhubung ke server, coba lagi" };
      });
    }

    // Untuk action selain publicInfo & authLogin, lampirkan token di body
    var bodyPayload = Object.assign({}, params);
    if (action !== "authLogin" && action !== "publicInfo") {
      var token = getSessionToken();
      if (token) {
        bodyPayload.token = token;
      }
    }

    var postUrl = WEB_APP_URL + (WEB_APP_URL.indexOf("?") === -1 ? "?" : "&") + "action=" + encodeURIComponent(action);

    return fetch(postUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(bodyPayload),
      redirect: "follow"
    })
    .then(function(res) {
      if (!res.ok) {
        throw { code: "INTERNAL_ERROR", message: "Respons server tidak normal: HTTP " + res.status };
      }
      return res.json();
    })
    .then(function(json) {
      if (json && json.ok) {
        return json.data;
      }

      var err = (json && json.error) ? json.error : { code: "INTERNAL_ERROR", message: "Terjadi kesalahan pada server" };

      // Tangani sesi berakhir / kedaluwarsa
      if (err.code === "UNAUTHORIZED" && (err.message === "Sesi berakhir" || err.message === "Token tidak valid")) {
        clearSession();
        window.location.hash = "#/login";
      }

      throw err;
    })
    .catch(function(err) {
      if (err && err.code) {
        throw err;
      }
      throw { code: "NETWORK_ERROR", message: "Tidak dapat terhubung ke server, coba lagi" };
    });
  }

  // =========================================================================
  // FUNGSI API PERSIS 62 ACTION DARI API_SPEC.md BAGIAN 15
  // =========================================================================

  return {
    // Sesi & Konfigurasi
    getSession: getSession,
    setSession: setSession,
    clearSession: clearSession,
    getSessionToken: getSessionToken,
    getCurrentUser: getCurrentUser,
    setApiUrl: setApiUrl,
    getApiUrl: getApiUrl,
    call: call,

    // 1. Publik & Autentikasi
    publicInfo: function() { return call("publicInfo"); },
    authLogin: function(params) {
      return call("authLogin", params).then(function(data) {
        setSession({
          token: data.token,
          expires_at: data.expires_at,
          user: data.user
        });
        return data;
      });
    },
    authLogout: function() {
      return call("authLogout").finally(function() {
        clearSession();
      });
    },
    authMe: function() { return call("authMe"); },
    authChangePassword: function(params) { return call("authChangePassword", params); },

    // 2. Manajemen Pengguna (Admin)
    usersList: function(params) { return call("usersList", params); },
    usersCreate: function(params) { return call("usersCreate", params); },
    usersUpdate: function(params) { return call("usersUpdate", params); },
    usersResetPassword: function(params) { return call("usersResetPassword", params); },

    // 3. Pengaturan Sekolah (Admin)
    settingsGet: function() { return call("settingsGet"); },
    settingsUpdate: function(params) { return call("settingsUpdate", params); },

    // 4. Data Master: Semester & Kunci Semester
    semestersList: function(params) { return call("semestersList", params); },
    semestersCreate: function(params) { return call("semestersCreate", params); },
    semestersActivate: function(params) { return call("semestersActivate", params); },
    semestersLock: function(params) { return call("semestersLock", params); },
    semestersUnlock: function(params) { return call("semestersUnlock", params); },

    // 5. Data Master: Mata Pelajaran
    subjectsList: function(params) { return call("subjectsList", params); },
    subjectsCreate: function(params) { return call("subjectsCreate", params); },
    subjectsUpdate: function(params) { return call("subjectsUpdate", params); },
    subjectsDelete: function(params) { return call("subjectsDelete", params); },

    // 6. Data Master: Kelas
    classesList: function(params) { return call("classesList", params); },
    classesCreate: function(params) { return call("classesCreate", params); },
    classesUpdate: function(params) { return call("classesUpdate", params); },
    classesDelete: function(params) { return call("classesDelete", params); },

    // 7. Data Master: Guru
    teachersList: function(params) { return call("teachersList", params); },
    teachersUpdate: function(params) { return call("teachersUpdate", params); },

    // 8. Data Master: Siswa & Impor CSV
    studentsList: function(params) { return call("studentsList", params); },
    studentsCreate: function(params) { return call("studentsCreate", params); },
    studentsUpdate: function(params) { return call("studentsUpdate", params); },
    studentsDelete: function(params) { return call("studentsDelete", params); },
    studentsImportPreview: function(params) { return call("studentsImportPreview", params); },
    studentsImportCommit: function(params) { return call("studentsImportCommit", params); },

    // 9. Penugasan Mengajar
    assignmentsList: function(params) { return call("assignmentsList", params); },
    assignmentsCreate: function(params) { return call("assignmentsCreate", params); },
    assignmentsUpdate: function(params) { return call("assignmentsUpdate", params); },
    assignmentsDelete: function(params) { return call("assignmentsDelete", params); },

    // 10. Presensi
    attendanceGet: function(params) { return call("attendanceGet", params); },
    attendanceCreate: function(params) { return call("attendanceCreate", params); },
    attendanceUpdate: function(params) { return call("attendanceUpdate", params); },
    attendanceList: function(params) { return call("attendanceList", params); },
    attendanceRecap: function(params) { return call("attendanceRecap", params); },

    // 11. Komponen Nilai & Penilaian
    scoreComponentsGet: function(params) { return call("scoreComponentsGet", params); },
    scoreComponentsSave: function(params) { return call("scoreComponentsSave", params); },
    assessmentsList: function(params) { return call("assessmentsList", params); },
    assessmentsCreate: function(params) { return call("assessmentsCreate", params); },
    assessmentsUpdate: function(params) { return call("assessmentsUpdate", params); },
    assessmentsDelete: function(params) { return call("assessmentsDelete", params); },
    assessmentsSaveScores: function(params) { return call("assessmentsSaveScores", params); },
    gradesRecap: function(params) { return call("gradesRecap", params); },

    // 12. Rapor
    reportsList: function(params) { return call("reportsList", params); },
    reportsGet: function(params) { return call("reportsGet", params); },
    reportsSaveNote: function(params) { return call("reportsSaveNote", params); },

    // 13. Jurnal Mengajar
    journalsList: function(params) { return call("journalsList", params); },
    journalsCreate: function(params) { return call("journalsCreate", params); },
    journalsUpdate: function(params) { return call("journalsUpdate", params); },

    // 14. Perangkat Ajar
    materialsList: function(params) { return call("materialsList", params); },
    materialsCreate: function(params) { return call("materialsCreate", params); },
    materialsUpdate: function(params) { return call("materialsUpdate", params); },
    materialsSubmit: function(params) { return call("materialsSubmit", params); },
    materialsReview: function(params) { return call("materialsReview", params); },

    // 15. Dashboard & Audit
    dashboardGet: function() { return call("dashboardGet"); },
    auditList: function(params) { return call("auditList", params); }
  };
})();
