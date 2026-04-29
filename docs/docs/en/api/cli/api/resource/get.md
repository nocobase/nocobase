---
title: "nb api resource get"
description: "nb api resource get command reference: get one record from a selected NocoBase resource."
keywords: "nb api resource get,NocoBase CLI,get record,primary key"
---

# nb api resource get

Get one record from a selected resource. Usually, `--filter-by-tk` is used to specify the primary key.

## Usage

```bash
nb api resource get --resource <resource> [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--resource` | string | Resource name, required |
| `--data-source` | string | Data source key, default `main` |
| `--source-id` | string | Source record ID for association resources |
| `--filter-by-tk` | string | Primary key value; composite or multiple keys can be passed as a JSON array |
| `--fields` | string[] | Fields to query; repeatable or pass a JSON array |
| `--appends` | string[] | Association fields to append; repeatable or pass a JSON array |
| `--except` | string[] | Fields to exclude; repeatable or pass a JSON array |

Also supports common connection parameters from [`nb api resource`](./).

## Examples

```bash
nb api resource get --resource users --filter-by-tk 1
nb api resource get --resource posts.comments --source-id 1 --filter-by-tk 2
```

## Related Commands

- [`nb api resource list`](./list.md)
- [`nb api resource update`](./update.md)
