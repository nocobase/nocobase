---
title: "nb plugin"
description: "nb plugin command reference: manage plugins for the selected NocoBase env."
keywords: "nb plugin,NocoBase CLI,plugin management,enable,disable,list"
---

# nb plugin

Manage plugins for the selected NocoBase env. npm/Git envs run plugin commands locally, Docker envs run them inside the saved app container, and HTTP envs fall back to API when available.

## Usage

```bash
nb plugin <command>
```

## Subcommands

| Command | Description |
| --- | --- |
| [`nb plugin list`](./list.md) | List installed plugins |
| [`nb plugin enable`](./enable.md) | Enable one or more plugins |
| [`nb plugin disable`](./disable.md) | Disable one or more plugins |

## Examples

```bash
nb plugin list -e local
nb plugin enable @nocobase/plugin-sample
nb plugin disable -e local @nocobase/plugin-sample
```

## Related Commands

- [`nb env info`](../env/info.md)
- [`nb scaffold plugin`](../scaffold/plugin.md)
