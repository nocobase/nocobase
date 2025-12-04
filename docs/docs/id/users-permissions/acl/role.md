---
pkg: '@nocobase/plugin-acl'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Peran

## Pusat Manajemen

### Manajemen Peran

![](https://static-docs.nocobase.com/da7083c67d794e23dc6eb0f85b1de86c.png)

Aplikasi yang baru diinstal sudah dilengkapi dengan dua peran bawaan, yaitu "Admin" dan "Member". Keduanya memiliki pengaturan izin default yang berbeda.

### Menambah, Menghapus, dan Mengubah Peran

Pengidentifikasi peran (identifikasi unik sistem) memungkinkan Anda untuk menyesuaikan peran default. Namun, peran default sistem tidak dapat dihapus.

![](https://static-docs.nocobase.com/35f323b346db4f9f12f9bee4dea63302.png)

### Mengatur Peran Default

Peran default di sini mengacu pada peran yang akan digunakan secara otomatis ketika pengguna baru dibuat tanpa peran yang ditentukan.

![](https://static-docs.nocobase.com/f41bba7ff55ca28715c486dc45bc1708.png)

## Pusat Pribadi

### Pergantian Peran

Anda dapat menetapkan beberapa peran untuk satu pengguna. Ketika pengguna memiliki beberapa peran, mereka dapat beralih peran di pusat pribadi.

![](https://static-docs.nocobase.com/e331d11ec1ca3b8b7e0472105b167819.png)

Prioritas peran default saat pengguna masuk ke sistem adalah: peran yang terakhir kali diganti (nilai ini akan diperbarui setiap kali peran diganti) > peran pertama (peran default sistem).