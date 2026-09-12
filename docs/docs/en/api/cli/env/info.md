---
title: 'nb env info'
description: 'nb env info command reference: View the app, database, API, and authentication configuration of the specified NocoBase CLI env.'
keywords: 'nb env info,NocoBase CLI,environment details,configuration'
---

# nb env info

View detailed information for a single env, including app, database, API, and authentication configuration.

## Usage

```bash
nb env info [name] [flags]
```

## Parameters

| Parameter        | Type    | Description                                                                                  |
| ---------------- | ------- | -------------------------------------------------------------------------------------------- |
| `[name]`         | string  | Name of the configured environment to view; uses the current env when omitted                |
| `--json`         | boolean | Output JSON                                                                                  |
| `--field`        | string  | Return only one field using a dot path, such as `app.url`, `app.appPath`, or `api.auth.type` |
| `--show-secrets` | boolean | Show tokens, passwords, and other secrets in plain text                                      |

## Examples

```bash
nb env info app1
nb env info app1 --json
nb env info app1 --field app.appPath
nb env info app1 --show-secrets
```

## Related commands

- [`nb env list`](./list.md)
- [`nb app start`](../app/start.md)
- [`nb db ps`](../db/ps.md)
