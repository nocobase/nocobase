---
pkg: '@nocobase/plugin-workflow-date-calculation'
title: "Node Workflow - Komputasi Tanggal"
description: "Node komputasi tanggal: penambahan/pengurangan periode, format, konversi unit, dan sembilan fungsi komputasi, mendukung pipa berantai."
keywords: "Workflow,komputasi tanggal,Date,format waktu,pipa berantai,NocoBase"
---

# Komputasi Tanggal

## Pengantar

Node komputasi tanggal menyediakan sembilan fungsi komputasi termasuk penambahan periode, pengurangan periode, output format string waktu, konversi unit durasi. Setiap fungsi memiliki tipe nilai input dan output spesifik, sambil dapat menerima hasil Node lain sebagai variabel parameter, dan dengan cara pipa komputasi, hasil komputasi fungsi yang dikonfigurasi dirangkai bersama, akhirnya mendapatkan output yang diharapkan.

## Membuat Node

Pada antarmuka konfigurasi Workflow, klik tombol plus ("+") di alur, tambahkan Node "Komputasi Waktu":

![Node komputasi tanggal_buat Node](https://static-docs.nocobase.com/[image].png)

## Konfigurasi Node

![Node komputasi tanggal_konfigurasi Node](https://static-docs.nocobase.com/20240817184423.png)

### Nilai Input

Nilai input dapat memilih variabel atau konstanta tanggal. Variabel dapat berupa data yang memicu Workflow ini, atau juga hasil Node hulu dalam Workflow ini. Konstanta dapat memilih tanggal apa pun.

### Tipe Nilai Input

Merepresentasikan tipe nilai input, ada dua nilai.

* Tipe Tanggal: yaitu nilai input yang akhirnya dapat dikonversi ke tipe tanggal waktu, seperti timestamp tipe numerik atau string yang merepresentasikan waktu.
* Tipe Numerik: karena tipe nilai input akan memengaruhi pemilihan langkah komputasi waktu di bawah, perlu memilih tipe nilai input dengan benar.

### Langkah Komputasi

Setiap langkah komputasi terdiri dari satu fungsi komputasi dan konfigurasi parameternya, sambil menggunakan desain pipa, hasil yang diperoleh komputasi fungsi sebelumnya akan menjadi nilai input fungsi berikutnya untuk terus berpartisipasi dalam komputasi. Dengan cara ini, dapat menyelesaikan serangkaian komputasi dan konversi waktu.

Setelah setiap langkah komputasi, tipe output juga tetap, dan akan memengaruhi fungsi yang dapat digunakan langkah komputasi berikutnya. Tipe harus cocok baru dapat melanjutkan komputasi. Jika tidak hasil suatu langkah akan menjadi hasil output Node akhir.

## Fungsi Komputasi

### Tambah Periode

- Tipe Nilai Input yang Diterima: tanggal
- Parameter
  - Jumlah yang ditambah, dapat mengisi angka, atau memilih variabel bawaan Node.
  - Unit waktu.
- Tipe Nilai Output: tanggal
- Contoh: nilai input `2024-7-15 00:00:00`, jumlah `1`, unit "hari", maka hasil komputasi adalah `2024-7-16 00:00:00`.

### Kurangi Periode

- Tipe Nilai Input yang Diterima: tanggal
- Parameter
  - Jumlah yang dikurangi, dapat mengisi angka, atau memilih variabel bawaan Node.
  - Unit waktu.
- Tipe Nilai Output: tanggal
- Contoh: nilai input `2024-7-15 00:00:00`, jumlah `1`, unit "hari", maka hasil komputasi adalah `2024-7-14 00:00:00`.

### Hitung Selisih dengan Waktu Lain

- Tipe Nilai Input yang Diterima: tanggal
- Parameter
  - Tanggal yang akan dihitung selisihnya, dapat memilih konstanta tanggal, atau memilih variabel di konteks Workflow.
  - Unit waktu.
  - Apakah ambil nilai absolut.
  - Operasi pembulatan: dapat memilih simpan desimal, pembulatan, pembulatan ke atas, dan pembulatan ke bawah.
- Tipe Nilai Output: numerik
- Contoh: nilai input `2024-7-15 00:00:00`, objek perbandingan `2024-7-16 06:00:00`, unit "hari", tidak ambil nilai absolut, simpan desimal, maka hasil komputasi adalah `-1.25`.

:::info{title=Tips}
Saat nilai absolut dan pembulatan dikonfigurasi bersamaan, akan diambil nilai absolut dulu baru pembulatan.
:::

### Ambil Nilai Waktu pada Unit Tertentu

- Tipe Nilai Input yang Diterima: tanggal
- Parameter
  - Unit waktu.
- Tipe Nilai Output: numerik
- Contoh: nilai input `2024-7-15 00:00:00`, unit "hari", maka hasil komputasi adalah `15`.

### Atur Tanggal sebagai Awal Unit Tertentu

- Tipe Nilai Input yang Diterima: tanggal
- Parameter
  - Unit waktu.
- Tipe Nilai Output: tanggal
- Contoh: nilai input `2024-7-15 14:26:30`, unit "hari". Maka hasil komputasi adalah `2024-7-15 00:00:00`

### Atur Tanggal sebagai Akhir Unit Tertentu

- Tipe Nilai Input yang Diterima: tanggal
- Parameter
  - Unit waktu.
- Tipe Nilai Output: tanggal
- Contoh: nilai input `2024-7-15 14:26:30`, unit "hari". Maka hasil komputasi adalah `2024-7-15 23:59:59`

### Cek Tahun Kabisat

- Tipe Nilai Input yang Diterima: tanggal
- Parameter
  - Tanpa parameter
- Tipe Nilai Output: boolean
- Contoh: nilai input `2024-7-15 14:26:30`, maka hasil komputasi adalah `true`.

### Format ke String

- Tipe Nilai Input yang Diterima: tanggal
- Parameter
  - Format, lihat [Day.js: Format](https://day.js.org/docs/en/display/format)
- Tipe Nilai Output: string
- Contoh: nilai input `2024-7-15 14:26:30`, format `the time is YYYY/MM/DD HH:mm:ss`, maka hasil komputasi adalah `the time is 2024/07/15 14:26:30`.

### Konversi Unit

- Tipe Nilai Input yang Diterima: numerik
- Parameter
  - Unit waktu sebelum konversi.
  - Unit waktu setelah konversi.
  - Operasi pembulatan, dapat memilih simpan desimal, pembulatan, pembulatan ke atas, dan pembulatan ke bawah.
- Tipe Nilai Output: numerik
- Contoh: nilai input `2`, unit sebelum konversi "minggu", unit setelah konversi "hari", tidak simpan desimal, maka hasil komputasi adalah `14`.

## Contoh

![Node komputasi tanggal_contoh](https://static-docs.nocobase.com/20240817184137.png)

Misalkan ada acara promosi, kita ingin saat setiap produk dibuat dapat menambahkan waktu akhir acara promosi pada field produk. Waktu akhir ini adalah pada hari terakhir minggu setelah waktu pembuatan produk pukul 23:59:59, jadi kita dapat membuat dua fungsi waktu, dan menjalankannya dengan cara pipa:

- Hitung waktu minggu depan
- Reset hasil yang diperoleh ke hari terakhir minggunya pukul 23:59:59

Dengan demikian kita mendapatkan nilai waktu yang diharapkan, dan diteruskan ke Node berikutnya, misalnya Node modifikasi tabel data, menambahkan waktu akhir acara promosi ke tabel data.
