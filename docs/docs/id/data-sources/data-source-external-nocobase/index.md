---
title: 'NocoBase eksternal'
description: 'Hubungkan aplikasi NocoBase lain sebagai sumber data eksternal dan pelajari konfigurasi, kemampuan yang tersedia, serta batasan workflow.'
keywords: 'NocoBase eksternal,sumber data NocoBase,pengelola sumber data,workflow,NocoBase'
---

# NocoBase eksternal

## Pengantar

Sumber data NocoBase eksternal menghubungkan aplikasi NocoBase lain ke aplikasi saat ini, sekaligus mempertahankan metadata dari aplikasi jarak jauh, termasuk collection, antarmuka field, judul, dan field relasi.

Dibandingkan dengan sumber data database eksternal, sumber data NocoBase eksternal biasanya tidak memerlukan konfigurasi ulang antarmuka field atau pembuatan field relasi secara manual. Selain melihat, membuat, mengedit, dan menghapus record, sumber data ini juga mendukung unggah dan pratinjau file, impor dan ekspor, kueri chart, serta beberapa skenario workflow.

## Menambahkan Sumber Data

Setelah plugin diaktifkan, tambahkan sumber data NocoBase eksternal di Pengelola Sumber Data, lalu isi informasi akses aplikasi jarak jauh.

| Opsi | Deskripsi |
| --- | --- |
| URL API | URL API lengkap aplikasi NocoBase jarak jauh, misalnya `https://example.com/api` |
| Origin | Origin publik aplikasi NocoBase jarak jauh, misalnya `https://example.com`. Ini terutama digunakan untuk menangani URL pratinjau file lokal pada aplikasi jarak jauh |
| API key | Kredensial yang digunakan aplikasi saat ini untuk mengakses aplikasi NocoBase jarak jauh |
| Header permintaan | Header tambahan yang dikirim ke aplikasi jarak jauh, misalnya informasi space |
| Timeout | Timeout permintaan untuk mengakses aplikasi jarak jauh |

Setelah sumber data diaktifkan, sistem memuat collection dari aplikasi jarak jauh.

![](https://static-docs.nocobase.com/202606101149185.png)

## Izin

Sumber data NocoBase eksternal dipengaruhi oleh izin pada aplikasi saat ini dan aplikasi jarak jauh.

- Pada aplikasi saat ini, Anda dapat mengonfigurasi izin akses untuk collection dan field yang berbeda seperti sumber data eksternal lainnya.
- Pada aplikasi jarak jauh, data dibaca dan dioperasikan sesuai izin API key yang dikonfigurasi.

Sumber data NocoBase eksternal tidak mengembalikan metadata izin yang digunakan untuk mengontrol visibilitas tombol secara detail di frontend. Akibatnya, beberapa tombol mungkin tidak otomatis disembunyikan berdasarkan izin seperti pada sumber data utama. Terlepas dari apakah tombol terlihat, operasi yang dikirim tetap melewati pemeriksaan izin sisi server pada aplikasi saat ini, dan operasi yang tidak diizinkan akan ditolak.

:::warning{title=Catatan}
Siapkan API key khusus untuk sumber data NocoBase eksternal dan hanya berikan izin collection serta operasi yang diperlukan. Jika pengguna memiliki izin di aplikasi saat ini tetapi operasi gagal, periksa izin API key jarak jauh.
:::

## Menggunakan Collection

Setelah collection berhasil dimuat, pilih sumber data ini pada konfigurasi halaman, konfigurasi blok, chart, atau workflow untuk menggunakan collection dari aplikasi jarak jauh.

Jika struktur collection pada aplikasi jarak jauh berubah, muat ulang collection di aplikasi saat ini.

## Fitur

Sumber data NocoBase eksternal terutama digunakan untuk memakai collection dan data dari aplikasi jarak jauh di aplikasi saat ini. Struktur collection, konfigurasi field, dan data aktual tetap dikelola oleh aplikasi jarak jauh.

### Collection dan Field

Aplikasi saat ini memuat metadata dari aplikasi jarak jauh, termasuk collection, antarmuka field, judul, dan field relasi. Dibandingkan dengan sumber data database eksternal, biasanya Anda tidak perlu mengonfigurasi ulang antarmuka field atau membuat field relasi secara manual di aplikasi saat ini.

Aplikasi saat ini tidak mendukung konfigurasi field secara langsung untuk sumber data NocoBase eksternal. Untuk menambahkan field, menyesuaikan tipe field, atau mengubah field relasi, lakukan perubahan di aplikasi jarak jauh lalu muat ulang collection di aplikasi saat ini.

### Record dan Data Terkait

Sumber data NocoBase eksternal mendukung melihat, membuat, mengedit, dan menghapus record di blok halaman, serta melihat dan memelihara data terkait. Operasi dimulai oleh aplikasi saat ini dan dikirim ke aplikasi jarak jauh melalui API key yang dikonfigurasi.

### File dan Lampiran

File diunggah ke storage yang digunakan oleh aplikasi jarak jauh. Aplikasi saat ini memulai permintaan unggah, pratinjau, dan unduh, tetapi file itu sendiri tidak disimpan di aplikasi saat ini.

Origin terutama digunakan untuk menangani URL pratinjau file yang disimpan secara lokal oleh aplikasi jarak jauh. Jika aplikasi jarak jauh mengembalikan path relatif, aplikasi saat ini menggunakan Origin untuk melengkapi URL akses file. Origin harus berupa alamat akses publik aplikasi NocoBase jarak jauh, misalnya:

```text
https://example.com
```

Jangan gunakan URL API sebagai Origin.

### Impor dan Ekspor

Operasi impor dan ekspor membaca atau menulis sumber data melalui file eksternal, dan diproksikan ke aplikasi jarak jauh untuk dieksekusi. Aplikasi saat ini menangani operasi pengguna, meneruskan permintaan, dan mengembalikan hasil unduhan. Pembacaan dan penulisan data aktual dilakukan oleh aplikasi jarak jauh.

- Impor record: aplikasi saat ini menerima file impor yang diunggah dan memproksikannya ke aplikasi jarak jauh untuk menjalankan impor.
- Ekspor record: aplikasi saat ini memproksikan permintaan ke aplikasi jarak jauh untuk mengekspor record. Dalam mode sinkron, file record yang dikembalikan oleh aplikasi jarak jauh dialirkan kembali ke browser untuk diunduh. Dalam mode asinkron, tugas asinkron lokal dibuat, ekspor record dimulai di aplikasi jarak jauh, progres disinkronkan ke tugas lokal, dan file hasil dialirkan dari aplikasi jarak jauh saat diunduh.
- Ekspor lampiran: aplikasi saat ini memproksikan permintaan ke aplikasi jarak jauh untuk mengekspor lampiran. Dalam mode sinkron, arsip lampiran yang dikembalikan oleh aplikasi jarak jauh dialirkan kembali ke browser untuk diunduh. Dalam mode asinkron, tugas asinkron lokal dibuat, ekspor lampiran dimulai di aplikasi jarak jauh, progres disinkronkan ke tugas lokal, dan arsip lampiran dialirkan dari aplikasi jarak jauh saat diunduh.

### Cetak Template

Cetak Template dapat menggunakan record dari sumber data NocoBase eksternal. Template cetak dan konfigurasi aksi cetak disimpan di aplikasi saat ini. Saat mencetak, aplikasi saat ini membaca record jarak jauh dan data terkait, lalu menghasilkan file cetak di aplikasi saat ini.

### Chart

#### Panel Kueri

Sumber data NocoBase eksternal dapat digunakan di panel kueri chart. Aplikasi saat ini memproses parameter kueri berdasarkan izin chart, sumber data, collection, dan field yang dikonfigurasi secara lokal, lalu meminta hasil dari aplikasi jarak jauh.

API key jarak jauh juga harus memiliki akses ke data terkait; jika tidak, kueri akan gagal.

#### Panel SQL

Panel SQL adalah mode kueri SQL pada chart dan hanya digunakan untuk kueri. Aplikasi saat ini menyimpan konfigurasi SQL dan memulai panggilan, sementara SQL diproksikan ke aplikasi jarak jauh untuk dieksekusi.

Saat menggunakan panel SQL, pengguna lokal harus memiliki izin konfigurasi UI di aplikasi saat ini, dan API key jarak jauh juga harus memiliki izin konfigurasi UI di aplikasi jarak jauh. SQL tidak diuraikan berdasarkan izin collection dan field seperti panel kueri. Berikan izin konfigurasi UI kepada pengguna lokal dan API key terkait dengan hati-hati.

### Workflow

Sumber data NocoBase eksternal dapat melibatkan workflow di aplikasi saat ini dan aplikasi jarak jauh. Aplikasi saat ini merespons event pada halaman lokal, tombol, dan rantai permintaan API. Setelah aplikasi jarak jauh menerima permintaan yang diproksikan, aplikasi tersebut memprosesnya sesuai konfigurasi workflow sendiri.

Aplikasi saat ini tidak mendengarkan event pembuatan, pembaruan, atau penghapusan yang terjadi di dalam collection jarak jauh. Event collection jarak jauh hanya dipicu di aplikasi jarak jauh.

#### Trigger

Tabel berikut menjelaskan perilaku trigger yang dipengaruhi oleh sumber data NocoBase eksternal pada aplikasi saat ini dan aplikasi jarak jauh ketika workflow terkait diaktifkan.

| Trigger | Aplikasi saat ini | Aplikasi jarak jauh | Deskripsi |
| --- | --- | --- | --- |
| Event sebelum aksi | Dipicu | Hanya dipicu dalam mode global | Mode global dipicu di aplikasi saat ini, dan mode lokal mengikuti binding tombol di aplikasi saat ini. Setelah aplikasi jarak jauh menerima permintaan yang diproksikan, hanya mode global yang dipicu |
| Event setelah aksi | Dipicu | Hanya dipicu dalam mode global | Mode global dipicu di aplikasi saat ini, dan mode lokal mengikuti binding tombol di aplikasi saat ini. Setelah aplikasi jarak jauh menerima permintaan yang diproksikan, hanya mode global yang dipicu |
| Event aksi kustom | Dipicu | Tidak dipicu | Tombol "Trigger workflow" yang terikat di aplikasi saat ini memicu workflow lokal. Permintaan CRUD yang diproksikan tidak memicu event aksi kustom jarak jauh |
| Event collection | Tidak dipicu | Dipicu | Data aktual berubah di aplikasi jarak jauh. Aplikasi saat ini tidak memicu event collection lokal, sedangkan aplikasi jarak jauh memicu event collection miliknya sendiri |
| Trigger jadwal field tanggal | Tidak dipicu | Dipicu | Aplikasi saat ini tidak memicu berdasarkan field pada collection jarak jauh. Aplikasi jarak jauh memicu sesuai konfigurasi field tanggal miliknya sendiri |

Trigger yang tidak bergantung pada sumber data dipicu di aplikasi saat ini dan aplikasi jarak jauh sesuai konfigurasi masing-masing.

Untuk menyusun workflow yang mengoperasikan data NocoBase eksternal di aplikasi saat ini, gunakan event sebelum aksi, event setelah aksi, atau event aksi kustom. Workflow yang sudah ada di aplikasi jarak jauh berjalan secara independen di aplikasi jarak jauh.

#### Node

Tabel berikut hanya mencantumkan node yang terkait dengan sumber data. Node umum seperti kondisi, kalkulasi, loop, dan pemrosesan JSON tidak bergantung pada jenis sumber data dan dapat digunakan seperti biasa.

| Node | Tersedia | Deskripsi |
| --- | --- | --- |
| Query records | Tersedia | Mengkueri record di aplikasi jarak jauh |
| Create record | Tersedia | Membuat record di aplikasi jarak jauh |
| Update record | Tersedia | Memperbarui record di aplikasi jarak jauh |
| Delete record | Tersedia | Menghapus record di aplikasi jarak jauh |
| Node SQL | Tidak tersedia | Node SQL workflow hanya mendukung sumber data database |
| Node agregasi | Tidak tersedia | Node agregasi hanya mendukung sumber data database |

## FAQ

### Collection Tidak Muncul

Periksa apakah sumber data sudah diaktifkan serta apakah URL API dan API key sudah benar. Aplikasi jarak jauh juga harus mengizinkan API key tersebut mengakses collection yang sesuai.

### File Berhasil Diunggah tetapi Tidak Dapat Dipratinjau

Jika aplikasi saat ini atau aplikasi jarak jauh menggunakan storage file lokal, periksa apakah Origin adalah alamat akses publik aplikasi terkait. Origin tidak boleh berupa URL API.

### Aplikasi Saat Ini Memiliki Izin, tetapi Operasi Gagal

Periksa izin API key di aplikasi jarak jauh. Sumber data NocoBase eksternal dipengaruhi oleh izin pada aplikasi saat ini dan aplikasi jarak jauh.

### Collection Tidak Dapat Digunakan Setelah Error Layanan Jarak Jauh

Jika aplikasi jarak jauh mengembalikan 502, memulai ulang, atau tidak tersedia sementara, aplikasi saat ini mungkin sementara tidak dapat membaca metadata collection jarak jauh. Setelah layanan jarak jauh pulih, aplikasi saat ini otomatis memuat ulang metadata saat collection dari sumber data ini diakses berikutnya.

### Mengapa Field Tidak Dapat Dikonfigurasi di Aplikasi Saat Ini

Sumber data NocoBase eksternal menggunakan struktur collection dan konfigurasi field dari aplikasi jarak jauh. Sesuaikan field di aplikasi jarak jauh, lalu muat ulang collection di aplikasi saat ini.
