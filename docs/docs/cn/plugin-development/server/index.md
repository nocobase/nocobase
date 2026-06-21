---
title: "插件服务端开发概述"
description: "NocoBase 服务端插件开发：Plugin 类、app、db、资源、ACL、数据库、迁移、中间件、事件、命令行。"
keywords: "服务端插件,Server Plugin,Plugin 类,app,db,ACL,迁移,NocoBase"
---

# 概述

NocoBase 的服务端插件可以做很多事：定义数据表、写自定义接口、管理权限、监听事件、注册定时任务，甚至扩展 CLI 命令。所有这些能力都通过一个统一的 Plugin 类来组织。

| 我想要…… | 去哪里看 |
|----------|---------|
| 了解插件类的生命周期和 `app` 成员 | [Plugin 插件](./plugin.md) |
| 对数据库做 CRUD、事务管理 | [Database 数据库](./database.md) |
| 用代码定义或扩展数据表 | [Collections 数据表](./collections.md) |
| 插件升级时做数据迁移 | [Migration 数据迁移](./migration.md) |
| 管理多个数据源 | [DataSourceManager 数据源管理](./data-source-manager.md) |
| 注册自定义接口和资源操作 | [ResourceManager 资源管理](./resource-manager.md) |
| 配置接口权限 | [ACL 权限控制](./acl.md) |
| 添加请求/响应拦截器或中间件 | [Context 上下文](./context.md) 和 [Middleware 中间件](./middleware.md) |
| 监听应用或数据库事件 | [Event 事件](./event.md) |
| 使用缓存提升性能 | [Cache 缓存](./cache.md) |
| 注册定时任务 | [CronJobManager 定时任务](./cron-job-manager.md) |
| 支持多语言 | [I18n 国际化](./i18n.md) |
| 自定义日志输出 | [Logger 日志](./logger.md) |
| 扩展 CLI 命令 | [Command 命令行](./command.md) |
| 编写测试用例 | [Test 测试](./test.md) |

## 相关链接

- [Plugin 插件](./plugin.md) — 插件类的生命周期、成员方法和 `app` 对象
- [Collections 数据表](./collections.md) — 用代码定义或扩展数据表结构
- [Database 数据库](./database.md) — CRUD、Repository、事务与数据库事件
- [ResourceManager 资源管理](./resource-manager.md) — 注册自定义接口与资源操作
- [ACL 权限控制](./acl.md) — 角色权限、权限片段和访问控制
- [插件开发概述](../index.md) — 插件开发的整体介绍
- [编写第一个插件](../write-your-first-plugin.md) — 从零开始创建一个完整的插件
