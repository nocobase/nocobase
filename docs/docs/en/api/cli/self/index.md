---
title: "nb self"
description: "nb self command reference: check or update the installed NocoBase CLI."
keywords: "nb self,NocoBase CLI,self update,version check"
---

# nb self

Check or update the installed NocoBase CLI.

## Usage

```bash
nb self <command>
```

## Subcommands

| Command | Description |
| --- | --- |
| [`nb self check`](./check.md) | Check current CLI version and self-update support |
| [`nb self update`](./update.md) | Update the globally npm-installed NocoBase CLI |

## Examples

```bash
nb self check
nb self check --json
nb self update --yes
```

## Related Commands

- [`nb skills`](../skills/)
- [`nb app upgrade`](../app/upgrade.md)
