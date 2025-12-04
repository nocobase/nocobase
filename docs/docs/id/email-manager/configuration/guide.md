---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Proses Konfigurasi

## Gambaran Umum
Setelah mengaktifkan plugin Email, administrator harus menyelesaikan konfigurasi yang diperlukan terlebih dahulu, sebelum pengguna biasa dapat menghubungkan akun email mereka ke NocoBase. (Saat ini, hanya otorisasi untuk akun Outlook dan Gmail yang didukung; login langsung dengan akun Microsoft dan Google belum tersedia).

Inti dari konfigurasi ini terletak pada pengaturan autentikasi untuk panggilan API penyedia layanan email. Administrator perlu menyelesaikan langkah-langkah berikut untuk memastikan plugin berfungsi dengan benar:

1.  **Mendapatkan informasi autentikasi dari penyedia layanan**
    -   Masuk ke konsol pengembang penyedia layanan email (misalnya, Google Cloud Console atau Microsoft Azure Portal).
    -   Buat aplikasi atau proyek baru dan aktifkan layanan API email Gmail atau Outlook.
    -   Dapatkan Client ID dan Client Secret yang sesuai.
    -   Konfigurasi Redirect URI agar sesuai dengan alamat callback plugin NocoBase.

2.  **Konfigurasi Penyedia Layanan Email**
    -   Buka halaman konfigurasi plugin Email.
    -   Berikan informasi autentikasi API yang diperlukan, termasuk Client ID dan Client Secret, untuk memastikan otorisasi yang benar dengan penyedia layanan email.

3.  **Login Otorisasi**
    -   Pengguna login ke akun email mereka melalui protokol OAuth.
    -   Plugin akan secara otomatis membuat dan menyimpan token otorisasi pengguna untuk panggilan API dan operasi email selanjutnya.

4.  **Menghubungkan Akun Email**
    -   Setelah otorisasi berhasil, akun email pengguna akan terhubung ke NocoBase.
    -   Plugin akan menyinkronkan data email pengguna dan menyediakan fitur untuk mengelola, mengirim, dan menerima email.

5.  **Menggunakan Fitur Email**
    -   Pengguna dapat melihat, mengelola, dan mengirim email langsung di dalam platform.
    -   Semua operasi diselesaikan melalui panggilan API penyedia layanan email, memastikan sinkronisasi waktu nyata dan transmisi yang efisien.

Melalui proses yang dijelaskan di atas, plugin Email NocoBase menyediakan layanan manajemen email yang efisien dan aman bagi pengguna. Jika Anda mengalami masalah selama konfigurasi, silakan merujuk ke dokumentasi terkait atau hubungi tim dukungan teknis untuk bantuan.

## Konfigurasi Plugin

### Mengaktifkan Plugin Email

1.  Buka halaman manajemen plugin
2.  Temukan plugin "Email manager" dan aktifkan.

### Konfigurasi Penyedia Layanan Email

Setelah plugin Email diaktifkan, Anda dapat mengonfigurasi penyedia layanan email. Saat ini, layanan email Google dan Microsoft didukung. Klik "Pengaturan" -> "Pengaturan Email" di bilah atas untuk masuk ke halaman pengaturan.

![](https://static-docs.nocobase.com/mail-1733818617187.png)

![](https://static-docs.nocobase.com/mail-1733818617514.png)

Untuk setiap penyedia layanan, Anda perlu mengisi Client ID dan Client Secret. Bagian berikut akan merinci cara mendapatkan kedua parameter ini.