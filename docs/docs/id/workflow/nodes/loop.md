---
pkg: '@nocobase/plugin-workflow-loop'
title: "Node Workflow - Loop"
description: "Node Loop: mirip for/while/forEach, mengulang eksekusi operasi berdasarkan jumlah kali atau koleksi data."
keywords: "Workflow,Loop,forEach,eksekusi berulang,NocoBase"
---

# Loop

## Pengantar

Loop setara dengan struktur sintaks `for`/`while`/`forEach` dalam bahasa pemrograman. Saat perlu mengulang eksekusi beberapa operasi sebanyak jumlah tertentu atau terhadap koleksi data tertentu (array), Anda dapat menggunakan Node Loop.

## Instalasi

Plugin bawaan, tidak perlu instalasi.

## Membuat Node

Pada antarmuka konfigurasi workflow, klik tombol plus ("+") pada alur untuk menambahkan Node "Loop":

![Membuat Node Loop](https://static-docs.nocobase.com/b3c8061a66bfff037f4b9509ab0aad75.png)

Setelah Node Loop dibuat, akan dihasilkan sebuah cabang internal Loop. Anda dapat menambahkan Node sebanyak yang diinginkan ke dalam cabang. Selain dapat menggunakan variable konteks alur, Node-Node ini juga dapat menggunakan variable lokal dari konteks Loop, misalnya objek data setiap iterasi pada koleksi Loop, atau index jumlah Loop (index dimulai dari `0`). Scope variable lokal terbatas hanya pada bagian dalam Loop. Jika ada beberapa Loop yang nested, dapat menggunakan variable lokal dari Loop spesifik per layer.

## Konfigurasi Node

![20241016135326](https://static-docs.nocobase.com/20241016135326.png)

### Objek Loop

Loop akan melakukan pemrosesan yang berbeda berdasarkan tipe data objek Loop yang berbeda:

1.  **Array**: kasus paling umum, biasanya dapat memilih variable konteks alur, seperti hasil multi-data dari Node Query, atau data relasi to-many yang di-pre-load. Jika yang dipilih adalah array, Node Loop akan iterasi setiap elemen dalam array, setiap kali iterasi akan meng-assign elemen saat ini ke variable lokal konteks Loop.

2.  **Angka**: saat variable yang dipilih adalah angka, akan menggunakan angka tersebut sebagai jumlah Loop. Value angka hanya mendukung integer positif, angka negatif tidak akan masuk ke Loop, bagian desimal akan diabaikan. Index jumlah Loop pada variable lokal juga merupakan value objek Loop. Value tersebut dimulai dari **0**, misalnya saat angka objek Loop adalah 5, objek dan index pada setiap iterasi berturut-turut adalah: 0, 1, 2, 3, 4.

3.  **String**: saat variable yang dipilih adalah string, akan menggunakan panjang string tersebut sebagai jumlah Loop, setiap iterasi akan memproses setiap karakter dalam string berdasarkan index.

4.  **Lainnya**: tipe value lainnya (termasuk tipe object) hanya akan diperlakukan sebagai objek Loop pemrosesan tunggal, dan hanya akan dilakukan Loop sekali. Biasanya kasus ini tidak perlu menggunakan Loop.

Selain memilih variable, untuk tipe angka dan string juga dapat langsung memasukkan konstanta. Misalnya memasukkan `5` (tipe angka), Node Loop akan loop sebanyak 5 kali. Memasukkan `abc` (tipe string), Node Loop akan loop sebanyak 3 kali, masing-masing memproses 3 karakter `a`, `b`, `c`. Pilih tipe yang ingin Anda gunakan sebagai konstanta pada tool pemilihan variable.

### Kondisi Loop

Sejak versi `v1.4.0-beta`, ditambahkan opsi terkait kondisi Loop. Anda dapat mengaktifkan kondisi Loop pada konfigurasi Node.

**Kondisi**

Mirip dengan konfigurasi kondisi pada Node Kondisi, dapat dikombinasikan dan dikonfigurasi, dan dapat menggunakan variable dalam Loop saat ini, seperti objek Loop, index Loop, dll.

**Waktu Pemeriksaan**

Mirip dengan `while` dan `do/while` pada bahasa pemrograman. Dapat dipilih untuk dilakukan komputasi kondisi yang dikonfigurasi sebelum memulai setiap Loop, atau setelah setiap Loop berakhir. Komputasi kondisi setelah dapat mengeksekusi Node lain di dalam body Loop terlebih dahulu satu putaran, baru kemudian melakukan evaluasi kondisi.

**Saat Kondisi Tidak Terpenuhi**

Mirip dengan statement `break` dan `continue` pada bahasa pemrograman, dapat dipilih untuk keluar dari Loop, atau melanjutkan Loop ke iterasi berikutnya.

### Penanganan Saat Node Internal Loop Error

Sejak versi `v1.4.0-beta`, saat eksekusi Node internal Loop gagal (kondisi tidak terpenuhi konfigurasi, error, dll.), dapat dikonfigurasi untuk menentukan arah selanjutnya. Mendukung tiga cara penanganan:

* Keluar dari alur (`throw` dalam pemrograman)
* Keluar dari Loop dan lanjutkan alur (`break` dalam pemrograman)
* Lanjutkan ke objek Loop berikutnya (`continue` dalam pemrograman)

Default adalah "Keluar dari alur", dapat dipilih sesuai kebutuhan.

## Environment Variable

### WORKFLOW_LOOP_LIMIT

Digunakan oleh role ops untuk membatasi jumlah maksimum Loop pada Node Loop, mencegah masalah infinite loop akibat kesalahan konfigurasi. Default tidak dibatasi, dapat dikonfigurasi melalui environment variable ini.

```ini
# Batasi maksimum 100 kali Loop
WORKFLOW_LOOP_LIMIT=100
```

Jika value batasan diatur, saat eksekusi Node Loop melebihi jumlah tersebut, akan langsung melaporkan error dan keluar dari alur. Dan pada hasil Node akan berisi informasi `exceeded`, dengan value true.

## Contoh

Misalnya saat order pesanan, perlu dilakukan pengecekan stok untuk setiap produk dalam pesanan. Jika stok mencukupi maka kurangi stok, jika tidak maka update produk dalam detail pesanan menjadi tidak valid.

1.  Buat tiga tabel, tabel produk <-(1:m)-- tabel detail pesanan --(m:1)-> tabel pesanan, dengan model data sebagai berikut:

    | Nama Field   | Tipe Field        |
    | ------------ | ----------------- |
    | Detail Produk Pesanan | Many-to-one (Detail) |
    | Total Harga Pesanan | Angka |

    | Nama Field | Tipe Field        |
    | ---------- | ----------------- |
    | Produk     | One-to-many (Produk) |
    | Jumlah     | Angka |

    | Nama Field | Tipe Field |
    | ---------- | ---------- |
    | Nama Produk | Text Single Line |
    | Harga      | Angka      |
    | Stok       | Integer    |

2.  Buat workflow, trigger pilih "Event Tabel Data", pilih tabel "Pesanan" "Saat menambah data" untuk trigger, dan perlu dikonfigurasi pre-load data relasi tabel "Detail Pesanan" dan tabel produk di bawah detail:

    ![Node Loop_Contoh_Konfigurasi Trigger](https://static-docs.nocobase.com/0086601c2fc0e17a64d046a4c86b49b7.png)

3.  Buat Node Loop, pilih objek Loop sebagai "Data Trigger / Detail Pesanan", yaitu untuk setiap record pada tabel detail pesanan:

    ![Node Loop_Contoh_Konfigurasi Node Loop](https://static-docs.nocobase.com/2507becc32db5a9a0641c198605a20da.png)

4.  Pada bagian dalam Node Loop buat sebuah Node "Kondisi", untuk mengevaluasi apakah stok produk mencukupi:

    ![Node Loop_Contoh_Konfigurasi Node Kondisi](https://static-docs.nocobase.com/a6d08d15786841e1a3512b38e4629852.png)

5.  Jika mencukupi, pada cabang "Ya" buat sebuah "Node Komputasi" dan sebuah Node "Update Data", untuk meng-update stok yang sudah dikurangi ke record produk yang sesuai:

    ![Node Loop_Contoh_Konfigurasi Node Komputasi](https://static-docs.nocobase.com/8df3604c71f8f8705b1552d3ebfe3b50.png)

    ![Node Loop_Contoh_Konfigurasi Node Update Stok](https://static-docs.nocobase.com/2d84baa9b3b01bd85fccda9eec992378.png)

6.  Sebaliknya, pada cabang "Tidak" buat sebuah Node "Update Data", update status detail pesanan menjadi "tidak valid":

    ![Node Loop_Contoh_Konfigurasi Node Update Detail Pesanan](https://static-docs.nocobase.com/4996613090c254c69a1d80f3b3a7fae2.png)

Struktur alur secara keseluruhan adalah sebagai berikut:

![Node Loop_Contoh_Struktur Alur](https://static-docs.nocobase.com/6f59ef246c1f19976344a7624c4c4151.png)

Setelah konfigurasi selesai dan alur diaktifkan, ketika membuat pesanan baru, akan secara otomatis memeriksa stok produk pada detail pesanan. Jika stok mencukupi maka stok akan dikurangi, jika tidak produk dalam detail pesanan akan diupdate menjadi tidak valid (untuk menghitung total harga pesanan yang valid).
