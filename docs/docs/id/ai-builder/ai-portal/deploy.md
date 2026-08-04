---
title: "Deployment dan Manajemen Source"
description: "Alur lengkap pengembangan, push, dan deployment AI Portal, serta dua mode source storage dan cara deployment multi-lingkungan."
keywords: "AI Portal,deployment,source storage,Git,nb portal deploy,nb portal push,multi-lingkungan"
---

# Deployment dan Manajemen Source

:::tip Prasyarat

Sebelum membaca halaman ini, harap pastikan Anda telah menjalankan Portal pertama Anda sesuai [Mulai Cepat AI Portal](./index.md).

:::

Source Portal berada di tiga lokasi: workspace pengembangan lokal, source storage, dan artefak yang sudah di-deploy. `nb portal` bertugas menyinkronkan ketiganya.

## Siklus Hidup Lengkap

Siklus pengembangan sehari-hari berjalan seperti ini:

```text
dev (pengembangan lokal) → push (mendorong source) → deploy (build dan deploy)
```

Dengan rincian:

1. `nb portal dev <portal>` — Menjalankan server pengembangan lokal, ubah kode dan lihat hasilnya
2. `nb portal push <portal>` — Mendorong perubahan source lokal ke source storage
3. `nb portal deploy <portal>` — Build dan deploy, agar perubahan berlaku bagi pengguna

Jika yang Anda terima adalah Portal yang sudah dibuat rekan kerja, atau Anda berganti mesin, tarik dulu ke lokal baru mulai mengembangkan:

```bash
nb portal list                 # Lihat Portal apa saja yang ada
nb portal pull customer        # Tarik source ke lokal
nb portal dev customer         # Mulai mengembangkan
```

`pull` akan mengunduh dan mengekstrak source ke workspace pengembangan, dengan lokasi default `./<portal>`, dan Anda dapat menentukan lokasi lain dengan `--path`. Dependensi akan dipasang otomatis; di CI atau ketika Anda ingin memasangnya sendiri, tambahkan `--no-install` untuk melewatinya.

Setelah penarikan berhasil, lokasi workspace pengembangan dicatat di CLI env config, sehingga `dev`, `push`, dan `deploy` berikutnya membaca source dari lokasi tersebut tanpa perlu Anda tentukan berulang kali.

## Menambahkan Portal Baru

Satu aplikasi dapat memiliki beberapa Portal, dengan halaman dan Permission yang saling terpisah, tetapi datanya dipakai bersama. Misalnya satu entry untuk karyawan internal dan satu entry untuk pelanggan eksternal:

```bash
nb portal create customer
```

Saat dibuat, `./customer` akan dihasilkan di direktori saat ini sebagai workspace pengembangan berdasarkan template `@nocobase/portal-template-default`, lalu `.env` dan `.env.local` ditulis, dan dependensi dipasang otomatis. Jika ingin meletakkannya di tempat lain, tentukan dengan `--path`.

<!-- 需要一张 nb portal create 执行完成后的终端输出截图 -->

Nama Portal hanya boleh memakai huruf kecil, angka, garis bawah, dan tanda hubung, serta harus diawali huruf kecil atau angka.

## source storage

Source Portal dapat disimpan di dua tempat:

| Cara | Deskripsi | Kapan dipakai |
| --- | --- | --- |
| `nocobase` | Cara default, source dikelola oleh source storage di sisi NocoBase | Mulai cepat, dikembangkan sendirian, tidak butuh code review |
| `git` | Source disimpan ke repositori Git yang ditentukan | Kolaborasi tim, butuh code review, perlu integrasi CI |

Cara default `nocobase` paling cepat untuk memulai karena Anda tidak perlu menyiapkan repositori lebih dulu. Namun cara ini tidak punya riwayat versi, sehingga perubahan yang salah hanya bisa dikembalikan dengan menimpa seluruhnya. **Jika Portal ini akan diiterasi dalam jangka panjang, disarankan segera beralih ke Git.**

### Beralih ke Git

`create` hanya bertugas menghasilkan workspace pengembangan, sedangkan konfigurasi source storage seluruhnya diserahkan ke `config`. Setelah pembuatan selesai, Anda dapat beralih kapan saja:

```bash
nb portal config customer \
  --source-storage git \
  --git-repo git@github.com:nocobase/customer-portal.git

nb portal push customer --message "Move customer portal source to Git"
```

`config` akan menyinkronkan konfigurasi source storage ke record Portal di remote, sehingga `push` berikutnya berjalan melalui Git.

Ketika satu repositori berisi satu Portal, `--git-path` cukup memakai direktori root repositori yang default. Anda baru perlu menentukan subdirektori jika ingin menempatkan beberapa Portal di dalam satu repositori yang sama:

```bash
nb portal config customer --git-path portals/customer
```

### Menarik Sementara dari Repositori Lain

Jika ingin mencoba source dari repositori lain tanpa mengubah konfigurasi Portal, `pull` mendukung penentuan sementara:

```bash
nb portal pull customer --git-repo git@github.com:nocobase/another-portal.git
```

Cara ini tidak mengubah record Portal di remote, dan `--git-branch` serta `--git-path` hanya dapat dipakai bersama `--git-repo`. Untuk mengubahnya menjadi penyimpanan Git secara permanen, tetap gunakan `config` seperti di atas.

`config` juga dapat mengubah lokasi workspace pengembangan — misalnya setelah source dipindahkan ke direktori lain, beri tahu CLI lokasi barunya dengan `--path`:

```bash
nb portal config customer --path ./workspaces/customer
```

## Perbedaan Antar Tipe env

Perilaku sinkronisasi `nb portal` berbeda-beda pada env yang berbeda:

| Tipe env | Deskripsi |
| --- | --- |
| `local` | Aplikasi berada di mesin saat ini. `pull` menarik source ke workspace pengembangan, `deploy` melakukan build dari workspace pengembangan lalu menyinkronkan artefak deployment |
| `docker` | Aplikasi berjalan di dalam Docker, dibagikan melalui volume, dengan perilaku yang sama seperti di atas |
| `http` | Disinkronkan melalui API. `pull` / `push` akan mengunduh atau mengunggah arsip source |

Env bertipe `ssh` untuk saat ini belum mendukung manajemen Portal.

## Deployment Multi-lingkungan

Portal yang sama dapat di-deploy ke lingkungan yang berbeda, dengan `--env` untuk menentukan targetnya:

```bash
nb portal deploy customer --env prod --yes
```

`--yes` digunakan untuk melewati konfirmasi interaktif. Ketika `--env` yang Anda tentukan secara eksplisit berbeda dengan env saat ini, secara default CLI akan berhenti dan bertanya; saat menjalankannya di dalam skrip atau CI, ingat untuk menyertakan `--yes`, jika tidak perintahnya akan tertahan di tahap konfirmasi.

Untuk rilis struktur tabel data dan konfigurasi lintas lingkungan, silakan lihat [Manajemen Publikasi](../publish.md).

## Path Akses

Setelah deployment selesai, path akses Portal adalah:

```text
<appPublicPath>/x/<portal>/
```

Jika Portal berada di bawah sub-aplikasi:

```text
<appPublicPath>/x/apps/<app>/<portal>/
```

Prefix `/x/` ini khusus untuk AI Portal, sedangkan Portal no-code memakai `/v/`.

## Menghapus Portal

```bash
nb portal destroy customer
```

Operasi ini akan menghapus record Portal dan file yang sudah di-deploy, sedangkan workspace pengembangan lokal secara default dipertahankan. Jika Anda memang ingin menghapus workspace pengembangan sekalian, tambahkan `--delete-dev-path`.

## Tautan Terkait

- [Mulai Cepat AI Portal](./index.md) — Jalankan entry frontend pertama yang ditulis AI
- [Membangun Bersama AI Agent](./agent-workflow.md) — Gerakkan AI menulis halaman dengan bahasa natural
- [Struktur Proyek dan Tech Stack](./project-structure.md) — Penjelasan perintah build dan environment variable
- [Manajemen Publikasi](../publish.md) — Merilis struktur tabel data dan konfigurasi lintas lingkungan
- [Referensi Perintah `nb portal`](../../api/cli/portal/index.md) — Penjelasan parameter lengkap untuk semua perintah Portal
- [`nb portal create`](../../api/cli/portal/create.md) — Semua parameter untuk membuat Portal
- [`nb portal config`](../../api/cli/portal/config.md) — Menyesuaikan source storage dan path workspace pengembangan
- [`nb portal push`](../../api/cli/portal/push.md) — Mendorong source ke source storage
- [`nb portal deploy`](../../api/cli/portal/deploy.md) — Build dan deploy Portal
- [`nb portal pull`](../../api/cli/portal/pull.md) — Menarik source dari source storage
- [`nb portal destroy`](../../api/cli/portal/destroy.md) — Menghapus record Portal dan file yang sudah di-deploy
