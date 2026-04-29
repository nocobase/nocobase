---
title: "nb api resource create"
description: "nb api resource create 命令参考：创建指定 NocoBase 资源记录。"
keywords: "nb api resource create,NocoBase CLI,创建记录,CRUD"
---

# nb api resource create

创建指定资源记录。记录内容通过 `--values` 以 JSON 对象传入。

## 用法

```bash
nb api resource create --resource <resource> --values <json> [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--resource` | string | 资源名称，必填 |
| `--data-source` | string | 数据源 key，默认 `main` |
| `--source-id` | string | 关联资源的源记录 ID |
| `--values` | string | 创建记录的数据，JSON 对象，必填 |
| `--whitelist` | string[] | 允许写入的字段，可重复传入或传 JSON 数组 |
| `--blacklist` | string[] | 禁止写入的字段，可重复传入或传 JSON 数组 |

同时支持 [`nb api resource`](./) 的通用连接参数。

## 示例

```bash
nb api resource create --resource users --values '{"nickname":"Ada"}'
nb api resource create --resource posts.comments --source-id 1 --values '{"content":"Hello"}'
```

## 相关命令

- [`nb api resource update`](./update.md)
- [`nb api resource destroy`](./destroy.md)
