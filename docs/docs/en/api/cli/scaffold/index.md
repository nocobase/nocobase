---
title: "nb scaffold"
description: "nb scaffold command reference: generate NocoBase plugin and migration scaffolds."
keywords: "nb scaffold,NocoBase CLI,scaffold,plugin,migration"
---

# nb scaffold

Generate scaffolds for NocoBase plugin development.

## Usage

```bash
nb scaffold <command>
```

## Subcommands

| Command | Description |
| --- | --- |
| [`nb scaffold plugin`](./plugin.md) | Generate NocoBase plugin scaffold |
| [`nb scaffold migration`](./migration.md) | Generate plugin migration script |

## Examples

```bash
nb scaffold plugin @nocobase-example/plugin-hello
nb scaffold migration migration-name --pkg @nocobase/plugin-acl
```

## Related Commands

- [`nb plugin`](../plugin/index.md)
- [Plugin Development](../../../plugin-development/index.md)
