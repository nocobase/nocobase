---
title: "nb proxy nginx use"
description: "nb proxy nginx use command reference: switch the current driver for the Nginx provider."
keywords: "nb proxy nginx use,NocoBase CLI,nginx,driver"
---

# nb proxy nginx use

Switch the current driver for the Nginx provider.

## Usage

```bash
nb proxy nginx use <driver>
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `<driver>` | string | Supports `local` or `docker` |

## Examples

```bash
nb proxy nginx use local
nb proxy nginx use docker
```

## Notes

- This command saves the result to `proxy.nginx-driver`
- Later commands such as `start`, `reload`, `stop`, `status`, and `info` all use the current driver

## Related commands

- [`nb proxy nginx current`](./current.md)
- [`nb proxy nginx start`](./start.md)
