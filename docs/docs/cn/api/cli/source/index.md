---
title: "nb source"
description: "nb source 命令参考：管理本地 NocoBase 源码工程，包括下载、开发、构建和测试。"
keywords: "nb source,NocoBase CLI,源码,download,dev,build,test"
---

# nb source

管理本地 NocoBase 源码工程。npm/Git env 使用本地源码目录；Docker env 通常只需要使用 [`nb app`](../app/index.md) 管理运行态。

## 用法

```bash
nb source <command>
```

## 子命令

| 命令 | 说明 |
| --- | --- |
| [`nb source download`](./download.md) | 从 npm、Docker 或 Git 获取 NocoBase |
| [`nb source dev`](./dev.md) | 在 npm/Git 源码 env 中启动开发模式 |
| [`nb source build`](./build.md) | 构建本地源码工程 |
| [`nb source test`](./test.md) | 在选中应用目录中运行测试 |

## 示例

```bash
nb source download --source npm --version alpha
nb source download --source docker --version alpha --docker-platform auto
nb source dev --env app1
nb source build @nocobase/acl
nb source test --server --coverage
```

## 相关命令

- [`nb init`](../init.md)
- [`nb app upgrade`](../app/upgrade.md)
