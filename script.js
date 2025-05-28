let allCategoryQuestions = [];
const TRYOUT_QUESTION_LIMIT = 180; // Batas jumlah soal untuk setiap TO
const TRYOUT_TIME_LIMIT_MINUTES = 180;

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let isTryOut = false;
let userName = "";
let currentCategoryFileName = null;
let previousView = null;
let selectedOptionIndex = -1;
let answerSubmitted = false;

let overallTimerInterval = null;
let timeLeftOverallSeconds = TRYOUT_TIME_LIMIT_MINUTES * 60;

let currentTryoutSeriusType = null;
let isTryoutSeriusMode = false;

console.log("script.js: Initializing DOM Elements...");
const menuContainer = document.getElementById('menu-container');
const welcomeUserMessage = document.getElementById('welcome-user-message');
const latihanSoalMenuButton = document.getElementById('latihan-soal-menu-button');
const tryoutButton = document.getElementById('tryout-button');
// const logoutButton = document.getElementById('logout-button'); // Dihandle Firebase

const kategoriLatihanContainer = document.getElementById('kategori-latihan-container');
const kategoriButtons = document.querySelectorAll('.kategori-button');
const kembaliKeMenuUtamaButton = document.getElementById('kembali-ke-menu-utama-button');

const tryoutSeriusMenuButton = document.getElementById('tryout-serius-menu-button');
const tryoutSeriusContainer = document.getElementById('tryout-serius-container');
const tryoutSeriusButtons = document.querySelectorAll('.tryout-serius-button');
const kembaliKeMenuUtamaFromSeriusButton = document.getElementById('kembali-ke-menu-utama-from-serius-button');

const questionElement = document.getElementById('question');
const optionsContainer = document.getElementById('options-container');
const explanationElement = document.getElementById('explanation');
const nextQuestionButton = document.getElementById('next-question-button');
const quizBackButton = document.getElementById('quiz-back-button');
const doubtfulButton = document.getElementById('doubtful-button');

const resultContainer = document.getElementById('result-container');
const scoreElement = document.getElementById('score');
const restartButton = document.getElementById('restart-button');

const quizLayoutContainer = document.getElementById('quiz-layout-container');
const userNameDisplaySidebar = document.getElementById('user-name-display');
const timerDisplaySidebar = document.getElementById('timer-display-sidebar');
const timeLeftSidebarElement = document.getElementById('time-left-sidebar');
const questionNavigationGrid = document.getElementById('question-navigation-grid');
const questionCounterElement = document.getElementById('question-counter');

let questionStates = [];

// Fungsi ini akan dipanggil oleh Firebase script
function showView(viewToShow, prevView = null) {
    const allViews = [menuContainer, kategoriLatihanContainer, quizLayoutContainer, resultContainer, tryoutSeriusContainer];
    allViews.forEach(view => {
        if (view) {
            view.classList.toggle('hidden', view !== viewToShow);
        }
    });
    const licenseForm = document.getElementById("license-form-container");
    if (licenseForm && viewToShow !== licenseForm) {
        licenseForm.style.display = 'none';
    }
    if (prevView) previousView = prevView;
}
window.showView = showView; // Expose ke global agar Firebase script bisa panggil

function showLoadingIndicator(message = "Memuat...", container = menuContainer) {
    hideLoadingIndicator();
    const loadingIndicator = document.createElement('p');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.textContent = message;
    loadingIndicator.style.marginTop = "20px";
    loadingIndicator.style.fontStyle = "italic";
    if (container) container.appendChild(loadingIndicator);
}

function hideLoadingIndicator() {
    const indicatorToRemove = document.getElementById('loading-indicator');
    if (indicatorToRemove) indicatorToRemove.remove();
}

function resetAppStateForLogout() {
    console.log("script.js: resetAppStateForLogout called.");
    userName = "";
    questions = [];
    allCategoryQuestions = [];
    questionStates = [];
    currentQuestionIndex = 0;
    score = 0;
    isTryOut = false;
    isTryoutSeriusMode = false;
    currentTryoutSeriusType = null;
    currentCategoryFileName = null;
    previousView = null;
    selectedOptionIndex = -1;
    answerSubmitted = false;
    stopOverallTimer();

    const allAppViews = [menuContainer, kategoriLatihanContainer, quizLayoutContainer, resultContainer, tryoutSeriusContainer];
    allAppViews.forEach(view => {
        if (view) view.classList.add('hidden');
    });
    
    // Konten dinamis direset
    if (welcomeUserMessage) welcomeUserMessage.textContent = '';
    if (userNameDisplaySidebar) userNameDisplaySidebar.textContent = 'Nama Pengguna';
    if (questionNavigationGrid) questionNavigationGrid.innerHTML = '';
    if (questionElement) questionElement.textContent = '';
    if (optionsContainer) optionsContainer.innerHTML = '';
    if (explanationElement) {
        explanationElement.innerHTML = '';
        explanationElement.classList.add('hidden');
    }
    if (scoreElement) scoreElement.innerHTML = '';
    if (timeLeftSidebarElement) timeLeftSidebarElement.innerText = `${TRYOUT_TIME_LIMIT_MINUTES}:00`;
    if (timerDisplaySidebar) timerDisplaySidebar.classList.add('hidden');
    if (questionCounterElement) questionCounterElement.classList.add('hidden');
}
window.resetAppState = resetAppStateForLogout;

// Event Listeners
if (latihanSoalMenuButton) {
    latihanSoalMenuButton.addEventListener('click', () => {
        isTryOut = false; isTryoutSeriusMode = false;
        showView(kategoriLatihanContainer, menuContainer);
    });
}

if (tryoutButton) {
    tryoutButton.addEventListener('click', () => {
        isTryOut = true; isTryoutSeriusMode = false;
        currentCategoryFileName = null; currentTryoutSeriusType = null;
        const categoryDataFiles = [
            "anak.json", "bedah.json", "gadar.json", "jiwa.json",
            "keluarga.json", "komunitas.json", "manajemen.json"
        ];
        loadMultipleQuestionData(categoryDataFiles, () => {
            if (allCategoryQuestions.length === 0) {
                alert("Tidak ada soal untuk Try Out (Gabungan).");
                showView(menuContainer); return;
            }
            shuffleArray(allCategoryQuestions);
            questions = allCategoryQuestions.slice(0, TRYOUT_QUESTION_LIMIT);
            if (questions.length === 0) {
                alert("Tidak ada soal tersedia setelah pemrosesan untuk Try Out (Gabungan).");
                showView(menuContainer); return;
            }
            startGame('tryout');
        });
    });
}

if (tryoutSeriusMenuButton) {
    tryoutSeriusMenuButton.addEventListener('click', () => {
        showView(tryoutSeriusContainer, menuContainer);
    });
}

if (kembaliKeMenuUtamaFromSeriusButton) {
    kembaliKeMenuUtamaFromSeriusButton.addEventListener('click', () => {
        showView(menuContainer, tryoutSeriusContainer);
    });
}

if (tryoutSeriusButtons.length > 0) {
    tryoutSeriusButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tryoutType = button.dataset.type;
            const dataFile = button.dataset.file;
            isTryOut = true; isTryoutSeriusMode = true;
            currentCategoryFileName = null; currentTryoutSeriusType = tryoutType;
            loadQuestionData(dataFile, () => {
                if (questions.length === 0) {
                    alert(`Tidak ada soal untuk ${currentTryoutSeriusType}. Periksa file ${dataFile}.`);
                    showView(tryoutSeriusContainer); return;
                }
                // Ambil sejumlah soal sesuai limit, atau semua jika kurang dari limit
                questions = questions.slice(0, TRYOUT_QUESTION_LIMIT); 
                if (questions.length === 0) {
                    alert(`Tidak ada soal tersedia setelah pemrosesan untuk ${currentTryoutSeriusType}.`);
                    showView(tryoutSeriusContainer); return;
                }
                startGame('tryout-serius');
            });
        });
    });
}

if (kategoriButtons.length > 0) {
    kategoriButtons.forEach(button => {
        button.addEventListener('click', () => {
            const dataFileName = button.dataset.script.replace('.js', '.json');
            isTryOut = false; isTryoutSeriusMode = false;
            currentCategoryFileName = dataFileName; currentTryoutSeriusType = null;
            loadQuestionData(dataFileName, () => startGame('latihan'));
        });
    });
}

if (kembaliKeMenuUtamaButton) {
    kembaliKeMenuUtamaButton.addEventListener('click', () => {
        showView(menuContainer, kategoriLatihanContainer);
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function loadQuestionData(fileName, callback) {
    const loadingContainer = isTryoutSeriusMode ? tryoutSeriusContainer : kategoriLatihanContainer;
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
                questions = [...data]; // questions akan berisi semua soal dari file ini
                callback();
            } else {
                alert(`Gagal memuat atau tidak ada soal di ${fileName}.`);
                showView(loadingContainer || menuContainer);
            }
        })
        .catch(error => {
            hideLoadingIndicator();
            alert(`Error memuat ${fileName}: ${error.message}`);
            console.error(`Error memuat ${fileName}:`, error);
            showView(loadingContainer || menuContainer);
        });
}

async function loadMultipleQuestionData(fileNames, allLoadedCallback) {
    showLoadingIndicator("Menyiapkan soal Try Out (Gabungan)...", menuContainer);
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
        alert("Error memuat data soal Try Out (Gabungan).");
        showView(menuContainer);
    }
}

function formatCategoryName(shortName) {
    if (!shortName) return "Lainnya";
    const nameMap = { "jiwa": "Keperawatan Jiwa", "anak": "Keperawatan Anak", "keluarga": "Keperawatan Keluarga", "komunitas": "Keperawatan Komunitas", "bedah": "Keperawatan Medikal Bedah", "gadar": "Keperawatan Gawat Darurat", "manajemen": "Manajemen Keperawatan" };
    return nameMap[shortName.toLowerCase()] || shortName.charAt(0).toUpperCase() + shortName.slice(1);
}

function startGame(mode) {
    currentQuestionIndex = 0; score = 0;
    if (mode === 'tryout-serius') { isTryOut = true; isTryoutSeriusMode = true; }
    else if (mode === 'tryout') { isTryOut = true; isTryoutSeriusMode = false; }
    else { isTryOut = false; isTryoutSeriusMode = false; }
    selectedOptionIndex = -1; answerSubmitted = false;

    const sessionUserName = sessionStorage.getItem('userName');
    userName = sessionUserName || "Pengguna";
    if (userNameDisplaySidebar) userNameDisplaySidebar.innerText = userName;
    if (welcomeUserMessage && (!welcomeUserMessage.textContent || welcomeUserMessage.textContent.includes("Pengguna"))) {
        welcomeUserMessage.textContent = `Selamat datang, ${userName}!`;
    }

    if (!questions || questions.length === 0) {
        alert("Tidak ada soal dimuat. Kuis tidak bisa dimulai.");
        let prevView = menuContainer;
        if (isTryoutSeriusMode) prevView = tryoutSeriusContainer;
        else if (!isTryOut) prevView = kategoriLatihanContainer; // Latihan
        showView(prevView); return;
    }
    questionStates = questions.map(() => ({ answered: false, doubtful: false, selectedAnswer: -1, answeredForScore: false }));

    if(explanationElement) { explanationElement.classList.add('hidden'); explanationElement.innerHTML = ''; }

    if (isTryOut) {
        if(timerDisplaySidebar) timerDisplaySidebar.classList.remove('hidden');
        startOverallTimer();
        if (doubtfulButton) doubtfulButton.classList.remove('hidden');
    } else {
        if(timerDisplaySidebar) timerDisplaySidebar.classList.add('hidden');
        stopOverallTimer();
        if (doubtfulButton) doubtfulButton.classList.add('hidden');
    }

    let prevViewForQuiz = menuContainer;
    if (isTryoutSeriusMode) prevViewForQuiz = tryoutSeriusContainer;
    else if (!isTryOut) prevViewForQuiz = kategoriLatihanContainer; // Latihan
    showView(quizLayoutContainer, prevViewForQuiz);

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

function finalizeTryOut() {
    if (currentQuestionIndex < questions.length && questionStates[currentQuestionIndex]) {
        const currentQState = questionStates[currentQuestionIndex];
        if (selectedOptionIndex !== -1 && currentQState.selectedAnswer === -1) currentQState.selectedAnswer = selectedOptionIndex;
        if (!currentQState.answered && selectedOptionIndex !== -1) currentQState.answered = true;
    }
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
            if (isTryOut && questionStates[currentQuestionIndex]) {
                questionStates[currentQuestionIndex].selectedAnswer = selectedOptionIndex;
                if (!questionStates[currentQuestionIndex].answered && selectedOptionIndex !== -1) {
                    questionStates[currentQuestionIndex].answered = true;
                    const currentNavBoxEl = questionNavigationGrid.querySelector(`.nav-question-box[data-index="${currentQuestionIndex}"]`);
                    if (currentNavBoxEl) currentNavBoxEl.classList.add('answered');
                }
            }
            currentQuestionIndex = parseInt(navBox.dataset.index);
            selectedOptionIndex = questionStates[currentQuestionIndex]?.selectedAnswer ?? -1;
            answerSubmitted = questionStates[currentQuestionIndex]?.answered ?? false;
            showQuestion(questions[currentQuestionIndex]);
        });
        questionNavigationGrid.appendChild(navBox);
    });
}

function submitAnswer(isFinalizing = false) {
    const currentQState = questionStates[currentQuestionIndex];
    if (!currentQState || (!isTryOut && currentQState.answered && !isFinalizing)) return;
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    currentQState.answered = true; currentQState.selectedAnswer = selectedOptionIndex;
    if (!isTryOut) answerSubmitted = true;

    const correctIndex = currentQ.answer;
    const explanationText = currentQ.explanation;
    const optionButtons = optionsContainer.querySelectorAll('.option-button');

    if (!isTryOut) {
        optionButtons.forEach(button => button.disabled = true);
        if (selectedOptionIndex === correctIndex && !currentQState.answeredForScore) {
            score++; currentQState.answeredForScore = true;
        }
    }

    const navBox = questionNavigationGrid.querySelector(`.nav-question-box[data-index="${currentQuestionIndex}"]`);
    if (navBox) {
        navBox.classList.add('answered');
        if (currentQState.doubtful) {
            currentQState.doubtful = false; navBox.classList.remove('doubtful');
            if (doubtfulButton) doubtfulButton.textContent = "Tandai Ragu-ragu";
        }
    }

    if (!isTryOut) {
        optionButtons.forEach((btn, i) => {
            btn.classList.remove('selected-tryout');
            if (i === correctIndex) btn.classList.add('correct');
            if (i === selectedOptionIndex && i !== correctIndex) btn.classList.add('incorrect');
        });
        let explText = `<strong>Penjelasan:</strong> ${explanationText || 'Tidak ada penjelasan.'}`;
        if (selectedOptionIndex === -1) explanationElement.innerHTML = `<strong>Anda tidak memilih jawaban.</strong> Jawaban yang benar adalah opsi ke-${correctIndex + 1}.<br>${explText}`;
        else if (selectedOptionIndex === correctIndex) explanationElement.innerHTML = `<strong>Jawaban Benar!</strong><br>${explText}`;
        else explanationElement.innerHTML = `<strong>Jawaban Salah.</strong> Jawaban yang benar adalah opsi ke-${correctIndex + 1}.<br>${explText}`;
        explanationElement.classList.remove('hidden');
    } else {
        optionButtons.forEach(btn => btn.classList.remove('selected-tryout'));
        if (selectedOptionIndex !== -1 && optionButtons[selectedOptionIndex]) {
            optionButtons[selectedOptionIndex].classList.add('selected-tryout');
        }
        if(explanationElement) { explanationElement.classList.add('hidden'); explanationElement.innerHTML = ''; }
    }

    if (!isFinalizing && nextQuestionButton) {
        nextQuestionButton.innerText = (currentQuestionIndex < questions.length - 1) ? "Soal Berikutnya" : (isTryOut ? "Selesaikan Try Out" : "Lihat Hasil");
        nextQuestionButton.classList.remove('hidden');
    }
}

function showQuestion(questionData) {
    if (!questionData) {
        alert("Error: Soal tidak dapat dimuat.");
        let prevView = menuContainer;
        if (isTryoutSeriusMode) prevView = tryoutSeriusContainer;
        else if (!isTryOut && isTryOut) prevView = menuContainer; // General Tryout
        else prevView = kategoriLatihanContainer; // Latihan
        showView(prevView, quizLayoutContainer); return;
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
        button.style.color = "black";
        button.addEventListener('click', () => selectOption(index));
        if (optionsContainer) optionsContainer.appendChild(button);
    });

    if (optionsContainer) {
        const optionButtons = optionsContainer.querySelectorAll('.option-button');
        optionButtons.forEach((btn, index) => {
            btn.disabled = (!isTryOut && currentQState.answered);
            btn.classList.remove('correct', 'incorrect', 'selected-tryout');
            if (!isTryOut && currentQState.answered) {
                if (index === questionData.answer) btn.classList.add('correct');
                if (index === currentQState.selectedAnswer && index !== questionData.answer) btn.classList.add('incorrect');
                if (index === currentQState.selectedAnswer) btn.classList.add('selected-tryout');
            } else if (index === currentQState.selectedAnswer) {
                btn.classList.add('selected-tryout');
            }
        });
    }

    if (isTryOut && doubtfulButton) {
        doubtfulButton.classList.remove('hidden');
        doubtfulButton.textContent = currentQState.doubtful ? "Hapus Tanda Ragu" : "Tandai Ragu-ragu";
    } else if (doubtfulButton) {
        doubtfulButton.classList.add('hidden');
    }

    if (!isTryOut && currentQState.answered && explanationElement) {
        const correctIndex = questionData.answer;
        const explText = `<strong>Penjelasan:</strong> ${questionData.explanation || 'Tidak ada penjelasan.'}`;
        if (currentQState.selectedAnswer === -1) explanationElement.innerHTML = `<strong>Anda tidak memilih jawaban.</strong> Jawaban yang benar adalah opsi ke-${correctIndex + 1}.<br>${explText}`;
        else if (currentQState.selectedAnswer === correctIndex) explanationElement.innerHTML = `<strong>Jawaban Benar!</strong><br>${explText}`;
        else explanationElement.innerHTML = `<strong>Jawaban Salah.</strong> Jawaban yang benar adalah opsi ke-${correctIndex + 1}.<br>${explText}`;
        explanationElement.classList.remove('hidden');
    }

    if (nextQuestionButton) {
        nextQuestionButton.innerText = (currentQuestionIndex < questions.length - 1) ? "Soal Berikutnya" : (isTryOut ? "Selesaikan Try Out" : "Lihat Hasil");
        nextQuestionButton.classList.remove('hidden');
    }
}

function selectOption(selectedIndex) {
    const currentQState = questionStates[currentQuestionIndex];
    if (!isTryOut && currentQState?.answered) return;
    selectedOptionIndex = selectedIndex;
    if (currentQState) currentQState.selectedAnswer = selectedIndex;
    if (optionsContainer) {
        optionsContainer.querySelectorAll('.option-button').forEach((button, i) => {
            button.classList.toggle('selected-tryout', i === selectedIndex);
        });
    }
    if (!isTryOut) submitAnswer(false);
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
        if (isTryOut && currentQState) {
            currentQState.selectedAnswer = selectedOptionIndex;
            if (!currentQState.answered && selectedOptionIndex !== -1) {
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
            answerSubmitted = questionStates[currentQuestionIndex]?.answered ?? false;
            showQuestion(questions[currentQuestionIndex]);
        } else {
            if (isTryOut) { stopOverallTimer(); finalizeTryOut(); }
            else showResult();
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

    if (isTryoutSeriusMode) {
        score = 0;
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
            else if (score >= 121 && score <= TRYOUT_QUESTION_LIMIT) feedback = "NILAI BAGUS, PERTAHANKAN"; // Gunakan TRYOUT_QUESTION_LIMIT
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
    } else if (isTryOut) { // Try Out Gabungan
        score = 0;
        const categoryBreakdown = {};
        questions.forEach((q, index) => {
            const state = questionStates[index];
            if (state?.answered) {
                if (state.selectedAnswer === q.answer) score++;
                const categoryKey = q.category || 'lainnya';
                if (!categoryBreakdown[categoryKey]) categoryBreakdown[categoryKey] = { correct: 0, total: 0, attempted: 0 };
                categoryBreakdown[categoryKey].total++;
                if (state.selectedAnswer !== -1) categoryBreakdown[categoryKey].attempted++;
                if (state.selectedAnswer === q.answer) categoryBreakdown[categoryKey].correct++;
            } else if (state) { // Soal ada tapi tidak dijawab
                const categoryKey = q.category || 'lainnya';
                if (!categoryBreakdown[categoryKey]) categoryBreakdown[categoryKey] = { correct: 0, total: 0, attempted: 0 };
                categoryBreakdown[categoryKey].total++;
            }
        });
        message += `<span class="user-name-result">Selamat ${currentUserNameForResult}!</span><br>`;
        message += `Skor Try Out (Gabungan) Anda: <span class="score-value">${score}</span> dari ${totalQuestions} soal.<br>`;
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
    } else { // Latihan Soal
        message += `<span class="user-name-result">Selamat ${currentUserNameForResult}!</span><br>`;
        message += `Skor Latihan Anda (${currentCategoryFileName ? formatCategoryName(currentCategoryFileName.replace('.json', '')) : 'Umum'}): <span class="score-value">${score}</span> dari ${totalQuestions} soal.`;
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
            // Reset state variables
            questions = []; allCategoryQuestions = []; questionStates = [];
            currentQuestionIndex = 0; score = 0; selectedOptionIndex = -1; answerSubmitted = false;
            
            const wasTryoutSerius = isTryoutSeriusMode;
            const wasGeneralTryout = isTryOut && !isTryoutSeriusMode;
            isTryOut = false; isTryoutSeriusMode = false; currentTryoutSeriusType = null;

            let viewToReturnTo = menuContainer;
            if (wasTryoutSerius) viewToReturnTo = tryoutSeriusContainer;
            else if (!wasGeneralTryout) viewToReturnTo = kategoriLatihanContainer; // Latihan
            showView(viewToReturnTo, quizLayoutContainer);
        }
    });
}

if (restartButton) {
    restartButton.addEventListener('click', () => {
        questions = []; allCategoryQuestions = []; questionStates = [];
        currentQuestionIndex = 0; score = 0; selectedOptionIndex = -1; answerSubmitted = false;

        const wasTryoutSerius = isTryoutSeriusMode;
        const wasGeneralTryout = isTryOut && !isTryoutSeriusMode;
        isTryOut = false; isTryoutSeriusMode = false; currentTryoutSeriusType = null;

        let viewToReturnTo = menuContainer;
        if (wasTryoutSerius) viewToReturnTo = tryoutSeriusContainer;
        else if (!wasGeneralTryout) viewToReturnTo = kategoriLatihanContainer; // Latihan
        showView(viewToReturnTo, resultContainer);
    });
}
console.log("script.js: All initializations and listeners setup complete.");
