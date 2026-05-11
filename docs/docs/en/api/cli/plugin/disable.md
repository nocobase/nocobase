---
title: "nb plugin disable"
description: "nb plugin disable command reference: disable one or more plugins in the selected NocoBase env."
keywords: "nb plugin disable,NocoBase CLI,disable plugin"
---

# nb plugin disable

Disable one or more plugins in the selected env.

## Usage

```bash
nb plugin disable <packages...> [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `<packages...>` | string[] | Plugin package names, required; supports multiple values |
| `--env`, `-e` | string | CLI env name; uses the current env if omitted |
| `--yes`, `-y` | boolean | When an explicitly passed `--env` targets a different env than the current env, skip the interactive confirmation prompt |

## Examples

```bash
nb plugin disable @nocobase/plugin-sample
nb plugin disable @nocobase/plugin-a @nocobase/plugin-b
nb plugin disable -e local @nocobase/plugin-sample
nb plugin disable -e local --yes @nocobase/plugin-sample
```

If you explicitly pass `--env` and it differs from the current env, the CLI asks for confirmation first. In non-interactive terminals or AI agent sessions, add `--yes` yourself or run `nb env use <name>` first and try again.

## Related Commands

- [`nb plugin list`](./list.md)
- [`nb plugin enable`](./enable.md)
