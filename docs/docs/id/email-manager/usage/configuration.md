---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Konfigurasi Blok

## Blok Pesan Email

### Menambahkan Blok

Pada halaman konfigurasi, klik tombol **Buat blok**, lalu pilih blok **Pesan email (Semua)** atau **Pesan email (Pribadi)** untuk menambahkan blok pesan email.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_03_58_PM.png)

### Konfigurasi Bidang

Klik tombol **Bidang** pada blok untuk memilih bidang yang ingin ditampilkan. Untuk operasi lebih lanjut, Anda bisa merujuk pada metode konfigurasi bidang untuk tabel.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_37_PM.png)

### Konfigurasi Filter Data

Klik ikon konfigurasi di sisi kanan tabel dan pilih **Cakupan data** untuk mengatur rentang data penyaringan email.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_39_PM.png)

Anda dapat menyaring email dengan sufiks yang sama melalui variabel:
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_41_PM.png)

## Blok Detail Email

Pertama, aktifkan fitur **Aktifkan klik untuk membuka** pada bidang di blok pesan email:

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_45_PM.png)

Pada jendela pop-up, tambahkan blok **Detail email**:

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_46_PM.png)

Anda dapat melihat konten detail email:

![](https://static-docs.nocobase.com/email-manager/Loading--10-31-2025_04_49_PM.png)

Di bagian bawah, Anda dapat mengonfigurasi tombol yang diperlukan.

## Blok Kirim Email

Ada dua cara untuk membuat formulir kirim email:

1. Tambahkan tombol **Kirim email** di bagian atas tabel:
   ![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_52_PM.png)

2. Tambahkan blok **Kirim email**:
   ![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM.png)

Kedua metode ini dapat membuat formulir kirim email yang lengkap:
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM%20(1).png)

Setiap bidang dalam formulir email konsisten dengan formulir biasa dan dapat dikonfigurasi dengan **Nilai default** atau **Aturan keterkaitan**, dll.

> Formulir balasan dan penerusan email yang ada di bagian bawah detail email secara default membawa beberapa pemrosesan data, yang dapat dimodifikasi melalui **Alur Peristiwa**.