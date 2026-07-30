---
title: "nb portal deploy"
description: "nb portal deploy command reference: build and deploy a Portal."
keywords: "nb portal deploy,NocoBase CLI,Portal"
---

# nb portal deploy

Build và triển khai workspace Portal đã chỉ định

## Cách dùng

```bash
nb portal deploy <portal> [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--dir` | string | Portal workspace directory. Default: the current directory. |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |

## Ví dụ

```bash
nb portal deploy customer
nb portal deploy customer --env dev --yes
```

## Ghi chú

The command refreshes `.env` and `.env.local`, runs `pnpm build`, and expects `dist/index.html`. For `local`, `docker`, and `http` envs, it uploads the packed `dist` through the API and syncs the Portal record.

## Lệnh liên quan

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
