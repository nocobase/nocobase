---
pkg: "@nocobase/plugin-calendar"
title: "Blok kalender"
description: "Blok kalender menampilkan data peristiwa dan tanggal dalam tampilan kalender, cocok untuk penjadwalan rapat, perencanaan aktivitas, serta konfigurasi bidang judul, waktu mulai/selesai, kalender lunar, dan cakupan data."
keywords: "Blok kalender,Tampilan kalender,Peristiwa,Penjadwalan rapat,Calendar,NocoBase"
---
# Blok kalender

## Pengenalan

Blok kalender menampilkan data yang berkaitan dengan peristiwa dan tanggal dalam tampilan kalender, cocok untuk skenario seperti penjadwalan rapat dan perencanaan aktivitas.

## Pemasangan

Plugin bawaan, tidak perlu dipasang.

## Menambahkan blok

![20250403220300](https://static-docs.nocobase.com/20250403220300.png)

1. BIdang judul: digunakan untuk menampilkan informasi pada batang kalender; saat ini mendukung jenis bidang `input`, `select`, `phone`, `email`, `radioGroup`,`sequence`, dan jenis lainnya. Jenis bidang judul yang didukung oleh blok kalender dapat diperluas melalui plugin.
2. Waktu mulai: waktu mulai tugas;
3. Waktu selesai: waktu selesai tugas;

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240419201640.mp4" type="video/mp4">
</video>


Klik batang tugas, batang tugas yang sama akan disorot dan jendela pop-up akan ditampilkan.

![20240408171928](https://static-docs.nocobase.com/20240408171928.png)

## Item konfigurasi blok

![20240419203321](https://static-docs.nocobase.com/20240419203321.png)

### Menampilkan kalender lunar

![20240419203603](https://static-docs.nocobase.com/20240419203603.png)

-
-

### Atur cakupan data

![20240419203751](https://static-docs.nocobase.com/20240419203751.png)

Lihat referensi lainnya

### Atur tinggi blok

Contoh: sesuaikan tinggi blok kalender pesanan agar tidak muncul bilah gulir di dalam blok kalender.

![20240605215742](https://static-docs.nocobase.com/20240605215742.gif)

Lihat referensi lainnya

### BIdang warna latar belakang

:::info{title=提示}
Diperlukan NocoBase versi v1.4.0-beta atau lebih tinggi.
:::

Opsi ini dapat digunakan untuk mengonfigurasi warna latar belakang peristiwa kalender. Cara penggunaannya adalah sebagai berikut:

1. Tabel data kalender harus memiliki bidang bertipe **Pilihan tunggal (Single select)** atau **Grup radio (Radio group)**, dan bidang tersebut harus dikonfigurasi dengan warna.
2. Kemudian, kembali ke antarmuka konfigurasi blok kalender, lalu pilih bidang yang baru saja dikonfigurasi dengan warna pada **bidang warna latar belakang**.
3. Terakhir, coba pilih warna untuk sebuah peristiwa kalender, lalu klik kirim. Anda akan melihat bahwa warna tersebut telah diterapkan.

![20240914192017_rec_](https://static-docs.nocobase.com/20240914192017_rec_.gif)

### Hari mulai minggu

> V1.7.7 dan versi lebih tinggi mendukung

Blok kalender mendukung pengaturan hari mulai setiap minggu. Anda dapat memilih **Minggu** atau **Senin** sebagai hari pertama dalam seminggu.
Hari mulai default adalah **Senin**, sehingga pengguna dapat menyesuaikan tampilan kalender berdasarkan kebiasaan di berbagai wilayah dan memenuhi kebutuhan penggunaan nyata.

![20250707165958](https://static-docs.nocobase.com/20250707165958.png)
## Konfigurasi operasi

![20240419203424](https://static-docs.nocobase.com/20240419203424.png)

### Hari ini

Tombol "Hari ini" pada blok kalender menyediakan fungsi navigasi yang praktis, sehingga pengguna dapat dengan cepat kembali ke halaman kalender yang berisi tanggal saat ini setelah berpindah ke tanggal lain.

![20240419203514](https://static-docs.nocobase.com/20240419203514.png)

### Beralih tampilan

Defaultnya adalah bulan

![20240419203349](https://static-docs.nocobase.com/20240419203349.png)
