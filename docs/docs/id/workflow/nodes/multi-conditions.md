---
title: "Node Workflow - Cabang Multi-Kondisi"
description: "Node Cabang Multi-Kondisi: mirip switch/case, mengevaluasi kondisi secara berurutan, mengeksekusi cabang yang sesuai atau cabang else."
keywords: "Workflow,Cabang Multi-Kondisi,switch,case,cabang alur,NocoBase"
---

# Cabang Multi-Kondisi <Badge>v2.0.0+</Badge>

## Pengantar

Mirip dengan statement `switch / case` atau `if / else if` pada bahasa pemrograman. Sistem akan mengevaluasi beberapa kondisi yang dikonfigurasi secara berurutan satu per satu. Begitu salah satu kondisi terpenuhi, akan mengeksekusi alur pada cabang yang sesuai dan melewatkan evaluasi kondisi berikutnya. Jika semua kondisi tidak terpenuhi, akan mengeksekusi cabang "else".

## Membuat Node

Pada antarmuka konfigurasi workflow, klik tombol plus ("+") pada alur untuk menambahkan Node "Cabang Multi-Kondisi":

![Membuat Cabang Multi-Kondisi](https://static-docs.nocobase.com/20251123222134.png)

## Manajemen Cabang

### Cabang Default

Setelah Node dibuat, secara default berisi dua cabang:

1. **Cabang Kondisi**: dapat dikonfigurasi kondisi evaluasi yang spesifik.
2. **Cabang Else**: dimasuki saat semua cabang kondisi tidak terpenuhi, tidak perlu mengkonfigurasi kondisi.

Klik tombol "Tambah Cabang" di bawah Node, untuk menambah lebih banyak cabang kondisi.

![20251123222540](https://static-docs.nocobase.com/20251123222540.png)

### Menambah Cabang

Setelah klik "Tambah Cabang", cabang baru akan ditambahkan sebelum cabang "else".

![20251123222805](https://static-docs.nocobase.com/20251123222805.png)

### Menghapus Cabang

Saat ada beberapa cabang kondisi, klik ikon tempat sampah di sisi kanan cabang untuk menghapus cabang tersebut. Jika hanya tersisa satu cabang kondisi, tidak dapat dihapus.

![20251123223127](https://static-docs.nocobase.com/20251123223127.png)

:::info{title=Tips}
Menghapus cabang akan secara bersamaan menghapus semua Node di dalam cabang tersebut, harap dilakukan dengan hati-hati.

"Else" adalah cabang bawaan, tidak dapat dihapus.
:::

## Konfigurasi Node

### Konfigurasi Kondisi

Klik nama kondisi di bagian atas cabang, untuk mengedit isi kondisi yang spesifik:

![20251123223352](https://static-docs.nocobase.com/20251123223352.png)

#### Label Kondisi

Mendukung label kustom. Jika diisi, akan ditampilkan sebagai nama kondisi pada diagram alur. Jika tidak dikonfigurasi (atau dibiarkan kosong), secara default akan ditampilkan secara berurutan sebagai "Kondisi 1", "Kondisi 2", dll.

![20251123224209](https://static-docs.nocobase.com/20251123224209.png)

#### Engine Komputasi

Saat ini mendukung tiga engine:

- **Basic**: melalui perbandingan logika sederhana (seperti sama dengan, mengandung, dll.) dan kombinasi "dan", "atau", untuk menghasilkan hasil evaluasi.
- **Math.js**: mendukung evaluasi expression dengan sintaks [Math.js](https://mathjs.org/).
- **Formula.js**: mendukung evaluasi expression dengan sintaks [Formula.js](https://formulajs.info/) (mirip dengan formula Excel).

Ketiga mode mendukung penggunaan variable konteks alur sebagai parameter.

### Saat Semua Kondisi Tidak Terpenuhi

Pada panel konfigurasi Node, dapat diatur aksi selanjutnya saat semua kondisi tidak terpenuhi:

![20251123224348](https://static-docs.nocobase.com/20251123224348.png)

* **Akhiri workflow dengan gagal (default)**: menandai status workflow sebagai gagal, dan menghentikan alur.
* **Lanjutkan eksekusi Node berikutnya**: setelah eksekusi Node saat ini selesai, melanjutkan eksekusi Node berikutnya pada workflow.

:::info{title=Tips}
Apa pun cara penanganan yang dipilih, saat semua kondisi tidak terpenuhi, alur akan terlebih dahulu masuk ke cabang "else" untuk mengeksekusi Node di dalamnya.
:::

## Catatan Eksekusi

Pada catatan eksekusi workflow, Node Cabang Multi-Kondisi mengidentifikasi hasil evaluasi setiap kondisi melalui warna yang berbeda:

- **Hijau**: kondisi terpenuhi, masuk ke cabang tersebut untuk dieksekusi.
- **Merah**: kondisi tidak terpenuhi (atau komputasi error), melewatkan cabang tersebut.
- **Biru**: belum dieksekusi evaluasi (karena kondisi sebelumnya sudah terpenuhi, sehingga melewatkan evaluasi berikutnya).

![20251123225455](https://static-docs.nocobase.com/20251123225455.png)

Jika karena kesalahan konfigurasi terjadi anomali komputasi kondisi, selain ditampilkan dalam warna merah, saat mouse hover pada nama kondisi akan ditampilkan informasi error yang spesifik:

![20251123231014](https://static-docs.nocobase.com/20251123231014.png)

Saat terjadi anomali komputasi kondisi, Node Cabang Multi-Kondisi akan berakhir dengan status "error", dan tidak akan melanjutkan eksekusi Node berikutnya.
