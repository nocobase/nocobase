---
pkg: "@nocobase/plugin-calendar"
title: "Block Calendar"
description: "Block Calendar menampilkan event dan data tanggal dalam tampilan kalender, cocok untuk penjadwalan rapat dan perencanaan acara, dengan konfigurasi field judul, waktu mulai/selesai, kalender lunar, rentang data."
keywords: "block calendar,tampilan kalender,event,penjadwalan rapat,Calendar,NocoBase"
---
# Block Calendar

## Pengantar

Block Calendar menampilkan event dan data terkait tanggal dalam tampilan kalender, cocok untuk skenario seperti penjadwalan rapat dan perencanaan acara.

## Instalasi

Plugin bawaan, tidak perlu diinstal.

## Menambahkan Block

![20250403220300](https://static-docs.nocobase.com/20250403220300.png)

1. Field Judul: Digunakan untuk menampilkan informasi pada bilah kalender; saat ini mendukung tipe field `input`, `select`, `phone`, `email`, `radioGroup`, `sequence`, dan tipe lainnya dapat diperluas melalui plugin untuk mendukung lebih banyak tipe field judul pada Block Calendar.
2. Waktu Mulai: Waktu mulai task;
3. Waktu Selesai: Waktu selesai task;

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240419201640.mp4" type="video/mp4">
</video>


Klik bilah task, bilah task yang sama akan disorot, dan akan muncul popup.

![20240408171928](https://static-docs.nocobase.com/20240408171928.png)

## Opsi Konfigurasi Block

![20240419203321](https://static-docs.nocobase.com/20240419203321.png)

### Tampilkan Kalender Lunar

![20240419203603](https://static-docs.nocobase.com/20240419203603.png)

- 
- 

### Atur Rentang Data

![20240419203751](https://static-docs.nocobase.com/20240419203751.png)

Untuk lebih lanjut, lihat 

### Atur Tinggi Block

Contoh: Mengatur tinggi block kalender pesanan, scrollbar tidak akan muncul di dalam Block Calendar.

![20240605215742](https://static-docs.nocobase.com/20240605215742.gif)

Untuk lebih lanjut, lihat 

### Field Warna Latar Belakang

:::info{title=Tips}
Versi NocoBase yang dibutuhkan adalah v1.4.0-beta atau lebih tinggi.
:::

Opsi ini dapat digunakan untuk mengonfigurasi warna latar belakang event kalender. Cara penggunaannya sebagai berikut:

1. Collection calendar perlu memiliki field tipe **Single select** atau **Radio group** yang sudah dikonfigurasi dengan warna.
2. Lalu, kembali ke antarmuka konfigurasi Block Calendar, pada **Field Warna Latar Belakang**, pilih field yang baru saja dikonfigurasi dengan warna.
3. Terakhir, coba pilih warna untuk sebuah event kalender, lalu klik submit, Anda akan melihat warna sudah berlaku.

![20240914192017_rec_](https://static-docs.nocobase.com/20240914192017_rec_.gif)

### Hari Awal Minggu

> Didukung oleh versi v1.7.7 dan lebih tinggi 

Block Calendar mendukung pengaturan hari awal setiap minggu, dapat memilih **Minggu** atau **Senin** sebagai hari pertama dalam seminggu.  
Hari awal default adalah **Senin**, memudahkan pengguna untuk menyesuaikan tampilan kalender berdasarkan kebiasaan di berbagai wilayah, sesuai dengan kebutuhan penggunaan nyata.

![20250707165958](https://static-docs.nocobase.com/20250707165958.png)
## Operasi Konfigurasi

![20240419203424](https://static-docs.nocobase.com/20240419203424.png)

### Hari Ini

Tombol "Hari Ini" pada Block Calendar menyediakan fungsi navigasi yang nyaman, memungkinkan pengguna untuk dengan cepat kembali ke halaman kalender pada tanggal saat ini setelah berpindah ke tanggal lain.

![20240419203514](https://static-docs.nocobase.com/20240419203514.png)

### Ganti Tampilan

Default adalah bulan

![20240419203349](https://static-docs.nocobase.com/20240419203349.png)
