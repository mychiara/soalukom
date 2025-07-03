// Import fungsi-fungsi yang diperlukan dari Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getDatabase, ref, onValue, set, get, remove } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// Konfigurasi Firebase Anda (SAMA SEPERTI SEBELUMNYA)
const firebaseConfig = {
    apiKey: "GANTI_DENGAN_API_KEY_ANDA",
    authDomain: "GANTI_DENGAN_AUTH_DOMAIN_ANDA",
    databaseURL: "GANTI_DENGAN_DATABASE_URL_ANDA",
    projectId: "GANTI_DENGAN_PROJECT_ID_ANDA",
    storageBucket: "GANTI_DENGAN_STORAGE_BUCKET_ANDA",
    messagingSenderId: "GANTI_DENGAN_MESSAGING_SENDER_ID_ANDA",
    appId: "GANTI_DENGAN_APP_ID_ANDA"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// --- Elemen DOM ---
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginMessage = document.getElementById('login-message');
const adminEmailDisplay = document.getElementById('admin-email-display');
const licensesTbody = document.getElementById('licenses-tbody');
const loadingIndicator = document.getElementById('loading-indicator');
const addLicenseButton = document.getElementById('add-license-button');
const newLicenseKeyInput = document.getElementById('new-license-key');
const addLicenseMessage = document.getElementById('add-license-message');

// --- Fungsi untuk menampilkan pesan ---
const showMessage = (element, message, isError = true) => {
    element.textContent = message;
    element.className = 'message'; // Reset kelas
    element.classList.add(isError ? 'error' : 'success');
    element.classList.remove('hidden');
    setTimeout(() => {
        element.classList.add('hidden');
    }, 4000);
};

// --- Logika Otentikasi ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Admin ter-login
        loginView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        adminEmailDisplay.textContent = user.email;
        listenToLicenses(); // Mulai mendengarkan perubahan data lisensi
    } else {
        // Admin tidak ter-login
        loginView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
    }
});

loginButton.addEventListener('click', () => {
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
    signInWithEmailAndPassword(auth, email, password)
        .catch((error) => {
            console.error("Login Gagal:", error);
            showMessage(loginMessage, "Login gagal. Periksa kembali email dan password Anda.");
        });
});

logoutButton.addEventListener('click', () => {
    signOut(auth).catch((error) => {
        console.error("Logout Gagal:", error);
        alert("Gagal untuk logout.");
    });
});

/**
 * [BARU & DIPERBAIKI] Fungsi untuk menentukan status lisensi berdasarkan data
 * @param {object} license - Objek data lisensi dari Firebase.
 * @returns {object} - Objek berisi `status` (class CSS) dan `statusText` (teks tampilan).
 */
const determineLicenseStatus = (license) => {
    if (!license.isActive) {
        return { status: 'status-disabled', statusText: 'Nonaktif' };
    }
    if (!license.lastSeen) {
        return { status: 'status-offline', statusText: 'Belum Aktif' };
    }

    const now = new Date().getTime();
    const lastSeenTime = new Date(license.lastSeen).getTime();
    const diffMinutes = (now - lastSeenTime) / (1000 * 60);

    if (diffMinutes <= 5) {
        return { status: 'status-online', statusText: 'Online' };
    } else if (diffMinutes <= 30) {
        return { status: 'status-idle', statusText: 'Idle' };
    } else {
        return { status: 'status-offline', statusText: 'Offline' };
    }
};

/**
 * [DIPERBAIKI] Fungsi untuk menampilkan data lisensi dan MENGHITUNG statistik.
 * @param {object} licenses - Objek berisi semua lisensi dari Firebase.
 */
const displayLicenses = (licenses) => {
    loadingIndicator.classList.add('hidden');
    licensesTbody.innerHTML = ''; // Kosongkan tabel sebelum diisi

    // [BARU] Inisialisasi penghitung statistik
    let onlineCount = 0;
    let idleCount = 0;
    let offlineCount = 0;
    let disabledCount = 0;
    
    const licenseKeys = Object.keys(licenses);
    
    if (licenseKeys.length === 0) {
        licensesTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Belum ada data lisensi.</td></tr>';
    } else {
        licenseKeys.forEach(key => {
            const license = licenses[key];
            const { status, statusText } = determineLicenseStatus(license);

            // [BARU] Lakukan penghitungan berdasarkan status
            switch (status) {
                case 'status-online':
                    onlineCount++;
                    break;
                case 'status-idle':
                    idleCount++;
                    break;
                case 'status-disabled':
                    disabledCount++;
                    break;
                case 'status-offline':
                default:
                    offlineCount++;
                    break;
            }

            const lastSeenFormatted = license.lastSeen ? new Date(license.lastSeen).toLocaleString('id-ID') : '-';
            const row = `
                <tr>
                    <td><span class="status-badge ${status}">${statusText}</span></td>
                    <td>${key}</td>
                    <td>${license.userName || '-'}</td>
                    <td>${lastSeenFormatted}</td>
                    <td>${license.registeredUrl || '-'}</td>
                    <td>${license.loginCount || 0}</td>
                    <td class="action-buttons">
                        <button class="btn btn-warning" title="Reset Lisensi" data-key="${key}">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0M2.985 19.644A8.25 8.25 0 0114.65 8.006m0 0L11.468 4.823M14.65 8.006V13.5" /></svg>
                        </button>
                        <button class="btn btn-danger" title="Hapus Lisensi" data-key="${key}">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                    </td>
                </tr>
            `;
            licensesTbody.innerHTML += row;
        });
    }

    // [BARU] Update tampilan kartu statistik setelah selesai menghitung
    document.getElementById('stats-online-count').textContent = onlineCount;
    document.getElementById('stats-idle-count').textContent = idleCount;
    document.getElementById('stats-offline-count').textContent = offlineCount;
    document.getElementById('stats-disabled-count').textContent = disabledCount;
    document.getElementById('stats-total-count').textContent = licenseKeys.length;
};

// --- Manajemen Lisensi ---
const listenToLicenses = () => {
    const licensesRef = ref(db, 'licenses/');
    onValue(licensesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            displayLicenses(data);
        } else {
            loadingIndicator.textContent = "Belum ada data lisensi.";
            licensesTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Belum ada data lisensi.</td></tr>';
            // [BARU] Pastikan statistik juga di-reset jika tidak ada data
            document.getElementById('stats-online-count').textContent = 0;
            document.getElementById('stats-idle-count').textContent = 0;
            document.getElementById('stats-offline-count').textContent = 0;
            document.getElementById('stats-disabled-count').textContent = 0;
            document.getElementById('stats-total-count').textContent = 0;
        }
    }, (error) => {
        console.error("Gagal membaca data:", error);
        loadingIndicator.textContent = "Gagal memuat data. Cek konsol untuk detail.";
    });
};

// Tambah Lisensi Baru
addLicenseButton.addEventListener('click', async () => {
    const newKey = newLicenseKeyInput.value.trim().toUpperCase();
    if (!newKey) {
        showMessage(addLicenseMessage, "Kode lisensi tidak boleh kosong.");
        return;
    }

    const licenseRef = ref(db, `licenses/${newKey}`);
    try {
        const snapshot = await get(licenseRef);
        if (snapshot.exists()) {
            showMessage(addLicenseMessage, "Lisensi dengan kode ini sudah ada.");
        } else {
            await set(licenseRef, {
                isActive: true,
                createdAt: new Date().toISOString()
            });
            showMessage(addLicenseMessage, "Lisensi baru berhasil ditambahkan.", false);
            newLicenseKeyInput.value = '';
        }
    } catch (error) {
        console.error("Gagal menambah lisensi:", error);
        showMessage(addLicenseMessage, "Terjadi kesalahan saat menambah lisensi.");
    }
});

// Aksi pada tabel (Reset & Hapus)
licensesTbody.addEventListener('click', async (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    const key = button.dataset.key;
    if (!key) return;

    if (button.classList.contains('btn-danger')) { // Tombol Hapus
        if (confirm(`Apakah Anda yakin ingin MENGHAPUS lisensi "${key}" secara permanen?`)) {
            try {
                await remove(ref(db, `licenses/${key}`));
                alert(`Lisensi "${key}" berhasil dihapus.`);
            } catch (error) {
                console.error("Gagal menghapus lisensi:", error);
                alert("Gagal menghapus lisensi.");
            }
        }
    } else if (button.classList.contains('btn-warning')) { // Tombol Reset
        if (confirm(`Apakah Anda yakin ingin MERESET lisensi "${key}"? Ini akan menghapus data pengguna dan URL yang terdaftar.`)) {
            const licenseRef = ref(db, `licenses/${key}`);
            try {
                // Ambil data `createdAt` agar tidak hilang
                const snapshot = await get(licenseRef);
                const createdAt = snapshot.val()?.createdAt || new Date().toISOString();
                
                await set(licenseRef, {
                    isActive: true,
                    createdAt: createdAt // Pertahankan tanggal pembuatan
                    // Data lain seperti userName, registeredUrl, dll akan terhapus
                });
                alert(`Lisensi "${key}" berhasil direset.`);
            } catch (error) {
                console.error("Gagal mereset lisensi:", error);
                alert("Gagal mereset lisensi.");
            }
        }
    }
});
