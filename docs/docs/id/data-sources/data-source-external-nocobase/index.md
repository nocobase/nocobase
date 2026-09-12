---
title: 'NocoBase Eksternal'
description: 'Hubungkan aplikasi NocoBase lain sebagai sumber data eksternal ke aplikasi saat ini, serta pahami cara konfigurasi, kemampuan yang tersedia, dan batasan penggunaannya dalam alur kerja.'
keywords: 'NocoBase Eksternal,Sumber Data NocoBase,Manajemen Sumber Data,Alur Kerja,NocoBase'
---

# NocoBase Eksternal

## Pengenalan

Sumber data NocoBase eksternal dapat menghubungkan aplikasi NocoBase lain ke aplikasi saat ini, sekaligus mempertahankan metadata yang telah dikonfigurasi di aplikasi jarak jauh, seperti tabel data, antarmuka field, judul, dan field relasi.

Dibandingkan dengan sumber data database eksternal, setelah menghubungkan NocoBase eksternal, biasanya Anda tidak perlu mengonfigurasi ulang antarmuka field atau membuat field relasi secara manual. Selain melihat, menambah, mengedit, dan menghapus record, sumber data ini juga mendukung pengunggahan dan pratinjau file, impor dan ekspor, kueri grafik, serta beberapa skenario alur kerja.

## Menambahkan sumber data

Setelah mengaktifkan plugin, tambahkan sumber data NocoBase eksternal di「Manajemen Sumber Data」, lalu isi informasi akses aplikasi jarak jauh.

| Item konfigurasi | Keterangan                                                                                           |
| -------- | ---------------------------------------------------------------------------------------------- |
| Alamat API | Alamat API lengkap aplikasi NocoBase jarak jauh, misalnya `https://example.com/api`                              |
| Origin   | Origin akses aplikasi NocoBase jarak jauh, misalnya `https://example.com`, terutama digunakan untuk menangani alamat pratinjau file lokal dari aplikasi jarak jauh |
| API key  | Kredensial yang digunakan aplikasi saat ini untuk mengakses NocoBase jarak jauh                                                         |
| Header permintaan   | Header permintaan tambahan yang perlu dikirim ke aplikasi jarak jauh, seperti informasi ruang                                                   |
| Waktu tunggu | Waktu tunggu permintaan saat mengakses aplikasi jarak jauh                                                                     |

Setelah sumber data diaktifkan, sistem akan memuat tabel data dari aplikasi jarak jauh.

![](https://static-docs.nocobase.com/202606101149185.png)

## Penjelasan izin

Sumber data NocoBase eksternal dipengaruhi oleh izin aplikasi saat ini dan aplikasi jarak jauh.

- Aplikasi saat ini dapat mengonfigurasi izin akses untuk berbagai tabel dan field seperti sumber data eksternal lainnya;
- sedangkan aplikasi jarak jauh akan membaca dan mengoperasikan data terkait berdasarkan izin API key yang dikonfigurasi.

Sumber data NocoBase eksternal tidak mengembalikan metadata izin yang digunakan untuk mengontrol status tampilan tombol secara terperinci di frontend. Oleh karena itu, beberapa tombol mungkin tidak disembunyikan secara otomatis berdasarkan izin seperti pada sumber data utama. Terlepas dari apakah tombol ditampilkan atau tidak, operasi pengiriman tetap akan melalui pemeriksaan izin sisi server aplikasi saat ini, dan operasi yang tidak diizinkan akan ditolak.

:::warning{title=Perhatian}
Sebaiknya siapkan API key khusus untuk sumber data NocoBase eksternal dan berikan hanya izin tabel data serta operasi yang diperlukan. Jika pengguna memiliki izin di aplikasi saat ini tetapi operasi gagal, periksa izin API key jarak jauh.
:::

## Menggunakan tabel data

Setelah tabel data berhasil dimuat, pilih sumber data ini dalam konfigurasi halaman, konfigurasi blok, grafik, atau alur kerja untuk menggunakan tabel data dari aplikasi jarak jauh.

Setelah struktur tabel data di aplikasi jarak jauh berubah, tabel data perlu dimuat ulang di aplikasi saat ini.

## Penjelasan fitur

Sumber data NocoBase eksternal terutama digunakan untuk memakai tabel data dan data dari aplikasi jarak jauh di aplikasi saat ini. Struktur tabel data, konfigurasi field, dan data aktual tetap dikelola oleh aplikasi jarak jauh.

### Tabel data dan field

Aplikasi saat ini akan memuat metadata dari aplikasi jarak jauh, seperti tabel data, antarmuka field, judul, dan field relasi. Dibandingkan dengan sumber data database eksternal, biasanya Anda tidak perlu mengonfigurasi ulang antarmuka field atau membuat field relasi secara manual di aplikasi saat ini.

Aplikasi saat ini tidak mendukung konfigurasi langsung field pada sumber data NocoBase eksternal. Jika perlu menambahkan field, menyesuaikan jenis field, atau mengubah field relasi, lakukan di aplikasi jarak jauh, lalu kembali ke aplikasi saat ini untuk memuat ulang tabel data.

### Record dan data relasi

Sumber data NocoBase eksternal mendukung penayangan, penambahan, pengeditan, dan penghapusan record di blok halaman, serta penayangan dan pemeliharaan data relasi. Operasi dimulai oleh aplikasi saat ini dan dikirim ke aplikasi jarak jauh melalui API key yang dikonfigurasi.

### File dan lampiran

File akan diunggah ke penyimpanan yang digunakan aplikasi jarak jauh. Aplikasi saat ini bertanggung jawab mengirim permintaan unggah, pratinjau, dan unduh; file itu sendiri tidak disimpan di aplikasi saat ini.

Origin terutama digunakan untuk menangani alamat pratinjau file penyimpanan lokal aplikasi jarak jauh. Jika respons dari jarak jauh berupa jalur relatif, aplikasi saat ini akan menggunakan Origin untuk melengkapi alamat akses file. Origin harus diisi dengan alamat akses publik aplikasi NocoBase jarak jauh, misalnya:

```text
https://example.com
```

Jangan isi alamat API sebagai Origin.

### Impor dan ekspor

Impor dan ekspor merupakan operasi untuk membaca dan menulis sumber data melalui file eksternal, dan semuanya akan diteruskan untuk dijalankan oleh aplikasi jarak jauh. Aplikasi saat ini bertanggung jawab menerima operasi pengguna, meneruskan permintaan, dan mengembalikan hasil unduhan; pembacaan dan penulisan data aktual dilakukan oleh aplikasi jarak jauh.

- Impor record: aplikasi saat ini menerima file impor yang diunggah, lalu meneruskannya ke aplikasi jarak jauh untuk diproses;
- Eksport record: aplikasi saat ini meneruskan permintaan ekspor record ke aplikasi jarak jauh. Dalam mode sinkron, aliran file record yang dikembalikan aplikasi jarak jauh diteruskan langsung ke browser untuk diunduh; dalam mode asinkron, aplikasi saat ini membuat tugas asinkron lokal, memulai ekspor record di aplikasi jarak jauh dan menyinkronkan progresnya, lalu mengambil aliran file record dari aplikasi jarak jauh saat hasilnya diunduh.
- Eksport lampiran: aplikasi saat ini meneruskan permintaan ekspor lampiran ke aplikasi jarak jauh. Dalam mode sinkron, paket lampiran yang dikembalikan aplikasi jarak jauh diteruskan langsung ke browser untuk diunduh; dalam mode asinkron, aplikasi saat ini membuat tugas asinkron lokal, memulai ekspor lampiran di aplikasi jarak jauh dan menyinkronkan progresnya, lalu mengambil aliran paket lampiran dari aplikasi jarak jauh saat hasilnya diunduh.

### Pencetakan template

Pencetakan template dapat menggunakan record dari sumber data NocoBase eksternal. Template dan konfigurasi tindakan pencetakan disimpan di aplikasi saat ini. Saat mencetak, aplikasi saat ini akan membaca record serta data relasi dari jarak jauh, lalu membuat file cetak di aplikasi saat ini.

### Grafik

#### P面el kueri

Sumber data NocoBase eksternal dapat digunakan untuk panel kueri grafik. Aplikasi saat ini akan memproses parameter kueri berdasarkan grafik, sumber data, tabel data, dan izin field yang dikonfigurasi secara lokal, lalu meminta hasilnya dari aplikasi jarak jauh.

API key jarak jauh juga harus memiliki izin akses ke data terkait; jika tidak, kueri akan gagal.

#### Panel SQL

Panel SQL merupakan mode kueri SQL pada grafik dan hanya digunakan untuk kueri. Aplikasi saat ini bertanggung jawab menyimpan konfigurasi SQL dan memulai pemanggilan, sedangkan SQL diteruskan untuk dijalankan oleh aplikasi jarak jauh.

Saat menggunakan panel SQL, pengguna lokal harus memiliki izin konfigurasi UI di aplikasi saat ini, dan API key jarak jauh juga harus memiliki izin konfigurasi UI di aplikasi jarak jauh. Tidak seperti panel kueri, SQL tidak akan memecah parameter kueri berdasarkan izin tabel data dan field. Berikan izin konfigurasi UI kepada pengguna lokal dan API key terkait dengan hati-hati.

### Alur kerja

Sumber data NocoBase eksternal dapat melibatkan dua rangkaian alur kerja: aplikasi saat ini dan aplikasi jarak jauh. Aplikasi saat ini merespons peristiwa dalam rangkaian permintaan halaman, tombol, dan API lokal; setelah menerima permintaan yang diteruskan, aplikasi jarak jauh akan memprosesnya berdasarkan konfigurasi alur kerjanya sendiri.

Perlu diperhatikan bahwa aplikasi saat ini tidak memantau peristiwa penambahan, pembaruan, dan penghapusan yang terjadi di dalam tabel data jarak jauh. Peristiwa tabel data jarak jauh hanya akan dipicu di aplikasi jarak jauh.

#### Pemicu

Tabel berikut menjelaskan kondisi pemicu di aplikasi saat ini dan aplikasi jarak jauh untuk pemicu yang dipengaruhi oleh sumber data NocoBase eksternal ketika alur kerja terkait diaktifkan.

| Pemicu           | Aplikasi saat ini | Aplikasi jarak jauh       | Keterangan                                                                                         |
| ---------------- | -------- | -------------- | -------------------------------------------------------------------------------------------- |
| Peristiwa sebelum permintaan       | Dipicu     | Hanya dipicu dalam mode global | Aplikasi saat ini memicu dalam mode global, sedangkan mode lokal dipicu berdasarkan pengikatan tombol di aplikasi saat ini; setelah menerima permintaan yang diteruskan, aplikasi jarak jauh hanya memicu dalam mode global |
| Peristiwa setelah permintaan       | Dipicu     | Hanya dipicu dalam mode global | Aplikasi saat ini memicu dalam mode global, sedangkan mode lokal dipicu berdasarkan pengikatan tombol di aplikasi saat ini; setelah menerima permintaan yang diteruskan, aplikasi jarak jauh hanya memicu dalam mode global |
| Peristiwa operasi kustom   | Dipicu     | Tidak dipicu         | Tombol「Picu alur kerja」yang terikat di aplikasi saat ini akan memicu proses lokal; permintaan CRUD yang diteruskan tidak memicu peristiwa operasi kustom di aplikasi jarak jauh     |
| Peristiwa tabel data       | Tidak dipicu   | Dipicu           | Data sebenarnya berubah di jarak jauh, sehingga aplikasi saat ini tidak memicu peristiwa tabel data lokal; aplikasi jarak jauh memicu peristiwa tabel datanya sendiri               |
| Pemicu terjadwal field tanggal | Tidak dipicu   | Dipicu           | Aplikasi saat ini tidak memicu berdasarkan field tabel data jarak jauh; aplikasi jarak jauh memicu sesuai konfigurasi field tanggalnya sendiri                         |

Pemicu yang tidak bergantung pada sumber data akan dipicu di aplikasi saat ini dan aplikasi jarak jauh berdasarkan konfigurasi masing-masing.

Jika perlu mengatur proses yang mengoperasikan data NocoBase eksternal di aplikasi saat ini, sebaiknya gunakan peristiwa sebelum permintaan, peristiwa setelah permintaan, atau peristiwa operasi kustom. Alur kerja yang telah ada di aplikasi jarak jauh akan dijalankan secara independen oleh aplikasi jarak jauh.

#### Node

Tabel berikut hanya mencantumkan node yang terkait dengan sumber data. Node umum seperti kondisi, perhitungan, perulangan, dan pemrosesan JSON tidak bergantung pada jenis sumber data dan dapat digunakan seperti biasa dalam alur kerja.

| Node     | Tersedia | Keterangan                              |
| -------- | -------- | --------------------------------- |
| Kueri record | Tersedia     | Mengkueri record dalam aplikasi jarak jauh              |
| Membuat record | Tersedia     | Membuat record di aplikasi jarak jauh                |
| Memperbarui record | Tersedia     | Memperbarui record di aplikasi jarak jauh              |
| Menghapus record | Tersedia     | Menghapus record di aplikasi jarak jauh              |
| Node SQL | Tidak tersedia   | Node SQL alur kerja hanya mendukung sumber data database |
| Node agregasi | Tidak tersedia   | Node agregasi hanya mendukung sumber data database        |

## Pertanyaan umum

### Tabel data tidak muncul

Periksa apakah sumber data telah diaktifkan serta apakah alamat API dan API key sudah benar. Aplikasi jarak jauh juga harus mengizinkan API key tersebut mengakses tabel data terkait.

### File berhasil diunggah tetapi tidak dapat dipratinjau

Jika aplikasi saat ini atau aplikasi jarak jauh menggunakan penyimpanan file lokal, periksa apakah Origin telah diisi dengan alamat akses publik aplikasi terkait. Origin tidak boleh diisi dengan alamat API.

### Memiliki izin di aplikasi saat ini, tetapi operasi gagal

Periksa izin API key aplikasi jarak jauh. Sumber data NocoBase eksternal dipengaruhi oleh izin aplikasi saat ini dan izin aplikasi jarak jauh secara bersamaan.

### Tabel data tidak dapat digunakan setelah layanan jarak jauh mengalami gangguan

Jika aplikasi jarak jauh mengalami 502, dimulai ulang, atau tidak tersedia sementara, aplikasi saat ini mungkin tidak dapat membaca metadata tabel data jarak jauh untuk sementara. Setelah layanan jarak jauh pulih, aplikasi saat ini akan memuat ulang metadata secara otomatis saat tabel data sumber tersebut diakses berikutnya.

### Mengapa field tidak dapat dikonfigurasi di aplikasi saat ini

Sumber data NocoBase eksternal menggunakan struktur tabel data dan konfigurasi field dari aplikasi jarak jauh. Sesuaikan field di aplikasi jarak jauh, lalu kembali ke aplikasi saat ini untuk memuat ulang tabel data.