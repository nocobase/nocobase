---
title: "nb scaffold plugin"
description: "nb scaffold plugin command reference: generate NocoBase plugin scaffold."
keywords: "nb scaffold plugin,NocoBase CLI,plugin scaffold"
---

# nb scaffold plugin

Generate NocoBase plugin scaffold code.

## Usage

```bash
nb scaffold plugin <pkg> [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `<pkg>` | string | Plugin package name, required |
| `--force-recreate`, `-f` | boolean | Force recreating the plugin scaffold |

## Examples

```bash
nb scaffold plugin @nocobase-example/plugin-hello
nb scaffold plugin @nocobase-example/plugin-hello --force-recreate
```

## Related Commands

- [`nb scaffold migration`](./migration.md)
- [`nb plugin enable`](../plugin/enable.md)
