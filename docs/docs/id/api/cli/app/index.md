---
title: 'nb app'
description: 'Referensi perintah nb app: mengelola runtime aplikasi NocoBase, termasuk memulai, menghentikan, memulai ulang, log, dan peningkatan.'
keywords: 'nb app,NocoBase CLI,mulai,berhenti,mulai ulang,log,peningkatan'
---

# nb app

Mengelola runtime aplikasi NocoBase. Di npm/Git env, perintah aplikasi dijalankan di direktori kode sumber lokal; di Docker env, kontainer aplikasi dikelola berdasarkan konfigurasi yang telah disimpan.

## Penggunaan

```bash
nb app <command>
```

## Subperintah

| Perintah                         | Deskripsi                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------- |
| [`nb app start`](./start.md)     | Memulai aplikasi atau membuat ulang kontainer Docker                             |
| [`nb app stop`](./stop.md)       | Menghentikan aplikasi atau membersihkan kontainer Docker                         |
| [`nb app restart`](./restart.md) | Menghentikan aplikasi terlebih dahulu lalu memulainya kembali                    |
| [`nb app autostart`](./autostart/index.md) | Mengelola tanda autostart dan menjalankan semua env yang diaktifkan |
| [`nb app logs`](./logs.md)       | Melihat log aplikasi                                                             |
| [`nb app upgrade`](./upgrade.md) | Menghentikan aplikasi, mengganti kode sumber atau image, lalu memulainya kembali |

## Contoh

```bash
nb app start --env app1
nb app restart --env app1
nb app autostart enable --env app1 --yes
nb app autostart run
nb app logs --env app1
nb app upgrade --env app1 --skip-download
nb app stop --env app1 --with-db
```

## Perintah terkait

- [`nb env info`](../env/info.md)
- [`nb env remove`](../env/remove.md)
- [`nb db ps`](../db/ps.md)
- [`nb source download`](../source/download.md)
