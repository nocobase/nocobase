---
title: "nb app upgrade"
description: "Referensi perintah nb app upgrade: menghentikan aplikasi, mengganti source code atau image yang tersimpan, lalu menjalankan alur upgrade dan start untuk aplikasi NocoBase yang dipilih."
keywords: "nb app upgrade,NocoBase CLI,upgrade,memperbarui,Docker image"
---

# nb app upgrade

Memperbarui aplikasi NocoBase yang dipilih. CLI akan menghentikan aplikasi saat ini terlebih dahulu, secara default mengganti source code atau image yang tersimpan, menyinkronkan plugin komersial, lalu menjalankan alur upgrade dan start aplikasi, kemudian memperbarui runtime env di akhir. Env Docker akan membuat ulang container aplikasi dari konfigurasi env yang tersimpan saat startup.

## Penggunaan

```bash
nb app upgrade [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI yang akan di-upgrade, jika dilewati menggunakan env saat ini |
| `--yes`, `-y` | boolean | Saat `--env` yang diberikan secara eksplisit menargetkan env yang berbeda dari env saat ini, lewati konfirmasi interaktif |
| `--force`, `-f` | boolean | Lewati konfirmasi upgrade. Flag ini wajib diberikan secara eksplisit di terminal non-interaktif dan sesi AI agent |
| `--skip-download`, `-s` | boolean | Lewati download source code atau image, lalu jalankan alur upgrade dan start berdasarkan source code lokal atau image Docker yang saat ini tersimpan; juga melewati `nb license plugins sync` |
| `--version` | string | Menimpa versi target untuk upgrade ini; saat berhasil, versi baru akan ditulis kembali ke `downloadVersion` di konfigurasi env |
| `--verbose` | boolean | Menampilkan output perintah update dan restart yang mendasarinya |

## Contoh

```bash
nb app upgrade
nb app upgrade --force
nb app upgrade --env local
nb app upgrade --env local --force
nb app upgrade --env local --skip-download
nb app upgrade --env local --skip-download --version beta
nb app upgrade --env local --version beta
nb app upgrade --env local --verbose
nb app upgrade --env local-docker --skip-download
```

Jika Anda memberikan `--env` secara eksplisit dan nilainya berbeda dari env saat ini, CLI akan meminta konfirmasi terlebih dahulu. Pada terminal non-interaktif atau sesi AI agent, tambahkan `--yes` sendiri atau jalankan `nb env use <name>` terlebih dahulu lalu coba lagi.

Sebelum upgrade benar-benar dimulai, terminal interaktif juga akan meminta konfirmasi upgrade tambahan kecuali Anda memberikan `--force`. Pada terminal non-interaktif dan sesi AI agent, `nb app upgrade` akan menolak berjalan tanpa `--force` dan menampilkan perintah ulang yang bisa langsung disalin. Jika sekaligus merupakan operasi cross-env, Anda memerlukan `--yes` dan `--force`.

Secara default, `nb app upgrade` menjalankan langkah-langkah berikut:

1. `nb app stop`
2. `nb source download --replace`
3. `nb license plugins sync --skip-if-no-license`
4. `nb app start`
5. Menyimpan `downloadVersion` baru bila diperlukan
6. `nb env update`

Saat `--skip-download` diberikan, CLI akan melewati langkah 2 dan 3 lalu langsung menjalankan alur upgrade dan start berdasarkan source code atau image yang saat ini tersimpan. Jika `--version` juga diberikan, CLI tidak akan mengunduh versi itu pada proses ini; sebagai gantinya, CLI hanya menyimpannya sebagai `downloadVersion` baru setelah start berhasil agar upgrade berikutnya bisa menggunakannya.

Pada langkah 4, CLI akan otomatis menyelesaikan persiapan upgrade yang diperlukan sesuai status kode saat ini, lalu menunggu aplikasi lolos `__health_check`. Selama menunggu, CLI akan menampilkan satu baris waiting terlebih dahulu, lalu satu baris progress setiap 10 detik sampai aplikasi siap atau health check kehabisan waktu.

Jika langkah terakhir `nb env update` gagal, upgrade tetap dianggap berhasil. CLI akan menampilkan warning dan meminta Anda menjalankan `nb env update <envName>` secara manual setelahnya.

## Script hook

Jika env saat ini menyimpan hook dengan `nb init --hook-script`, `nb app upgrade` meneruskan lifecycle upgrade ke hook. Untuk source npm/Git, refresh source menjalankan `beforeDependencyInstall(context)` sebelum instalasi dependensi dengan `context.phase = 'upgrade'` dan `context.command = 'app:upgrade'`.

Langkah startup upgrade app kemudian menjalankan `beforeAppInstall(context)`, dan setelah app start serta lolos `__health_check`, menjalankan `afterAppStart(context)`. Kedua hook ini juga menggunakan `context.phase = 'upgrade'` dan `context.command = 'app:upgrade'`. Docker source tidak menjalankan `beforeDependencyInstall`, tetapi tetap menjalankan hook level app.

## Perintah Terkait

- [`nb source download`](../source/download.md)
- [`nb app restart`](./restart.md)
- [`nb self update`](../self/update.md)
