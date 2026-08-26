---
pkg: "@nocobase/plugin-ai"
title: "Tugas Cepat Karyawan AI"
description: "Mengikat Karyawan AI pada Block dan preset tugas umum, eksekusi sekali klik: pengikatan Block, pengaturan tugas (Title, Background, Default user message, Work context, Skills)."
keywords: "Tugas Cepat,Tugas AI,Pengikatan Block,Konfigurasi Tugas,NocoBase"
---

# Tugas Cepat

Untuk lebih efisien membuat Karyawan AI mulai bekerja, kita dapat mengikat Karyawan AI pada Block skenario, dan preset beberapa tugas umum.

Dengan demikian Pengguna dapat dengan satu klik cepat memulai pemrosesan tugas, tanpa perlu setiap kali **memilih Block** dan **memasukkan instruksi**.

## Block Mengikat Karyawan AI

Setelah halaman masuk ke mode UI editing, pada Block yang mendukung pengaturan `Actions`, pilih menu `AI employees` di bawah `Actions`, kemudian pilih satu Karyawan AI, Karyawan AI ini akan terikat dengan Block saat ini.

![20251022135306](https://static-docs.nocobase.com/20251022135306.png)

Setelah pengikatan selesai, setiap kali masuk ke halaman, area Actions Block menampilkan Karyawan AI yang terikat dengan Block saat ini.

![20251022135438](https://static-docs.nocobase.com/20251022135438.png)

## Mengatur Tugas

Setelah halaman masuk ke mode UI editing, mouse hover pada ikon Karyawan AI yang terikat dengan Block, muncul tombol menu, pilih `Edit tasks`, masuk ke halaman pengaturan tugas.

Setelah masuk ke halaman pengaturan tugas, dapat menambahkan beberapa tugas untuk Karyawan AI saat ini.

Setiap tab mewakili satu tugas independen, klik tanda "+" di sebelahnya untuk menambah tugas baru.

![20260426230344](https://static-docs.nocobase.com/20260426230344.png)

Formulir pengaturan tugas:

- Pada kotak input `Title` masukkan judul tugas, ekspresikan konten tugas secara singkat, judul ini akan muncul di daftar tugas Karyawan AI.
- Pada kotak input `Background` masukkan konten utama tugas, konten ini akan menjadi prompt sistem yang digunakan saat berdialog dengan Karyawan AI.
- Pada kotak input `Default user message` masukkan pesan Pengguna default yang akan dikirim, setelah memilih tugas akan otomatis terisi ke kotak input Pengguna.
- Pada `Work context` pilih informasi konteks aplikasi default yang akan dikirim ke Karyawan AI, operasi bagian ini sama dengan operasi di kotak dialog.
- Pada `Skills` atur `Preset` untuk menggunakan Skills preset Karyawan AI saat ini. Atur `Customer` untuk mengonfigurasi penggunaan sebagian Skills Karyawan AI, kosongkan berarti tidak menggunakan Skills apa pun.
- Pada `Tools` atur `Preset` untuk menggunakan tools preset Karyawan AI saat ini. Atur `Customer` untuk mengonfigurasi penggunaan sebagian tools Karyawan AI, kosongkan berarti tidak menggunakan tools apa pun.
- Checkbox `Send default user message automatically` mengonfigurasi apakah otomatis mengirim pesan Pengguna default setelah klik untuk menjalankan tugas.


## Daftar Tugas

Setelah mengatur tugas untuk Karyawan AI, tugas-tugas ini akan ditampilkan di popup pengantar Karyawan AI dan pesan sapaan sebelum sesi dimulai, klik untuk menjalankan tugas.

![clipboard-image-1771913319](https://static-docs.nocobase.com/clipboard-image-1771913319.png)
