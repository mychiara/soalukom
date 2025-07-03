// File: firebase-config.js

// Import fungsi inti dari Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Konfigurasi Firebase Anda (SAMA DENGAN DI index.html)
const firebaseConfig = {
    apiKey: "AIzaSyDnJvECVfNJIXPh9rZTsA3QcHQaTiE4Awc",
    authDomain: "apodaca-bessie4762.firebaseapp.com",
    projectId: "apodaca-bessie4762",
    storageBucket: "apodaca-bessie4762.firebasestorage.app",
    messagingSenderId: "809433417541",
    appId: "1:809433417541:web:48632b970a90840ab1602c"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Ekspor variabel yang sudah diinisialisasi agar bisa digunakan di file lain
export { auth, db, serverTimestamp };
