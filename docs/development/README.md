# NocoBase 插件开发指南

NocoBase 采用插件化架构，所有新功能都可以通过开发和安装插件来实现。本文档将详细介绍如何开发 NocoBase 插件。

## 目录结构

```
docs/development/
├── README.md                  # 插件开发指南主文档
├── getting-started.md         # 快速开始
├── directory-structure.md     # 目录结构
├── plugin-samples.md          # 插件示例
├── client-development.md      # 客户端开发
├── server-development.md      # 服务端开发
├── plugin-api.md              # 插件 API 参考
└── best-practices.md          # 最佳实践
```

## 文档章节

1. [插件开发完整指南](./plugin-development.md) - 插件开发综合指南
2. [快速开始](./getting-started.md) - 从零开始创建第一个插件
3. [目录结构](./directory-structure.md) - 插件的标准目录结构说明
4. [插件示例](./plugin-samples.md) - 各种类型的插件示例
5. [客户端开发](./client-development.md) - 前端 UI 组件开发
6. [服务端开发](./server-development.md) - 后端逻辑和 API 开发
7. [插件 API 参考](./plugin-api.md) - 插件开发 API 详细说明
8. [最佳实践](./best-practices.md) - 插件开发的最佳实践和建议

## 插件架构概述

NocoBase 插件分为客户端和服务端两部分：

- **客户端**: 负责 UI 界面和交互
- **服务端**: 负责业务逻辑和数据处理

插件通过标准的 npm 包格式组织，可以独立开发、测试和发布。

## 开发环境准备

在开始插件开发之前，请确保已完成 NocoBase 的安装和基本配置。
