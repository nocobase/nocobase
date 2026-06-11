---
title: 'nb backup create'
description: 'Referensi perintah nb backup create: membuat cadangan melalui env yang dipilih dan mengunduh file cadangan ke lokal.'
keywords: 'nb backup create,NocoBase CLI,membuat cadangan,mengunduh cadangan,nbdata'
---

# nb backup create

Membuat cadangan melalui env yang dipilih dan mengunduh file cadangan ke lokal. Saat `--output` dihilangkan, CLI akan menyimpan file ke direktori kerja saat ini dan memakai nama file cadangan yang dikembalikan oleh sisi remote—biasanya `backup_*.nbdata`.

## Penggunaan

```bash
nb backup create [flags]
```

## Parameter

| Parameter             | Tipe    | Deskripsi                                                                                                                                                                   |
| --------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--env`, `-e`         | string  | Nama CLI env tempat cadangan akan dibuat; jika dihilangkan, env saat ini digunakan                                                                                          |
| `--yes`, `-y`         | boolean | Lewati konfirmasi interaktif saat env yang secara eksplisit ditunjuk oleh `--env` berbeda dari env saat ini                                                                 |
| `--output`, `-o`      | string  | Jalur tujuan unduhan. Jika dihilangkan, file disimpan ke direktori saat ini; jika menunjuk ke direktori yang sudah ada, nama file cadangan remote akan otomatis ditambahkan |
| `--json-output`, `-j` | boolean | Keluarkan hasil akhir dalam JSON, dengan field `env`, `name`, dan `output`                                                                                                  |

## Contoh

```bash
nb backup create
nb backup create --output ./backups
nb backup create --output ./backups/base.nbdata
nb backup create --env e2e --output ./backups --yes
nb backup create --env e2e --json-output
```

## Penjelasan

CLI hanya memeriksa apakah `--env` sama dengan env saat ini jika Anda secara eksplisit memberikan `--env`. Jika env yang berbeda ditentukan secara eksplisit, terminal interaktif akan meminta konfirmasi terlebih dahulu; dalam terminal non-interaktif atau skenario AI agent, Anda perlu menambahkan `--yes` sendiri secara eksplisit, atau menjalankan `nb env use <name>` terlebih dahulu lalu coba lagi.

Alur pembuatan dibagi menjadi dua langkah: pertama memanggil backup API dari env target untuk membuat cadangan remote, lalu melakukan polling status setiap 2 detik; setelah cadangan selesai, file akan diunduh ke lokal. Jika setelah 600 detik sisi remote masih mengembalikan `inProgress: true`, perintah akan keluar karena timeout.

`--output` dapat berupa jalur file maupun jalur direktori yang sudah ada. CLI hanya mengenali jalur yang sudah ada sebagai direktori; jika jalurnya belum ada, itu akan diperlakukan sebagai jalur file target.

Setelah `--json-output` diberikan, CLI tidak lagi menampilkan teks progres, dan langsung mencetak hasil JSON akhir. Mode ini lebih cocok untuk dikonsumsi lebih lanjut oleh skrip dan alur agent.

## Perintah terkait

- [`nb backup restore`](./restore.md)
- [`nb env update`](../env/update.md)
