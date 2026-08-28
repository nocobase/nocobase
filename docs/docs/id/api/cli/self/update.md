---
title: "nb self update"
description: "Referensi perintah nb self update: memperbarui NocoBase CLI yang terinstal global melalui npm, pnpm, atau yarn."
keywords: "nb self update,NocoBase CLI,update,pembaruan mandiri"
---

# nb self update

Memperbarui NocoBase CLI yang terinstal saat CLI saat ini dikelola oleh instalasi global npm, pnpm, atau yarn standar.

## Penggunaan

```bash
nb self update [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--channel` | string | Channel rilis untuk diupdate, default `auto`; opsi: `auto`, `latest`, `test`, `beta`, `alpha` |
| `--yes`, `-y` | boolean | Lewati konfirmasi update |
| `--json` | boolean | Output JSON |
| `--skills` | boolean | Sekaligus memperbarui NocoBase AI coding skills yang terinstal secara global |
| `--verbose` | boolean | Menampilkan output update detail |

## Perilaku Update

`nb self update` terlebih dahulu mendeteksi metode instalasi saat ini saat runtime. Cache historis `self-install-methods.json` tidak digunakan.

Saat update tersedia, perintah ini menggunakan package manager yang sama dengan yang mengelola instalasi CLI global saat ini:

| Metode instalasi | Perintah update |
| --- | --- |
| `npm-global` | `npm install -g @nocobase/cli@<channel>` |
| `pnpm-global` | `pnpm add -g @nocobase/cli@<channel>` |
| `yarn-global` | `yarn global add @nocobase/cli@<channel>` |

Konfirmasi interaktif secara default bernilai yes. Gunakan `--yes` untuk melewati prompt di script.

## Contoh

```bash
nb self update
nb self update --yes
nb self update --skills
nb self update --channel alpha --json
```

## Perintah Terkait

- [`nb self check`](./check.md)
- [`nb skills update`](../skills/update.md)
