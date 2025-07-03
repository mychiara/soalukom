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

        renderTable(licensesData);
    });
}

// --- UI Rendering ---
function renderTable(licenses) {
    licensesTbody.innerHTML = '';
    licenses.forEach(license => {
        const row = document.createElement('tr');
        
        const status = getLicenseStatus(license);
        const lastSeen = license.lastSeenAt ? license.lastSeenAt.toDate().toLocaleString('id-ID') : 'Belum Pernah';

        row.innerHTML = `
            <td><span class="status-badge ${status.className}">${status.text}</span></td>
            <td>${license.id}</td>
            <td>${license.userName || '<i>Belum diatur</i>'}</td>
            <td>${lastSeen}</td>
            <td class="action-buttons">
                <button class="btn-${license.active ? 'warning' : 'success'} toggle-active-btn" data-id="${license.id}" data-active="${license.active}">
                    ${license.active ? 'Deactivate' : 'Reactivate'}
                </button>
                <button class="btn-primary reset-session-btn" data-id="${license.id}" ${!license.activeSessionId ? 'disabled' : ''}>
                    Reset Sesi
                </button>
                <button class="btn-danger delete-btn" data-id="${license.id}">Hapus</button>
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
            const id = e.target.dataset.id;
            const currentStatus = e.target.dataset.active === 'true';
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
            const id = e.target.dataset.id;
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
            const id = e.target.dataset.id;
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
