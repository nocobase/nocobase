---
title: "nb env info"
description: "nb env info 命令参考：查看指定 NocoBase CLI env 的应用、数据库、API 和认证配置。"
keywords: "nb env info,NocoBase CLI,环境详情,配置"
---

# nb env info

查看单个 env 的详细信息，包括应用、数据库、API 和认证配置。

## 用法

```bash
nb env info [name] [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `[name]` | string | 要查看的 CLI env 名称，省略时使用当前 env |
| `--env`, `-e` | string | 要查看的 CLI env 名称，和位置参数二选一 |
| `--json` | boolean | 输出 JSON |
| `--show-secrets` | boolean | 明文显示 token、密码等密钥 |

如果同时传入 `[name]` 和 `--env`，两者必须一致。

## 示例

```bash
nb env info app1
nb env info app1 --json
nb env info app1 --show-secrets
nb env info --env app1
```

## 相关命令

- [`nb env list`](./list.md)
- [`nb app start`](../app/start.md)
- [`nb db ps`](../db/ps.md)
