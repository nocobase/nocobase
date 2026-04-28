---
title: "nb source test"
description: "nb source test 命令参考：在选中应用目录运行测试，并自动准备内置测试数据库。"
keywords: "nb source test,NocoBase CLI,测试,Vitest,数据库"
---

# nb source test

在选中应用目录中运行测试。执行测试前，CLI 会重新创建一个内置 Docker 测试数据库，并注入内部使用的 `DB_*` 环境变量。

## 用法

```bash
nb source test [paths...] [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `[paths...]` | string[] | 透传给测试运行器的测试文件路径或 glob |
| `--cwd`, `-c` | string | 运行测试的应用目录，默认当前目录 |
| `--watch`, `-w` | boolean | 以 watch 模式运行 Vitest |
| `--run` | boolean | 单次运行，不进入 watch 模式 |
| `--allowOnly` | boolean | 允许 `.only` 测试 |
| `--bail` | boolean | 首次失败后停止 |
| `--coverage` | boolean | 启用覆盖率报告 |
| `--single-thread` | string | 透传 single-thread 模式给底层测试运行器 |
| `--server` | boolean | 强制服务端测试模式 |
| `--client` | boolean | 强制客户端测试模式 |
| `--db-clean`, `-d` | boolean | 在底层应用命令支持时清理数据库 |
| `--db-dialect` | string | 内置测试数据库类型：`postgres`、`mysql`、`mariadb`、`kingbase` |
| `--db-image` | string | 内置测试数据库 Docker 镜像 |
| `--db-port` | string | 内置测试数据库发布到宿主机的 TCP 端口 |
| `--db-database` | string | 注入测试使用的数据库名 |
| `--db-user` | string | 注入测试使用的数据库用户 |
| `--db-password` | string | 注入测试使用的数据库密码 |
| `--verbose` | boolean | 显示底层 Docker 和测试运行器输出 |

## 示例

```bash
nb source test
nb source test --cwd /path/to/app
nb source test packages/core/server/src/__tests__/foo.test.ts
nb source test --server --coverage
nb source test --db-port 5433
```

## 相关命令

- [`nb source build`](./build.md)
- [`nb db ps`](../db/ps.md)
