---
title: "nb portal deploy"
description: "nb portal deploy command reference: build and deploy a Portal workspace."
keywords: "nb portal deploy,NocoBase CLI,Portal"
---

# nb portal deploy

Build dan deploy workspace Portal yang ditentukan

## Penggunaan

```bash
nb portal deploy <portal> [flags]
```

## Parameter

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |

## Contoh

```bash
nb portal deploy customer
nb portal deploy customer --env dev --yes
```

## Catatan

The command refreshes `.env` and `.env.local`, runs `pnpm build`, and expects `dist/index.html`. For `local` and `docker` envs, it syncs the Portal record and uses the local or volume-mounted `dist`; for `http` envs, it uploads the packed `dist` through the API.

## Perintah terkait

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
