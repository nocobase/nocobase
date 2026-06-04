---
title: "nb config"
description: "nb config command reference: manage NocoBase CLI default configuration."
keywords: "nb config,NocoBase CLI,configuration,defaults"
---

# nb config

Manage CLI configuration defaults. Supported keys:

- `locale`
- `update.policy`
- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.git`
- `bin.yarn`

## Common Keys

| Key | Default | Description |
| --- | --- | --- |
| `locale` | current CLI locale resolution | Override the CLI locale |
| `update.policy` | `prompt` | Startup update behavior: `prompt`, `auto`, or `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | Package registry for commercial packages |
| `docker.network` | `nocobase` | Default Docker network used by CLI-managed Docker apps |
| `docker.container-prefix` | `nb` | Default container prefix used by CLI-managed Docker apps |
| `bin.docker` | `docker` | Override the Docker executable path |
| `bin.git` | `git` | Override the Git executable path |
| `bin.yarn` | `yarn` | Override the Yarn executable path |

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
nb config get update.policy
nb config set update.policy auto
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## Related Commands

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
