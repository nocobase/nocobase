---
title: 'nb config'
description: 'nb config command reference: manage default configuration items for the NocoBase CLI.'
keywords: 'nb config,NocoBase CLI,configuration,default configuration'
---

# nb config

Manage default CLI configuration values. The currently supported keys are mainly grouped like this:

- CLI itself: `locale`, `update.policy`, `license.pkg-url`
- Docker runtime: `docker.network`, `docker.container-prefix`
- Official NocoBase images: `nb-image-registry`, `nb-image-variant`
- External executables: `bin.docker`, `bin.caddy`, `bin.git`, `bin.nginx`, `bin.pnpm`, `bin.yarn`
- Proxy generation: `proxy.nb-cli-root`, `proxy.upstream-host`, `proxy.nginx-driver`, `proxy.caddy-driver`

Most projects only need a few of these keys. In practice, the most common ones are:

- `update.policy`
- `docker.network`
- `docker.container-prefix`
- `nb-image-registry`
- `nb-image-variant`
- `bin.nginx` or `bin.caddy`
- `proxy.nginx-driver` or `proxy.caddy-driver`

## Common configuration keys

| Key                       | Default                                             | Description                                                                                                                     |
| ------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `locale`                  | resolved by the current CLI rules                   | Override the language used by the CLI                                                                                           |
| `update.policy`           | `prompt`                                            | Startup update policy: `prompt`, `auto`, or `off`                                                                               |
| `license.pkg-url`         | `https://pkg.nocobase.com/`                         | Override the download URL for commercial extension packages                                                                     |
| `docker.network`          | `nocobase`                                          | Default network for CLI-managed Docker apps                                                                                     |
| `docker.container-prefix` | `nb`                                                | Default prefix for CLI-managed Docker containers                                                                                |
| `nb-image-registry`       | `dockerhub`                                         | Default registry family for official NocoBase images: `dockerhub` or `aliyun`                                                   |
| `nb-image-variant`        | `full`                                              | Default tag variant for official NocoBase app images: `standard`, `no-nginx`, `full`, or `full-no-nginx`                        |
| `bin.docker`              | `docker`                                            | Override the Docker executable path                                                                                             |
| `bin.caddy`               | `caddy`                                             | Override the Caddy executable path                                                                                              |
| `bin.git`                 | `git`                                               | Override the Git executable path                                                                                                |
| `bin.nginx`               | `nginx`                                             | Override the Nginx executable path                                                                                              |
| `bin.pnpm`                | `pnpm`                                              | Override the pnpm executable path                                                                                               |
| `bin.yarn`                | `yarn`                                              | Override the Yarn executable path                                                                                               |
| `proxy.nb-cli-root`       | CLI root, usually the current user's home directory | Override the root path visible to the generated proxy config when the proxy process and CLI do not see the same filesystem root |
| `proxy.upstream-host`     | `127.0.0.1`                                         | Override the host used when the proxy forwards traffic back to the NocoBase app                                                 |
| `proxy.nginx-driver`      | `local`                                             | Default runtime driver used by `nb proxy nginx`                                                                                 |
| `proxy.caddy-driver`      | `local`                                             | Default runtime driver used by `nb proxy caddy`                                                                                 |

## Usage

```bash
nb config <command>
```

## Subcommands

| Command                           | Description                                                   |
| --------------------------------- | ------------------------------------------------------------- |
| [`nb config get`](./get.md)       | Read the effective value of a configuration key               |
| [`nb config set`](./set.md)       | Set a configuration key                                       |
| [`nb config delete`](./delete.md) | Delete an explicitly set configuration key                    |
| [`nb config list`](./list.md)     | List the configuration keys that are currently set explicitly |

## Examples

```bash
nb config list
nb config get update.policy
nb config set update.policy auto
nb config get proxy.nb-cli-root
nb config set proxy.nb-cli-root /workspace
nb config set proxy.upstream-host host.docker.internal
nb config set proxy.nginx-driver docker
nb config set proxy.caddy-driver local
nb config get docker.network
nb config set docker.network nocobase
nb config get nb-image-registry
nb config set nb-image-registry aliyun
nb config set nb-image-variant full-no-nginx
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.git /usr/bin/git
nb config set bin.pnpm /usr/local/bin/pnpm
nb config delete docker.container-prefix
```

## Notes

- `bin.nginx` and `bin.caddy` only affect the `local` driver for `nb proxy nginx` and `nb proxy caddy`
- `bin.pnpm` is used when commands need to run pnpm directly, such as updating a pnpm-managed global CLI install with `nb self update`
- `nb-image-registry` only affects official NocoBase image defaults used by the CLI. `dockerhub` maps app images to `nocobase/nocobase`, while `aliyun` maps them to `registry.cn-shanghai.aliyuncs.com/nocobase/nocobase`
- `nb-image-variant` only affects official NocoBase app image tags. With version tag `1.7.14`, the CLI resolves `standard` to `1.7.14`, `no-nginx` to `1.7.14-no-nginx`, `full` to `1.7.14-full`, and `full-no-nginx` to `1.7.14-full-no-nginx`
- When `nb-image-registry=aliyun`, the CLI also switches the default built-in database images to the official Aliyun mirrors for PostgreSQL, MySQL, MariaDB, and Kingbase
- `proxy.nginx-driver` and `proxy.caddy-driver` store the default driver used by each provider
- `proxy.nb-cli-root` and `proxy.upstream-host` are advanced proxy overrides. Most CLI-managed `local` or `docker` envs can use the defaults directly
- If you only want to switch the active proxy driver, using `nb proxy nginx use` or `nb proxy caddy use` is usually clearer than setting the config key manually

## Related commands

- [`nb init`](../init.md)
- [`nb proxy`](../proxy/index.md)
- [`nb license`](../license/index.md)
