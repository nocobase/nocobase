---
title: "nb env use"
description: "Referensi perintah nb env use: beralih env NocoBase CLI saat ini."
keywords: "nb env use,NocoBase CLI,beralih lingkungan,current env"
---

# nb env use

Beralih env CLI saat ini. Setelahnya, perintah yang melewati `--env` akan menggunakan env tersebut secara default.

Saat session mode aktif untuk shell atau runtime saat ini, perubahan ini hanya memengaruhi sesi saat ini.

Saat session mode tidak aktif, perubahan ini akan fallback ke pembaruan `last env` global. Dalam kasus itu, terminal atau runtime agent lain tanpa isolasi sesi juga bisa ikut terpengaruh.

## Penggunaan

```bash
nb env use <name>
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `<name>` | string | Nama env yang sudah dikonfigurasi untuk dipakai |

## Contoh

```bash
nb env use local
```

## Perintah Terkait

- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
