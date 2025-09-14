# NocoBase 插件开发完整指南

NocoBase 采用插件化架构，所有功能都可以通过插件来实现。本文档将全面介绍 NocoBase 插件开发的各个方面。

## 目录

1. [快速开始](./getting-started.md) - 从零开始创建第一个插件
2. [目录结构](./directory-structure.md) - 插件的标准目录结构说明
3. [插件示例](./plugin-samples.md) - 各种类型的插件示例
4. [客户端开发](./client-development.md) - 前端 UI 组件开发
5. [服务端开发](./server-development.md) - 后端逻辑和 API 开发
6. [插件 API 参考](./plugin-api.md) - 插件开发 API 详细说明
7. [最佳实践](./best-practices.md) - 插件开发的最佳实践和建议

## 插件架构概述

NocoBase 插件分为客户端和服务端两部分：

- **客户端**: 负责 UI 界面和交互
- **服务端**: 负责业务逻辑和数据处理

插件通过标准的 npm 包格式组织，可以独立开发、测试和发布。

## 核心概念

### 插件系统
NocoBase 的插件系统允许开发者扩展平台功能，包括：
- 添加新的 UI 组件
- 创建自定义数据模型
- 实现业务逻辑
- 集成第三方服务

### Schema 驱动
NocoBase 使用 JSON Schema 来定义界面和数据结构，使得界面配置化和动态化。

### 资源管理器
通过资源管理器自动生成 RESTful API，简化后端开发。

### 访问控制
内置基于角色的访问控制系统，确保应用安全性。

## 开发环境准备

在开始插件开发之前，请确保已完成以下步骤：

1. 安装 Node.js (版本 18.x 或更高)
2. 安装 yarn 包管理器
3. 克隆 NocoBase 源码并完成安装
4. 启动开发服务器

```bash
# 克隆源码
git clone https://github.com/nocobase/nocobase.git
cd nocobase

# 安装依赖
yarn install

# 启动开发服务器
yarn dev
```

## 插件生命周期

插件具有明确的生命周期：

1. **beforeLoad** - 插件加载前初始化
2. **load** - 插件加载和配置
3. **install** - 插件安装初始化
4. **disable** - 插件禁用清理

## 插件类型

NocoBase 支持多种类型的插件：

1. **UI 插件** - 扩展用户界面
2. **数据插件** - 扩展数据模型和操作
3. **业务插件** - 实现特定业务逻辑
4. **集成插件** - 集成第三方服务
5. **工具插件** - 提供通用工具功能

## 学习路径建议

对于初学者，建议按以下顺序学习：

1. 阅读[快速开始](./getting-started.md)指南，创建第一个插件
2. 理解[目录结构](./directory-structure.md)
3. 查看[插件示例](./plugin-samples.md)，了解不同类型插件的实现
4. 学习[客户端开发](./client-development.md)和[服务端开发](./server-development.md)
5. 参考[插件 API 参考](./plugin-api.md)了解详细接口
6. 遵循[最佳实践](./best-practices.md)提高代码质量

## 贡献插件

开发完成的插件可以贡献给社区：

1. 确保代码质量和文档完整
2. 编写测试用例
3. 遵循版本控制规范
4. 发布到 npm 或 GitHub

## 获取帮助

如果在开发过程中遇到问题：

1. 查阅官方文档
2. 在 GitHub Issues 中提问
3. 加入社区讨论群
4. 参考官方插件源码

通过本指南，您将能够掌握 NocoBase 插件开发的全部知识，创建出功能强大且易于维护的插件。
