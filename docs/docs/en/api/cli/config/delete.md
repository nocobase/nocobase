---
title: "nb config delete"
description: "nb config delete command reference: delete an explicitly set CLI configuration item."
keywords: "nb config delete,NocoBase CLI,delete configuration"
---

# nb config delete

Delete an explicitly set CLI configuration item. After deletion, the configuration item falls back to its default value.

## Usage

```bash
nb config delete <key>
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `<key>` | string | Configuration item name. See [`nb config`](./index.md) for supported values |

## Examples

```bash
nb config delete locale
nb config delete update.policy
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete proxy.nb-cli-root
nb config delete proxy.upstream-host
nb config delete proxy.nginx-driver
nb config delete proxy.caddy-driver
nb config delete bin.nginx
nb config delete bin.git
nb config delete bin.pnpm
```

## Related commands

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
