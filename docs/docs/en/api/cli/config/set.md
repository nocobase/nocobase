---
title: "nb config set"
description: "nb config set command reference: set a CLI configuration value."
keywords: "nb config set,NocoBase CLI,configuration"
---

# nb config set

Set a CLI configuration value. Supported keys are `license.pkg-url`, `docker.network`, and `docker.container-prefix`.

## Usage

```bash
nb config set <key> <value>
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `<key>` | string | Configuration key: `license.pkg-url`, `docker.network`, or `docker.container-prefix` |
| `<value>` | string | Configuration value; must not be empty |

## Examples

```bash
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
```

## Notes

When setting `license.pkg-url`, the CLI normalizes the URL so it ends with `/`.

## Related Commands

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
