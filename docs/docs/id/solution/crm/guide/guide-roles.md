---
title: "Role dan Izin"
description: "Penjelasan sistem Role pada sistem CRM: halaman apa yang dapat dilihat dan data apa yang dapat dioperasikan oleh setiap posisi."
keywords: "Izin Role,Izin Data,Izin Menu,Role Departemen,NocoBase CRM"
---

# Role dan Izin

> Orang dengan posisi berbeda yang login ke CRM, akan melihat menu yang berbeda dan data yang dapat dioperasikan juga berbeda. Bab ini akan membantu Anda menjawab satu pertanyaan: **"Apa yang bisa saya lihat, apa yang bisa saya lakukan?"**

## Apa Role Saya?

Role berasal dari dua jalur:
1. **Role Personal** — Role yang langsung ditugaskan oleh admin kepada Anda, mengikuti Anda
   ![08-roles-2026-04-07-01-45-14](https://static-docs.nocobase.com/08-roles-2026-04-07-01-45-14.png)

2. **Role Departemen** — Departemen tempat Anda berada terikat dengan Role, bergabung dengan departemen otomatis mewarisi

![08-roles-2026-04-07-01-46-57](https://static-docs.nocobase.com/08-roles-2026-04-07-01-46-57.png)

Keduanya berlaku secara akumulatif. Misalnya Anda secara personal memiliki Role "Tenaga Penjualan", lalu ditambahkan ke departemen Marketing, maka Anda memiliki izin Role penjualan dan marketing secara bersamaan.

![cn_08-roles](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles.png)

> \* **Sales Manager** dan **Executive** tidak terikat dengan departemen, ditugaskan langsung oleh admin kepada individu.

---

## Halaman yang Dapat Dilihat oleh Setiap Role

Setelah login, menu bar hanya menampilkan halaman yang Anda memiliki izin akses:

![cn_08-roles_1](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles_1.png)

> ¹ Tenaga Penjualan hanya melihat dashboard personal SalesRep, tidak dapat melihat tampilan SalesManager dan Executive.

![08-roles-2026-04-07-01-47-48](https://static-docs.nocobase.com/08-roles-2026-04-07-01-47-48.png)

---

## Data Apa yang Dapat Saya Operasikan?

### Logika Inti Izin Data

![cn_08-roles_2](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles_2.png)

### Izin Data Tenaga Penjualan

Ini adalah Role dengan jumlah pengguna terbanyak, dijelaskan secara khusus:

![cn_08-roles_3](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles_3.png)

**Mengapa Lead Terlihat oleh Semua Orang?**
- Anda perlu melihat Lead yang "belum ditugaskan" untuk diklaim secara aktif
- Saat deteksi duplikat butuh melihat data lengkap, untuk menghindari input duplikat
- Lead orang lain hanya dapat Anda lihat, tidak dapat dimodifikasi

![08-roles-2026-04-07-01-48-42](https://static-docs.nocobase.com/08-roles-2026-04-07-01-48-42.png)

**Mengapa Pelanggan Hanya Melihat Milik Sendiri?**
- Pelanggan adalah aset inti, dengan kepemilikan yang jelas
- Mencegah melihat informasi kontak Pelanggan orang lain
- Saat perlu transfer, hubungi manajer Anda untuk mengoperasikannya

![08-roles-2026-04-07-01-50-37](https://static-docs.nocobase.com/08-roles-2026-04-07-01-50-37.png)

**² Kontak Mengikuti Pelanggan**

Rentang Kontak yang dapat Anda lihat:
1. Kontak yang Anda tanggung jawab langsung
2. **Semua** Kontak di bawah Pelanggan yang Anda tanggung jawab (bahkan yang dibuat orang lain)

> Contoh: Anda menanggung jawab Pelanggan "Huawei", maka semua Kontak di bawah Huawei dapat Anda lihat, tidak peduli siapa yang menginputnya.

![08-roles-2026-04-07-01-51-26](https://static-docs.nocobase.com/08-roles-2026-04-07-01-51-26.png)

### Izin Data Role Lainnya

| Role | Data yang Dapat Dikelola Penuh | Data Lainnya |
|------|-----------------|---------|
| Manajer Penjualan | Semua data CRM | — |
| Eksekutif | — | Semua read-only + ekspor |
| Keuangan | Pesanan, pembayaran, nilai tukar, Penawaran | Lainnya read-only |
| Marketing | Lead, tag Lead, Template analisis data | Lainnya read-only |
| Customer Success Manager | Pelanggan, Kontak, aktivitas, komentar, penggabungan Pelanggan | Lainnya read-only |
| Support Teknis | Aktivitas, komentar (hanya yang dibuat sendiri) | Kontak dapat melihat yang ditanggung jawab sendiri |
| Produk | Produk, kategori, harga bertingkat | Lainnya read-only |

---

## Deteksi Duplikat: Mengatasi Masalah "Tidak Dapat Melihat"

Karena data Pelanggan diisolasi berdasarkan kepemilikan, Anda tidak dapat melihat Pelanggan tenaga penjualan lain. Tetapi sebelum input Lead atau Pelanggan baru, Anda perlu memastikan **apakah sudah ada orang yang menanganinya**.

![cn_08-roles_4](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles_4.png)

Halaman deteksi duplikat mendukung tiga jenis pencarian:

- **Deteksi Duplikat Lead**: Input nama, perusahaan, email, atau HP
- **Deteksi Duplikat Pelanggan**: Input nama perusahaan atau telepon
- **Deteksi Duplikat Kontak**: Input nama, email, atau HP

Hasil deteksi duplikat akan menampilkan **siapa penanggung jawabnya**. Jika sudah ada, langsung hubungi rekan terkait untuk berkoordinasi, hindari benturan transaksi.

![08-roles-2026-04-07-01-52-51](https://static-docs.nocobase.com/08-roles-2026-04-07-01-52-51.gif)

---

## FAQ

**Q: Bagaimana jika saya tidak dapat melihat halaman tertentu?**

Berarti Role Anda tidak memiliki izin akses ke halaman tersebut. Jika dibutuhkan untuk bisnis, hubungi admin untuk menyesuaikan.

**Q: Saya dapat melihat data tetapi tidak ada tombol edit/hapus?**

Anda hanya memiliki izin lihat untuk data tersebut. Biasanya karena bukan tanggung jawab Anda (owner bukan Anda). Tombol operasi yang tidak memiliki izin akan langsung disembunyikan, tidak akan ditampilkan.

**Q: Saya baru bergabung dengan satu departemen, kapan izin akan berlaku?**

Berlaku segera. Refresh halaman dan Anda dapat melihat menu baru.

**Q: Bisakah satu orang memiliki beberapa Role?**

Bisa. Role personal + Role departemen akan bersifat akumulatif. Misalnya Anda secara personal ditugaskan "Tenaga Penjualan", lalu bergabung ke departemen Marketing, maka Anda memiliki izin Role penjualan dan marketing secara bersamaan.

## Dokumen Terkait

- [Pengenalan Sistem dan Dashboard](./guide-overview) — Cara penggunaan setiap dashboard
- [Manajemen Lead](./guide-leads) — Operasi alur lengkap Lead
- [Manajemen Pelanggan](./guide-customers-emails) — Tampilan 360 Pelanggan
