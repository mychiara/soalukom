import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, setDoc, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDnJvECVfNJIXPh9rZTsA3QcHQaTiE4Awc", // GANTI DENGAN API KEY ANDA
    authDomain: "apodaca-bessie4762.firebaseapp.com", // GANTI DENGAN AUTH DOMAIN ANDA
    projectId: "apodaca-bessie4762", // GANTI DENGAN PROJECT ID ANDA
    storageBucket: "apodaca-bessie4762.firebasestorage.app", // GANTI DENGAN STORAGE BUCKET ANDA
    messagingSenderId: "809433417541", // GANTI DENGAN MESSAGING SENDER ID ANDA
    appId: "1:809433417541:web:48632b970a90840ab1602c" // GANTI DENGAN APP ID ANDA
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const historyView = document.getElementById('history-view');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const loginMessage = document.getElementById('login-message');
const adminEmailDisplay = document.getElementById('admin-email-display');
const licensesTbody = document.getElementById('licenses-tbody');
const loadingIndicator = document.getElementById('loading-indicator');
const addLicenseButton = document.getElementById('add-license-button');
const newLicenseKeyInput = document.getElementById('new-license-key');
const addLicenseMessage = document.getElementById('add-license-message');
const backToDashboardButton = document.getElementById('back-to-dashboard-button');
const historyTbody = document.getElementById('history-tbody');
const historyLoadingIndicator = document.getElementById('history-loading-indicator');
const historyViewTitle = document.getElementById('history-view-title');

// DOM Elements untuk Ringkasan (BARU)
const totalCountEl = document.getElementById('total-count');
const onlineCountEl = document.getElementById('online-count');
const idleCountEl = document.getElementById('idle-count');
const offlineCountEl = document.getElementById('offline-count');
const disabledCountEl = document.getElementById('disabled-count');


let licensesUnsubscribe = null;

// --- AUTHENTICATION ---
onAuthStateChanged(auth, user => {
    if (user) {
        // User is signed in
        loginView.classList.add('hidden');
        historyView.classList.add('hidden'); // Sembunyikan history view saat login
        dashboardView.classList.remove('hidden');
        adminEmailDisplay.textContent = user.email;
        listenToLicenses();
    } else {
        // User is signed out
        loginView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
        historyView.classList.add('hidden'); // Sembunyikan history view saat logout
        if (licensesUnsubscribe) licensesUnsubscribe();
    }
});

loginButton.addEventListener('click', () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    signInWithEmailAndPassword(auth, email, password)
        .catch(error => {
            loginMessage.textContent = `Login Gagal: ${error.message}`;
            loginMessage.classList.remove('hidden', 'success');
            loginMessage.classList.add('error');
        });
});

logoutButton.addEventListener('click', () => {
    signOut(auth);
});

// --- LICENSE MANAGEMENT (DIPERBARUI) ---
function listenToLicenses() {
    loadingIndicator.style.display = 'block';
    const q = collection(db, "licenses");
    licensesUnsubscribe = onSnapshot(q, (querySnapshot) => {
        // Reset tabel dan hitungan
        licensesTbody.innerHTML = '';
        let onlineCount = 0, idleCount = 0, offlineCount = 0, disabledCount = 0;
        const STALE_SESSION_THRESHOLD = 5 * 60 * 1000; // 5 menit

        if (querySnapshot.empty) {
            licensesTbody.innerHTML = '<tr><td colspan="5">Tidak ada lisensi ditemukan.</td></tr>';
        } else {
            querySnapshot.forEach(doc => {
                const data = doc.data();
                const { active, activeSessionId, lastSeenAt } = data;

                // --- Logika Penghitungan Status (BARU) ---
                if (active) {
                    if (activeSessionId) {
                        const lastSeenDate = lastSeenAt ? lastSeenAt.toDate() : null;
                        if (lastSeenDate && (new Date().getTime() - lastSeenDate.getTime()) < STALE_SESSION_THRESHOLD) {
                            onlineCount++;
                        } else {
                            idleCount++;
                        }
                    } else {
                        offlineCount++;
                    }
                } else {
                    disabledCount++;
                }

                // Tampilkan lisensi di tabel (logika yang sudah ada)
                displayLicense(doc.id, data);
            });
        }
        
        // --- Perbarui Tampilan Ringkasan (BARU) ---
        totalCountEl.textContent = querySnapshot.size;
        onlineCountEl.textContent = onlineCount;
        idleCountEl.textContent = idleCount;
        offlineCountEl.textContent = offlineCount;
        disabledCountEl.textContent = disabledCount;

        loadingIndicator.style.display = 'none';
    }, (error) => {
        console.error("Error listening to licenses: ", error);
        loadingIndicator.textContent = "Gagal memuat data.";
    });
}

function displayLicense(id, data) {
    const row = document.createElement('tr');
    const { active, activeSessionId, lastSeenAt, userName } = data;
    
    // Status Logic
    let statusText = 'Tidak Aktif';
    let statusClass = 'status-disabled';
    const STALE_SESSION_THRESHOLD = 5 * 60 * 1000; // 5 minutes
    if (active) {
        if (activeSessionId) {
            const lastSeenDate = lastSeenAt ? lastSeenAt.toDate() : null;
            if (lastSeenDate && (new Date().getTime() - lastSeenDate.getTime()) < STALE_SESSION_THRESHOLD) {
                statusText = 'Online';
                statusClass = 'status-online';
            } else {
                statusText = 'Idle';
                statusClass = 'status-idle';
            }
        } else {
            statusText = 'Aktif (Offline)';
            statusClass = 'status-offline';
        }
    }

    const lastSeenString = lastSeenAt ? lastSeenAt.toDate().toLocaleString('id-ID') : 'Belum pernah';
    
    row.innerHTML = `
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${id}</td>
        <td>${userName || 'Belum diisi'}</td>
        <td>${lastSeenString}</td>
        <td class="action-buttons">
            <button class="btn-warning reset-session-btn" data-id="${id}">Reset Sesi</button>
            <button class="${active ? 'btn-danger' : 'btn-success'} toggle-active-btn" data-id="${id}">${active ? 'Nonaktifkan' : 'Aktifkan'}</button>
            <button class="btn-info view-history-btn" data-id="${id}" data-username="${userName || id}">Lihat Riwayat</button>
        </td>
    `;
    licensesTbody.appendChild(row);
}

// Event Delegation for action buttons
licensesTbody.addEventListener('click', async (e) => {
    const target = e.target;
    const id = target.dataset.id;
    if (!id) return;

    if (target.classList.contains('toggle-active-btn')) {
        const docRef = doc(db, "licenses", id);
        const currentActiveState = target.textContent.includes('Nonaktifkan');
        await updateDoc(docRef, { active: !currentActiveState });
    } else if (target.classList.contains('reset-session-btn')) {
        if (confirm(`Anda yakin ingin mereset sesi untuk lisensi ${id}?`)) {
            const docRef = doc(db, "licenses", id);
            await updateDoc(docRef, { activeSessionId: null });
        }
    } else if (target.classList.contains('view-history-btn')) {
        const username = target.dataset.username;
        viewUserHistory(id, username);
    }
});

addLicenseButton.addEventListener('click', async () => {
    const newKey = newLicenseKeyInput.value.trim();
    if (!newKey) {
        alert("Kode lisensi tidak boleh kosong.");
        return;
    }
    try {
        await setDoc(doc(db, "licenses", newKey), {
            active: true,
            activeSessionId: null,
            lastSeenAt: null,
            userName: null,
            createdAt: new Date()
        });
        addLicenseMessage.textContent = `Lisensi "${newKey}" berhasil ditambahkan.`;
        addLicenseMessage.className = 'message success';
        newLicenseKeyInput.value = '';
    } catch (error) {
        addLicenseMessage.textContent = `Gagal menambahkan: ${error.message}`;
        addLicenseMessage.className = 'message error';
    }
    addLicenseMessage.classList.remove('hidden');
});

// --- USER HISTORY (BARU) ---
async function viewUserHistory(licenseId, username) {
    dashboardView.classList.add('hidden');
    historyView.classList.remove('hidden');
    historyViewTitle.textContent = `Riwayat Kuis untuk: ${username}`;
    historyTbody.innerHTML = '';
    historyLoadingIndicator.style.display = 'block';

    try {
        const historyRef = collection(db, "quiz_history");
        const q = query(historyRef, where("licenseKey", "==", licenseId), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            historyTbody.innerHTML = '<tr><td colspan="3">Tidak ada riwayat kuis untuk pengguna ini.</td></tr>';
        } else {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const row = document.createElement('tr');
                const date = data.date ? data.date.toDate().toLocaleString('id-ID') : 'N/A';
                row.innerHTML = `
                    <td>${date}</td>
                    <td>${data.quizName || 'N/A'}</td>
                    <td>${data.score} / ${data.totalQuestions}</td>
                `;
                historyTbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error("Error getting user history: ", error);
        historyTbody.innerHTML = `<tr><td colspan="3">Gagal memuat riwayat: ${error.message}</td></tr>`;
    } finally {
        historyLoadingIndicator.style.display = 'none';
    }
}

backToDashboardButton.addEventListener('click', () => {
    historyView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
});
