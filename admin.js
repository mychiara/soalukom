// File: admin.js

// 1. Impor variabel (auth, db) dari file konfigurasi lokal kita
import { auth, db, serverTimestamp } from './firebase-config.js';

// 2. Impor semua fungsi yang dibutuhkan langsung dari SDK Firebase
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// DOM Elements
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

const STALE_SESSION_THRESHOLD = 5 * 60 * 1000; // 5 menit

// --- Authentication Logic ---
onAuthStateChanged(auth, user => {
    if (user) {
        // User is signed in
        loginView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        adminEmailDisplay.textContent = user.email;
        listenToLicenses(); // Start listening for license data after login
    } else {
        // User is signed out
        loginView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
        licensesTbody.innerHTML = ''; // Clear table on logout
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
        .then((userCredential) => {
            // Signed in
            showMessage(loginMessage, 'Login berhasil!', 'success', 2000);
        })
        .catch((error) => {
            const errorMessage = error.code === 'auth/invalid-credential' 
                ? 'Email atau password salah.' 
                : `Terjadi kesalahan: ${error.message}`;
            showMessage(loginMessage, errorMessage, 'error');
        });
});

logoutButton.addEventListener('click', () => {
    signOut(auth).catch(error => {
        alert('Gagal logout: ' + error.message);
    });
});


// --- Firestore Real-time Listener ---
function listenToLicenses() {
    const licensesCol = collection(db, "licenses");
    onSnapshot(licensesCol, (snapshot) => {
        loadingIndicator.classList.add('hidden');
        if (snapshot.empty) {
            licensesTbody.innerHTML = '<tr><td colspan="5">Belum ada data lisensi.</td></tr>';
            updateStats([]); // Update stats to zero
            return;
        }

        const licensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort: Online users first, then by last seen date
        licensesData.sort((a, b) => {
            const statusA = getLicenseStatus(a);
            const statusB = getLicenseStatus(b);
            if (statusA.order !== statusB.order) {
                return statusA.order - statusB.order;
            }
            const timeA = a.lastSeenAt?.toMillis() || 0;
            const timeB = b.lastSeenAt?.toMillis() || 0;
            return timeB - timeA; // Newest first
        });

        updateStats(licensesData); // [BARU] Panggil fungsi untuk update statistik
        renderTable(licensesData);
    });
}

// --- [BARU] Stats Calculation Logic ---
function updateStats(licenses) {
    let online = 0;
    let idle = 0;
    let offline = 0;
    let disabled = 0;

    licenses.forEach(license => {
        const status = getLicenseStatus(license);
        switch (status.text) {
            case 'Online':
                online++;
                break;
            case 'Idle':
                idle++;
                break;
            case 'Offline':
                offline++;
                break;
            case 'Disabled':
                disabled++;
                break;
        }
    });

    document.getElementById('stats-online-count').textContent = online;
    document.getElementById('stats-idle-count').textContent = idle;
    document.getElementById('stats-offline-count').textContent = offline;
    document.getElementById('stats-disabled-count').textContent = disabled;
    document.getElementById('stats-total-count').textContent = licenses.length;
}


// --- UI Rendering ---
function renderTable(licenses) {
    licensesTbody.innerHTML = '';
    licenses.forEach(license => {
        const row = document.createElement('tr');
        
        const status = getLicenseStatus(license);
        const lastSeen = license.lastSeenAt ? license.lastSeenAt.toDate().toLocaleString('id-ID') : 'Belum Pernah';

        // [DIPERBARUI] Mengganti tombol teks dengan tombol ikon yang lebih modern
        row.innerHTML = `
            <td><span class="status-badge ${status.className}">${status.text}</span></td>
            <td>${license.id}</td>
            <td>${license.userName || '<i>Belum diatur</i>'}</td>
            <td>${lastSeen}</td>
            <td class="action-buttons">
                 <button class="btn btn-warning toggle-active-btn" data-id="${license.id}" data-active="${license.active}" title="${license.active ? 'Nonaktifkan Lisensi' : 'Aktifkan Kembali'}">
                    ${license.active 
                        ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>` 
                        : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>`
                    }
                </button>
                <button class="btn btn-warning reset-session-btn" data-id="${license.id}" title="Reset Sesi" ${!license.activeSessionId ? 'disabled' : ''}>
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0M2.985 19.644A8.25 8.25 0 0114.65 8.006m0 0L11.468 4.823M14.65 8.006V13.5" /></svg>
                </button>
                <button class="btn btn-danger delete-btn" data-id="${license.id}" title="Hapus Lisensi">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                </button>
            </td>
        `;

        licensesTbody.appendChild(row);
    });
    addTableEventListeners();
}

function getLicenseStatus(license) {
    if (!license.active) {
        return { text: 'Disabled', className: 'status-disabled', order: 4 };
    }
    if (license.activeSessionId) {
        const lastSeenMs = license.lastSeenAt?.toMillis() || 0;
        if (Date.now() - lastSeenMs < STALE_SESSION_THRESHOLD) {
            return { text: 'Online', className: 'status-online', order: 1 };
        }
        return { text: 'Idle', className: 'status-idle', order: 2 };
    }
    return { text: 'Offline', className: 'status-offline', order: 3 };
}


// --- Action Button Logic ---
function addTableEventListeners() {
    licensesTbody.querySelectorAll('.toggle-active-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            const id = btn.dataset.id;
            const currentStatus = btn.dataset.active === 'true';
            const docRef = doc(db, "licenses", id);
            try {
                await updateDoc(docRef, { active: !currentStatus });
                console.log(`License ${id} status toggled.`);
            } catch (error) {
                alert(`Gagal mengubah status: ${error.message}`);
            }
        });
    });

    licensesTbody.querySelectorAll('.reset-session-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            const id = btn.dataset.id;
            if (!confirm(`Anda yakin ingin mereset sesi untuk lisensi ${id}? Ini akan memaksa pengguna untuk logout.`)) return;
            
            const docRef = doc(db, "licenses", id);
            try {
                await updateDoc(docRef, {
                    activeSessionId: null,
                    lastSeenAt: serverTimestamp()
                });
                alert(`Sesi untuk lisensi ${id} berhasil direset.`);
            } catch (error) {
                alert(`Gagal mereset sesi: ${error.message}`);
            }
        });
    });

    licensesTbody.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            const id = btn.dataset.id;
            if (!confirm(`PERINGATAN: Anda yakin ingin menghapus lisensi ${id} secara permanen? Aksi ini tidak bisa dibatalkan.`)) return;

            const docRef = doc(db, "licenses", id);
            try {
                await deleteDoc(docRef);
                alert(`Lisensi ${id} berhasil dihapus.`);
            } catch (error) {
                alert(`Gagal menghapus lisensi: ${error.message}`);
            }
        });
    });
}


// --- Add License Logic ---
addLicenseButton.addEventListener('click', async () => {
    const newKey = newLicenseKeyInput.value.trim();
    if (!newKey) {
        showMessage(addLicenseMessage, 'Kode lisensi baru tidak boleh kosong.', 'error');
        return;
    }
    if (newKey.includes('/')) {
        showMessage(addLicenseMessage, "Kode lisensi tidak boleh mengandung karakter '/'.", 'error');
        return;
    }

    addLicenseButton.disabled = true;
    const docRef = doc(db, "licenses", newKey);
    try {
        // Gunakan setDoc untuk membuat dokumen baru.
        await setDoc(docRef, {
            active: true,
            activeSessionId: null,
            lastSeenAt: null,
            userName: null,
            createdAt: serverTimestamp() // Opsional: tambahkan kapan lisensi dibuat
        });
        showMessage(addLicenseMessage, `Lisensi "${newKey}" berhasil ditambahkan.`, 'success', 3000);
        newLicenseKeyInput.value = '';
    } catch (error) {
        showMessage(addLicenseMessage, `Gagal menambahkan lisensi: ${error.message}`, 'error');
    } finally {
        addLicenseButton.disabled = false;
    }
});

// --- Helper Functions ---
function showMessage(element, text, type = 'success', duration = 4000) {
    element.textContent = text;
    element.className = `message ${type}`;
    element.classList.remove('hidden');
    setTimeout(() => {
        element.classList.add('hidden');
    }, duration);
}
