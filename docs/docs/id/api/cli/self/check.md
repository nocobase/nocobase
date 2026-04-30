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
| `--channel` | string | Channel rilis untuk dibandingkan, default `auto`; opsi: `auto`, `latest`, `beta`, `alpha` |
| `--json` | boolean | Output JSON |

## Contoh

```bash
nb self check
nb self check --channel beta
nb self check --json
```

## Perintah Terkait

- [`nb self update`](./update.md)
