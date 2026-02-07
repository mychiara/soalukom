/**
 * 🔐 FIREBASE CONFIGURATION TEMPLATE
 * 
 * INSTRUKSI:
 * 1. Copy file ini menjadi 'config.js'
 * 2. Ganti semua nilai dengan konfigurasi Firebase Anda
 * 3. Jangan commit file 'config.js' ke repository
 * 
 * File ini aman untuk di-commit sebagai template.
 */

// Firebase Configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Google Apps Script URL for Spreadsheet integration
const GOOGLE_SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";

// Export configuration
window.FIREBASE_CONFIG = firebaseConfig;
window.GOOGLE_SCRIPT_URL = GOOGLE_SCRIPT_URL;

console.log('✅ Firebase configuration loaded');
