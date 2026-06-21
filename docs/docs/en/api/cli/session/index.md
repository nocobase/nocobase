---
title: "nb session"
description: "nb session command reference: configure and inspect NB_SESSION_ID so current env is isolated per shell or agent runtime."
keywords: "nb session,NocoBase CLI,NB_SESSION_ID,session mode"
---

# nb session

Manage session mode for `NB_SESSION_ID`.

After session mode is enabled, `nb env use` and `nb env current` use the current shell or agent runtime context first, instead of directly sharing a single global current env.

## Usage

```bash
nb session <command>
```

## Subcommands

| Command | Description |
| --- | --- |
| [`nb session setup`](./setup.md) | Install shell or runtime integration for `NB_SESSION_ID` |
| [`nb session id`](./id.md) | Show the current effective session id |
| [`nb session remove`](./remove.md) | Remove shell or runtime integration for `NB_SESSION_ID` |

## When you need it

The default recommendation is to run `nb session setup` once when you first start using the CLI. With it enabled:

- terminal 1 can use `env1`
- terminal 2 can use `env2` at the same time
- an agent runtime can keep its own current env too

Without session mode, different sessions fall back to sharing the global `last env`, which makes parallel work more likely to affect each other.

## Related Commands

- [`nb env current`](../env/current.md)
- [`nb env use`](../env/use.md)
- [`nb env status`](../env/status.md)
