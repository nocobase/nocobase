---
title: "nb api resource update"
description: "nb api resource update 命令参考：更新指定 NocoBase 资源记录。"
keywords: "nb api resource update,NocoBase CLI,更新记录,CRUD"
---

# nb api resource update

更新指定资源记录。可以使用 `--filter-by-tk` 或 `--filter` 定位记录，并通过 `--values` 传入更新内容。

## 用法

```bash
nb api resource update --resource <resource> --values <json> [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--resource` | string | 资源名称，必填 |
| `--data-source` | string | 数据源 key，默认 `main` |
| `--source-id` | string | 关联资源的源记录 ID |
| `--filter-by-tk` | string | 主键值，复合或多个 key 可以传 JSON 数组 |
| `--filter` | string | JSON 对象形式的过滤条件 |
| `--values` | string | 更新记录的数据，JSON 对象，必填 |
| `--whitelist` | string[] | 允许写入的字段，可重复传入或传 JSON 数组 |
| `--blacklist` | string[] | 禁止写入的字段，可重复传入或传 JSON 数组 |
| `--update-association-values` | string[] | 需要同时更新的关联字段，可重复传入或传 JSON 数组 |
| `--force-update` / `--no-force-update` | boolean | 是否强制写入未变化的值 |

同时支持 [`nb api resource`](./) 的通用连接参数。

## 示例

```bash
nb api resource update --resource users --filter-by-tk 1 --values '{"nickname":"Grace"}'
nb api resource update --resource posts --filter '{"status":"draft"}' --values '{"status":"published"}'
```

## 相关命令

- [`nb api resource get`](./get.md)
- [`nb api resource destroy`](./destroy.md)
