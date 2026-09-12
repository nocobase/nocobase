---
title: 'nb env remove'
description: 'Referensi perintah nb env remove: hentikan runtime yang dikelola sebelum menghapus konfigurasi env, atau bersihkan sepenuhnya resource lokal yang dikelola bila diperlukan.'
keywords: 'nb env remove,NocoBase CLI,hapus environment,hapus konfigurasi,purge'
---

# nb env remove

Menghapus env yang sudah dikonfigurasi. Untuk env local/docker, perintah ini terlebih dahulu menghentikan runtime aplikasi dan runtime database bawaan yang dikelola CLI di mesin saat ini, lalu menghapus konfigurasi CLI env yang tersimpan. Untuk env http/ssh, perintah ini hanya menghapus konfigurasi CLI env yang tersimpan.

Jika env yang dihapus adalah env saat ini, CLI akan otomatis memilih current env baru dari env yang tersisa; jika sudah tidak ada env yang tersedia, current env akan dikosongkan.

Secara default, perintah ini memerlukan konfirmasi. Dalam mode non-interaktif, Anda harus secara eksplisit memberikan `--force` agar dapat dijalankan.

Jika perlu membersihkan resource yang dikelola CLI di mesin saat ini semaksimal mungkin, Anda dapat memberikan `--purge`. Untuk env local/docker, `--purge` juga membersihkan resource runtime terkelola, data storage, serta file app lokal hasil unduhan bila berlaku; untuk env http/ssh, `--purge` tidak akan menyentuh layanan eksternal dan hanya akan menghapus konfigurasi CLI env yang tersimpan.

## Penggunaan

```bash
nb env remove <name> [flags]
```

## Parameter

| Parameter       | Tipe    | Deskripsi                                                                                                                                                                                                       |
| --------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<name>`        | string  | Nama environment yang sudah dikonfigurasi dan akan dihapus                                                                                                                                                      |
| `--force`, `-f` | boolean | Lewati konfirmasi pada mode remove saat ini; wajib dalam mode non-interaktif                                                                                                                                    |
| `--purge`       | boolean | Tambahan membersihkan resource yang dikelola CLI, data storage, serta file app lokal hasil unduhan di mesin saat ini bila berlaku; untuk env API remote, hanya konfigurasi env yang tersimpan yang akan dihapus |
| `--verbose`     | boolean | Tampilkan progres terperinci                                                                                                                                                                                    |

## Contoh

```bash
nb env remove staging
nb env remove staging --force
nb env remove staging --purge --force
```

## Perintah terkait

- [`nb app stop`](../app/stop.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
