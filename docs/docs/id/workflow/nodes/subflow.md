---
pkg: '@nocobase/plugin-workflow-subflow'
title: "Node Workflow - Panggil Workflow"
description: "Node Panggil Workflow: memanggil sub-alur, meneruskan variable, menggunakan kembali logika alur, memecah alur."
keywords: "Workflow,Panggil Workflow,Subflow,sub-alur,reuse alur,NocoBase"
---

# Panggil Workflow

## Pengantar

Digunakan untuk memanggil alur lain di dalam sebuah workflow. Anda dapat menggunakan variable alur saat ini sebagai input untuk sub-alur, dan menggunakan output sub-alur sebagai variable alur saat ini untuk digunakan oleh Node berikutnya.

Proses pemanggilan workflow ditunjukkan pada gambar berikut:

![20241230134634](https://static-docs.nocobase.com/20241230134634.png)

Melalui pemanggilan workflow, Anda dapat menggunakan kembali logika alur umum, seperti pengiriman email, SMS, dll., atau memecah alur kompleks menjadi beberapa sub-alur untuk mempermudah pengelolaan dan pemeliharaan.

Pada dasarnya workflow tidak membedakan apakah suatu alur adalah sub-alur atau bukan, workflow apa pun dapat dipanggil sebagai sub-alur oleh alur lain, dan juga dapat memanggil alur lain. Semua workflow setara, hanya ada relasi pemanggil dan yang dipanggil.

Demikian juga, penggunaan pemanggilan workflow berada di dua posisi:

1. Pada alur utama: sebagai pemanggil, melalui Node "Panggil Workflow", memanggil workflow lain.
2. Pada sub-alur: sebagai yang dipanggil, melalui Node "Output Alur", menyimpan variable yang perlu di-output oleh alur saat ini, untuk digunakan pada Node berikutnya di workflow yang memanggil alur saat ini.

## Membuat Node

Pada antarmuka konfigurasi workflow, klik tombol plus ("+") pada alur untuk menambahkan Node "Panggil Workflow":

![Tambahkan Node Panggil Workflow](https://static-docs.nocobase.com/20241230001323.png)

## Konfigurasi Node

### Pilih Workflow

Pilih workflow yang akan dipanggil, Anda dapat mencarinya dengan cepat melalui kotak pencarian:

![Pilih Workflow](https://static-docs.nocobase.com/20241230001534.png)

:::info{title=Tips}
* Workflow yang belum diaktifkan juga dapat dipanggil sebagai sub-alur.
* Saat workflow saat ini dalam mode sinkron, hanya dapat memanggil sub-alur dalam mode sinkron juga.
:::

### Konfigurasi Variable Trigger Workflow

Setelah workflow dipilih, Anda perlu mengkonfigurasi variable trigger sebagai data input untuk memicu sub-alur. Anda dapat memilih data statis secara langsung, atau memilih variable dari alur saat ini:

![Konfigurasi Variable Trigger](https://static-docs.nocobase.com/20241230162722.png)

Variable yang diperlukan oleh tipe trigger yang berbeda juga berbeda, Anda dapat mengkonfigurasinya pada form sesuai kebutuhan.

## Node Output Alur

Silakan merujuk ke isi Node [Output Alur](./output.md), untuk mengkonfigurasi variable output sub-alur.

## Menggunakan Output Alur

Kembali ke alur utama, pada Node lainnya di bawah Node Panggil Workflow, saat ingin menggunakan nilai output sub-alur, Anda dapat memilih hasil Node Panggil Workflow. Jika output sub-alur adalah nilai sederhana, seperti string, angka, boolean, tanggal (tanggal dalam format string UTC), dll., dapat digunakan secara langsung; jika berupa objek kompleks (seperti objek dari tabel data), perlu diparse terlebih dahulu melalui Node JSON Query, baru properti di dalamnya dapat digunakan, jika tidak hanya dapat digunakan sebagai keseluruhan objek.

Jika sub-alur tidak mengkonfigurasi Node Output Alur, atau tidak memiliki nilai output, maka saat menggunakan hasil Node Panggil Workflow di alur utama, hanya akan mendapatkan nilai kosong (`null`).
