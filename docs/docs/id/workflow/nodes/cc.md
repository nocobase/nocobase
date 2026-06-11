---
pkg: '@nocobase/plugin-workflow-cc'
title: "Node Workflow - CC"
description: "Node CC: mengirim konten konteks alur ke pengguna yang ditentukan, ditampilkan di pusat tugas 'CC ke Saya'."
keywords: "Workflow,CC,CC ke saya,pusat tugas,NocoBase"
---

# CC <Badge>v1.8.2+</Badge>

## Pengantar

Node CC digunakan untuk mengirimkan konten konteks tertentu selama proses eksekusi Workflow ke pengguna yang ditentukan, untuk diketahui dan ditinjau. Misalnya dalam alur persetujuan atau alur lainnya, dapat mengirimkan informasi terkait kepada peserta lain, agar mereka dapat segera mengetahui kemajuan pekerjaan.

Anda dapat mengatur beberapa Node CC dalam Workflow, sehingga ketika Workflow dieksekusi sampai Node tersebut, mengirimkan informasi terkait ke penerima yang ditentukan.

Konten CC akan ditampilkan di menu "CC ke Saya" di pusat tugas, pengguna dapat melihat semua konten yang di-CC ke dirinya di sini. Dan akan memberi tip pengguna konten CC yang belum dilihat berdasarkan status belum dibaca, setelah pengguna melihat dapat secara aktif menandai sebagai sudah dibaca.

## Membuat Node

Pada antarmuka konfigurasi Workflow, klik tombol plus ("+") di alur, tambahkan Node "CC":

![CC_tambah](https://static-docs.nocobase.com/20250710222842.png)

## Konfigurasi Node

![Konfigurasi Node](https://static-docs.nocobase.com/20250710224041.png)

Pada antarmuka konfigurasi Node, dapat mengatur parameter berikut:

### Penerima

Penerima adalah kumpulan pengguna objek CC, dapat satu atau beberapa pengguna. Sumber pemilihan dapat berupa nilai statis yang dipilih dari daftar pengguna, atau juga nilai dinamis yang ditentukan oleh variabel, atau juga hasil kueri tabel pengguna.

![Konfigurasi penerima](https://static-docs.nocobase.com/20250710224421.png)

### Antarmuka Pengguna

Penerima perlu melihat konten CC di menu "CC ke Saya" pusat tugas. Dapat mengonfigurasi Trigger pada konteks alur dan hasil Node manapun sebagai Block konten.

![Antarmuka pengguna](https://static-docs.nocobase.com/20250710225400.png)

### Kartu Tugas <Badge>2.0+</Badge>

Dapat digunakan untuk mengonfigurasi kartu tugas dalam daftar "CC ke Saya" pusat tugas.

![20260213010947](https://static-docs.nocobase.com/20260213010947.png)

Pada kartu dapat dengan bebas mengonfigurasi field bisnis (kecuali field relasi) yang ingin ditampilkan.

Setelah tugas CC Workflow dibuat, daftar pusat tugas dapat melihat kartu tugas kustom:

![20260214124325](https://static-docs.nocobase.com/20260214124325.png)

### Judul Tugas

Judul tugas adalah judul yang ditampilkan di pusat tugas, dapat menggunakan variabel pada konteks alur untuk menghasilkan judul secara dinamis.

![Judul tugas](https://static-docs.nocobase.com/20250710225603.png)

## Pusat Tugas

Pengguna dapat melihat dan mengelola semua konten yang di-CC ke dirinya di pusat tugas, dan memfilter dan melihat berdasarkan status pembacaan.

![20250710232932](https://static-docs.nocobase.com/20250710232932.png)

![20250710233032](https://static-docs.nocobase.com/20250710233032.png)

Setelah dilihat dapat ditandai sebagai sudah dibaca, jumlah yang belum dibaca akan berkurang sesuai.

![20250710233102](https://static-docs.nocobase.com/20250710233102.png)
