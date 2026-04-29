---
title: "nb env use"
description: "nb env use command reference: switch the current NocoBase CLI env."
keywords: "nb env use,NocoBase CLI,switch environment,current env"
---

# nb env use

Switch the current CLI env. Commands that omit `--env` will use this env by default afterward.

## Usage

```bash
nb env use <name>
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `<name>` | string | Configured env name |

## Examples

```bash
nb env use local
```

## Related Commands

- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
