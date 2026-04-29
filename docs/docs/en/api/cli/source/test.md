---
title: "nb source test"
description: "nb source test command reference: run tests in the selected app directory and prepare the built-in test database automatically."
keywords: "nb source test,NocoBase CLI,test,Vitest,database"
---

# nb source test

Run tests in the selected app directory. Before running tests, the CLI recreates a built-in Docker test database and injects internal `DB_*` environment variables.

## Usage

```bash
nb source test [paths...] [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `[paths...]` | string[] | Test file paths or globs passed through to the test runner |
| `--cwd`, `-c` | string | App directory where tests run; defaults to the current directory |
| `--watch`, `-w` | boolean | Run Vitest in watch mode |
| `--run` | boolean | Run once without entering watch mode |
| `--allowOnly` | boolean | Allow `.only` tests |
| `--bail` | boolean | Stop after the first failure |
| `--coverage` | boolean | Enable coverage report |
| `--single-thread` | string | Pass single-thread mode through to the underlying test runner |
| `--server` | boolean | Force server test mode |
| `--client` | boolean | Force client test mode |
| `--db-clean`, `-d` | boolean | Clean the database when supported by the underlying app command |
| `--db-dialect` | string | Built-in test database dialect: `postgres`, `mysql`, `mariadb`, or `kingbase` |
| `--db-image` | string | Built-in test database Docker image |
| `--db-port` | string | TCP port where the built-in test database is published on the host |
| `--db-database` | string | Database name injected for tests |
| `--db-user` | string | Database user injected for tests |
| `--db-password` | string | Database password injected for tests |
| `--verbose` | boolean | Show underlying Docker and test runner output |

## Examples

```bash
nb source test
nb source test --cwd /path/to/app
nb source test packages/core/server/src/__tests__/foo.test.ts
nb source test --server --coverage
nb source test --db-port 5433
```

## Related Commands

- [`nb source build`](./build.md)
- [`nb db ps`](../db/ps.md)
