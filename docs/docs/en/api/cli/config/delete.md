---
title: 'nb config delete'
description: 'nb config delete command reference: delete an explicitly set CLI configuration item.'
keywords: 'nb config delete,NocoBase CLI,delete configuration'
---

# nb config delete

Delete an explicitly set CLI configuration item. After deletion, the configuration item falls back to its default value.

## Usage

```bash
nb config delete <key>
```

## Parameters

| Parameter | Type   | Description                                                                                                                             |
| --------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `<key>`   | string | Configuration item name: `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git`, or `bin.yarn` |

## Examples

```bash
nb config delete locale
nb config delete update.policy
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete bin.git
```

## Related commands

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
