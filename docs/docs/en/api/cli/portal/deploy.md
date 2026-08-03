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
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |

## Examples

```bash
nb portal deploy customer
nb portal deploy customer --env dev --yes
```

## Notes

The command refreshes `.env` and `.env.local`, builds from the development path stored in the selected CLI env config, and syncs deployment output to the target app storage. Source storage and Git settings are managed by `nb portal config` in the remote portal record.

## Related Commands

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
