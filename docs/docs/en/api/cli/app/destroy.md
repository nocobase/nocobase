---
title: 'nb app destroy'
description: 'nb app destroy command reference: remove managed runtime resources, storage data, and saved env config for a selected env.'
keywords: 'nb app destroy,NocoBase CLI,destroy env,cleanup,remove storage'
---

# nb app destroy

Destroy a selected env by removing managed runtime resources, storage data, and the saved CLI env config.

For local and Docker envs, the command removes managed app runtime resources on this machine first, removes the built-in database runtime when present, deletes storage data, and then removes the saved CLI env config. For HTTP and SSH envs, it only removes the saved CLI env config and does not touch external services.

For downloaded local npm/Git envs, the command also removes CLI-managed local app files. For custom local app paths, it keeps the local source files and only removes managed runtime resources, storage data, and the saved env config.

By default, the command asks for confirmation. In non-interactive mode, pass an explicit `--env` together with `--force`.

## Usage

```bash
nb app destroy [flags]
```

## Parameters

| Parameter       | Type    | Description                                                                                  |
| --------------- | ------- | -------------------------------------------------------------------------------------------- |
| `--env`, `-e`   | string  | CLI env name to destroy; in interactive mode it defaults to the current env when omitted     |
| `--force`, `-f` | boolean | Skip confirmation and destroy the selected env immediately; required in non-interactive mode |
| `--verbose`     | boolean | Show raw output from destruction commands                                                    |

## Examples

```bash
nb app destroy --env app1
nb app destroy --env app1 --force
```

## Related Commands

- [`nb app stop`](./stop.md)
- [`nb app down`](./down.md)
- [`nb env remove`](../env/remove.md)
