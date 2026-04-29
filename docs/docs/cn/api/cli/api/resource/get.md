---
title: "nb api resource get"
description: "nb api resource get 命令参考：获取指定 NocoBase 资源的一条记录。"
keywords: "nb api resource get,NocoBase CLI,获取记录,主键"
---

# nb api resource get

获取指定资源的一条记录。通常使用 `--filter-by-tk` 指定主键。

## 用法

```bash
nb api resource get --resource <resource> [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--resource` | string | 资源名称，必填 |
| `--data-source` | string | 数据源 key，默认 `main` |
| `--source-id` | string | 关联资源的源记录 ID |
| `--filter-by-tk` | string | 主键值，复合或多个 key 可以传 JSON 数组 |
| `--fields` | string[] | 查询字段，可重复传入或传 JSON 数组 |
| `--appends` | string[] | 要追加的关联字段，可重复传入或传 JSON 数组 |
| `--except` | string[] | 要排除的字段，可重复传入或传 JSON 数组 |

同时支持 [`nb api resource`](./) 的通用连接参数。

## 示例

```bash
nb api resource get --resource users --filter-by-tk 1
nb api resource get --resource posts.comments --source-id 1 --filter-by-tk 2
```

## 相关命令

- [`nb api resource list`](./list.md)
- [`nb api resource update`](./update.md)
