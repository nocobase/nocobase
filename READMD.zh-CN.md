# NocoBase 3

[English](./READMD.md) | 简体中文

**为 AI 构建业务系统提供开源底座。**

NocoBase 提供现成的业务能力、统一的架构和开发 Skills，让你和 Coding Agent 专注于业务逻辑，持续构建和完善业务应用。

应用运行在你自己的基础设施上，代码和数据由你掌握，使用的 Coding Agent 和模型由你选择。

[官网](https://www.nocobase.com/) · [文档](https://docs.nocobase.com/) · [快速开始](#快速开始) · [社区](https://forum.nocobase.com/)

> 当前分支为 NocoBase 3。如果你在寻找 NocoBase 2 无代码开发平台，请访问 [NocoBase 2](https://nocode.nocobase.com/)。

## 为什么选择 NocoBase？

### 从现成的业务底座开始

业务系统需要的不只是页面和表单。NocoBase 提供认证、权限、数据、文件、工作流、通知等可复用能力，让每个应用都能在共同的基础上开始开发。部分插件需要商业许可，使用前请查看对应文档和许可条款。

### 让 Coding Agent 按统一规范开发

每个应用都自带项目结构、开发规则和 Skills。Agent 可以读取这些指引，了解代码应该放在哪里、哪些能力可以直接复用，以及如何实现和验证改动。

开发者、Agent 和模型可以变化，项目的开发规范始终随代码保留。

### 掌握自己的应用

业务代码保存在你自己的仓库中，应用部署在你自己的基础设施上。你可以选择开发工具和模型，通过插件扩展能力，并根据业务需要持续演进应用。

## 快速开始

你可以让 Coding Agent 创建应用，也可以直接在终端执行命令。两种方式使用相同的创建工具。

环境要求：

- Node.js 24 或更高版本
- pnpm 11
- Windows 用户请在 WSL 中执行命令

以下示例使用 SQLite，无需单独安装数据库服务。

### 使用 Coding Agent

在一个空的项目目录中，开启支持 Skills 的 Coding Agent。

让 Agent 执行以下命令，安装创建应用的 Skill：

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

安装时按提示选择当前使用的 Agent。如果当前会话没有识别到新 Skill，请在同一目录重新开启会话。

然后发送创建需求：

> 请在当前空目录中创建一个供本地开发使用的 NocoBase 3 应用。使用默认模板和 SQLite，按照 nocobase-create-app Skill 检查环境、创建应用、初始化并检查配置，然后启动应用。完成后告诉我应用地址，以及如何完成首次登录。

Agent 会按照指引完成创建，并说明需要补充的环境准备。

### 使用终端

在用于存放项目的父目录中执行：

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
cd my-app
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

创建命令会安装依赖。配置初始化命令会生成本地 `config.yml`，并初始化所需的密钥。

`@beta` 标签用于选择 NocoBase 3 的 beta 创建工具和模板。命令前的环境变量允许 pnpm 在本次执行中安装刚发布的版本。

### 打开应用

打开 `pnpm dev` 输出的完整 `Local:` 地址，包括应用路径，并保持终端运行。

如果没有修改初始管理员配置，默认登录信息为：

- **用户名：** `nocobase`
- **密码：** `admin123`

首次登录后请修改默认密码。

应用创建后，可以让 Coding Agent 读取项目中的 `AGENTS.md` 和 Skills，继续开发业务功能。详细的创建步骤和开发指引，请参阅[文档](https://docs.nocobase.com/)。

## NocoBase 生态

### NocoBase Core

本仓库提供的应用底座，包括可复用业务能力、项目脚手架、架构规范和开发 Skills。

[了解 Core](https://www.nocobase.com/core/)

### NocoBase Studio

人与 Agent 协作开发的治理平台，用于协调开发工作、跟踪进度，并让人参与关键决策。Studio 包含在商业版本中。

[了解 Studio](https://www.nocobase.com/studio/)

### NocoBase Solutions

基于 Core 构建的业务应用。你可以从现成应用开始使用，再根据自己的业务需求进行调整。

[了解 Solutions](https://www.nocobase.com/solutions/)

## 社区与贡献

- 在[社区论坛](https://forum.nocobase.com/)提问、交流经验和分享实践。
- 通过 [GitHub Issues](https://github.com/nocobase/nocobase/issues) 反馈可复现的问题或提出改进建议。
- 阅读[文档](https://docs.nocobase.com/)，了解框架和插件的使用方式。

欢迎参与贡献。修改本仓库前，请先阅读 [AGENTS.md](./AGENTS.md) 以及与改动相关的开发指引。
