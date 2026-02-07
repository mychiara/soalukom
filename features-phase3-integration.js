/**
 * 🎮 PHASE 3 INTEGRATION
 * Connects Phase 3 gamification features to the main app
 * 
 * @version 3.0.0
 * @date 2026-02-06
 */

// Wait for DOM and Phase 3 features to load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhase3Integration);
} else {
  initPhase3Integration();
}

function initPhase3Integration() {
  console.log('🎯 Initializing Phase 3 Integration...');
  
  // Wait for Phase 3 features to be available (max 5 seconds)
  let attempts = 0;
  const maxAttempts = 50; // 5 seconds (50 * 100ms)
  
  const checkInterval = setInterval(() => {
    if (window.enhancedAchievements && window.flashcardMode && window.customQuizBuilder) {
      clearInterval(checkInterval);
      setupPhase3MenuHandlers();
      setupAchievementTracking();
      console.log('✅ Phase 3 Integration Complete!');
    } else if (++attempts >= maxAttempts) {
      clearInterval(checkInterval);
      console.error('❌ Phase 3 features failed to load after 5 seconds');
      console.error('Missing:', {
        achievements: !window.enhancedAchievements,
        flashcards: !window.flashcardMode,
        quizBuilder: !window.customQuizBuilder
      });
    }
  }, 100);
}

// ========================================
// MENU HANDLERS
// ========================================

function setupPhase3MenuHandlers() {
  // Achievement Showcase
  const achievementsBtn = document.getElementById('main-menu-achievements');
  const achievementsBackBtn = document.getElementById('kembali-ke-main-menu-from-achievements');
  
  if (achievementsBtn) {
    achievementsBtn.addEventListener('click', () => {
      showView('achievements-container');
      renderAchievementShowcase();
    });
  }
  
  if (achievementsBackBtn) {
    achievementsBackBtn.addEventListener('click', () => {
      showView('main-menu-container');
    });
  }

  // Flashcard Mode
  const flashcardBtn = document.getElementById('main-menu-flashcard');
  const flashcardBackBtn = document.getElementById('kembali-ke-main-menu-from-flashcard');
  
  if (flashcardBtn) {
    flashcardBtn.addEventListener('click', () => {
      showView('flashcard-container-view');
      renderFlashcardMode();
    });
  }
  
  if (flashcardBackBtn) {
    flashcardBackBtn.addEventListener('click', () => {
      showView('main-menu-container');
    });
  }

  // Quiz Builder
  const quizBuilderBtn = document.getElementById('main-menu-quiz-builder');
  const quizBuilderBackBtn = document.getElementById('kembali-ke-main-menu-from-quiz-builder');
  
  if (quizBuilderBtn) {
    quizBuilderBtn.addEventListener('click', () => {
      showView('quiz-builder-container');
      renderQuizBuilder();
    });
  }
  
  if (quizBuilderBackBtn) {
    quizBuilderBackBtn.addEventListener('click', () => {
      showView('main-menu-container');
    });
  }
}

// ========================================
// VIEW RENDERING
// ========================================

function renderAchievementShowcase() {
  const container = document.getElementById('achievements-content');
  if (!container) return;
  
  container.innerHTML = window.enhancedAchievements.generateShowcaseHTML();
  
  // Setup filter buttons
  const filterBtns = container.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      
      // Update active state
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Filter cards
      const cards = container.querySelectorAll('.achievement-card');
      cards.forEach(card => {
        if (filter === 'all' || card.dataset.rarity === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

function renderFlashcardMode() {
  const container = document.getElementById('flashcard-content');
  if (!container) return;
  
  // Check if we have questions to create flashcards from
  const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
  const allQuestions = [];
  
  // Collect all answered questions from history
  history.forEach(entry => {
    if (entry.answers && entry.questions) {
      entry.questions.forEach((q, index) => {
        if (entry.answers[index] !== undefined) {
          allQuestions.push({
            ...q,
            category: entry.category || 'General'
          });
        }
      });
    }
  });
  
  if (allQuestions.length > 0) {
    // Create flashcards from questions
    window.flashcardMode.createFlashcardsFromQuestions(allQuestions);
    container.innerHTML = window.flashcardMode.generateFlashcardHTML();
    window.flashcardMode.initControls();
  } else {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🃏</div>
        <h3>Belum Ada Flashcard</h3>
        <p>Kerjakan beberapa soal terlebih dahulu untuk membuat flashcard.</p>
        <button class="btn-primary" onclick="showView('main-menu-container')">
          <i class="fa-solid fa-arrow-left"></i> Kembali ke Menu
        </button>
      </div>
    `;
  }
}

function renderQuizBuilder() {
  const container = document.getElementById('quiz-builder-content');
  if (!container) return;
  
  // Get all available questions from various sources
  const availableQuestions = getAllAvailableQuestions();
  
  container.innerHTML = window.customQuizBuilder.generateBuilderHTML(availableQuestions);
  
  // Setup question selection
  const checkboxes = container.querySelectorAll('.question-checkbox');
  const createBtn = container.querySelector('#create-quiz-btn');
  const clearBtn = container.querySelector('#clear-selection-btn');
  
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const index = parseInt(e.target.closest('.question-item').dataset.index);
      if (e.target.checked) {
        window.customQuizBuilder.selectedQuestions.push(availableQuestions[index]);
      } else {
        const qIndex = window.customQuizBuilder.selectedQuestions.findIndex(
          q => q === availableQuestions[index]
        );
        if (qIndex > -1) {
          window.customQuizBuilder.selectedQuestions.splice(qIndex, 1);
        }
      }
      updateSelectionCount();
    });
  });
  
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      const name = container.querySelector('#quiz-name')?.value;
      const description = container.querySelector('#quiz-description')?.value;
      
      if (!name) {
        alert('Mohon isi nama quiz!');
        return;
      }
      
      if (window.customQuizBuilder.selectedQuestions.length === 0) {
        alert('Pilih minimal 1 soal!');
        return;
      }
      
      window.customQuizBuilder.createQuiz(
        name,
        description || 'Quiz custom',
        window.customQuizBuilder.selectedQuestions
      );
      
      alert(`Quiz "${name}" berhasil dibuat!`);
      
      // Refresh the builder view
      renderQuizBuilder();
    });
  }
  
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      window.customQuizBuilder.selectedQuestions = [];
      checkboxes.forEach(cb => cb.checked = false);
      updateSelectionCount();
    });
  }
  
  function updateSelectionCount() {
    const countEl = container.querySelector('.question-selector h3');
    if (countEl) {
      countEl.textContent = `Pilih Soal (${window.customQuizBuilder.selectedQuestions.length} dipilih)`;
    }
  }
}

// ========================================
// ACHIEVEMENT TRACKING
// ========================================

function setupAchievementTracking() {
  // Check achievements after each quiz completion
  if (window.addEventListener) {
    // Create custom event for quiz completion
    window.addEventListener('quizCompleted', (event) => {
      const stats = calculateUserStats(event.detail);
      window.enhancedAchievements.checkAchievements(stats);
    });
    
    // Check achievements on page load
    setTimeout(() => {
      const stats = calculateUserStats();
      window.enhancedAchievements.checkAchievements(stats);
    }, 1000);
  }
}

function calculateUserStats(quizData = null) {
  const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
  const dailyStats = JSON.parse(localStorage.getItem('dailyStats') || '{}');
  const pomodoroData = JSON.parse(localStorage.getItem('pomodoroData') || '{}');
  
  let totalQuestions = 0;
  let correctAnswers = 0;
  let categoryScores = {};
  let currentStreak = 0;
  
  // Calculate from history
  history.forEach(entry => {
    if (entry.answers) {
      totalQuestions += entry.answers.length;
      entry.answers.forEach((answer, index) => {
        if (answer === entry.questions?.[index]?.correctAnswer) {
          correctAnswers++;
        }
      });
      
      // Category tracking
      const cat = entry.category || 'General';
      if (!categoryScores[cat]) {
        categoryScores[cat] = { total: 0, correct: 0 };
      }
      categoryScores[cat].total += entry.answers.length;
      entry.answers.forEach((answer, index) => {
        if (answer === entry.questions?.[index]?.correctAnswer) {
          categoryScores[cat].correct++;
        }
      });
    }
  });
  
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  
  // Calculate streak
  if (dailyStats.streak) {
    currentStreak = dailyStats.streak;
  }
  
  // Study time (in minutes)
  const studyTime = dailyStats.totalStudyTime || 0;
  
  // Check time-based achievements
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  
  return {
    totalQuestions,
    accuracy,
    streak: currentStreak,
    studyTime,
    weekendStudy: day === 0 || day === 6,
    studiedBefore6AM: hour < 6,
    studiedAfter10PM: hour >= 22,
    categoryMastery: Object.values(categoryScores).some(cat => 
      cat.total > 0 && (cat.correct / cat.total) * 100 >= 90
    ),
    allCategoriesHigh: Object.values(categoryScores).every(cat =>
      cat.total > 0 && (cat.correct / cat.total) * 100 >= 80
    ),
    categoryExpertise: Object.fromEntries(
      Object.entries(categoryScores).map(([cat, scores]) => [
        cat.toLowerCase(),
        scores.total >= 100 && (scores.correct / scores.total) * 100 >= 90
      ])
    ),
    pomodoroSessions: pomodoroData.sessionsCompleted || 0,
    customQuizzes: window.customQuizBuilder?.getData()?.quizzes?.length || 0,
    flashcardsReviewed: Object.keys(window.flashcardMode?.getData()?.reviewed || {}).length,
    rank: 0, // TODO: Calculate from leaderboard
    topPercentile: 50, // TODO: Calculate from leaderboard
    correctStreak: quizData?.correctStreak || 0,
    quickCompletion: quizData?.quickCompletion || false,
    perfectTryOut: quizData?.score === 100 && quizData?.totalQuestions >= 50,
    speedRecord: quizData?.averageTime < 30 && totalQuestions >= 50,
    improvement: 0, // TODO: Calculate week-over-week improvement
    achievementCount: window.enhancedAchievements?.getData()?.unlocked?.length || 0
  };
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function getAllAvailableQuestions() {
  const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
  const questions = [];
  const seen = new Set();
  
  history.forEach(entry => {
    if (entry.questions) {
      entry.questions.forEach(q => {
        const key = q.question.substring(0, 50);
        if (!seen.has(key)) {
          seen.add(key);
          questions.push({
            ...q,
            category: entry.category || 'General'
          });
        }
      });
    }
  });
  
  return questions;
}

function showView(viewId) {
  // Hide all container views
  document.querySelectorAll('.container-view').forEach(container => {
    container.classList.add('hidden');
  });
  
  // Show the selected view
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.remove('hidden');
  }
}

// Export for use in other scripts
window.phase3Integration = {
  renderAchievementShowcase,
  renderFlashcardMode,
  renderQuizBuilder,
  calculateUserStats
};

console.log('✅ Phase 3 Integration Loaded!');
