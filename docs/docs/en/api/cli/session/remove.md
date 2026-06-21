---
title: "nb session remove"
description: "nb session remove command reference: remove shell or runtime integration for NB_SESSION_ID."
keywords: "nb session remove,NocoBase CLI,NB_SESSION_ID,remove session integration"
---

# nb session remove

Remove session integration for `NB_SESSION_ID`.

This command cleans up shell configuration previously written by [`nb session setup`](./setup.md). If opencode plugin integration is detected, it removes that integration too.

## Usage

```bash
nb session remove [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--shell` | string | Target shell. Supported values: `bash`, `zsh`, `fish`, `powershell`, `cmd` |

## Examples

```bash
nb session remove
nb session remove --shell zsh
```

## Related Commands

- [`nb session setup`](./setup.md)
- [`nb session id`](./id.md)
