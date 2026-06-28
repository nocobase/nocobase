---
title: "nb config set"
description: "nb config set command reference: set a CLI configuration item."
keywords: "nb config set,NocoBase CLI,set configuration"
---

# nb config set

Set a CLI configuration item. See [`nb config`](./index.md) for supported configuration keys.

## Usage

```bash
nb config set <key> <value>
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `<key>` | string | Configuration item name. See [`nb config`](./index.md) for supported values |
| `<value>` | string | Configuration value, cannot be empty |

## Examples

```bash
nb config set locale zh-CN
nb config set update.policy auto
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set bin.docker /usr/local/bin/docker
nb config set bin.caddy /opt/homebrew/bin/caddy
nb config set bin.git /usr/bin/git
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.pnpm /usr/local/bin/pnpm
nb config set proxy.nb-cli-root /workspace
nb config set proxy.upstream-host host.docker.internal
nb config set proxy.nginx-driver docker
nb config set proxy.caddy-driver local
nb config set bin.yarn yarn
```

## Notes

`update.policy` supports `prompt`, `auto`, and `off`, and the default value is `prompt`.

## Related commands

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
