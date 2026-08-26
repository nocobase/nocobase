---
title: "nb env current"
description: "nb env current command reference: show the currently effective NocoBase CLI env."
keywords: "nb env current,NocoBase CLI,current env,session env"
---

# nb env current

Show the name of the currently effective env.

By default, this command first reads the session env for the current `NB_SESSION_ID`. If session mode is not enabled for the current shell or runtime, it falls back to the global `last env`.

## Usage

```bash
nb env current
```

## Examples

```bash
nb env current
```

## Related Commands

- [`nb env use`](./use.md)
- [`nb env status`](./status.md)
- [`nb session setup`](../session/setup.md)
