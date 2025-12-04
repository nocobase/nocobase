---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



# Konfigurasi Google

### Prasyarat

Agar pengguna dapat menghubungkan akun Google Mail mereka ke NocoBase, aplikasi harus di-deploy pada server yang mendukung akses ke layanan Google, karena backend akan memanggil Google API.
    
### Mendaftar Akun

1. Buka https://console.cloud.google.com/welcome untuk masuk ke Google Cloud.
2. Saat pertama kali masuk, Anda perlu menyetujui syarat dan ketentuan yang berlaku.
    
![](https://static-docs.nocobase.com/mail-1733818617807.png)

### Membuat Aplikasi

1. Klik "Select a project" di bagian atas.
    
![](https://static-docs.nocobase.com/mail-1733818618126.png)

2. Klik tombol "NEW PROJECT" di jendela pop-up.

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3. Isi informasi proyek.
    
![](https://static-docs.nocobase.com/mail-1733818618510.png)

4. Setelah proyek berhasil dibuat, pilih proyek tersebut.

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### Mengaktifkan Gmail API

1. Klik tombol "APIs & Services".

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2. Masuk ke panel APIs & Services.

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3. Cari "mail".

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4. Klik tombol "ENABLE" untuk mengaktifkan Gmail API.

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### Mengonfigurasi Layar Persetujuan OAuth

1. Klik menu "OAuth consent screen" di sebelah kiri.

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2. Pilih "External".

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3. Isi informasi proyek (ini akan ditampilkan pada halaman otorisasi) lalu klik simpan.

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4. Isi informasi kontak pengembang (Developer contact information), lalu klik lanjutkan.

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5. Klik lanjutkan.

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6. Tambahkan pengguna uji (test users) untuk pengujian sebelum aplikasi dipublikasikan.

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7. Klik lanjutkan.

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8. Tinjau informasi ringkasan, lalu kembali ke dasbor (dashboard).

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### Membuat Kredensial

1. Klik menu "Credentials" di sebelah kiri.

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2. Klik tombol "CREATE CREDENTIALS", lalu pilih "OAuth client ID".

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3. Pilih "Web application".

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4. Isi informasi aplikasi.

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5. Masukkan domain deployment akhir proyek (contoh di sini adalah alamat uji NocoBase).

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6. Tambahkan URI pengalihan yang diotorisasi (authorized redirect URI). Ini harus berupa `domain + "/admin/settings/mail/oauth2"`. Contoh: `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7. Klik buat (create) untuk melihat informasi OAuth.

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8. Salin Client ID dan Client secret secara terpisah, lalu tempelkan ke halaman konfigurasi email.

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9. Klik simpan untuk menyelesaikan konfigurasi.

### Mempublikasikan Aplikasi

Setelah proses di atas selesai, serta fitur-fitur seperti otorisasi login pengguna uji dan pengiriman email telah diuji, Anda dapat mempublikasikan aplikasi.

1. Klik menu "OAuth consent screen".

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2. Klik tombol "EDIT APP", lalu klik tombol "SAVE AND CONTINUE" di bagian bawah.

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3. Klik tombol "ADD OR REMOVE SCOPES" untuk memilih cakupan izin pengguna.

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4. Cari "Gmail API", lalu centang "Gmail API" (pastikan nilai Scope adalah Gmail API dengan "https://mail.google.com/").

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5. Klik tombol "UPDATE" di bagian bawah untuk menyimpan.

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6. Klik tombol "SAVE AND CONTINUE" di bagian bawah setiap halaman, dan terakhir klik tombol "BACK TO DASHBOARD" untuk kembali ke halaman dasbor.

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7. Setelah mengklik tombol "PUBLISH APP", halaman konfirmasi publikasi akan muncul, mencantumkan informasi yang diperlukan untuk publikasi. Kemudian klik tombol "CONFIRM".

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8. Kembali ke halaman konsol, dan Anda akan melihat status publikasi adalah "In production".

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9. Klik tombol "PREPARE FOR VERIFICATION", isi informasi yang diperlukan, lalu klik tombol "SAVE AND CONTINUE" (data dalam gambar hanya sebagai contoh).

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. Lanjutkan mengisi informasi yang diperlukan (data dalam gambar hanya sebagai contoh).

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. Klik tombol "SAVE AND CONTINUE".

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. Klik tombol "SUBMIT FOR VERIFICATION" untuk mengajukan verifikasi.

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. Tunggu hasil persetujuan.

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. Jika persetujuan masih tertunda, pengguna dapat mengklik tautan tidak aman (unsafe link) untuk otorisasi dan masuk.

![](https://static-docs.nocobase.com/mail-1735633689645.png)