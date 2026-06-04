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
| `<key>` | string | Configuration key: `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git`, or `bin.yarn` |

## Examples

```bash
nb config get locale
nb config get update.policy
nb config get license.pkg-url
nb config get docker.network
nb config get docker.container-prefix
nb config get bin.git
```

## Related Commands

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
