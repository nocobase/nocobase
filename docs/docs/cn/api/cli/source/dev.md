---
title: "nb source dev"
description: "nb source dev 命令参考：在 npm 或 Git 来源的 env 中启动 NocoBase 开发模式。"
keywords: "nb source dev,NocoBase CLI,开发模式,热更新"
---

# nb source dev

在 npm 或 Git 来源的 env 中启动开发模式。Docker env 请使用 [`nb app logs`](../app/logs.md) 查看运行日志。

## 用法

```bash
nb source dev [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 进入开发模式的 CLI env 名称，省略时使用当前 env |
| `--db-sync` | boolean | 启动开发模式前同步数据库 |
| `--port`, `-p` | string | 开发服务端口 |
| `--client`, `-c` | boolean | 仅启动客户端 |
| `--server`, `-s` | boolean | 仅启动服务端 |
| `--inspect`, `-i` | string | 服务端 Node.js inspect 调试端口 |

## 示例

```bash
nb source dev
nb source dev --env app1
nb source dev --env app1 --db-sync
nb source dev --env app1 --port 12000
nb source dev --env app1 --client
nb source dev --env app1 --server
nb source dev --env app1 --inspect 9229
```

## 相关命令

- [`nb source download`](./download.md)
- [`nb app start`](../app/start.md)
- [`nb app logs`](../app/logs.md)
