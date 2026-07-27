---
title: "nb portal info"
description: "nb portal info command reference: show Portal record and local workspace details."
keywords: "nb portal info,NocoBase CLI,Portal"
---

# nb portal info

Show details for the specified Portal record and local workspace

## Usage

```bash
nb portal info <portal> [flags]
```

## Flag

| Flag | Type | Description |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--json-output`, `-j` | boolean | Print Portal details as JSON. |

## Examples

```bash
nb portal info customer
nb portal info customer --env dev --yes
nb portal info customer --json-output
```

## Notes

Text output includes name, URL, development mode, local path, enabled status, and local sync status. `--json-output` prints `name`, `url`, `developmentMode`, `localPath`, `enabled`, `sourceStorage`, and `localSynced`. You can query by `routeName` or `uid`.

## Related Commands

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
