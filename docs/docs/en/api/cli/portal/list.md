---
title: "nb portal list"
description: "nb portal list command reference: list Portal records and local workspace sync status."
keywords: "nb portal list,NocoBase CLI,Portal"
---

# nb portal list

List Portal records and local workspace sync status

## Usage

```bash
nb portal list [flags]
```

## Flag

| Flag | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--json-output`, `-j` | boolean | Print Portal records as JSON. |

## Examples

```bash
nb portal list
nb portal list --env dev --yes
nb portal list --json-output
```

## Notes

The list shows name, URL, portal type, source storage, local path, enabled status, and local sync status. Only `ai` portals have local workspace sync checks; other Portal types show an empty sync status.

## Related Commands

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
