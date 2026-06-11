---
title: "nb skills install"
description: "nb skills install command reference: install NocoBase AI coding skills globally."
keywords: "nb skills install,NocoBase CLI,install skills"
---

# nb skills install

Install NocoBase AI coding skills globally. If they are already installed, this command does not perform an update.

## Usage

```bash
nb skills install [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Skip installation confirmation |
| `--json` | boolean | Output JSON |
| `--verbose` | boolean | Show detailed installation output |

## Examples

```bash
nb skills install
nb skills install --yes
nb skills install --json
```

## Related Commands

- [`nb skills check`](./check.md)
- [`nb skills update`](./update.md)
