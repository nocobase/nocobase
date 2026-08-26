---
title: "nb env use"
description: "nb env use command reference: switch the current NocoBase CLI env."
keywords: "nb env use,NocoBase CLI,switch environment,current env"
---

# nb env use

Switch the current CLI env. Commands that omit `--env` will use this env by default afterward.

When session mode is enabled for the current shell or runtime, this change only affects the current session.

When session mode is not enabled, this falls back to updating the global `last env`. In that case, other terminals or agent runtimes without session isolation may also be affected.

## Usage

```bash
nb env use <name>
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `<name>` | string | Configured environment name to switch to |

## Examples

```bash
nb env use local
```

## Recommendation

The default recommendation is to run [`nb session setup`](../session/setup.md) once first. That makes `nb env use` behave more like `use dbname` in a database client: switch the current session context first, then run follow-up commands that depend on that env.

## Related Commands

- [`nb env current`](./current.md)
- [`nb env status`](./status.md)
- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
