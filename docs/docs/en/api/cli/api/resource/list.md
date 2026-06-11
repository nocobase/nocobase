---
title: "nb api resource list"
description: "nb api resource list command reference: list records for a selected NocoBase resource."
keywords: "nb api resource list,NocoBase CLI,list records,resource"
---

# nb api resource list

List records for a selected resource. Use `--filter`, `--fields`, `--sort`, `--page`, and related parameters to control the query.

## Usage

```bash
nb api resource list --resource <resource> [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--resource` | string | Resource name, required |
| `--data-source` | string | Data source key, default `main` |
| `--source-id` | string | Source record ID for association resources |
| `--filter` | string | Filter conditions as a JSON object |
| `--fields` | string[] | Fields to query; repeatable or pass a JSON array |
| `--appends` | string[] | Association fields to append; repeatable or pass a JSON array |
| `--except` | string[] | Fields to exclude; repeatable or pass a JSON array |
| `--sort` | string[] | Sort fields, for example `-createdAt`; repeatable or pass a JSON array |
| `--page` | integer | Page number |
| `--page-size` | integer | Records per page |
| `--paginate` / `--no-paginate` | boolean | Whether to paginate |

Also supports common connection parameters from [`nb api resource`](./index.md).

## Examples

```bash
nb api resource list --resource users
nb api resource list --resource posts.comments --source-id 1 --fields id --fields content
nb api resource list --resource users --filter '{"status":"active"}' --sort=-createdAt
```

## Related Commands

- [`nb api resource get`](./get.md)
- [`nb api resource query`](./query.md)
