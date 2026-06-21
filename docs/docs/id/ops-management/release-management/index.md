---
title: "Manajemen Release"
description: "Praktik terbaik release: kontrol versi, multi-aplikasi, Backup Manager, dan Migration Manager untuk development, staging, dan production."
keywords: "Manajemen Release,Release,kontrol versi,multi-aplikasi,Backup Manager,Migration Manager,NocoBase"
---

# Manajemen Release

## Pendahuluan

Manajemen release mengatur proses aplikasi dari development ke production. Proses ini harus dapat diulang, diverifikasi, dan dipulihkan. Selesaikan perubahan di development, validasi di staging, lalu publish ke production. Simpan file migrasi, backup, log eksekusi, dan hasil validasi.

~~~text
Development -> Staging -> Production
~~~

## Model release

| Kapabilitas | Tujuan | Tahap |
| --- | --- | --- |
| Kontrol versi | Menyimpan checkpoint development | Development |
| Variable dan secret | Memisahkan konfigurasi dan data sensitif | Semua environment |
| Multi-aplikasi | Memisahkan modul bisnis | Arsitektur dan kolaborasi |
| Backup Manager | Menyimpan kondisi production yang bisa dipulihkan | Sebelum release dan operasi |
| Migration Manager | Mempublish konfigurasi dan struktur | Staging dan production |

## Konfigurasi environment

Koneksi database, alamat layanan pihak ketiga, akun uji, token, API Key, dan Webhook sebaiknya memakai variable dan secret, bukan nilai hardcode di halaman, workflow, atau plugin.

Dokumentasi terkait: [Variable dan Secret](../variables-and-secrets/index.md).

## Tahap development

Gunakan kontrol versi sebelum dan sesudah perubahan besar pada model data, halaman, permission, workflow, atau plugin. Untuk publish antar-environment gunakan Migration Manager. Untuk pemulihan production gunakan Backup Manager.

Dokumentasi terkait: [Kontrol versi](../version-control/index.md).

## Pemisahan modul

Sistem kecil dapat mulai dari satu aplikasi. Jika kompleksitas meningkat, pisahkan CRM, tiket, aset, HR, laporan, atau backend operasional menjadi aplikasi mandiri. Rencanakan user, organisasi, autentikasi, permission, dan data bersama lebih dulu.

~~~text
CRM: Development -> Staging -> Production
Tiket: Development -> Staging -> Production
Aset: Development -> Staging -> Production
~~~

Dokumentasi terkait: [Manajemen multi-aplikasi](../../multi-app/multi-app/index.md).

## Persiapan

Buat backup sebelum release production. Untuk release penting, uji restore di environment terpisah. Backup harus mencakup database, file upload, dan storage yang dibutuhkan aplikasi.

Dokumentasi terkait: [Manajemen Backup](../backup-manager/index.mdx).

## Eksekusi release

Publish ke staging terlebih dahulu. Jika validasi berhasil, gunakan file migrasi yang sama untuk production.

![20250106234710](https://static-docs.nocobase.com/20250106234710.png)

![20250105194845](https://static-docs.nocobase.com/20250105194845.png)

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)

Saat production release, gunakan maintenance window, beri tahu pengguna, dan cegah penulisan data baru. Pada multi-node, scale down ke satu node sebelum migrasi. Setelah selesai, validasi alur utama lalu pulihkan akses.

### Aturan migrasi

Strategi umum: overwrite, schema-only, dan skip. Tabel bawaan biasanya mengikuti strategi default. Tabel data bisnis buatan pengguna biasanya memakai schema-only. Tabel metadata dapat memakai overwrite sesuai skenario.

Lihat: [Tabel bawaan aplikasi dan plugin utama](../migration-manager/built-in-tables.md).

Dokumentasi terkait: [Manajemen Migrasi](../migration-manager/index.md).

## Rollback dan pemulihan

Jika release gagal, gunakan backup sebelum release. Restore di environment saat ini jika masih stabil; jika tidak, restore di environment terpisah, validasi, lalu alihkan traffic.

## Dokumentasi terkait

- [Variable dan Secret](../variables-and-secrets/index.md)
- [Kontrol versi](../version-control/index.md)
- [Manajemen multi-aplikasi](../../multi-app/multi-app/index.md)
- [Manajemen Backup](../backup-manager/index.mdx)
- [Manajemen Migrasi](../migration-manager/index.md)
