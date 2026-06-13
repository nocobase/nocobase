---
title: "nb app upgrade"
description: "nb app upgrade command reference: stop the app, replace the saved source or image, then upgrade and start the selected NocoBase app."
keywords: "nb app upgrade,NocoBase CLI,upgrade,update,Docker image"
---

# nb app upgrade

Upgrade a selected NocoBase app. The CLI stops the current app, replaces the saved source or image by default, synchronizes commercial plugins, upgrades and starts the app, and refreshes the env runtime at the end. Docker envs recreate the app container from the saved env config during startup.

## Usage

```bash
nb app upgrade [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name to upgrade; uses the current env if omitted |
| `--yes`, `-y` | boolean | When an explicitly passed `--env` targets a different env than the current env, skip the interactive confirmation prompt |
| `--force`, `-f` | boolean | Skip the upgrade confirmation prompt. Required in non-interactive terminals and AI agent sessions |
| `--skip-download`, `-s` | boolean | Skip source or image download and run the upgrade-and-start flow against the currently saved local source or Docker image; also skips `nb license plugins sync` |
| `--version` | string | Override the target version for this upgrade; when the upgrade succeeds, the new version is written back to `downloadVersion` in the env config |
| `--verbose` | boolean | Show underlying update and restart command output |

## Examples

```bash
nb app upgrade
nb app upgrade --force
nb app upgrade --env local
nb app upgrade --env local --force
nb app upgrade --env local --skip-download
nb app upgrade --env local --skip-download --version beta
nb app upgrade --env local --version beta
nb app upgrade --env local --verbose
nb app upgrade --env local-docker --skip-download
```

If you explicitly pass `--env` and it differs from the current env, the CLI asks for confirmation first. In non-interactive terminals or AI agent sessions, add `--yes` yourself or run `nb env use <name>` first and try again.

Before the upgrade starts, interactive terminals also ask for upgrade confirmation unless you pass `--force`. In non-interactive terminals and AI agent sessions, `nb app upgrade` refuses to proceed without `--force` and prints a copyable re-run command. If the command is also cross-env, you need both `--yes` and `--force`.

By default, `nb app upgrade` runs these steps:

1. `nb app stop`
2. `nb source download --replace`
3. `nb license plugins sync --skip-if-no-license`
4. `nb app start`
5. Save the new `downloadVersion` when needed
6. `nb env update`

When `--skip-download` is passed, the CLI skips steps 2 and 3 and runs the upgrade-and-start flow directly against the currently saved source or image. If `--version` is also passed, the CLI does not download that version during this run; instead it only saves it as the new `downloadVersion` after a successful start so later upgrades can use it.

Step 4 automatically completes any required upgrade preparation for the current code state, then waits for the app to pass `__health_check`. During this wait, the CLI prints one waiting line first, then one progress line every 10 seconds until the app is ready or the health check times out.

If the final `nb env update` step fails, the upgrade still counts as successful. The CLI prints a warning and tells you to run `nb env update <envName>` manually afterward.

## Related Commands

- [`nb source download`](../source/download.md)
- [`nb app restart`](./restart.md)
- [`nb self update`](../self/update.md)
