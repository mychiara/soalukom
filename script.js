// --- GLOBAL STATE VARIABLES ---
let allCategoryQuestions = [];
const TRYOUT_QUESTION_LIMIT = 180;
const TRYOUT_TIME_LIMIT_MINUTES = 180;

let questions = []; // Soal untuk kuis/latihan saat ini
let questionStates = []; // Status setiap soal (jawaban, ragu-ragu, dll)
let quizHistory = []; // Riwayat semua kuis yang telah selesai

let currentQuestionIndex = 0;
let score = 0;
let userName = "";

// --- Mode and State Flags ---
let isTryOut = false;
let isReviewMode = false;
let currentQuizMode = null; // 'latihan-departemen', 'tryout-serius', 'latihan-salah', dll.
let currentQuizTitle = ""; // Judul kuis saat ini untuk riwayat, cth: "TO Tipe 1"
let currentCategoryFileName = null;
let previousViewForQuiz = null;
let previousViewForResult = null;

let selectedOptionIndex = -1;
let answerSubmitted = false; // Flag untuk mode latihan

let overallTimerInterval = null;
let timeLeftOverallSeconds = TRYOUT_TIME_LIMIT_MINUTES * 60;

// Variabel untuk menyimpan data kuis yang sedang direview atau akan diulang
let completedQuizData = {
    questions: [],
    questionStates: []
};


console.log("script.js: Initializing DOM Elements...");

// --- DOM ELEMENT SELECTORS ---
// Main Menu & Submenus & History
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

// Kategori & Tryout Serius Selection
const kategoriLatihanContainer = document.getElementById('kategori-latihan-container');
const kategoriButtons = document.querySelectorAll('.kategori-button');
const kembaliKeLatihanSubmenuFromKategori = document.getElementById('kembali-ke-latihan-submenu-from-kategori');

const tryoutSeriusContainer = document.getElementById('tryout-serius-container');
const tryoutSeriusButtons = document.querySelectorAll('.tryout-serius-button');
const kembaliKeTryoutSubmenuFromSerius = document.getElementById('kembali-ke-tryout-submenu-from-serius');

// Quiz Elements
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

// Result Elements
const resultContainer = document.getElementById('result-container');
const resultTitleElement = document.getElementById('result-title');
const scoreElement = document.getElementById('score');
const restartButton = document.getElementById('restart-button');
const reviewAnswersButton = document.getElementById('review-answers-button');
const retryIncorrectButton = document.getElementById('retry-incorrect-button');


// --- VIEW MANAGEMENT ---
function showView(viewToShow) {
    const allViews = [
        mainMenuViewContainer, latihanSoalSubmenuContainer, tryoutSubmenuContainer,
        kategoriLatihanContainer, tryoutSeriusContainer, historyContainer,
        quizLayoutContainer, resultContainer
    ];
    allViews.forEach(view => {
        if (view) view.classList.toggle('hidden', view !== viewToShow);
    });
    const licenseForm = document.getElementById("license-form-container");
    if (licenseForm && viewToShow !== licenseForm && licenseForm.style.display !== 'none') {
        licenseForm.style.display = 'none';
    }
}
window.showView = showView;

// --- APP STATE RESET & INITIALIZATION ---
function resetAppStateForLogout() {
    console.log("script.js: resetAppStateForLogout called.");
    userName = "";
    questions = []; allCategoryQuestions = []; questionStates = []; quizHistory = [];
    currentQuestionIndex = 0; score = 0;
    isTryOut = false; isReviewMode = false; currentQuizMode = null;
    previousViewForQuiz = null; previousViewForResult = null;
    stopOverallTimer();
    
    // Clear relevant localStorage
    if (localStorage) {
       Object.keys(localStorage).forEach(key => {
            if (key.startsWith('quizProgress_')) {
                localStorage.removeItem(key);
            }
       });
    }

    // Reset UI elements...
    showView(document.getElementById('license-form-container')); // Fallback to license form
    document.getElementById('main-app-content').style.display = 'none';
}
window.resetAppState = resetAppStateForLogout;

// --- LOCAL STORAGE & HISTORY MANAGEMENT ---
function getLocalStorageKey(type) {
    const sessionUserName = sessionStorage.getItem('userName') || 'defaultUser';
    if (type === 'history') {
        return `quizHistory_${sessionUserName}`;
    }
    if (type === 'progress') {
        return `quizProgress_${sessionUserName}_${currentQuizMode}_${currentQuizTitle}`;
    }
    return null;
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
            timestamp: Date.now()
        };
        localStorage.setItem(getLocalStorageKey('progress'), JSON.stringify(progress));
    } catch (e) {
        console.error("Failed to save progress to localStorage:", e);
    }
}

function loadProgress() {
    try {
        const savedProgress = localStorage.getItem(getLocalStorageKey('progress'));
        if (savedProgress) {
            return JSON.parse(savedProgress);
        }
        return null;
    } catch (e) {
        console.error("Failed to load progress from localStorage:", e);
        return null;
    }
}

function clearProgress() {
    try {
        localStorage.removeItem(getLocalStorageKey('progress'));
    } catch (e) {
        console.error("Failed to clear progress from localStorage:", e);
    }
}

function loadHistory() {
    try {
        const savedHistory = localStorage.getItem(getLocalStorageKey('history'));
        quizHistory = savedHistory ? JSON.parse(savedHistory) : [];
    } catch (e) {
        console.error("Failed to load history:", e);
        quizHistory = [];
    }
}

function saveHistory() {
    try {
        localStorage.setItem(getLocalStorageKey('history'), JSON.stringify(quizHistory));
    } catch (e) {
        console.error("Failed to save history:", e);
    }
}

function renderHistory() {
    loadHistory();
    historyListContainer.innerHTML = '';
    if (quizHistory.length === 0) {
        noHistoryMessage.classList.remove('hidden');
        return;
    }

    noHistoryMessage.classList.add('hidden');
    // Show newest first
    quizHistory.slice().reverse().forEach(item => {
        const date = new Date(item.date).toLocaleString('id-ID', {
            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const card = document.createElement('div');
        card.className = 'history-item-card';
        card.innerHTML = `
            <h4>${item.quizName}</h4>
            <p><strong>Tanggal:</strong> ${date}</p>
            <p><strong>Skor:</strong> ${item.score} / ${item.totalQuestions}</p>
        `;
        historyListContainer.appendChild(card);
    });
}


// --- EVENT LISTENERS FOR MENU & NAVIGATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Main Menu
    if (mainMenuLatihanSoalButton) mainMenuLatihanSoalButton.addEventListener('click', () => showView(latihanSoalSubmenuContainer));
    if (mainMenuTryoutButton) mainMenuTryoutButton.addEventListener('click', () => showView(tryoutSubmenuContainer));
    if (mainMenuHistoryButton) {
        mainMenuHistoryButton.addEventListener('click', () => {
            renderHistory();
            showView(historyContainer);
        });
    }
    if (kembaliKeMainMenuFromHistory) kembaliKeMainMenuFromHistory.addEventListener('click', () => showView(mainMenuViewContainer));

    // Submenus
    if (latihanDepartemenButton) latihanDepartemenButton.addEventListener('click', () => showView(kategoriLatihanContainer));
    if (kembaliKeMainMenuFromLatihanSubmenu) kembaliKeMainMenuFromLatihanSubmenu.addEventListener('click', () => showView(mainMenuViewContainer));
    if (tryoutModeSeriusButton) tryoutModeSeriusButton.addEventListener('click', () => showView(tryoutSeriusContainer));
    if (kembaliKeMainMenuFromTryoutSubmenu) kembaliKeMainMenuFromTryoutSubmenu.addEventListener('click', () => showView(mainMenuViewContainer));
    if (kembaliKeLatihanSubmenuFromKategori) kembaliKeLatihanSubmenuFromKategori.addEventListener('click', () => showView(latihanSoalSubmenuContainer));
    if (kembaliKeTryoutSubmenuFromSerius) kembaliKeTryoutSubmenuFromSerius.addEventListener('click', () => showView(tryoutSubmenuContainer));

    // Quiz Launchers
    if (latihanGabunganButton) {
        latihanGabunganButton.addEventListener('click', () => {
            currentQuizMode = 'latihan-gabungan';
            currentQuizTitle = 'Latihan Soal Gabungan';
            isTryOut = false;
            currentCategoryFileName = "gabungan.json";
            loadQuestionData(currentCategoryFileName, () => startGame(latihanSoalSubmenuContainer));
        });
    }

    if (tryoutGabunganSemuaButton) {
        tryoutGabunganSemuaButton.addEventListener('click', () => {
            currentQuizMode = 'tryout-gabungan-semua';
            currentQuizTitle = 'Try Out Gabungan';
            isTryOut = true;
            currentCategoryFileName = null;
            const categoryDataFiles = ["anak.json", "bedah.json", "gadar.json", "jiwa.json", "keluarga.json", "komunitas.json", "manajemen.json"];
            const savedProgress = loadProgress();
            if (savedProgress) {
                if (confirm("Anda memiliki sesi Try Out Gabungan yang belum selesai. Lanjutkan?")) {
                    restoreGame(savedProgress, tryoutSubmenuContainer);
                    return;
                } else {
                    clearProgress();
                }
            }
            loadMultipleQuestionData(categoryDataFiles, () => {
                shuffleArray(allCategoryQuestions);
                questions = allCategoryQuestions.slice(0, TRYOUT_QUESTION_LIMIT);
                startGame(tryoutSubmenuContainer);
            });
        });
    }

    if (kategoriButtons.length > 0) {
        kategoriButtons.forEach(button => {
            button.addEventListener('click', () => {
                currentQuizMode = 'latihan-departemen';
                isTryOut = false;
                currentCategoryFileName = button.dataset.script.replace('.js', '.json');
                currentQuizTitle = formatCategoryName(currentCategoryFileName.replace('.json', ''));
                loadQuestionData(currentCategoryFileName, () => startGame(kategoriLatihanContainer));
            });
        });
    }
    
    if (tryoutSeriusButtons.length > 0) {
        tryoutSeriusButtons.forEach(button => {
            button.addEventListener('click', () => {
                currentQuizMode = 'tryout-serius';
                currentQuizTitle = button.dataset.type; // e.g. "TO Tipe 1"
                isTryOut = true;
                const dataFile = button.dataset.file;
                const savedProgress = loadProgress();
                if (savedProgress) {
                    if (confirm(`Anda memiliki sesi ${currentQuizTitle} yang belum selesai. Lanjutkan?`)) {
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
    }

    // Result Buttons
    restartButton.addEventListener('click', () => {
        isReviewMode = false;
        showView(mainMenuViewContainer);
    });

    reviewAnswersButton.addEventListener('click', () => {
        isReviewMode = true;
        currentQuestionIndex = 0;
        questions = [...completedQuizData.questions];
        questionStates = [...completedQuizData.questionStates];
        showView(quizLayoutContainer);
        renderQuestionNavigation();
        showQuestion(questions[currentQuestionIndex]);
    });
    
    retryIncorrectButton.addEventListener('click', () => {
        const incorrectQuestions = completedQuizData.questions.filter((q, index) => {
            const state = completedQuizData.questionStates[index];
            return state.selectedAnswer !== -1 && state.selectedAnswer !== q.answer;
        });
        
        if (incorrectQuestions.length > 0) {
            questions = incorrectQuestions;
            currentQuizMode = 'latihan-salah';
            currentQuizTitle = `Latihan Ulang Soal Salah (${completedQuizData.quizName})`;
            isTryOut = false;
            isReviewMode = false;
            startGame(resultContainer);
        }
    });

    // Quiz Navigation
    if (doubtfulButton) {
        doubtfulButton.addEventListener('click', () => {
            if (!isTryOut || isReviewMode || !questionStates[currentQuestionIndex]) return;
            const currentQState = questionStates[currentQuestionIndex];
            currentQState.doubtful = !currentQState.doubtful;
            doubtfulButton.textContent = currentQState.doubtful ? "Hapus Tanda Ragu" : "Tandai Ragu-ragu";
            renderQuestionNavigation();
            saveProgress();
        });
    }

    if (nextQuestionButton) {
        nextQuestionButton.addEventListener('click', () => {
            if (isTryOut && !isReviewMode) {
                questionStates[currentQuestionIndex].selectedAnswer = selectedOptionIndex;
                if (!questionStates[currentQuestionIndex].answered && selectedOptionIndex !== -1) {
                    questionStates[currentQuestionIndex].answered = true;
                }
                saveProgress();
            }

            const isLastQuestion = currentQuestionIndex >= questions.length - 1;

            if (!isLastQuestion) {
                currentQuestionIndex++;
                if (!isReviewMode) {
                    selectedOptionIndex = questionStates[currentQuestionIndex]?.selectedAnswer ?? -1;
                    answerSubmitted = questionStates[currentQuestionIndex]?.answered ?? false;
                }
                showQuestion(questions[currentQuestionIndex]);
            } else { // Last question
                if (isReviewMode) {
                    showView(resultContainer);
                } else if (isTryOut) {
                    finalizeTryOut();
                } else {
                    showResult();
                }
            }
        });
    }
    
    if (quizBackButton) {
        quizBackButton.addEventListener('click', () => {
            if (isReviewMode) {
                isReviewMode = false;
                showView(resultContainer);
                return;
            }

            if (confirm("Anda yakin ingin kembali? Progress kuis ini akan hilang.")) {
                stopOverallTimer();
                if (isTryOut) clearProgress();
                isTryOut = false; currentQuizMode = null;
                showView(previousViewForQuiz || mainMenuViewContainer);
            }
        });
    }
});


// --- CORE QUIZ LOGIC ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function loadQuestionData(fileName, callback) {
    fetch(fileName)
        .then(response => response.ok ? response.json() : Promise.reject(`HTTP error! Status: ${response.status}`))
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                shuffleArray(data);
                questions = [...data];
                callback();
            } else {
                alert(`Gagal memuat atau tidak ada soal di ${fileName}.`);
            }
        }).catch(error => alert(`Error memuat ${fileName}: ${error.message}.`));
}

async function loadMultipleQuestionData(fileNames, allLoadedCallback) {
    allCategoryQuestions = [];
    const fetchPromises = fileNames.map(fileName =>
        fetch(fileName)
        .then(response => response.ok ? response.json() : [])
        .then(data => ({ fileName, data }))
        .catch(() => ({ fileName, data: [] }))
    );
    const results = await Promise.all(fetchPromises);
    results.forEach(result => {
        if (Array.isArray(result.data) && result.data.length > 0) {
            allCategoryQuestions.push(...result.data.map(q => ({ ...q, category: result.fileName.replace('.json', '') })));
        }
    });
    allLoadedCallback();
}

function formatCategoryName(shortName) {
    const nameMap = { "jiwa": "Keperawatan Jiwa", "anak": "Keperawatan Anak", "keluarga": "Keperawatan Keluarga", "komunitas": "Keperawatan Komunitas", "bedah": "Keperawatan Medikal Bedah", "gadar": "Keperawatan Gawat Darurat", "manajemen": "Manajemen Keperawatan", "gabungan": "Soal Gabungan" };
    return nameMap[shortName.toLowerCase()] || shortName.charAt(0).toUpperCase() + shortName.slice(1);
}

function startGame(sourceViewElement) {
    previousViewForQuiz = sourceViewElement;
    currentQuestionIndex = 0; score = 0; selectedOptionIndex = -1;
    answerSubmitted = false; isReviewMode = false;

    userName = sessionStorage.getItem('userName') || "Pengguna";
    userNameDisplaySidebar.innerText = userName;

    if (!questions || questions.length === 0) {
        alert("Tidak ada soal, kuis tidak dapat dimulai.");
        showView(sourceViewElement); return;
    }
    questionStates = questions.map(() => ({ answered: false, doubtful: false, selectedAnswer: -1 }));

    if (isTryOut) {
        timerDisplaySidebar.classList.remove('hidden');
        doubtfulButton.classList.remove('hidden');
        startOverallTimer();
    } else {
        timerDisplaySidebar.classList.add('hidden');
        doubtfulButton.classList.add('hidden');
        stopOverallTimer();
    }
    
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
    score = 0; // Will be recalculated on finish

    userName = sessionStorage.getItem('userName') || "Pengguna";
    userNameDisplaySidebar.innerText = userName;

    timerDisplaySidebar.classList.remove('hidden');
    doubtfulButton.classList.remove('hidden');
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
        if (timeLeftOverallSeconds % 10 === 0) saveProgress(); // Save progress every 10 seconds
        if (timeLeftOverallSeconds <= 0) {
            finalizeTryOut("Waktu Habis!");
        }
    }, 1000);
}

function stopOverallTimer() { clearInterval(overallTimerInterval); }

function updateOverallTimerDisplaySidebar() {
    const minutes = Math.floor(timeLeftOverallSeconds / 60);
    const seconds = timeLeftOverallSeconds % 60;
    timeLeftSidebarElement.innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function finalizeTryOut(message = "Try Out Selesai!") {
    alert(message);
    stopOverallTimer();
    showResult();
    clearProgress();
}

function renderQuestionNavigation() {
    if (!questionNavigationGrid) return;
    questionNavigationGrid.innerHTML = '';
    const items = isReviewMode ? completedQuizData.questions : questions;
    const states = isReviewMode ? completedQuizData.questionStates : questionStates;

    items.forEach((_, index) => {
        const navBox = document.createElement('div');
        navBox.className = 'nav-question-box';
        navBox.innerText = index + 1;
        navBox.dataset.index = index;
        const state = states[index];

        if (state) {
            if (isReviewMode) {
                if(state.selectedAnswer === items[index].answer) {
                    navBox.classList.add('review-correct');
                } else {
                    navBox.classList.add('review-incorrect');
                }
            } else {
                if (state.answered) navBox.classList.add('answered');
                if (state.doubtful) navBox.classList.add('doubtful');
            }
        }
        if (index === currentQuestionIndex) navBox.classList.add('current');
        
        navBox.addEventListener('click', () => {
            if (isTryOut && !isReviewMode) {
                questionStates[currentQuestionIndex].selectedAnswer = selectedOptionIndex;
            }
            currentQuestionIndex = parseInt(navBox.dataset.index);
            if (!isReviewMode) {
                selectedOptionIndex = states[currentQuestionIndex]?.selectedAnswer ?? -1;
            }
            showQuestion(items[currentQuestionIndex]);
        });
        questionNavigationGrid.appendChild(navBox);
    });
}

function showQuestion(questionData) {
    if (!questionData) return;
    const currentQState = (isReviewMode ? completedQuizData.questionStates : questionStates)[currentQuestionIndex];
    
    questionNavTitle.textContent = isReviewMode ? "Navigasi Tinjauan" : "Navigasi Soal";
    questionCounterElement.innerText = `Soal ${currentQuestionIndex + 1} dari ${isReviewMode ? completedQuizData.questions.length : questions.length}`;
    renderQuestionNavigation();

    questionElement.textContent = questionData.question;
    optionsContainer.innerHTML = '';
    explanationElement.classList.add('hidden');
    
    doubtfulButton.classList.toggle('hidden', isReviewMode || !isTryOut);
    if (!isReviewMode && isTryOut) {
        doubtfulButton.textContent = currentQState.doubtful ? "Hapus Tanda Ragu" : "Tandai Ragu-ragu";
    }

    questionData.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option;
        button.className = 'option-button';
        if (!isReviewMode) {
            button.addEventListener('click', () => selectOption(index));
        } else {
            button.disabled = true;
        }
        optionsContainer.appendChild(button);
    });
    
    const optionButtons = optionsContainer.querySelectorAll('.option-button');
    if (isReviewMode) {
        explanationElement.innerHTML = `<strong>Penjelasan:</strong> ${questionData.explanation || 'Tidak ada penjelasan.'}`;
        explanationElement.classList.remove('hidden');
        if (currentQState.selectedAnswer === questionData.answer) {
            optionButtons[questionData.answer].classList.add('correct');
        } else {
            if(currentQState.selectedAnswer !== -1) {
                optionButtons[currentQState.selectedAnswer].classList.add('incorrect');
            }
            optionButtons[questionData.answer].classList.add('correct');
        }
    } else { // Mode Latihan atau Tryout
        if (isTryOut) {
            if (currentQState.selectedAnswer !== -1) {
                optionButtons[currentQState.selectedAnswer].classList.add('selected-tryout');
            }
        } else { // Mode Latihan
            if (currentQState.answered) {
                submitAnswerForLatihan(true); // Re-show highlights
            }
        }
    }

    // Update next button text
    const isLastQuestion = currentQuestionIndex >= (isReviewMode ? completedQuizData.questions.length : questions.length) - 1;
    if (isLastQuestion) {
        nextQuestionButton.textContent = isReviewMode ? "Kembali ke Hasil" : (isTryOut ? "Selesaikan Try Out" : "Lihat Hasil");
    } else {
        nextQuestionButton.textContent = "Soal Berikutnya";
    }
}

function selectOption(selectedIndex) {
    if (isReviewMode || (!isTryOut && questionStates[currentQuestionIndex]?.answered)) return;

    selectedOptionIndex = selectedIndex;
    questionStates[currentQuestionIndex].selectedAnswer = selectedIndex;
    
    optionsContainer.querySelectorAll('.option-button').forEach((button, i) => {
        button.classList.toggle('selected-tryout', i === selectedIndex);
    });
    
    if (!isTryOut) {
        submitAnswerForLatihan(false); // First time submitting
    } else {
        questionStates[currentQuestionIndex].answered = true;
        renderQuestionNavigation(); // Update nav box to 'answered'
    }
}

function submitAnswerForLatihan(isReshow) {
    const currentQ = questions[currentQuestionIndex];
    const currentQState = questionStates[currentQuestionIndex];
    if (!isReshow) { // First time answering
        currentQState.answered = true;
        answerSubmitted = true;
        if (selectedOptionIndex === currentQ.answer) {
            score++;
        }
    }

    optionsContainer.querySelectorAll('.option-button').forEach(btn => btn.disabled = true);
    
    if (selectedOptionIndex === currentQ.answer) {
        optionsContainer.children[selectedOptionIndex].classList.add('correct');
    } else {
        if (selectedOptionIndex !== -1) {
            optionsContainer.children[selectedOptionIndex].classList.add('incorrect');
        }
        optionsContainer.children[currentQ.answer].classList.add('correct');
    }
    
    explanationElement.innerHTML = `<strong>Penjelasan:</strong> ${currentQ.explanation || 'Tidak ada penjelasan.'}`;
    explanationElement.classList.remove('hidden');
    renderQuestionNavigation();
}


function showResult() {
    stopOverallTimer();
    
    // Simpan data kuis yang baru selesai untuk fitur review dan retry
    completedQuizData.questions = [...questions];
    completedQuizData.questionStates = [...questionStates];
    completedQuizData.quizName = currentQuizTitle;

    let finalScore = 0;
    let incorrectCount = 0;
    const categoryBreakdown = {};

    questions.forEach((q, index) => {
        const state = questionStates[index];
        const isCorrect = state.selectedAnswer === q.answer;
        if(isCorrect) finalScore++;
        if(state.selectedAnswer !== -1 && !isCorrect) incorrectCount++;

        // Breakdown for Try Out Gabungan
        if (currentQuizMode === 'tryout-gabungan-semua') {
            const categoryKey = q.category || 'lainnya';
            if (!categoryBreakdown[categoryKey]) categoryBreakdown[categoryKey] = { correct: 0, total: 0 };
            categoryBreakdown[categoryKey].total++;
            if (isCorrect) categoryBreakdown[categoryKey].correct++;
        }
    });

    if (!isTryOut) finalScore = score; // Latihan score is accumulated

    // Save to history if not 'latihan-salah'
    if(currentQuizMode !== 'latihan-salah'){
        loadHistory();
        quizHistory.push({
            id: Date.now(),
            quizName: currentQuizTitle,
            score: finalScore,
            totalQuestions: questions.length,
            date: new Date().toISOString()
        });
        saveHistory();
    }
    
    resultTitleElement.textContent = `Hasil ${currentQuizTitle}`;
    let message = `<span class="user-name-result">Selamat ${userName}!</span><br>`;
    message += `Skor Anda: <span class="score-value">${finalScore}</span> benar dari ${questions.length} soal.<br>`;

    if (currentQuizMode === 'tryout-gabungan-semua') {
        message += `<span class="category-breakdown-title">Rincian Per Kategori:</span><br>`;
        for (const key in categoryBreakdown) {
             message += `<span class="category-item"><span class="category-name">${formatCategoryName(key)}</span>: <span class="category-score">${categoryBreakdown[key].correct} / ${categoryBreakdown[key].total}</span> benar.</span><br>`;
        }
    } else if (currentQuizMode === 'tryout-serius') {
         let feedback = "ANDA BELUM MENJAWAB DENGAN BENAR, COBA LAGI!";
         if (finalScore >= 1 && finalScore <= 90) feedback = "NILAI KURANG, BELAJAR LEBIH GIAT LAGI";
         else if (finalScore >= 91 && finalScore <= 120) feedback = "NILAI CUKUP, BELAJAR LAGI";
         else if (finalScore >= 121) feedback = "NILAI BAGUS, PERTAHANKAN";
         message += `Tanggapan: <strong>${feedback}</strong><br>`;
    }
    
    scoreElement.innerHTML = message;
    
    reviewAnswersButton.classList.remove('hidden');
    retryIncorrectButton.classList.toggle('hidden', incorrectCount === 0);
    
    showView(resultContainer);
}
