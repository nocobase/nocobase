---
title: 'nb config set'
description: 'nb config set command reference: set a CLI configuration item.'
keywords: 'nb config set,NocoBase CLI,set configuration'
---

# nb config set

Set a CLI configuration item. The currently supported configuration items are `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git`, and `bin.yarn`.

## Usage

```bash
nb config set <key> <value>
```

## Parameters

| Parameter | Type   | Description                                                                                                                             |
| --------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `<key>`   | string | Configuration item name: `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git`, or `bin.yarn` |
| `<value>` | string | Configuration value, cannot be empty                                                                                                    |

## Examples

```bash
nb config set locale zh-CN
nb config set update.policy auto
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set bin.docker /usr/local/bin/docker
nb config set bin.git /usr/bin/git
nb config set bin.yarn yarn
```

## Notes

`update.policy` supports `prompt`, `auto`, and `off`, and the default value is `prompt`.

## Related commands

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
