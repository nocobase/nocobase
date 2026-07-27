---
title: "nb portal dev"
description: "nb portal dev command reference: start a Portal in development mode."
keywords: "nb portal dev,NocoBase CLI,Portal"
---

# nb portal dev

Khởi động chế độ phát triển cho workspace Portal đã chỉ định

## Cách dùng

```bash
nb portal dev <portal> [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |

## Ví dụ

```bash
nb portal dev customer
nb portal dev customer --env dev --yes
```

## Ghi chú

The workspace must contain `package.json`. The command refreshes `.env` and `.env.local`, then runs `pnpm dev`. `ssh` envs are not supported in the current version.

## Lệnh liên quan

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
