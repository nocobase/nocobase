---
title: "nb api resource create"
description: "nb api resource create command reference: create a record in a selected NocoBase resource."
keywords: "nb api resource create,NocoBase CLI,create record,CRUD"
---

# nb api resource create

Create a record in a selected resource. Pass record data as a JSON object through `--values`.

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
| `--values` | string | Data for the new record as a JSON object, required |
| `--whitelist` | string[] | Fields allowed to write; repeatable or pass a JSON array |
| `--blacklist` | string[] | Fields forbidden to write; repeatable or pass a JSON array |

Also supports common connection parameters from [`nb api resource`](./index.md).

## Examples

```bash
nb api resource create --resource users --values '{"nickname":"Ada"}'
nb api resource create --resource posts.comments --source-id 1 --values '{"content":"Hello"}'
```

## Related Commands

- [`nb api resource update`](./update.md)
- [`nb api resource destroy`](./destroy.md)
