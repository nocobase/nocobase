:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Kolom Koleksi

## Tipe Antarmuka Kolom

NocoBase mengklasifikasikan kolom ke dalam beberapa kategori berikut dari perspektif Antarmuka:

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

## Tipe Data Kolom

Setiap Antarmuka Kolom memiliki tipe data bawaan. Misalnya, untuk kolom dengan Antarmuka sebagai Angka (Number), tipe data bawaannya adalah `double`, tetapi juga bisa `float`, `decimal`, dan lain-lain. Tipe data yang saat ini didukung adalah:

![20240512103733](https://static-docs.nocobase.com/20240512103733.png)

## Pemetaan Tipe Kolom

Proses penambahan kolom baru ke basis data utama adalah sebagai berikut:

1. Pilih tipe Antarmuka
2. Konfigurasi tipe data opsional untuk Antarmuka saat ini

![20240512172416](https://static-docs.nocobase.com/20240512172416.png)

Proses pemetaan kolom dari sumber data eksternal adalah:

1. Otomatis memetakan tipe data yang sesuai (tipe Kolom) dan tipe UI (Antarmuka Kolom) berdasarkan tipe kolom dari basis data eksternal.
2. Ubah ke tipe data dan tipe Antarmuka yang lebih sesuai sesuai kebutuhan.

![20240512172759](https://static-docs.nocobase.com/20240512172759.png)