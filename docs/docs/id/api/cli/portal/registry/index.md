---
title: "nb portal registry"
description: "Referensi perintah nb portal registry: kelola item Portal Registry dari plugin di workspace AI Portal."
keywords: "nb portal registry,NocoBase CLI,Portal Registry,shadcn,AI Portal"
---

# nb portal registry

Kelola item NocoBase Portal Registry di workspace AI Portal. Plugin server yang diaktifkan dapat menyediakan integrasi frontend yang dapat digunakan kembali, seperti komponen, hook, adaptor, dan halaman demo. Perintah Registry memasang integrasi tersebut ke dalam kode sumber Portal.

## Penggunaan

```bash
nb portal registry <perintah>
```

## Subperintah

| Perintah | Deskripsi |
| --- | --- |
| [`nb portal registry sync`](./sync.md) | Pasang atau perbarui item Registry yang disediakan oleh plugin NocoBase yang aktif |

## Persyaratan

- Workspace Portal harus sudah ada dan memiliki `package.json` serta `components.json`.
- Env NocoBase yang dipilih harus menyediakan API Portal Registry.
- Hanya item Registry dari plugin yang aktif yang tersedia.

## Contoh

Pasang semua item Registry yang tersedia ke Portal `customer`:

```bash
nb portal registry sync customer
```

Pasang item tertentu:

```bash
nb portal registry sync customer ai acl auth-sms
```

## Perintah terkait

- [`nb portal create`](../create.md)
- [`nb portal dev`](../dev.md)
- [`nb portal deploy`](../deploy.md)
