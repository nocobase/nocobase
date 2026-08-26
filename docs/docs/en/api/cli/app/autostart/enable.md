---
title: "nb app autostart enable"
description: "nb app autostart enable command reference: enable application autostart for one local or Docker env."
keywords: "nb app autostart enable,NocoBase CLI,autostart,env"
---

# nb app autostart enable

Enable the application autostart flag for one env.

This flag only applies to `local` or `docker` envs whose runtimes are managed by the CLI on the current machine. It does not start the application immediately. Instead, it adds the env to the set that can later be started by `nb app autostart run`.

## Usage

```bash
nb app autostart enable [flags]
```

## Flags

| Flag | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name to add to app autostart. Uses the current env when omitted |
| `--yes`, `-y` | boolean | Skip the interactive confirmation when explicit `--env` points to a different env than the current env |

## Examples

```bash
nb app autostart enable
nb app autostart enable --env app1
nb app autostart enable --env app1 --yes
```

## Notes

The CLI only checks whether the target env differs from the current env when you explicitly pass `--env`. In interactive terminals it confirms first. In non-interactive terminals or AI agent flows, you need to add `--yes` yourself, or switch the current env with `nb env use <name>` before retrying.

If the target env is not a CLI-managed `local` or `docker` runtime on the current machine, the command fails and does not save the autostart flag.

## Related commands

- [`nb app autostart disable`](./disable.md)
- [`nb app autostart list`](./list.md)
- [`nb app autostart run`](./run.md)
