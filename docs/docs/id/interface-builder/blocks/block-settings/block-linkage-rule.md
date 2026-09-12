---
title: "Aturan Linkage Block"
description: "Konfigurasi Block: mengkonfigurasi aturan linkage Block, mengimplementasikan linkage data antar Block, linkage filter, linkage tampilan/sembunyi."
keywords: "Aturan Linkage Block, linkage Block, linkage data, konfigurasi Block, interface builder, NocoBase"
---

# Aturan Linkage Block

## Pengantar

Aturan Linkage Block memungkinkan pengguna untuk mengontrol tampilan Block secara dinamis, mengelola tampilan elemen secara keseluruhan dari level Block. Block sebagai container Field dan tombol Action, melalui aturan ini, pengguna dapat mengontrol tampilan seluruh view secara fleksibel dari dimensi Block.

![20251029112218](https://static-docs.nocobase.com/20251029112218.png)

![20251029112338](https://static-docs.nocobase.com/20251029112338.png)

> **Perhatian**: Sebelum menjalankan aturan linkage Block, tampilan Block pertama-tama perlu melalui **penilaian izin ACL**. Hanya ketika pengguna memiliki izin akses yang sesuai, baru dapat memasuki logika penilaian aturan linkage Block. Dengan kata lain, aturan linkage Block hanya berlaku setelah memenuhi persyaratan izin lihat ACL. Saat tidak ada aturan linkage Block, Block secara default ditampilkan.

### Variabel Global Mengontrol Block

**Aturan Linkage Block** mendukung kontrol konten tampilan Block secara dinamis melalui variabel global, sehingga pengguna dengan peran dan izin yang berbeda dapat melihat dan beroperasi pada view data yang dikustomisasi. Misalnya, dalam sistem manajemen pesanan, meskipun peran yang berbeda (seperti admin, sales, finance, dll.) semuanya memiliki izin lihat pesanan, Field dan tombol Action yang perlu dilihat oleh setiap peran mungkin berbeda. Melalui konfigurasi variabel global, dapat menyesuaikan Field, tombol Action, bahkan urutan dan aturan filter data yang ditampilkan secara fleksibel berdasarkan peran pengguna, izin, atau kondisi lainnya.

#### Skenario Aplikasi Spesifik:

- **Kontrol Izin Peran**: Berdasarkan izin peran yang berbeda, mengontrol apakah Field tertentu terlihat atau dapat diedit. Misalnya, sales hanya dapat melihat informasi dasar pesanan, sedangkan finance dapat melihat detail pembayaran pesanan.
- **View Personal**: Menyesuaikan view Block yang berbeda untuk departemen atau tim yang berbeda, memastikan setiap pengguna hanya melihat konten yang relevan dengan pekerjaannya, meningkatkan efisiensi kerja.
- **Manajemen Izin Action**: Mengontrol tampilan tombol Action melalui variabel global. Misalnya, peran tertentu mungkin hanya dapat melihat data, peran lain dapat menjalankan modifikasi, hapus, dll.

### Variabel Konteks Mengontrol Block

Block juga dapat dikontrol tampilannya melalui variabel dalam konteks. Misalnya, dapat menggunakan variabel konteks seperti "Record saat ini", "Form saat ini", "Record popup saat ini" untuk menampilkan atau menyembunyikan Block secara dinamis.

Contoh: Hanya saat status pesanan adalah "Sudah Dibayar", baru menampilkan Block "Informasi Peluang Pesanan".

![20251029114022](https://static-docs.nocobase.com/20251029114022.png)

Untuk penjelasan aturan linkage lebih lanjut, lihat [Aturan Linkage](/interface-builder/linkage-rule)
