---
pkg: '@nocobase/plugin-user-data-sync'
title: "Sinkronisasi Data Pengguna melalui HTTP API"
description: "Sinkronisasi data pengguna NocoBase melalui HTTP API: POST /api/userData:push, format UserData/DepartmentData, API Keys, Bearer token."
keywords: "HTTP API,sinkronisasi data pengguna,userData:push,API Keys,Bearer token,NocoBase"
---

# Sinkronisasi Data Pengguna melalui HTTP API

## Mendapatkan API Key

Lihat [API Keys](/auth-verification/api-keys). Anda perlu memastikan role yang ditetapkan untuk API Key memiliki izin sinkronisasi data pengguna.

## Penjelasan API

### Contoh

```bash
curl 'https://localhost:13000/api/userData:push' \
  -H 'Authorization: Bearer <token>' \
  --data-raw '{"dataType":"user","records":[]}' # Lihat penjelasan detail body request di bawah
```

### Endpoint

```bash
POST /api/userData:push
```

### Format Data Pengguna

#### UserData

| Nama Parameter | Tipe                               | Keterangan                                                                |
| -------------- | ---------------------------------- | ------------------------------------------------------------------------- |
| `dataType`     | `'user' \| 'department'`           | Wajib, tipe data yang di-push, untuk push data pengguna isi `user`        |
| `matchKey`     | `'username' \| 'email' \| 'phone'` | Opsional, akan mencari pengguna yang sudah ada di sistem berdasarkan field yang disediakan dan nilai field yang sesuai dalam data yang di-push, untuk mencocokkan |
| `records`      | `UserRecord[]`                     | Wajib, array record data pengguna                                          |

#### UserRecord

| Nama Parameter | Tipe       | Keterangan                                                                                                |
| -------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `uid`          | `string`   | Wajib, identifier unik dari sumber data pengguna, digunakan untuk mengaitkan data asli sumber dengan pengguna sistem. Tidak dapat berubah untuk pengguna yang sama. |
| `nickname`     | `string`   | Opsional, nickname pengguna                                                                                |
| `username`     | `string`   | Opsional, username                                                                                         |
| `email`        | `string`   | Opsional, email pengguna                                                                                   |
| `phone`        | `string`   | Opsional, nomor telepon                                                                                    |
| `departments`  | `string[]` | Opsional, array uid departemen yang diikuti pengguna                                                       |
| `isDeleted`    | `boolean`  | Opsional, apakah record dihapus                                                                            |
| `<field>`     | `any`      | Opsional, data field kustom lain di tabel pengguna                                                          |

### Format Data Departemen

:::info
Prasyarat untuk push data departemen adalah menginstal dan mengaktifkan plugin [Departemen](../../departments).
:::

#### DepartmentData

| Nama Parameter | Tipe                     | Keterangan                                                  |
| -------------- | ------------------------ | ----------------------------------------------------------- |
| `dataType`     | `'user' \| 'department'` | Wajib, tipe data yang di-push, untuk push data departemen isi `department` |
| `records`      | `DepartmentRecord[]`     | Wajib, array record data departemen                          |

#### DepartmentRecord

| Nama Parameter | Tipe      | Keterangan                                                                                                    |
| -------------- | --------- | ------------------------------------------------------------------------------------------------------------- |
| `uid`          | `string`  | Wajib, identifier unik dari sumber data departemen, digunakan untuk mengaitkan data asli sumber dengan departemen sistem. Tidak dapat berubah untuk departemen yang sama. |
| `title`        | `string`  | Wajib, judul departemen                                                                                        |
| `parentUid`    | `string`  | Opsional, uid departemen induk                                                                                 |
| `isDeleted`    | `boolean` | Opsional, apakah record dihapus                                                                                |
| `<field>`     | `any`     | Opsional, data field kustom lain di tabel departemen                                                            |

:::info

1. Push data idempoten saat dilakukan beberapa kali.
2. Jika saat push departemen, departemen induk belum dibuat, maka tidak dapat dikaitkan. Anda dapat melakukan push ulang data.
3. Jika saat push pengguna, departemen belum dibuat, maka tidak dapat dikaitkan dengan departemen yang diikuti. Setelah melakukan push data departemen, Anda dapat melakukan push data pengguna lagi.
   :::
