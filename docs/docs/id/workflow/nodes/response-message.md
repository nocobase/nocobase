---
pkg: '@nocobase/plugin-workflow-response-message'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



# Pesan Respons

## Pendahuluan

Node pesan respons berfungsi untuk memberikan umpan balik berupa pesan kustom dari alur kerja kepada klien yang melakukan suatu aksi, khususnya pada jenis alur kerja tertentu.

:::info{title=Catatan}
Saat ini, fitur ini didukung untuk digunakan dalam alur kerja jenis "Peristiwa Pra-Aksi" dan "Peristiwa Aksi Kustom" yang berjalan dalam mode sinkron.
:::

## Membuat Node

Pada jenis alur kerja yang didukung, Anda dapat menambahkan node "Pesan respons" di mana saja dalam alur kerja. Cukup klik tombol plus ("+") pada alur kerja untuk menambahkannya:

![Menambahkan node](https://static-docs.nocobase.com/eac2b3566e95e4ce59f340624062ed3d.png)

Pesan respons akan ada sebagai array sepanjang proses permintaan. Setiap kali node pesan respons dieksekusi dalam alur kerja, konten pesan baru akan ditambahkan ke array tersebut. Ketika server mengirimkan respons, semua pesan akan dikirimkan ke klien secara bersamaan.

## Konfigurasi Node

Konten pesan adalah string template tempat variabel dapat disisipkan. Anda dapat mengatur konten template ini secara bebas dalam konfigurasi node:

![Konfigurasi node](https://static-docs.nocobase.com/d5fa5f4002d50baf3ba16048818fddfc.png)

Ketika alur kerja mengeksekusi node ini, template akan diurai untuk menghasilkan konten pesan. Dalam konfigurasi di atas, variabel "Variabel lokal / Ulangi semua produk / Objek perulangan / Produk / Judul" akan diganti dengan nilai tertentu dalam alur kerja sebenarnya, misalnya:

```
Stok produk "iPhone 14 pro" tidak mencukupi
```

![Konten pesan](https://static-docs.nocobase.com/06bd4a6b6ec499c83f0c39987f63a6a.png)

## Konfigurasi Alur Kerja

Status pesan respons bergantung pada keberhasilan atau kegagalan eksekusi alur kerja. Kegagalan eksekusi node mana pun akan menyebabkan seluruh alur kerja gagal. Dalam kasus ini, konten pesan akan dikembalikan ke klien dengan status gagal dan ditampilkan sebagai notifikasi.

Jika Anda perlu secara aktif mendefinisikan status gagal dalam alur kerja, Anda dapat menggunakan "node Akhir" dan mengonfigurasinya ke status gagal. Ketika node ini dieksekusi, alur kerja akan keluar dengan status gagal, dan pesan akan dikembalikan ke klien dengan status gagal.

Jika seluruh alur kerja tidak menghasilkan status gagal dan berhasil dieksekusi hingga selesai, konten pesan akan dikembalikan ke klien dengan status berhasil.

:::info{title=Catatan}
Jika beberapa node pesan respons didefinisikan dalam alur kerja, node yang telah dieksekusi akan menambahkan konten pesan ke dalam array. Ketika akhirnya dikembalikan ke klien, semua konten pesan akan dikembalikan dan ditampilkan secara bersamaan sebagai notifikasi.
:::

## Skenario Penggunaan

### Alur Kerja "Peristiwa Pra-Aksi"

Menggunakan pesan respons dalam alur kerja "Peristiwa Pra-Aksi" memungkinkan pengiriman umpan balik pesan yang sesuai kepada klien setelah alur kerja selesai. Untuk detail lebih lanjut, lihat [Peristiwa Pra-Aksi](../triggers/pre-action.md).

### Alur Kerja "Peristiwa Aksi Kustom"

Menggunakan pesan respons dalam "Peristiwa Aksi Kustom" yang berjalan dalam mode sinkron memungkinkan pengiriman umpan balik pesan yang sesuai kepada klien setelah alur kerja selesai. Untuk detail lebih lanjut, lihat [Peristiwa Aksi Kustom](../triggers/custom-action.md).