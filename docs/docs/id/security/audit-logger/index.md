---
pkg: '@nocobase/plugin-audit-logger'
title: "Audit Log"
description: "Audit log: mencatat aktivitas user dan riwayat operasi resource, parameter Resource, Action, User, Target, IP, UA, Metadata, untuk pelacakan operasi dan audit kepatuhan."
keywords: "audit log,audit operasi,Resource Action,pelacakan operasi,audit kepatuhan,pencatatan aktivitas user,NocoBase"
---

# Audit Log

## Pengantar

Audit log digunakan untuk mencatat dan melacak aktivitas user dan riwayat operasi resource dalam sistem.

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

## Penjelasan Parameter

| Parameter             | Penjelasan                                                       |
| --------------------- | ---------------------------------------------------------------- |
| **Resource**          | Tipe resource target operasi                                     |
| **Action**            | Tipe operasi yang dieksekusi                                     |
| **User**              | User operator                                                    |
| **Role**              | Role saat user beroperasi                                        |
| **Data source**       | Data source                                                      |
| **Target collection** | Tabel data target                                                |
| **Target record UK**  | Identifier unik record tabel data target                         |
| **Source collection** | Tabel data source dari relation field                            |
| **Source record UK**  | Identifier unik record tabel data source dari relation field     |
| **Status**            | HTTP status code response request operasi                        |
| **Created at**        | Waktu operasi                                                    |
| **UUID**              | Identifier unik operasi, sama dengan Request ID dari request operasi, dapat digunakan untuk pencarian log aplikasi |
| **IP**                | Alamat IP user                                                   |
| **UA**                | Informasi UA user                                                |
| **Metadata**          | Metadata seperti parameter request operasi, request body, dan konten response |

## Penjelasan Resource Audit

Saat ini operasi resource berikut akan dicatat ke audit log:

### Main Application

| Operasi          | Penjelasan        |
| ---------------- | ----------------- |
| `app:resart`     | Restart aplikasi  |
| `app:clearCache` | Clear cache aplikasi |

### Plugin Manager

| Operasi      | Penjelasan      |
| ------------ | --------------- |
| `pm:add`     | Tambah plugin   |
| `pm:update`  | Update plugin   |
| `pm:enable`  | Aktifkan plugin |
| `pm:disable` | Nonaktifkan plugin |
| `pm:remove`  | Hapus plugin    |

### Autentikasi User

| Operasi               | Penjelasan      |
| --------------------- | --------------- |
| `auth:signIn`         | Login           |
| `auth:signUp`         | Registrasi      |
| `auth:signOut`        | Logout          |
| `auth:changePassword` | Ubah password   |

### User

| Operasi               | Penjelasan         |
| --------------------- | ------------------ |
| `users:updateProfile` | Ubah profile pribadi |

### Konfigurasi UI

| Operasi                    | Penjelasan      |
| -------------------------- | --------------- |
| `uiSchemas:insertAdjacent` | Insert UI Schema |
| `uiSchemas:patch`          | Modifikasi UI Schema |
| `uiSchemas:remove`         | Hapus UI Schema |

### Operasi Tabel Data

| Operasi          | Penjelasan        |
| ---------------- | ----------------- |
| `create`         | Buat record       |
| `update`         | Update record     |
| `destroy`        | Hapus record      |
| `updateOrCreate` | Update atau buat record |
| `firstOrCreate`  | Query atau buat record |
| `move`           | Pindah record     |
| `set`            | Set record relation field |
| `add`            | Tambah record relation field |
| `remove`         | Hapus record relation field |
| `export`         | Export record     |
| `import`         | Import record     |

## Menambah Resource Audit Lainnya

Jika Anda mengembangkan operasi resource lain melalui plugin, dan ingin perilaku operasi resource tersebut dicatat ke audit log, Anda dapat merujuk ke [API](/api/server/audit-manager.md).
