---
title: "nb app upgrade"
description: "nb app upgrade command reference: update source or image and restart a selected NocoBase app."
keywords: "nb app upgrade,NocoBase CLI,upgrade,update,Docker image"
---

# nb app upgrade

Upgrade a selected NocoBase app. npm/Git installations refresh the saved source and restart with quickstart; Docker installations refresh the saved image and recreate the app container.

## Usage

```bash
nb app upgrade [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name to upgrade; uses the current env if omitted |
| `--yes`, `-y` | boolean | When an explicitly passed `--env` targets a different env than the current env, skip the interactive confirmation prompt |
| `--skip-code-update`, `-s` | boolean | Restart from the saved local source or Docker image without downloading updates |
| `--version` | string | Override the saved `downloadVersion`; when the upgrade succeeds, the new version is written back to the env config |
| `--verbose` | boolean | Show underlying update and restart command output |

## Examples

```bash
nb app upgrade
nb app upgrade --env local
nb app upgrade --env local -s
nb app upgrade --env local --version beta
nb app upgrade --env local --verbose
nb app upgrade --env local-docker -s
```

If you explicitly pass `--env` and it differs from the current env, the CLI asks for confirmation first. In non-interactive terminals or AI agent sessions, add `--yes` yourself or run `nb env use <name>` first and try again.

## Related Commands

- [`nb source download`](../source/download.md)
- [`nb app restart`](./restart.md)
- [`nb self update`](../self/update.md)
