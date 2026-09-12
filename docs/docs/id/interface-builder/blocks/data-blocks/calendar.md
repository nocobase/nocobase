---
pkg: "@nocobase/plugin-calendar"
title: "Block Calendar"
description: "Block Calendar menampilkan event dan data terkait tanggal dalam tampilan kalender, cocok untuk skenario seperti penjadwalan rapat dan perencanaan acara, mendukung konfigurasi Field judul, waktu mulai-selesai, tampilan kalender lunar, dan cakupan data."
keywords: "Block Calendar, tampilan kalender, manajemen event, penjadwalan rapat, Calendar, NocoBase"
---

# Block Calendar

## Pengantar

Block Calendar menampilkan event dan data terkait tanggal dalam tampilan kalender yang intuitif, cocok untuk skenario tipikal seperti penjadwalan rapat, perencanaan acara, dll.

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_27_PM.png)

## Instalasi

Block ini adalah Plugin bawaan, tidak memerlukan instalasi tambahan.

## Menambahkan Block

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_39_PM.png)

Pilih Block "Calendar", dan tentukan Collection yang sesuai untuk menyelesaikan pembuatan.

## Konfigurasi Block

![](https://static-docs.nocobase.com/Calendar-04-23-2026_10_38_AM.png)

### Field Judul

Digunakan untuk menampilkan informasi judul di event bar kalender.

Tipe Field yang saat ini didukung meliputi: `input`, `select`, `phone`, `email`, `radioGroup`, `sequence`, dll. Juga mendukung ekstensi tipe lebih banyak melalui Plugin.

### Field Tanggal Mulai

Digunakan untuk menentukan waktu mulai event.

### Field Tanggal Selesai

Digunakan untuk menentukan waktu selesai event.

### Buat Event Cepat

Klik pada area tanggal kosong di kalender untuk dengan cepat memunculkan layer untuk membuat event.

![](https://static-docs.nocobase.com/Add-new-04-23-2026_10_39_AM.png)

Saat mengklik event yang sudah ada:
- Event saat ini akan disorot
- Sekaligus memunculkan jendela detail untuk memudahkan dilihat atau diedit

### Tampilkan Kalender Lunar

Setelah diaktifkan, kalender akan menampilkan informasi kalender lunar yang sesuai.

![](https://static-docs.nocobase.com/Calendar-04-23-2026_10_41_AM.png)

### Cakupan Data

Digunakan untuk membatasi cakupan data yang ditampilkan di Block Calendar.

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_30_PM.png)

Untuk penjelasan lebih lanjut, lihat: [Atur Cakupan Data](/interface-builder/blocks/block-settings/data-scope)

### Tinggi Block

Anda dapat menyesuaikan tinggi Block Calendar untuk menghindari munculnya scrollbar internal, meningkatkan pengalaman layout secara keseluruhan.

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_30_PM%20(1).png)

Untuk penjelasan lebih lanjut, lihat: [Tinggi Block](/interface-builder/blocks/block-settings/block-height)

### Field Warna

Digunakan untuk mengkonfigurasi warna latar belakang event kalender, meningkatkan diferensiasi visual.

Langkah penggunaan:

1. Tambahkan Field **Single select** atau **Radio group** baru di Collection, dan konfigurasi warna untuk opsi-opsinya;
2. Di konfigurasi Block Calendar, atur Field tersebut sebagai "Field Warna";
3. Saat membuat atau mengedit event, pilih warna untuk diterapkan di kalender.

![](https://static-docs.nocobase.com/Calendar-04-23-2026_10_41_AM%20(1).png)

### Hari Awal Minggu

Mendukung pengaturan hari awal setiap minggu, dapat dipilih:
- Minggu
- Senin (default)

Dapat disesuaikan dengan kebiasaan penggunaan di berbagai wilayah, membuat tampilan kalender lebih sesuai dengan kebutuhan aktual.


## Konfigurasi Action

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_32_PM.png)

### Hari Ini

Klik tombol "Hari Ini" untuk dengan cepat melompat kembali ke tampilan kalender pada tanggal saat ini.

### Ganti Halaman

Beralih waktu berdasarkan mode tampilan saat ini:
- Tampilan bulan: Bulan sebelumnya / Bulan berikutnya
- Tampilan minggu: Minggu sebelumnya / Minggu berikutnya
- Tampilan hari: Kemarin / Besok

### Pilih Tampilan

Mendukung beralih antara tampilan berikut:
- Tampilan bulan (default)
- Tampilan minggu
- Tampilan hari

### Judul

Digunakan untuk menampilkan tanggal yang sesuai dengan tampilan saat ini.
