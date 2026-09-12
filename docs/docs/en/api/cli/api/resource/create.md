---
title: "nb api resource create"
description: "nb api resource create command reference: create one or more records in a selected NocoBase resource."
keywords: "nb api resource create,NocoBase CLI,create record,CRUD"
---

# nb api resource create

Create records in a selected resource. Pass record data as a JSON object through `--values`, or as a JSON array of objects to create multiple records in a single request.

## Usage

```bash
nb api resource create --resource <resource> --values <json> [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--resource` | string | Resource name, required |
| `--data-source` | string | Data source key, default `main` |
| `--source-id` | string | Source record ID for association resources |
| `--values` | string | Data for the new records: a JSON object, or a JSON array of objects to create multiple records; required |
| `--whitelist` | string[] | Fields allowed to write; repeatable or pass a JSON array |
| `--blacklist` | string[] | Fields forbidden to write; repeatable or pass a JSON array |

Also supports common connection parameters from [`nb api resource`](./index.md).

## Examples

```bash
nb api resource create --resource users --values '{"nickname":"Ada"}'
nb api resource create --resource users --values '[{"nickname":"Ada"},{"nickname":"Grace"}]'
nb api resource create --resource posts.comments --source-id 1 --values '{"content":"Hello"}'
```

## Related Commands

- [`nb api resource update`](./update.md)
- [`nb api resource destroy`](./destroy.md)
