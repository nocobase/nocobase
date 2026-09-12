---
title: "nb license plugins sync"
description: "nb license plugins sync command reference: synchronize commercial plugins allowed by the current license for a selected env."
keywords: "nb license plugins sync,NocoBase CLI,commercial plugins"
---

# nb license plugins sync

Synchronize commercial plugins allowed by the current license.

## Usage

```bash
nb license plugins sync [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name; when omitted, the current env is used |
| `--yes`, `-y` | boolean | When an explicitly passed `--env` targets a different env than the current env, skip the interactive confirmation prompt |
| `--dry-run` | boolean | Preview changes without installing, upgrading, or removing plugins |
| `--version` | string | Registry version or dist-tag to synchronize; defaults to the current workspace version |
| `--skip-if-no-license` | boolean | Skip without error when the current env does not have a saved license key |
| `--verbose` | boolean | Show detailed per-plugin sync logs |
| `--json` | boolean | Output JSON |

## Examples

```bash
nb license plugins sync
nb license plugins sync --env app1
nb license plugins sync --env app1 --yes
nb license plugins sync --env app1 --dry-run
nb license plugins sync --env app1 --skip-if-no-license
nb license plugins sync --env app1 --json
```

## Notes

When `--version` is omitted, the CLI detects the current app version automatically and uses that to decide which registry version of commercial plugins should be downloaded.

`--skip-if-no-license` only ignores one case: the current env does not have a saved license key yet. Other errors, such as missing registry credentials in the key, registry login failures, or plugin download failures, still surface normally.

If you explicitly pass `--env` and it differs from the current env, the CLI asks for confirmation first. In non-interactive terminals or AI agent sessions, add `--yes` yourself or run `nb env use <name>` first and try again.

## Related Commands

- [`nb license plugins list`](./list.md)
- [`nb license plugins clean`](./clean.md)
