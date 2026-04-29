---
title: "nb env add"
description: "nb env add 命令参考：保存 NocoBase API 地址和认证方式，并切换为当前 env。"
keywords: "nb env add,NocoBase CLI,添加环境,API 地址,认证"
---

# nb env add

保存一个命名的 NocoBase API endpoint，并切换 CLI 使用该 env。选择 `oauth` 认证方式时，会自动进入 [`nb env auth`](./auth.md) 登录流程。

## 用法

```bash
nb env add [name] [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `[name]` | string | 环境名称；TTY 中省略会提示填写，非 TTY 中必填 |
| `--verbose` | boolean | 写入配置时显示详细进度 |
| `--locale` | string | CLI 提示语言：`en-US` 或 `zh-CN` |
| `--api-base-url`, `-u` | string | NocoBase API 地址，包含 `/api` 前缀 |
| `--auth-type`, `-a` | string | 认证方式：`token` 或 `oauth` |
| `--access-token`, `-t` | string | `token` 认证方式使用的 API key 或 access token |

## 示例

```bash
nb env add
nb env add local
nb env add local --api-base-url http://localhost:13000/api --auth-type oauth
nb env add local --api-base-url http://localhost:13000/api --auth-type token --access-token <token>
```

## 相关命令

- [`nb env auth`](./auth.md)
- [`nb env update`](./update.md)
- [`nb env list`](./list.md)
