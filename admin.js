// File: admin.js

// 1. Impor dari file konfigurasi dan SDK Firebase
import { auth, db } from './firebase-config.js';
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
const newLicenseKeyInput = document.getElementById('new-license-key');
const addLicenseButton = document.getElementById('add-license-button');
const addLicenseMessage = document.getElementById('add-license-message');

// Thresholds
const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 menit
const OFFLINE_THRESHOLD = 30 * 60 * 1000; // 30 menit

// --- Authentication Logic ---
onAuthStateChanged(auth, user => {
    if (user) {
        console.log("Admin terautentikasi:", user.email);
        loginView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        adminEmailDisplay.textContent = user.email;
        listenToLicenses();
        setupEventListeners();
    } else {
        console.log("Admin tidak terautentikasi.");
        loginView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
        licensesTbody.innerHTML = '';
        updateStats(0, 0, 0, 0, 0); // Reset statistik saat logout
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
    console.log("Mulai mendengarkan perubahan pada koleksi 'licenses'...");
    const licensesCol = collection(db, "licenses");
    onSnapshot(licensesCol, (snapshot) => {
        // [DEBUG] Log ini akan muncul jika security rules BENAR
        console.log(`Snapshot diterima dengan ${snapshot.size} dokumen.`);
        loadingIndicator.classList.add('hidden'); // Sembunyikan loading setelah data diterima
        
        const licensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        processAndRenderData(licensesData);
        
    }, (error) => {
        // [DEBUG] Log ini akan muncul jika ada error selain security rules
        console.error("Firestore snapshot error:", error);
        loadingIndicator.textContent = "Gagal memuat data. Periksa konsol untuk detail.";
    });
}

// --- Data Processing & Rendering ---
function processAndRenderData(licenses) {
    let onlineCount = 0, idleCount = 0, offlineCount = 0, disabledCount = 0;

    if (licenses.length === 0) {
        licensesTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Belum ada data lisensi.</td></tr>';
        updateStats(0, 0, 0, 0, 0);
        return;
    }

    // Gabungkan data dengan statusnya untuk sorting
    const licensesWithStatus = licenses.map(license => ({
        ...license,
        status: getLicenseStatus(license)
    }));
    
    // Urutkan data
    licensesWithStatus.sort((a, b) => {
        if (a.status.order !== b.status.order) {
            return a.status.order - b.status.order;
        }
        const timeA = a.lastSeenAt?.toMillis() || 0;
        const timeB = b.lastSeenAt?.toMillis() || 0;
        return timeB - timeA;
    });
    
    licensesTbody.innerHTML = '';

    licensesWithStatus.forEach(license => {
        // Hitung statistik
        switch(license.status.className) {
            case 'status-online': onlineCount++; break;
            case 'status-idle': idleCount++; break;
            case 'status-offline': offlineCount++; break;
            case 'status-disabled': disabledCount++; break;
        }

        const lastSeen = license.lastSeenAt ? license.lastSeenAt.toDate().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
        const registeredUrlDisplay = license.registeredUrl ? `<a href="${license.registeredUrl}" target="_blank" rel="noopener noreferrer" title="${license.registeredUrl}">${license.registeredUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]}</a>` : '-';
        
        const row = `
            <tr>
                <td><span class="status-badge ${license.status.className}">${license.status.text}</span></td>
                <td>${license.id}</td>
                <td>${license.userName || '-'}</td>
                <td>${lastSeen}</td>
                <td>${registeredUrlDisplay}</td>
                <td>${license.loginCount || 0}</td>
                <td class="action-buttons">
                    <button class="btn btn-warning reset-btn" title="Reset Lisensi (hapus pengguna & URL, aktifkan kembali)" data-id="${license.id}">
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

    updateStats(onlineCount, idleCount, offlineCount, disabledCount, licenses.length);
}

function getLicenseStatus(license) {
    if (license.isActive === false) {
        return { text: 'Nonaktif', className: 'status-disabled', order: 4 };
    }
    if (!license.lastSeenAt) {
        return { text: 'Offline', className: 'status-offline', order: 3 };
    }
    const timeDiff = Date.now() - license.lastSeenAt.toMillis();
    if (timeDiff < IDLE_THRESHOLD) {
        return { text: 'Online', className: 'status-online', order: 1 };
    } else if (timeDiff < OFFLINE_THRESHOLD) {
        return { text: 'Idle', className: 'status-idle', order: 2 };
    } else {
        return { text: 'Offline', className: 'status-offline', order: 3 };
    }
}

function updateStats(online, idle, offline, disabled, total) {
    document.getElementById('stats-online-count').textContent = online;
    document.getElementById('stats-idle-count').textContent = idle;
    document.getElementById('stats-offline-count').textContent = offline;
    document.getElementById('stats-disabled-count').textContent = disabled;
    document.getElementById('stats-total-count').textContent = total;
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    licensesTbody.addEventListener('click', async (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        const id = button.dataset.id;
        if (!id) return;

        if (button.classList.contains('delete-btn')) {
            if (!confirm(`PERINGATAN: Anda yakin ingin menghapus lisensi "${id}" secara PERMANEN?`)) return;
            try {
                await deleteDoc(doc(db, "licenses", id));
                alert(`Lisensi "${id}" berhasil dihapus.`);
            } catch (error) {
                alert(`Gagal menghapus lisensi: ${error.message}`);
                console.error("Delete Error:", error);
            }
        }

        if (button.classList.contains('reset-btn')) {
            if (!confirm(`Anda yakin ingin MERESET lisensi "${id}"? Ini akan menghapus Nama Pengguna dan URL, lalu mengaktifkan lisensinya.`)) return;
            try {
                const docRef = doc(db, "licenses", id);
                await updateDoc(docRef, {
                    isActive: true,
                    userName: null,
                    registeredUrl: null,
                    activeSessionId: null,
                    lastSeenAt: null,
                });
                alert(`Lisensi "${id}" berhasil direset.`);
            } catch (error) {
                alert(`Gagal mereset lisensi: ${error.message}`);
                console.error("Reset Error:", error);
            }
        }
    });

    addLicenseButton.addEventListener('click', handleAddLicense);
}

async function handleAddLicense() {
    const newKey = newLicenseKeyInput.value.trim().toUpperCase();
    if (!newKey) {
        showMessage(addLicenseMessage, 'Kode lisensi tidak boleh kosong.', 'error');
        return;
    }
    addLicenseButton.disabled = true;
    try {
        const docRef = doc(db, "licenses", newKey);
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
        showMessage(addLicenseMessage, `Lisensi "${newKey}" berhasil ditambahkan.`, 'success');
        newLicenseKeyInput.value = '';
    } catch (error) {
        showMessage(addLicenseMessage, `Gagal menambahkan lisensi: ${error.message}`, 'error');
    } finally {
        addLicenseButton.disabled = false;
    }
}

function showMessage(element, text, type = 'success', duration = 4000) {
    element.textContent = text;
    element.className = `message ${type}`;
    element.classList.remove('hidden');
    setTimeout(() => {
        element.classList.add('hidden');
    }, duration);
}
