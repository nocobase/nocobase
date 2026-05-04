---
title: "nb config get"
description: "nb config get command reference: get the effective value for a CLI configuration key."
keywords: "nb config get,NocoBase CLI,configuration"
---

# nb config get

Get the effective value for a CLI configuration key. If no explicit value is set, the default value is returned.

## Usage

```bash
nb config get <key>
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `<key>` | string | Configuration key: `license.pkg-url`, `docker.network`, or `docker.container-prefix` |

## Examples

```bash
nb config get license.pkg-url
nb config get docker.network
nb config get docker.container-prefix
```

## Related Commands

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
