---
title: "nb license plugins"
description: "nb license plugins command reference: inspect or synchronize commercial plugins allowed by the current license."
keywords: "nb license plugins,NocoBase CLI,commercial plugins,licensed plugins"
---

# nb license plugins

Inspect or synchronize commercial plugins allowed by the current license.

## Usage

```bash
nb license plugins <command>
```

## Subcommands

| Command | Description |
| --- | --- |
| [`nb license plugins list`](./list.md) | Show commercial plugins associated with the current license |
| [`nb license plugins sync`](./sync.md) | Synchronize commercial plugins allowed by the current license |
| [`nb license plugins clean`](./clean.md) | Remove downloaded commercial plugins for the current env |

## Examples

```bash
nb license plugins list --env app1
nb license plugins sync --env app1 --dry-run
nb license plugins clean --env app1 --verbose
```

## Related Commands

- [`nb license activate`](../activate.md)
- [`nb plugin list`](../../plugin/list.md)
