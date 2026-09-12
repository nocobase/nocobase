---
title: "nb skills"
description: "nb skills command reference: check, install, update, or remove global NocoBase AI coding skills."
keywords: "nb skills,NocoBase CLI,skills,AI coding skills"
---

# nb skills

Check, install, update, or remove global NocoBase AI coding skills.

## Usage

```bash
nb skills <command>
```

## Subcommands

| Command | Description |
| --- | --- |
| [`nb skills check`](./check.md) | Check global NocoBase AI coding skills |
| [`nb skills install`](./install.md) | Install NocoBase AI coding skills globally |
| [`nb skills update`](./update.md) | Update installed NocoBase AI coding skills |
| [`nb skills remove`](./remove.md) | Remove NocoBase AI coding skills managed by `nb` |

## Examples

```bash
nb skills check
nb skills install --yes
nb skills update --json
nb skills remove --yes
```

## Related Commands

- [`nb init`](../init.md)
- [`nb self`](../self/index.md)
