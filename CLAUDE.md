# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

本文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 项目概述

NocoBase 是一个基于 TypeScript 单体仓库构建的 AI 驱动、可扩展的无代码/低代码平台。它采用类似 WordPress 的**微内核插件架构**——所有功能都以插件形式实现，可以启用/禁用。

**技术栈：**
- 语言：TypeScript 5.1.3 (Node.js 20.14.0, Yarn 1.22.19)
- 前端：React 18.x + Ant Design 5.24.2 + Formily 2.x (模式驱动表单)
- 后端：Koa.js 框架
- 数据库：PostgreSQL (主要)、MySQL/MariaDB、SQLite (通过 Sequelize 6.26.0)
- 构建工具：Umi.js, Vite, tsup
- 测试：Vitest (单元测试), Playwright (E2E 测试)

## 常用命令

```bash
# 开发
yarn dev              # 启动开发模式 (全栈)
yarn dev-server       # 仅启动服务器
yarn start            # 启动生产服务器

# 构建
yarn build            # 构建整个项目

# 测试
yarn test             # 运行所有测试
yarn test:server      # 运行服务端测试 (Vitest)
yarn test:client      # 运行客户端测试 (Vitest)
yarn e2e              # 运行 E2E 测试 (Playwright)
yarn benchmark        # 运行基准测试
yarn perf             # 运行性能测试

# 插件管理
yarn pm               # 插件管理器 CLI
yarn pm2              # PM2 进程管理器

# 代码质量
yarn lint             # 运行 ESLint
yarn clean            # 清理构建产物

# 文档
yarn doc              # 生成文档 (英文)
yarn doc:cn           # 生成文档 (中文)
```

**Git Hooks:**
- `pre-commit`: 自动运行 `yarn lint-staged` 并添加许可证头
- `commit-msg`: 验证提交消息格式 (conventional commits 格式: `type(scope): description`)

## 架构

### 核心架构层

代码库组织在 `packages/core/` 下，包含以下关键层：

1. **应用层** (`app/`) - 主应用入口点
2. **服务层** (`server/`) - Koa.js 后端，包含插件系统
3. **客户端层** (`client/`) - React 前端，集成 Formily
4. **数据库层** (`database/`) - Sequelize ORM 抽象层，包含集合管理
5. **插件系统** (`server/src/plugin-manager/`) - 动态插件加载和管理
6. **访问控制层** (`acl/`) - 基于角色的权限控制
7. **资源层** (`resourcer/`) - REST API 资源定义和路由
8. **认证** (`auth/`) - 用户认证和授权

### 单体仓库结构

```
/packages/
├── core/                    # 核心包 (微内核)
│   ├── app/                # 应用入口
│   ├── server/             # Koa.js 后端
│   ├── client/             # React 前端
│   ├── database/           # Sequelize ORM
│   ├── acl/                # 访问控制
│   ├── auth/               # 认证
│   ├── resourcer/          # REST API 资源
│   ├── actions/            # CRUD 操作
│   ├── cache/              # 缓存
│   ├── logger/             # 日志
│   ├── sdk/                # 客户端 SDK
│   ├── cli/                # CLI 工具
│   ├── test/               # 测试工具
│   ├── evaluators/         # 表达式求值器
│   └── data-source-manager/# 多数据源支持
├── plugins/@nocobase/      # 80+ 插件
└── presets/                # 插件包
```

### 插件架构

所有功能都以插件形式实现。标准插件结构：

```
plugin-name/
├── src/
│   ├── client/             # React 组件 (前端)
│   ├── server/             # 后端逻辑
│   └── locale/             # 国际化文件
└── package.json            # 插件元数据
```

插件可扩展：
- 页面和 UI 区块
- 操作和工作流
- API 资源
- 数据源 (主数据库、外部数据库、第三方 API)
- 字段类型

### 关键架构模式

**数据模型驱动方法:**
- UI 与数据结构解耦
- 同一个表/集合可以有无限数量的区块和操作
- 支持多数据源 (主数据库、外部数据库、API)

**基于插件的微内核:**
- 所有功能都是插件
- 插件在开发时支持热加载
- 插件管理器处理依赖和生命周期

**模式驱动 UI:**
- 使用 Formily JSON Schema 定义表单
- UI 模式与数据模式分开存储
- 支持运行时 UI 生成

**多应用支持:**
- 可从一个代码库运行多个 NocoBase 实例
- 每个应用可以有自己的插件配置

### 代码约定

**代码风格:**
- 2 空格缩进
- 单引号
- 120 字符行宽
- 所有文件需包含 AGPL-3.0 许可证头

**命名规范:**
- 插件：`plugin-<name>` (kebab-case)
- 包：`@nocobase/<name>` (kebab-case)
- 文件：通常为 kebab-case，React 组件为 PascalCase
- TypeScript 类：PascalCase

**测试:**
- 单元测试：`.spec.ts` 文件，使用 Vitest 运行
- E2E 测试：位于 `e2e/` 或 `__e2e__/` 目录，使用 Playwright 运行
- 测试工具可在 `@nocobase/test` 包中找到

### 数据库模式

- 集合通过 `@nocobase/database` 中的 TypeScript 装饰器定义
- 迁移通过 Umzug 管理
- 支持继承集合 (集合扩展)

### 重要说明

- **许可证:** 双重许可 (AGPL-3.0 + 商业许可)
- **版本:** 所有包共享同一版本 (当前 1.9.9)
- **Node 版本:** 需要 Node.js >= 18 (通过 Volta 管理：20.14.0)
- **TypeScript:** 启用实验性装饰器，路径通过 `tsconfig.paths.json` 映射
- **提交消息:** 必须遵循 conventional commits 格式

### 开发工作流

1. `yarn install` 后自动运行 `postinstall`
2. Pre-commit hook 自动修复 lint 问题并添加许可证头
3. 使用 `yarn dev` 进行开发 (热重载)
4. 使用 `yarn pm` 进行插件管理操作
5. 测试可选择性运行：`yarn test:server` 或 `yarn test:client`

### 文档

- 英文：https://docs.nocobase.com/
- 中文：https://docs-cn.nocobase.com/
- 论坛：https://forum.nocobase.com/
- 在线演示：https://demo.nocobase.com/new
