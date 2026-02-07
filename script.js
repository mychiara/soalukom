// --- IMPOR FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  setDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// --- KONFIGURASI FIREBASE ---
// IMPORTANT: Firebase config is now loaded from config.js
// This file should be gitignored to protect API keys
// See config.template.js for setup instructions
const firebaseConfig = window.FIREBASE_CONFIG || {
  apiKey: "PLEASE_CONFIGURE_config.js",
  authDomain: "PLEASE_CONFIGURE_config.js",
  projectId: "PLEASE_CONFIGURE_config.js",
  storageBucket: "PLEASE_CONFIGURE_config.js",
  messagingSenderId: "PLEASE_CONFIGURE_config.js",
  appId: "PLEASE_CONFIGURE_config.js"
};

const GOOGLE_SCRIPT_URL = window.GOOGLE_SCRIPT_URL || "PLEASE_CONFIGURE_config.js";

// --- GLOBAL VARIABLES ---
let db;
let allCategoryQuestions = [];
const TRYOUT_QUESTION_LIMIT = 180;
const TRYOUT_TIME_LIMIT_MINUTES = 180;
let questions = [],
  questionStates = [],
  quizHistory = [],
  bookmarkedQuestions = [];
let currentQuestionIndex = 0,
  score = 0;
let isTryOut = false,
  isReviewMode = false,
  currentQuizMode = null;
let currentQuizTitle = "",
  currentCategoryFileName = null;
let previousViewForQuiz = null;
let selectedOptionIndex = -1,
  answerSubmitted = false;
let overallTimerInterval = null,
  timeLeftOverallSeconds = TRYOUT_TIME_LIMIT_MINUTES * 60;
let completedQuizData = { questions: [], questionStates: [], quizName: "" };

// --- DOM ELEMENT SELECTORS ---
const mainMenuViewContainer = document.getElementById("main-menu-container");
const mainMenuLatihanSoalButton = document.getElementById(
  "main-menu-latihan-soal",
);
const mainMenuTryoutButton = document.getElementById("main-menu-tryout");
const mainMenuHistoryButton = document.getElementById("main-menu-history");
const mainMenuLeaderboardButton = document.getElementById(
  "main-menu-leaderboard",
);
const mainMenuBookmarksButton = document.getElementById("main-menu-bookmarks");
const leaderboardContainer = document.getElementById("leaderboard-container");
const leaderboardListContainer = document.getElementById(
  "leaderboard-list-container",
);
const kembaliKeMainMenuFromLeaderboard = document.getElementById(
  "kembali-ke-main-menu-from-leaderboard",
);
const bookmarksContainer = document.getElementById("bookmarks-container");
const bookmarksListContainer = document.getElementById(
  "bookmarks-list-container",
);
const kembaliKeMainMenuFromBookmarks = document.getElementById(
  "kembali-ke-main-menu-from-bookmarks",
);
const bookmarkButton = document.getElementById("bookmark-button");
const historyContainer = document.getElementById("history-container");
const historyListContainer = document.getElementById("history-list-container");
const noHistoryMessage = document.getElementById("no-history-message");
const kembaliKeMainMenuFromHistory = document.getElementById(
  "kembali-ke-main-menu-from-history",
);
const latihanSoalSubmenuContainer = document.getElementById(
  "latihan-soal-submenu-container",
);
const latihanDepartemenButton = document.getElementById(
  "latihan-departemen-button",
);
const latihanGabunganButton = document.getElementById(
  "latihan-gabungan-button",
);
const kembaliKeMainMenuFromLatihanSubmenu = document.getElementById(
  "kembali-ke-main-menu-from-latihan-submenu",
);
const tryoutSubmenuContainer = document.getElementById(
  "tryout-submenu-container",
);
const tryoutGabunganSemuaButton = document.getElementById(
  "tryout-gabungan-semua-button",
);
const tryoutModeSeriusButton = document.getElementById(
  "tryout-mode-serius-button",
);
const kembaliKeMainMenuFromTryoutSubmenu = document.getElementById(
  "kembali-ke-main-menu-from-tryout-submenu",
);
const kategoriLatihanContainer = document.getElementById(
  "kategori-latihan-container",
);
const kategoriButtons = document.querySelectorAll(".kategori-button");
const kembaliKeLatihanSubmenuFromKategori = document.getElementById(
  "kembali-ke-latihan-submenu-from-kategori",
);
const tryoutSeriusContainer = document.getElementById(
  "tryout-serius-container",
);
const tryoutSeriusButtons = document.querySelectorAll(".tryout-serius-button");
const kembaliKeTryoutSubmenuFromSerius = document.getElementById(
  "kembali-ke-tryout-submenu-from-serius",
);
const quizLayoutContainer = document.getElementById("quiz-layout-container");
const questionElement = document.getElementById("question");
const optionsContainer = document.getElementById("options-container");
const explanationElement = document.getElementById("explanation");
const nextQuestionButton = document.getElementById("next-question-button");
const quizBackButton = document.getElementById("quiz-back-button");
const doubtfulButton = document.getElementById("doubtful-button");
const userNameDisplaySidebar = document.getElementById("user-name-display");
const timerDisplaySidebar = document.getElementById("timer-display-sidebar");
const timeLeftSidebarElement = document.getElementById("time-left-sidebar");
const timerDisplayMain = document.getElementById("timer-display-main");
const timeLeftMainElement = document.getElementById("time-left-main");
const questionNavigationGrid = document.getElementById(
  "question-navigation-grid",
);
const questionCounterElement = document.getElementById("question-counter");
const questionNavTitle = document.getElementById("question-nav-title");
const resultContainer = document.getElementById("result-container");
const resultTitleElement = document.getElementById("result-title");
const scoreElement = document.getElementById("score");
const restartButton = document.getElementById("restart-button");
const reviewAnswersButton = document.getElementById("review-answers-button");
const retryIncorrectButton = document.getElementById("retry-incorrect-button");
const licenseFormContainer = document.getElementById("license-form-container");
const mainAppContent = document.getElementById("main-app-content");
const submitLicenseButton = document.getElementById("submit-license-button");
const licenseInput = document.getElementById("license");
const nameInputElement = document.getElementById("name-input");
const licenseMsgElement = document.getElementById("license-msg");
const welcomeUserMessageEl = document.getElementById("main-menu-welcome-user");
const logoutButton = document.getElementById("logout-button");
const resetSessionButton = document.getElementById("reset-session-button");
const resetSessionMsgElement = document.getElementById("reset-session-msg");
const mainMenuPanduanButton = document.getElementById("main-menu-panduan");
const panduanContainer = document.getElementById("panduan-container");
const kembaliKeMainMenuFromPanduan = document.getElementById(
  "kembali-ke-main-menu-from-panduan",
);

// --- QUESTION STATS DOM ELEMENTS ---
const mainMenuQuestionStatsButton = document.getElementById("main-menu-question-stats");
const questionStatsContainer = document.getElementById("question-stats-container");
const kembaliKeMainMenuFromStats = document.getElementById("kembali-ke-main-menu-from-stats");
const statsList = document.getElementById("stats-list");
const grandTotalQuestionsEl = document.getElementById("grand-total-questions");
const statsLoading = document.getElementById("stats-loading");

// --- FIREBASE AUTH & SESSION LOGIC ---
let heartbeatIntervalId = null;
const STALE_SESSION_THRESHOLD = 5 * 60 * 1000;
const HEARTBEAT_INTERVAL = 2 * 60 * 1000;

function generateClientSessionId() {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}
function clearLocalSessionData() {
  sessionStorage.removeItem("licenseValidated");
  sessionStorage.removeItem("userName");
  sessionStorage.removeItem("licenseKey");
  sessionStorage.removeItem("clientSessionId");
  sessionStorage.removeItem("userProgram");
}

function resetAppState() {
  questions = [];
  allCategoryQuestions = [];
  questionStates = [];
  quizHistory = [];
  currentQuestionIndex = 0;
  score = 0;
  isTryOut = false;
  isReviewMode = false;
  currentQuizMode = null;
  stopOverallTimer();
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("quizProgress_")) localStorage.removeItem(key);
  });
  showLoginForm();
}
window.resetAppState = resetAppState;

function showLoginForm(message = "") {
  if (heartbeatIntervalId) {
    clearInterval(heartbeatIntervalId);
    heartbeatIntervalId = null;
  }
  clearLocalSessionData();
  licenseFormContainer.style.display = "block";
  mainAppContent.style.display = "none";
  if (licenseMsgElement) {
    licenseMsgElement.textContent = message;
    licenseMsgElement.style.color =
      message.toLowerCase().includes("gagal") ||
      message.toLowerCase().includes("tidak")
        ? "#FF0000"
        : "#87CEFA";
  }
  submitLicenseButton.disabled = false;
  resetSessionButton.disabled = false;
  licenseInput.value = "";
  if (resetSessionMsgElement) resetSessionMsgElement.textContent = "";
}

function proceedToApp(userName, licenseKey, clientSessionId, userProgram = "") {
  const displayProgram =
    userProgram || sessionStorage.getItem("userProgram") || "";
  if (welcomeUserMessageEl)
    welcomeUserMessageEl.innerHTML = `SELAMAT DATANG, ${userName.toUpperCase()}<br><span style="font-size: 0.8em; font-weight: normal;">${displayProgram}</span>`;
  if (userNameDisplaySidebar) userNameDisplaySidebar.textContent = userName;
  sessionStorage.setItem("licenseValidated", "true");
  sessionStorage.setItem("userName", userName);
  sessionStorage.setItem("licenseKey", licenseKey);
  sessionStorage.setItem("clientSessionId", clientSessionId);
  if (userProgram) sessionStorage.setItem("userProgram", userProgram);

  licenseFormContainer.style.display = "none";
  mainAppContent.style.display = "block";
  if (licenseMsgElement) licenseMsgElement.textContent = "";
  if (resetSessionMsgElement) resetSessionMsgElement.textContent = "";
  startHeartbeat(licenseKey, clientSessionId);
  showView(mainMenuViewContainer);
}

async function heartbeat(licenseKey, clientSessionId) {
  if (!db || !licenseKey || !clientSessionId) return;
  try {
    const docRef = doc(db, "licenses", licenseKey);
    const docSnap = await getDoc(docRef);
    if (
      docSnap.exists() &&
      docSnap.data().active === true &&
      docSnap.data().activeSessionId === clientSessionId
    ) {
      await updateDoc(docRef, { lastSeenAt: serverTimestamp() });
    } else {
      showLoginForm(
        "Sesi Anda telah diakhiri karena lisensi digunakan di tempat lain.",
      );
    }
  } catch (error) {
    console.error("Heartbeat error:", error);
  }
}

function startHeartbeat(licenseKey, clientSessionId) {
  if (heartbeatIntervalId) clearInterval(heartbeatIntervalId);
  heartbeat(licenseKey, clientSessionId);
  heartbeatIntervalId = setInterval(() => {
    heartbeat(licenseKey, clientSessionId);
  }, HEARTBEAT_INTERVAL);
}

function attachAuthEventListeners() {
  submitLicenseButton.addEventListener("click", async () => {
    const licenseKey = licenseInput.value.trim();
    const inputUserName = nameInputElement.value.trim();
    if (!inputUserName || !licenseKey) {
      licenseMsgElement.textContent = "Nama dan Kode Lisensi harus diisi.";
      licenseMsgElement.style.color = "#FF0000";
      return;
    }
    licenseMsgElement.textContent = "Memeriksa...";
    submitLicenseButton.disabled = true;
    try {
      const docRef = doc(db, "licenses", licenseKey);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().active === true) {
        const licenseData = docSnap.data();
        const lastSeenTimestamp = licenseData.lastSeenAt;
        const lastSeenDate = lastSeenTimestamp
          ? lastSeenTimestamp.toDate()
          : null;
        const canTakeLicense =
          !licenseData.activeSessionId ||
          (lastSeenDate &&
            new Date().getTime() - lastSeenDate.getTime() >
              STALE_SESSION_THRESHOLD);
        if (canTakeLicense) {
          const newClientSessionId = generateClientSessionId();
          await updateDoc(docRef, {
            activeSessionId: newClientSessionId,
            lastSeenAt: serverTimestamp(),
            userName: inputUserName,
            program: document.getElementById("program-select").value,
          });
          proceedToApp(
            inputUserName,
            licenseKey,
            newClientSessionId,
            document.getElementById("program-select").value,
          );
        } else {
          licenseMsgElement.textContent =
            "Lisensi ini sedang aktif digunakan di perangkat lain.";
          licenseMsgElement.style.color = "#FF0000";
        }
      } else {
        licenseMsgElement.textContent =
          "Lisensi tidak valid atau tidak aktif, silakan hubungi admin.";
        licenseMsgElement.style.color = "#FF0000";
      }
    } catch (error) {
      licenseMsgElement.textContent = `Terjadi kesalahan. Coba lagi.`;
      console.error(error);
    } finally {
      submitLicenseButton.disabled = false;
    }
  });

  resetSessionButton.addEventListener("click", async () => {
    const licenseKeyToReset = licenseInput.value.trim();
    if (!licenseKeyToReset) {
      resetSessionMsgElement.textContent =
        "Masukkan kode lisensi yang ingin direset.";
      resetSessionMsgElement.style.color = "#FFFF00";
      return;
    }
    resetSessionMsgElement.textContent = "Memproses...";
    resetSessionButton.disabled = true;
    try {
      const docRef = doc(db, "licenses", licenseKeyToReset);
      await updateDoc(docRef, {
        activeSessionId: null,
        lastSeenAt: serverTimestamp(),
      });
      resetSessionMsgElement.textContent =
        "Reset berhasil. Silakan coba masuk lagi.";
      resetSessionMsgElement.style.color = "#90EE90";
    } catch (error) {
      resetSessionMsgElement.textContent =
        "Gagal mereset. Lisensi tidak ditemukan.";
      resetSessionMsgElement.style.color = "#FF0000";
    } finally {
      resetSessionButton.disabled = false;
    }
  });

  logoutButton.addEventListener("click", async () => {
    const licenseKey = sessionStorage.getItem("licenseKey");
    
    // Stop heartbeat first
    if (heartbeatIntervalId) {
      clearInterval(heartbeatIntervalId);
      heartbeatIntervalId = null;
    }
    
    // Clear session from Firebase
    if (db && licenseKey) {
      try {
        const docRef = doc(db, "licenses", licenseKey);
        await updateDoc(docRef, { 
          activeSessionId: null,
          lastSeenAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Error on logout:", error);
      }
    }
    
    // Reset app state and show login form
    resetAppState();
  });
}

function checkExistingSession() {
  if (sessionStorage.getItem("licenseValidated") === "true") {
    const savedUserName = sessionStorage.getItem("userName");
    const savedLicenseKey = sessionStorage.getItem("licenseKey");
    const savedClientSessionId = sessionStorage.getItem("clientSessionId");
    const savedUserProgram = sessionStorage.getItem("userProgram");
    if (savedUserName && savedLicenseKey && savedClientSessionId) {
      (async () => {
        const docRef = doc(db, "licenses", savedLicenseKey);
        const docSnap = await getDoc(docRef);
        if (
          docSnap.exists() &&
          docSnap.data().activeSessionId === savedClientSessionId
        ) {
          proceedToApp(
            savedUserName,
            savedLicenseKey,
            savedClientSessionId,
            savedUserProgram,
          );
        } else {
          showLoginForm("Sesi tidak valid, silakan masuk kembali.");
        }
      })();
    }
  }
}
// --- END OF FIREBASE & AUTH LOGIC ---

// --- MAIN APP LOGIC ---
function showView(viewToShow) {
  const allViews = document.querySelectorAll('.container-view');
  allViews.forEach((view) => {
    if (view === viewToShow) {
        view.classList.remove("hidden");
    } else {
        view.classList.add("hidden");
    }
  });
  
  // Scroll to top when switching views
  window.scrollTo(0, 0);
}
window.showView = showView;

function getLocalStorageKey(type) {
  const sessionUserName = sessionStorage.getItem("userName") || "defaultUser";
  if (type === "history") return `quizHistory_${sessionUserName}`;
  if (type === "progress")
    return `quizProgress_${sessionUserName}_${currentQuizMode}_${currentQuizTitle}`;
  return null;
}
function loadHistory() {
  try {
    const savedHistory = localStorage.getItem(getLocalStorageKey("history"));
    quizHistory = savedHistory ? JSON.parse(savedHistory) : [];
  } catch (e) {
    quizHistory = [];
  }
}
function renderHistory() {
  loadHistory();
  historyListContainer.innerHTML = "";
  if (quizHistory.length === 0) {
    noHistoryMessage.classList.remove("hidden");
    // Clear chart if exists
    const chartCanvas = document.getElementById("progressChart");
    if (chartCanvas) {
      const ctx = chartCanvas.getContext("2d");
      ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    }
    return;
  }
  noHistoryMessage.classList.add("hidden");

  // Render List
  const reversedHistory = quizHistory.slice().reverse();
  reversedHistory.forEach((item) => {
    const date = new Date(item.date).toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const card = document.createElement("div");
    card.className = "history-item-card";
    card.innerHTML = `<h4>${item.quizName}</h4><p><strong>Tanggal:</strong> ${date}</p><p><strong>Skor:</strong> ${item.score} / ${item.totalQuestions}</p>`;
    historyListContainer.appendChild(card);
  });

  // Render Chart
  renderProgressChart();
}

function renderProgressChart() {
  const ctx = document.getElementById("progressChart").getContext("2d");

  // Prepare Data: Take last 10 attempts to keep chart readable
  const dataPoints = quizHistory.slice(-10);
  const labels = dataPoints.map((item, index) => `Ke-${index + 1}`);
  const scores = dataPoints.map((item) =>
    Math.round((item.score / item.totalQuestions) * 100),
  ); // Percentage

  // Destroy existing chart if needed (simple way: replace canvas or just re-init if Chart.js handles it, but better to check)
  if (window.myProgressChart instanceof Chart) {
    window.myProgressChart.destroy();
  }

  window.myProgressChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Nilai (%)",
          data: scores,
          borderColor: "#6c5ce7",
          backgroundColor: "rgba(108, 92, 231, 0.2)",
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: "#a29bfe",
          pointRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: "Grafik Perkembangan Nilai Global" },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
        },
      },
    },
  });
}
function saveProgress() {
  if (!isTryOut || isReviewMode) return;
  try {
    const progress = {
      questions,
      questionStates,
      currentQuestionIndex,
      timeLeftOverallSeconds,
      currentQuizMode,
      currentQuizTitle,
      timestamp: Date.now(),
    };
    localStorage.setItem(
      getLocalStorageKey("progress"),
      JSON.stringify(progress),
    );
  } catch (e) {
    console.error("Failed to save progress:", e);
  }
}
function loadProgress() {
  try {
    const savedProgress = localStorage.getItem(getLocalStorageKey("progress"));
    if (savedProgress) return JSON.parse(savedProgress);
    return null;
  } catch (e) {
    console.error("Failed to load progress:", e);
    return null;
  }
}
function clearProgress() {
  try {
    localStorage.removeItem(getLocalStorageKey("progress"));
  } catch (e) {
    console.error("Failed to clear progress:", e);
  }
}
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
function loadQuestionData(fileName, callback) {
  fetch(fileName)
    .then((response) =>
      response.ok
        ? response.json()
        : Promise.reject(`HTTP error! Status: ${response.status}`),
    )
    .then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        shuffleArray(data);
        questions = [...data];
        callback();
      } else {
        alert(`Gagal memuat atau tidak ada soal di ${fileName}.`);
      }
    })
    .catch((error) => alert(`Error memuat ${fileName}: ${error.message}.`));
}
async function loadMultipleQuestionData(fileNames, allLoadedCallback) {
  allCategoryQuestions = [];
  const fetchPromises = fileNames.map((fileName) =>
    fetch(fileName)
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => ({ fileName, data }))
      .catch(() => ({ fileName, data: [] })),
  );
  const results = await Promise.all(fetchPromises);
  results.forEach((result) => {
    if (Array.isArray(result.data) && result.data.length > 0) {
      allCategoryQuestions.push(
        ...result.data.map((q) => ({
          ...q,
          category: result.fileName.replace(".json", ""),
        })),
      );
    }
  });
  allLoadedCallback();
}
function formatCategoryName(shortName) {
  const nameMap = {
    jiwa: "Keperawatan Jiwa",
    anak: "Keperawatan Anak",
    keluarga: "Keperawatan Keluarga",
    komunitas: "Keperawatan Komunitas",
    bedah: "Keperawatan Medikal Bedah",
    gadar: "Keperawatan Gawat Darurat",
    manajemen: "Manajemen Keperawatan",
    gabungan: "Soal Gabungan",
  };
  return (
    nameMap[shortName.toLowerCase()] ||
    shortName.charAt(0).toUpperCase() + shortName.slice(1)
  );
}

async function saveHistory() {
  if (quizHistory.length === 0) return;
  const latestResult = quizHistory[quizHistory.length - 1];
  try {
    localStorage.setItem(
      getLocalStorageKey("history"),
      JSON.stringify(quizHistory),
    );
  } catch (e) {
    console.error("Gagal menyimpan riwayat ke localStorage:", e);
  }

  const licenseKey = sessionStorage.getItem("licenseKey");
  if (!licenseKey || GOOGLE_SCRIPT_URL.includes("SALIN_URL")) {
    console.warn("LicenseKey tidak ada atau URL Spreadsheet belum diset.");
    return;
  }

  // SIMPAN KE SPREADSHEET (VIA APPS SCRIPT)
  const historyData = {
    licenseKey: licenseKey,
    userName: sessionStorage.getItem("userName") || "N/A",
    quizId: latestResult.id.toString(),
    quizName: latestResult.quizName,
    score: latestResult.score,
    totalQuestions: latestResult.totalQuestions,
    date: new Date().toISOString(),
  };

  try {
    // Send "no-cors" to avoid CORS errors if script not set up perfectly, but ideally we want response.
    // Actually, GAS web app with 'Active User: Me' and 'Access: Anyone' supports CORS.
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", // 'no-cors' is safer for fire-and-forget logging if we don't strictly need response confirmation to proceed
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(historyData),
    });
    console.log("Riwayat dikirim ke Spreadsheet.");
  } catch (error) {
    console.error("Gagal kirim ke Spreadsheet:", error);
  }
}

// --- LEADERBOARD & BOOKMARK LOGIC ---
async function fetchLeaderboard() {
  leaderboardListContainer.innerHTML =
    '<div style="padding:20px; text-align:center;"><i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color:#6c5ce7;"></i><p>Memuat Peringkat Global...</p></div>';

  if (GOOGLE_SCRIPT_URL.includes("SALIN_URL")) {
    leaderboardListContainer.innerHTML =
      '<p style="text-align:center; color:red;">URL Spreadsheet belum dikonfigurasi.</p>';
    return;
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + "?action=leaderboard");
    if (!response.ok) throw new Error("Network response was not ok");

    const leaderboardData = await response.json();

    if (!leaderboardData || leaderboardData.length === 0) {
      leaderboardListContainer.innerHTML =
        '<p style="text-align:center; padding: 20px;">Belum ada data peringkat saat ini.</p>';
      return;
    }

    let html =
      '<div style="overflow-x:auto;"><table class="leaderboard-table">';
    // Header
    html +=
      '<thead><tr><th style="padding:10px; color:#aaa;">#</th><th style="padding:10px; color:#aaa; text-align:left;">Nama</th><th style="padding:10px; color:#aaa; text-align:right;">Skor</th></tr></thead><tbody>';

    let rank = 1;
    leaderboardData.forEach((data) => {
      const rankClass = rank <= 3 ? `rank-${rank}` : "";
      const userName = data.userName || "Tanpa Nama";
      const scoreDisplay = `${data.score} / ${data.totalQuestions}`;

      html += `
                <tr class="leaderboard-row ${rankClass}">
                    <td class="leaderboard-cell">${rank}</td>
                    <td class="leaderboard-cell" style="text-align:left;">
                        <div style="font-weight:600; color:#333;">${userName}</div>
                        <div style="font-size:0.75rem; color:#888;">${data.quizName}</div>
                    </td>
                    <td class="leaderboard-cell">${scoreDisplay}</td>
                </tr>
            `;
      rank++;
    });
    html += "</tbody></table></div>";
    leaderboardListContainer.innerHTML = html;
  } catch (error) {
    console.error("Leaderboard error:", error);
    leaderboardListContainer.innerHTML =
      '<p style="text-align:center; color:red; padding: 20px;">Gagal memuat data. Periksa koneksi internet Anda.</p>';
  }
}

function loadBookmarks() {
  const saved = localStorage.getItem("bookmarkedQuestions");
  bookmarkedQuestions = saved ? JSON.parse(saved) : [];
}

function saveBookmarkedQuestions() {
  localStorage.setItem(
    "bookmarkedQuestions",
    JSON.stringify(bookmarkedQuestions),
  );
}

function toggleBookmark(question) {
  // Check if exists based on question text (ID is better but we don't have unique IDs per q, text is proxy)
  const index = bookmarkedQuestions.findIndex(
    (bq) => bq.question === question.question,
  );
  const btn = document.getElementById("bookmark-button");

  if (index === -1) {
    // Add
    bookmarkedQuestions.push({
      question: question.question,
      options: question.options,
      answer: question.answer,
      explanation: question.explanation, // Save explanation too for review
      category: question.category || currentQuizTitle,
      savedAt: Date.now(),
    });
    if (btn) {
      btn.classList.add("bookmarked");
      btn.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
    }
  } else {
    // Remove
    bookmarkedQuestions.splice(index, 1);
    if (btn) {
      btn.classList.remove("bookmarked");
      btn.innerHTML = '<i class="fa-regular fa-bookmark"></i>';
    }
  }
  saveBookmarkedQuestions();
}

function renderBookmarks() {
  loadBookmarks(); // Refresh
  bookmarksListContainer.innerHTML = "";
  if (bookmarkedQuestions.length === 0) {
    bookmarksListContainer.innerHTML =
      '<p style="text-align:center; width:100%; color:#888;">Belum ada soal yang disimpan.</p>';
    return;
  }

  bookmarkedQuestions.forEach((item, index) => {
    const btn = document.createElement("button");
    btn.className = "bookmark-card";
    btn.innerHTML = `
            <div class="bookmark-preview">${item.question}</div>
            <div class="bookmark-meta"><i class="fa-solid fa-tag"></i> ${item.category}</div>
            <div class="delete-bookmark-btn" onclick="deleteBookmark(event, ${index})"><i class="fa-solid fa-trash"></i></div>
        `;
    btn.onclick = (e) => {
      if (!e.target.closest(".delete-bookmark-btn")) {
        // Open this question in a "Review" mode
        startReviewSingleBookmark(index);
      }
    };
    bookmarksListContainer.appendChild(btn);
  });
}
window.deleteBookmark = function (event, index) {
  event.stopPropagation();
  if (confirm("Hapus soal ini dari simpanan?")) {
    bookmarkedQuestions.splice(index, 1);
    saveBookmarkedQuestions();
    renderBookmarks();
  }
};

function startReviewSingleBookmark(index) {
  const item = bookmarkedQuestions[index];
  questions = [item];
  previousViewForQuiz = bookmarksContainer; // Set return path
  // Create dummy states
  questionStates = [
    {
      answered: false,
      doubtful: false,
      selectedAnswer: -1,
    },
  ];
  currentQuestionIndex = 0;
  isTryOut = false;
  isReviewMode = false; // Interactable
  // But we might want to show explanation immediately? Assume practice mode.
  currentQuizMode = "bookmark-review";
  currentQuizTitle = "Tinjauan Soal Disimpan";

  // Hide navigation grid for single question or re-render
  showView(quizLayoutContainer);
  renderQuestionNavigation();
  showQuestion(questions[0]);
}

// SWIPE LOGIC
let touchStartX = 0;
let touchEndX = 0;

function handleTouchStart(e) {
  touchStartX = e.changedTouches[0].screenX;
}

function handleTouchEnd(e) {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
}

function handleSwipe() {
  if (touchEndX < touchStartX - 50) {
    // Swipe Left -> Next Question
    document.getElementById("next-question-button").click();
  }
  if (touchEndX > touchStartX + 50) {
    // Swipe Right -> Prev Question (We need logic for prev... wait, we only have 'back' which quits)
    // Actually typical quiz swipe: Left = Next, Right = Previous (if allowed).
    // Let's implement prev functionality if we want? Or just map Right to nothing for now to avoid accidental Quit.
    // Wait, user asked for swipe. Usually means Next/Prev.
    // Simple logic: If we are in quiz, navigate.
    if (currentQuestionIndex > 0) {
      // We don't have a direct "Prev" button, but we can simulate click on prev nav box?
      // Or just verify index and call showQuestion.
      // Let's skip Prev for now as we don't have a button for it and layout doesn't support it strictly (Back button quits).
      // But we CAN navigate via Grid.
      const prevIndex = currentQuestionIndex - 1;
      if (prevIndex >= 0) {
        // Trigger nav
        const navBox = document.querySelector(
          `.nav-question-box[data-index="${prevIndex}"]`,
        );
        if (navBox) navBox.click(); // Logic re-use
      }
    }
  }
}

document.addEventListener(
  "touchstart",
  (e) => {
    if (!quizLayoutContainer.classList.contains("hidden")) {
      handleTouchStart(e);
    }
  },
  false,
);

document.addEventListener(
  "touchend",
  (e) => {
    if (!quizLayoutContainer.classList.contains("hidden")) {
      handleTouchEnd(e);
    }
  },
  false,
);

function startGame(sourceViewElement) {
  previousViewForQuiz = sourceViewElement;
  currentQuestionIndex = 0;
  score = 0;
  selectedOptionIndex = -1;
  answerSubmitted = false;
  isReviewMode = false;
  const sessionUserName = sessionStorage.getItem("userName") || "Pengguna";
  userNameDisplaySidebar.innerText = sessionUserName;
  if (!questions || questions.length === 0) {
    alert("Tidak ada soal, kuis tidak dapat dimulai.");
    showView(sourceViewElement);
    return;
  }
  questionStates = questions.map(() => ({
    answered: false,
    doubtful: false,
    selectedAnswer: -1,
  }));
  if (isTryOut) {
    if (timerDisplaySidebar) timerDisplaySidebar.classList.remove("hidden");
    if (timerDisplayMain) timerDisplayMain.classList.remove("hidden");
    doubtfulButton.classList.remove("hidden");
    startOverallTimer();
  } else {
    if (timerDisplaySidebar) timerDisplaySidebar.classList.add("hidden");
    if (timerDisplayMain) timerDisplayMain.classList.add("hidden");
    doubtfulButton.classList.add("hidden");
    stopOverallTimer();
  }
  if (questionCounterElement) questionCounterElement.classList.remove("hidden");
  showView(quizLayoutContainer);
  renderQuestionNavigation();
  showQuestion(questions[currentQuestionIndex]);
}
function restoreGame(progress, sourceViewElement) {
  previousViewForQuiz = sourceViewElement;
  questions = progress.questions;
  questionStates = progress.questionStates;
  currentQuestionIndex = progress.currentQuestionIndex;
  timeLeftOverallSeconds = progress.timeLeftOverallSeconds;
  currentQuizMode = progress.currentQuizMode;
  currentQuizTitle = progress.currentQuizTitle;
  isTryOut = true;
  isReviewMode = false;
  score = 0;
  const sessionUserName = sessionStorage.getItem("userName") || "Pengguna";
  userNameDisplaySidebar.innerText = sessionUserName;
  timerDisplaySidebar.classList.remove("hidden");
  if (timerDisplayMain) timerDisplayMain.classList.remove("hidden");
  if (questionCounterElement) questionCounterElement.classList.remove("hidden");
  doubtfulButton.classList.remove("hidden");
  startOverallTimer();
  showView(quizLayoutContainer);
  renderQuestionNavigation();
  showQuestion(questions[currentQuestionIndex]);
}
function startOverallTimer() {
  stopOverallTimer();
  updateOverallTimerDisplaySidebar();
  overallTimerInterval = setInterval(() => {
    timeLeftOverallSeconds--;
    updateOverallTimerDisplaySidebar();
    if (timeLeftOverallSeconds % 10 === 0) saveProgress();
    if (timeLeftOverallSeconds <= 0) {
      finalizeTryOut("Waktu Habis!");
    }
  }, 1000);
}
function stopOverallTimer() {
  clearInterval(overallTimerInterval);
}
function updateOverallTimerDisplaySidebar() {
  const minutes = Math.floor(timeLeftOverallSeconds / 60);
  const seconds = timeLeftOverallSeconds % 60;
  const timeString = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  if (timeLeftSidebarElement) timeLeftSidebarElement.innerText = timeString;
  if (timeLeftMainElement) timeLeftMainElement.innerText = timeString;
}
function finalizeTryOut(message = "Try Out Selesai!") {
  alert(message);
  stopOverallTimer();
  showResult();
  clearProgress();
}

function renderQuestionNavigation() {
  if (!questionNavigationGrid) return;
  questionNavigationGrid.innerHTML = "";
  const items = isReviewMode ? completedQuizData.questions : questions;
  const states = isReviewMode
    ? completedQuizData.questionStates
    : questionStates;
  items.forEach((_, index) => {
    const navBox = document.createElement("div");
    navBox.className = "nav-question-box";
    navBox.innerText = index + 1;
    navBox.dataset.index = index;
    const state = states[index];
    if (state) {
      if (isReviewMode) {
        if (state.selectedAnswer === items[index].answer)
          navBox.classList.add("review-correct");
        else navBox.classList.add("review-incorrect");
      } else {
        if (state.answered) navBox.classList.add("answered");
        if (state.doubtful) navBox.classList.add("doubtful");
      }
    }
    if (index === currentQuestionIndex) navBox.classList.add("current");
    navBox.addEventListener("click", () => {
      if (isTryOut && !isReviewMode) {
        questionStates[currentQuestionIndex].selectedAnswer =
          selectedOptionIndex;
      }
      if (
        isTryOut &&
        !isReviewMode &&
        !questionStates[currentQuestionIndex].answered
      )
        return; /* Optional: Prevent skipping if not answering? Removed constraint in previous script but mostly allowed nav. */

      /* Original logic allowed nav anytime in tryout */
      if (isTryOut && !isReviewMode)
        questionStates[currentQuestionIndex].selectedAnswer =
          selectedOptionIndex; // Sync current choice

      currentQuestionIndex = parseInt(navBox.dataset.index);
      if (!isReviewMode)
        selectedOptionIndex =
          states[currentQuestionIndex]?.selectedAnswer ?? -1;
      showQuestion(items[currentQuestionIndex]);
    });
    questionNavigationGrid.appendChild(navBox);
  });
}

function showQuestion(questionData) {
  if (!questionData) return;
  const currentQState = (
    isReviewMode ? completedQuizData.questionStates : questionStates
  )[currentQuestionIndex];
  questionNavTitle.innerHTML = isReviewMode
    ? "<i class='fa-solid fa-eye'></i> Navigasi Tinjauan"
    : "<i class='fa-solid fa-map'></i> Navigasi Soal";

  // UPDATE COUNTER WITH ICON
  questionCounterElement.innerHTML = `<i class="fa-regular fa-flag"></i> Soal ${currentQuestionIndex + 1} dari ${isReviewMode ? completedQuizData.questions.length : questions.length}`;

  renderQuestionNavigation();
  questionElement.textContent = questionData.question;
  optionsContainer.innerHTML = "";
  explanationElement.classList.add("hidden");
  doubtfulButton.classList.toggle("hidden", isReviewMode || !isTryOut);

  // Update Bookmark Button State
  loadBookmarks();
  const isBookmarked = bookmarkedQuestions.some(
    (bq) => bq.question === questionData.question,
  );
  if (bookmarkButton) {
    if (isBookmarked) {
      bookmarkButton.classList.add("bookmarked");
      bookmarkButton.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
    } else {
      bookmarkButton.classList.remove("bookmarked");
      bookmarkButton.innerHTML = '<i class="fa-regular fa-bookmark"></i>';
    }
    // Re-attach listener to avoid duplicates? Or attach once globally?
    // Better attach globally. But we need reference to current data.
    // Let's attach globally and use currentQuestionIndex variables.
  }

  if (!isReviewMode && isTryOut) {
    // UPDATE DOUBTFUL BUTTON WITH ICON
    doubtfulButton.innerHTML = currentQState.doubtful
      ? "<i class='fa-solid fa-eraser'></i> Hapus Tanda Ragu"
      : "<i class='fa-solid fa-question-circle'></i> Tandai Ragu-ragu";
  }

  questionData.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.textContent = option;
    button.className = "option-button";
    if (!isReviewMode)
      button.addEventListener("click", () => selectOption(index));
    else button.disabled = true;
    optionsContainer.appendChild(button);
  });

  const optionButtons = optionsContainer.querySelectorAll(".option-button");
  if (isReviewMode) {
    explanationElement.innerHTML = `<strong><i class='fa-solid fa-lightbulb'></i> Penjelasan:</strong> ${questionData.explanation || "Tidak ada penjelasan."}`;
    explanationElement.classList.remove("hidden");
    if (currentQState.selectedAnswer === questionData.answer) {
      optionButtons[questionData.answer].classList.add("correct");
    } else {
      if (currentQState.selectedAnswer !== -1)
        optionButtons[currentQState.selectedAnswer].classList.add("incorrect");
      optionButtons[questionData.answer].classList.add("correct");
    }
  } else {
    if (isTryOut) {
      if (currentQState.selectedAnswer !== -1)
        optionButtons[currentQState.selectedAnswer].classList.add(
          "selected-tryout",
        );
    } else {
      if (currentQState.answered) submitAnswerForLatihan(true);
    }
  }

  const isLastQuestion =
    currentQuestionIndex >=
    (isReviewMode ? completedQuizData.questions.length : questions.length) - 1;
  // UPDATE NEXT BUTTON WITH ICONS
  if (isLastQuestion) {
    nextQuestionButton.innerHTML = isReviewMode
      ? "<i class='fa-solid fa-house-user'></i> Kembali ke Hasil"
      : isTryOut
        ? "<i class='fa-solid fa-flag-checkered'></i> Selesaikan Try Out"
        : "<i class='fa-solid fa-poll'></i> Lihat Hasil";
  } else {
    nextQuestionButton.innerHTML =
      "Soal Berikutnya <i class='fa-solid fa-arrow-right'></i>";
  }
}

function selectOption(selectedIndex) {
  if (
    isReviewMode ||
    (!isTryOut && questionStates[currentQuestionIndex]?.answered)
  )
    return;
  selectedOptionIndex = selectedIndex;
  questionStates[currentQuestionIndex].selectedAnswer = selectedIndex;
  optionsContainer
    .querySelectorAll(".option-button")
    .forEach((button, i) =>
      button.classList.toggle("selected-tryout", i === selectedIndex),
    );
  if (!isTryOut) submitAnswerForLatihan(false);
  else {
    questionStates[currentQuestionIndex].answered = true;
    renderQuestionNavigation();

    // Track daily stats for Try Out
    if (
      window.dailyStatsManager &&
      !questionStates[currentQuestionIndex].statsTracked
    ) {
      window.dailyStatsManager.incrementQuestionCount();
      questionStates[currentQuestionIndex].statsTracked = true;
    }
  }
}
function submitAnswerForLatihan(isReshow) {
  const currentQ = questions[currentQuestionIndex];
  const currentQState = questionStates[currentQuestionIndex];
  if (!isReshow) {
    currentQState.answered = true;
    answerSubmitted = true;
    if (selectedOptionIndex === currentQ.answer) score++;

    // Track daily stats
    if (window.dailyStatsManager) {
      window.dailyStatsManager.incrementQuestionCount();
    }
  }
  optionsContainer
    .querySelectorAll(".option-button")
    .forEach((btn) => (btn.disabled = true));
  if (selectedOptionIndex === currentQ.answer)
    optionsContainer.children[selectedOptionIndex].classList.add("correct");
  else {
    if (selectedOptionIndex !== -1)
      optionsContainer.children[selectedOptionIndex].classList.add("incorrect");
    optionsContainer.children[currentQ.answer].classList.add("correct");
  }
  explanationElement.innerHTML = `<strong><i class='fa-solid fa-lightbulb'></i> Penjelasan:</strong> ${currentQ.explanation || "Tidak ada penjelasan."}`;
  explanationElement.classList.remove("hidden");
  renderQuestionNavigation();
}
function showResult() {
  stopOverallTimer();
  completedQuizData = {
    questions: [...questions],
    questionStates: [...questionStates],
    quizName: currentQuizTitle,
  };
  let finalScore = 0,
    incorrectCount = 0;
  const categoryBreakdown = {};
  questions.forEach((q, index) => {
    const state = questionStates[index];
    const isCorrect = state.selectedAnswer === q.answer;
    if (isCorrect) finalScore++;
    if (state.selectedAnswer !== -1 && !isCorrect) incorrectCount++;
    if (currentQuizMode === "tryout-gabungan-semua") {
      const categoryKey = q.category || "lainnya";
      if (!categoryBreakdown[categoryKey])
        categoryBreakdown[categoryKey] = { correct: 0, total: 0 };
      categoryBreakdown[categoryKey].total++;
      if (isCorrect) categoryBreakdown[categoryKey].correct++;
    }
  });
  if (!isTryOut) finalScore = score;
  if (currentQuizMode !== "latihan-salah") {
    loadHistory();
    quizHistory.push({
      id: Date.now(),
      quizName: currentQuizTitle,
      score: finalScore,
      totalQuestions: questions.length,
      date: new Date().toISOString(),
    });
    saveHistory();
  }
  resultTitleElement.textContent = `Hasil ${currentQuizTitle}`;
  const sessionUserName = sessionStorage.getItem("userName") || "Pengguna";
  let message = `<span class="user-name-result">Selamat ${sessionUserName}!</span><br>Skor Anda: <span class="score-value">${finalScore}</span> benar dari ${questions.length} soal.<br>`;
  if (currentQuizMode === "tryout-gabungan-semua") {
    message += `<span class="category-breakdown-title">Rincian Per Kategori:</span><br>`;
    for (const key in categoryBreakdown)
      message += `<span class="category-item"><span class="category-name">${formatCategoryName(key)}</span>: <span class="category-score">${categoryBreakdown[key].correct} / ${categoryBreakdown[key].total}</span> benar.</span><br>`;
  } else if (currentQuizMode === "tryout-serius") {
    let feedback = "ANDA BELUM MENJAWAB DENGAN BENAR, COBA LAGI!";
    if (finalScore >= 1 && finalScore <= 90)
      feedback = "NILAI KURANG, BELAJAR LEBIH GIAT LAGI";
    else if (finalScore >= 91 && finalScore <= 120)
      feedback = "NILAI CUKUP, BELAJAR LAGI";
    else if (finalScore >= 121) feedback = "NILAI BAGUS, PERTAHANKAN";
    message += `Tanggapan: <strong>${feedback}</strong><br>`;
  }
  scoreElement.innerHTML = message;
  reviewAnswersButton.classList.remove("hidden");
  retryIncorrectButton.classList.toggle("hidden", incorrectCount === 0);

  // === ACHIEVEMENT TRIGGERS ===
  if (window.achievementManager && currentQuizMode !== "latihan-salah") {
    const percentage = Math.round((finalScore / questions.length) * 100);

    // Perfect score
    if (finalScore === questions.length) {
      window.achievementManager.unlock("perfect_score", {
        title: "Perfect Score! 💯",
        description: "Luar biasa! Semua jawaban Anda benar!",
        icon: "fa-star",
      });
    }

    // High score (>90%)
    if (percentage >= 90 && percentage < 100) {
      window.achievementManager.unlock("high_score", {
        title: "Nilai Tinggi! 🌟",
        description: `Hebat! Anda mendapat ${percentage}%!`,
        icon: "fa-certificate",
      });
    }

    // First quiz completion
    if (quizHistory.length === 1) {
      window.achievementManager.unlock("first_quiz", {
        title: "Kuis Pertama! 🎓",
        description: "Perjalanan belajar Anda dimulai!",
        icon: "fa-graduation-cap",
      });
    }

    // Quiz completion milestones
    const totalCompleted = quizHistory.length;
    if ([10, 25, 50, 100, 250, 500].includes(totalCompleted)) {
      window.achievementManager.unlock(`quiz_${totalCompleted}`, {
        title: `${totalCompleted} Kuis Selesai! 🎊`,
        description: "Dedikasi luar biasa!",
        icon: "fa-trophy",
      });
    }

    // Try Out specific achievements
    if (isTryOut && questions.length >= 180) {
      if (percentage >= 80) {
        window.achievementManager.unlock("tryout_master", {
          title: "Try Out Master! 🏆",
          description: `${percentage}% pada Try Out lengkap!`,
          icon: "fa-crown",
        });
      }
    }
  }

  showView(resultContainer);
}

window.addEventListener("beforeunload", () => {
  if (isTryOut && !isReviewMode) {
    saveProgress();
  }
});

// --- INITIALIZE APP ---
// Attach menu navigation listeners
mainMenuLatihanSoalButton.addEventListener("click", () =>
  showView(latihanSoalSubmenuContainer),
);
mainMenuTryoutButton.addEventListener("click", () =>
  showView(tryoutSubmenuContainer),
);
mainMenuHistoryButton.addEventListener("click", () => {
  renderHistory();
  showView(historyContainer);
});
kembaliKeMainMenuFromHistory.addEventListener("click", () =>
  showView(mainMenuViewContainer),
);
mainMenuLeaderboardButton.addEventListener("click", () => {
  showView(leaderboardContainer);
  fetchLeaderboard();
});
kembaliKeMainMenuFromLeaderboard.addEventListener("click", () =>
  showView(mainMenuViewContainer),
);

mainMenuBookmarksButton.addEventListener("click", () => {
  showView(bookmarksContainer);
  renderBookmarks();
});
kembaliKeMainMenuFromBookmarks.addEventListener("click", () =>
  showView(mainMenuViewContainer),
);

// Listener untuk Bookmark (Global)
if (bookmarkButton) {
  bookmarkButton.addEventListener("click", () => {
    const q = questions[currentQuestionIndex];
    if (q) toggleBookmark(q);
  });
}

// Listener untuk Panduan
if (mainMenuPanduanButton) {
  mainMenuPanduanButton.addEventListener("click", () => {
    // Explicitly show the view using the updated showView function
    showView(panduanContainer);
    // Double ensure hidden class is removed just in case
    if(panduanContainer) panduanContainer.classList.remove("hidden");
  });
}

if (kembaliKeMainMenuFromPanduan) {
  kembaliKeMainMenuFromPanduan.addEventListener("click", () => {
    showView(mainMenuViewContainer);
  });
}

latihanDepartemenButton.addEventListener("click", () =>
  showView(kategoriLatihanContainer),
);
kembaliKeMainMenuFromLatihanSubmenu.addEventListener("click", () =>
  showView(mainMenuViewContainer),
);
tryoutModeSeriusButton.addEventListener("click", () =>
  showView(tryoutSeriusContainer),
);
kembaliKeMainMenuFromTryoutSubmenu.addEventListener("click", () =>
  showView(mainMenuViewContainer),
);
kembaliKeLatihanSubmenuFromKategori.addEventListener("click", () =>
  showView(latihanSoalSubmenuContainer),
);
kembaliKeTryoutSubmenuFromSerius.addEventListener("click", () =>
  showView(tryoutSubmenuContainer),
);
latihanGabunganButton.addEventListener("click", () => {
  currentQuizMode = "latihan-gabungan";
  currentQuizTitle = "Latihan Soal Gabungan";
  isTryOut = false;
  currentCategoryFileName = "gabungan.json";
  loadQuestionData(currentCategoryFileName, () =>
    startGame(latihanSoalSubmenuContainer),
  );
});
tryoutGabunganSemuaButton.addEventListener("click", () => {
  currentQuizMode = "tryout-gabungan-semua";
  currentQuizTitle = "Try Out Gabungan (Sesuai Blueprint)";
  isTryOut = true;
  currentCategoryFileName = null;
  const categoryDataFiles = [
    "anak.json",
    "bedah.json",
    "gadar.json",
    "jiwa.json",
    "keluarga.json",
    "komunitas.json",
    "manajemen.json",
    "maternitas.json",
    "gerontik.json",
  ];
  const savedProgress = loadProgress();
  if (savedProgress) {
    if (
      confirm(
        "Anda memiliki sesi Try Out Gabungan yang belum selesai. Lanjutkan?",
      )
    ) {
      restoreGame(savedProgress, tryoutSubmenuContainer);
      return;
    } else {
      clearProgress();
    }
  }
  loadMultipleQuestionData(categoryDataFiles, () => {
    // --- BLUEPRINT DISTRIBUTION LOGIC ---
    // Total 180 Questions
    const blueprint = {
      bedah: 54,       // KMB (~30%)
      maternitas: 20,  // (~11%)
      anak: 20,        // (~11%)
      jiwa: 20,        // (~11%)
      keluarga: 20,    // (~11%)
      gadar: 16,       // (~9%)
      gerontik: 10,    // (~5.5%)
      manajemen: 10,   // (~5.5%)
      komunitas: 10    // (~5.5%)
    };

    let selectedQuestions = [];

    // Group questions by category
    const questionsByCategory = {};
    allCategoryQuestions.forEach(q => {
      if (!questionsByCategory[q.category]) {
        questionsByCategory[q.category] = [];
      }
      questionsByCategory[q.category].push(q);
    });

    // Select questions based on blueprint
    for (const [category, targetCount] of Object.entries(blueprint)) {
      if (questionsByCategory[category]) {
        // Shuffle the pool for this category
        shuffleArray(questionsByCategory[category]);
        // Take the target count (or all if less than target)
        const selected = questionsByCategory[category].slice(0, targetCount);
        selectedQuestions = selectedQuestions.concat(selected);
      }
    }

    // Shuffle the final combined set
    shuffleArray(selectedQuestions);
    
    // Assign to global questions array
    questions = selectedQuestions;

    // Check if we met the 180 requirement (warn if low data)
    if (questions.length < 180) {
      console.warn(`Warning: Only generated ${questions.length} questions. Check category data files.`);
    }

    // Limit to 180 just in case (though logic above should handle it)
    questions = questions.slice(0, 180);

    startGame(tryoutSubmenuContainer);
  });
});
kategoriButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentQuizMode = "latihan-departemen";
    isTryOut = false;
    currentCategoryFileName = button.dataset.script.replace(".js", ".json");
    currentQuizTitle = formatCategoryName(
      currentCategoryFileName.replace(".json", ""),
    );
    loadQuestionData(currentCategoryFileName, () =>
      startGame(kategoriLatihanContainer),
    );
  });
});
tryoutSeriusButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentQuizMode = "tryout-serius";
    currentQuizTitle = button.dataset.type;
    isTryOut = true;
    const dataFile = button.dataset.file;
    const savedProgress = loadProgress();
    if (savedProgress) {
      if (
        confirm(
          `Anda memiliki sesi ${currentQuizTitle} yang belum selesai. Lanjutkan?`,
        )
      ) {
        restoreGame(savedProgress, tryoutSeriusContainer);
        return;
      } else {
        clearProgress();
      }
    }
    loadQuestionData(dataFile, () => {
      questions = questions.slice(0, TRYOUT_QUESTION_LIMIT);
      startGame(tryoutSeriusContainer);
    });
  });
});
restartButton.addEventListener("click", () => {
  isReviewMode = false;
  showView(mainMenuViewContainer);
});
reviewAnswersButton.addEventListener("click", () => {
  isReviewMode = true;
  currentQuestionIndex = 0;
  questions = [...completedQuizData.questions];
  questionStates = [...completedQuizData.questionStates];
  showView(quizLayoutContainer);
  renderQuestionNavigation();
  showQuestion(questions[currentQuestionIndex]);
});
retryIncorrectButton.addEventListener("click", () => {
  const incorrectQuestions = completedQuizData.questions.filter((q, index) => {
    const state = completedQuizData.questionStates[index];
    return state.selectedAnswer !== -1 && state.selectedAnswer !== q.answer;
  });
  if (incorrectQuestions.length > 0) {
    questions = incorrectQuestions;
    currentQuizMode = "latihan-salah";
    currentQuizTitle = `Latihan Ulang Soal Salah (${completedQuizData.quizName})`;
    isTryOut = false;
    isReviewMode = false;
    startGame(resultContainer);
  }
});
doubtfulButton.addEventListener("click", () => {
  if (!isTryOut || isReviewMode || !questionStates[currentQuestionIndex])
    return;
  const currentQState = questionStates[currentQuestionIndex];
  currentQState.doubtful = !currentQState.doubtful;
  doubtfulButton.innerHTML = currentQState.doubtful
    ? "<i class='fa-solid fa-eraser'></i> Hapus Tanda Ragu"
    : "<i class='fa-solid fa-question-circle'></i> Tandai Ragu-ragu";
  renderQuestionNavigation();
  saveProgress();
});
nextQuestionButton.addEventListener("click", () => {
  if (isTryOut && !isReviewMode) {
    questionStates[currentQuestionIndex].selectedAnswer = selectedOptionIndex;
    if (
      !questionStates[currentQuestionIndex].answered &&
      selectedOptionIndex !== -1
    ) {
      questionStates[currentQuestionIndex].answered = true;
    }
    saveProgress();
  }
  const isLastQuestion =
    currentQuestionIndex >=
    (isReviewMode ? completedQuizData.questions.length : questions.length) - 1;
  if (!isLastQuestion) {
    currentQuestionIndex++;
    if (!isReviewMode) {
      selectedOptionIndex =
        questionStates[currentQuestionIndex]?.selectedAnswer ?? -1;
      answerSubmitted = questionStates[currentQuestionIndex]?.answered ?? false;
    }
    showQuestion(questions[currentQuestionIndex]);
  } else {
    // End of Quiz
    if (currentQuizMode === "bookmark-review") {
      // Just go back to bookmarks
      isReviewMode = false;
      showView(bookmarksContainer);
      renderBookmarks();
    } else if (isReviewMode) {
      showView(resultContainer);
    } else if (isTryOut) {
      finalizeTryOut();
    } else {
      showResult();
    }
  }
});
quizBackButton.addEventListener("click", () => {
  if (currentQuizMode === "bookmark-review") {
    isReviewMode = false;
    showView(bookmarksContainer);
    renderBookmarks(); // Refresh list in case of changes
    return;
  }
  if (isReviewMode) {
    isReviewMode = false;
    showView(resultContainer);
    return;
  }
  if (confirm("Anda yakin ingin kembali? Progress kuis ini akan hilang.")) {
    stopOverallTimer();
    if (isTryOut) clearProgress();
    isTryOut = false;
    currentQuizMode = null;
    showView(previousViewForQuiz || mainMenuViewContainer);
  }
});

// Initialize Firebase and Auth Logic
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("Firebase Initialized Successfully.");
  attachAuthEventListeners();
  checkExistingSession();
} catch (error) {
  console.error("Firebase Initialization Failed:", error);
  if (licenseMsgElement) {
    licenseMsgElement.textContent = "Gagal koneksi ke server. Coba lagi nanti.";
    licenseMsgElement.style.color = "#FF0000";
  }
}

// --- QUESTION STATS LOGIC ---
async function showQuestionStats() {
    showView(questionStatsContainer);
    statsLoading.classList.remove("hidden");
    statsList.classList.add("hidden");
    statsList.innerHTML = "";
    grandTotalQuestionsEl.textContent = "0";

    const files = [
        { name: "Keperawatan Jiwa", file: "jiwa.json", icon: "fa-brain", color: "#6c5ce7" },
        { name: "Keperawatan Anak", file: "anak.json", icon: "fa-child", color: "#ff7675" },
        { name: "Keperawatan Keluarga", file: "keluarga.json", icon: "fa-users", color: "#fdcb6e" },
        { name: "Keperawatan Komunitas", file: "komunitas.json", icon: "fa-people-roof", color: "#00b894" },
        { name: "Keperawatan Medikal Bedah", file: "bedah.json", icon: "fa-user-md", color: "#0984e3" },
        { name: "Keperawatan Gawat Darurat", file: "gadar.json", icon: "fa-ambulance", color: "#d63031" },
        { name: "Keperawatan Maternitas", file: "maternitas.json", icon: "fa-baby-carriage", color: "#e84393" },
        { name: "Keperawatan Gerontik", file: "gerontik.json", icon: "fa-person-cane", color: "#00cec9" },
        { name: "Manajemen Keperawatan", file: "manajemen.json", icon: "fa-tasks", color: "#636e72" }
    ];

    let grandTotal = 0;
    
    const listContainer = document.createElement("div");
    listContainer.className = "stats-grid";
    listContainer.style.display = "grid";
    listContainer.style.gap = "15px";
    listContainer.style.gridTemplateColumns = "repeat(auto-fit, minmax(280px, 1fr))";

    try {
        const promises = files.map(item => 
            fetch(item.file)
                .then(res => res.ok ? res.json() : [])
                .then(data => ({ ...item, count: data.length }))
                .catch(err => ({ ...item, count: 0, error: true }))
        );

        const results = await Promise.all(promises);

        results.forEach(item => {
            grandTotal += item.count;
            const card = document.createElement("div");
            card.className = "stat-item-card";
            card.style.background = "#f8f9fa";
            card.style.padding = "15px";
            card.style.borderRadius = "10px";
            card.style.display = "flex";
            card.style.alignItems = "center";
            card.style.justifyContent = "space-between";
            card.style.borderLeft = `5px solid ${item.color}`;
            card.style.boxShadow = "0 2px 5px rgba(0,0,0,0.05)";

            card.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="background: ${item.color}20; padding: 10px; border-radius: 50%; color: ${item.color}; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                        <i class="fa-solid ${item.icon}"></i>
                    </div>
                    <span style="font-weight: 600; color: #2d3436; font-size: 0.95rem;">${item.name}</span>
                </div>
                <div style="font-weight: bold; font-size: 1.2rem; color: ${item.color};">
                    ${item.count.toLocaleString()}
                </div>
            `;
            listContainer.appendChild(card);
        });

        statsList.appendChild(listContainer);
        grandTotalQuestionsEl.textContent = grandTotal.toLocaleString();
    } catch (error) {
        console.error("Error fetching stats:", error);
        statsList.innerHTML = `<p style="color: red; text-align: center;">Gagal memuat data statistik.</p>`;
    } finally {
        statsLoading.classList.add("hidden");
        statsList.classList.remove("hidden");
    }
}

if (mainMenuQuestionStatsButton) {
    mainMenuQuestionStatsButton.addEventListener("click", showQuestionStats);
}
if (kembaliKeMainMenuFromStats) {
    kembaliKeMainMenuFromStats.addEventListener("click", () => {
        showView(mainMenuViewContainer);
    });
}

