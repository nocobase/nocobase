---
title: "nb scaffold migration"
description: "nb scaffold migration command reference: generate NocoBase plugin migration scripts."
keywords: "nb scaffold migration,NocoBase CLI,migration script,migration"
---

# nb scaffold migration

Generate plugin migration script files.

## Usage

```bash
nb scaffold migration <name> --pkg <pkg> [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `<name>` | string | Migration script name, required |
| `--pkg` | string | Owning plugin package name, required |
| `--on` | string | Execution timing: `beforeLoad`, `afterSync`, or `afterLoad` |

## Examples

```bash
nb scaffold migration migration-name --pkg @nocobase/plugin-acl
nb scaffold migration migration-name --pkg @nocobase/plugin-acl --on afterLoad
```

## Related Commands

- [`nb scaffold plugin`](./plugin.md)
- [Plugin Development](../../../plugin-development/index.md)
