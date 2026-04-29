---
title: "nb api"
description: "nb api command reference: call NocoBase APIs from the CLI, including generic resource commands and dynamic commands."
keywords: "nb api,NocoBase CLI,API,resource,OpenAPI"
---

# nb api

Call NocoBase APIs from the CLI. `nb api` includes generic [`nb api resource`](./resource/) CRUD commands and dynamic commands generated from the current app's OpenAPI Schema.

## Usage

```bash
nb api <command>
```

## Subcommands

| Command | Description |
| --- | --- |
| [`nb api resource`](./resource/) | Run generic CRUD and aggregate queries against any NocoBase resource |
| [`nb api dynamic commands`](./dynamic.md) | Topic and operation commands generated from OpenAPI Schema |

## Common Parameters

Most `nb api` commands support the following connection parameters:

| Parameter | Type | Description |
| --- | --- | --- |
| `--api-base-url` | string | NocoBase API URL, for example `http://localhost:13000/api` |
| `--env`, `-e` | string | Env name |
| `--token`, `-t` | string | API key override |
| `--role` | string | Role override sent as the `X-Role` request header |
| `--verbose` | boolean | Show detailed progress |
| `--json-output`, `-j` / `--no-json-output` | boolean | Whether to output raw JSON; enabled by default |

## Examples

```bash
nb api resource list --resource users -e app1
nb api resource get --resource users --filter-by-tk 1 -e app1
nb api resource create --resource users --values '{"nickname":"Ada"}' -e app1
nb api resource list --resource users -e app1 --no-json-output
```

## Related Commands

- [`nb env update`](../env/update.md)
- [`nb env add`](../env/add.md)
