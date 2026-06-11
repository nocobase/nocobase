---
pkg: '@nocobase/plugin-workflow-response-message'
title: "Node Workflow - Pesan Response"
description: "Node Pesan Response: memberikan umpan balik pesan kustom kepada client, mendukung event pra-aksi dan event aksi kustom."
keywords: "Workflow,pesan response,Response Message,umpan balik client,NocoBase"
---

# Pesan Response

## Pengantar

Node Pesan Response digunakan untuk memberikan umpan balik berupa pesan kustom dari alur kepada client yang mengirim aksi pada tipe alur tertentu.

:::info{title=Tips}
Saat ini didukung dalam workflow tipe "Event Pra-Aksi" dan "Event Aksi Kustom" mode sinkron.
:::

## Membuat Node

Pada tipe workflow yang didukung, Anda dapat menambahkan Node "Pesan Response" di posisi mana pun pada alur. Klik tombol plus ("+") pada alur untuk menambahkan Node "Pesan Response":

![Menambahkan Node](https://static-docs.nocobase.com/eac2b3565e95e4ce59f340624062ed3d.png)

Pesan response akan ada dalam bentuk array selama keseluruhan proses request. Saat alur mencapai Node Pesan Response mana pun, isi pesan baru akan ditambahkan ke dalam array. Saat server mengirim isi response, semua pesan akan dikirim sekaligus ke client.

## Konfigurasi Node

Isi pesan secara keseluruhan adalah string template, di mana Anda dapat menyisipkan variable. Pada konfigurasi Node Anda dapat mengorganisir isi template tersebut secara bebas:

![Konfigurasi Node](https://static-docs.nocobase.com/d5fa5f4002d50baf3ba16048818fddfc.png)

Saat alur mencapai Node ini, template akan diparse dan menghasilkan isi pesan. Pada konfigurasi di atas, variable "Variable Lokal / Loop Semua Produk / Objek Loop / Produk / Judul" akan digantikan dengan nilai aktual saat alur dijalankan, misalnya:

```
Stok produk "iPhone 14 pro" tidak mencukupi
```

![Isi Pesan](https://static-docs.nocobase.com/06bd4a6b6ec499c853f0c39987f63a6a.png)

## Konfigurasi Alur

Status pesan response ditentukan oleh status sukses atau gagal eksekusi alur tersebut. Kegagalan eksekusi Node mana pun akan menyebabkan kegagalan keseluruhan alur, dan saat itu isi pesan akan dikembalikan ke client dengan status gagal dan ditampilkan.

Jika perlu mendefinisikan status gagal secara aktif dalam alur, Anda dapat menggunakan "Node Akhir" di alur dan mengkonfigurasinya sebagai status gagal. Saat eksekusi mencapai Node ini, alur akan keluar dengan status gagal dan pesan akan dikembalikan ke client dengan status gagal.

Jika keseluruhan alur tidak menghasilkan status gagal dan berhasil dieksekusi sampai selesai, isi pesan akan dikembalikan ke client dengan status sukses.

:::info{title=Tips}
Jika beberapa Node Pesan Response didefinisikan dalam alur, setiap Node yang dieksekusi akan menambahkan isi pesan ke dalam array. Saat dikembalikan ke client di akhir, semua isi pesan akan dikembalikan dan ditampilkan sekaligus.
:::

## Skenario Penggunaan

### Alur "Event Pra-Aksi"

Menggunakan Pesan Response dalam alur "Event Pra-Aksi" dapat mengirim umpan balik pesan terkait kepada client setelah alur selesai. Untuk detailnya silakan merujuk ke [Event Pra-Aksi](../triggers/pre-action.md).

### Alur "Event Aksi Kustom"

Menggunakan Pesan Response dalam alur "Event Aksi Kustom" mode sinkron dapat mengirim umpan balik pesan terkait kepada client setelah alur selesai. Untuk detailnya silakan merujuk ke [Event Aksi Kustom](../triggers/custom-action.md).
