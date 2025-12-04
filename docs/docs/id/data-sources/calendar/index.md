---
pkg: "@nocobase/plugin-calendar"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Blok Kalender

## Pendahuluan

Blok Kalender menampilkan data terkait acara dan tanggal dalam tampilan kalender. Ini sangat cocok untuk skenario seperti penjadwalan rapat, perencanaan acara, dan pengelolaan waktu.

## Instalasi

Plugin ini sudah terpasang secara bawaan, jadi tidak perlu instalasi tambahan.

## Menambahkan Blok

![20250403220300](https://static-docs.nocobase.com/20250403220300.png)

1.  Bidang Judul: Digunakan untuk menampilkan informasi pada bilah kalender. Saat ini, mendukung tipe bidang seperti `input`, `select`, `phone`, `email`, `radioGroup`, dan `sequence`. Tipe bidang judul yang didukung dapat diperluas melalui plugin.
2.  Waktu Mulai: Menunjukkan kapan tugas dimulai;
3.  Waktu Selesai: Menandai kapan tugas berakhir;

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240419201640.mp4" type="video/mp4">
</video>

Mengklik bilah tugas akan menyorot pilihan dan membuka jendela pop-up detail.

![20240408171928](https://static-docs.nocobase.com/20240408171928.png)

## Opsi Konfigurasi Blok

![20240419203321](https://static-docs.nocobase.com/20240419203321.png)

### Tampilkan Kalender Lunar

![20240419203603](https://static-docs.nocobase.com/20240419203603.png)

- 
- 

### Atur Rentang Data

![20240419203751](https://static-docs.nocobase.com/20240419203751.png)

Untuk informasi lebih lanjut, lihat .

### Atur Tinggi Blok

Contoh: Sesuaikan tinggi blok kalender pesanan. Bilah gulir tidak akan muncul di dalam blok kalender.

![20240605215742](https://static-docs.nocobase.com/20240605215742.gif)

Untuk informasi lebih lanjut, lihat .

### Bidang Warna Latar Belakang

:::info{title=Tip}
Versi NocoBase yang diperlukan adalah v1.4.0-beta atau lebih tinggi.
:::

Opsi ini dapat digunakan untuk mengonfigurasi warna latar belakang acara kalender. Berikut cara menggunakannya:

1.  Tabel data kalender perlu memiliki bidang bertipe **Pilihan Tunggal (Single select)** atau **Grup Radio (Radio group)**, dan bidang ini perlu dikonfigurasi dengan warna.
2.  Kemudian, kembali ke antarmuka konfigurasi blok kalender dan pilih bidang yang baru saja Anda konfigurasikan warnanya di **Bidang Warna Latar Belakang**.
3.  Terakhir, Anda bisa mencoba memilih warna untuk acara kalender dan klik kirim. Anda akan melihat bahwa warna tersebut telah diterapkan.

![20240914192017_rec_](https://static-docs.nocobase.com/20240914192017_rec_.gif)

### Hari Mulai Minggu

> Didukung di versi v1.7.7 dan yang lebih tinggi

Blok kalender mendukung pengaturan hari mulai minggu, memungkinkan Anda memilih **Minggu** atau **Senin** sebagai hari pertama dalam seminggu.
Hari mulai bawaan adalah **Senin**, memudahkan pengguna untuk menyesuaikan tampilan kalender sesuai kebiasaan regional agar lebih sesuai dengan kebutuhan penggunaan.

![20250707165958](https://static-docs.nocobase.com/20250707165958.png)

## Konfigurasi Aksi

![20240419203424](https://static-docs.nocobase.com/20240419203424.png)

### Hari Ini

Tombol "Hari Ini" di Blok Kalender menawarkan navigasi cepat, memungkinkan pengguna untuk langsung kembali ke tanggal saat ini setelah menjelajahi tanggal lain.

![20240419203514](https://static-docs.nocobase.com/20240419203514.png)

### Ganti Tampilan

Tampilan bawaan diatur ke Bulan.

![20240419203349](https://static-docs.nocobase.com/20240419203349.png)