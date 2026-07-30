---
title: "nb portal deploy"
description: "nb portal deploy command reference: build and deploy a portal."
keywords: "nb portal deploy,NocoBase CLI,Portal"
---

# nb portal deploy

Build and deploy the specified portal

## Usage

```bash
nb portal deploy <portal> [flags]
```

## Flag

| Flag | Type | Description |
| --- | --- | --- |
| `--dir` | string | Portal workspace directory. Default: the current directory. |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |

## Examples

```bash
nb portal deploy customer
nb portal deploy customer --env dev --yes
```

## Notes

The command refreshes `.env` and `.env.local`, runs `pnpm build`, and expects `dist/index.html`. For `local`, `docker`, and `http` envs, it uploads the packed `dist` through the API and syncs the portal record.

## Related Commands

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
