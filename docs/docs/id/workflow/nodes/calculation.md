---
title: "Node Workflow - Komputasi"
description: "Node komputasi: melakukan evaluasi ekspresi, mendukung berbagai engine komputasi seperti Formula.js, hasil dapat digunakan Node berikutnya."
keywords: "Workflow,komputasi,Calculation,Formula.js,evaluasi ekspresi,NocoBase"
---

# Komputasi

Node komputasi dapat melakukan evaluasi terhadap suatu ekspresi, hasil komputasi akan disimpan dalam hasil Node yang sesuai, untuk digunakan oleh Node lainnya. Merupakan alat untuk komputasi, pemrosesan, dan transformasi data, pada tingkat tertentu, dapat menggantikan fungsi pemanggilan fungsi komputasi pada nilai dan penugasannya pada variabel dalam bahasa pemrograman.

## Membuat Node

Pada antarmuka konfigurasi Workflow, klik tombol plus ("+") di alur, tambahkan Node "Komputasi":

![Node komputasi_tambah](https://static-docs.nocobase.com/58a455540d26945251cd143eb4b16579.png)

## Konfigurasi Node

![Node komputasi_konfigurasi Node](https://static-docs.nocobase.com/6a155de3f6a883d8cd1881b2d9c33874.png)

### Engine Komputasi

Engine komputasi menentukan sintaks yang didukung oleh ekspresi. Saat ini engine komputasi yang didukung adalah [Math.js](https://mathjs.org/) dan [Formula.js](https://formulajs.info/). Engine masing-masing memiliki banyak fungsi umum dan metode operasi data bawaan, untuk penggunaan spesifik dapat merujuk ke dokumen resminya.

:::info{title=Tips}
Perlu diperhatikan, engine yang berbeda memiliki perbedaan dalam akses indeks array, indeks Math.js dimulai dari `1`, sedangkan Formula.js dari `0`.
:::

Selain itu jika hanya perlu penggabungan string sederhana, dapat langsung menggunakan "String Template", engine ini akan mengganti variabel dalam ekspresi dengan nilai yang sesuai, lalu mengembalikan string yang sudah digabung.

### Ekspresi

Ekspresi yaitu representasi string dari sebuah formula komputasi, dapat terdiri dari variabel, konstanta, operator komputasi, dan fungsi yang didukung. Dapat menggunakan variabel konteks alur, misalnya hasil Node sebelum Node komputasi, atau variabel lokal loop, dll.

Saat input ekspresi tidak sesuai sintaks, akan muncul tip error pada konfigurasi Node. Jika saat eksekusi spesifik variabel tidak ada atau tipe tidak cocok, atau menggunakan fungsi yang tidak ada, Node komputasi akan dihentikan lebih awal dengan status error.

## Contoh

### Hitung Total Pesanan

Biasanya dalam satu pesanan mungkin ada beberapa produk, harga dan jumlah setiap produk berbeda, total pesanan perlu menghitung jumlah dari perkalian harga dan jumlah semua produk. Dapat menggunakan Node komputasi setelah memuat daftar detail pesanan (kumpulan data relasi to-many) untuk menghitung total pesanan:

![Node komputasi_contoh_konfigurasi Node](https://static-docs.nocobase.com/85966b0116afb49aa966eeaa85e78dae.png)

Di mana fungsi `SUMPRODUCT` Formula.js dapat menghitung jumlah perkalian baris dari dua array dengan panjang yang sama, dijumlahkan untuk mendapatkan total pesanan.
