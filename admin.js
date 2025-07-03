// File: admin.js

// 1. Impor variabel (auth, db) dan fungsi serverTimestamp dari file konfigurasi lokal kita
import { auth, db } from './firebase-config.js';
// serverTimestamp tidak digunakan di file ini, jadi bisa dihapus jika tidak ada di firebase-config.js
// Jika ada, biarkan saja.

// 2. Impor semua fungsi yang dibutuhkan langsung dari SDK Firebase
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { collection, onSnapshot, doc, getDoc, updateDoc, setDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// --- DOM Elements ---
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginButton = document.getElementById('login-button');
const loginMessage = document.getElementById('login-message');
const logoutButton = document.getElementById('logout-button');
const adminEmailDisplay = document.getElementById('admin-email-display');
const licensesTbody = document.getElementById('licenses-tbody');
const loadingIndicator = document.getElementById('loading-indicator');

// Add License Elements
const newLicenseKeyInput = document.getElementById('new-license-key');
const addLicenseButton = document.getElementById('add-license-button');
const addLicenseMessage = document.getElementById('add-license-message');

// Thresholds
const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 menit
const OFFLINE_THRESHOLD = 30 * 60 * 1000; // 30 menit

// --- Authentication Logic ---
onAuthStateChanged(auth, user => {
    if (user) {
        loginView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        adminEmailDisplay.textContent = user.email;
        listenToLicenses(); // Mulai mendengarkan data setelah login
        setupEventListeners(); // Atur event listener utama sekali saja
    } else {
        loginView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
        licensesTbody.innerHTML = ''; // Kosongkan tabel saat logout
        updateStats(0, 0, 0, 0, 0); // Reset statistik
    }
});

loginButton.addEventListener('click', () => {
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
    if (!email || !password) {
        showMessage(loginMessage, 'Email dan password tidak boleh kosong.', 'error');
        return;
    }
    signInWithEmailAndPassword(auth, email, password)
        .catch((error) => {
            const errorMessage = error.code === 'auth/invalid-credential' 
                ? 'Email atau password salah.' 
                : 'Terjadi kesalahan saat login.';
            showMessage(loginMessage, errorMessage, 'error');
            console.error("Login Error:", error);
        });
});

logoutButton.addEventListener('click', () => {
    signOut(auth).catch(error => alert('Gagal logout: ' + error.message));
});


// --- Firestore Real-time Listener ---
function listenToLicenses() {
    const licensesCol = collection(db, "licenses");
    onSnapshot(licensesCol, (snapshot) => {
        loadingIndicator.classList.add('hidden');
        
        const licensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // [DIPERBAIKI] Proses data untuk rendering dan perhitungan statistik
        processAndRenderData(licensesData);
        
    }, (error) => {
        console.error("Firestore snapshot error:", error);
        loadingIndicator.textContent = "Gagal memuat data. Lihat konsol untuk detail.";
    });
}

// --- [BARU] Fungsi terpusat untuk memproses data, menghitung statistik, dan me-render tabel ---
function processAndRenderData(licenses) {
    // Inisialisasi penghitung statistik
    let onlineCount = 0, idleCount = 0, offlineCount = 0, disabledCount = 0;

    if (licenses.length === 0) {
        licensesTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Belum ada data lisensi.</td></tr>';
        updateStats(0, 0, 0, 0, 0); // Reset stats jika tidak ada data
        return;
    }

    // Urutkan data: Online dulu, lalu idle, offline, dan disabled. Di dalam tiap grup, urutkan berdasarkan lastSeen terbaru.
    licenses.sort((a, b) => {
        const statusA = getLicenseStatus(a);
        const statusB = getLicenseStatus(b);
        if (statusA.order !== statusB.order) {
            return statusA.order - statusB.order;
        }
        const timeA = a.lastSeenAt?.toMillis() || 0;
        const timeB = b.lastSeenAt?.toMillis() || 0;
        return timeB - timeA; // Terbaru di atas
    });
    
    // Kosongkan tabel sebelum render
    licensesTbody.innerHTML = '';

    // Loop untuk render baris dan menghitung statistik
    licenses.forEach(license => {
        const status = getLicenseStatus(license);

        // Hitung statistik berdasarkan status
        switch(status.className) {
            case 'status-online': onlineCount++; break;
            case 'status-idle': idleCount++; break;
            case 'status-offline': offlineCount++; break;
            case 'status-disabled': disabledCount++; break;
        }

        const lastSeen = license.lastSeenAt ? license.lastSeenAt.toDate().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
        const registeredUrlDisplay = license.registeredUrl ? `<a href="${license.registeredUrl}" target="_blank" rel="noopener noreferrer" title="${license.registeredUrl}">${license.registeredUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]}</a>` : '-';

        // [DIPERBAIKI] Render baris dengan tombol ikon yang baru
        const row = `
            <tr>
                <td><span class="status-badge ${status.className}">${status.text}</span></td>
                <td>${license.id}</td>
                <td>${license.userName || '<i>-</i>'}</td>
                <td>${lastSeen}</td>
                <td>${registeredUrlDisplay}</td>
                <td>${license.loginCount || 0}</td>
                <td class="action-buttons">
                    <button class="btn btn-warning reset-btn" title="Reset Lisensi (hapus pengguna & URL)" data-id="${license.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0M2.985 19.644A8.25 8.25 0 0114.65 8.006m0 0L11.468 4.823M14.65 8.006V13.5" /></svg>
                    </button>
                    <button class="btn btn-danger delete-btn" title="Hapus Lisensi Permanen" data-id="${license.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                    </button>
                </td>
            </tr>
        `;
        licensesTbody.innerHTML += row;
    });

    // Perbarui kartu statistik dengan data yang sudah dihitung
    updateStats(onlineCount, idleCount, offlineCount, disabledCount, licenses.length);
}

// [DIPERBAIKI] Fungsi untuk mendapatkan status lisensi dengan definisi yang lebih jelas
function getLicenseStatus(license) {
    // Nonaktif (Disabled) adalah prioritas tertinggi
    if (license.isActive === false) {
        return { text: 'Nonaktif', className: 'status-disabled', order: 4 };
    }
    
    // Jika tidak ada lastSeen, berarti belum pernah dipakai
    if (!license.lastSeenAt) {
        return { text: 'Offline', className: 'status-offline', order: 3 };
    }

    const lastSeenMs = license.lastSeenAt.toMillis();
    const now = Date.now();
    const timeDiff = now - lastSeenMs;

    if (timeDiff < IDLE_THRESHOLD) { // Kurang dari 5 menit
        return { text: 'Online', className: 'status-online', order: 1 };
    } else if (timeDiff < OFFLINE_THRESHOLD) { // Antara 5 dan 30 menit
        return { text: 'Idle', className: 'status-idle', order: 2 };
    } else { // Lebih dari 30 menit
        return { text: 'Offline', className: 'status-offline', order: 3 };
    }
}

// [BARU] Fungsi untuk memperbarui DOM kartu statistik
function updateStats(online, idle, offline, disabled, total) {
    document.getElementById('stats-online-count').textContent = online;
    document.getElementById('stats-idle-count').textContent = idle;
    document.getElementById('stats-offline-count').textContent = offline;
    document.getElementById('stats-disabled-count').textContent = disabled;
    document.getElementById('stats-total-count').textContent = total;
}


// [DIPERBAIKI & LEBIH EFISIEN] Event Listener Terpusat untuk semua aksi
function setupEventListeners() {
    // Event listener untuk tombol di tabel (Reset, Hapus)
    licensesTbody.addEventListener('click', async (e) => {
        const button = e.target.closest('button');
        if (!button) return; // Keluar jika yang diklik bukan tombol

        const id = button.dataset.id;
        if (!id) return;

        // Aksi Hapus Lisensi
        if (button.classList.contains('delete-btn')) {
            if (!confirm(`PERINGATAN: Anda yakin ingin menghapus lisensi "${id}" secara PERMANEN? Aksi ini tidak bisa dibatalkan.`)) return;
            try {
                await deleteDoc(doc(db, "licenses", id));
                alert(`Lisensi "${id}" berhasil dihapus.`);
            } catch (error) {
                alert(`Gagal menghapus lisensi: ${error.message}`);
                console.error("Delete Error:", error);
            }
        }

        // Aksi Reset Lisensi
        if (button.classList.contains('reset-btn')) {
            if (!confirm(`Anda yakin ingin MERESET lisensi "${id}"? Ini akan menghapus Nama Pengguna dan URL Terdaftar, mengaktifkan kembali lisensinya jika nonaktif.`)) return;
            const docRef = doc(db, "licenses", id);
            try {
                // Ambil data `createdAt` dan `loginCount` agar tidak hilang saat reset
                const docSnap = await getDoc(docRef);
                const existingData = docSnap.data();

                await updateDoc(docRef, {
                    isActive: true, // Selalu aktifkan saat reset
                    userName: null,
                    registeredUrl: null,
                    activeSessionId: null, // Reset sesi aktif
                    lastSeenAt: null, // Reset last seen
                    // Pertahankan:
                    // createdAt: existingData.createdAt || serverTimestamp(), // Firestore V9 tidak bisa update serverTimestamp, lebih baik biarkan
                    loginCount: existingData.loginCount || 0,
                });
                alert(`Lisensi "${id}" berhasil direset.`);
            } catch (error) {
                alert(`Gagal mereset lisensi: ${error.message}`);
                console.error("Reset Error:", error);
            }
        }
    });

    // Event listener untuk form tambah lisensi
    addLicenseButton.addEventListener('click', handleAddLicense);
}

async function handleAddLicense() {
    const newKey = newLicenseKeyInput.value.trim().toUpperCase(); // Konsisten huruf besar
    if (!newKey) {
        showMessage(addLicenseMessage, 'Kode lisensi tidak boleh kosong.', 'error');
        return;
    }
    if (newKey.includes('/')) {
        showMessage(addLicenseMessage, "Kode lisensi tidak boleh mengandung karakter '/'.", 'error');
        return;
    }

    addLicenseButton.disabled = true;
    const docRef = doc(db, "licenses", newKey);

    try {
        const docSnap = await getDoc(docRef);
        if(docSnap.exists()) {
            showMessage(addLicenseMessage, `Lisensi dengan kode "${newKey}" sudah ada.`, 'error');
            return;
        }

        await setDoc(docRef, {
            isActive: true,
            createdAt: serverTimestamp(),
            loginCount: 0,
            userName: null,
            registeredUrl: null,
            activeSessionId: null,
            lastSeenAt: null,
        });
        showMessage(addLicenseMessage, `Lisensi "${newKey}" berhasil ditambahkan.`, 'success', 3000);
        newLicenseKeyInput.value = '';
    } catch (error) {
        showMessage(addLicenseMessage, `Gagal menambahkan lisensi: ${error.message}`, 'error');
        console.error("Add License Error:", error);
    } finally {
        addLicenseButton.disabled = false;
    }
}


// --- Helper Functions ---
function showMessage(element, text, type = 'success', duration = 4000) {
    element.textContent = text;
    element.className = `message ${type}`;
    element.classList.remove('hidden');
    setTimeout(() => {
        element.classList.add('hidden');
    }, duration);
}
