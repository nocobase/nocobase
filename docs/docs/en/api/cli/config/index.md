---
title: 'nb config'
description: 'nb config command reference: manage the default configuration items of the NocoBase CLI.'
keywords: 'nb config,NocoBase CLI,configuration,default configuration'
---

# nb config

Manage the default CLI configuration. The currently supported configuration items include:

- `locale`
- `update.policy`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.git`
- `bin.yarn`

## Common configuration items

| Configuration item        | Default value                                 | Description                                                |
| ------------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| `locale`                  | Resolved according to the CLI's current rules | Override the language used by the CLI                      |
| `update.policy`           | `prompt`                                      | Update policy at startup: `prompt`, `auto`, or `off`       |
| `docker.network`          | `nocobase`                                    | Default network for Docker applications managed by the CLI |
| `docker.container-prefix` | `nb`                                          | Default prefix for Docker containers managed by the CLI    |
| `bin.docker`              | `docker`                                      | Override the Docker executable path                        |
| `bin.git`                 | `git`                                         | Override the Git executable path                           |
| `bin.yarn`                | `yarn`                                        | Override the Yarn executable path                          |

## Usage

```bash
nb config <command>
```

## Subcommands

| Command                           | Description                                                    |
| --------------------------------- | -------------------------------------------------------------- |
| [`nb config get`](./get.md)       | Read the effective value of a configuration item               |
| [`nb config set`](./set.md)       | Set a configuration item                                       |
| [`nb config delete`](./delete.md) | Delete an explicitly configured item                           |
| [`nb config list`](./list.md)     | List the configuration items that are currently explicitly set |

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

## Related commands

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
