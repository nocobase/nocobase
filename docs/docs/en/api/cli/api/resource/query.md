---
title: "nb api resource query"
description: "nb api resource query command reference: run aggregate queries against a selected NocoBase resource."
keywords: "nb api resource query,NocoBase CLI,aggregate query,statistics"
---

# nb api resource query

Run aggregate queries against a selected resource. `--measures`, `--dimensions`, and `--orders` all use JSON array format.

## Usage

```bash
nb api resource query --resource <resource> [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--resource` | string | Resource name, required |
| `--data-source` | string | Data source key, default `main` |
| `--measures` | string | Measure definitions as a JSON array |
| `--dimensions` | string | Dimension definitions as a JSON array |
| `--orders` | string | Sort definitions as a JSON array |
| `--filter` | string | Filter conditions as a JSON object |
| `--having` | string | Post-aggregation filter conditions as a JSON object |
| `--limit` | integer | Maximum number of rows to return |
| `--offset` | integer | Number of rows to skip |
| `--timezone` | string | Timezone used for query formatting |

Also supports common connection parameters from [`nb api resource`](./index.md).

## Examples

```bash
nb api resource query --resource orders --measures '[{"field":["id"],"aggregation":"count","alias":"count"}]'
nb api resource query --resource orders --dimensions '[{"field":["status"],"alias":"status"}]' --orders '[{"field":["createdAt"],"order":"desc"}]'
```

## Related Commands

- [`nb api resource list`](./list.md)
- [`nb api dynamic commands`](../dynamic.md)
