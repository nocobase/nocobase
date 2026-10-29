# NocoBase 3

[English](./READMD.md) | 简体中文

**构建可靠的业务系统**

NocoBase 是用 AI 持续开发和运行业务系统的开源平台。Agent 写代码、做执行，NocoBase 提供底座和治理能力，人来做决策。

[▶ 观看演示](https://static-docs.nocobase.com/nocobase-3-zh.mp4)

[官网](https://www.nocobase.com/) · [文档](https://docs.nocobase.com/) · [快速开始](#快速开始) · [社区](https://forum.nocobase.com/)

> 当前分支为 NocoBase 3。如果你在寻找 NocoBase 2 无代码开发平台，请访问 [NocoBase 2](https://nocode.nocobase.com/)。

## 为什么需要 NocoBase

**AI 写代码很快，但构建可靠的业务系统依然不简单。**

你的企业已经在用 AI 开发或者 Vibe Coding，代码写得很快，但新的问题随之出现。

- **底层能力要从零建设：** 即使交给 AI，权限、工作流引擎、审批等底层模块从零开发，设计难度依然很高，边界情况多，维护工作量大。

- **架构随机漂移，逐渐失控：** 换人、换模型甚至换会话，AI 都可能随机发挥，系统越来越难维护。

- **并行任务很多，人确认不过来：** 同时处理多个项目和任务，在多个终端和对话之间切换，Agent 交过来的改动也越来越多，人看不过来，又不敢放手。

- **知识和经验难以沉淀和共享：** 需求背景、业务资料、项目经验散落在不同电脑的不同会话里，换人、换 Agent 就很难找到。

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

- **[NocoBase Core](https://www.nocobase.com/zh-CN/core/)**

  **让 Agent 专心写业务，底座已经就绪。**

  NocoBase Core 是 AI 开发和运行业务系统的开源应用底座。权限、流程、文件等基础能力现成可用，Agent 在统一架构上只开发企业自己的业务。

- **[NocoBase Studio](https://www.nocobase.com/zh-CN/studio/)**

  **Agent 自主推进，团队掌控全局。**

  NocoBase Studio 是人与 Agent 协同开发的治理平台。把 Claude Code、Codex、OpenCode 组成一支 Agent 团队自主推进任务，进展一目了然，关键处由人做决策。

- **[NocoBase Solution](https://www.nocobase.com/zh-CN/solutions/)**

  **开源业务应用，AI 驱动，开箱即用。**

  NocoBase Solution 是由 Agent 驱动的、基于 Core 构建的一系列企业业务应用，Agent 做大部分执行工作，人只做关键决策。

## 社区与贡献

- 在[社区论坛](https://forum.nocobase.com/)提问、交流经验和分享实践。
- 通过 [GitHub Issues](https://github.com/nocobase/nocobase/issues) 反馈可复现的问题或提出改进建议。
- 阅读[文档](https://docs.nocobase.com/)，了解框架和插件的使用方式。

欢迎参与贡献。修改本仓库前，请先阅读 [AGENTS.md](./AGENTS.md) 以及与改动相关的开发指引。
