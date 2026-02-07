/**
 * 🎮 BIMBEL UKOM - PHASE 3: GAMIFICATION & ENGAGEMENT
 * 
 * Features:
 * 1. Enhanced Achievement System (50+ achievements)
 * 2. Flashcard Mode (Spaced Repetition)
 * 3. Custom Quiz Builder
 * 
 * @version 3.0.0
 * @date 2026-02-06
 */

// ========================================
// 1. ENHANCED ACHIEVEMENT SYSTEM
// ========================================

class EnhancedAchievementSystem {
  constructor() {
    this.storageKey = 'enhancedAchievements';
    this.achievements = this.defineAchievements();
    this.init();
  }

  init() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify({
        unlocked: [],
        progress: {},
        showcased: [],
        lastChecked: new Date().toISOString()
      }));
    }
  }

  defineAchievements() {
    return {
      // BRONZE TIER - Beginner Achievements
      first_steps: {
        id: 'first_steps',
        name: 'Langkah Pertama',
        description: 'Selesaikan soal pertama Anda',
        icon: '👣',
        rarity: 'bronze',
        condition: (stats) => stats.totalQuestions >= 1
      },
      early_bird: {
        id: 'early_bird',
        name: 'Burung Pagi',
        description: 'Belajar sebelum jam 6 pagi',
        icon: '🌅',
        rarity: 'bronze',
        condition: (stats) => stats.studiedBefore6AM
      },
      night_owl: {
        id: 'night_owl',
        name: 'Burung Hantu',
        description: 'Belajar setelah jam 10 malam',
        icon: '🦉',
        rarity: 'bronze',
        condition: (stats) => stats.studiedAfter10PM
      },
      weekend_warrior: {
        id: 'weekend_warrior',
        name: 'Pejuang Akhir Pekan',
        description: 'Belajar di hari Sabtu dan Minggu',
        icon: '🎯',
        rarity: 'bronze',
        condition: (stats) => stats.weekendStudy
      },
      quick_learner: {
        id: 'quick_learner',
        name: 'Pembelajar Cepat',
        description: 'Selesaikan 10 soal dalam 10 menit',
        icon: '⚡',
        rarity: 'bronze',
        condition: (stats) => stats.quickCompletion
      },

      // SILVER TIER - Intermediate Achievements
      dedicated_student: {
        id: 'dedicated_student',
        name: 'Siswa Berdedikasi',
        description: 'Belajar 7 hari berturut-turut',
        icon: '📚',
        rarity: 'silver',
        condition: (stats) => stats.streak >= 7
      },
      century_club: {
        id: 'century_club',
        name: 'Klub Seratus',
        description: 'Selesaikan 100 soal',
        icon: '💯',
        rarity: 'silver',
        condition: (stats) => stats.totalQuestions >= 100
      },
      accuracy_ace: {
        id: 'accuracy_ace',
        name: 'Ahli Akurasi',
        description: 'Capai akurasi 85% atau lebih',
        icon: '🎯',
        rarity: 'silver',
        condition: (stats) => stats.accuracy >= 85
      },
      category_master: {
        id: 'category_master',
        name: 'Master Kategori',
        description: 'Capai 90% di satu kategori',
        icon: '🏆',
        rarity: 'silver',
        condition: (stats) => stats.categoryMastery
      },
      speed_demon: {
        id: 'speed_demon',
        name: 'Iblis Kecepatan',
        description: 'Jawab 50 soal dengan rata-rata <30 detik',
        icon: '🚀',
        rarity: 'silver',
        condition: (stats) => stats.speedRecord
      },
      comeback_kid: {
        id: 'comeback_kid',
        name: 'Bangkit Kembali',
        description: 'Tingkatkan akurasi 20% dalam seminggu',
        icon: '📈',
        rarity: 'silver',
        condition: (stats) => stats.improvement >= 20
      },
      marathon_runner: {
        id: 'marathon_runner',
        name: 'Pelari Marathon',
        description: 'Belajar selama 3 jam dalam sehari',
        icon: '🏃',
        rarity: 'silver',
        condition: (stats) => stats.studyTime >= 180
      },

      // GOLD TIER - Advanced Achievements
      perfectionist: {
        id: 'perfectionist',
        name: 'Perfeksionis',
        description: 'Dapatkan 100% di Try Out lengkap',
        icon: '⭐',
        rarity: 'gold',
        condition: (stats) => stats.perfectTryOut
      },
      unstoppable: {
        id: 'unstoppable',
        name: 'Tak Terhentikan',
        description: 'Belajar 30 hari berturut-turut',
        icon: '🔥',
        rarity: 'gold',
        condition: (stats) => stats.streak >= 30
      },
      knowledge_seeker: {
        id: 'knowledge_seeker',
        name: 'Pencari Ilmu',
        description: 'Selesaikan 500 soal',
        icon: '📖',
        rarity: 'gold',
        condition: (stats) => stats.totalQuestions >= 500
      },
      all_rounder: {
        id: 'all_rounder',
        name: 'Serba Bisa',
        description: 'Capai 80%+ di semua kategori',
        icon: '🌟',
        rarity: 'gold',
        condition: (stats) => stats.allCategoriesHigh
      },
      elite_performer: {
        id: 'elite_performer',
        name: 'Performa Elite',
        description: 'Masuk Top 10% global',
        icon: '👑',
        rarity: 'gold',
        condition: (stats) => stats.topPercentile <= 10
      },
      consistency_king: {
        id: 'consistency_king',
        name: 'Raja Konsistensi',
        description: 'Belajar setiap hari selama 2 bulan',
        icon: '💎',
        rarity: 'gold',
        condition: (stats) => stats.streak >= 60
      },

      // PLATINUM TIER - Legendary Achievements
      legend: {
        id: 'legend',
        name: 'Legenda',
        description: 'Selesaikan 1000 soal',
        icon: '🏅',
        rarity: 'platinum',
        condition: (stats) => stats.totalQuestions >= 1000
      },
      immortal: {
        id: 'immortal',
        name: 'Abadi',
        description: 'Belajar 100 hari berturut-turut',
        icon: '♾️',
        rarity: 'platinum',
        condition: (stats) => stats.streak >= 100
      },
      grandmaster: {
        id: 'grandmaster',
        name: 'Grandmaster',
        description: 'Capai 95%+ akurasi keseluruhan',
        icon: '🎖️',
        rarity: 'platinum',
        condition: (stats) => stats.accuracy >= 95
      },
      champion: {
        id: 'champion',
        name: 'Juara',
        description: 'Peringkat #1 di leaderboard',
        icon: '🥇',
        rarity: 'platinum',
        condition: (stats) => stats.rank === 1
      },
      enlightened: {
        id: 'enlightened',
        name: 'Tercerahkan',
        description: 'Unlock semua achievement lainnya',
        icon: '✨',
        rarity: 'platinum',
        condition: (stats) => stats.achievementCount >= 49
      },

      // SPECIAL ACHIEVEMENTS
      lucky_seven: {
        id: 'lucky_seven',
        name: 'Keberuntungan Tujuh',
        description: 'Jawab 7 soal berturut-turut dengan benar',
        icon: '🍀',
        rarity: 'silver',
        condition: (stats) => stats.correctStreak >= 7
      },
      comeback_master: {
        id: 'comeback_master',
        name: 'Master Comeback',
        description: 'Benar setelah 5 jawaban salah berturut-turut',
        icon: '💪',
        rarity: 'silver',
        condition: (stats) => stats.comebackAfterFails
      },
      social_butterfly: {
        id: 'social_butterfly',
        name: 'Kupu-kupu Sosial',
        description: 'Bagikan 10 achievement',
        icon: '🦋',
        rarity: 'bronze',
        condition: (stats) => stats.achievementsShared >= 10
      },
      quiz_creator: {
        id: 'quiz_creator',
        name: 'Pembuat Kuis',
        description: 'Buat 5 custom quiz',
        icon: '🎨',
        rarity: 'silver',
        condition: (stats) => stats.customQuizzes >= 5
      },
      flashcard_fan: {
        id: 'flashcard_fan',
        name: 'Penggemar Flashcard',
        description: 'Review 100 flashcard',
        icon: '🃏',
        rarity: 'bronze',
        condition: (stats) => stats.flashcardsReviewed >= 100
      },

      // CATEGORY-SPECIFIC ACHIEVEMENTS
      jiwa_expert: {
        id: 'jiwa_expert',
        name: 'Ahli Keperawatan Jiwa',
        description: '100 soal Keperawatan Jiwa dengan 90%+',
        icon: '🧠',
        rarity: 'gold',
        condition: (stats) => stats.categoryExpertise?.jiwa
      },
      anak_expert: {
        id: 'anak_expert',
        name: 'Ahli Keperawatan Anak',
        description: '100 soal Keperawatan Anak dengan 90%+',
        icon: '👶',
        rarity: 'gold',
        condition: (stats) => stats.categoryExpertise?.anak
      },
      bedah_expert: {
        id: 'bedah_expert',
        name: 'Ahli Medikal Bedah',
        description: '100 soal Medikal Bedah dengan 90%+',
        icon: '🏥',
        rarity: 'gold',
        condition: (stats) => stats.categoryExpertise?.bedah
      },

      // TIME-BASED ACHIEVEMENTS
      morning_glory: {
        id: 'morning_glory',
        name: 'Kejayaan Pagi',
        description: 'Belajar pagi 10 hari berturut-turut',
        icon: '🌄',
        rarity: 'silver',
        condition: (stats) => stats.morningStreak >= 10
      },
      midnight_scholar: {
        id: 'midnight_scholar',
        name: 'Sarjana Tengah Malam',
        description: 'Belajar tengah malam 5 hari berturut-turut',
        icon: '🌙',
        rarity: 'bronze',
        condition: (stats) => stats.midnightStreak >= 5
      },

      // MILESTONE ACHIEVEMENTS
      milestone_50: {
        id: 'milestone_50',
        name: 'Milestone 50',
        description: 'Selesaikan 50 soal',
        icon: '5️⃣0️⃣',
        rarity: 'bronze',
        condition: (stats) => stats.totalQuestions >= 50
      },
      milestone_250: {
        id: 'milestone_250',
        name: 'Milestone 250',
        description: 'Selesaikan 250 soal',
        icon: '🎯',
        rarity: 'silver',
        condition: (stats) => stats.totalQuestions >= 250
      },
      milestone_750: {
        id: 'milestone_750',
        name: 'Milestone 750',
        description: 'Selesaikan 750 soal',
        icon: '🌟',
        rarity: 'gold',
        condition: (stats) => stats.totalQuestions >= 750
      },

      // ACCURACY ACHIEVEMENTS
      sharp_shooter: {
        id: 'sharp_shooter',
        name: 'Penembak Jitu',
        description: '20 soal berturut-turut benar',
        icon: '🎯',
        rarity: 'gold',
        condition: (stats) => stats.correctStreak >= 20
      },
      flawless_victory: {
        id: 'flawless_victory',
        name: 'Kemenangan Sempurna',
        description: 'Selesaikan quiz 50 soal tanpa salah',
        icon: '💎',
        rarity: 'platinum',
        condition: (stats) => stats.flawlessQuiz
      },

      // POMODORO ACHIEVEMENTS
      pomodoro_pro: {
        id: 'pomodoro_pro',
        name: 'Pomodoro Pro',
        description: 'Selesaikan 25 sesi Pomodoro',
        icon: '🍅',
        rarity: 'silver',
        condition: (stats) => stats.pomodoroSessions >= 25
      },
      focus_master: {
        id: 'focus_master',
        name: 'Master Fokus',
        description: 'Selesaikan 100 sesi Pomodoro',
        icon: '🎯',
        rarity: 'gold',
        condition: (stats) => stats.pomodoroSessions >= 100
      },

      // IMPROVEMENT ACHIEVEMENTS
      rising_star: {
        id: 'rising_star',
        name: 'Bintang Bersinar',
        description: 'Tingkatkan akurasi 30% dalam 2 minggu',
        icon: '⭐',
        rarity: 'gold',
        condition: (stats) => stats.rapidImprovement
      },
      phoenix: {
        id: 'phoenix',
        name: 'Phoenix',
        description: 'Bangkit dari akurasi <50% ke >80%',
        icon: '🔥',
        rarity: 'platinum',
        condition: (stats) => stats.phoenixRise
      }
    };
  }

  checkAchievements(stats) {
    const data = this.getData();
    const newAchievements = [];

    Object.values(this.achievements).forEach(achievement => {
      if (!data.unlocked.includes(achievement.id)) {
        if (achievement.condition(stats)) {
          data.unlocked.push(achievement.id);
          newAchievements.push(achievement);
        }
      }
    });

    if (newAchievements.length > 0) {
      data.lastChecked = new Date().toISOString();
      this.saveData(data);
      this.showAchievementNotifications(newAchievements);
    }

    return newAchievements;
  }

  showAchievementNotifications(achievements) {
    achievements.forEach((achievement, index) => {
      setTimeout(() => {
        this.showNotification(achievement);
      }, index * 4500); // Stagger notifications
    });
  }

  showNotification(achievement) {
    const rarityColors = {
      bronze: 'linear-gradient(135deg, #cd7f32, #b87333)',
      silver: 'linear-gradient(135deg, #c0c0c0, #a8a8a8)',
      gold: 'linear-gradient(135deg, #ffd700, #ffed4e)',
      platinum: 'linear-gradient(135deg, #e5e4e2, #b9f2ff)'
    };

    const popup = document.createElement('div');
    popup.className = 'enhanced-achievement-popup';
    popup.innerHTML = `
      <div class="achievement-rarity ${achievement.rarity}">${achievement.rarity.toUpperCase()}</div>
      <div class="achievement-icon-large">${achievement.icon}</div>
      <div class="achievement-title-large">${achievement.name}</div>
      <div class="achievement-description">${achievement.description}</div>
      <div class="achievement-actions">
        <button class="btn-share-achievement" data-id="${achievement.id}">
          <i class="fa-solid fa-share"></i> Bagikan
        </button>
      </div>
    `;
    popup.style.background = rarityColors[achievement.rarity];

    document.body.appendChild(popup);

    // Add event listener for share button
    popup.querySelector('.btn-share-achievement').addEventListener('click', () => {
      this.shareAchievement(achievement);
    });

    setTimeout(() => {
      popup.classList.add('show');
    }, 100);

    setTimeout(() => {
      popup.classList.remove('show');
      setTimeout(() => popup.remove(), 400);
    }, 5000);
  }

  shareAchievement(achievement) {
    const shareText = `🎉 Saya baru saja unlock achievement "${achievement.name}" di Bimbel UKOM! ${achievement.icon}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Achievement Unlocked!',
        text: shareText
      }).catch(() => {});
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Achievement disalin ke clipboard!');
      });
    }

    // Track share
    const data = this.getData();
    if (!data.shared) data.shared = 0;
    data.shared++;
    this.saveData(data);
  }

  generateShowcaseHTML() {
    const data = this.getData();
    const unlockedAchievements = data.unlocked.map(id => this.achievements[id]).filter(a => a);
    
    // Sort by rarity
    const rarityOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
    unlockedAchievements.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

    const totalAchievements = Object.keys(this.achievements).length;
    const unlockedCount = unlockedAchievements.length;
    const progress = (unlockedCount / totalAchievements * 100).toFixed(1);

    return `
      <div class="achievement-showcase">
        <div class="showcase-header">
          <h2>🏆 Koleksi Achievement</h2>
          <div class="showcase-progress">
            <div class="progress-text">${unlockedCount}/${totalAchievements} Unlocked (${progress}%)</div>
            <div class="progress-bar-container">
              <div class="progress-bar-fill" style="width: ${progress}%"></div>
            </div>
          </div>
        </div>

        <div class="achievement-filters">
          <button class="filter-btn active" data-filter="all">Semua</button>
          <button class="filter-btn" data-filter="platinum">Platinum</button>
          <button class="filter-btn" data-filter="gold">Gold</button>
          <button class="filter-btn" data-filter="silver">Silver</button>
          <button class="filter-btn" data-filter="bronze">Bronze</button>
        </div>

        <div class="achievement-grid">
          ${this.generateAchievementCards(unlockedAchievements, data.unlocked)}
        </div>
      </div>
    `;
  }

  generateAchievementCards(achievements, unlockedIds) {
    const allAchievements = Object.values(this.achievements);
    
    return allAchievements.map(achievement => {
      const isUnlocked = unlockedIds.includes(achievement.id);
      const cardClass = isUnlocked ? 'unlocked' : 'locked';
      
      return `
        <div class="achievement-card ${cardClass} ${achievement.rarity}" data-rarity="${achievement.rarity}">
          <div class="achievement-card-icon">${isUnlocked ? achievement.icon : '🔒'}</div>
          <div class="achievement-card-name">${isUnlocked ? achievement.name : '???'}</div>
          <div class="achievement-card-description">
            ${isUnlocked ? achievement.description : 'Achievement terkunci'}
          </div>
          <div class="achievement-card-rarity">${achievement.rarity}</div>
          ${isUnlocked ? `
            <button class="btn-share-small" onclick="window.enhancedAchievements.shareAchievement(window.enhancedAchievements.achievements['${achievement.id}'])">
              <i class="fa-solid fa-share"></i>
            </button>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  getData() {
    return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
  }

  saveData(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }
}

// ========================================
// 2. FLASHCARD MODE
// ========================================

class FlashcardMode {
  constructor() {
    this.storageKey = 'flashcardData';
    this.currentIndex = 0;
    this.cards = [];
    this.init();
  }

  init() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify({
        reviewed: {},
        mastered: [],
        difficult: [],
        lastReview: {}
      }));
    }
  }

  createFlashcardsFromQuestions(questions) {
    this.cards = questions.map((q, index) => ({
      id: `card_${index}_${Date.now()}`,
      question: q.question,
      answer: q.options[q.correctAnswer],
      explanation: q.explanation || '',
      category: q.category || 'General',
      difficulty: q.difficulty || 'medium',
      reviewCount: 0,
      lastReviewed: null,
      nextReview: new Date(),
      interval: 1, // Days until next review
      easeFactor: 2.5 // Spaced repetition ease factor
    }));
    
    this.currentIndex = 0;
    return this.cards.length;
  }

  getCurrentCard() {
    if (this.cards.length === 0) return null;
    return this.cards[this.currentIndex];
  }

  nextCard() {
    this.currentIndex = (this.currentIndex + 1) % this.cards.length;
    return this.getCurrentCard();
  }

  previousCard() {
    this.currentIndex = (this.currentIndex - 1 + this.cards.length) % this.cards.length;
    return this.getCurrentCard();
  }

  markCard(quality) {
    // Quality: 0 = wrong, 1 = hard, 2 = good, 3 = easy
    const card = this.getCurrentCard();
    if (!card) return;

    card.reviewCount++;
    card.lastReviewed = new Date();

    // Spaced Repetition Algorithm (SM-2)
    if (quality < 2) {
      // Reset interval if answered incorrectly
      card.interval = 1;
      card.easeFactor = Math.max(1.3, card.easeFactor - 0.2);
    } else {
      if (card.interval === 1) {
        card.interval = 6;
      } else {
        card.interval = Math.round(card.interval * card.easeFactor);
      }
      
      card.easeFactor = card.easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
      card.easeFactor = Math.max(1.3, card.easeFactor);
    }

    // Calculate next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + card.interval);
    card.nextReview = nextReview;

    // Save to localStorage
    this.saveCardData(card);

    // Track statistics
    const data = this.getData();
    if (quality === 0) {
      if (!data.difficult.includes(card.id)) {
        data.difficult.push(card.id);
      }
    } else if (quality === 3 && card.reviewCount >= 3) {
      if (!data.mastered.includes(card.id)) {
        data.mastered.push(card.id);
      }
    }
    this.saveData(data);
  }

  saveCardData(card) {
    const data = this.getData();
    if (!data.reviewed[card.id]) {
      data.reviewed[card.id] = {};
    }
    data.reviewed[card.id] = {
      reviewCount: card.reviewCount,
      lastReviewed: card.lastReviewed,
      nextReview: card.nextReview,
      interval: card.interval,
      easeFactor: card.easeFactor
    };
    data.lastReview[card.id] = new Date().toISOString();
    this.saveData(data);
  }

  generateFlashcardHTML() {
    const card = this.getCurrentCard();
    if (!card) {
      return '<p>Tidak ada flashcard. Pilih soal untuk membuat flashcard.</p>';
    }

    const data = this.getData();
    const stats = {
      total: this.cards.length,
      reviewed: Object.keys(data.reviewed).length,
      mastered: data.mastered.length,
      difficult: data.difficult.length
    };

    return `
      <div class="flashcard-container">
        <div class="flashcard-stats">
          <div class="stat-item">
            <div class="stat-value">${stats.total}</div>
            <div class="stat-label">Total</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.reviewed}</div>
            <div class="stat-label">Reviewed</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.mastered}</div>
            <div class="stat-label">Mastered</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.difficult}</div>
            <div class="stat-label">Difficult</div>
          </div>
        </div>

        <div class="flashcard-progress">
          ${this.currentIndex + 1} / ${this.cards.length}
        </div>

        <div class="flashcard" id="flashcard-main">
          <div class="flashcard-inner">
            <div class="flashcard-front">
              <div class="flashcard-category">${card.category}</div>
              <div class="flashcard-question">${card.question}</div>
              <div class="flashcard-hint">Klik untuk melihat jawaban</div>
            </div>
            <div class="flashcard-back">
              <div class="flashcard-answer">${card.answer}</div>
              ${card.explanation ? `
                <div class="flashcard-explanation">
                  <strong>Penjelasan:</strong><br>
                  ${card.explanation}
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <div class="flashcard-controls">
          <button id="flashcard-prev" class="btn-flashcard">
            <i class="fa-solid fa-chevron-left"></i> Sebelumnya
          </button>
          <button id="flashcard-flip" class="btn-flashcard btn-primary">
            <i class="fa-solid fa-rotate"></i> Balik Kartu
          </button>
          <button id="flashcard-next" class="btn-flashcard">
            Berikutnya <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>

        <div class="flashcard-rating" id="flashcard-rating" style="display: none;">
          <p>Seberapa mudah Anda mengingat ini?</p>
          <div class="rating-buttons">
            <button class="btn-rating btn-wrong" data-quality="0">
              ❌ Salah
            </button>
            <button class="btn-rating btn-hard" data-quality="1">
              😰 Sulit
            </button>
            <button class="btn-rating btn-good" data-quality="2">
              👍 Baik
            </button>
            <button class="btn-rating btn-easy" data-quality="3">
              😊 Mudah
            </button>
          </div>
        </div>
      </div>
    `;
  }

  initControls() {
    const flashcard = document.getElementById('flashcard-main');
    const flipBtn = document.getElementById('flashcard-flip');
    const prevBtn = document.getElementById('flashcard-prev');
    const nextBtn = document.getElementById('flashcard-next');
    const ratingDiv = document.getElementById('flashcard-rating');

    let isFlipped = false;

    if (flashcard && flipBtn) {
      const flip = () => {
        flashcard.classList.toggle('flipped');
        isFlipped = !isFlipped;
        if (ratingDiv) {
          ratingDiv.style.display = isFlipped ? 'block' : 'none';
        }
      };

      flashcard.addEventListener('click', flip);
      flipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        flip();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.previousCard();
        this.refreshFlashcard();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.nextCard();
        this.refreshFlashcard();
      });
    }

    // Rating buttons
    document.querySelectorAll('.btn-rating').forEach(btn => {
      btn.addEventListener('click', () => {
        const quality = parseInt(btn.dataset.quality);
        this.markCard(quality);
        this.nextCard();
        this.refreshFlashcard();
      });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') prevBtn?.click();
      if (e.key === 'ArrowRight') nextBtn?.click();
      if (e.key === ' ') {
        e.preventDefault();
        flipBtn?.click();
      }
    });
  }

  refreshFlashcard() {
    const container = document.querySelector('.flashcard-container');
    if (container) {
      const parent = container.parentElement;
      parent.innerHTML = this.generateFlashcardHTML();
      this.initControls();
    }
  }

  getData() {
    return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
  }

  saveData(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }
}

// ========================================
// 3. CUSTOM QUIZ BUILDER
// ========================================

class CustomQuizBuilder {
  constructor() {
    this.storageKey = 'customQuizzes';
    this.selectedQuestions = [];
    this.init();
  }

  init() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify({
        quizzes: [],
        shared: []
      }));
    }
  }

  createQuiz(name, description, questions) {
    const quiz = {
      id: `quiz_${Date.now()}`,
      name,
      description,
      questions,
      createdAt: new Date().toISOString(),
      timesPlayed: 0,
      averageScore: 0,
      shareCode: this.generateShareCode()
    };

    const data = this.getData();
    data.quizzes.push(quiz);
    this.saveData(data);

    return quiz;
  }

  generateShareCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  getQuizByCode(code) {
    const data = this.getData();
    return data.quizzes.find(q => q.shareCode === code);
  }

  deleteQuiz(quizId) {
    const data = this.getData();
    data.quizzes = data.quizzes.filter(q => q.id !== quizId);
    this.saveData(data);
  }

  updateQuizStats(quizId, score) {
    const data = this.getData();
    const quiz = data.quizzes.find(q => q.id === quizId);
    if (quiz) {
      quiz.timesPlayed++;
      quiz.averageScore = ((quiz.averageScore * (quiz.timesPlayed - 1)) + score) / quiz.timesPlayed;
      this.saveData(data);
    }
  }

  generateBuilderHTML(availableQuestions = []) {
    const data = this.getData();
    
    return `
      <div class="quiz-builder">
        <div class="builder-header">
          <h2>🎨 Pembuat Kuis Custom</h2>
          <p>Buat kuis sendiri dengan memilih soal-soal yang ingin Anda latih</p>
        </div>

        <div class="builder-form">
          <div class="form-group">
            <label>Nama Kuis:</label>
            <input type="text" id="quiz-name" class="form-input" placeholder="Contoh: Latihan Keperawatan Jiwa">
          </div>
          <div class="form-group">
            <label>Deskripsi:</label>
            <textarea id="quiz-description" class="form-textarea" placeholder="Deskripsi singkat tentang kuis ini..."></textarea>
          </div>
        </div>

        <div class="question-selector">
          <h3>Pilih Soal (${this.selectedQuestions.length} dipilih)</h3>
          <div class="selector-filters">
            <select id="category-filter" class="filter-select">
              <option value="all">Semua Kategori</option>
            </select>
            <input type="text" id="search-questions" class="filter-input" placeholder="Cari soal...">
          </div>
          <div id="question-list" class="question-list">
            ${this.generateQuestionList(availableQuestions)}
          </div>
        </div>

        <div class="builder-actions">
          <button id="create-quiz-btn" class="btn-primary">
            <i class="fa-solid fa-plus"></i> Buat Kuis
          </button>
          <button id="clear-selection-btn" class="btn-secondary">
            <i class="fa-solid fa-times"></i> Hapus Pilihan
          </button>
        </div>

        <div class="saved-quizzes">
          <h3>Kuis Tersimpan (${data.quizzes.length})</h3>
          <div class="quiz-grid">
            ${this.generateSavedQuizzes(data.quizzes)}
          </div>
        </div>
      </div>
    `;
  }

  generateQuestionList(questions) {
    if (questions.length === 0) {
      return '<p class="no-questions">Tidak ada soal tersedia. Kerjakan beberapa soal terlebih dahulu.</p>';
    }

    return questions.map((q, index) => `
      <div class="question-item" data-index="${index}">
        <input type="checkbox" id="q-${index}" class="question-checkbox">
        <label for="q-${index}" class="question-label">
          <span class="question-number">#${index + 1}</span>
          <span class="question-text">${q.question.substring(0, 100)}...</span>
          <span class="question-category">${q.category || 'General'}</span>
        </label>
      </div>
    `).join('');
  }

  generateSavedQuizzes(quizzes) {
    if (quizzes.length === 0) {
      return '<p class="no-quizzes">Belum ada kuis tersimpan</p>';
    }

    return quizzes.map(quiz => `
      <div class="quiz-card">
        <div class="quiz-card-header">
          <h4>${quiz.name}</h4>
          <div class="quiz-card-actions">
            <button class="btn-icon" onclick="window.customQuizBuilder.playQuiz('${quiz.id}')">
              <i class="fa-solid fa-play"></i>
            </button>
            <button class="btn-icon" onclick="window.customQuizBuilder.shareQuiz('${quiz.id}')">
              <i class="fa-solid fa-share"></i>
            </button>
            <button class="btn-icon btn-danger" onclick="window.customQuizBuilder.deleteQuiz('${quiz.id}')">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
        <p class="quiz-description">${quiz.description}</p>
        <div class="quiz-stats">
          <span><i class="fa-solid fa-question"></i> ${quiz.questions.length} soal</span>
          <span><i class="fa-solid fa-play"></i> ${quiz.timesPlayed}x dimainkan</span>
          <span><i class="fa-solid fa-chart-line"></i> ${quiz.averageScore.toFixed(1)}% rata-rata</span>
        </div>
        <div class="quiz-share-code">
          Kode: <strong>${quiz.shareCode}</strong>
        </div>
      </div>
    `).join('');
  }

  playQuiz(quizId) {
    const data = this.getData();
    const quiz = data.quizzes.find(q => q.id === quizId);
    if (quiz && window.startCustomQuiz) {
      window.startCustomQuiz(quiz);
    }
  }

  shareQuiz(quizId) {
    const data = this.getData();
    const quiz = data.quizzes.find(q => q.id === quizId);
    if (quiz) {
      const shareText = `Coba kuis custom saya: "${quiz.name}"!\nKode: ${quiz.shareCode}\n${quiz.questions.length} soal`;
      
      if (navigator.share) {
        navigator.share({
          title: quiz.name,
          text: shareText
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(shareText).then(() => {
          alert('Kode kuis disalin ke clipboard!');
        });
      }
    }
  }

  getData() {
    return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
  }

  saveData(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }
}

// ========================================
// INITIALIZATION
// ========================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhase3Features);
} else {
  initPhase3Features();
}

function initPhase3Features() {
  window.enhancedAchievements = new EnhancedAchievementSystem();
  window.flashcardMode = new FlashcardMode();
  window.customQuizBuilder = new CustomQuizBuilder();
  
  console.log('✅ Phase 3 Features Initialized!');
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EnhancedAchievementSystem,
    FlashcardMode,
    CustomQuizBuilder
  };
}
