---
title: "nb env use"
description: "Referensi perintah nb env use: beralih env NocoBase CLI saat ini."
keywords: "nb env use,NocoBase CLI,beralih lingkungan,current env"
---

# nb env use

Beralih env CLI saat ini. Setelahnya, perintah yang melewati `--env` akan menggunakan env tersebut secara default.

## Penggunaan

```bash
nb env use <name>
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `<name>` | string | Nama lingkungan yang sudah dikonfigurasi |

## Contoh

```bash
nb env use local
```

## Perintah Terkait

- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
