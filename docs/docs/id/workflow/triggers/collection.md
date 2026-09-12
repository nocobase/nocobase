---
title: "Trigger Workflow - Event Tabel Data"
description: "Trigger event tabel data: men-listen tambah/hapus/perbarui/kueri tabel data, memicu Workflow ketika kondisi terpenuhi, seperti tambah pesanan kurangi stok, peninjauan komentar."
keywords: "Workflow,event tabel data,Trigger,CRUD,event Collection,NocoBase"
---

# Event Tabel Data

## Pengantar

Trigger tipe event tabel data akan men-listen event tambah/hapus/perbarui/kueri tabel data. Ketika operasi data terhadap tabel tersebut terjadi dan memenuhi kondisi yang dikonfigurasi, Workflow yang sesuai akan dipicu. Misalnya setelah menambah pesanan kurangi stok produk, setelah menambah komentar tunggu peninjauan manual, dan skenario lainnya.

## Penggunaan Dasar

Perubahan tabel data memiliki beberapa kondisi:

1. Setelah penambahan data.
2. Setelah pembaruan data.
3. Setelah penambahan atau pembaruan data.
4. Setelah penghapusan data.

![Event tabel data_pemilihan waktu pemicuan](https://static-docs.nocobase.com/81275602742deb71e0c830eb97aa612c.png)

Anda dapat memilih waktu pemicuan berdasarkan kebutuhan bisnis yang berbeda. Ketika kondisi perubahan yang dipilih mengandung kondisi pembaruan tabel data, Anda juga dapat membatasi field yang berubah. Hanya ketika field yang dipilih berubah, kondisi pemicuan terpenuhi. Jika tidak memilih, semua field yang berubah dapat memicu.

![Event tabel data_pemilihan field yang berubah](https://static-docs.nocobase.com/874a1475f01298b3c00267b2b4674611.png)

Lebih detail, Anda dapat mengonfigurasi aturan kondisi untuk setiap field baris data yang dipicu. Hanya ketika field di dalamnya memenuhi kondisi yang sesuai, baru dilakukan pemicuan.

![Event tabel data_konfigurasi kondisi yang dipenuhi data](https://static-docs.nocobase.com/264ae3835dcd75cee0eef7812c11fe0c.png)

Setelah event tabel data dipicu, baris data yang menghasilkan event akan diinjeksikan ke rencana eksekusi sebagai data konteks pemicuan, untuk digunakan oleh Node dalam alur sebagai variabel. Namun ketika Node berikutnya ingin menggunakan field relasi data tersebut, Anda perlu mengonfigurasi terlebih dahulu pre-loading untuk data relasi. Data relasi yang dipilih akan diinjeksikan ke konteks bersamaan setelah pemicuan, dan dapat dipilih dan digunakan secara hierarkis.

## Tips Terkait

### Pemicuan Operasi Data Batch Belum Didukung

Event tabel data saat ini belum mendukung pemicuan operasi data batch. Misalnya saat menambah data artikel sambil menambah beberapa data tag artikel tersebut (data relasi to-many), hanya akan memicu Workflow penambahan artikel, sedangkan beberapa tag yang ditambahkan bersamaan tidak akan memicu Workflow penambahan tag. Saat asosiasi dan penambahan data relasi many-to-many, Workflow tabel perantara juga tidak akan dipicu.

### Operasi Data di Luar Aplikasi Tidak Akan Memicu

Operasi tabel data melalui panggilan API HTTP aplikasi juga dapat memicu event yang sesuai. Tetapi jika tidak melalui aplikasi NocoBase, melainkan langsung melalui operasi database menghasilkan perubahan data, tidak akan dapat memicu event yang sesuai. Misalnya Trigger asli di database tidak akan terkait dengan Workflow di aplikasi.

Selain itu, menggunakan Node Operasi SQL untuk mengoperasikan database setara dengan langsung mengoperasikan database, juga tidak akan memicu event tabel data.

### Sumber Data Eksternal

Workflow mulai mendukung sumber data eksternal sejak `0.20`. Jika menggunakan plugin sumber data eksternal, dan event tabel data yang dikonfigurasi adalah sumber data eksternal, selama operasi data terhadap sumber data tersebut diselesaikan di dalam aplikasi (penambahan, pembaruan oleh pengguna, dan operasi data Workflow, dll.), semua dapat memicu event tabel data yang sesuai. Tetapi jika perubahan data dilakukan melalui sistem lain atau langsung di database eksternal, tidak akan dapat memicu event tabel data.

## Contoh

Mari ambil contoh skenario menghitung total harga dan mengurangi stok setelah menambah pesanan.

Pertama, kita buat tabel produk dan tabel pesanan, model data sebagai berikut:

| Nama Field    | Tipe Field      |
| ------------- | --------------- |
| Nama Produk   | Single Line Text |
| Harga         | Number          |
| Stok          | Integer         |

| Nama Field      | Tipe Field             |
| --------------- | ---------------------- |
| Nomor Pesanan   | Auto Number            |
| Produk Pesanan  | Many-to-One (Produk)   |
| Total Pesanan   | Number                 |

Dan tambahkan data produk dasar:

| Nama Produk   | Harga | Stok |
| ------------- | ----- | ---- |
| iPhone 14 Pro | 7999  | 10   |
| iPhone 13 Pro | 5999  | 0    |

Kemudian buat sebuah Workflow berbasis event tabel data pesanan:

![Event tabel data_contoh_pemicuan tambah pesanan](https://static-docs.nocobase.com/094392a870dddc65aeb20357f62ddc08.png)

Beberapa item konfigurasi di dalamnya:

- Tabel Data: pilih tabel "Pesanan".
- Waktu Pemicuan: pilih "Setelah Penambahan Data" untuk memicu.
- Kondisi Pemicuan: kosongkan.
- Pre-load Data Relasi: centang "Produk".

Kemudian konfigurasikan Node lainnya berdasarkan logika alur, periksa apakah stok produk lebih besar dari 0, jika lebih besar dari 0 kurangi stok, jika tidak pesanan tidak valid hapus pesanan:

![Event tabel data_contoh_orkestrasi alur tambah pesanan](https://static-docs.nocobase.com/7713ea1aaa0f52a0dc3c92aba5e58f05.png)

Konfigurasi Node akan dijelaskan secara detail dalam dokumen pengantar tipe spesifik.

Aktifkan Workflow ini, dan uji dengan menambah pesanan melalui antarmuka. Setelah memesan "iPhone 14 Pro", stok produk yang sesuai akan dikurangi menjadi 9, sedangkan jika memesan "iPhone 13 Pro", karena stok tidak mencukupi, pesanan akan dihapus.

![Event tabel data_contoh_hasil eksekusi tambah pesanan](https://static-docs.nocobase.com/24cbe51e24ba4804b3bd48d99415c54f.png)
