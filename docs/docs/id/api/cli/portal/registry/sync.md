---
title: "nb portal registry sync"
description: "Referensi perintah nb portal registry sync: pasang, bandingkan, atau perbarui item Registry dari plugin di AI Portal."
keywords: "nb portal registry sync,NocoBase CLI,Portal Registry,shadcn,AI Portal"
---

# nb portal registry sync

Pasang item NocoBase Portal Registry ke workspace AI Portal yang sudah ada. Perintah ini membaca indeks Registry dari layanan NocoBase yang dipilih, sehingga item dari plugin yang baru diaktifkan langsung tersedia tanpa ditulis secara tetap di template Portal.

## Penggunaan

```bash
nb portal registry sync <portal> [item...] [flag]
```

## Argumen dan flag

| Argumen atau flag | Tipe | Deskripsi |
| --- | --- | --- |
| `<portal>` | string | Nama atau slug AI Portal yang wajib diisi |
| `[item...]` | string[] | Nama item Registry opsional. Jika dihilangkan, semua item dari plugin aktif akan dipasang. Bentuk `ai` dan `@nocobase/ai` keduanya didukung |
| `--env`, `-e` | string | Nama env CLI; jika dihilangkan, env saat ini digunakan |
| `--yes`, `-y` | boolean | Lewati konfirmasi saat `--env` menunjuk ke env lain |
| `--overwrite` | boolean | Ganti file Registry yang sudah terpasang sambil mempertahankan file `src/components/ui` yang ada |
| `--overwrite-ui` | boolean | Izinkan `--overwrite` juga mengganti `src/components/ui`; memerlukan `--overwrite` |
| `--diff` | boolean | Tampilkan perbedaan tanpa mengubah Portal |
| `--build` | boolean | Jalankan `pnpm build` dan `pnpm build:html` setelah pemasangan |

## Contoh

Pasang semua item tersedia yang belum terpasang:

```bash
nb portal registry sync customer
```

Pasang item tertentu:

```bash
nb portal registry sync customer ai acl auth-sms
```

Bandingkan item terpasang dengan versi layanan:

```bash
nb portal registry sync customer ai --diff
```

Perbarui item sambil mempertahankan komponen UI dasar:

```bash
nb portal registry sync customer ai --overwrite
```

Timpa file Registry dan komponen UI dasar:

```bash
nb portal registry sync customer --overwrite --overwrite-ui
```

Pasang lalu build Portal:

```bash
nb portal registry sync customer --build
```

Gunakan env lain dalam alur noninteraktif:

```bash
nb portal registry sync customer --env dev --yes
```

## Perilaku

Perintah terlebih dahulu meminta indeks Registry dari layanan NocoBase yang dipilih. Server hanya mengembalikan item dari plugin yang aktif. Setelah itu, Registry `@nocobase` dikonfigurasi di `components.json` Portal dan item dipasang dengan CLI shadcn lokal milik Portal.

Secara default, item yang file targetnya sudah ada akan dilewati. Saat menambahkan item dan dependensi yang belum ada, file yang ada di `src/extensions` dan `src/components/ui` akan dilindungi.

Gunakan `--overwrite` hanya jika Anda memang ingin memperbarui file Registry yang sudah terpasang. Komponen UI dasar tetap dilindungi kecuali `--overwrite-ui` juga diberikan. Tinjau kustomisasi lokal sebelum menimpa file.

`--diff` bersifat hanya-baca dan tidak dapat digabungkan dengan `--overwrite`, `--overwrite-ui`, atau `--build`.

Jika Portal belum memiliki `node_modules`, perintah menjalankan `pnpm install --frozen-lockfile` sebelum memanggil shadcn.

## Perintah terkait

- [`nb portal registry`](./index.md)
- [`nb portal create`](../create.md)
- [`nb portal dev`](../dev.md)
- [`nb portal deploy`](../deploy.md)
