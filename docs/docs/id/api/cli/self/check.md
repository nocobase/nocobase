---
title: "nb self check"
description: "Referensi perintah nb self check: memeriksa versi NocoBase CLI yang terinstal dan dukungan pembaruan mandiri."
keywords: "nb self check,NocoBase CLI,pemeriksaan versi"
---

# nb self check

Memeriksa instalasi NocoBase CLI saat ini, mengurai versi terbaru dari channel yang dipilih, dan melaporkan apakah pembaruan mandiri otomatis didukung.

## Penggunaan

```bash
nb self check [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--channel` | string | Channel rilis untuk dibandingkan, default `auto`; opsi: `auto`, `latest`, `test`, `beta`, `alpha` |
| `--json` | boolean | Output JSON |

## Metode Instalasi

`nb self check` mendeteksi metode instalasi saat ini saat runtime. Cache historis `self-install-methods.json` tidak digunakan.

Perintah ini dapat melaporkan metode instalasi berikut:

| Metode instalasi | Arti |
| --- | --- |
| `npm-global` | CLI terinstal di bawah `npm prefix -g` saat ini. |
| `pnpm-global` | CLI terinstal di pohon `node_modules` global pnpm. |
| `yarn-global` | CLI dijalankan dari `yarn global bin` atau terinstal di bawah `yarn global dir`. |
| `package-local` | CLI terinstal di pohon dependency proyek lokal. |
| `source` | CLI berjalan dari checkout repository. |
| `unknown` | Instalasi CLI tidak dapat dicocokkan dengan metode instalasi yang didukung. |

Pembaruan mandiri didukung untuk `npm-global`, `pnpm-global`, dan `yarn-global`. Untuk `package-local` atau `source`, perbarui proyek induk atau checkout repository tersebut.

## Contoh

```bash
nb self check
nb self check --channel beta
nb self check --json
```

## Perintah Terkait

- [`nb self update`](./update.md)
