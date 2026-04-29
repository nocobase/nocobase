---
title: "nb api resource update"
description: "nb api resource update command reference: update records in a selected NocoBase resource."
keywords: "nb api resource update,NocoBase CLI,update record,CRUD"
---

# nb api resource update

Update records in a selected resource. Use `--filter-by-tk` or `--filter` to locate records, and pass update content through `--values`.

## Usage

```bash
nb api resource update --resource <resource> --values <json> [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--resource` | string | Resource name, required |
| `--data-source` | string | Data source key, default `main` |
| `--source-id` | string | Source record ID for association resources |
| `--filter-by-tk` | string | Primary key value; composite or multiple keys can be passed as a JSON array |
| `--filter` | string | Filter conditions as a JSON object |
| `--values` | string | Update data as a JSON object, required |
| `--whitelist` | string[] | Fields allowed to write; repeatable or pass a JSON array |
| `--blacklist` | string[] | Fields forbidden to write; repeatable or pass a JSON array |
| `--update-association-values` | string[] | Association fields to update at the same time; repeatable or pass a JSON array |
| `--force-update` / `--no-force-update` | boolean | Whether to force writing unchanged values |

Also supports common connection parameters from [`nb api resource`](./).

## Examples

```bash
nb api resource update --resource users --filter-by-tk 1 --values '{"nickname":"Grace"}'
nb api resource update --resource posts --filter '{"status":"draft"}' --values '{"status":"published"}'
```

## Related Commands

- [`nb api resource get`](./get.md)
- [`nb api resource destroy`](./destroy.md)
