---
pkg: '@nocobase/plugin-acl'
title: "Manajemen Role NocoBase"
description: "Manajemen role NocoBase: role default Admin dan Member, tambah/hapus/ubah role, identifier role, konfigurasi role default, switch role, penugasan multi-role."
keywords: "manajemen role,Admin,Member,role default,switch role,ACL,NocoBase"
---

# Role

## Pusat Manajemen

### Manajemen Role

![](https://static-docs.nocobase.com/da7083c67d794e23dc6eb0f85b1de86c.png)

Aplikasi yang baru diinisialisasi memiliki dua role bawaan, yaitu "Admin" dan "Member", yang memiliki pengaturan izin default yang berbeda.

### Tambah/Hapus/Ubah Role

Identifier role (identifier unik sistem) dapat dikustomisasi sebagai role default. Role default sistem tidak dapat dihapus.

![](https://static-docs.nocobase.com/35f323b346db4f9f12f9bee4dea63302.png)

### Mengatur Role Default

Role default di sini adalah role yang akan digunakan ketika pengguna baru dibuat tanpa role.

![](https://static-docs.nocobase.com/f41bba7ff55ca28715c486dc45bc1708.png)

## Pusat Profil

### Switch Role

Anda dapat menugaskan beberapa role kepada satu pengguna. Ketika pengguna memiliki beberapa role, mereka dapat berpindah role di pusat profil.

![](https://static-docs.nocobase.com/e331d11ec1ca3b8b7e0472105b167819.png)

Prioritas role default saat pengguna masuk ke sistem: role yang terakhir digunakan saat berpindah (nilai role default akan diperbarui setiap kali berpindah role) > role pertama (role default sistem)
