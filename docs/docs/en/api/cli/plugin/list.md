---
title: "nb plugin list"
description: "nb plugin list command reference: list plugins for the selected NocoBase env."
keywords: "nb plugin list,NocoBase CLI,plugin list"
---

# nb plugin list

List installed plugins for the selected env.

## Usage

```bash
nb plugin list [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name; uses the current env if omitted |
| `--yes`, `-y` | boolean | When an explicitly passed `--env` targets a different env than the current env, skip the interactive confirmation prompt |

## Examples

```bash
nb plugin list
nb plugin list -e local
nb plugin list -e local --yes
nb plugin list -e local-docker
```

If you explicitly pass `--env` and it differs from the current env, the CLI asks for confirmation first. In non-interactive terminals or AI agent sessions, add `--yes` yourself or run `nb env use <name>` first and try again.

## Related Commands

- [`nb plugin enable`](./enable.md)
- [`nb plugin disable`](./disable.md)
