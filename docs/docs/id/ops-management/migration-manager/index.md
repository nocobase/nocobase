---
pkg: '@nocobase/plugin-migration-manager'
title: "Manajemen Migrasi"
description: "Migrasi ops management: migrasi konfigurasi aplikasi dari satu environment ke environment lain, mendukung rule migrasi only structure, overwrite, Upsert, insert ignore duplicate, skip, bergantung pada plugin backup management."
keywords: "manajemen migrasi,Migration,migrasi konfigurasi aplikasi,rule migrasi,Upsert,migrasi database,ops management,NocoBase"
---
# Manajemen Migrasi

## Pengantar

Plugin manajemen migrasi digunakan untuk migrasi konfigurasi aplikasi dari satu environment (contohnya Staging) ke environment lain (contohnya PROD).

**Perbedaan inti:**

- **Manajemen Migrasi:** Fokus pada migrasi konfigurasi aplikasi tertentu, struktur tabel data, atau sebagian data.
- **[Backup Manager](../backup-manager/index.mdx):** Fokus pada backup dan restore data full.

## Instalasi

Bergantung pada plugin [Manajemen Backup](../backup-manager/index.mdx), pastikan sudah terinstal dan diaktifkan.

## Alur dan Prinsip

Memigrasi tabel data dan data dari main database, berdasarkan rule migrasi, dari satu aplikasi ke aplikasi lain. Perlu diperhatikan bahwa data dari database eksternal dan sub-app tidak dimigrasi.

![20250102202546](https://static-docs.nocobase.com/20250102202546.png)

## Rule Migrasi

### Rule Built-in

Mendukung lima rule migrasi berikut:

- **Only structure:** Hanya menyinkronkan struktur tabel data, tidak melibatkan insert atau update data.
- **Overwrite (Truncate dan re-insert):** Mengosongkan record tabel yang ada, kemudian insert data baru.
- **Insert or update (Upsert):** Berdasarkan primary key, jika record ada di-update, jika tidak ada di-insert.
- **Insert ignore duplicates:** Insert record baru, jika primary key konflik diabaikan (tidak update record yang ada).
- **Skip:** Tidak melakukan apa pun pada tabel ini.

**Catatan:**
- Overwrite, insert or update, insert ignore duplicates juga akan menyinkronkan perubahan struktur tabel.
- Tabel dengan auto-increment ID sebagai primary key atau tanpa primary key tidak mendukung "Insert or update" dan "Insert ignore duplicates".

### Desain Detail

![20250102204909](https://static-docs.nocobase.com/20250102204909.png)

### Interface Konfigurasi

Konfigurasi rule migrasi

![20250102205450](https://static-docs.nocobase.com/20250102205450.png)

Aktifkan rule independen

![20250107105005](https://static-docs.nocobase.com/20250107105005.png)

Pilih rule independen dan tabel data yang diproses dengan rule independen saat ini

![20250107104644](https://static-docs.nocobase.com/20250107104644.png)

## File Migrasi

![20250102205844](https://static-docs.nocobase.com/20250102205844.png)

### Buat Migrasi Baru

![20250102205857](https://static-docs.nocobase.com/20250102205857.png)

### Eksekusi Migrasi

![20250102205915](https://static-docs.nocobase.com/20250102205915.png)

#### Pemeriksaan Environment Variable

Pemeriksaan environment variable aplikasi (pelajari apa itu [environment variable](../variables-and-secrets/index.md))

![20250102212311](https://static-docs.nocobase.com/20250102212311.png)

Jika `DB_UNDERSCORED`, `USE_DB_SCHEMA_IN_SUBAPP`, `DB_TABLE_PREFIX`, `DB_SCHEMA`, `COLLECTION_MANAGER_SCHEMA` di .env tidak konsisten, akan muncul popup yang memberitahu bahwa migrasi tidak dapat dilanjutkan

![918b8d56037681b29db8396ccad63364](https://static-docs.nocobase.com/918b8d56037681b29db8396ccad63364.png)

Jika environment variable atau secret yang dikonfigurasi dinamis hilang, akan muncul popup yang memberitahu user. Anda perlu mengisi environment variable atau secret yang perlu ditambahkan di sini, lalu lanjutkan

![93a4fcb44f92c43d827d57b7874f6ae6](https://static-docs.nocobase.com/93a4fcb44f92c43d827d57b7874f6ae6.png)

#### Pemeriksaan Plugin

Pemeriksaan plugin aplikasi, jika environment saat ini kekurangan plugin akan muncul popup peringatan, pada saat ini Anda juga dapat memilih untuk melanjutkan migrasi

![bb5690a1e95660e1a5e0fd7440b6425c](https://static-docs.nocobase.com/bb5690a1e95660e1a5e0fd7440b6425c.png)

## Log dan Penyimpanan Migrasi

Setelah eksekusi migrasi selesai, file log eksekusi akan disimpan di server, dapat dilihat secara online atau di-download.

![20251225184721](https://static-docs.nocobase.com/20251225184721.png)

Saat melihat file log eksekusi secara online, Anda juga dapat men-download SQL yang dieksekusi saat migrasi struktur data.

![20251227164116](https://static-docs.nocobase.com/20251227164116.png)

Klik tombol `Process` untuk melihat proses eksekusi migrasi yang telah selesai

![c065716cfbb7655f5826bf0ceae4b156](https://static-docs.nocobase.com/c065716cfbb7655f5826bf0ceae4b156.png)

![f4abe566de1186a9432174ce70b2f960](https://static-docs.nocobase.com/f4abe566de1186a9432174ce70b2f960.png)

### Tentang Direktori `storage`

Manajemen migrasi terutama menangani record database. Sebagian data di direktori `storage` (seperti log, riwayat backup, request log, dll) tidak akan otomatis dimigrasi.

- Jika perlu mempertahankan file ini di environment baru, Anda perlu menyalin folder terkait di direktori `storage` secara manual.

## Rollback

Sebelum eksekusi migrasi, sistem akan otomatis membuat backup.

### Prinsip Rollback

1.  **Stop service:** Hentikan aplikasi sebelum memulai rollback, untuk mencegah penulisan data baru.
2.  **Pencocokan versi:** Versi core NocoBase (Docker image) **harus** konsisten dengan versi saat file backup dihasilkan.
3.  **Restore di environment baru:** Jika database atau storage saat ini sudah rusak, restore versi image saja mungkin tidak cukup. Cara paling aman adalah **di instance aplikasi yang baru (database dan storage baru)** menggunakan core image yang benar untuk restore backup.

### Alur Rollback

#### Skenario A: Eksekusi Task Migrasi Gagal
Jika hanya eksekusi task migrasi yang error, tetapi versi core tidak berubah, langsung gunakan [Backup Manager](../backup-manager/index.mdx) untuk restore backup yang otomatis dibuat sebelum migrasi.

#### Skenario B: Sistem Rusak atau Upgrade Core Gagal
Jika upgrade atau migrasi menyebabkan sistem tidak dapat berjalan, perlu rollback ke kondisi stabil:
1.  **Stop aplikasi:** Hentikan service container saat ini.
2.  **Siapkan environment baru:** Siapkan database kosong baru dan environment storage kosong.
3.  **Deploy versi target:** Ubah Docker image tag kembali ke versi *saat backup dihasilkan*.
4.  **Restore backup:** Eksekusi restore di environment bersih ini melalui [Backup Manager](../backup-manager/index.mdx).
5.  **Switch traffic:** Update gateway/load balancer, arahkan traffic ke instance baru yang sudah pulih ini.

![20251227164004](https://static-docs.nocobase.com/20251227164004.png)

## Command Line

### `yarn nocobase migration generate`

```bash
Usage: nocobase migration generate [options]

Options:
  --title [title]    migration title
  --ruleId <ruleId>  migration rule id
```

Contoh

```bash
yarn nocobase migration generate --ruleId=1
```

### `yarn nocobase migration run`

```bash
Usage: nocobase migration run [options] <filePath>

Arguments:
  filePath           migration file path

Options:
  --skip-backup      skip backup
  --var [var]        variable (default: [])
  --secret [secret]  secret (default: [])
```

Contoh

```bash
yarn nocobase migration run /your/path/migration_1775658568158.nbdata \
  && --var A=a --var B=b \
  && --secret C=c --secret D=d
```

## Best Practice

### Alur Deployment Rekomendasi (Blue-Green Switching)

Untuk memastikan zero-downtime atau downtime minimal, dan keamanan tertinggi, disarankan menggunakan solusi switching dual-environment:

1.  **Tahap persiapan (Staging):** Buat file migrasi di environment Staging.
2.  **Backup aman (PROD-A):** Buat full backup untuk production environment saat ini (PROD-A).
3.  **Deploy paralel (PROD-B):** Deploy instance production *baru, dengan database kosong* (PROD-B), gunakan versi core target.
4.  **Restore dan migrasi:**
    *   Restore backup PROD-A ke PROD-B.
    *   Eksekusi file migrasi dari Staging di PROD-B.
5.  **Verifikasi:** Sementara PROD-A masih melayani, lakukan testing menyeluruh terhadap PROD-B.
6.  **Switch traffic:** Update Nginx/gateway, arahkan traffic dari PROD-A ke PROD-B.
    *   *Jika ada masalah, dapat langsung kembali ke PROD-A.*

### Konsistensi Data dan Maintenance Downtime

Saat ini NocoBase tidak mendukung migrasi zero-downtime. Untuk menghindari inkonsistensi data selama proses backup atau migrasi:
- **Tutup gateway/entrance:** Sangat disarankan untuk menghentikan akses user sebelum memulai backup atau migrasi. Anda dapat mengkonfigurasi **halaman maintenance 503** melalui Nginx atau gateway, untuk memberi tahu user bahwa sistem sedang dalam maintenance, dan mencegah penulisan data baru.
- **Sinkronisasi data manual:** Jika user terus menghasilkan data di versi lama selama migrasi, data tersebut perlu disinkronkan secara manual setelahnya.
