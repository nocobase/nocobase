---
pkg: "@nocobase/plugin-email-manager"
title: "Alur Konfigurasi Email"
description: "Alur konfigurasi: dapatkan Client ID/Secret dari provider, redirect URI, konfigurasi email service provider, otorisasi login OAuth, integrasi email, sinkronisasi data."
keywords: "konfigurasi email,Client ID,Client Secret,OAuth,NocoBase"
---
# Alur Konfigurasi

## Ikhtisar
Setelah plugin email diaktifkan, administrator harus menyelesaikan konfigurasi terkait terlebih dahulu, baru user biasa dapat mengintegrasikan akun email ke NocoBase (saat ini hanya mendukung otorisasi login akun email Outlook dan Gmail, tidak mendukung integrasi langsung akun Microsoft dan akun Google).

Inti konfigurasi adalah pengaturan autentikasi pemanggilan API email service provider. Administrator perlu menyelesaikan langkah-langkah berikut untuk memastikan fungsi plugin berjalan dengan baik:

1. **Dapatkan informasi autentikasi dari provider**  
   - Login ke developer console email service provider (seperti Google Cloud Console atau Microsoft Azure Portal).  
   - Buat aplikasi atau project baru, aktifkan layanan API email yang sesuai.  
   - Dapatkan Client ID dan Client Secret.  
   - Konfigurasikan redirect URI, pastikan konsisten dengan alamat callback plugin NocoBase.  

2. **Konfigurasi Email Service Provider**  
   - Masuk ke halaman konfigurasi plugin email.  
   - Isi informasi autentikasi API yang diperlukan (Client ID, Client Secret, dll), pastikan koneksi otorisasi dengan email service provider berjalan normal.

3. **Login Otorisasi**  
   - User login ke akun email melalui protokol OAuth.  
   - Plugin akan otomatis menghasilkan dan menyimpan token otorisasi user, untuk pemanggilan API dan operasi email selanjutnya.

4. **Integrasi Email**  
   - Setelah user berhasil mengotorisasi, akun email-nya akan diintegrasikan ke NocoBase.  
   - Plugin akan menyinkronkan data email user dan menyediakan fitur manajemen, pengiriman dan penerimaan email.

5. **Penggunaan Fitur Email**  
   - User dapat melihat, mengelola, dan mengirim email langsung dalam platform.  
   - Semua operasi diselesaikan melalui pemanggilan API email service provider, memastikan sinkronisasi real-time dan transmisi yang efisien.  

Melalui alur di atas, plugin email NocoBase dapat menyediakan layanan manajemen email yang efisien dan aman untuk user. Jika menghadapi masalah selama proses konfigurasi, lihat dokumen terkait atau hubungi tim technical support untuk mendapatkan bantuan.

## Konfigurasi Plugin

### Aktivasi Plugin Email

1. Masuk ke halaman manajemen plugin
2. Cari plugin "Email manager" dan aktifkan

### Konfigurasi Email Service Provider

Setelah plugin email diaktifkan, dapat dilakukan konfigurasi email service provider. Klik **Settings** > **Email settings** di bagian atas, masuk ke halaman konfigurasi.

![](https://static-docs.nocobase.com/mail-1733818617187.png)

![](https://static-docs.nocobase.com/mail-1733818617514.png)

Setiap service provider perlu diisi Client Id dan Client Secret. Berikut akan dijelaskan secara detail cara mendapatkan kedua parameter ini.
