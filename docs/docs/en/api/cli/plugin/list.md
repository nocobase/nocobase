---
title: "nb plugin list"
description: "nb plugin list command reference: list plugins for the selected NocoBase env."
keywords: "nb plugin list,NocoBase CLI,plugin list"
---

# nb plugin list

List installed plugins for the selected env.

## Usage

```bash
nb plugin list [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name; uses the current env if omitted |

## Examples

```bash
nb plugin list
nb plugin list -e local
nb plugin list -e local-docker
```

## Related Commands

- [`nb plugin enable`](./enable.md)
- [`nb plugin disable`](./disable.md)
