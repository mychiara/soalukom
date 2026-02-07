/**
 * 🔐 FIREBASE CONFIGURATION
 * 
 * PENTING: File ini berisi API keys dan harus di-gitignore!
 * Jangan commit file ini ke repository public.
 * 
 * Untuk production, gunakan environment variables atau
 * Firebase Hosting environment configuration.
 */

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDnJvECVfNJIXPh9rZTsA3QcHQaTiE4Awc",
  authDomain: "apodaca-bessie4762.firebaseapp.com",
  projectId: "apodaca-bessie4762",
  storageBucket: "apodaca-bessie4762.firebasestorage.app",
  messagingSenderId: "809433417541",
  appId: "1:809433417541:web:48632b970a90840ab1602c"
};

// Google Apps Script URL for Spreadsheet integration
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx4B8OPZhph17jHyjWjjlRy3TFc4Qa3OWB4jCBKPFdmyNDG4umV-xLGRcfZI7WcNNFBew/exec";

// Export configuration
window.FIREBASE_CONFIG = firebaseConfig;
window.GOOGLE_SCRIPT_URL = GOOGLE_SCRIPT_URL;

console.log('✅ Firebase configuration loaded');
