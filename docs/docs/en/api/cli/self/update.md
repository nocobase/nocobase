---
title: "nb self update"
description: "nb self update command reference: update the globally npm-installed NocoBase CLI."
keywords: "nb self update,NocoBase CLI,update,self update"
---

# nb self update

Update the installed NocoBase CLI when the current CLI is managed by a standard global npm installation.

## Usage

```bash
nb self update [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--channel` | string | Release channel to update to, default `auto`; options: `auto`, `latest`, `beta`, `alpha` |
| `--yes`, `-y` | boolean | Skip update confirmation |
| `--json` | boolean | Output JSON |
| `--verbose` | boolean | Show detailed update output |

## Examples

```bash
nb self update
nb self update --yes
nb self update --channel alpha --json
```

## Related Commands

- [`nb self check`](./check.md)
- [`nb skills update`](../skills/update.md)
