---
pkg: "@nocobase/plugin-block-comment"
title: "Block Komentar"
description: "Block Komentar: digunakan untuk melihat dan membuat komentar pada detail record, pop-up, dan skenario serupa, mendukung field mapping, pagination, data scope, default sorting, dan auto jump to last page."
keywords: "Block Komentar,CommentBlock,tabel komentar,field mapping,data scope,default sorting,interface builder,NocoBase"
---

# Block Komentar

## Pengantar

Block Komentar menambahkan kemampuan komentar ke record bisnis. Kamu dapat menambahkannya ke halaman detail atau pop-up untuk tugas, artikel, tiket, pelanggan, dan record lainnya, sehingga pengguna dapat melihat, membalas, dan membuat komentar untuk record saat ini.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_02_PM.png)

:::tip Tips

Block Komentar tidak membuat collection dengan sendirinya. Sebelum menggunakannya, siapkan collection untuk menyimpan komentar dan konfigurasikan field seperti isi komentar, pembuat komentar, pemilik komentar, dan waktu komentar.

:::

## Menambahkan block

Block Komentar biasanya ditambahkan ke halaman detail atau pop-up dari record bisnis.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_03_PM.png)

1. Buka halaman detail atau pop-up record target
2. Klik "Add block"
3. Pilih "Comment"
4. Pilih collection yang digunakan untuk menyimpan komentar
5. Selesaikan field mapping sesuai petunjuk

Jika Block Komentar dibuat dari association, NocoBase akan mencoba mengenali field pemilik komentar dan nilai record saat ini secara otomatis berdasarkan association saat ini. Dalam kondisi ini, "Comment owner field" dan "Comment owner field value" akan terisi otomatis, sehingga biasanya tidak perlu dikonfigurasi manual.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_04_PM.png)

Jika block dibuat langsung dari collection komentar, kamu perlu mengonfigurasi field pemilik komentar dan nilainya secara manual.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_03_PM%20(1).png)

## Field mapping

Block Komentar menggunakan "Field mapping" untuk mengetahui bagaimana setiap komentar ditampilkan dan disimpan.

| Konfigurasi | Deskripsi |
| --- | --- |
| Field isi komentar | Pilih field yang digunakan untuk menyimpan isi komentar. |
| Field pembuat komentar | Pilih field many-to-one yang terhubung ke collection users. |
| Field pemilik komentar | Pilih field yang digunakan untuk menyimpan identitas record bisnis saat ini. |
| Nilai field pemilik komentar | Tentukan nilai record bisnis saat ini, misalnya `{{ ctx.popup.record.id }}`. |
| Field tanggal komentar | Pilih field waktu komentar, digunakan untuk tampilan dan default sorting. |

### Field pemilik komentar

"Field pemilik komentar" digunakan untuk memfilter komentar milik record saat ini, dan juga ditulis saat komentar baru dibuat.

Saat dipilih manual, dropdown hanya menampilkan field scalar biasa dan tidak menampilkan field association. Konfigurasi umum:

| Collection bisnis | Field pemilik di collection komentar | Nilai field pemilik komentar |
| --- | --- | --- |
| Tugas | `taskId` | `{{ ctx.popup.record.id }}` |
| Artikel | `postId` | `{{ ctx.popup.record.id }}` |
| Tiket | `ticketId` | `{{ ctx.popup.record.id }}` |

Jika record saat ini menggunakan identifier unik selain `id`, ubah "Nilai field pemilik komentar" ke field yang sesuai, misalnya `{{ ctx.popup.record.uuid }}`.

### Mapping otomatis dari association

Jika block dibuat dari association pada record bisnis, Block Komentar akan memprioritaskan field foreign key dari association tersebut sebagai field pemilik komentar, dan menggunakan nilai record saat ini sebagai nilai field pemilik komentar.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_04_PM.png)

Misalnya, jika ada association one-to-many antara collection tugas dan collection komentar tugas, dan field foreign key di collection komentar tugas adalah `taskId`, maka saat menambahkan Block Komentar dari association di halaman detail tugas, block akan otomatis menggunakan:

- Field pemilik komentar: `taskId`
- Nilai field pemilik komentar: identifier record tugas saat ini

Cara ini cocok untuk sebagian besar skenario dan mengurangi kesalahan konfigurasi manual.

## Konfigurasi block

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_07_PM.png)

### Page size

Atur jumlah komentar yang ditampilkan pada setiap halaman. Nilai yang tersedia mencakup `5`, `10`, `20`, `50`, `100`, dan `200`.

### Data scope

Atur cakupan filter data untuk daftar komentar. Kamu dapat menambahkan kondisi lain di sini, misalnya hanya menampilkan komentar yang sesuai dengan status atau kondisi permission tertentu.

Untuk informasi lebih lanjut, lihat [Atur data scope](../block-settings/data-scope.md).

### Default sorting rule

Atur sorting default untuk daftar komentar. Biasanya kamu dapat mengurutkan berdasarkan field tanggal komentar secara ascending atau descending.

Jika default sorting tidak dikonfigurasi secara terpisah, Block Komentar akan memprioritaskan "Field tanggal komentar" sebagai field sorting default.

Untuk informasi lebih lanjut, lihat [Atur sorting rule](../block-settings/sorting-rule.md).

### Auto jump to last page

Dinonaktifkan secara default. Saat dinonaktifkan, Block Komentar tetap berada di halaman pertama setelah dibuka.

Saat diaktifkan, Block Komentar akan melompat ke halaman terakhir pada pemuatan pertama. Ini cocok jika kamu ingin pengguna melihat komentar terbaru terlebih dahulu.
