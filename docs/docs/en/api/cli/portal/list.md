---
title: "nb portal list"
description: "nb portal list command reference: list portal records and development paths."
keywords: "nb portal list,NocoBase CLI,Portal"
---

# nb portal list

List portal records and development paths

## Usage

```bash
nb portal list [flags]
```

## Flag

| Flag | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--json-output`, `--json`, `-j` | boolean | Print portal records as JSON. |

## Examples

```bash
nb portal list
nb portal list --env dev --yes
nb portal list --json
```

## Notes

The list shows name, URL, portal type, source storage, development path, enabled status, and default status. `--json-output` and its alias `--json` print `name`, `url`, `portalType`, `developmentPath`, `deploymentPath`, `enabled`, `isDefault`, and `sourceStorage`.

## Related Commands

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
