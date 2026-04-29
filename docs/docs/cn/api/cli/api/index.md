---
title: "nb api"
description: "nb api 命令参考：通过 CLI 调用 NocoBase API，包括通用 resource 命令和动态命令。"
keywords: "nb api,NocoBase CLI,API,resource,OpenAPI"
---

# nb api

通过 CLI 调用 NocoBase API。`nb api` 包含通用的 [`nb api resource`](./resource/) CRUD 命令，也包含根据当前应用 OpenAPI Schema 动态生成的命令。

## 用法

```bash
nb api <command>
```

## 子命令

| 命令 | 说明 |
| --- | --- |
| [`nb api resource`](./resource/) | 对任意 NocoBase 资源执行通用 CRUD 和聚合查询 |
| [`nb api 动态命令`](./dynamic.md) | 根据应用 OpenAPI Schema 生成的 topic 和 operation 命令 |

## 通用参数

大多数 `nb api` 命令都支持以下连接参数：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--api-base-url` | string | NocoBase API 地址，例如 `http://localhost:13000/api` |
| `--env`, `-e` | string | 环境名称 |
| `--token`, `-t` | string | API key 覆盖 |
| `--role` | string | 角色覆盖，作为 `X-Role` 请求头发送 |
| `--verbose` | boolean | 显示详细进度 |
| `--json-output`, `-j` / `--no-json-output` | boolean | 是否输出原始 JSON，默认开启 |

## 示例

```bash
nb api resource list --resource users -e app1
nb api resource get --resource users --filter-by-tk 1 -e app1
nb api resource create --resource users --values '{"nickname":"Ada"}' -e app1
nb api resource list --resource users -e app1 --no-json-output
```

## 相关命令

- [`nb env update`](../env/update.md)
- [`nb env add`](../env/add.md)
