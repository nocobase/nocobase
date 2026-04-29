---
title: "nb api resource destroy"
description: "nb api resource destroy 命令参考：删除指定 NocoBase 资源记录。"
keywords: "nb api resource destroy,NocoBase CLI,删除记录,CRUD"
---

# nb api resource destroy

删除指定资源记录。可以使用 `--filter-by-tk` 或 `--filter` 定位记录。

## 用法

```bash
nb api resource destroy --resource <resource> [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--resource` | string | 资源名称，必填 |
| `--data-source` | string | 数据源 key，默认 `main` |
| `--source-id` | string | 关联资源的源记录 ID |
| `--filter-by-tk` | string | 主键值，复合或多个 key 可以传 JSON 数组 |
| `--filter` | string | JSON 对象形式的过滤条件 |

同时支持 [`nb api resource`](./index.md) 的通用连接参数。

## 示例

```bash
nb api resource destroy --resource users --filter-by-tk 1
nb api resource destroy --resource posts --filter '{"status":"archived"}'
```

## 相关命令

- [`nb api resource list`](./list.md)
- [`nb api resource update`](./update.md)
