---
title: "nb env update"
description: "nb env update 命令参考：刷新指定 env 的 OpenAPI Schema 和运行时命令缓存。"
keywords: "nb env update,NocoBase CLI,OpenAPI,运行时命令,swagger"
---

# nb env update

从 NocoBase 应用刷新 OpenAPI Schema，并更新本地运行时命令缓存。缓存会存储到 `.nocobase/versions/<hash>/commands.json`。

## 用法

```bash
nb env update [name] [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `[name]` | string | 环境名称，省略时使用当前 env |
| `--verbose` | boolean | 显示详细进度 |
| `--api-base-url` | string | 覆盖 NocoBase API 地址，并持久化到目标 env |
| `--role` | string | 角色覆盖，作为 `X-Role` 请求头发送 |
| `--token`, `-t` | string | API key 覆盖，并持久化到目标 env |

## 示例

```bash
nb env update
nb env update prod
nb env update prod --api-base-url http://localhost:13000/api
nb env update prod --token <token>
```

## 相关命令

- [`nb api`](../api/)
- [`nb env info`](./info.md)
- [`nb env add`](./add.md)
