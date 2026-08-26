---
title: "nb db check"
description: "nb db check command reference: check whether a database is reachable with the current env or explicit database flags."
keywords: "nb db check,NocoBase CLI,database connection,connectivity"
---

# nb db check

Check whether a database is reachable. You can reuse the saved database settings from an env or pass explicit `--db-*` flags.

## Usage

```bash
nb db check [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Read database settings from a CLI env; when omitted, all required `--db-*` flags must be provided |
| `--db-dialect` | string | Database dialect: `postgres`, `kingbase`, `mysql`, or `mariadb` |
| `--db-host` | string | Database host name or IP address |
| `--db-port` | string | Database TCP port |
| `--db-database` | string | Database name |
| `--db-user` | string | Database username |
| `--db-password` | string | Database password |
| `--json` | boolean | Output JSON |

## Examples

```bash
nb db check --env app1
nb db check --env app1 --db-password new-secret --json
nb db check --db-dialect postgres --db-host 127.0.0.1 --db-port 5432 --db-database nocobase --db-user nocobase --db-password secret
```

## Notes

If the selected env uses a CLI-managed built-in database, the CLI resolves the actual connection address before running the check.

## Related Commands

- [`nb db ps`](./ps.md)
- [`nb env info`](../env/info.md)
