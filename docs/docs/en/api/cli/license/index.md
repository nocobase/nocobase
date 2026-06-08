---
title: "nb license"
description: "nb license command reference: manage NocoBase commercial licensing and licensed plugins."
keywords: "nb license,NocoBase CLI,commercial licensing,license"
---

# nb license

Manage NocoBase commercial licensing, including activating an existing license key, instance IDs, license status, and licensed plugins.

## Usage

```bash
nb license <command>
```

## Subcommands

| Command | Description |
| --- | --- |
| [`nb license activate`](./activate.md) | Activate commercial licensing for the current env with an existing license key |
| [`nb license id`](./id.md) | Show or generate the instance ID for the current env |
| [`nb license status`](./status.md) | Show commercial license status for the current env |
| [`nb license plugins`](./plugins/index.md) | Manage commercial plugins allowed by the current license |

## Examples

```bash
nb license id --env app1
nb license activate --env app1 --key-file ./license.txt
nb license status --env app1
nb license plugins list --env app1
nb license plugins sync --env app1
```

## Related Commands

- [`nb config`](../config/index.md)
- [`nb plugin`](../plugin/index.md)
- [`nb db check`](../db/check.md)
