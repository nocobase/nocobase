---
pkg: "@nocobase/plugin-email-manager"
title: "Konfigurasi Gmail"
description: "Integrasi email Gmail: registrasi Google Cloud, buat project, aktifkan Gmail API, OAuth client, Client ID/Secret, konfigurasi callback URL."
keywords: "konfigurasi Gmail,Google Cloud,OAuth client,Gmail API,Client ID,NocoBase"
---

# Konfigurasi Google

### Prasyarat

Agar user dapat mengintegrasikan email Google ke NocoBase, harus di-deploy di server yang mendukung akses ke layanan Google. Backend akan memanggil Google API.
    
### Registrasi Akun

1. Buka https://console.cloud.google.com/welcome untuk masuk ke Google Cloud  
2. Saat pertama kali masuk perlu menyetujui ketentuan terkait
    
![](https://static-docs.nocobase.com/mail-1733818617807.png)

### Buat App

1. Klik "Select a project" di bagian atas
    
![](https://static-docs.nocobase.com/mail-1733818618126.png)

2. Klik tombol "NEW PROJECT" di popup

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3. Isi informasi project
    
![](https://static-docs.nocobase.com/mail-1733818618510.png)

4. Setelah project dibuat, pilih project tersebut

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### Aktifkan Gmail API

1. Klik tombol "APIs & Services"

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2. Masuk ke panel APIs & Services

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3. Cari **mail**

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4. Klik tombol **ENABLE** untuk mengaktifkan Gmail API

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### Konfigurasi OAuth Consent Screen

1. Klik menu "OAuth consent screen" di sebelah kiri

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2. Pilih **External**

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3. Isi informasi project (untuk ditampilkan di halaman otorisasi selanjutnya), klik save

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4. Isi Developer contact information, klik continue

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5. Klik continue

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6. Tambahkan test user, untuk testing sebelum App di-publish

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7. Klik continue

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8. Lihat informasi overview, kembali ke control panel

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### Buat Credentials

1. Klik menu **Credentials** di sebelah kiri

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2. Klik tombol "CREATE CREDENTIALS", pilih "OAuth client ID"

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3. Pilih "Web application"

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4. Isi informasi aplikasi

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5. Isi domain deployment akhir project (di sini contoh adalah alamat testing NocoBase)

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6. Tambahkan alamat callback otorisasi, harus berupa `domain + "/admin/settings/mail/oauth2"`, contoh: `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7. Klik create, Anda dapat melihat informasi OAuth

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8. Salin Client ID dan Client secret masing-masing dan isi ke halaman konfigurasi email

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9. Klik save, konfigurasi selesai  

### Publish Aplikasi

Setelah alur di atas selesai, dan testing otorisasi login user, pengiriman email, dan fitur lainnya selesai, lakukan publish

1. Klik menu "OAuth consent screen"

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2. Klik tombol "EDIT APP", lalu klik tombol "SAVE AND CONTINUE" di bagian bawah

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3. Klik tombol "ADD OR REMOVE SCOPES", untuk pilih range izin user 

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4. Masukkan "Gmail API" untuk pencarian, lalu centang "Gmail API" (konfirmasi nilai Scope adalah Gmail API "https://mail.google.com/")

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5. Klik tombol **UPDATE** di bagian bawah untuk save

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6. Klik tombol "SAVE AND CONTINUE" di bagian bawah setiap halaman, terakhir klik tombol "BACK TO DASHBOARD" untuk kembali ke halaman control panel

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7. Setelah klik tombol **PUBLISH APP**, akan muncul halaman konfirmasi publish, yang menampilkan informasi terkait yang perlu disediakan untuk publish. Lalu klik tombol **CONFIRM**

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8. Kembali ke halaman console, Anda dapat melihat status publish adalah "In production"

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9. Klik tombol "PREPARE FOR VERIFICATION", isi informasi terkait yang wajib, klik tombol "SAVE AND CONTINUE" (data dalam gambar hanya contoh)

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. Lanjutkan mengisi informasi penting terkait (data dalam gambar hanya contoh)

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. Klik tombol "SAVE AND CONTINUE"

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. Klik tombol "SUBMIT FOR VERIFICATION", submit Verification

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. Tunggu hasil approval

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. Saat approval belum lulus, user dapat klik link unsafe untuk otorisasi login

![](https://static-docs.nocobase.com/mail-1735633689645.png)
