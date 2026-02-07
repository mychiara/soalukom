// File: firebase-config.js

// Import fungsi inti dari Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Konfigurasi Firebase Anda (loaded from config.js)
// IMPORTANT: Make sure config.js is loaded before this file
const firebaseConfig = window.FIREBASE_CONFIG || {
    apiKey: "PLEASE_CONFIGURE_config.js",
    authDomain: "PLEASE_CONFIGURE_config.js",
    projectId: "PLEASE_CONFIGURE_config.js",
    storageBucket: "PLEASE_CONFIGURE_config.js",
    messagingSenderId: "PLEASE_CONFIGURE_config.js",
    appId: "PLEASE_CONFIGURE_config.js"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Ekspor variabel yang sudah diinisialisasi agar bisa digunakan di file lain
export { auth, db, serverTimestamp };
