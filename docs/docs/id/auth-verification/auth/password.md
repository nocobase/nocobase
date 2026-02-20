---
pkg: '@nocobase/plugin-auth'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Autentikasi Kata Sandi

## Antarmuka Konfigurasi

![](https://static-docs.nocobase.com/202411131505095.png)

## Izinkan Pendaftaran

Ketika pendaftaran diizinkan, halaman masuk akan menampilkan tautan untuk membuat akun, dan Anda dapat menuju ke halaman pendaftaran.

![](https://static-docs.nocobase.com/78903930d4b47aaf75cf94c55dd3596e.png)

Halaman Pendaftaran

![](https://static-docs.nocobase.com/ac3c3ab42df28cb7c6dc70b24e99e7f7.png)

Ketika pendaftaran tidak diizinkan, halaman masuk tidak akan menampilkan tautan untuk membuat akun.

![](https://static-docs.nocobase.com/8d5e3b6df9991bfc1c2e095a93745121.png)

Ketika pendaftaran tidak diizinkan, halaman pendaftaran tidak dapat diakses.

![](https://static-docs.nocobase.com/09325c4b07e09f88f80a14dff8430556.png)

## Pengaturan Formulir Pendaftaran<Badge>v1.4.0-beta.7+</Badge>

Anda dapat mengatur bidang mana saja dalam **koleksi** pengguna yang perlu ditampilkan di formulir pendaftaran dan apakah bidang tersebut wajib diisi atau tidak. Setidaknya salah satu bidang nama pengguna atau email harus diatur untuk ditampilkan dan wajib diisi.

![](https://static-docs.nocobase.com/202411262133669.png)

Halaman Pendaftaran

![](https://static-docs.nocobase.com/202411262135801.png)

## Lupa Kata Sandi<Badge>v1.8.0+</Badge>

Fitur lupa kata sandi memungkinkan pengguna untuk mengatur ulang kata sandi mereka melalui verifikasi email jika mereka lupa.

### Konfigurasi Administrator

1.  **Aktifkan Fitur Lupa Kata Sandi**

    Pada tab "Pengaturan" > "Autentikasi Pengguna" > "Lupa Kata Sandi", centang kotak "Aktifkan Fitur Lupa Kata Sandi".

    ![20250423071957_rec_](https://static-docs.nocobase.com/20250423071957_rec_.gif)

2.  **Konfigurasi Saluran Notifikasi**

    Pilih saluran notifikasi email (saat ini hanya email yang didukung). Jika tidak ada saluran notifikasi yang tersedia, Anda perlu menambahkannya terlebih dahulu.

    ![20250423072225_rec_](https://static-docs.nocobase.com/20250423072225_rec_.gif)

3.  **Konfigurasi Email Atur Ulang Kata Sandi**

    Sesuaikan subjek dan konten email, mendukung format HTML atau teks biasa. Anda dapat menggunakan variabel berikut:
    - Pengguna saat ini
    - Pengaturan sistem
    - Tautan atur ulang kata sandi
    - Masa berlaku tautan atur ulang (menit)

    ![20250427170047](https://static-docs.nocobase.com/20250427170047.png)

4.  **Atur Masa Berlaku Tautan Atur Ulang**

    Atur periode validitas (dalam menit) untuk tautan atur ulang, defaultnya adalah 120 menit.

    ![20250423073557](https://static-docs.nocobase.com/20250423073557.png)

### Alur Penggunaan Pengguna

1.  **Mulai Permintaan Atur Ulang Kata Sandi**

    Pada halaman masuk, klik tautan "Lupa Kata Sandi" (administrator perlu mengaktifkan fitur lupa kata sandi terlebih dahulu) untuk masuk ke halaman lupa kata sandi.

    ![20250421103458_rec_](https://static-docs.nocobase.com/20250421103458_rec_.gif)

    Masukkan alamat email terdaftar dan klik tombol "Kirim Email Atur Ulang".

    ![20250421113442_rec_](https://static-docs.nocobase.com/20250421113442_rec_.gif)

2.  **Atur Ulang Kata Sandi**

    Pengguna akan menerima email yang berisi tautan atur ulang. Setelah mengklik tautan, atur kata sandi baru di halaman yang terbuka.

    ![20250421113748](https://static-docs.nocobase.com/20250421113748.png)

    Setelah selesai, pengguna dapat masuk ke sistem dengan kata sandi baru.

### Catatan Penting

- Tautan atur ulang memiliki batas waktu, secara default berlaku selama 120 menit setelah dibuat (dapat dikonfigurasi oleh administrator).
- Tautan hanya dapat digunakan sekali dan akan segera tidak berlaku setelah digunakan.
- Jika pengguna tidak menerima email atur ulang, harap periksa apakah alamat email sudah benar, atau periksa folder spam.
- Administrator harus memastikan konfigurasi server email sudah benar untuk menjamin email atur ulang dapat terkirim dengan sukses.