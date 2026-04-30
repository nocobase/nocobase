---
title: "Manajemen Release"
description: "Alur release ops management: deployment multi-environment development, pre-release, production, kombinasi plugin variable dan secret, manajemen backup, manajemen migrasi, alur release single/multi development environment, konfigurasi rule migrasi."
keywords: "manajemen release,Release,deployment multi-environment,development pre-release production,rule migrasi,ops management,NocoBase"
---

# Manajemen Release

## Pengantar

Dalam aplikasi nyata, untuk memastikan keamanan data dan running aplikasi yang stabil, biasanya kita perlu men-deploy beberapa environment, contohnya environment development, pre-release, dan production. Dokumen ini akan menjelaskan secara detail cara mengimplementasikan manajemen release di NocoBase melalui dua alur pengembangan no-code yang umum.

## Instalasi

Tiga plugin yang diperlukan untuk manajemen release, pastikan plugin berikut sudah diaktifkan.

### Variable dan Secret

- Plugin built-in, default terinstal dan aktif.
- Mengkonfigurasi dan mengelola environment variable dan secret secara terpusat, untuk penyimpanan data sensitif, reuse data konfigurasi, isolasi konfigurasi environment, dll ([lihat dokumen](../variables-and-secrets/index.md)).

### Manajemen Backup

- Plugin ini hanya tersedia di versi professional dan di atasnya ([pelajari lebih lanjut](https://www.nocobase.com/en/commercial)).
- Menyediakan fitur backup dan restore, mendukung scheduled backup, memastikan keamanan data dan recovery cepat ([lihat dokumen](../backup-manager/index.mdx)).

### Manajemen Migrasi

- Plugin ini hanya tersedia di versi professional dan di atasnya ([pelajari lebih lanjut](https://www.nocobase.com/en/commercial)).
- Digunakan untuk migrasi konfigurasi aplikasi dari satu environment aplikasi ke environment aplikasi lainnya ([lihat dokumen](../migration-manager/index.md)).

## Alur Pengembangan No-Code Umum

### Single Development Environment, Release Satu Arah

Cocok untuk alur pengembangan sederhana. Environment development, pre-release, dan production masing-masing hanya satu, perubahan di-release dari environment development secara berurutan ke environment pre-release, dan akhirnya di-deploy ke environment production. Dalam alur ini, hanya environment development yang dapat memodifikasi konfigurasi, environment pre-release dan production tidak diizinkan untuk dimodifikasi.

![20250106234710](https://static-docs.nocobase.com/20250106234710.png)

Saat mengkonfigurasi rule migrasi, tabel built-in core dan plugin pilih rule "Overwrite priority", lainnya dapat dibiarkan default jika tidak ada kebutuhan khusus

![20250105194845](https://static-docs.nocobase.com/20250105194845.png)

### Multiple Development Environment, Merge Release

Cocok untuk skenario kolaborasi multi-orang atau proyek kompleks. Beberapa environment development paralel dapat dikembangkan secara independen, semua perubahan digabungkan secara terpadu ke environment pre-release untuk testing dan validasi, akhirnya di-release ke environment production. Dalam alur ini, juga hanya environment development yang dapat memodifikasi konfigurasi, environment pre-release dan production tidak diizinkan untuk dimodifikasi.

![20250107103829](https://static-docs.nocobase.com/20250107103829.png)

Saat mengkonfigurasi rule migrasi, tabel built-in core dan plugin pilih rule "Insert or update priority", lainnya dapat dibiarkan default jika tidak ada kebutuhan khusus

![20250105194942](https://static-docs.nocobase.com/20250105194942.png)

## Rollback

Sebelum eksekusi migrasi, akan dilakukan backup otomatis untuk aplikasi saat ini. Jika migrasi gagal atau hasilnya tidak sesuai harapan, Anda dapat melakukan rollback recovery melalui [Backup Manager](../backup-manager/index.mdx).

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)
