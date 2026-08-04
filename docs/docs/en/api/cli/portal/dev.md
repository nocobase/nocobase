---
title: "nb portal dev"
description: "nb portal dev command reference: start development mode for a Portal's local source directory."
keywords: "nb portal dev,NocoBase CLI,Portal"
---

# nb portal dev

Start development mode for the specified Portal's local source directory. It is normally used after [`nb portal create`](./create.md) or [`nb portal pull`](./pull.md).

It refreshes `.env` and `.env.local` in the local source directory, then runs `pnpm dev` there.

## Usage

```bash
nb portal dev <portal> [flags]
```

## Flag

| Flag | Type | Description |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |

## Examples

```bash
nb portal dev customer
nb portal dev customer --env dev --yes
```

## Notes

`dev` starts the dev server from the Portal's local source directory. It doesn't create a Portal record, and it doesn't pull remote source; if the local source directory doesn't exist, use [`nb portal create`](./create.md) or [`nb portal pull`](./pull.md) first.

The local source directory must contain `package.json`. `ssh` envs don't support starting Portal development mode yet.

## Related Commands

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
