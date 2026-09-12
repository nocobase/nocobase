---
title: "nb env list"
description: "nb env list command reference: list configured NocoBase CLI envs."
keywords: "nb env list,NocoBase CLI,environment list,API Base URL"
---

# nb env list

List all configured envs.

This command only shows saved configuration. Use [`nb env status`](./status.md) when you want to check current runtime or API status.

## Usage

```bash
nb env list
```

## Output

The output table includes the current env marker, name, type, `API Base URL`, authentication type, and runtime version.

- `Current` marks the currently effective env with `*`
- `API Base URL` shows the saved raw API address
- `Runtime` shows cached runtime version information

## Examples

```bash
nb env list
```

## Related Commands

- [`nb env current`](./current.md)
- [`nb env status`](./status.md)
- [`nb env info`](./info.md)
- [`nb env use`](./use.md)
