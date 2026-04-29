---
title: "nb api resource"
description: "nb api resource 命令参考：对任意 NocoBase 资源执行通用 CRUD 和聚合查询。"
keywords: "nb api resource,NocoBase CLI,CRUD,资源,数据表"
---

# nb api resource

对任意 NocoBase 资源执行通用 CRUD 和聚合查询。资源名可以是普通资源，例如 `users`，也可以是关联资源，例如 `posts.comments`。

## 用法

```bash
nb api resource <command>
```

## 子命令

| 命令 | 说明 |
| --- | --- |
| [`nb api resource list`](./list.md) | 列出资源记录 |
| [`nb api resource get`](./get.md) | 获取单条资源记录 |
| [`nb api resource create`](./create.md) | 创建资源记录 |
| [`nb api resource update`](./update.md) | 更新资源记录 |
| [`nb api resource destroy`](./destroy.md) | 删除资源记录 |
| [`nb api resource query`](./query.md) | 执行聚合查询 |

## 通用参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--api-base-url` | string | NocoBase API 地址，例如 `http://localhost:13000/api` |
| `--verbose` | boolean | 显示详细进度 |
| `--env`, `-e` | string | 环境名称 |
| `--role` | string | 角色覆盖，作为 `X-Role` 请求头发送 |
| `--token`, `-t` | string | API key 覆盖 |
| `--json-output`, `-j` / `--no-json-output` | boolean | 是否输出原始 JSON，默认开启 |
| `--resource` | string | 资源名称，必填，例如 `users`、`orders`、`posts.comments` |
| `--data-source` | string | 数据源 key，默认 `main` |

关联资源命令还可以配合 `--source-id` 指定源记录 ID。

## 示例

```bash
nb api resource list --resource users
nb api resource get --resource users --filter-by-tk 1
nb api resource create --resource users --values '{"nickname":"Ada"}'
nb api resource list --resource posts.comments --source-id 1 --fields id --fields content
```

## 相关命令

- [`nb api`](../index.md)
- [`nb env update`](../../env/update.md)
