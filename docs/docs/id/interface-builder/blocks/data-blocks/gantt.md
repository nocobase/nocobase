---
pkg: '@nocobase/plugin-gantt'
title: 'Blok Gantt'
description: 'Blok Gantt menampilkan tanggal mulai, tanggal selesai, dan progres record dalam timeline. Cocok untuk perencanaan proyek, penjadwalan tugas, dan pelacakan milestone, serta mendukung field judul, field tanggal, field progres, field warna, skala waktu, tabel kiri, dan popup event.'
keywords: 'Blok Gantt,Gantt,perencanaan proyek,penjadwalan tugas,timeline,manajemen progres,pembuatan antarmuka,NocoBase'
---

# Blok Gantt

## Pengantar

Blok Gantt menampilkan tanggal mulai, tanggal selesai, dan progres record dalam timeline. Blok ini cocok untuk perencanaan proyek, penjadwalan tugas, pelacakan milestone, dan skenario lain ketika kamu perlu melihat durasi tugas berdasarkan waktu.

![](https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_30_AM.png)

## Instalasi

Blok ini adalah plugin bawaan dan tidak memerlukan instalasi tambahan.

## Menambahkan Blok

Setelah memilih blok Gantt dan menentukan tabel data, konfigurasi field yang dibutuhkan blok Gantt di popup:

1. Pilih field judul untuk menampilkan nama tugas
2. Pilih field tanggal mulai untuk menentukan waktu mulai tugas
3. Pilih field tanggal selesai untuk menentukan waktu selesai tugas
4. Jika perlu, pilih field progres untuk menampilkan dan memperbarui progres tugas dengan drag
5. Jika perlu, pilih field warna untuk membedakan tugas
6. Pilih skala waktu untuk mengontrol granularitas timeline

Setelah konfigurasi selesai, kamu dapat membuat blok Gantt.

![](<https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_27_AM%20(1).png>)

![](https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_27_AM.png)

## Pengaturan Blok

![](https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_28_AM.png)

### Field Gantt

Field Gantt menentukan bagaimana record dipetakan menjadi tugas di timeline.

Di antaranya:

- Field judul menentukan nama yang ditampilkan pada task bar
- Field tanggal mulai menentukan posisi awal task bar
- Field tanggal selesai menentukan posisi akhir task bar
- Field progres menentukan progres yang ditampilkan di dalam task bar
- Field warna menentukan warna task bar
- Skala waktu menentukan apakah timeline ditampilkan berdasarkan jam, hari, minggu, bulan, dan seterusnya

### Field Judul

Digunakan untuk menampilkan nama tugas. Biasanya kamu dapat memilih field teks seperti nama tugas, nama proyek, atau judul.

### Field Tanggal Mulai

Digunakan untuk menentukan waktu mulai tugas. Blok Gantt menggunakan field ini untuk menempatkan tugas pada timeline.

### Field Tanggal Selesai

Digunakan untuk menentukan waktu selesai tugas. Jika tanggal mulai dan tanggal selesai sama, tugas akan ditampilkan sebagai rentang waktu yang lebih pendek.

### Field Progres

Digunakan untuk menampilkan progres penyelesaian tugas, dan mendukung pembaruan dengan menarik progress handle pada task bar.

Field progres menggunakan field float. Data disimpan dari `0` hingga `1`, lalu ditampilkan sebagai persentase di blok Gantt. Misalnya, `0.6` ditampilkan sebagai `60%`.

### Field Warna

Digunakan untuk mengatur warna task bar agar tipe, status, atau prioritas tugas lebih mudah dibedakan.

Field warna mendukung:

- Field single select
- Field warna

Jika menggunakan field single select, blok Gantt akan memprioritaskan warna yang dikonfigurasi pada opsi yang dipilih.

### Skala Waktu

Digunakan untuk mengontrol granularitas tampilan timeline.

Saat ini mendukung:

- Jam
- Seperempat hari
- Setengah hari
- Hari
- Minggu
- Bulan
- Tahun
- Kuartal

Untuk rentang tugas pendek, gunakan jam, setengah hari, atau hari. Untuk rentang tugas panjang, gunakan minggu, bulan, kuartal, atau tahun.

### Tampilkan Tabel

Jika diaktifkan, blok Gantt menampilkan area tabel di sisi kiri. Kamu dapat mengonfigurasi kolom tabel untuk menampilkan atribut penting dari tugas.

Jika dinonaktifkan, blok hanya menampilkan timeline di sisi kanan. Ini cocok saat ruang halaman terbatas atau ketika kamu hanya perlu melihat jadwal.

### Lebar Tabel

Digunakan untuk mengatur lebar area tabel kiri. Pengaturan ini hanya muncul ketika Tampilkan tabel diaktifkan.

Jika field tabel cukup banyak, kamu dapat memperlebar tabel. Jika hanya mempertahankan sedikit field, kamu dapat memperkecil lebarnya dan memberi lebih banyak ruang untuk timeline.

### Aktifkan Drag untuk Menjadwalkan Ulang

Jika diaktifkan, kamu dapat menarik task bar di timeline untuk menyesuaikan tanggal mulai dan tanggal selesai.

Detailnya:

- Tarik seluruh task bar untuk menyesuaikan tanggal mulai dan tanggal selesai sekaligus
- Tarik handle di kedua sisi task bar untuk menyesuaikan tanggal mulai atau tanggal selesai
- Tarik progress handle untuk memperbarui field progres

Jika kamu tidak ingin pengguna mengubah jadwal langsung di blok Gantt, nonaktifkan opsi ini.

### Gulir ke Hari Ini Saat Pertama Ditampilkan

Jika diaktifkan, blok Gantt akan otomatis bergulir ke hari ini saat pertama kali ditampilkan.

Opsi ini cocok untuk proyek dengan rentang tugas yang panjang. Saat halaman dibuka, pengguna dapat langsung melihat tugas di sekitar tanggal saat ini.

### Pengaturan Popup Event

Digunakan untuk mengatur bagaimana task bar dibuka setelah diklik.

Kamu dapat mengatur:

- Mode buka, seperti drawer, dialog, atau halaman
- Ukuran popup
- Template popup

Setelah task bar diklik, NocoBase membuka record saat ini sesuai konfigurasi ini, sehingga detail tugas mudah dilihat atau diedit.

### Cakupan Data

Digunakan untuk membatasi data yang ditampilkan di blok Gantt.

Misalnya: hanya menampilkan tugas dalam proyek saat ini, atau hanya menampilkan tugas yang belum selesai.

Untuk detail lebih lanjut, lihat [Cakupan Data](../block-settings/data-scope).

### Ukuran Halaman

Digunakan untuk mengontrol jumlah record yang dimuat per halaman. Jika record cukup banyak, pengguna dapat berpindah halaman untuk melihat lebih banyak tugas.

### Tampilkan Nomor Baris

Jika diaktifkan, tabel kiri menampilkan nomor baris, sehingga record lebih mudah ditemukan saat ada banyak tugas.

### Tabel Pohon

Jika tabel data saat ini adalah tabel pohon, blok Gantt dapat mengaktifkan mode tabel pohon. Setelah diaktifkan, tabel kiri menampilkan record berdasarkan hierarki induk-anak, dan timeline di kanan menampilkan tugas dengan hierarki yang sama.

Dalam mode tabel pohon, kamu juga dapat mengatur Perluas semua baris secara default.

## Konfigurasi Field

Area tabel kiri menggunakan kolom tabel untuk menampilkan field record.

![](https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_29_AM.png)

### Tambahkan Field

Setelah Tampilkan tabel diaktifkan, kamu dapat menambahkan kolom field ke tabel kiri. Pengaturan field dapat merujuk ke [Kolom Tabel](../../fields/generic/table-column).

### Kolom Aksi

Blok Gantt menyertakan kolom aksi secara default. Kamu dapat menambahkan aksi record seperti lihat, edit, dan hapus ke kolom aksi.

Jika Pengaturan popup event sudah dikonfigurasi, kamu juga dapat mengklik task bar di sisi kanan untuk membuka detail record.

## Konfigurasi Aksi

Blok Gantt mendukung konfigurasi aksi global di bagian atas. Jenis aksi yang tersedia bergantung pada kemampuan yang diaktifkan di lingkungan saat ini.

![](<https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_29_AM%20(1).png>)

### Aksi Bawaan

- Hari ini: cepat bergulir ke hari ini
- Perluas/Ciutkan: memperluas atau menciutkan semua baris dalam mode tabel pohon

### Aksi Global

- [Tambah Baru](../../actions/types/add-new)
- [Popup](../../actions/types/pop-up)
- [Link](../../actions/types/link)
- [Refresh](../../actions/types/refresh)
- [Filter](../../actions/types/filter)
- [Edit Massal](../../actions/types/bulk-edit)
- [Update Massal](../../actions/types/bulk-update)
- [Picu Workflow](../../actions/types/trigger-workflow)
- [Request Kustom](../../actions/types/custom-request)
- [JS Item](../../actions/types/js-item)
- [JS Action](../../actions/types/js-action)
- [AI Employee](../../actions/types/ai-employee)
