---
title: "nb source test"
description: "Referensi perintah nb source test: menjalankan test di direktori aplikasi yang dipilih, dan otomatis menyiapkan database test bawaan."
keywords: "nb source test,NocoBase CLI,test,Vitest,database"
---

# nb source test

Menjalankan test di direktori aplikasi yang dipilih. Sebelum menjalankan test, CLI akan membuat ulang database test Docker bawaan, dan menyuntikkan variabel lingkungan `DB_*` yang digunakan secara internal.

## Penggunaan

```bash
nb source test [paths...] [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `[paths...]` | string[] | Path file test atau glob yang diteruskan ke test runner |
| `--cwd`, `-c` | string | Direktori aplikasi untuk menjalankan test, default direktori saat ini |
| `--watch`, `-w` | boolean | Jalankan Vitest dalam mode watch |
| `--run` | boolean | Jalankan sekali, tidak masuk ke mode watch |
| `--allowOnly` | boolean | Mengizinkan test `.only` |
| `--bail` | boolean | Berhenti setelah kegagalan pertama |
| `--coverage` | boolean | Aktifkan laporan coverage |
| `--single-thread` | string | Meneruskan mode single-thread ke test runner yang mendasarinya |
| `--server` | boolean | Memaksa mode test server |
| `--client` | boolean | Memaksa mode test client |
| `--db-clean`, `-d` | boolean | Bersihkan database saat perintah aplikasi yang mendasarinya mendukung |
| `--db-dialect` | string | Tipe database test bawaan: `postgres`, `mysql`, `mariadb`, `kingbase` |
| `--db-image` | string | Image Docker database test bawaan |
| `--db-port` | string | Port TCP yang dipublikasikan database test bawaan ke host |
| `--db-database` | string | Nama database yang disuntikkan untuk test |
| `--db-user` | string | User database yang disuntikkan untuk test |
| `--db-password` | string | Password database yang disuntikkan untuk test |
| `--verbose` | boolean | Menampilkan output Docker dan test runner yang mendasarinya |

## Contoh

```bash
nb source test
nb source test --cwd /path/to/app
nb source test packages/core/server/src/__tests__/foo.test.ts
nb source test --server --coverage
nb source test --db-port 5433
```

## Perintah Terkait

- [`nb source build`](./build.md)
- [`nb db ps`](../db/ps.md)
