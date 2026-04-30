---
pkg: '@nocobase/plugin-auth'
title: "Autentikasi Password"
description: "Autentikasi password NocoBase: izinkan pendaftaran, pengaturan formulir pendaftaran, lupa password (reset via verifikasi email), konfigurasi administrator, dan alur penggunaan pengguna."
keywords: "autentikasi password,pendaftaran pengguna,lupa password,reset verifikasi email,reset password,NocoBase"
---

# Autentikasi Password

## Antarmuka Konfigurasi

![](https://static-docs.nocobase.com/202411131505095.png)

## Apakah Pendaftaran Diizinkan

Ketika pendaftaran diizinkan, halaman login akan menampilkan link untuk membuat akun, dan dapat beralih ke halaman pendaftaran.

![](https://static-docs.nocobase.com/78903930d4b47aaf75cf94c55dd3596e.png)

Halaman pendaftaran

![](https://static-docs.nocobase.com/ac3c3ab42df28cb7c6dc70b24e99e7f7.png)

Ketika pendaftaran tidak diizinkan, halaman login tidak akan menampilkan link untuk membuat akun.

![](https://static-docs.nocobase.com/8d5e3b6df9991bfc1c2e095a93745121.png)

Ketika pendaftaran tidak diizinkan, halaman pendaftaran tidak dapat diakses.

![](https://static-docs.nocobase.com/09325c4b07e09f88f80a14dff8430556.png)

## Pengaturan Formulir Pendaftaran<Badge>v1.4.0-beta.7+</Badge>

Mendukung pengaturan field mana di tabel pengguna yang ditampilkan dalam formulir pendaftaran serta apakah field tersebut wajib diisi. Setidaknya satu dari field username atau email harus diatur sebagai ditampilkan dan wajib diisi.

![](https://static-docs.nocobase.com/202411262133669.png)

Halaman pendaftaran

![](https://static-docs.nocobase.com/202411262135801.png)

## Lupa Password<Badge>v1.8.0+</Badge>

Fitur lupa password memungkinkan pengguna mereset password ketika lupa, melalui verifikasi email.

### Konfigurasi Administrator

1. **Mengaktifkan Fitur Lupa Password**

   Pada tab "Settings" > "Autentikasi Pengguna" > "Lupa Password", centang kotak "Aktifkan fitur lupa password".

   ![20250423071957_rec_](https://static-docs.nocobase.com/20250423071957_rec_.gif)

2. **Mengkonfigurasi Channel Notifikasi**

   Pilih channel notifikasi email (saat ini hanya mendukung email). Jika tidak ada channel notifikasi yang tersedia, tambahkan terlebih dahulu.

   ![20250423072225_rec_](https://static-docs.nocobase.com/20250423072225_rec_.gif)

3. **Mengkonfigurasi Email Reset Password**

   Sesuaikan subjek dan konten email, mendukung format HTML atau plain text. Anda dapat menggunakan variabel berikut:
   - Pengguna saat ini (Current user)
   - Pengaturan sistem (System settings)
   - Link reset password (Reset password link)
   - Masa berlaku link reset (menit) (Reset link expiration (minutes))

   ![20250427170047](https://static-docs.nocobase.com/20250427170047.png)

4. **Mengatur Masa Berlaku Link Reset**

   Atur masa berlaku link reset (dalam menit), default 120 menit.

   ![20250423073557](https://static-docs.nocobase.com/20250423073557.png)

### Alur Penggunaan Pengguna

1. **Mengajukan Permintaan Reset Password**

   Pada halaman login, klik link "Lupa Password" (administrator harus mengaktifkan fitur lupa password terlebih dahulu) untuk masuk ke halaman lupa password.

   ![20250421103458_rec_](https://static-docs.nocobase.com/20250421103458_rec_.gif)

   Masukkan email yang terdaftar dan klik tombol "Kirim Email Reset".

   ![20250421113442_rec_](https://static-docs.nocobase.com/20250421113442_rec_.gif)

2. **Reset Password**

   Pengguna akan menerima email berisi link reset. Setelah mengklik link, atur password baru pada halaman yang terbuka.

   ![20250421113748](https://static-docs.nocobase.com/20250421113748.png)

   Setelah pengaturan selesai, pengguna dapat login ke sistem dengan password baru.

### Hal yang Perlu Diperhatikan

- Link reset memiliki batas waktu, default berlaku selama 120 menit setelah dibuat (dapat dikonfigurasi oleh administrator)
- Link hanya dapat digunakan sekali, setelah digunakan langsung tidak berlaku
- Jika pengguna tidak menerima email reset, periksa apakah alamat email sudah benar, atau cek folder spam
- Administrator harus memastikan konfigurasi email server sudah benar agar email reset dapat terkirim dengan sukses
