let allCategoryQuestions = [];
const TRYOUT_QUESTION_LIMIT = 180;
const TRYOUT_TIME_LIMIT_MINUTES = 180;

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let isTryOut = false;
let userName = ""; // This will be set from sessionStorage
let currentCategoryFileName = null;
let previousView = null;
let selectedOptionIndex = -1;
let answerSubmitted = false;

let overallTimerInterval = null;
let timeLeftOverallSeconds = TRYOUT_TIME_LIMIT_MINUTES * 60;

// DOM Elements
const menuContainer = document.getElementById('menu-container');
const welcomeUserMessage = document.getElementById('welcome-user-message');
const latihanSoalMenuButton = document.getElementById('latihan-soal-menu-button');
const tryoutButton = document.getElementById('tryout-button');
const logoutButton = document.getElementById('logout-button'); // GET LOGOUT BUTTON

const kategoriLatihanContainer = document.getElementById('kategori-latihan-container');
const kategoriButtons = document.querySelectorAll('.kategori-button');
const kembaliKeMenuUtamaButton = document.getElementById('kembali-ke-menu-utama-button');

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

// Elements from Firebase script scope, re-declared for clarity or if needed for logout
const licenseFormContainerGlobal = document.getElementById("license-form-container");
const mainAppContentGlobal = document.getElementById("main-app-content");
const licenseInputGlobal = document.getElementById("license");
const nameInputElementGlobal = document.getElementById("name-input");
const licenseMsgGlobal = document.getElementById("license-msg");


// Stores state for each question: { answered: bool, doubtful: bool, selectedAnswer: int, answeredForScore: bool }
let questionStates = [];


function showView(viewToShow, prevView = null) {
    const allViews = [menuContainer, kategoriLatihanContainer, quizLayoutContainer, resultContainer];
    // licenseFormContainerGlobal is handled separately for logout

    allViews.forEach(view => {
        if (view) {
            if (view === viewToShow) {
                view.classList.remove('hidden');
            } else {
                view.classList.add('hidden');
            }
        }
    });
    // Ensure license form is hidden if we are showing an app view
    if (licenseFormContainerGlobal && viewToShow !== licenseFormContainerGlobal) {
        licenseFormContainerGlobal.style.display = 'none';
    }


    if (prevView) {
        previousView = prevView;
    }
}

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

document.addEventListener('DOMContentLoaded', () => {
    // userName is set by proceedToApp or restored from sessionStorage within startGame/Tryout flow
    // Initial welcome message is also handled by proceedToApp
});


latihanSoalMenuButton.addEventListener('click', () => {
    showView(kategoriLatihanContainer, menuContainer);
});

tryoutButton.addEventListener('click', () => {
    isTryOut = true;
    currentCategoryFileName = null;
    const categoryDataFiles = [
        "anak.json", "bedah.json", "gadar.json", "jiwa.json",
        "keluarga.json", "komunitas.json", "manajemen.json"
    ];

    loadMultipleQuestionData(categoryDataFiles, () => {
        if (allCategoryQuestions.length === 0) {
            alert("Tidak ada soal yang berhasil dimuat untuk Try Out. Silakan periksa file-file soal.");
            showView(menuContainer);
            return;
        }
        shuffleArray(allCategoryQuestions);
        questions = allCategoryQuestions.slice(0, TRYOUT_QUESTION_LIMIT);
        if (questions.length === 0) {
            alert("Tidak ada soal yang tersedia setelah pemrosesan untuk Try Out.");
            showView(menuContainer);
            return;
        }
        // userName is already set or will be retrieved from session in startGame
        startGame('tryout');
    });
});

// LOGOUT BUTTON EVENT LISTENER
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        if (confirm("Anda yakin ingin keluar dan kembali ke halaman login?")) {
            // 1. Clear session storage
            if (sessionStorage) {
                sessionStorage.removeItem('licenseValidated');
                sessionStorage.removeItem('userName');
            }

            // 2. Reset global JavaScript state
            userName = "";
            questions = [];
            allCategoryQuestions = [];
            questionStates = [];
            currentQuestionIndex = 0;
            score = 0;
            isTryOut = false;
            currentCategoryFileName = null;
            previousView = null;
            selectedOptionIndex = -1;
            answerSubmitted = false;
            stopOverallTimer(); // Important to stop any active timer

            // 3. Hide all views within main-app-content
            const allAppViews = [menuContainer, kategoriLatihanContainer, quizLayoutContainer, resultContainer];
            allAppViews.forEach(view => {
                if (view) view.classList.add('hidden');
            });

            // 4. Hide main app content and show license form
            if (mainAppContentGlobal) mainAppContentGlobal.style.display = "none";
            if (licenseFormContainerGlobal) licenseFormContainerGlobal.style.display = "block";


            // 5. Clear dynamic content that might persist visually from the app
            if (welcomeUserMessage) welcomeUserMessage.textContent = '';
            if (userNameDisplaySidebar) userNameDisplaySidebar.textContent = 'Nama Pengguna'; // Reset to default
            if (questionNavigationGrid) questionNavigationGrid.innerHTML = '';
            if (questionElement) questionElement.textContent = ''; // Use textContent for simple text
            if (optionsContainer) optionsContainer.innerHTML = '';
            if (explanationElement) {
                explanationElement.innerHTML = '';
                explanationElement.classList.add('hidden');
            }
            if (scoreElement) scoreElement.innerHTML = ''; // Clear result score
            if (timeLeftSidebarElement) timeLeftSidebarElement.innerText = `${TRYOUT_TIME_LIMIT_MINUTES}:00`; // Reset timer display
            if (timerDisplaySidebar) timerDisplaySidebar.classList.add('hidden');
            if (questionCounterElement) questionCounterElement.classList.add('hidden');


            // 6. Clear input fields on the license form
            if (licenseInputGlobal) licenseInputGlobal.value = '';
            if (nameInputElementGlobal) nameInputElementGlobal.value = '';
            if (licenseMsgGlobal) licenseMsgGlobal.textContent = '';
        }
    });
}


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function loadQuestionData(fileName, callback) {
    showLoadingIndicator(`Memuat soal ${fileName.replace('.json', '')}...`, kategoriLatihanContainer);
    fetch(fileName)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} (${response.statusText}) for ${fileName}`);
            }
            return response.json();
        })
        .then(data => {
            hideLoadingIndicator();
            if (Array.isArray(data) && data.length > 0) {
                shuffleArray(data);
                questions = [...data];
                callback();
            } else {
                alert(`Gagal memuat soal dari ${fileName} atau tidak ada soal ditemukan di dalamnya.`);
                console.error(`Data tidak valid atau kosong setelah memuat ${fileName}. Actual:`, data);
                showView(kategoriLatihanContainer, menuContainer);
            }
        })
        .catch(error => {
            hideLoadingIndicator();
            if (error instanceof SyntaxError) {
                alert(`Error parsing JSON file: ${fileName}.\n\n${error.message}`);
            } else {
                alert(`Gagal memuat file data: ${fileName}. Error: ${error.message}`);
            }
            console.error(`Error saat memuat data: ${fileName}`, error);
            showView(kategoriLatihanContainer, menuContainer);
        });
}

async function loadMultipleQuestionData(fileNames, allLoadedCallback) {
    showLoadingIndicator("Sedang menyiapkan soal Try Out, mohon tunggu...", menuContainer);
    allCategoryQuestions = [];

    const fetchPromises = fileNames.map(fileName =>
        fetch(fileName)
        .then(response => {
            if (!response.ok) {
                console.warn(`Gagal memuat ${fileName}: ${response.status} (${response.statusText})`);
                return { fileName, data: [] };
            }
            return response.json().then(data => ({ fileName, data }));
        })
        .catch(error => {
            console.error(`Error memuat ${fileName}:`, error);
            if (error instanceof SyntaxError) alert(`Error parsing JSON file during Try Out prep: ${fileName}.\n\n${error.message}`);
            return { fileName, data: [] };
        })
    );

    try {
        const results = await Promise.all(fetchPromises);
        hideLoadingIndicator();
        results.forEach(result => {
            const { fileName, data: dataArray } = result;
            const categoryName = fileName.replace('.json', '');

            if (Array.isArray(dataArray) && dataArray.length > 0) {
                const questionsWithCategory = dataArray.map(q => ({
                    ...q,
                    category: categoryName
                }));
                allCategoryQuestions.push(...questionsWithCategory);
            }
        });
        allLoadedCallback();
    } catch (error) {
        hideLoadingIndicator();
        console.error("Error tak terduga saat memuat multiple question data:", error);
        alert("Terjadi kesalahan saat memuat data soal untuk Try Out.");
        showView(menuContainer);
    }
}

function formatCategoryName(shortName) {
    if (!shortName) return "Lainnya";
    const nameMap = {
        "jiwa": "Keperawatan Jiwa",
        "anak": "Keperawatan Anak",
        "keluarga": "Keperawatan Keluarga",
        "komunitas": "Keperawatan Komunitas",
        "bedah": "Keperawatan Medikal Bedah",
        "gadar": "Keperawatan Gawat Darurat",
        "manajemen": "Manajemen Keperawatan"
    };
    return nameMap[shortName.toLowerCase()] || shortName.charAt(0).toUpperCase() + shortName.slice(1);
}

kategoriButtons.forEach(button => {
    button.addEventListener('click', () => {
        isTryOut = false;
        const dataFileName = button.dataset.script.replace('.js', '.json');
        currentCategoryFileName = dataFileName;
        // userName is already set or will be retrieved from session in startGame
        loadQuestionData(dataFileName, () => {
            startGame('latihan');
        });
    });
});

kembaliKeMenuUtamaButton.addEventListener('click', () => {
    showView(menuContainer, kategoriLatihanContainer);
});


function startGame(mode) {
    currentQuestionIndex = 0;
    score = 0;
    isTryOut = mode === 'tryout';
    selectedOptionIndex = -1;
    answerSubmitted = false;

    // Retrieve and set userName if not already set by proceedToApp
    const sessionUserName = sessionStorage.getItem('userName');
    if (sessionUserName) {
        userName = sessionUserName; // Ensure global userName is up-to-date
        if (userNameDisplaySidebar) userNameDisplaySidebar.innerText = userName;
        // Welcome message is typically set by proceedToApp. If navigating back, it might already be set.
        if (welcomeUserMessage && (!welcomeUserMessage.textContent || welcomeUserMessage.textContent.includes("Pengguna"))) {
             welcomeUserMessage.textContent = `Selamat datang, ${userName}!`;
        }
    } else if (!userName) { // Fallback if somehow session is missing but was expected
        userName = "Pengguna";
        if (userNameDisplaySidebar) userNameDisplaySidebar.innerText = userName;
        if (welcomeUserMessage) welcomeUserMessage.textContent = `Selamat datang, ${userName}!`;
    }


    if (!questions || questions.length === 0) {
        alert("Tidak ada soal yang dimuat. Tidak dapat memulai kuis.");
        console.error("startGame called with no questions loaded.");
        const previousViewToShow = isTryOut ? menuContainer : kategoriLatihanContainer;
        showView(previousViewToShow || menuContainer);
        return;
    }
    questionStates = questions.map(() => ({
        answered: false,
        doubtful: false,
        selectedAnswer: -1,
        answeredForScore: false
    }));

    explanationElement.classList.add('hidden');
    explanationElement.innerHTML = '';

    if (isTryOut) {
        timerDisplaySidebar.classList.remove('hidden');
        startOverallTimer();
        if (doubtfulButton) doubtfulButton.classList.remove('hidden');
    } else {
        timerDisplaySidebar.classList.add('hidden');
        stopOverallTimer();
        if (doubtfulButton) doubtfulButton.classList.add('hidden'); // Ensure doubtful button is hidden for non-tryout (or shown based on logic)
    }

    const prevViewForQuiz = isTryOut ? menuContainer : kategoriLatihanContainer;
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
            alert("Waktu Try Out Habis!");
            finalizeTryOut();
        }
    }, 1000);
}

function stopOverallTimer() {
    clearInterval(overallTimerInterval);
}

function updateOverallTimerDisplaySidebar() {
    const minutes = Math.floor(timeLeftOverallSeconds / 60);
    const seconds = timeLeftOverallSeconds % 60;
    if (timeLeftSidebarElement) timeLeftSidebarElement.innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function finalizeTryOut() {
    console.log("Try Out Selesai. Menampilkan hasil.");
    // Ensure the last selected option for the current question is recorded if the timer runs out
    if (currentQuestionIndex < questions.length && questionStates[currentQuestionIndex]) {
        const currentQState = questionStates[currentQuestionIndex];
        if (selectedOptionIndex !== -1 && currentQState.selectedAnswer === -1) { // If an option was selected but not yet saved to state
            currentQState.selectedAnswer = selectedOptionIndex;
        }
        if (!currentQState.answered && selectedOptionIndex !== -1) { // Mark as answered if an option was selected
            currentQState.answered = true;
        }
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
            if (index === currentQuestionIndex) {
                navBox.classList.add('current');
            }
            if (questionStates[index].answered) {
                navBox.classList.add('answered');
            }
            if (questionStates[index].doubtful) {
                navBox.classList.add('doubtful');
            }
        }

        navBox.addEventListener('click', () => {
            // Before navigating, save the state of the current question for TryOut
            if (isTryOut && questionStates[currentQuestionIndex]) {
                questionStates[currentQuestionIndex].selectedAnswer = selectedOptionIndex;
                // Mark as answered if an option was selected, even if not "next" was clicked
                if (!questionStates[currentQuestionIndex].answered && selectedOptionIndex !== -1) {
                    questionStates[currentQuestionIndex].answered = true;
                    const currentNavBox = questionNavigationGrid.querySelector(`.nav-question-box[data-index="${currentQuestionIndex}"]`);
                    if (currentNavBox && !currentNavBox.classList.contains('answered')) {
                         currentNavBox.classList.add('answered');
                    }
                }
            }
            // For non-TryOut, answer is submitted immediately on option click, so no special handling here for saving state before nav.

            currentQuestionIndex = parseInt(navBox.dataset.index);
            // Load state for the new question
            if (questionStates[currentQuestionIndex]) {
                selectedOptionIndex = questionStates[currentQuestionIndex].selectedAnswer;
                // answerSubmitted reflects if the *newly navigated to* question has been answered.
                // For non-TryOut, this implies immediate feedback was shown. For TryOut, it means an option was at least picked.
                answerSubmitted = questionStates[currentQuestionIndex].answered;
            } else {
                selectedOptionIndex = -1;
                answerSubmitted = false;
            }
            showQuestion(questions[currentQuestionIndex]);
        });
        questionNavigationGrid.appendChild(navBox);
    });
}

function submitAnswer(isFinalizing = false) {
    const currentQState = questionStates[currentQuestionIndex];
    if (!currentQState) {
        console.error("submitAnswer: No state for current question index:", currentQuestionIndex);
        return;
    }
    // For non-TryOut, once answered (feedback shown), don't re-process.
    // For TryOut, this function might be called (e.g. by next button) but primarily marks selection, feedback is at the end.
    if (!isTryOut && currentQState.answered && !isFinalizing) return;

    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) {
        console.error("submitAnswer: currentQ is undefined at index", currentQuestionIndex);
        return;
    }

    currentQState.answered = true; // Mark the question as "interacted with" or "attempted"
    currentQState.selectedAnswer = selectedOptionIndex;
    if (!isTryOut) {
      answerSubmitted = true; // For non-TryOut, this means feedback is shown
    }

    const correctIndex = currentQ.answer;
    const explanationText = currentQ.explanation;
    const optionButtons = optionsContainer.querySelectorAll('.option-button');

    // Score calculation only for non-TryOut mode here. TryOut score is tallied at the end.
    if (!isTryOut) {
        optionButtons.forEach(button => button.disabled = true); // Disable options after answering
        if (selectedOptionIndex !== -1 && selectedOptionIndex === correctIndex && !currentQState.answeredForScore) {
            score++;
            currentQState.answeredForScore = true; // Ensure score is only added once
        }
    }

    const navBox = questionNavigationGrid.querySelector(`.nav-question-box[data-index="${currentQuestionIndex}"]`);
    if (navBox) {
        navBox.classList.add('answered');
        if (currentQState.doubtful) { // If it was doubtful, answering removes doubtful status
            currentQState.doubtful = false;
            navBox.classList.remove('doubtful');
            if (doubtfulButton) doubtfulButton.textContent = "Tandai Ragu-ragu";
        }
    }

    if (!isTryOut) { // Show immediate feedback and explanation for Latihan Soal
        optionButtons.forEach((btn, i) => {
            btn.classList.remove('selected-tryout'); // Clear any tryout specific class
            if (i === correctIndex) btn.classList.add('correct');
            if (i === selectedOptionIndex && i !== correctIndex) btn.classList.add('incorrect');
        });

        if (selectedOptionIndex === -1) { // If no option was selected
            explanationElement.innerHTML = `<strong>Anda tidak memilih jawaban.</strong> Jawaban yang benar adalah opsi ke-${correctIndex + 1}.<br><strong>Penjelasan:</strong> ${explanationText || 'Tidak ada penjelasan.'}`;
        } else if (selectedOptionIndex === correctIndex) {
            explanationElement.innerHTML = `<strong>Jawaban Benar!</strong><br>${explanationText || 'Tidak ada penjelasan.'}`;
        } else {
            explanationElement.innerHTML = `<strong>Jawaban Salah.</strong> Jawaban yang benar adalah opsi ke-${correctIndex + 1}.<br><strong>Penjelasan:</strong> ${explanationText || 'Tidak ada penjelasan.'}`;
        }
        explanationElement.classList.remove('hidden');
    } else { // For TryOut, just visually mark the selected option if any, no explanation yet
        optionButtons.forEach(btn => btn.classList.remove('selected-tryout'));
        if (selectedOptionIndex !== -1 && optionButtons[selectedOptionIndex]) {
            optionButtons[selectedOptionIndex].classList.add('selected-tryout');
        }
        explanationElement.classList.add('hidden'); // No explanation during TryOut
        explanationElement.innerHTML = '';
    }

    // Update "Next" button text; only if not finalizing (e.g., called by timer timeout)
    if (!isFinalizing) {
        if (currentQuestionIndex < questions.length - 1) {
            nextQuestionButton.innerText = "Soal Berikutnya";
        } else {
            nextQuestionButton.innerText = isTryOut ? "Selesaikan Try Out" : "Lihat Hasil";
        }
        nextQuestionButton.classList.remove('hidden'); // Ensure it's visible
    }
}


function showQuestion(questionData) {
    if (!questionData) {
        alert("Terjadi kesalahan: Soal tidak dapat dimuat.");
        console.error("showQuestion: questionData is undefined for index:", currentQuestionIndex);
        if (isTryOut) finalizeTryOut();
        else showView(kategoriLatihanContainer, quizLayoutContainer);
        return;
    }

    const currentQState = questionStates[currentQuestionIndex];
    if (!currentQState) { // Should ideally not happen if startGame initializes states correctly
        console.error("showQuestion: No state for current question index:", currentQuestionIndex, "Re-initializing state for safety.");
        questionStates[currentQuestionIndex] = { answered: false, doubtful: false, selectedAnswer: -1, answeredForScore: false };
        // currentQState = questionStates[currentQuestionIndex]; // This line was missing, re-assign after re-init
    }
    // selectedOptionIndex and answerSubmitted are now set by the navigation logic or selectOption
    // So, we directly use currentQState.selectedAnswer and currentQState.answered

    if (questionCounterElement) {
        questionCounterElement.innerText = `Soal ${currentQuestionIndex + 1} dari ${questions.length}`;
        questionCounterElement.classList.remove('hidden');
    }

    const navBoxes = questionNavigationGrid.querySelectorAll('.nav-question-box');
    navBoxes.forEach(box => {
        box.classList.remove('current');
        if (parseInt(box.dataset.index) === currentQuestionIndex) {
            box.classList.add('current');
        }
    });

    questionElement.textContent = questionData.question;
    optionsContainer.innerHTML = '';
    explanationElement.classList.add('hidden');
    explanationElement.innerHTML = '';

    questionData.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option;
        button.classList.add('option-button');
        button.style.color = "black"; // Ensure default text color if not overridden by state classes
        button.addEventListener('click', () => selectOption(index));
        optionsContainer.appendChild(button);
    });

    const optionButtons = optionsContainer.querySelectorAll('.option-button');
    optionButtons.forEach((btn, index) => {
        btn.disabled = (!isTryOut && currentQState.answered); // Disable if non-TryOut and answered
        btn.classList.remove('correct', 'incorrect', 'selected-tryout'); // Reset classes

        if (!isTryOut && currentQState.answered) { // Latihan Soal - feedback shown
            if (index === questionData.answer) btn.classList.add('correct');
            if (index === currentQState.selectedAnswer && index !== questionData.answer) btn.classList.add('incorrect');
             if (index === currentQState.selectedAnswer) { // Also mark the selected one, even if correct
                btn.classList.add('selected-tryout'); // Re-using class, or make a new one like 'selected-latihan'
            }
        } else if (index === currentQState.selectedAnswer) { // TryOut or Latihan (before answer) - mark selected
             btn.classList.add('selected-tryout');
        }
    });

    if (isTryOut && doubtfulButton) {
        doubtfulButton.classList.remove('hidden');
        doubtfulButton.textContent = currentQState.doubtful ? "Hapus Tanda Ragu" : "Tandai Ragu-ragu";
    } else if (doubtfulButton) { // For non-TryOut, hide doubtful button
        doubtfulButton.classList.add('hidden');
    }


    if (!isTryOut && currentQState.answered) { // Show explanation if Latihan Soal and answered
        const correctIndex = questionData.answer;
        const explanationText = questionData.explanation || 'Tidak ada penjelasan.';
        if (currentQState.selectedAnswer === -1) {
            explanationElement.innerHTML = `<strong>Anda tidak memilih jawaban.</strong> Jawaban yang benar adalah opsi ke-${correctIndex + 1}.<br><strong>Penjelasan:</strong> ${explanationText}`;
        } else if (currentQState.selectedAnswer === correctIndex) {
             explanationElement.innerHTML = `<strong>Jawaban Benar!</strong><br>${explanationText}`;
        } else {
             explanationElement.innerHTML = `<strong>Jawaban Salah.</strong> Jawaban yang benar adalah opsi ke-${correctIndex + 1}.<br><strong>Penjelasan:</strong> ${explanationText}`;
        }
        explanationElement.classList.remove('hidden');
    }

    // Setup "Next" button
    if (currentQuestionIndex < questions.length - 1) {
        nextQuestionButton.innerText = "Soal Berikutnya";
    } else {
        nextQuestionButton.innerText = isTryOut ? "Selesaikan Try Out" : "Lihat Hasil";
    }
    // Visibility of next button:
    // For non-TryOut, show it if answered or if no answer is selected yet (to allow skipping, though current logic doesn't directly support skipping without answering)
    // For TryOut, always show it.
    if (!isTryOut) {
        // Show next button if answered, or if no option has been selected yet (to allow proceeding if desired)
        // If an option must be selected to proceed, this logic might need adjustment
        // For now, assume it's okay to show if not answered, or if answered.
        // If selectedOptionIndex is -1 AND not answered, it means user hasn't picked.
        // If selectedOptionIndex is NOT -1 AND not answered, means user picked but hasn't "submitted" (which happens on click for Latihan)
        // If currentQState.answered is true, it means feedback is shown, so show next.
        nextQuestionButton.classList.remove('hidden');
    } else { // For TryOut, always show next button
        nextQuestionButton.classList.remove('hidden');
    }
}

function selectOption(selectedIndex) {
    const currentQState = questionStates[currentQuestionIndex];
    if (!isTryOut && currentQState && currentQState.answered) return; // Don't allow re-selecting if Latihan and already answered

    selectedOptionIndex = selectedIndex; // Update the global tracker for the current interaction
    if (currentQState) {
        currentQState.selectedAnswer = selectedIndex; // Persist to state immediately
    }

    const optionButtons = optionsContainer.querySelectorAll('.option-button');
    optionButtons.forEach((button, i) => {
        // Toggle 'selected-tryout' for visual feedback of selection
        button.classList.toggle('selected-tryout', i === selectedIndex);
    });

    if (!isTryOut) { // For Latihan Soal, submit the answer immediately upon selection
        submitAnswer(false);
    }
    // For TryOut, selection is just marked. submitAnswer is called by "Next" or "Finish"
}

if (doubtfulButton) {
    doubtfulButton.addEventListener('click', () => {
        if (!isTryOut || !questionStates[currentQuestionIndex]) return;

        const currentQState = questionStates[currentQuestionIndex];
        currentQState.doubtful = !currentQState.doubtful;

        const navBox = questionNavigationGrid.querySelector(`.nav-question-box[data-index="${currentQuestionIndex}"]`);
        if (navBox) {
            navBox.classList.toggle('doubtful', currentQState.doubtful);
        }
        doubtfulButton.textContent = currentQState.doubtful ? "Hapus Tanda Ragu" : "Tandai Ragu-ragu";
    });
}

nextQuestionButton.addEventListener('click', () => {
    const currentQState = questionStates[currentQuestionIndex];

    if (isTryOut) { // For TryOut, "Next" button confirms the selection for the current question
        if (currentQState) {
            currentQState.selectedAnswer = selectedOptionIndex; // Ensure current selection is in state
            if (!currentQState.answered && selectedOptionIndex !== -1) { // If an option was selected, mark as answered
                currentQState.answered = true;
                const navBox = questionNavigationGrid.querySelector(`.nav-question-box[data-index="${currentQuestionIndex}"]`);
                if (navBox && !navBox.classList.contains('answered')) {
                    navBox.classList.add('answered');
                }
            }
        }
    } else { // For non-TryOut (Latihan Soal)
        // If an answer hasn't been submitted yet (e.g., if user must click "Next" after selecting an option, though current logic auto-submits)
        // This path is mostly redundant if selectOption calls submitAnswer for non-TryOut
        if (currentQState && !currentQState.answered && selectedOptionIndex !== -1) {
            // submitAnswer(false); // This would re-trigger feedback, usually not needed if selectOption already did.
        }
    }

    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        // Reset/load state for the new question
        if (questionStates[currentQuestionIndex]) {
            selectedOptionIndex = questionStates[currentQuestionIndex].selectedAnswer;
            answerSubmitted = questionStates[currentQuestionIndex].answered;
        } else { // Should not happen if states are initialized
            selectedOptionIndex = -1;
            answerSubmitted = false;
        }
        showQuestion(questions[currentQuestionIndex]);
    } else { // Last question
        if (isTryOut) {
            stopOverallTimer(); // Stop timer before finalizing
            finalizeTryOut(); // This will call showResult
        } else {
            showResult();
        }
    }
});

function showResult() {
    stopOverallTimer(); // Ensure timer is stopped
    if (timerDisplaySidebar) timerDisplaySidebar.classList.add('hidden');
    if (questionCounterElement) questionCounterElement.classList.add('hidden');
    if (questionNavigationGrid) questionNavigationGrid.innerHTML = ''; // Clear nav grid
    explanationElement.classList.add('hidden');
    explanationElement.innerHTML = '';
    if (doubtfulButton) doubtfulButton.classList.add('hidden');

    const prevViewForResult = quizLayoutContainer;
    showView(resultContainer, prevViewForResult);

    const currentUserNameForResult = sessionStorage.getItem('userName') || userName || "Peserta";
    let message = ""; // Initialize message string
    const totalQuestions = questions.length;

    if (isTryOut) {
        score = 0; // Recalculate score for TryOut based on final states
        const categoryBreakdown = {};

        questions.forEach((q, index) => {
            const state = questionStates[index];
            if (state && state.answered) { // Only count answered questions for TryOut scoring
                if (state.selectedAnswer !== -1 && state.selectedAnswer === q.answer) {
                    score++;
                }
                // Populate category breakdown
                const categoryKey = q.category || 'lainnya'; // Use 'lainnya' if category is undefined
                if (!categoryBreakdown[categoryKey]) {
                    categoryBreakdown[categoryKey] = { correct: 0, total: 0, attempted: 0 };
                }
                categoryBreakdown[categoryKey].total++; // Total questions in this category
                if(state.answered && state.selectedAnswer !== -1) { // Count as attempted if an answer was selected
                    categoryBreakdown[categoryKey].attempted++;
                }
                if (state.selectedAnswer !== -1 && state.selectedAnswer === q.answer) {
                    categoryBreakdown[categoryKey].correct++;
                }
            } else if (state) { // Question was not answered, but still part of a category
                 const categoryKey = q.category || 'lainnya';
                 if (!categoryBreakdown[categoryKey]) {
                    categoryBreakdown[categoryKey] = { correct: 0, total: 0, attempted: 0 };
                }
                categoryBreakdown[categoryKey].total++;
            }
        });

        message += `<span class="user-name-result">Selamat ${currentUserNameForResult}!</span><br>`;
        message += `Skor Try Out Anda: <span class="score-value">${score}</span> dari ${totalQuestions} soal.<br>`;
        const minutesLeft = Math.floor(timeLeftOverallSeconds / 60);
        const secondsLeft = timeLeftOverallSeconds % 60;
        const timeLeftDisplay = timeLeftOverallSeconds > 0 ?
            `${minutesLeft} menit ${secondsLeft} detik` : (timeLeftOverallSeconds === 0 ? "Habis Tepat Waktu" : "Waktu Habis");
        message += `Sisa Waktu Pengerjaan: ${timeLeftDisplay}.<br><br>`;

        if (Object.keys(categoryBreakdown).length > 0) {
            message += `<span class="category-breakdown-title">Rekapitulasi Hasil Pengerjaan Anda:</span><br>`;
            for (const categoryKey in categoryBreakdown) {
                const { correct, total, attempted } = categoryBreakdown[categoryKey];
                const formattedName = formatCategoryName(categoryKey);
                message += `<span class="category-item"><span class="category-name">${formattedName}</span>: <span class="category-score">${correct}</span> benar dari ${attempted} dijawab (Total ${total} soal).</span><br>`;
            }
        } else {
            message += "Tidak ada rincian kategori yang tersedia.<br>";
        }

    } else { // For Latihan Soal
        // Score is already tallied during non-TryOut quiz
        message += `<span class="user-name-result">Selamat ${currentUserNameForResult}!</span><br>`;
        message += `Skor Latihan Anda (${currentCategoryFileName ? formatCategoryName(currentCategoryFileName.replace('.json', '')) : 'Umum'}): <span class="score-value">${score}</span> dari ${totalQuestions} soal.`;
    }

    scoreElement.innerHTML = message;
    // scoreElement.style.whiteSpace = "normal"; // Ensure this is set if it was pre-wrap before
}


quizBackButton.addEventListener('click', () => {
    if (confirm("Anda yakin ingin kembali? Progress kuis ini akan hilang.")) {
        if (isTryOut) stopOverallTimer();
        if (timerDisplaySidebar) timerDisplaySidebar.classList.add('hidden');
        if (questionCounterElement) questionCounterElement.classList.add('hidden');
        if (questionNavigationGrid) questionNavigationGrid.innerHTML = '';
        explanationElement.classList.add('hidden');
        explanationElement.innerHTML = '';
        if (doubtfulButton) doubtfulButton.classList.add('hidden');

        questions = [];
        allCategoryQuestions = [];
        questionStates = [];
        // Reset other relevant state variables
        currentQuestionIndex = 0;
        score = 0;
        selectedOptionIndex = -1;
        answerSubmitted = false;


        if (isTryOut) {
            showView(menuContainer, quizLayoutContainer);
        } else {
            showView(kategoriLatihanContainer, quizLayoutContainer);
        }
    }
});

restartButton.addEventListener('click', () => {
    questions = [];
    allCategoryQuestions = [];
    questionStates = [];
    // Reset other relevant state variables
    currentQuestionIndex = 0;
    score = 0;
    selectedOptionIndex = -1;
    answerSubmitted = false;

    if (isTryOut) {
        showView(menuContainer, resultContainer);
    } else {
        // For Latihan Soal, return to Kategori selection or specific Latihan start
        // Assuming 'kategoriLatihanContainer' is the correct view to return to
        showView(kategoriLatihanContainer, resultContainer);
    }
});
