---
title: 'nb app stop'
description: 'nb app stop command reference: stop the NocoBase application for the specified env, and optionally clean up the CLI-managed built-in database container as well.'
keywords: 'nb app stop,NocoBase CLI,stop application,Docker,with-db,built-in database'
---

# nb app stop

Stop the NocoBase application for the specified env. For npm/Git installations, this stops the local application process. For Docker installations, it removes the saved application container.

If you pass `--with-db` and this env uses a CLI-managed built-in database, the command will also clean up the database container. If this env uses an external database, the database resources will not be touched.

## Usage

```bash
nb app stop [flags]
```

## Parameters

| Parameter     | Type    | Description                                                                                                  |
| ------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| `--env`, `-e` | string  | Name of the CLI env to stop; uses the current env if omitted                                                 |
| `--yes`, `-y` | boolean | Skip the interactive confirmation when the env explicitly pointed to by `--env` differs from the current env |
| `--with-db`   | boolean | Also clean up the database container when a CLI-managed built-in database exists                             |
| `--verbose`   | boolean | Show underlying local or Docker command output                                                               |

## Examples

```bash
nb app stop
nb app stop --env local
nb app stop --env local --with-db
nb app stop --env local --verbose
nb app stop --env local-docker
```

## Notes

The CLI checks whether the specified env matches the current env only when you explicitly pass `--env`. If you explicitly specify a different env, an interactive terminal will ask for confirmation first; in a non-interactive terminal or AI agent scenario, you need to explicitly add `--yes` yourself, or run `nb env use <name>` first and then try again.

`--with-db` affects only CLI-managed built-in database containers. In general, if you only want to stop the application itself, you do not need this flag; add it only when you also want to stop the built-in database runtime on the current machine.

This command can operate only on local or Docker runtimes on the current machine. If an env is only an HTTP API connection, or is a reserved SSH env, `nb app stop` cannot stop it remotely for you.

## Related commands

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb env remove`](../env/remove.md)
