---
pkg: '@nocobase/plugin-workflow-variable'
title: "Node Workflow - Variable"
description: "Node Variable: mendeklarasikan variable atau melakukan assignment, menyimpan data sementara untuk digunakan dalam alur."
keywords: "Workflow,Variable,variable alur,data sementara,NocoBase"
---

# Variable

## Pengantar

Dapat mendeklarasikan variable dalam alur, atau melakukan assignment kepada variable yang sudah dideklarasikan, biasanya digunakan untuk menyimpan data sementara dalam alur.

## Membuat Node

Pada antarmuka konfigurasi workflow, klik tombol plus ("+") pada alur untuk menambahkan Node "Variable":

![Tambahkan Node Variable](https://static-docs.nocobase.com/53b1e48e777bfff7f2a08271526ef3ee.png)

## Konfigurasi Node

### Mode

Node Variable mirip dengan variable dalam program, perlu dideklarasikan terlebih dahulu, baru dapat digunakan dan di-assign. Sehingga saat membuat Node Variable, Anda perlu memilih mode variable, ada dua mode yang dapat dipilih:

![Pilih Mode](https://static-docs.nocobase.com/49d8b7b501de6faef6f303262aa14550.png)

- Mendeklarasikan variable baru: membuat sebuah variable baru.
- Assign ke variable yang sudah ada: melakukan assignment kepada variable yang sudah dideklarasikan dalam alur sebelumnya, setara dengan memodifikasi nilai variable.

Saat Node Variable yang dibuat adalah Node Variable pertama dalam alur, hanya dapat memilih mode deklarasi, karena saat itu belum ada variable yang dapat di-assign.

Saat memilih untuk assign ke variable yang sudah dideklarasikan, perlu juga memilih variable target, yaitu Node yang mendeklarasikan variable:

![Pilih Variable yang Akan Di-assign](https://static-docs.nocobase.com/1ce8911548d7347e693d8cc8ac1953eb.png)

### Value

Nilai variable dapat berupa tipe apa pun, dapat berupa konstanta seperti string, angka, boolean dan tanggal, dll., dapat juga berupa variable lain dalam alur.

Pada mode deklarasi, mengatur value variable setara dengan memberikan nilai awal kepada variable.

![Deklarasi Nilai Awal](https://static-docs.nocobase.com/4ce2c508986565ad537343013758c6a4.png)

Pada mode assign, mengatur value variable setara dengan memodifikasi value variable target yang sudah dideklarasikan menjadi nilai baru. Saat digunakan selanjutnya, value yang diambil juga akan menjadi nilai baru tersebut.

![Assign Variable yang Sudah Dideklarasikan ke Variable Trigger](https://static-docs.nocobase.com/858bae180712ad279ae6a964a77a7659.png)

## Menggunakan Value Variable

Pada Node berikutnya dari Node Variable, pilih variable yang sudah dideklarasikan dari grup "Variable Node", maka Anda dapat menggunakan value variable tersebut. Misalnya pada Node Query, menggunakan value variable sebagai kondisi query:

![Gunakan Value Variable Sebagai Kondisi Filter Query](https://static-docs.nocobase.com/1ca91c295254ff85999a1751499f14bc.png)

## Contoh

Skenario yang lebih berguna untuk Node Variable adalah pada beberapa cabang, mengkomputasi atau menggabungkan nilai baru dengan nilai sebelumnya (mirip `reduce`/`concat` dll. dalam pemrograman), dan kemudian digunakan setelah cabang berakhir. Berikut adalah contoh implementasi penggabungan string penerima menggunakan cabang Loop dan Node Variable.

Pertama buat workflow yang di-trigger oleh tabel data, di-trigger saat data "Artikel" diupdate, dan pre-load data relasi "penulis" terkait (digunakan untuk mendapatkan penerima):

![Konfigurasi Trigger](https://static-docs.nocobase.com/93327530a93c695c637d74cdfdcd5cde.png)

Kemudian buat sebuah Node Variable, untuk menyimpan string penerima:

![Node Variable Penerima](https://static-docs.nocobase.com/d26fa4a7e7ee4f34e0d8392a51c6666e.png)

Selanjutnya buat sebuah Node cabang Loop, untuk iterasi penulis artikel, untuk menambahkan penerimanya ke variable penerima:

![Loop Penulis dalam Artikel](https://static-docs.nocobase.com/083fe62c943c17a643dc47ec2872e07c.png)

Pada cabang Loop, buat dulu sebuah Node komputasi, untuk menggabungkan penulis saat ini dengan string penulis yang sudah disimpan:

![Gabungkan String Penerima](https://static-docs.nocobase.com/5d21a990162f32cb8818d27b16fd1bcd.png)

Setelah Node komputasi buat lagi sebuah Node Variable, pilih mode assign, target assignment pilih Node Variable penerima, value pilih hasil Node komputasi:

![Assign String Penerima yang Sudah Digabung ke Node Penerima](https://static-docs.nocobase.com/fc40ed95dd9b61d924b7ca11b23f9482.png)

Dengan demikian setelah cabang Loop berakhir, variable penerima akan menyimpan string penerima dari semua penulis artikel. Lalu setelah loop, dapat menggunakan Node HTTP Request untuk memanggil interface kirim email, meneruskan value variable penerima sebagai parameter penerima ke interface:

![Mengirim Email ke Penerima Melalui Node Request](https://static-docs.nocobase.com/37f71aa1a63e172bcb2dce10a250947e.png)

Sampai di sini, fitur sederhana pengiriman email massal sudah diimplementasikan melalui Node Loop dan Variable.
