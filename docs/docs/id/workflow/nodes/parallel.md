---
pkg: '@nocobase/plugin-workflow-parallel'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Cabang Paralel

Node cabang paralel dapat membagi sebuah alur kerja menjadi beberapa cabang. Setiap cabang dapat dikonfigurasi dengan node yang berbeda, dan metode eksekusinya bervariasi tergantung pada mode cabang. Gunakan node cabang paralel dalam skenario di mana beberapa tindakan perlu dieksekusi secara bersamaan.

## Instalasi

Plugin bawaan, tidak memerlukan instalasi.

## Membuat Node

Pada antarmuka konfigurasi alur kerja, klik tombol plus ("+") pada alur untuk menambahkan node "Cabang Paralel":

![Tambah Cabang Paralel](https://static-docs.nocobase.com/9e0f3faa0b9335270647a30477559eac.png)

Setelah menambahkan node cabang paralel ke alur kerja, dua sub-cabang akan ditambahkan secara default. Anda juga dapat menambahkan lebih banyak cabang dengan mengeklik tombol tambah cabang. Jumlah node apa pun dapat ditambahkan ke setiap cabang. Cabang yang tidak diperlukan dapat dihapus dengan mengeklik tombol hapus di awal cabang.

![Kelola Cabang Paralel](https://static-docs.nocobase.com/36088a8b7970c8a1771eb3ee9bc2a757.png)

## Konfigurasi Node

### Mode Cabang

Node cabang paralel memiliki tiga mode berikut:

- **Semua Berhasil**: Alur kerja hanya akan melanjutkan eksekusi node setelah cabang selesai jika semua cabang berhasil dieksekusi. Jika tidak, jika ada cabang yang berakhir lebih awal, baik karena kegagalan, kesalahan, atau status non-berhasil lainnya, seluruh node cabang paralel akan berakhir lebih awal dengan status tersebut. Ini juga dikenal sebagai "mode Semua".
- **Salah Satu Berhasil**: Alur kerja akan melanjutkan eksekusi node setelah cabang selesai segera setelah salah satu cabang berhasil dieksekusi. Seluruh node cabang paralel hanya akan berakhir lebih awal jika semua cabang berakhir lebih awal, baik karena kegagalan, kesalahan, atau status non-berhasil lainnya. Ini juga dikenal sebagai "mode Salah Satu".
- **Salah Satu Berhasil atau Gagal**: Alur kerja akan melanjutkan eksekusi node setelah cabang selesai segera setelah salah satu cabang berhasil dieksekusi. Namun, jika ada node yang gagal, seluruh cabang paralel akan berakhir lebih awal dengan status tersebut. Ini juga dikenal sebagai "mode Race".

Terlepas dari modenya, setiap cabang akan dieksekusi secara berurutan dari kiri ke kanan hingga kondisi mode cabang yang telah ditentukan terpenuhi, pada titik tersebut akan melanjutkan ke node berikutnya atau keluar lebih awal.

## Contoh

Lihat contoh dalam [Node Penundaan](./delay.md).