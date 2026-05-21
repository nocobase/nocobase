---
title: "nb config"
description: "nb config command reference: manage NocoBase CLI default configuration."
keywords: "nb config,NocoBase CLI,configuration,defaults"
---

# nb config

Manage CLI configuration defaults. Supported keys:

- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`

## Usage

```bash
nb config <command>
```

## Subcommands

| Command | Description |
| --- | --- |
| [`nb config get`](./get.md) | Get the effective value for a configuration key |
| [`nb config set`](./set.md) | Set a configuration value |
| [`nb config delete`](./delete.md) | Delete an explicitly configured value |
| [`nb config list`](./list.md) | List explicitly configured values |

## Examples

```bash
nb config list
nb config get docker.network
nb config set docker.network nocobase
nb config delete docker.container-prefix
```

## Related Commands

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
