---
title: "nb api resource query"
description: "nb api resource query 命令参考：对指定 NocoBase 资源执行聚合查询。"
keywords: "nb api resource query,NocoBase CLI,聚合查询,统计"
---

# nb api resource query

对指定资源执行聚合查询。`--measures`、`--dimensions` 和 `--orders` 都使用 JSON 数组格式。

## 用法

```bash
nb api resource query --resource <resource> [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--resource` | string | 资源名称，必填 |
| `--data-source` | string | 数据源 key，默认 `main` |
| `--measures` | string | JSON 数组形式的度量定义 |
| `--dimensions` | string | JSON 数组形式的维度定义 |
| `--orders` | string | JSON 数组形式的排序定义 |
| `--filter` | string | JSON 对象形式的过滤条件 |
| `--having` | string | JSON 对象形式的分组后过滤条件 |
| `--limit` | integer | 返回行数上限 |
| `--offset` | integer | 跳过行数 |
| `--timezone` | string | 查询格式化使用的时区 |

同时支持 [`nb api resource`](./index.md) 的通用连接参数。

## 示例

```bash
nb api resource query --resource orders --measures '[{"field":["id"],"aggregation":"count","alias":"count"}]'
nb api resource query --resource orders --dimensions '[{"field":["status"],"alias":"status"}]' --orders '[{"field":["createdAt"],"order":"desc"}]'
```

## 相关命令

- [`nb api resource list`](./list.md)
- [`nb api 动态命令`](../dynamic.md)
