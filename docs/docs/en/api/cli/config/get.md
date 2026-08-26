---
title: "nb config get"
description: "nb config get command reference: read the effective value of a CLI configuration item."
keywords: "nb config get,NocoBase CLI,read configuration"
---

# nb config get

Read the effective value of the specified CLI configuration item. If it has not been explicitly set, the default value is returned.

## Usage

```bash
nb config get <key>
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `<key>` | string | Configuration item name. See [`nb config`](./index.md) for supported values |

## Examples

```bash
nb config get locale
nb config get update.policy
nb config get license.pkg-url
nb config get docker.network
nb config get docker.container-prefix
nb config get proxy.nb-cli-root
nb config get proxy.upstream-host
nb config get proxy.nginx-driver
nb config get proxy.caddy-driver
nb config get bin.nginx
nb config get bin.git
```

## Related commands

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
