---
title: "Konfigurasi UI"
description: "Skill Konfigurasi UI digunakan untuk membuat dan mengedit halaman, Block, Field, dan konfigurasi Action NocoBase."
keywords: "Pembangunan AI,Konfigurasi UI,Halaman,Block,Popup,Interaksi,UI Builder"
---

# Konfigurasi UI

:::tip Prasyarat

Sebelum membaca halaman ini, harap pastikan Anda telah memasang NocoBase CLI dan menyelesaikan inisialisasi sesuai [Mulai Cepat Pembangunan AI](./index.md).

:::

## Pengantar

Skill Konfigurasi UI digunakan untuk membuat dan mengedit halaman, Block, Field, dan konfigurasi Action NocoBase — Anda mendeskripsikan halaman yang Anda inginkan dengan bahasa bisnis, ia menangani pembuatan blueprint, layout Block, dan interaksi.


## Cakupan Kemampuan

Dapat dilakukan:

- Membuat halaman lengkap: tabel, formulir filter, popup detail dalam sekali jadi
- Mengedit halaman yang sudah ada: menambah Block, menyesuaikan Field, mengonfigurasi popup, menyesuaikan layout
- Mengatur interaksi: nilai default, visibilitas Field, perhitungan, status tombol Action
- Menggunakan template untuk reuse: popup dan Block yang berulang dapat disimpan sebagai template
- Mendukung tugas multi-halaman: membangun halaman demi halaman secara berurutan

Tidak dapat dilakukan:

- Tidak dapat mengonfigurasi Permission ACL (gunakan [Skill Konfigurasi Permission](./acl))
- Tidak dapat merancang struktur tabel data (gunakan [Skill Pemodelan Data](./data-modeling))
- Tidak dapat mengorkestrasi Workflow (gunakan [Skill Manajemen Workflow](./workflow))
- Tidak dapat menangani navigasi halaman non-modern (v1), hanya mendukung penanganan halaman v2.

## Contoh Prompt

### Skenario A: Membuat Halaman Manajemen

```
Bantu saya membuat halaman manajemen pelanggan, berisi kotak pencarian nama dan tabel pelanggan, tabel menampilkan nama, telepon, email, waktu pembuatan
```

Skill akan terlebih dahulu membaca Field tabel data, menghasilkan blueprint halaman dan menulisnya.

![Membuat Halaman Manajemen](https://static-docs.nocobase.com/20260420100608.png)


### Skenario B: Konfigurasi Popup

```
Saat mengklik nama pelanggan di tabel akan muncul halaman detail, menampilkan semua Field
```

Akan mengutamakan menggunakan popup Field (klik langsung muncul), bukan menambahkan tombol Action tambahan.

![Konfigurasi Popup](https://static-docs.nocobase.com/20260420100641.png)

### Skenario C: Mengatur Aturan Reaksi

```
Untuk popup /admin/c0vc2vmkfll/view/cec3e7a69ac/filterbytk/1 di formulir edit, tambahkan aturan Field:
Saat user id adalah 1, larang pengeditan username
```

Akan diimplementasikan melalui konfigurasi aturan reaksi, dan tidak perlu menulis konfigurasi secara manual.

![Mengatur Aturan Reaksi](https://static-docs.nocobase.com/20260420100709.png)

### Skenario D: Pembangunan Multi-halaman

```
Bantu saya membangun sistem manajemen pengguna, sistem ini memiliki dua halaman: halaman manajemen pengguna dan halaman manajemen role, keduanya berada di bawah satu grup halaman.
```

Akan memberikan desain sederhana multi-halaman, setelah penyesuaian dan konfirmasi manual dapat dilanjutkan ke pembangunan.

![Pembangunan Multi-halaman](https://static-docs.nocobase.com/20260420100731.png)

## Pertanyaan Umum

**Apa yang harus dilakukan jika Block di halaman yang dibuat tidak memiliki data?**

Pertama konfirmasi bahwa tabel data yang sesuai memang memiliki record. Selain itu periksa apakah Collection dan data source yang diikat Block sudah benar. Anda juga dapat langsung menggunakan [Skill Pemodelan Data](./data-modeling) untuk membuat data simulasi.

**Bagaimana memasukkan beberapa Block dalam popup?**

Anda dapat mendeskripsikan konten popup dalam prompt, misalnya "Pada popup edit letakkan satu formulir dan satu tabel relasi". Skill akan menghasilkan layout popup kustom yang berisi beberapa Block.

**Apakah konfigurasi manual dan konfigurasi AI akan saling memengaruhi?**

Jika konfigurasi manual dan konfigurasi AI dilakukan secara bersamaan akan saling memengaruhi, jika tidak dikonfigurasi pada waktu yang sama maka tidak akan ada pengaruh.

## Tautan Terkait

- [Ikhtisar Pembangunan AI](./index.md) — Ikhtisar dan metode instalasi semua Skill Pembangunan AI
- [Pemodelan Data](./data-modeling) — Gunakan AI untuk membuat dan mengelola tabel data, Field, relasi
- [Konfigurasi Permission](./acl) — Mengonfigurasi role dan Permission akses data
- [Manajemen Workflow](./workflow) — Membuat, mengedit, dan mendiagnosis Workflow
