---
title: "Collection SQL"
description: "Mengambil data melalui statement SQL dan mengonfigurasi metadata field, digunakan seperti Collection biasa untuk tabel, chart, workflow, cocok untuk skenario kueri terkait, statistik, dan lainnya."
keywords: "Collection SQL,Collection SQL,kueri SQL,kueri terkait,statistik,NocoBase"
---

# Collection SQL

<PluginInfo name="collection-sql"></PluginInfo>

## Pengantar

SQL collection menyediakan cara untuk mengambil data melalui statement SQL. Dengan mengambil field data melalui statement SQL dan mengonfigurasi metadata field, pengguna dapat menggunakannya seperti Collection biasa, untuk tabel, chart, workflow, dan lainnya, cocok untuk skenario kueri terkait, statistik, dan lainnya.

## Panduan Penggunaan

### Buat Baru

<img src="https://static-docs.nocobase.com/202405191452918.png"/>

<p>1. Setelah memasukkan statement SQL pada kotak input SQL, klik Execute, sistem akan mencoba mem-parsing tabel dan field mana yang digunakan SQL, dan mem-parsing metadata field dari tabel sumber.</p>

<img src="https://static-docs.nocobase.com/202405191453556.png"/>

<p>2. Jika tabel sumber dan field yang dianalisis otomatis oleh sistem tidak benar, Anda dapat memilih tabel dan field yang sesuai secara manual, untuk menggunakan metadata field yang sesuai. Anda perlu memilih tabel sumber terlebih dahulu, baru kemudian dapat memilih field dari tabel tersebut pada sumber field di bagian bawah.</p>

<img src="https://static-docs.nocobase.com/202405191453579.png"/>

<p>3. Jika field tidak memiliki field sumber yang sesuai, sistem akan menyimpulkan tipe field berdasarkan tipe data. Jika hasil penyimpulan tidak benar, Anda dapat memilih tipe field secara manual.</p>

<img src="https://static-docs.nocobase.com/202405191454703.png"/>

<p>4. Saat mengonfigurasi field, Anda dapat melihat efek tampilan yang sesuai pada area pratinjau.</p>

<img src="https://static-docs.nocobase.com/202405191455439.png"/>

<p>5. Setelah konfigurasi selesai dan dikonfirmasi tidak ada masalah, Anda perlu mengklik tombol Confirm di bawah kotak input SQL untuk melakukan submit terakhir.</p>

<img src="https://static-docs.nocobase.com/202405191455302.png"/>

### Edit

1. Saat ada perubahan pada statement SQL, Anda dapat mengklik tombol Edit untuk mengubah statement SQL secara langsung dan mengonfigurasi ulang field.

2. Saat perlu mengubah metadata field, Anda dapat mengonfigurasinya melalui Configure fields, mengubah konfigurasi terkait field seperti pada Collection biasa.

### Sinkronisasi

Jika statement SQL tidak berubah, tetapi struktur tabel database berubah, Anda dapat mengklik Configure fields - Sync from database untuk menyinkronkan dan mengonfigurasi field.

<img src="https://static-docs.nocobase.com/202405191456216.png"/>

### Perbandingan Collection SQL dengan Database View Connection

| Tipe Template       | Skenario Penggunaan                                                                               | Prinsip Implementasi   | Dukungan CRUD |
| -------------- | -------------------------------------------------------------------------------------- | ---------- | ---------- |
| SQL            | Model relatif sederhana, skenario ringan<br />Tidak nyaman mengoperasikan database<br />Tidak ingin merawat view<br />Ingin sepenuhnya melalui operasi UI | SQL subkueri | Tidak didukung     |
| Database View Connection | Model relatif kompleks<br />Perlu berinteraksi dengan database<br />Perlu mengubah data<br />Perlu dukungan database yang lebih baik dan stabil | Database view | Dukungan parsial   |

:::warning
Saat menggunakan Collection SQL, harap pilih Collection yang dapat dikelola di NocoBase. Jika berada di database yang sama, tetapi tabel lainnya yang belum terintegrasi dengan NocoBase, dapat menyebabkan parsing statement SQL tidak akurat. Jika ada kebutuhan seperti ini, dapat dipertimbangkan untuk membangun view dan menghubungkannya.
:::
