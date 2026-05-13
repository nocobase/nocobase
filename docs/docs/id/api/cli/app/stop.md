---
title: "nb app stop"
description: "Referensi perintah nb app stop: menghentikan aplikasi NocoBase atau container Docker dari env yang ditentukan."
keywords: "nb app stop,NocoBase CLI,menghentikan aplikasi,Docker"
---

# nb app stop

Menghentikan aplikasi NocoBase dari env yang ditentukan. Instalasi npm/Git akan menghentikan proses aplikasi lokal, instalasi Docker akan menghentikan container aplikasi yang tersimpan.

## Penggunaan

```bash
nb app stop [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI yang akan dihentikan, jika dilewati menggunakan env saat ini |
| `--yes`, `-y` | boolean | Saat `--env` yang diberikan secara eksplisit menargetkan env yang berbeda dari env saat ini, lewati konfirmasi interaktif |
| `--verbose` | boolean | Menampilkan output perintah lokal atau Docker yang mendasarinya |

## Contoh

```bash
nb app stop
nb app stop --env local
nb app stop --env local --verbose
nb app stop --env local-docker
```

Jika Anda memberikan `--env` secara eksplisit dan nilainya berbeda dari env saat ini, CLI akan meminta konfirmasi terlebih dahulu. Pada terminal non-interaktif atau sesi AI agent, tambahkan `--yes` sendiri atau jalankan `nb env use <name>` terlebih dahulu lalu coba lagi.

## Perintah Terkait

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb app down`](./down.md)
