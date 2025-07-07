// --- IMPOR FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyDnJvECVfNJIXPh9rZTsA3QcHQaTiE4Awc", // GANTI DENGAN API KEY ANDA
    authDomain: "apodaca-bessie4762.firebaseapp.com", // GANTI DENGAN AUTH DOMAIN ANDA
    projectId: "apodaca-bessie4762", // GANTI DENGAN PROJECT ID ANDA
    storageBucket: "apodaca-bessie4762.firebasestorage.app", // GANTI DENGAN STORAGE BUCKET ANDA
    messagingSenderId: "809433417541", // GANTI DENGAN MESSAGING SENDER ID ANDA
    appId: "1:809433417541:web:48632b970a90840ab1602c" // GANTI DENGAN APP ID ANDA
};

// --- GLOBAL VARIABLES ---
let db;
let allCategoryQuestions = [];
const TRYOUT_QUESTION_LIMIT = 180;
const TRYOUT_TIME_LIMIT_MINUTES = 180;
let questions = [], questionStates = [], quizHistory = [];
let currentQuestionIndex = 0, score = 0;
let isTryOut = false, isReviewMode = false, currentQuizMode = null;
let currentQuizTitle = "", currentCategoryFileName = null;
let previousViewForQuiz = null;
let selectedOptionIndex = -1, answerSubmitted = false;
let overallTimerInterval = null, timeLeftOverallSeconds = TRYOUT_TIME_LIMIT_MINUTES * 60;
let completedQuizData = { questions: [], questionStates: [], quizName: "" };

// --- DOM ELEMENT SELECTORS ---
const mainMenuViewContainer = document.getElementById('main-menu-container');
const mainMenuLatihanSoalButton = document.getElementById('main-menu-latihan-soal');
const mainMenuTryoutButton = document.getElementById('main-menu-tryout');
const mainMenuHistoryButton = document.getElementById('main-menu-history');
const historyContainer = document.getElementById('history-container');
const historyListContainer = document.getElementById('history-list-container');
const noHistoryMessage = document.getElementById('no-history-message');
const kembaliKeMainMenuFromHistory = document.getElementById('kembali-ke-main-menu-from-history');
const latihanSoalSubmenuContainer = document.getElementById('latihan-soal-submenu-container');
const latihanDepartemenButton = document.getElementById('latihan-departemen-button');
const latihanGabunganButton = document.getElementById('latihan-gabungan-button');
const kembaliKeMainMenuFromLatihanSubmenu = document.getElementById('kembali-ke-main-menu-from-latihan-submenu');
const tryoutSubmenuContainer = document.getElementById('tryout-submenu-container');
const tryoutGabunganSemuaButton = document.getElementById('tryout-gabungan-semua-button');
const tryoutModeSeriusButton = document.getElementById('tryout-mode-serius-button');
const kembaliKeMainMenuFromTryoutSubmenu = document.getElementById('kembali-ke-main-menu-from-tryout-submenu');
const kategoriLatihanContainer = document.getElementById('kategori-latihan-container');
const kategoriButtons = document.querySelectorAll('.kategori-button');
const kembaliKeLatihanSubmenuFromKategori = document.getElementById('kembali-ke-latihan-submenu-from-kategori');
const tryoutSeriusContainer = document.getElementById('tryout-serius-container');
const tryoutSeriusButtons = document.querySelectorAll('.tryout-serius-button');
const kembaliKeTryoutSubmenuFromSerius = document.getElementById('kembali-ke-tryout-submenu-from-serius');
const quizLayoutContainer = document.getElementById('quiz-layout-container');
const questionElement = document.getElementById('question');
const optionsContainer = document.getElementById('options-container');
const explanationElement = document.getElementById('explanation');
const nextQuestionButton = document.getElementById('next-question-button');
const quizBackButton = document.getElementById('quiz-back-button');
const doubtfulButton = document.getElementById('doubtful-button');
const userNameDisplaySidebar = document.getElementById('user-name-display');
const timerDisplaySidebar = document.getElementById('timer-display-sidebar');
const timeLeftSidebarElement = document.getElementById('time-left-sidebar');
const questionNavigationGrid = document.getElementById('question-navigation-grid');
const questionCounterElement = document.getElementById('question-counter');
const questionNavTitle = document.getElementById('question-nav-title');
const resultContainer = document.getElementById('result-container');
const resultTitleElement = document.getElementById('result-title');
const scoreElement = document.getElementById('score');
const restartButton = document.getElementById('restart-button');
const reviewAnswersButton = document.getElementById('review-answers-button');
const retryIncorrectButton = document.getElementById('retry-incorrect-button');
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

// --- FIREBASE AUTH & SESSION LOGIC ---
let heartbeatIntervalId = null;
const STALE_SESSION_THRESHOLD = 5 * 60 * 1000;
const HEARTBEAT_INTERVAL = 2 * 60 * 1000;

function generateClientSessionId() { return Math.random().toString(36).substring(2, 15) + Date.now().toString(36); }
function clearLocalSessionData() {
    sessionStorage.removeItem('licenseValidated');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('licenseKey');
    sessionStorage.removeItem('clientSessionId');
}

function resetAppState() {
    questions = []; allCategoryQuestions = []; questionStates = []; quizHistory = [];
    currentQuestionIndex = 0; score = 0;
    isTryOut = false; isReviewMode = false; currentQuizMode = null;
    stopOverallTimer();
    Object.keys(localStorage).forEach(key => { if (key.startsWith('quizProgress_')) localStorage.removeItem(key); });
    showLoginForm();
}
window.resetAppState = resetAppState;

function showLoginForm(message = "") {
    if (heartbeatIntervalId) { clearInterval(heartbeatIntervalId); heartbeatIntervalId = null; }
    clearLocalSessionData();
    licenseFormContainer.style.display = "block";
    mainAppContent.style.display = "none";
    if (licenseMsgElement) {
        licenseMsgElement.textContent = message;
        licenseMsgElement.style.color = message.toLowerCase().includes("gagal") || message.toLowerCase().includes("tidak") ? "#FF0000" : "#87CEFA";
    }
    submitLicenseButton.disabled = false;
    resetSessionButton.disabled = false;
    licenseInput.value = "";
    if (resetSessionMsgElement) resetSessionMsgElement.textContent = "";
}

function proceedToApp(userName, licenseKey, clientSessionId) {
    if (welcomeUserMessageEl) welcomeUserMessageEl.textContent = `SELAMAT DATANG, ${userName.toUpperCase()}!`;
    if (userNameDisplaySidebar) userNameDisplaySidebar.textContent = userName;
    sessionStorage.setItem('licenseValidated', 'true');
    sessionStorage.setItem('userName', userName);
    sessionStorage.setItem('licenseKey', licenseKey);
    sessionStorage.setItem('clientSessionId', clientSessionId);
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
        if (docSnap.exists() && docSnap.data().active === true && docSnap.data().activeSessionId === clientSessionId) {
            await updateDoc(docRef, { lastSeenAt: serverTimestamp() });
        } else {
            showLoginForm("Sesi Anda telah diakhiri karena lisensi digunakan di tempat lain.");
        }
    } catch (error) { console.error("Heartbeat error:", error); }
}

function startHeartbeat(licenseKey, clientSessionId) {
    if (heartbeatIntervalId) clearInterval(heartbeatIntervalId);
    heartbeat(licenseKey, clientSessionId);
    heartbeatIntervalId = setInterval(() => { heartbeat(licenseKey, clientSessionId); }, HEARTBEAT_INTERVAL);
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
        licenseMsgElement.textContent = "Memeriksa..."; submitLicenseButton.disabled = true;
        try {
            const docRef = doc(db, "licenses", licenseKey);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().active === true) {
                const licenseData = docSnap.data();
                const lastSeenTimestamp = licenseData.lastSeenAt; 
                const lastSeenDate = lastSeenTimestamp ? lastSeenTimestamp.toDate() : null;
                const canTakeLicense = !licenseData.activeSessionId || (lastSeenDate && (new Date().getTime() - lastSeenDate.getTime()) > STALE_SESSION_THRESHOLD);
                if (canTakeLicense) {
                    const newClientSessionId = generateClientSessionId();
                    await updateDoc(docRef, { activeSessionId: newClientSessionId, lastSeenAt: serverTimestamp(), userName: inputUserName });
                    proceedToApp(inputUserName, licenseKey, newClientSessionId);
                } else {
                    licenseMsgElement.textContent = "Lisensi ini sedang aktif digunakan di perangkat lain."; licenseMsgElement.style.color = "#FF0000";
                }
            } else {
                licenseMsgElement.textContent = "Lisensi tidak valid atau tidak aktif."; licenseMsgElement.style.color = "#FF0000";
            }
        } catch (error) { licenseMsgElement.textContent = `Terjadi kesalahan. Coba lagi.`; console.error(error);
        } finally { submitLicenseButton.disabled = false; }
    });

    resetSessionButton.addEventListener("click", async () => {
        const licenseKeyToReset = licenseInput.value.trim();
        if (!licenseKeyToReset) { resetSessionMsgElement.textContent = "Masukkan kode lisensi yang ingin direset."; resetSessionMsgElement.style.color = "#FFFF00"; return; }
        resetSessionMsgElement.textContent = "Memproses..."; resetSessionButton.disabled = true;
        try {
            const docRef = doc(db, "licenses", licenseKeyToReset);
            await updateDoc(docRef, { activeSessionId: null, lastSeenAt: serverTimestamp() });
            resetSessionMsgElement.textContent = "Reset berhasil. Silakan coba masuk lagi."; resetSessionMsgElement.style.color = "#90EE90";
        } catch (error) { resetSessionMsgElement.textContent = "Gagal mereset. Lisensi tidak ditemukan."; resetSessionMsgElement.style.color = "#FF0000";
        } finally { resetSessionButton.disabled = false; }
    });

    logoutButton.addEventListener('click', async () => {
        const licenseKey = sessionStorage.getItem('licenseKey');
        if (db && licenseKey) {
            try { const docRef = doc(db, "licenses", licenseKey); await updateDoc(docRef, { activeSessionId: null });
            } catch (error) { console.error("Error on logout:", error); }
        }
        showLoginForm("Anda telah berhasil logout.");
    });
}

function checkExistingSession() {
    if (sessionStorage.getItem('licenseValidated') === 'true') {
        const savedUserName = sessionStorage.getItem('userName');
        const savedLicenseKey = sessionStorage.getItem('licenseKey');
        const savedClientSessionId = sessionStorage.getItem('clientSessionId');
        if (savedUserName && savedLicenseKey && savedClientSessionId) {
            (async () => {
                const docRef = doc(db, "licenses", savedLicenseKey);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().activeSessionId === savedClientSessionId) {
                    proceedToApp(savedUserName, savedLicenseKey, savedClientSessionId);
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
    const allViews = [ mainMenuViewContainer, latihanSoalSubmenuContainer, tryoutSubmenuContainer, kategoriLatihanContainer, tryoutSeriusContainer, historyContainer, quizLayoutContainer, resultContainer ];
    allViews.forEach(view => { if (view) view.classList.toggle('hidden', view !== viewToShow); });
}
window.showView = showView;

// [.. Salin semua fungsi helper lainnya (getLocalStorageKey, loadHistory, saveHistory, shuffleArray, dll) dari script.js sebelumnya ..]
// Kode di bawah ini sebagian besar tidak berubah, hanya fungsi saveHistory yang dimodifikasi.
async function saveHistory() {
    if (quizHistory.length === 0) return;
    const latestResult = quizHistory[quizHistory.length - 1];
    try { localStorage.setItem(getLocalStorageKey('history'), JSON.stringify(quizHistory)); } catch (e) { console.error("Gagal menyimpan riwayat ke localStorage:", e); }
    const licenseKey = sessionStorage.getItem('licenseKey');
    if (!db || !licenseKey) { console.warn("Firestore db atau licenseKey tidak tersedia. Riwayat tidak dikirim ke server."); return; }
    try {
        const historyDataForFirestore = {
            licenseKey: licenseKey,
            userName: sessionStorage.getItem('userName') || 'N/A',
            quizId: latestResult.id.toString(),
            quizName: latestResult.quizName,
            score: latestResult.score,
            totalQuestions: latestResult.totalQuestions,
            date: serverTimestamp()
        };
        await addDoc(collection(db, "quiz_history"), historyDataForFirestore);
        console.log("Riwayat kuis berhasil dikirim ke Firestore.");
    } catch (error) { console.error("Gagal mengirim riwayat ke Firestore:", error); }
}

function getLocalStorageKey(type) { const sessionUserName = sessionStorage.getItem('userName') || 'defaultUser'; if (type === 'history') return `quizHistory_${sessionUserName}`; if (type === 'progress') return `quizProgress_${sessionUserName}_${currentQuizMode}_${currentQuizTitle}`; return null; }
function loadHistory() { try { const savedHistory = localStorage.getItem(getLocalStorageKey('history')); quizHistory = savedHistory ? JSON.parse(savedHistory) : []; } catch (e) { quizHistory = []; } }
function renderHistory() { loadHistory(); historyListContainer.innerHTML = ''; if (quizHistory.length === 0) { noHistoryMessage.classList.remove('hidden'); return; } noHistoryMessage.classList.add('hidden'); quizHistory.slice().reverse().forEach(item => { const date = new Date(item.date).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }); const card = document.createElement('div'); card.className = 'history-item-card'; card.innerHTML = `<h4>${item.quizName}</h4><p><strong>Tanggal:</strong> ${date}</p><p><strong>Skor:</strong> ${item.score} / ${item.totalQuestions}</p>`; historyListContainer.appendChild(card); }); }
function saveProgress() { if (!isTryOut || isReviewMode) return; try { const progress = { questions, questionStates, currentQuestionIndex, timeLeftOverallSeconds, currentQuizMode, currentQuizTitle, timestamp: Date.now() }; localStorage.setItem(getLocalStorageKey('progress'), JSON.stringify(progress)); } catch (e) { console.error("Failed to save progress:", e); } }
function loadProgress() { try { const savedProgress = localStorage.getItem(getLocalStorageKey('progress')); if (savedProgress) return JSON.parse(savedProgress); return null; } catch (e) { console.error("Failed to load progress:", e); return null; } }
function clearProgress() { try { localStorage.removeItem(getLocalStorageKey('progress')); } catch (e) { console.error("Failed to clear progress:", e); } }
function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } }
function loadQuestionData(fileName, callback) { fetch(fileName).then(response => response.ok ? response.json() : Promise.reject(`HTTP error! Status: ${response.status}`)).then(data => { if (Array.isArray(data) && data.length > 0) { shuffleArray(data); questions = [...data]; callback(); } else { alert(`Gagal memuat atau tidak ada soal di ${fileName}.`); } }).catch(error => alert(`Error memuat ${fileName}: ${error.message}.`)); }
async function loadMultipleQuestionData(fileNames, allLoadedCallback) { allCategoryQuestions = []; const fetchPromises = fileNames.map(fileName => fetch(fileName).then(response => response.ok ? response.json() : []).then(data => ({ fileName, data })).catch(() => ({ fileName, data: [] })) ); const results = await Promise.all(fetchPromises); results.forEach(result => { if (Array.isArray(result.data) && result.data.length > 0) { allCategoryQuestions.push(...result.data.map(q => ({ ...q, category: result.fileName.replace('.json', '') }))); } }); allLoadedCallback(); }
function formatCategoryName(shortName) { const nameMap = { "jiwa": "Keperawatan Jiwa", "anak": "Keperawatan Anak", "keluarga": "Keperawatan Keluarga", "komunitas": "Keperawatan Komunitas", "bedah": "Keperawatan Medikal Bedah", "gadar": "Keperawatan Gawat Darurat", "manajemen": "Manajemen Keperawatan", "gabungan": "Soal Gabungan" }; return nameMap[shortName.toLowerCase()] || shortName.charAt(0).toUpperCase() + shortName.slice(1); }
function startGame(sourceViewElement) { previousViewForQuiz = sourceViewElement; currentQuestionIndex = 0; score = 0; selectedOptionIndex = -1; answerSubmitted = false; isReviewMode = false; const sessionUserName = sessionStorage.getItem('userName') || "Pengguna"; userNameDisplaySidebar.innerText = sessionUserName; if (!questions || questions.length === 0) { alert("Tidak ada soal, kuis tidak dapat dimulai."); showView(sourceViewElement); return; } questionStates = questions.map(() => ({ answered: false, doubtful: false, selectedAnswer: -1 })); if (isTryOut) { timerDisplaySidebar.classList.remove('hidden'); doubtfulButton.classList.remove('hidden'); startOverallTimer(); } else { timerDisplaySidebar.classList.add('hidden'); doubtfulButton.classList.add('hidden'); stopOverallTimer(); } showView(quizLayoutContainer); renderQuestionNavigation(); showQuestion(questions[currentQuestionIndex]); }
function restoreGame(progress, sourceViewElement) { previousViewForQuiz = sourceViewElement; questions = progress.questions; questionStates = progress.questionStates; currentQuestionIndex = progress.currentQuestionIndex; timeLeftOverallSeconds = progress.timeLeftOverallSeconds; currentQuizMode = progress.currentQuizMode; currentQuizTitle = progress.currentQuizTitle; isTryOut = true; isReviewMode = false; score = 0; const sessionUserName = sessionStorage.getItem('userName') || "Pengguna"; userNameDisplaySidebar.innerText = sessionUserName; timerDisplaySidebar.classList.remove('hidden'); doubtfulButton.classList.remove('hidden'); startOverallTimer(); showView(quizLayoutContainer); renderQuestionNavigation(); showQuestion(questions[currentQuestionIndex]); }
function startOverallTimer() { stopOverallTimer(); updateOverallTimerDisplaySidebar(); overallTimerInterval = setInterval(() => { timeLeftOverallSeconds--; updateOverallTimerDisplaySidebar(); if (timeLeftOverallSeconds % 10 === 0) saveProgress(); if (timeLeftOverallSeconds <= 0) { finalizeTryOut("Waktu Habis!"); } }, 1000); }
function stopOverallTimer() { clearInterval(overallTimerInterval); }
function updateOverallTimerDisplaySidebar() { const minutes = Math.floor(timeLeftOverallSeconds / 60); const seconds = timeLeftOverallSeconds % 60; timeLeftSidebarElement.innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`; }
function finalizeTryOut(message = "Try Out Selesai!") { alert(message); stopOverallTimer(); showResult(); clearProgress(); }
function renderQuestionNavigation() { if (!questionNavigationGrid) return; questionNavigationGrid.innerHTML = ''; const items = isReviewMode ? completedQuizData.questions : questions; const states = isReviewMode ? completedQuizData.questionStates : questionStates; items.forEach((_, index) => { const navBox = document.createElement('div'); navBox.className = 'nav-question-box'; navBox.innerText = index + 1; navBox.dataset.index = index; const state = states[index]; if (state) { if (isReviewMode) { if(state.selectedAnswer === items[index].answer) navBox.classList.add('review-correct'); else navBox.classList.add('review-incorrect'); } else { if (state.answered) navBox.classList.add('answered'); if (state.doubtful) navBox.classList.add('doubtful'); } } if (index === currentQuestionIndex) navBox.classList.add('current'); navBox.addEventListener('click', () => { if (isTryOut && !isReviewMode) questionStates[currentQuestionIndex].selectedAnswer = selectedOptionIndex; currentQuestionIndex = parseInt(navBox.dataset.index); if (!isReviewMode) selectedOptionIndex = states[currentQuestionIndex]?.selectedAnswer ?? -1; showQuestion(items[currentQuestionIndex]); }); questionNavigationGrid.appendChild(navBox); }); }
function showQuestion(questionData) { if (!questionData) return; const currentQState = (isReviewMode ? completedQuizData.questionStates : questionStates)[currentQuestionIndex]; questionNavTitle.textContent = isReviewMode ? "Navigasi Tinjauan" : "Navigasi Soal"; questionCounterElement.innerText = `Soal ${currentQuestionIndex + 1} dari ${isReviewMode ? completedQuizData.questions.length : questions.length}`; renderQuestionNavigation(); questionElement.textContent = questionData.question; optionsContainer.innerHTML = ''; explanationElement.classList.add('hidden'); doubtfulButton.classList.toggle('hidden', isReviewMode || !isTryOut); if (!isReviewMode && isTryOut) doubtfulButton.textContent = currentQState.doubtful ? "Hapus Tanda Ragu" : "Tandai Ragu-ragu"; questionData.options.forEach((option, index) => { const button = document.createElement('button'); button.textContent = option; button.className = 'option-button'; if (!isReviewMode) button.addEventListener('click', () => selectOption(index)); else button.disabled = true; optionsContainer.appendChild(button); }); const optionButtons = optionsContainer.querySelectorAll('.option-button'); if (isReviewMode) { explanationElement.innerHTML = `<strong>Penjelasan:</strong> ${questionData.explanation || 'Tidak ada penjelasan.'}`; explanationElement.classList.remove('hidden'); if (currentQState.selectedAnswer === questionData.answer) { optionButtons[questionData.answer].classList.add('correct'); } else { if(currentQState.selectedAnswer !== -1) optionButtons[currentQState.selectedAnswer].classList.add('incorrect'); optionButtons[questionData.answer].classList.add('correct'); } } else { if (isTryOut) { if (currentQState.selectedAnswer !== -1) optionButtons[currentQState.selectedAnswer].classList.add('selected-tryout'); } else { if (currentQState.answered) submitAnswerForLatihan(true); } } const isLastQuestion = currentQuestionIndex >= (isReviewMode ? completedQuizData.questions.length : questions.length) - 1; if (isLastQuestion) nextQuestionButton.textContent = isReviewMode ? "Kembali ke Hasil" : (isTryOut ? "Selesaikan Try Out" : "Lihat Hasil"); else nextQuestionButton.textContent = "Soal Berikutnya"; }
function selectOption(selectedIndex) { if (isReviewMode || (!isTryOut && questionStates[currentQuestionIndex]?.answered)) return; selectedOptionIndex = selectedIndex; questionStates[currentQuestionIndex].selectedAnswer = selectedIndex; optionsContainer.querySelectorAll('.option-button').forEach((button, i) => button.classList.toggle('selected-tryout', i === selectedIndex)); if (!isTryOut) submitAnswerForLatihan(false); else { questionStates[currentQuestionIndex].answered = true; renderQuestionNavigation(); } }
function submitAnswerForLatihan(isReshow) { const currentQ = questions[currentQuestionIndex]; const currentQState = questionStates[currentQuestionIndex]; if (!isReshow) { currentQState.answered = true; answerSubmitted = true; if (selectedOptionIndex === currentQ.answer) score++; } optionsContainer.querySelectorAll('.option-button').forEach(btn => btn.disabled = true); if (selectedOptionIndex === currentQ.answer) optionsContainer.children[selectedOptionIndex].classList.add('correct'); else { if (selectedOptionIndex !== -1) optionsContainer.children[selectedOptionIndex].classList.add('incorrect'); optionsContainer.children[currentQ.answer].classList.add('correct'); } explanationElement.innerHTML = `<strong>Penjelasan:</strong> ${currentQ.explanation || 'Tidak ada penjelasan.'}`; explanationElement.classList.remove('hidden'); renderQuestionNavigation(); }
function showResult() { stopOverallTimer(); completedQuizData = { questions: [...questions], questionStates: [...questionStates], quizName: currentQuizTitle }; let finalScore = 0, incorrectCount = 0; const categoryBreakdown = {}; questions.forEach((q, index) => { const state = questionStates[index]; const isCorrect = state.selectedAnswer === q.answer; if(isCorrect) finalScore++; if(state.selectedAnswer !== -1 && !isCorrect) incorrectCount++; if (currentQuizMode === 'tryout-gabungan-semua') { const categoryKey = q.category || 'lainnya'; if (!categoryBreakdown[categoryKey]) categoryBreakdown[categoryKey] = { correct: 0, total: 0 }; categoryBreakdown[categoryKey].total++; if (isCorrect) categoryBreakdown[categoryKey].correct++; } }); if (!isTryOut) finalScore = score; if(currentQuizMode !== 'latihan-salah'){ loadHistory(); quizHistory.push({ id: Date.now(), quizName: currentQuizTitle, score: finalScore, totalQuestions: questions.length, date: new Date().toISOString() }); saveHistory(); } resultTitleElement.textContent = `Hasil ${currentQuizTitle}`; const sessionUserName = sessionStorage.getItem('userName') || "Pengguna"; let message = `<span class="user-name-result">Selamat ${sessionUserName}!</span><br>Skor Anda: <span class="score-value">${finalScore}</span> benar dari ${questions.length} soal.<br>`; if (currentQuizMode === 'tryout-gabungan-semua') { message += `<span class="category-breakdown-title">Rincian Per Kategori:</span><br>`; for (const key in categoryBreakdown) message += `<span class="category-item"><span class="category-name">${formatCategoryName(key)}</span>: <span class="category-score">${categoryBreakdown[key].correct} / ${categoryBreakdown[key].total}</span> benar.</span><br>`; } else if (currentQuizMode === 'tryout-serius') { let feedback = "ANDA BELUM MENJAWAB DENGAN BENAR, COBA LAGI!"; if (finalScore >= 1 && finalScore <= 90) feedback = "NILAI KURANG, BELAJAR LEBIH GIAT LAGI"; else if (finalScore >= 91 && finalScore <= 120) feedback = "NILAI CUKUP, BELAJAR LAGI"; else if (finalScore >= 121) feedback = "NILAI BAGUS, PERTAHANKAN"; message += `Tanggapan: <strong>${feedback}</strong><br>`; } scoreElement.innerHTML = message; reviewAnswersButton.classList.remove('hidden'); retryIncorrectButton.classList.toggle('hidden', incorrectCount === 0); showView(resultContainer); }

window.addEventListener('beforeunload', () => { if (isTryOut && !isReviewMode) { saveProgress(); } });

// --- INITIALIZE APP ---
// Attach menu navigation listeners
mainMenuLatihanSoalButton.addEventListener('click', () => showView(latihanSoalSubmenuContainer));
mainMenuTryoutButton.addEventListener('click', () => showView(tryoutSubmenuContainer));
mainMenuHistoryButton.addEventListener('click', () => { renderHistory(); showView(historyContainer); });
kembaliKeMainMenuFromHistory.addEventListener('click', () => showView(mainMenuViewContainer));
latihanDepartemenButton.addEventListener('click', () => showView(kategoriLatihanContainer));
kembaliKeMainMenuFromLatihanSubmenu.addEventListener('click', () => showView(mainMenuViewContainer));
tryoutModeSeriusButton.addEventListener('click', () => showView(tryoutSeriusContainer));
kembaliKeMainMenuFromTryoutSubmenu.addEventListener('click', () => showView(mainMenuViewContainer));
kembaliKeLatihanSubmenuFromKategori.addEventListener('click', () => showView(latihanSoalSubmenuContainer));
kembaliKeTryoutSubmenuFromSerius.addEventListener('click', () => showView(tryoutSubmenuContainer));
latihanGabunganButton.addEventListener('click', () => { currentQuizMode = 'latihan-gabungan'; currentQuizTitle = 'Latihan Soal Gabungan'; isTryOut = false; currentCategoryFileName = "gabungan.json"; loadQuestionData(currentCategoryFileName, () => startGame(latihanSoalSubmenuContainer)); });
tryoutGabunganSemuaButton.addEventListener('click', () => { currentQuizMode = 'tryout-gabungan-semua'; currentQuizTitle = 'Try Out Gabungan'; isTryOut = true; currentCategoryFileName = null; const categoryDataFiles = ["anak.json", "bedah.json", "gadar.json", "jiwa.json", "keluarga.json", "komunitas.json", "manajemen.json"]; const savedProgress = loadProgress(); if (savedProgress) { if (confirm("Anda memiliki sesi Try Out Gabungan yang belum selesai. Lanjutkan?")) { restoreGame(savedProgress, tryoutSubmenuContainer); return; } else { clearProgress(); } } loadMultipleQuestionData(categoryDataFiles, () => { shuffleArray(allCategoryQuestions); questions = allCategoryQuestions.slice(0, TRYOUT_QUESTION_LIMIT); startGame(tryoutSubmenuContainer); }); });
kategoriButtons.forEach(button => { button.addEventListener('click', () => { currentQuizMode = 'latihan-departemen'; isTryOut = false; currentCategoryFileName = button.dataset.script.replace('.js', '.json'); currentQuizTitle = formatCategoryName(currentCategoryFileName.replace('.json', '')); loadQuestionData(currentCategoryFileName, () => startGame(kategoriLatihanContainer)); }); });
tryoutSeriusButtons.forEach(button => { button.addEventListener('click', () => { currentQuizMode = 'tryout-serius'; currentQuizTitle = button.dataset.type; isTryOut = true; const dataFile = button.dataset.file; const savedProgress = loadProgress(); if (savedProgress) { if (confirm(`Anda memiliki sesi ${currentQuizTitle} yang belum selesai. Lanjutkan?`)) { restoreGame(savedProgress, tryoutSeriusContainer); return; } else { clearProgress(); } } loadQuestionData(dataFile, () => { questions = questions.slice(0, TRYOUT_QUESTION_LIMIT); startGame(tryoutSeriusContainer); }); }); });
restartButton.addEventListener('click', () => { isReviewMode = false; showView(mainMenuViewContainer); });
reviewAnswersButton.addEventListener('click', () => { isReviewMode = true; currentQuestionIndex = 0; questions = [...completedQuizData.questions]; questionStates = [...completedQuizData.questionStates]; showView(quizLayoutContainer); renderQuestionNavigation(); showQuestion(questions[currentQuestionIndex]); });
retryIncorrectButton.addEventListener('click', () => { const incorrectQuestions = completedQuizData.questions.filter((q, index) => { const state = completedQuizData.questionStates[index]; return state.selectedAnswer !== -1 && state.selectedAnswer !== q.answer; }); if (incorrectQuestions.length > 0) { questions = incorrectQuestions; currentQuizMode = 'latihan-salah'; currentQuizTitle = `Latihan Ulang Soal Salah (${completedQuizData.quizName})`; isTryOut = false; isReviewMode = false; startGame(resultContainer); } });
doubtfulButton.addEventListener('click', () => { if (!isTryOut || isReviewMode || !questionStates[currentQuestionIndex]) return; const currentQState = questionStates[currentQuestionIndex]; currentQState.doubtful = !currentQState.doubtful; doubtfulButton.textContent = currentQState.doubtful ? "Hapus Tanda Ragu" : "Tandai Ragu-ragu"; renderQuestionNavigation(); saveProgress(); });
nextQuestionButton.addEventListener('click', () => { if (isTryOut && !isReviewMode) { questionStates[currentQuestionIndex].selectedAnswer = selectedOptionIndex; if (!questionStates[currentQuestionIndex].answered && selectedOptionIndex !== -1) { questionStates[currentQuestionIndex].answered = true; } saveProgress(); } const isLastQuestion = currentQuestionIndex >= (isReviewMode ? completedQuizData.questions.length : questions.length) - 1; if (!isLastQuestion) { currentQuestionIndex++; if (!isReviewMode) { selectedOptionIndex = questionStates[currentQuestionIndex]?.selectedAnswer ?? -1; answerSubmitted = questionStates[currentQuestionIndex]?.answered ?? false; } showQuestion(questions[currentQuestionIndex]); } else { if (isReviewMode) { showView(resultContainer); } else if (isTryOut) { finalizeTryOut(); } else { showResult(); } } });
quizBackButton.addEventListener('click', () => { if (isReviewMode) { isReviewMode = false; showView(resultContainer); return; } if (confirm("Anda yakin ingin kembali? Progress kuis ini akan hilang.")) { stopOverallTimer(); if (isTryOut) clearProgress(); isTryOut = false; currentQuizMode = null; showView(previousViewForQuiz || mainMenuViewContainer); } });

// Initialize Firebase and Auth Logic
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase Initialized Successfully.");
    attachAuthEventListeners();
    checkExistingSession();
} catch (error) {
    console.error("Firebase Initialization Failed:", error);
    if(licenseMsgElement) {
        licenseMsgElement.textContent = "Gagal koneksi ke server. Coba lagi nanti.";
        licenseMsgElement.style.color = "#FF0000";
    }
}
