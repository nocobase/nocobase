[English](./README.md) | 简体中文 | [日本語](./README.ja-JP.md) | [Français](./README.fr.md) | [Español](./README.es.md) | [Português](./README.pt.md) | [Bahasa Indonesia](./README.id.md) | [Tiếng Việt](./README.vi.md) | [Deutsch](./README.de.md)

https://github.com/user-attachments/assets/6032e3a6-d14f-4d40-aea5-acb74c383594

<p align="center">
<a href="https://trendshift.io/repositories/4112" target="_blank"><img src="https://trendshift.io/api/badge/repositories/4112" alt="nocobase%2Fnocobase | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
<a href="https://www.producthunt.com/posts/nocobase?embed=true&utm_source=badge-top-post-topic-badge&utm_medium=badge&utm_souce=badge-nocobase" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=456520&theme=light&period=weekly&topic_id=267" alt="NocoBase - Scalability&#0045;first&#0044;&#0032;open&#0045;source&#0032;no&#0045;code&#0032;platform | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>
</p>

## 目录

- [NocoBase 是什么](#nocobase-是什么)
- [发布日志](#发布日志)
- [与众不同之处](#与众不同之处)
- [AI Agent 接入](#ai-agent-接入)
- [安装](#安装)

## NocoBase 是什么

NocoBase 是一个开源的 “AI + 无代码” 开发平台，用于快速开发企业业务系统。不同于让 AI 从零生成代码，NocoBase 提供经过生产验证的基础设施和所见即所得的无代码界面，让 AI 与人高效协同，既保证开发速度又保证系统可靠性。

中文官网：  
https://www.nocobase.com/cn

在线体验：  
https://demo.nocobase.com/new

文档：  
https://docs.nocobase.com/cn/

社区：  
https://forum.nocobase.com/c/chinese-forum/6

用户故事：  
https://www.nocobase.com/cn/blog/tags/customer-stories

## 发布日志

我们的[发布日志](https://www.nocobase.com/cn/blog/timeline)会及时更新，并每周汇总重要变化。

## 与众不同之处

### 1. 协同：AI 与人一起构建

NocoBase 既为 Coding Agent 提供了完善的 CLI 和 Skills，又为人提供了所见即所得的无代码开发界面，让 AI 与人可以高效协同。

#### 用你熟悉的 AI Coding Agent 开发

使用主流 Coding Agent，从部署到搭建业务系统只需数十分钟。

- 支持 Claude Code、Cursor、Codex、OpenCode、TRAE 等所有主流 Agent
- 从安装部署，到搭建开发，到迁移发布，都由 Agent 完成

![coding-agent](https://static-docs.nocobase.com/coding-agent.png)

#### 在所见即所得的无代码界面上人工开发

所见即所得的配置界面，人可以直接可视化搭建和修改，不用 AI 也可以完成整个系统搭建。

- 一键切换使用模式与配置模式
- 数据模型、页面、工作流、权限全部都可以可视化审查和配置
- 配置模式面向普通用户设计，而非仅限专业开发人员

![wysiwyg](https://static-docs.nocobase.com/wysiwyg.gif)

#### AI 开发与人工搭建自由组合

按需分工，AI 搭建的结果，人可以随时接管修改；人配置的内容，AI 也能理解并继续迭代。

- AI 可以高效创建数据模型、基础页面、工作流
- 人可以快速对界面交互进行调整
- 按需协同，持续迭代

![ai-no-coding](https://static-docs.nocobase.com/ai-no-coding.png)

### 2. 智能：AI 不只参与开发，更参与业务处理

NocoBase 内置 AI 员工能力，让 AI 作为业务参与者直接在系统内工作。

#### AI 员工融入业务流程

AI 员工自动获取业务上下文，在系统内直接执行任务，而非仅作为对话窗口。

- 前台：协助用户完成数据分析、智能问答、表单填写等操作
- 后台：持续运行，自动处理文档识别、风险监测、任务分发等工作
- 与工作流深度集成，AI 员工可以作为流程中的一个节点参与决策和执行

![AI-employee](https://static-docs.nocobase.com/ai-employee-home.png)

#### 开放接口，连接 Agent 生态

提供 MCP、HTTP API、CLI 等标准接口和完善的 Skills，让外部 Agent 安全接入。

- OpenClaw、Hermes、Dify、Coze、n8n 等外部 Agent 平台可通过标准协议接入
- 与飞书、微信、Whatsapp、Slack、Gmail 打通，能够查询数据、触发操作、执行业务流程
- 统一接口规范，内部 AI 员工与外部 Agent 使用相同的能力边界

![agents](https://static-docs.nocobase.com/f-agents-logos.jpeg)

#### 权限约束，行为可控

AI 的所有操作都受细粒度权限控制，与人类用户遵循相同的安全规则。

- 每个 AI 员工拥有独立角色，读写权限精确到字段级别
- 所有操作记录在审计日志中，可追溯每一次数据变更和流程触发
- 管理员可随时调整 AI 员工的权限范围，确保行为边界清晰

![permission](https://static-docs.nocobase.com/f-permission.png)

### 3. 可靠：基础能力就绪，只需关注业务本身

数据模型、权限控制、流程编排等功能逻辑复杂且不允许出错。  
NocoBase 将它们作为内置基础设施提供，经过严格测试和大量生产环境验证。

#### 完善的基础设施，不再每次从零开始

NocoBase 内置数十个基础模块，覆盖业务系统开发中最常见也最关键的需求。

- 数据建模、权限控制、工作流、审计日志等核心能力开箱即用
- 经过大量企业生产环境验证，不是每次由 AI 重新生成的黑盒代码
- 为 AI 提供规范和约束，确保生成的结果符合系统架构要求

![core](https://static-docs.nocobase.com/f-core.png)

#### 数据模型驱动，数据与界面解耦

所有业务沉淀为标准关系型数据库结构，数据模型与用户界面完全分离。

- 支持主数据库、外部数据库以及第三方 API 作为数据源
- AI 和人都基于同一个数据模型工作，结果透明、可审查
- 数据始终存储在你自己的数据库中，不被平台锁定

![model](https://static-docs.nocobase.com/model.png)

#### 插件化架构，系统可持续演进

微内核设计，一切功能皆插件。系统随业务增长长期迭代而不失控。

- 新功能通过插件组合扩展，遵循统一规范，互不干扰
- 支持自研插件与官方插件混合使用，灵活适配业务需求
- 架构统一，无论 AI 生成还是人工开发的插件，都遵循同一套标准

![plugins](https://static-docs.nocobase.com/plugins.png)

## AI Agent 接入

如果你想让 AI Agent 直接参与 NocoBase 的搭建和操作，最简方式是先安装 NocoBase CLI 并完成初始化，然后在 CLI 初始化后的工作目录中启动或重启 AI Agent 会话。

- NocoBase CLI 负责安装、连接和管理 NocoBase 应用
- CLI 初始化时会自动安装 NocoBase Skills，让 AI Agent 理解 NocoBase 的数据模型、页面、工作流、权限和插件体系
- 初始化完成后，只要 AI Agent 的工作目录指向这个目录，就可以直接开始操作 NocoBase

最短流程：

```bash
npm install -g @nocobase/cli@beta
mkdir my-nocobase && cd my-nocobase
nb init --ui
```

完成初始化后，在该目录中重启你的 AI Agent 会话即可，例如：

```bash
cd my-nocobase && codex
```

更多说明请参考：  
https://docs.nocobase.com/cn/ai/quick-start

## 安装

NocoBase 支持三种安装方式：

- <a target="_blank" href="https://docs.nocobase.com/cn/welcome/getting-started/installation/docker-compose">Docker 安装（推荐）</a>

  适合无代码场景，不需要写代码。升级时，下载最新镜像并重启即可。

- <a target="_blank" href="https://docs.nocobase.com/cn/welcome/getting-started/installation/create-nocobase-app">使用 create-nocobase-app 安装</a>

  项目的业务代码完全独立，支持低代码开发。

- <a target="_blank" href="https://docs.nocobase.com/cn/welcome/getting-started/installation/git-clone">Git 源码安装</a>

  如果你想体验最新未发布版本，或者想参与贡献，需要在源码上进行修改、调试，建议选择这种安装方式。它对开发技术水平要求更高；代码更新后，可以通过 Git 拉取最新代码。
