---
title: "Memulai Workflow"
description: "Memulai Workflow: konfigurasi Workflow pertama Anda, Trigger event tabel data, Node komputasi, simpan dan uji, kuasai dalam 5 menit."
keywords: "Workflow,memulai,event tabel data,Node komputasi,konfigurasi Trigger,NocoBase"
---

# Memulai

## Konfigurasi Workflow Pertama

Masuk ke halaman manajemen plugin Workflow dari menu konfigurasi plugin di bilah menu atas:

![Pintu masuk manajemen plugin Workflow](https://static-docs.nocobase.com/20251027222721.png)

Antarmuka manajemen akan menampilkan semua Workflow yang sudah dibuat:

![Manajemen Workflow](https://static-docs.nocobase.com/20251027222900.png)

Klik tombol "Buat Baru" untuk membuat Workflow baru, lalu pilih event tabel data:

![Buat Workflow](https://static-docs.nocobase.com/20251027222951.png)

Setelah dikirim, klik tautan "Konfigurasi" pada daftar untuk masuk ke antarmuka konfigurasi Workflow:

![Workflow kosong](https://static-docs.nocobase.com/20251027223131.png)

Kemudian klik kartu Trigger untuk membuka panel konfigurasi Trigger, pilih salah satu tabel data yang sudah dibuat sebelumnya (misalnya tabel "Artikel"), pilih waktu pemicuan "Setelah penambahan data", klik tombol "Simpan" untuk menyelesaikan konfigurasi Trigger:

![Konfigurasi Trigger](https://static-docs.nocobase.com/20251027224735.png)

Selanjutnya kita dapat mengklik tombol tambah pada alur untuk menambahkan Node, misalnya pilih Node komputasi yang berfungsi untuk menggabungkan field "Judul" dan field "ID" dari data Trigger:

![Tambah Node komputasi](https://static-docs.nocobase.com/20251027224842.png)

Klik kartu Node untuk membuka panel konfigurasi Node, gunakan fungsi komputasi `CONCATENATE` yang disediakan oleh Formula.js untuk menggabungkan field "Judul" dan "ID", kedua field tersebut disisipkan melalui pemilih variabel:

![Node komputasi menggunakan fungsi dan variabel](https://static-docs.nocobase.com/20251027224939.png)

Kemudian buat lagi Node Perbarui Data untuk menyimpan hasil ke field "Judul":

![Buat Node Perbarui Data](https://static-docs.nocobase.com/20251027232654.png)

Sama seperti sebelumnya, klik kartu untuk membuka panel konfigurasi Node Perbarui Data, pilih tabel "Artikel", pilih ID data Trigger sebagai ID data yang akan diperbarui, pilih "Judul" sebagai item data yang diperbarui, dan pilih hasil dari Node komputasi sebagai nilai data yang diperbarui:

![Konfigurasi Node Perbarui Data](https://static-docs.nocobase.com/20251027232802.png)

Terakhir, klik sakelar "Aktifkan"/"Nonaktifkan" pada bilah alat di pojok kanan atas untuk mengubah Workflow ke status aktif. Dengan demikian, Workflow dapat dipicu dan dieksekusi.

## Memicu Workflow

Kembali ke antarmuka utama sistem, buat sebuah artikel melalui Block Artikel, isi judul artikel:

![Buat data artikel](https://static-docs.nocobase.com/20251027233004.png)

Setelah dikirim, refresh Block, Anda akan melihat judul artikel diperbarui secara otomatis menjadi format "Judul Artikel + ID Artikel":

![Judul artikel yang dimodifikasi oleh Workflow](https://static-docs.nocobase.com/20251027233043.png)

:::info{title=Tips}
Karena Workflow yang dipicu oleh tabel data dieksekusi secara asinkron, pembaruan data tidak akan langsung terlihat di antarmuka setelah pengiriman data, tetapi setelah beberapa saat dan refresh halaman atau Block, konten yang diperbarui akan terlihat.
:::

## Melihat Riwayat Eksekusi

Workflow tadi telah berhasil dipicu dan dieksekusi sekali, kita dapat kembali ke antarmuka manajemen Workflow untuk melihat riwayat eksekusi terkait:

![Lihat daftar Workflow](https://static-docs.nocobase.com/20251027233246.png)

Pada daftar Workflow, terlihat bahwa Workflow ini telah menghasilkan satu riwayat eksekusi. Klik tautan jumlah untuk membuka catatan riwayat eksekusi Workflow tersebut:

![Daftar riwayat eksekusi Workflow terkait](https://static-docs.nocobase.com/20251027233341.png)

Klik tautan "Lihat" untuk masuk ke halaman detail eksekusi tersebut, Anda dapat melihat status eksekusi dan data hasil setiap Node:

![Detail riwayat eksekusi Workflow](https://static-docs.nocobase.com/20251027233615.png)

Data konteks Trigger dan data hasil eksekusi Node dapat dibuka dan dilihat dengan mengklik tombol status di pojok kanan atas kartu terkait, misalnya kita melihat data hasil dari Node komputasi:

![Hasil Node komputasi](https://static-docs.nocobase.com/20251027233635.png)

Terlihat bahwa data hasil dari Node komputasi mengandung judul yang sudah dikomputasi, judul ini adalah data yang akan diperbarui oleh Node Perbarui Data berikutnya.

## Ringkasan

Melalui langkah-langkah di atas, kita telah menyelesaikan konfigurasi dan pemicuan Workflow sederhana, serta berkenalan dengan beberapa konsep dasar berikut:

- **Workflow**: digunakan untuk mendefinisikan informasi dasar alur, termasuk nama, tipe Trigger, dan status aktivasi, dapat dikonfigurasi dengan sejumlah Node di dalamnya, merupakan entitas yang membawa alur.
- **Trigger**: setiap Workflow memiliki satu Trigger, yang dapat dikonfigurasikan sebagai kondisi spesifik untuk memicu Workflow, merupakan pintu masuk dari alur.
- **Node**: Node adalah unit instruksi yang melaksanakan operasi spesifik di dalam Workflow, banyak Node dalam Workflow dihubungkan melalui hubungan hulu-hilir membentuk alur eksekusi yang lengkap.
- **Rencana Eksekusi**: rencana eksekusi adalah objek eksekusi konkret setelah Workflow dipicu, juga disebut catatan eksekusi atau riwayat eksekusi, mengandung informasi seperti status eksekusi, data konteks pemicu, dan lain-lain. Untuk setiap Node juga ada hasil eksekusi yang sesuai, mengandung informasi status dan data hasil setelah Node dieksekusi.

Untuk penggunaan yang lebih mendalam, Anda dapat merujuk ke konten berikut:

- [Trigger](./triggers/index)
- [Node](./nodes/index)
- [Menggunakan Variabel](./advanced/variables)
- [Rencana Eksekusi](./advanced/executions)
- [Manajemen Versi](./advanced/revisions)
- [Konfigurasi Lanjutan](./advanced/options)
