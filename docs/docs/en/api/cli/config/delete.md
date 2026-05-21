---
title: "nb config delete"
description: "nb config delete command reference: delete an explicitly configured CLI setting."
keywords: "nb config delete,NocoBase CLI,configuration"
---

# nb config delete

Delete an explicitly configured CLI setting. After deletion, the CLI falls back to the default value for that key.

## Usage

```bash
nb config delete <key>
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `<key>` | string | Configuration key: `license.pkg-url`, `docker.network`, or `docker.container-prefix` |

## Examples

```bash
nb config delete license.pkg-url
nb config delete docker.network
nb config delete docker.container-prefix
```

## Related Commands

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
