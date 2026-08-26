---
title: "nb self check"
description: "nb self check command reference: check installed NocoBase CLI version and self-update support."
keywords: "nb self check,NocoBase CLI,version check"
---

# nb self check

Check the current NocoBase CLI installation, resolve the latest version for the selected channel, and report whether automatic self-update is supported.

## Usage

```bash
nb self check [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--channel` | string | Release channel to compare with, default `auto`; options: `auto`, `latest`, `beta`, `alpha` |
| `--json` | boolean | Output JSON |

## Examples

```bash
nb self check
nb self check --channel beta
nb self check --json
```

## Related Commands

- [`nb self update`](./update.md)
