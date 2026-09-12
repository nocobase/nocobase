---
title: 'nb db stop'
description: 'nb db stop command reference: Stop the built-in database container for the specified env.'
keywords: 'nb db stop,NocoBase CLI,stop database,Docker'
---

# nb db stop

Stop the built-in database container for the specified env. This command only applies to envs with CLI-managed built-in databases enabled.

## Usage

```bash
nb db stop [flags]
```

## Options

| Option        | Type    | Description                                                                                    |
| ------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `--env`, `-e` | string  | Name of the CLI env whose built-in database should be stopped; uses the current env if omitted |
| `--verbose`   | boolean | Show the underlying Docker command output                                                      |

## Examples

```bash
nb db stop
nb db stop --env app1
nb db stop --env app1 --verbose
```

## Related commands

- [`nb db start`](./start.md)
- [`nb app stop`](../app/stop.md)
