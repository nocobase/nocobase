# NocoBase 2.1.0 发布日志

这是一次**围绕 AI 能力**的重要升级。这个版本能够让你把 AI Agent 接入 NocoBase。从 CLI 接入、AI 搭建，到 AI 员工能力增强、AI 开发插件等，覆盖了环境接入、系统搭建和业务协作的完整流程。同时，我们继续大幅补齐 2.0 页面与核心能力的适配——更多区块、字段、操作和插件支持了 2.0 版本。

## 新特性

### 新增 NocoBase CLI

在这个版本中，NocoBase CLI（`nb`）是普通用户和 AI Agent 连接 NocoBase 的核心入口。

CLI 用于在本地工作区初始化、连接和管理 NocoBase 应用，覆盖几类场景：

- 通过 Docker、npm 或 Git 安装新的 NocoBase 应用，再保存为 CLI env
- 连接已有的 NocoBase 应用，保存为 CLI env
- 安装、创建、激活插件
- 运维、备份和管理 NocoBase 应用

![nocobase cli 可视化向导](https://static-docs.nocobase.com/2026-04-29-15-55-19.png)

不管你是要把 AI 接入现有系统，还是从零开始创建一个新应用，都可以通过 CLI 完成初始化和后续管理。

对团队来说，CLI 提供了一个 AI Agent 能理解和操作的标准入口——环境初始化、连接配置、运行管理都走同一套流程。

正式版还补齐了一批运维相关命令如下：

- `nb api`: 通过 CLI 调用 NocoBase API。
- `nb app`: 管理应用运行态：启动、停止、重启、日志和升级。
- `nb backup`: 创建备份并下载到本地，或把本地备份文件恢复到目标 env。
- `nb config`: 管理 CLI 默认配置。
- `nb db`: 管理选中 env 的内置数据库。
- `nb env`: 管理 NocoBase 项目环境、当前 env、状态、详情和运行时命令。
- `nb license`: 管理商业授权和授权插件。
- `nb plugin`: 管理选中 NocoBase env 的插件。
- `nb scaffold`: 生成 NocoBase 插件开发脚手架。
- `nb self`: 检查或更新 NocoBase CLI 本身。
- `nb source`: 管理本地源码工程：下载、开发、构建和测试。

相关文档：

- [使用 CLI 安装 NocoBase 应用](https://docs.nocobase.com/cn/quickstart/installation/cli)
- [AI Agent 接入指南](https://docs.nocobase.com/cn/ai/quick-start)
- [NocoBase CLI 命令参考](https://docs.nocobase.com/cn/api/cli/)

### AI 搭建：用对话代替手动配置

AI 搭建是这个版本的核心体验之一。你可以直接用自然语言描述业务需求，AI 会协助完成数据建模、页面配置、权限设置和工作流编排。

比起传统的低代码搭建方式，AI 搭建有几个显著优势：

- 降低了上手门槛，不需要先熟悉所有配置概念就能上手
- 从需求描述到原型落地的路径更短
- 数据、界面和流程配置可以由 AI 连续完成

比如“帮我设计一个 CRM 数据模型”、“帮我创建一个客户管理页面”、“帮我编排一个订单创建后自动扣减库存的工作流”——这些 AI 都可以在 NocoBase 的能力范围内协助完成。

相关文档：

- [AI 搭建快速开始](https://docs.nocobase.com/cn/ai-builder/)

### NocoBase Skills 覆盖搭建全流程

为了让 AI 真正理解 NocoBase 的配置体系，我们在这个版本提供了一组可安装到 AI Agent 中的领域知识包——NocoBase Skills。

Skills 是围绕 NocoBase 关键能力域组织的标准化知识与操作封装，帮 AI 更准确地理解对象模型、配置结构和执行边界。

目前我们提供了 8 个 Skills，覆盖搭建全流程：

- [环境管理](https://docs.nocobase.com/cn/ai-builder/env-bootstrap) — 环境检查、安装部署、升级和故障诊断
- [数据建模](https://docs.nocobase.com/cn/ai-builder/data-modeling) — 创建和管理数据表、字段、关联关系
- [界面配置](https://docs.nocobase.com/cn/ai-builder/ui-builder) — 创建和编辑页面、区块、弹窗、交互联动
- [工作流管理](https://docs.nocobase.com/cn/ai-builder/workflow) — 创建、编辑、启用和诊断工作流
- [权限配置](https://docs.nocobase.com/cn/ai-builder/acl) — 管理角色、权限策略、用户绑定和风险评估
- [解决方案](https://docs.nocobase.com/cn/ai-builder/dsl-reconciler) — 从 YAML 批量搭建整套业务系统(还在测试中，稳定性有限)
- [插件管理](https://docs.nocobase.com/cn/ai-builder/plugin-manage) — 查看、启用和停用插件
- [发布管理](https://docs.nocobase.com/cn/ai-builder/publish) — 跨环境发布、备份恢复和迁移

有了 Skills，AI 可以更准确地理解 NocoBase 的配置体系，并在搭建和管理系统时提供更智能的辅助。

**注意**： NocoBase Skills 目前还在持续完善中。安装 NocoBase CLI 并初始化的时候会自动安装 NocoBase Skills，通常来说你不用单独安装。

相关文档：

- [NocoBase Skills](https://github.com/nocobase/skills)

### AI 开发插件

这个版本补齐了 AI 插件开发所需的基础能力，让 AI 不仅能参与应用搭建，也能参与自定义插件开发。

主要体现在三个方面：

- 统一使用 `rsbuild/rspack` 构建，收敛了插件开发和前端构建体系
- 提供面向 AI 开发的 `client-v2` 能力和 `/v/` 路由体系，为新一代客户端插件开发做准备
- 提供 AI 插件开发相关 Skill，让 AI 能更好地理解插件结构、代码组织和实现方式

围绕 `client-v2` 的准备工作包括：

- `@nocobase/app` 提供 `client-v2` 的入口
- 内核提供 `@nocobase/client-v2` 包，包含基础组件、工具函数和类型定义
- 各插件提供 `/src/client-v2` 目录
- 路由新增 `/v/`，目前还在持续完善中，可供尝鲜
- 内核逐步迁移到 V2
- 插件逐步迁移到 V2

统一的构建链路降低了前端插件开发和调试成本，`client-v2` 的逐步落地也为 AI 生成和维护插件代码提供了更稳定的目标结构。

实际效果是：你可以直接用自然语言描述一个插件需求，AI 协助生成前后端代码、数据表、API、权限配置和国际化内容。

**注意**：AI 开发插件的能力仅针对 `client-v2` 新版本插件。我们后续会提供 `client-v1` 插件到 `client-v2` 插件相关的迁移文档和 Skills，帮助你把现有插件迁移到新的体系中来。

相关文档：

- [AI 开发插件快速开始](https://docs.nocobase.com/cn/ai-dev/)
- [插件开发](https://docs.nocobase.com/cn/plugin-development/)

### AI 员工能力增强

AI 搭建解决的是“怎么用 AI 搭系统”，AI 员工解决的是“怎么让 AI 进系统里帮助你解决具体业务问题”。

AI 员工在之前的版本里已经存在。不过在这个版本中，AI 员工相关能力得到了增强，AI 内核也做了补齐：

- [支持接入 MCP](https://docs.nocobase.com/cn/ai-employees/features/mcp)
- [新增 AI 员工 Atlas](https://docs.nocobase.com/cn/ai-employees/features/built-in-employee#%E9%BB%98%E8%AE%A4-ai-%E5%91%98%E5%B7%A5-atlas), 承担团队领导角色，可以根据用户意图调用其他的 AI 员工完成任务
- [提供 AI 员工节点](https://docs.nocobase.com/cn/ai-employees/workflow/nodes/employee/configuration)
- [提供基于 LLM 的联网搜索工具](https://docs.nocobase.com/cn/ai-employees/features/web-search)
- [新增聚合查询工具、生成报告工具](https://docs.nocobase.com/cn/ai-employees/scenarios/business-report)，支持生成业务分析报告
- [新增本地化工程师 Lina](https://docs.nocobase.com/cn/ai-employees/built-in/lina)，本地化插件内置的 AI 员工，用于系统本地化翻译，支持增量、所选项、全量三种翻译范围

这些改进让 AI 员工在业务系统中的可扩展性、可编排性和执行能力都上了一个台阶。AI 员工可以理解当前业务上下文、调用技能执行具体任务、参与自动化流程、结合外部信息完成分析和输出。

正式版还新增了 AI 员工支持从工作流附件字段加载文件、多个会话并行处理等能力，进一步提升了 AI 员工在真实业务流程中的可用性。

相关文档：

- [AI 员工](https://docs.nocobase.com/cn/ai-employees/)
- [Lina：本地化工程师](https://docs.nocobase.com/cn/ai-employees/built-in/lina)
- [使用 Lina 和本地 HY-MT1.5-1.8B 翻译本地化词条](https://docs.nocobase.com/cn/ai-employees/scenarios/localization-hy-mt)

### 多应用功能升级

这个版本里，我们为多应用做了一些重要的功能升级。主要有三个方面：

- [新增应用区块和应用切换](https://docs.nocobase.com/cn/multi-app/multi-app/app-block-and-switcher)，支持在页面中展示其他子应用的入口，方便用户在主应用和子应用之间切换。

![](https://static-docs.nocobase.com/202605271403304.png)

- [新增应用单点登录](https://docs.nocobase.com/cn/multi-app/multi-app/app-sso)，用户从主应用入口进入子应用，或在子应用之间切换时，系统会尝试使用当前登录用户自动登录到目标子应用。用户不需要在每个子应用中重复输入账号密码。

![](https://static-docs.nocobase.com/202605271406542.png)

- [调用子应用 API](https://docs.nocobase.com/cn/multi-app/multi-app/sub-app-api)，在多应用场景中，每个子应用都有自己独立的 API，通过路径前缀、参数等方式区分，可以方便地调用子应用的 API。

这些升级对于多应用部署的用户来说将会非常实用，可以更方便地在多个应用之间进行数据交互和操作，提升多应用系统的整体协同效率。

相关文档：

- [应用区块和应用切换](https://docs.nocobase.com/cn/multi-app/multi-app/app-block-and-switcher)
- [应用单点登录](https://docs.nocobase.com/cn/multi-app/multi-app/app-sso)
- [调用子应用 API](https://docs.nocobase.com/cn/multi-app/multi-app/sub-app-api)

### 工作流增强

本次版本对工作流的 **可控性与可观测性**做了增强：

- 新增超时控制，运行时间超长的工作流会被自动终止（子流程同样支持超时配置）
- 新增创建人和更新人字段
- 为节点任务新增日志字段，便于在调试时查看节点日志
- Webhook 触发器（同步模式）超时后返回 408 响应状态

相关文档：

- [工作流](https://docs.nocobase.com/cn/workflow/)

### 手写签名字段

新增手写签名字段，支持在表单中手写并保存签名，适用于审批、确认单、回执等场景。

相关文档：

- [手写签名字段](https://docs.nocobase.com/cn/data-sources/field-signature/)

### JS Item 操作

新增 JS Item 操作，允许通过编写 JS 在操作中执行自定义逻辑，配合事件流满足更灵活的交互需求。

相关文档：

- [JS Item 操作](https://docs.nocobase.com/cn/interface-builder/actions/types/js-item)

### 2.0 适配与新功能

AI 之外，这个版本也在持续将一些重要功能模块升级到 2.0，同时继续推出面向实际业务场景的新功能。

新功能

- [手写签名字段](https://docs.nocobase.com/cn/data-sources/field-signature/)
- [JS Item 操作](https://docs.nocobase.com/cn/interface-builder/actions/types/js-item)

2.0 适配

- [自定义请求](https://docs.nocobase.com/cn/interface-builder/actions/types/custom-request)
- [中国行政区](https://docs.nocobase.com/cn/data-sources/data-modeling/collection-fields/advanced/china-region)
- [树筛选区块](https://docs.nocobase.com/cn/interface-builder/blocks/filter-blocks/tree)
- [日历区块](https://docs.nocobase.com/cn/data-sources/calendar/)
- [看板区块](https://docs.nocobase.com/cn/interface-builder/blocks/data-blocks/kanban)
- [甘特图区块](https://docs.nocobase.com/cn/plugins/@nocobase/plugin-gantt)
- [列表区块](https://docs.nocobase.com/cn/interface-builder/blocks/data-blocks/list)
- [网格卡片区块](https://docs.nocobase.com/cn/interface-builder/blocks/data-blocks/grid-card)
- [地图区块](https://docs.nocobase.com/cn/plugins/@nocobase/plugin-map)
- [Markdown 区块](https://docs.nocobase.com/cn/interface-builder/blocks/other-blocks/markdown)
- [iframe 区块](https://docs.nocobase.com/cn/integration/embed)
- [图表区块 / 数据可视化](https://docs.nocobase.com/cn/data-visualization)

## 多语言文档

- 新增印尼语和越南语文档
