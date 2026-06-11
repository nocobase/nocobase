---
title: "nb api resource list"
description: "nb api resource list 命令参考：列出指定 NocoBase 资源记录。"
keywords: "nb api resource list,NocoBase CLI,查询列表,资源"
---

# nb api resource list

列出指定资源记录。可使用 `--filter`、`--fields`、`--sort`、`--page` 等参数控制查询。

## 用法

```bash
nb api resource list --resource <resource> [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--resource` | string | 资源名称，必填 |
| `--data-source` | string | 数据源 key，默认 `main` |
| `--source-id` | string | 关联资源的源记录 ID |
| `--filter` | string | JSON 对象形式的过滤条件 |
| `--fields` | string[] | 查询字段，可重复传入或传 JSON 数组 |
| `--appends` | string[] | 要追加的关联字段，可重复传入或传 JSON 数组 |
| `--except` | string[] | 要排除的字段，可重复传入或传 JSON 数组 |
| `--sort` | string[] | 排序字段，例如 `-createdAt`，可重复传入或传 JSON 数组 |
| `--page` | integer | 页码 |
| `--page-size` | integer | 每页条数 |
| `--paginate` / `--no-paginate` | boolean | 是否分页 |

同时支持 [`nb api resource`](./index.md) 的通用连接参数。

## 示例

```bash
nb api resource list --resource users
nb api resource list --resource posts.comments --source-id 1 --fields id --fields content
nb api resource list --resource users --filter '{"status":"active"}' --sort=-createdAt
```

## 相关命令

- [`nb api resource get`](./get.md)
- [`nb api resource query`](./query.md)
