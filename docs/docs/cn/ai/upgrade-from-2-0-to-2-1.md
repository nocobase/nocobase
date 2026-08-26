---
title: NocoBase 2.0 升级到 2.1 指南
description: 将 NocoBase 2.0 应用升级到 2.1，并说明旧安装方式、nb CLI 和迁移路径该如何选择。
---

# NocoBase 如何从 2.0 升级到 2.1

从 NocoBase 2.0 升级到 NocoBase 2.1，应用是平滑升级的，变化比较大的是 NocoBase CLI。

其中：

- 2.0 及之前的 CLI，命令通常以 `yarn nocobase` 开头
- 2.1 及以上的 CLI，使用全局安装的 `nb`

旧应用不是必须马上迁移到 `nb`。如果你只是要把一个已经稳定运行的 NocoBase 2.0 应用升级到 2.1，默认继续沿用原来的安装和升级方式就行。新安装的应用，建议使用新的 `nb` CLI 来维护。

## 继续使用原方式安装和升级

如果你已经习惯之前的安装方式，可以继续使用。安装、升级仍然按原来的文档来就行。

### 安装 NocoBase

- [Docker 安装](/get-started/installation/docker)
- [create-nocobase-app 安装](/get-started/installation/create-nocobase-app)
- [Git 源码安装](/get-started/installation/git)

### 升级 NocoBase

- [Docker 安装的升级](/get-started/upgrading/docker)
- [create-nocobase-app 安装的升级](/get-started/upgrading/create-nocobase-app)
- [Git 源码安装的升级](/get-started/upgrading/git)

## 新应用使用 `nb` CLI

新应用推荐使用更便捷的 `nb` 安装和升级方式。

### 安装 NocoBase

- [安装 NocoBase 应用](./install-nocobase-app.md)

### 升级 NocoBase

- [升级 NocoBase 应用](./upgrade-nocobase-app.md)

## 如何迁移到 `nb` CLI

如果你希望后续统一用 `nb` 管理应用，那么当前更稳妥的做法是新建一个应用，再把旧应用的数据迁移过去。

迁移步骤：

1. 先使用 `nb init` 新建一个 CLI 应用
2. 再把旧应用的数据库、`storage` 和必要环境变量迁移过去
3. 验证新应用可以正常使用后，再切换正式环境

你也可以先观望一段时间，`nb` 接管本地旧应用的能力正在开发中。

![2026-06-13-21-29-24](https://static-docs.nocobase.com/2026-06-13-21-29-24.png)
