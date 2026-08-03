---
title: "AI 搭建快速开始"
description: "AI 搭建是 NocoBase 提供的 AI 辅助搭建能力，用自然语言完成数据建模、界面搭建、工作流编排和权限配置，支持无代码配置和 AI 写代码两种方式。"
keywords: "AI 搭建,AI Builder,NocoBase AI,Agent Skills,自然语言搭建,低代码 AI,AI Portal,快速开始"
---

# AI 搭建快速开始

AI 搭建是 NocoBase 提供的 AI 辅助搭建能力——你用自然语言描述业务需求，AI Agent 帮你把系统搭起来。从数据建模、界面搭建、工作流编排、权限配置等，到最终发布上线，覆盖整条链路。

具体到「如何搭建界面」，有两种方式：

- **AI + 无代码 Portal 搭建** — AI 基于 NocoBase 的无代码配置界面的能力，帮你搭建系统界面，产物是保存在数据库里的配置。适合标准的增删改查和内部管理后台，业务人员后续也能自己在界面上接着改
- **AI Portal 搭建** — NocoBase 提供基座能力（数据、认证、权限等），AI Agent 在 [AI Portal](./ai-portal/index.md) 里写代码，构建后可以直接访问，产物可以提交到 Git。适合定制交互、复杂业务系统和有特殊视觉要求的场景

不管选哪种方式，数据表、权限、工作流这些都会用同一套 Skill —— AI Agent 写页面的同时，也能顺手帮你把数据表建好、把权限配上，通过对话逐步搭建好一个完整的业务系统。

## 两种搭建方式怎么选

上面那两种方式，各自对应一种访问入口。一个 NocoBase 应用可以有多个入口，共用同一套数据，看访问路径就能认出来是哪一种：

```text
/v/<name>    无代码 Portal
/x/<name>    AI Portal
```

具体差别：

| | 无代码 Portal | AI Portal |
| --- | --- | --- |
| 访问路径 | `/v/<name>` | `/x/<name>` |
| 页面从哪来 | 在界面里配置，AI 可以辅助改配置 | React 源码，AI Agent 编写 |
| 产物 | 保存在数据库里的配置 | 可提交到 Git 的源码 |
| 迭代方式 | 在界面里点，或让 AI 改配置 | 改代码，`dev` → `deploy` |
| 版本管理 | 通过[版本控制](./version-control.md)保存快照 | Git，或 NocoBase source storage |
| 界面自由度 | 受区块能力约束，布局和交互有既定范式 | 想做成什么样就可以做成什么样 |
| 现成能力 | 数据看板、日历、看板视图等区块开箱即用 | 参考我们提供的标准模板代码，或者 AI Agent 自己实现 |
| 上手门槛 | 需要了解 NocoBase 的区块、字段等知识 | 需要对 AI Agent 使用有一定了解 |
| 适合 | 标准增删改查、内部管理后台 | 定制交互、复杂业务系统、特殊视觉要求 |

下面这几种情况用无代码 Portal 就够了：

- 页面结构非常标准，就是常规的表格加表单，配置一下比写代码更快
- 需要让不写代码的业务人员自己调整页面
- 只想用 NocoBase 内置的区块能力，比如数据看板、日历视图、看板视图等
- 独立搭建，或者不需要多人协作搭建

其他场景我们更推荐用 [AI Portal](./ai-portal/index.md) 来搭建。无代码 Portal 搭建，AI 需要学习的上下文太多——区块类型、配置结构、联动规则等，对于需要复杂搭建的业务系统而言，搭建效率、可维护性和多人协作都不够理想。

于是我们换了个思路：**写前端代码是 AI 最擅长的事情**，可以让它做最擅长的事。NocoBase 作为系统内核的基座，前端交给 AI 自由发挥。同样的需求，速度更快，效果也更好。**AI 自由发挥，由 NocoBase 负责可靠性。**

两种模式也可以混用：内部管理后台用无代码 Portal 快速配好，对外的客户门户用 AI Portal 精细定制——它们在同一个应用里，共用一套数据和用户体系。

## 快速开始

::: warning 注意
如果要尝试 AI Portal 搭建，请安装 alpha 版本的 NocoBase CLI（`npm install -g @nocobase/cli@alpha`）。
:::

如果你已经安装过 [NocoBase CLI](../ai/quick-start.md)，可以跳过这一步。

### 一键 AI 安装

将下方提示词复制给你的 AI 助手（Claude Code、Codex、Cursor、Trae 等），即可自动完成安装和配置：

```
帮我安装 NocoBase CLI 并完成初始化：https://docs.nocobase.com/cn/ai/ai-quick-start.md （请直接访问链接内容）
```

### 手动安装

```bash
npm install -g @nocobase/cli
# 如果要尝试 AI Portal 搭建，请安装 alpha 版本
# npm install -g @nocobase/cli@alpha
nb init --ui
```

浏览器会自动打开可视化配置页面，引导你安装 NocoBase Skills、配置数据库并启动应用。详细步骤请参阅[快速开始](../ai/quick-start.md)。

## 用对话代替手动配置

NocoBase CLI 安装完成后，你可以直接在 AI 助手里用自然语言操作 NocoBase。下面是几个真实场景，从建一张表到搭一整套系统，感受一下 AI 搭建的能力。

### 描述业务需求，AI 帮你设计表和关联关系

告诉 AI 你想做什么系统，它会自动帮你设计数据表、字段类型和关联关系——不需要自己画 ER 图。

```
我正在搭建一个 CRM，请帮我设计并搭建数据模型
```

![AI 设计 CRM 数据模型](https://static-docs.nocobase.com/202604162126729.png)

AI 自动生成了客户、联系人、商机、订单等数据表，以及它们之间的关联关系：

![CRM 数据模型结果](https://static-docs.nocobase.com/202604162201867.png)

想了解更多数据建模的用法，请参阅 [数据建模](./data-modeling)。

### 搭好一个节点，AI 帮你存一个可回退的版本

完成一个页面、一组数据表或一条工作流后，让 AI 把当前状态保存为版本——配置改坏了随时能回退到上一个清晰的节点。

```
保存当前搭建成果为版本：完成客户管理页面、筛选区和编辑表单配置
```

![AI 搭建后创建版本](https://static-docs.nocobase.com/20260611115804.png)

AI 不会每改一个字段就存一次，只在完成并验证一个清晰节点后保存，这样版本列表更容易读，恢复时也更容易判断该回到哪里。

想了解更多版本控制的用法，请参阅 [版本控制](./version-control)。

### 一句话编排自动化工作流

描述业务流程的触发条件和处理逻辑，AI 会自动创建触发器和节点链。

```
帮我编排一个订单创建之后自动扣减商品库存的工作流
```

![订单扣减库存工作流](https://static-docs.nocobase.com/20260419234303.png)

想了解更多工作流的用法，请参阅 [工作流管理](./workflow)。

### 用业务语言描述页面，AI 帮你搭好

不用学配置规则，直接说你想要什么样的页面——搜索框、表格、筛选条件，说出来就有了。如果是通过无代码模式搭建，参考如下：

```
帮我创建一个客户管理页面，包含姓名搜索框和客户表格，表格显示名称、电话、邮箱、创建时间
```

![客户管理页面](https://static-docs.nocobase.com/20260420100608.png)

如果是通过 AI Portal 模式搭建，则最好显式告诉 AI Agent 你需要它在哪个 portal 里搭建：

```
帮我在 main portal 里创建一个客户管理页面，包含搜索框和客户表格，表格显示名称、电话、行业
```

![portal 页面](https://static-docs.nocobase.com/20260803204422.png)

想了解更多界面配置的用法，请参阅 [界面配置](./ui-builder) 或 [AI Portal 搭建](./ai-portal/index.md)。


## 安全与审计

在让 AI Agent 操作 NocoBase 之前，建议先了解鉴权方式、权限控制和操作审计——确保 AI 只做该做的事，每一步都有记录。请参阅 [安全与审计](./security)。

## NocoBase Skills

[NocoBase Skills](https://github.com/nocobase/skills) 是可安装到 AI Agent 中的领域知识包，让 AI 理解 NocoBase 的配置体系。NocoBase 提供了多个 Skills，覆盖搭建全流程：

- [环境管理](./env-bootstrap) — 环境检查、安装部署、升级和故障诊断
- [数据建模](./data-modeling) — 创建和管理数据表、字段、关联关系
- [界面配置](./ui-builder) — 创建和编辑页面、区块、弹窗、交互联动
- [工作流管理](./workflow) — 创建、编辑、启用和诊断工作流
- [权限配置](./acl) — 管理角色、权限策略、用户绑定和风险评估
- [解决方案](./dsl-reconciler) — 从 YAML 批量搭建整套业务系统
- [插件管理](./plugin-manage) — 查看、启用和停用插件
- [发布管理](./publish) — 跨环境发布、备份恢复和迁移
- [版本控制](./version-control) — 在阶段性成果完成后保存可恢复版本
- [AI Portal 搭建](https://github.com/nocobase/skills/blob/main/skills/nocobase-ai-builder/SKILL.md) - 让 AI Agent 在 AI Portal 里写代码搭建系统界面

:::tip 提示

NocoBase CLI 在初始化过程中（`nb init`）会自动安装 Skills，不需要手动安装。

:::

## 相关链接

- [AI Portal](./ai-portal/index.md) — 让 AI Agent 直接写前端代码的另一种搭建方式
- [NocoBase CLI](../ai/quick-start.md) — 安装和管理 NocoBase 的命令行工具
- [NocoBase CLI 参考](../api/cli/index.md) — 所有命令的完整参数说明
- [AI 开发插件](../ai-dev/index.md) — 用 AI 辅助开发 NocoBase 插件
- [安全与审计](./security) — 鉴权方式、权限控制和操作审计
- [AI 员工](../ai-employees/index.md) — NocoBase 的智能体能力，支持在业务界面中协作和执行操作
