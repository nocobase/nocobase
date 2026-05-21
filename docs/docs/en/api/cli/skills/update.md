---
title: "nb skills update"
description: "nb skills update command reference: update global NocoBase AI coding skills."
keywords: "nb skills update,NocoBase CLI,update skills"
---

# nb skills update

Update globally installed NocoBase AI coding skills. This command only updates an existing `@nocobase/skills` installation.

## Usage

```bash
nb skills update [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Skip update confirmation |
| `--json` | boolean | Output JSON |
| `--verbose` | boolean | Show detailed update output |

## Examples

```bash
nb skills update
nb skills update --yes
nb skills update --json
```

## Related Commands

- [`nb skills check`](./check.md)
- [`nb skills install`](./install.md)
