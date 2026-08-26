---
title: "nb proxy caddy use"
description: "nb proxy caddy use command reference: switch the current driver for the Caddy provider."
keywords: "nb proxy caddy use,NocoBase CLI,caddy,driver"
---

# nb proxy caddy use

Switch the current driver for the Caddy provider.

## Usage

```bash
nb proxy caddy use <driver>
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `<driver>` | string | Supports `local` or `docker` |

## Examples

```bash
nb proxy caddy use local
nb proxy caddy use docker
```

## Notes

- This command saves the result to `proxy.caddy-driver`
- Later commands such as `start`, `reload`, `stop`, `status`, and `info` all use the current driver

## Related commands

- [`nb proxy caddy current`](./current.md)
- [`nb proxy caddy start`](./start.md)
