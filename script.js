let allCategoryQuestions = [];
const TRYOUT_QUESTION_LIMIT = 180; // Batas jumlah soal untuk setiap TO
const TRYOUT_TIME_LIMIT_MINUTES = 180;

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let isTryOut = false; // True for any timed/graded mode (Try Out Gabungan, Try Out Serius)
let userName = "";
let currentCategoryFileName = null; // For latihan per departemen
let currentQuizMode = null; // e.g., 'latihan-departemen', 'latihan-gabungan', 'tryout-gabungan-semua', 'tryout-serius'
let previousViewForQuiz = null; // To know where to return from quiz
let previousViewForResult = null; // To know where to return from results

let selectedOptionIndex = -1;
let answerSubmitted = false; // Primarily for Latihan mode to prevent re-answering

let overallTimerInterval = null;
let timeLeftOverallSeconds = TRYOUT_TIME_LIMIT_MINUTES * 60;

let currentTryoutSeriusType = null; // e.g., "TO Tipe 1"
// isTryoutSeriusMode is implicitly handled by currentQuizMode === 'tryout-serius'

console.log("script.js: Initializing DOM Elements...");

// Main Menu & Submenus
const mainMenuViewContainer = document.getElementById('main-menu-container');
const mainMenuWelcomeUser = document.getElementById('main-menu-welcome-user'); // For Firebase
const mainMenuLatihanSoalButton = document.getElementById('main-menu-latihan-soal');
const mainMenuTryoutButton = document.getElementById('main-menu-tryout');
// Logout button is handled by Firebase script

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

// Result Elements
const resultContainer = document.getElementById('result-container');
const scoreElement = document.getElementById('score');
const restartButton = document.getElementById('restart-button');

let questionStates = []; // { answered: bool, doubtful: bool, selectedAnswer: int, answeredForScore: bool }

// --- View Management ---
function showView(viewToShow, prevView = null) {
    const allViews = [
        mainMenuViewContainer, latihanSoalSubmenuContainer, tryoutSubmenuContainer,
        kategoriLatihanContainer, tryoutSeriusContainer,
        quizLayoutContainer, resultContainer
    ];
    allViews.forEach(view => {
        if (view) {
            view.classList.toggle('hidden', view !== viewToShow);
        }
    });
    // Hide license form if showing any app view
    const licenseForm = document.getElementById("license-form-container");
    if (licenseForm && viewToShow !== licenseForm && licenseForm.style.display !== 'none') {
        licenseForm.style.display = 'none';
    }
    // if (prevView) previousViewForQuiz = prevView; // This was old logic, now handled more specifically
}
window.showView = showView; // Expose to global for Firebase script

// --- Loading Indicator ---
function showLoadingIndicator(message = "Memuat...", container = mainMenuViewContainer) {
    hideLoadingIndicator();
    const loadingIndicator = document.createElement('p');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.textContent = message;
    loadingIndicator.style.marginTop = "20px";
    loadingIndicator.style.fontStyle = "italic";
    if (container && !container.classList.contains('hidden')) { // Only append if container is visible
         container.appendChild(loadingIndicator);
    } else if (mainMenuViewContainer) { // Fallback to main menu
         mainMenuViewContainer.appendChild(loadingIndicator);
    }
}
function hideLoadingIndicator() {
    const indicatorToRemove = document.getElementById('loading-indicator');
    if (indicatorToRemove) indicatorToRemove.remove();
}

// --- App State Reset for Logout (Called by Firebase script) ---
function resetAppStateForLogout() {
    console.log("script.js: resetAppStateForLogout called.");
    userName = "";
    questions = []; allCategoryQuestions = []; questionStates = [];
    currentQuestionIndex = 0; score = 0;
    isTryOut = false; currentQuizMode = null;
    currentCategoryFileName = null; currentTryoutSeriusType = null;
    previousViewForQuiz = null; previousViewForResult = null;
    selectedOptionIndex = -1; answerSubmitted = false;
    stopOverallTimer();

    const allAppViews = [
        mainMenuViewContainer, latihanSoalSubmenuContainer, tryoutSubmenuContainer,
        kategoriLatihanContainer, tryoutSeriusContainer,
        quizLayoutContainer, resultContainer
    ];
    allAppViews.forEach(view => {
        if (view) view.classList.add('hidden');
    });

    if (mainMenuWelcomeUser) mainMenuWelcomeUser.textContent = '';
    if (userNameDisplaySidebar) userNameDisplaySidebar.textContent = 'Nama Pengguna';
    if (questionNavigationGrid) questionNavigationGrid.innerHTML = '';
    if (questionElement) questionElement.textContent = '';
    if (optionsContainer) optionsContainer.innerHTML = '';
    if (explanationElement) { explanationElement.innerHTML = ''; explanationElement.classList.add('hidden'); }
    if (scoreElement) scoreElement.innerHTML = '';
    if (timeLeftSidebarElement) timeLeftSidebarElement.innerText = `${TRYOUT_TIME_LIMIT_MINUTES}:00`;
    if (timerDisplaySidebar) timerDisplaySidebar.classList.add('hidden');
    if (questionCounterElement) questionCounterElement.classList.add('hidden');
}
window.resetAppState = resetAppStateForLogout; // Expose for Firebase script

// --- Event Listeners for New Menu Structure ---

// Main Menu Navigation
if (mainMenuLatihanSoalButton) {
    mainMenuLatihanSoalButton.addEventListener('click', () => {
        showView(latihanSoalSubmenuContainer, mainMenuViewContainer);
    });
}
if (mainMenuTryoutButton) {
    mainMenuTryoutButton.addEventListener('click', () => {
        showView(tryoutSubmenuContainer, mainMenuViewContainer);
    });
}

// Latihan Pembahasan Soal Submenu Navigation
if (latihanDepartemenButton) {
    latihanDepartemenButton.addEventListener('click', () => {
        showView(kategoriLatihanContainer, latihanSoalSubmenuContainer);
    });
}
if (latihanGabunganButton) {
    latihanGabunganButton.addEventListener('click', () => {
        currentQuizMode = 'latihan-gabungan';
        isTryOut = false; // Latihan mode
        currentCategoryFileName = "gabungan.json"; // Specific file for this mode
        currentTryoutSeriusType = null;
        loadQuestionData(currentCategoryFileName, () => startGame(currentQuizMode, latihanSoalSubmenuContainer));
    });
}
if (kembaliKeMainMenuFromLatihanSubmenu) {
    kembaliKeMainMenuFromLatihanSubmenu.addEventListener('click', () => {
        showView(mainMenuViewContainer, latihanSoalSubmenuContainer);
    });
}

// Try Out Submenu Navigation
if (tryoutGabunganSemuaButton) {
    tryoutGabunganSemuaButton.addEventListener('click', () => {
        currentQuizMode = 'tryout-gabungan-semua';
        isTryOut = true; // Try Out mode
        currentCategoryFileName = null; currentTryoutSeriusType = null;
        const categoryDataFiles = [
            "anak.json", "bedah.json", "gadar.json", "jiwa.json",
            "keluarga.json", "komunitas.json", "manajemen.json"
        ];
        loadMultipleQuestionData(categoryDataFiles, () => {
            if (allCategoryQuestions.length === 0) {
                alert("Tidak ada soal untuk Try Out Gabungan (Semua Kategori).");
                showView(tryoutSubmenuContainer); return;
            }
            shuffleArray(allCategoryQuestions);
            questions = allCategoryQuestions.slice(0, TRYOUT_QUESTION_LIMIT);
            if (questions.length === 0) {
                alert("Tidak ada soal tersedia setelah pemrosesan untuk Try Out Gabungan.");
                showView(tryoutSubmenuContainer); return;
            }
            startGame(currentQuizMode, tryoutSubmenuContainer);
        });
    });
}
if (tryoutModeSeriusButton) {
    tryoutModeSeriusButton.addEventListener('click', () => {
        showView(tryoutSeriusContainer, tryoutSubmenuContainer);
    });
}
if (kembaliKeMainMenuFromTryoutSubmenu) {
    kembaliKeMainMenuFromTryoutSubmenu.addEventListener('click', () => {
        showView(mainMenuViewContainer, tryoutSubmenuContainer);
    });
}

// Kategori Latihan Pembahasan Soal (Departemen)
if (kategoriButtons.length > 0) {
    kategoriButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentQuizMode = 'latihan-departemen';
            isTryOut = false; // Latihan mode
            currentCategoryFileName = button.dataset.script.replace('.js', '.json');
            currentTryoutSeriusType = null;
            loadQuestionData(currentCategoryFileName, () => startGame(currentQuizMode, kategoriLatihanContainer));
        });
    });
}
if (kembaliKeLatihanSubmenuFromKategori) {
    kembaliKeLatihanSubmenuFromKategori.addEventListener('click', () => {
        showView(latihanSoalSubmenuContainer, kategoriLatihanContainer);
    });
}

// Try Out Serius (Per Tipe)
if (tryoutSeriusButtons.length > 0) {
    tryoutSeriusButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentQuizMode = 'tryout-serius';
            isTryOut = true; // Try Out mode
            currentTryoutSeriusType = button.dataset.type;
            const dataFile = button.dataset.file;
            currentCategoryFileName = null;
            loadQuestionData(dataFile, () => {
                if (questions.length === 0) {
                    alert(`Tidak ada soal untuk ${currentTryoutSeriusType}. Periksa file ${dataFile}.`);
                    showView(tryoutSeriusContainer); return;
                }
                questions = questions.slice(0, TRYOUT_QUESTION_LIMIT);
                if (questions.length === 0) {
                    alert(`Tidak ada soal tersedia setelah pemrosesan untuk ${currentTryoutSeriusType}.`);
                    showView(tryoutSeriusContainer); return;
                }
                startGame(currentQuizMode, tryoutSeriusContainer);
            });
        });
    });
}
if (kembaliKeTryoutSubmenuFromSerius) {
    kembaliKeTryoutSubmenuFromSerius.addEventListener('click', () => {
        showView(tryoutSubmenuContainer, tryoutSeriusContainer);
    });
}


// --- Core Quiz Logic ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function loadQuestionData(fileName, callback) {
    let loadingContainer = mainMenuViewContainer; // Default
    if (currentQuizMode === 'latihan-departemen') loadingContainer = kategoriLatihanContainer;
    else if (currentQuizMode === 'latihan-gabungan') loadingContainer = latihanSoalSubmenuContainer;
    else if (currentQuizMode === 'tryout-serius') loadingContainer = tryoutSeriusContainer;

    showLoadingIndicator(`Memuat soal dari ${fileName}...`, loadingContainer);
    fetch(fileName)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status} for ${fileName}`);
            return response.json();
        })
        .then(data => {
            hideLoadingIndicator();
            if (Array.isArray(data) && data.length > 0) {
                shuffleArray(data);
                questions = [...data];
                callback();
            } else {
                alert(`Gagal memuat atau tidak ada soal di ${fileName}. Pastikan file "${fileName}" ada dan berisi soal.`);
                showView(loadingContainer || mainMenuViewContainer);
            }
        })
        .catch(error => {
            hideLoadingIndicator();
            alert(`Error memuat ${fileName}: ${error.message}. Pastikan file "${fileName}" ada di server dan dapat diakses.`);
            console.error(`Error memuat ${fileName}:`, error);
            showView(loadingContainer || mainMenuViewContainer);
        });
}

async function loadMultipleQuestionData(fileNames, allLoadedCallback) {
    showLoadingIndicator("Menyiapkan soal Try Out Gabungan...", tryoutSubmenuContainer);
    allCategoryQuestions = [];
    const fetchPromises = fileNames.map(fileName =>
        fetch(fileName)
        .then(response => {
            if (!response.ok) { console.warn(`Gagal memuat ${fileName}`); return { fileName, data: [] }; }
            return response.json().then(data => ({ fileName, data })).catch(e => { console.error(`JSON error di ${fileName}`, e); return { fileName, data: []}; });
        })
        .catch(error => { console.error(`Fetch error ${fileName}`, error); return { fileName, data: [] }; })
    );
    try {
        const results = await Promise.all(fetchPromises);
        hideLoadingIndicator();
        results.forEach(result => {
            if (Array.isArray(result.data) && result.data.length > 0) {
                allCategoryQuestions.push(...result.data.map(q => ({ ...q, category: result.fileName.replace('.json', '') })));
            }
        });
        allLoadedCallback();
    } catch (error) {
        hideLoadingIndicator();
        alert("Error memuat data soal Try Out Gabungan.");
        showView(tryoutSubmenuContainer);
    }
}

function formatCategoryName(shortName) {
    if (!shortName) return "Lainnya";
    const nameMap = { "jiwa": "Keperawatan Jiwa", "anak": "Keperawatan Anak", "keluarga": "Keperawatan Keluarga", "komunitas": "Keperawatan Komunitas", "bedah": "Keperawatan Medikal Bedah", "gadar": "Keperawatan Gawat Darurat", "manajemen": "Manajemen Keperawatan", "gabungan": "Soal Gabungan" };
    return nameMap[shortName.toLowerCase()] || shortName.charAt(0).toUpperCase() + shortName.slice(1);
}

function startGame(mode, sourceViewElement) {
    currentQuizMode = mode; // Set the global quiz mode
    previousViewForQuiz = sourceViewElement; // For quizBackButton and restartButton after results

    currentQuestionIndex = 0; score = 0;
    selectedOptionIndex = -1; answerSubmitted = false;

    const sessionUserName = sessionStorage.getItem('userName');
    userName = sessionUserName || "Pengguna";
    if (userNameDisplaySidebar) userNameDisplaySidebar.innerText = userName;
    // Welcome message is handled by Firebase on login (mainMenuWelcomeUser)

    if (!questions || questions.length === 0) {
        alert("Tidak ada soal dimuat. Kuis tidak bisa dimulai.");
        showView(sourceViewElement || mainMenuViewContainer); return;
    }
    questionStates = questions.map(() => ({ answered: false, doubtful: false, selectedAnswer: -1, answeredForScore: false }));

    if(explanationElement) { explanationElement.classList.add('hidden'); explanationElement.innerHTML = ''; }

    if (isTryOut) { // isTryOut is true for 'tryout-gabungan-semua' and 'tryout-serius'
        if(timerDisplaySidebar) timerDisplaySidebar.classList.remove('hidden');
        startOverallTimer();
        if (doubtfulButton) doubtfulButton.classList.remove('hidden');
    } else { // Latihan modes
        if(timerDisplaySidebar) timerDisplaySidebar.classList.add('hidden');
        stopOverallTimer();
        if (doubtfulButton) doubtfulButton.classList.add('hidden'); // Typically hidden for Latihan, but can be enabled if desired
    }
    showView(quizLayoutContainer, sourceViewElement);
    renderQuestionNavigation();
    showQuestion(questions[currentQuestionIndex]);
}

function startOverallTimer() {
    timeLeftOverallSeconds = TRYOUT_TIME_LIMIT_MINUTES * 60;
    updateOverallTimerDisplaySidebar();
    clearInterval(overallTimerInterval);
    overallTimerInterval = setInterval(() => {
        timeLeftOverallSeconds--;
        updateOverallTimerDisplaySidebar();
        if (timeLeftOverallSeconds <= 0) {
            clearInterval(overallTimerInterval);
            alert("Waktu Habis!");
            finalizeTryOut();
        }
    }, 1000);
}
function stopOverallTimer() { clearInterval(overallTimerInterval); }
function updateOverallTimerDisplaySidebar() {
    const minutes = Math.floor(timeLeftOverallSeconds / 60);
    const seconds = timeLeftOverallSeconds % 60;
    if (timeLeftSidebarElement) timeLeftSidebarElement.innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function finalizeTryOut() { // Called when timer ends or user finishes Try Out
    if (currentQuestionIndex < questions.length && questionStates[currentQuestionIndex]) {
        const currentQState = questionStates[currentQuestionIndex];
        if (selectedOptionIndex !== -1 && currentQState.selectedAnswer === -1) currentQState.selectedAnswer = selectedOptionIndex;
        if (!currentQState.answered && selectedOptionIndex !== -1) currentQState.answered = true;
    }
    previousViewForResult = previousViewForQuiz; // Save where user came from before quiz
    showResult();
}

function renderQuestionNavigation() {
    if (!questionNavigationGrid) return;
    questionNavigationGrid.innerHTML = '';
    questions.forEach((_, index) => {
        const navBox = document.createElement('div');
        navBox.classList.add('nav-question-box');
        navBox.innerText = index + 1;
        navBox.dataset.index = index;
        if (questionStates[index]) {
            if (index === currentQuestionIndex) navBox.classList.add('current');
            if (questionStates[index].answered) navBox.classList.add('answered');
            if (questionStates[index].doubtful) navBox.classList.add('doubtful');
        }
        navBox.addEventListener('click', () => {
            if (isTryOut && questionStates[currentQuestionIndex]) { // Save current answer before navigating in TryOut
                questionStates[currentQuestionIndex].selectedAnswer = selectedOptionIndex;
                if (!questionStates[currentQuestionIndex].answered && selectedOptionIndex !== -1) {
                    questionStates[currentQuestionIndex].answered = true;
                    const currentNavBoxEl = questionNavigationGrid.querySelector(`.nav-question-box[data-index="${currentQuestionIndex}"]`);
                    if (currentNavBoxEl) currentNavBoxEl.classList.add('answered');
                }
            }
            currentQuestionIndex = parseInt(navBox.dataset.index);
            selectedOptionIndex = questionStates[currentQuestionIndex]?.selectedAnswer ?? -1;
            answerSubmitted = questionStates[currentQuestionIndex]?.answered ?? false; // For Latihan mode
            showQuestion(questions[currentQuestionIndex]);
        });
        questionNavigationGrid.appendChild(navBox);
    });
}

function submitAnswerForLatihan() { // Only for Latihan modes
    const currentQState = questionStates[currentQuestionIndex];
    if (!currentQState || currentQState.answered) return; // Prevent re-submission
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    currentQState.answered = true;
    currentQState.selectedAnswer = selectedOptionIndex;
    answerSubmitted = true; // Local flag for Latihan UI update

    const correctIndex = currentQ.answer;
    const explanationText = currentQ.explanation;
    const optionButtons = optionsContainer.querySelectorAll('.option-button');

    optionButtons.forEach(button => button.disabled = true);
    if (selectedOptionIndex === correctIndex && !currentQState.answeredForScore) {
        score++; currentQState.answeredForScore = true;
    }

    const navBox = questionNavigationGrid.querySelector(`.nav-question-box[data-index="${currentQuestionIndex}"]`);
    if (navBox) {
        navBox.classList.add('answered');
        // No doubtful logic for Latihan here, can be added if needed
    }

    optionButtons.forEach((btn, i) => {
        btn.classList.remove('selected-tryout'); // Latihan doesn't use selected-tryout class after answer
        if (i === correctIndex) btn.classList.add('correct');
        if (i === selectedOptionIndex && i !== correctIndex) btn.classList.add('incorrect');
    });

    let explText = `<strong>Penjelasan:</strong> ${explanationText || 'Tidak ada penjelasan.'}`;
    if (selectedOptionIndex === -1) explanationElement.innerHTML = `<strong>Anda tidak memilih jawaban.</strong> Jawaban yang benar adalah opsi ke-${correctIndex + 1}.<br>${explText}`;
    else if (selectedOptionIndex === correctIndex) explanationElement.innerHTML = `<strong>Jawaban Benar!</strong><br>${explText}`;
    else explanationElement.innerHTML = `<strong>Jawaban Salah.</strong> Jawaban yang benar adalah opsi ke-${correctIndex + 1}.<br>${explText}`;
    explanationElement.classList.remove('hidden');

    if (nextQuestionButton) {
        nextQuestionButton.innerText = (currentQuestionIndex < questions.length - 1) ? "Soal Berikutnya" : "Lihat Hasil";
        nextQuestionButton.classList.remove('hidden');
    }
}


function showQuestion(questionData) {
    if (!questionData) {
        alert("Error: Soal tidak dapat dimuat.");
        showView(previousViewForQuiz || mainMenuViewContainer, quizLayoutContainer); return;
    }
    const currentQState = questionStates[currentQuestionIndex] || { answered: false, doubtful: false, selectedAnswer: -1 };

    if (questionCounterElement) {
        questionCounterElement.innerText = `Soal ${currentQuestionIndex + 1} dari ${questions.length}`;
        questionCounterElement.classList.remove('hidden');
    }
    if (questionNavigationGrid) {
        questionNavigationGrid.querySelectorAll('.nav-question-box').forEach(box => {
            box.classList.remove('current');
            if (parseInt(box.dataset.index) === currentQuestionIndex) box.classList.add('current');
        });
    }

    if (questionElement) questionElement.textContent = questionData.question;
    if (optionsContainer) optionsContainer.innerHTML = '';
    if (explanationElement) { explanationElement.classList.add('hidden'); explanationElement.innerHTML = ''; }

    questionData.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option;
        button.classList.add('option-button');
        button.style.color = "black"; // Ensure default color
        button.addEventListener('click', () => selectOption(index));
        if (optionsContainer) optionsContainer.appendChild(button);
    });

    const optionButtons = optionsContainer.querySelectorAll('.option-button');
    if (!isTryOut && currentQState.answered) { // Latihan mode, already answered
        optionButtons.forEach((btn, index) => {
            btn.disabled = true;
            btn.classList.remove('correct', 'incorrect', 'selected-tryout');
            if (index === questionData.answer) btn.classList.add('correct');
            if (index === currentQState.selectedAnswer && index !== questionData.answer) btn.classList.add('incorrect');
        });
        let explText = `<strong>Penjelasan:</strong> ${questionData.explanation || 'Tidak ada penjelasan.'}`;
        if (currentQState.selectedAnswer === -1) explanationElement.innerHTML = `<strong>Anda tidak memilih jawaban.</strong> Jawaban yang benar adalah opsi ke-${questionData.answer + 1}.<br>${explText}`;
        else if (currentQState.selectedAnswer === questionData.answer) explanationElement.innerHTML = `<strong>Jawaban Benar!</strong><br>${explText}`;
        else explanationElement.innerHTML = `<strong>Jawaban Salah.</strong> Jawaban yang benar adalah opsi ke-${questionData.answer + 1}.<br>${explText}`;
        explanationElement.classList.remove('hidden');
    } else if (isTryOut && currentQState.selectedAnswer !== -1) { // TryOut mode, previously selected
        if (optionButtons[currentQState.selectedAnswer]) {
            optionButtons[currentQState.selectedAnswer].classList.add('selected-tryout');
        }
    }


    if (isTryOut && doubtfulButton) {
        doubtfulButton.classList.remove('hidden');
        doubtfulButton.textContent = currentQState.doubtful ? "Hapus Tanda Ragu" : "Tandai Ragu-ragu";
    } else if (doubtfulButton) { // Latihan mode
        doubtfulButton.classList.add('hidden');
    }

    if (nextQuestionButton) {
        nextQuestionButton.innerText = (currentQuestionIndex < questions.length - 1) ? "Soal Berikutnya" : (isTryOut ? "Selesaikan Try Out" : "Lihat Hasil");
        nextQuestionButton.classList.remove('hidden');
    }
}

function selectOption(selectedIndex) {
    if (!isTryOut && questionStates[currentQuestionIndex]?.answered) return; // Prevent re-selecting in Latihan

    selectedOptionIndex = selectedIndex;
    if (questionStates[currentQuestionIndex]) {
      questionStates[currentQuestionIndex].selectedAnswer = selectedIndex;
    }

    if (optionsContainer) {
        optionsContainer.querySelectorAll('.option-button').forEach((button, i) => {
            button.classList.toggle('selected-tryout', i === selectedIndex);
            if (!isTryOut) { // In Latihan, remove other selections
                if (i !== selectedIndex) button.classList.remove('selected-tryout');
            }
        });
    }

    if (!isTryOut) {
        submitAnswerForLatihan();
    }
}

if (doubtfulButton) {
    doubtfulButton.addEventListener('click', () => {
        if (!isTryOut || !questionStates[currentQuestionIndex]) return;
        const currentQState = questionStates[currentQuestionIndex];
        currentQState.doubtful = !currentQState.doubtful;
        if (questionNavigationGrid) {
            const navBox = questionNavigationGrid.querySelector(`.nav-question-box[data-index="${currentQuestionIndex}"]`);
            if (navBox) navBox.classList.toggle('doubtful', currentQState.doubtful);
        }
        doubtfulButton.textContent = currentQState.doubtful ? "Hapus Tanda Ragu" : "Tandai Ragu-ragu";
    });
}

if (nextQuestionButton) {
    nextQuestionButton.addEventListener('click', () => {
        const currentQState = questionStates[currentQuestionIndex];
        if (isTryOut && currentQState) { // Save answer for current question in TryOut
            currentQState.selectedAnswer = selectedOptionIndex;
            if (!currentQState.answered && selectedOptionIndex !== -1) { // Mark as answered if an option was selected
                currentQState.answered = true;
                if (questionNavigationGrid) {
                    const navBox = questionNavigationGrid.querySelector(`.nav-question-box[data-index="${currentQuestionIndex}"]`);
                    if (navBox) navBox.classList.add('answered');
                }
            }
        }

        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            selectedOptionIndex = questionStates[currentQuestionIndex]?.selectedAnswer ?? -1;
            answerSubmitted = questionStates[currentQuestionIndex]?.answered ?? false; // for Latihan mode UI
            showQuestion(questions[currentQuestionIndex]);
        } else { // Last question
            if (isTryOut) { stopOverallTimer(); finalizeTryOut(); }
            else { previousViewForResult = previousViewForQuiz; showResult(); }
        }
    });
}

function showResult() {
    stopOverallTimer();
    if (timerDisplaySidebar) timerDisplaySidebar.classList.add('hidden');
    if (questionCounterElement) questionCounterElement.classList.add('hidden');
    if (questionNavigationGrid) questionNavigationGrid.innerHTML = '';
    if (explanationElement) { explanationElement.classList.add('hidden'); explanationElement.innerHTML = ''; }
    if (doubtfulButton) doubtfulButton.classList.add('hidden');
    showView(resultContainer, quizLayoutContainer);

    const currentUserNameForResult = sessionStorage.getItem('userName') || userName || "Peserta";
    let message = "";
    const totalQuestions = questions.length;

    if (currentQuizMode === 'tryout-serius') {
        score = 0; // Recalculate score for TryOut Serius based on final answers
        questions.forEach((q, index) => {
            const state = questionStates[index];
            if (state?.answered && state.selectedAnswer === q.answer) score++;
        });
        message += `<span class="user-name-result">Selamat ${currentUserNameForResult}!</span><br>`;
        if (totalQuestions > 0) {
            message += `Hasil ${currentTryoutSeriusType || 'Try Out Serius'} Anda: <span class="score-value">${score}</span> benar dari ${totalQuestions} soal.<br>`;
            let feedback = "";
            if (score >= 1 && score <= 90) feedback = "NILAI KURANG, BELAJAR LEBIH GIAT LAGI";
            else if (score >= 91 && score <= 120) feedback = "NILAI CUKUP, BELAJAR LAGI";
            else if (score >= 121 && score <= TRYOUT_QUESTION_LIMIT) feedback = "NILAI BAGUS, PERTAHANKAN";
            else if (score > TRYOUT_QUESTION_LIMIT) feedback = "NILAI LUAR BIASA, PERTAHANKAN!";
            else if (score === 0) feedback = "ANDA BELUM MENJAWAB DENGAN BENAR, COBA LAGI!";
            if (feedback) message += `Tanggapan: <strong>${feedback}</strong><br>`;
        } else {
            message += `Tidak ada soal untuk ${currentTryoutSeriusType || 'Try Out Serius'}.<br>`;
        }
        const minutesLeft = Math.floor(timeLeftOverallSeconds / 60);
        const secondsLeft = timeLeftOverallSeconds % 60;
        const timeLeftDisplay = timeLeftOverallSeconds >= 0 ? `${minutesLeft} menit ${secondsLeft} detik` : "Waktu Habis";
        message += `Sisa Waktu Pengerjaan: ${timeLeftDisplay}.<br>`;

    } else if (currentQuizMode === 'tryout-gabungan-semua') {
        score = 0; // Recalculate score for TryOut Gabungan
        const categoryBreakdown = {};
        questions.forEach((q, index) => {
            const state = questionStates[index];
            const categoryKey = q.category || 'lainnya';
            if (!categoryBreakdown[categoryKey]) categoryBreakdown[categoryKey] = { correct: 0, total: 0, attempted: 0 };
            categoryBreakdown[categoryKey].total++;

            if (state?.answered) {
                if (state.selectedAnswer !== -1) categoryBreakdown[categoryKey].attempted++;
                if (state.selectedAnswer === q.answer) {
                    score++;
                    categoryBreakdown[categoryKey].correct++;
                }
            }
        });
        message += `<span class="user-name-result">Selamat ${currentUserNameForResult}!</span><br>`;
        message += `Skor Try Out Gabungan Anda: <span class="score-value">${score}</span> dari ${totalQuestions} soal.<br>`;
        const minutesLeft = Math.floor(timeLeftOverallSeconds / 60);
        const secondsLeft = timeLeftOverallSeconds % 60;
        const timeLeftDisplay = timeLeftOverallSeconds >= 0 ? `${minutesLeft} menit ${secondsLeft} detik` : "Waktu Habis";
        message += `Sisa Waktu Pengerjaan: ${timeLeftDisplay}.<br><br>`;
        if (Object.keys(categoryBreakdown).length > 0) {
            message += `<span class="category-breakdown-title">Rekapitulasi Hasil:</span><br>`;
            for (const key in categoryBreakdown) {
                const { correct, total, attempted } = categoryBreakdown[key];
                message += `<span class="category-item"><span class="category-name">${formatCategoryName(key)}</span>: <span class="category-score">${correct}</span> benar dari ${attempted} dijawab (Total ${total} soal).</span><br>`;
            }
        } else message += "Tidak ada rincian kategori.<br>";

    } else { // Latihan modes ('latihan-departemen', 'latihan-gabungan')
        // Score for Latihan is accumulated directly
        message += `<span class="user-name-result">Selamat ${currentUserNameForResult}!</span><br>`;
        let quizTitle = "Latihan Pembahasan Soal";
        if (currentQuizMode === 'latihan-departemen' && currentCategoryFileName) {
            quizTitle = `Latihan ${formatCategoryName(currentCategoryFileName.replace('.json', ''))}`;
        } else if (currentQuizMode === 'latihan-gabungan') {
            quizTitle = `Latihan Pembahasan Soal Gabungan`;
        }
        message += `Skor ${quizTitle} Anda: <span class="score-value">${score}</span> dari ${totalQuestions} soal.`;
    }
    if(scoreElement) scoreElement.innerHTML = message;
}


if (quizBackButton) {
    quizBackButton.addEventListener('click', () => {
        if (confirm("Anda yakin ingin kembali? Progress kuis ini akan hilang.")) {
            if (isTryOut) stopOverallTimer();
            // Reset common quiz elements
            if (timerDisplaySidebar) timerDisplaySidebar.classList.add('hidden');
            if (questionCounterElement) questionCounterElement.classList.add('hidden');
            if (questionNavigationGrid) questionNavigationGrid.innerHTML = '';
            if (explanationElement) { explanationElement.classList.add('hidden'); explanationElement.innerHTML = ''; }
            if (doubtfulButton) doubtfulButton.classList.add('hidden');

            // Reset state variables related to current quiz
            questions = []; questionStates = [];
            currentQuestionIndex = 0; score = 0; selectedOptionIndex = -1; answerSubmitted = false;
            
            showView(previousViewForQuiz || mainMenuViewContainer, quizLayoutContainer); // Go back to where quiz started from
            // Resetting global mode flags for safety, though they should be set again on new quiz start
            // isTryOut = false; currentQuizMode = null; currentTryoutSeriusType = null;
        }
    });
}

if (restartButton) {
    restartButton.addEventListener('click', () => {
        // Reset quiz-specific state for a fresh start from the selection menu
        questions = []; allCategoryQuestions = []; questionStates = [];
        currentQuestionIndex = 0; score = 0; selectedOptionIndex = -1; answerSubmitted = false;
        // isTryOut, currentQuizMode, currentCategoryFileName, currentTryoutSeriusType will be reset when a new quiz/latihan is chosen.
        
        showView(previousViewForResult || mainMenuViewContainer, resultContainer); // Go back to the screen user was on before starting this quiz
    });
}
console.log("script.js: All initializations and listeners setup complete.");
