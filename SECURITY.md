# 🔐 SECURITY & CONFIGURATION GUIDE

## ⚠️ IMPORTANT: API Key Security

API keys dan credentials **TIDAK BOLEH** di-commit ke repository public!

## 📋 Setup Instructions

### 1. **Configure Firebase**

1. Copy `config.template.js` menjadi `config.js`:

   ```bash
   copy config.template.js config.js
   ```

2. Edit `config.js` dan ganti semua placeholder dengan nilai sebenarnya:

   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_ACTUAL_API_KEY",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.firebasestorage.app",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef123456",
   };
   ```

3. Ganti juga `GOOGLE_SCRIPT_URL` dengan URL Apps Script Anda

### 2. **Verify .gitignore**

Pastikan file `.gitignore` sudah ada dan berisi:

```
# Firebase Configuration (contains API keys)
config.js
```

### 3. **Test Configuration**

1. Buka aplikasi di browser
2. Buka Developer Console (F12)
3. Cek apakah ada pesan: `✅ Firebase configuration loaded`
4. Jika ada error, periksa `config.js`

## 🔒 Security Best Practices

### ✅ **DO:**

- ✅ Gunakan `config.js` untuk menyimpan API keys
- ✅ Tambahkan `config.js` ke `.gitignore`
- ✅ Commit `config.template.js` sebagai template
- ✅ Gunakan Firebase Security Rules untuk production
- ✅ Rotate API keys secara berkala

### ❌ **DON'T:**

- ❌ Jangan commit `config.js` ke repository
- ❌ Jangan share API keys di chat/email
- ❌ Jangan hardcode API keys di source code
- ❌ Jangan expose API keys di client-side tanpa restrictions

## 🚀 Production Deployment

### Option 1: Firebase Hosting (Recommended)

Firebase Hosting mendukung environment configuration:

1. Install Firebase CLI:

   ```bash
   npm install -g firebase-tools
   ```

2. Login:

   ```bash
   firebase login
   ```

3. Initialize:

   ```bash
   firebase init hosting
   ```

4. Deploy:
   ```bash
   firebase deploy
   ```

### Option 2: Static Hosting

Jika menggunakan hosting lain (Netlify, Vercel, dll):

1. Upload semua files KECUALI `config.js`
2. Buat `config.js` langsung di server
3. Atau gunakan environment variables jika didukung

## 🔐 Firebase Security Rules

Tambahkan security rules di Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Licenses collection - read only for authenticated users
    match /licenses/{licenseId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admin can write
    }

    // User data - only owner can read/write
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 📱 PWA Configuration

### Service Worker

Service worker (`sw.js`) akan cache static assets. Pastikan:

- ✅ `config.js` TIDAK di-cache (sudah di-exclude)
- ✅ Update version number saat deploy baru

### Manifest

File `manifest.json` sudah dikonfigurasi dengan benar.

## 🐛 Troubleshooting

### Error: "PLEASE_CONFIGURE_config.js"

**Solusi:**

1. Pastikan `config.js` ada
2. Pastikan `config.js` di-load sebelum `script.js`
3. Cek console untuk error loading

### Error: "Firebase: Error (auth/api-key-not-valid)"

**Solusi:**

1. Periksa API key di `config.js`
2. Pastikan API key aktif di Firebase Console
3. Periksa API key restrictions

### Error: "Failed to load config.js"

**Solusi:**

1. Pastikan path benar: `/config.js` atau `./config.js`
2. Cek file permissions
3. Cek browser console untuk details

## 📞 Support

Jika ada masalah:

1. Cek console browser untuk error messages
2. Verifikasi Firebase configuration
3. Test dengan config.template.js terlebih dahulu

## 🔄 Updating Configuration

Jika perlu update config:

1. Edit `config.js` (JANGAN commit!)
2. Update `config.template.js` jika ada field baru (commit ini)
3. Dokumentasikan perubahan

## ✅ Checklist Deployment

Sebelum deploy ke production:

- [ ] `config.js` sudah dikonfigurasi dengan benar
- [ ] `config.js` ada di `.gitignore`
- [ ] Firebase Security Rules sudah diset
- [ ] API key restrictions sudah diset (optional tapi recommended)
- [ ] Service Worker version sudah di-update
- [ ] Test di local environment
- [ ] Test di staging environment (jika ada)
- [ ] Backup configuration

---

**Last Updated:** 2026-02-07  
**Version:** 1.0.0
