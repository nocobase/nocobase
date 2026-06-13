---
title: 'nb backup restore'
description: 'Reference for the nb backup restore command: restore a local backup file to the target env.'
keywords: 'nb backup restore,NocoBase CLI,restore backup,restore,nbdata'
---

# nb backup restore

Restore a local backup file to the target env. Typically, a `*.nbdata` file is used here. Restoring will overwrite the target application data, so the CLI asks for confirmation by default.

## Usage

```bash
nb backup restore --file <path> [flags]
```

## Options

| Option         | Type    | Description                                                                                                        |
| -------------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| `--env`, `-e`  | string  | Name of the CLI env to restore to; uses the current env if omitted                                                 |
| `--yes`, `-y`  | boolean | Skip interactive confirmation when the env explicitly specified by `--env` is different from the current env       |
| `--file`, `-f` | string  | Path to the local backup file; required                                                                            |
| `--force`      | boolean | Confirm overwriting application data; must be passed explicitly in non-interactive terminals and AI agent sessions |

## Examples

```bash
nb backup restore --file ./backups/base.nbdata --force
nb backup restore --env e2e --file ./backups/base.nbdata --yes --force
```

## Notes

The CLI checks whether `--env` matches the current env only when you pass `--env` explicitly. If a different env is explicitly specified, an interactive terminal will ask for confirmation first; in non-interactive terminals or AI agent scenarios, you must explicitly add `--yes` yourself, or run `nb env use <name>` first and then try again.

Before execution, the CLI checks whether the path specified by `--file` exists and confirms that it is a regular file. If the path does not exist or points to a directory, the command fails immediately.

If `--force` is not provided, an interactive terminal will prompt for confirmation again, clearly indicating that this restore will overwrite application data. In non-interactive terminals and AI agent sessions, if `--force` is missing, the CLI refuses to execute directly and provides a rerun hint that can be copied directly. If it is also a cross-env operation, you usually need to provide both `--yes` and `--force`.

After the upload succeeds, the CLI continues waiting for the target application to pass `__health_check` again. In other words, when the command returns successfully, the application has usually been restored to an accessible state.

## Related commands

- [`nb backup create`](./create.md)
- [`nb app restart`](../app/restart.md)
