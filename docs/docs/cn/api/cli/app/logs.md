---
title: "nb app logs"
description: "nb app logs 命令参考：查看指定 env 的 NocoBase 应用日志。"
keywords: "nb app logs,NocoBase CLI,应用日志,Docker logs,pm2 logs"
---

# nb app logs

查看应用日志。npm/Git 安装会读取 pm2 日志，Docker 安装会读取 Docker 容器日志。

## 用法

```bash
nb app logs [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 要查看日志的 CLI env 名称，省略时使用当前 env |
| `--tail` | integer | 跟随日志前显示的最近日志行数，默认 `100` |
| `--follow`, `-f` / `--no-follow` | boolean | 是否持续跟随新日志 |

## 示例

```bash
nb app logs
nb app logs --env app1
nb app logs --env app1 --tail 200
nb app logs --env app1 --no-follow
```

## 相关命令

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb db logs`](../db/logs.md)
