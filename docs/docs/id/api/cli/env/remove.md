---
title: "nb env remove"
description: "Referensi perintah nb env remove: menghentikan runtime terkelola sebelum menghapus konfigurasi env, atau membersihkan resource lokal CLI bila diperlukan."
keywords: "nb env remove,NocoBase CLI,menghapus lingkungan,menghapus konfigurasi,purge"
---

# nb env remove

Menghapus env yang sudah dikonfigurasi. Untuk env local dan Docker, perintah ini terlebih dahulu menghentikan runtime aplikasi dan runtime database bawaan yang dikelola CLI pada mesin ini, lalu menghapus konfigurasi env yang tersimpan. Untuk env HTTP dan SSH, perintah ini hanya menghapus konfigurasi env yang tersimpan.

Jika env yang dihapus juga merupakan env saat ini, CLI otomatis memilih env saat ini yang baru dari env yang tersisa. Jika tidak ada env yang tersisa, env saat ini akan dikosongkan.

Secara default, perintah akan meminta konfirmasi. Dalam mode non-interaktif, `--force` wajib diberikan sebelum perintah dijalankan.

Gunakan `--purge` untuk juga membersihkan resource yang dikelola CLI pada mesin ini. Untuk env local dan Docker, `--purge` melakukan pembersihan yang sama dengan [`nb app destroy`](../app/destroy.md). Untuk env HTTP dan SSH, `--purge` tidak menyentuh layanan eksternal dan hanya menghapus konfigurasi env yang tersimpan.

## Penggunaan

```bash
nb env remove <name> [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `<name>` | string | Nama env yang sudah dikonfigurasi untuk dihapus |
| `--force`, `-f` | boolean | Lewati konfirmasi untuk mode remove yang dipilih; wajib dalam mode non-interaktif |
| `--purge` | boolean | Juga hapus resource runtime lokal yang dikelola CLI, data storage, dan bila berlaku file app lokal hasil unduhan. Untuk env API remote, hanya konfigurasi env yang tersimpan yang dihapus |
| `--verbose` | boolean | Menampilkan progress detail |

## Contoh

```bash
nb env remove staging
nb env remove staging --force
nb env remove staging --purge --force
```

## Perintah Terkait

- [`nb app stop`](../app/stop.md)
- [`nb app destroy`](../app/destroy.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
