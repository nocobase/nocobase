---
title: "nb config set"
description: "nb config set command reference: set a CLI configuration value."
keywords: "nb config set,NocoBase CLI,configuration"
---

# nb config set

Set a CLI configuration value. Supported keys are `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git`, and `bin.yarn`.

## Usage

```bash
nb config set <key> <value>
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `<key>` | string | Configuration key: `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git`, or `bin.yarn` |
| `<value>` | string | Configuration value; must not be empty |

## Examples

```bash
nb config set locale zh-CN
nb config set update.policy auto
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set bin.docker /usr/local/bin/docker
nb config set bin.git /usr/bin/git
nb config set bin.yarn yarn
```

## Notes

When setting `license.pkg-url`, the CLI normalizes the URL so it ends with `/`.

`update.policy` supports `prompt`, `auto`, and `off`. The default is `prompt`.

## Related Commands

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
