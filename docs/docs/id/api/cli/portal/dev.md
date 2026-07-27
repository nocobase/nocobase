---
title: "nb portal dev"
description: "nb portal dev command reference: start a Portal workspace in development mode."
keywords: "nb portal dev,NocoBase CLI,Portal"
---

# nb portal dev

Memulai mode pengembangan untuk workspace Portal yang ditentukan

## Penggunaan

```bash
nb portal dev <portal> [flags]
```

## Parameter

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |

## Contoh

```bash
nb portal dev customer
nb portal dev customer --env dev --yes
```

## Catatan

The workspace must contain `package.json`. The command refreshes `.env` and `.env.local`, then runs `pnpm dev`. `ssh` envs are not supported in the current version.

## Perintah terkait

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
