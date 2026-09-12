---
pkg: '@nocobase/plugin-workflow-parallel'
title: "Node Workflow - Cabang Paralel"
description: "Node Cabang Paralel: membagi alur menjadi beberapa cabang yang dieksekusi bersamaan, dapat dikonfigurasi mode cabang yang berbeda."
keywords: "Workflow,Cabang Paralel,Parallel,eksekusi konkuren,mode cabang,NocoBase"
---

# Cabang Paralel

Node Cabang Paralel dapat membagi alur menjadi beberapa cabang. Setiap cabang dapat dikonfigurasi dengan Node yang berbeda. Berdasarkan mode cabang yang berbeda, cara eksekusi cabang juga berbeda. Dalam skenario yang membutuhkan eksekusi beberapa operasi secara bersamaan, Anda dapat menggunakan Node Cabang Paralel.

## Instalasi

Plugin bawaan, tidak perlu instalasi.

## Membuat Node

Pada antarmuka konfigurasi workflow, klik tombol plus ("+") pada alur untuk menambahkan Node "Cabang Paralel":

![Cabang Paralel_Tambah](https://static-docs.nocobase.com/9e0f3faa0b9335270647a30477559eac.png)

Setelah Node Cabang Paralel ditambahkan ke dalam alur, secara default akan ditambahkan dua sub-cabang. Anda juga dapat mengklik tombol tambah cabang untuk menambah sebanyak mungkin cabang, setiap cabang dapat ditambahkan Node apa saja, dan cabang yang tidak diperlukan dapat dihapus dengan mengklik tombol hapus di awal cabang.

![Cabang Paralel_Manajemen Cabang](https://static-docs.nocobase.com/36088a8b7970c8a1771eb3ee9bc2a757.png)

## Konfigurasi Node

### Mode Cabang

Node Cabang Paralel memiliki tiga mode berikut:

- **Semua sukses**: semua cabang harus dieksekusi sukses, baru alur akan melanjutkan eksekusi Node setelah cabang berakhir. Sebaliknya, jika ada cabang yang berhenti lebih awal, baik gagal, error, atau status non-sukses lainnya, akan menyebabkan Node Cabang Paralel keseluruhan berhenti lebih awal dengan status tersebut, juga disebut "mode All".
- **Salah satu sukses**: salah satu cabang dieksekusi sukses, alur akan melanjutkan eksekusi Node setelah cabang berakhir. Kecuali semua cabang berhenti lebih awal, baik gagal, error, atau status non-sukses lainnya, baru akan menyebabkan Node Cabang Paralel keseluruhan berhenti lebih awal dengan status tersebut, juga disebut "mode Any".
- **Salah satu sukses dan gagal**: setelah salah satu cabang dieksekusi sukses, alur akan melanjutkan eksekusi Node setelah cabang berakhir, tetapi jika ada Node yang gagal, akan menyebabkan paralel keseluruhan berhenti lebih awal dengan status tersebut, juga disebut "mode Race".

Mode apa pun yang dipilih, akan mencoba mengeksekusi setiap cabang dari kiri ke kanan secara berurutan, sampai memenuhi kondisi terkait dari mode cabang yang ditetapkan, kemudian melanjutkan eksekusi Node berikutnya atau keluar lebih awal.

## Contoh

Lihat contoh pada [Node Penundaan](./delay.md).
