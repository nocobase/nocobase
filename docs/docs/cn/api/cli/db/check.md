---
title: "nb db check"
description: "nb db check 命令参考：检查当前 env 或显式数据库参数对应的数据库连接是否可达。"
keywords: "nb db check,NocoBase CLI,数据库连接,连通性检查"
---

# nb db check

检查数据库是否可达。可以复用已保存 env 的数据库配置，也可以显式传入 `--db-*` 参数。

## 用法

```bash
nb db check [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 从指定 CLI env 读取数据库配置；省略时需要显式提供全部 `--db-*` 参数 |
| `--db-dialect` | string | 数据库方言：`postgres`、`kingbase`、`mysql`、`mariadb` |
| `--db-host` | string | 数据库主机名或 IP |
| `--db-port` | string | 数据库端口 |
| `--db-database` | string | 数据库名 |
| `--db-user` | string | 数据库用户名 |
| `--db-password` | string | 数据库密码 |
| `--json` | boolean | 输出 JSON |

## 示例

```bash
nb db check --env app1
nb db check --env app1 --db-password new-secret --json
nb db check --db-dialect postgres --db-host 127.0.0.1 --db-port 5432 --db-database nocobase --db-user nocobase --db-password secret
```

## 说明

如果指定的 env 使用 CLI 托管的内置数据库，CLI 会自动解析实际连接地址后再进行检测。

## 相关命令

- [`nb db ps`](./ps.md)
- [`nb env info`](../env/info.md)
