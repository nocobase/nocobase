---
title: "nb api resource destroy"
description: "nb api resource destroy command reference: delete records from a selected NocoBase resource."
keywords: "nb api resource destroy,NocoBase CLI,delete record,CRUD"
---

# nb api resource destroy

Delete records from a selected resource. Use `--filter-by-tk` or `--filter` to locate records.

## Usage

```bash
nb api resource destroy --resource <resource> [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--resource` | string | Resource name, required |
| `--data-source` | string | Data source key, default `main` |
| `--source-id` | string | Source record ID for association resources |
| `--filter-by-tk` | string | Primary key value; composite or multiple keys can be passed as a JSON array |
| `--filter` | string | Filter conditions as a JSON object |

Also supports common connection parameters from [`nb api resource`](./index.md).

## Examples

```bash
nb api resource destroy --resource users --filter-by-tk 1
nb api resource destroy --resource posts --filter '{"status":"archived"}'
```

## Related Commands

- [`nb api resource list`](./list.md)
- [`nb api resource update`](./update.md)
