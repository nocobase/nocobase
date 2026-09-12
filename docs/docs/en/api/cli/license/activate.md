---
title: "nb license activate"
description: "nb license activate command reference: activate an existing NocoBase commercial license key for a selected env."
keywords: "nb license activate,NocoBase CLI,commercial licensing"
---

# nb license activate

Activate an existing commercial license key for a selected env. You can pass it directly, read it from a file, or paste it in an interactive terminal.

## Usage

```bash
nb license activate [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name; when omitted, the current env is used |
| `--key` | string | Pass an existing commercial license key directly |
| `--key-file` | string | Read an existing commercial license key from a file |
| `--yes`, `-y` | boolean | When an explicitly passed `--env` targets a different env than the current env, skip the interactive confirmation prompt |
| `--json` | boolean | Output JSON |

## Examples

```bash
nb license activate
nb license activate --env app1 --key <licenseKey>
nb license activate --env app1 --key-file ./license.txt
nb license activate --env app1 --json --key-file ./license.txt
```

## Notes

When run interactively, the CLI first shows the current instance Hostname and Instance ID, then prompts you to paste the license key directly or enter a key file path. Use that information to confirm the license is being bound to the correct instance.

After activation succeeds, restart the app so the license and commercial plugin state actually takes effect. The CLI automatically synchronizes the commercial plugins allowed by the current license before restarting:

```bash
nb app restart
```

If you explicitly pass `--env` and it differs from the current env, the CLI asks for confirmation first. In non-interactive terminals or AI agent sessions, add `--yes` yourself or run `nb env use <name>` first and try again.

## Related Commands

- [`nb app restart`](../app/restart.md)
- [`nb license id`](./id.md)
- [`nb license status`](./status.md)
