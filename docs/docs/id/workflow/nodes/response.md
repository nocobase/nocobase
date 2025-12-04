---
pkg: "@nocobase/plugin-workflow-response-message"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Respons HTTP

## Pendahuluan

Node ini hanya didukung dalam alur kerja Webhook mode sinkron dan digunakan untuk mengembalikan respons ke sistem pihak ketiga. Misalnya, saat memproses *callback* pembayaran, jika proses bisnis mengalami hasil yang tidak terduga (seperti kesalahan atau kegagalan), Anda dapat menggunakan node respons untuk mengembalikan respons kesalahan ke sistem pihak ketiga. Dengan begitu, beberapa sistem pihak ketiga dapat mencoba lagi nanti berdasarkan status tersebut.

Selain itu, eksekusi node respons akan menghentikan eksekusi alur kerja, dan node-node selanjutnya tidak akan dieksekusi. Jika tidak ada node respons yang dikonfigurasi di seluruh alur kerja, sistem akan merespons secara otomatis berdasarkan status eksekusi alur: mengembalikan `200` untuk eksekusi yang berhasil dan `500` untuk eksekusi yang gagal.

## Membuat Node Respons

Pada antarmuka konfigurasi alur kerja, klik tombol plus ("+") di alur untuk menambahkan node "Respons":

![20241210115120](https://static-docs.nocobase.com/20241210115120.png)

## Konfigurasi Respons

![20241210115500](https://static-docs.nocobase.com/20241210115500.png)

Anda dapat menggunakan variabel dari konteks alur kerja di dalam badan respons.