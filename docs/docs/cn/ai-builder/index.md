---
title: "AI 搭建快速开始"
description: "AI 搭建是 NocoBase 的 AI 辅助搭建能力，通过自然语言完成数据建模、界面配置、工作流编排等操作，提供更现代化、更高效的搭建体验。"
keywords: "AI 搭建,AI Builder,NocoBase AI,Agent Skills,自然语言搭建,低代码 AI,快速开始"
---

# AI 搭建快速开始

AI 搭建是 NocoBase 提供的 AI 辅助搭建能力——你可以用自然语言描述需求，AI 会自动完成数据建模、页面配置、权限设置等操作。提供更加现代化、更加高效的搭建体验。

## 快速开始

如果你已经安装过 [NocoBase CLI](../ai/quick-start.md)，可以跳过这一步。

### 一键 AI 安装

将下方提示词复制给你的 AI 助手（Claude Code、Codex、Cursor、Trae 等），即可自动完成安装和配置：

```
帮我安装 NocoBase CLI 并完成初始化：https://docs.nocobase.com/cn/ai/ai-quick-start.md （请直接访问链接内容）
```

### 手动安装

```bash
npm install -g @nocobase/cli@beta
mkdir my-nocobase && cd my-nocobase
nb init --ui
```

浏览器会自动打开可视化配置页面，引导你安装 NocoBase Skills、配置数据库并启动应用。详细步骤请参阅[快速开始](../ai/quick-start.md)。

## 从一句话到一整套系统

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

### 用业务语言描述页面，AI 帮你搭好

不用学配置规则，直接说你想要什么样的页面——搜索框、表格、筛选条件，说出来就有了。

```
帮我创建一个客户管理页面，包含姓名搜索框和客户表格，表格显示名称、电话、邮箱、创建时间
```

![客户管理页面](https://static-docs.nocobase.com/20260420100608.png)

想了解更多界面配置的用法，请参阅 [界面配置](./ui-builder)。

### 一句话编排自动化工作流

描述业务流程的触发条件和处理逻辑，AI 会自动创建触发器和节点链。

```
帮我编排一个订单创建之后自动扣减商品库存的工作流
```

![订单扣减库存工作流](https://static-docs.nocobase.com/20260419234303.png)

想了解更多工作流的用法，请参阅 [工作流管理](./workflow)。

### 数据表、页面、仪表盘，一步到位

:::warning 注意

解决方案功能目前还在测试中，稳定性有限，仅供尝鲜体验。

:::

一句话描述你的业务场景，AI 会帮你把数据表、管理页面、仪表盘和图表全部搭好。

```
帮我用 nocobase-dsl-reconciler skill 搭建一个工单管理系统，包含仪表盘、工单列表、用户管理、SLA 配置
```

AI 先输出设计方案，确认后一次性搭建完成：

![工单系统设计方案](https://static-docs.nocobase.com/20260420100420.png)

![工单系统搭建效果](https://static-docs.nocobase.com/20260420100450.png)

想了解更多整套系统搭建的用法，请参阅 [解决方案](./dsl-reconciler)。

## 安全与审计

在让 AI Agent 操作 NocoBase 之前，建议先了解鉴权方式、权限控制和操作审计——确保 AI 只做该做的事，每一步都有记录。请参阅 [安全与审计](./security)。

## NocoBase Skills

[NocoBase Skills](https://github.com/nocobase/skills) 是可安装到 AI Agent 中的领域知识包，让 AI 理解 NocoBase 的配置体系。NocoBase 提供 8 个 Skills，覆盖搭建全流程：

- [环境管理](./env-bootstrap) — 环境检查、安装部署、升级和故障诊断
- [数据建模](./data-modeling) — 创建和管理数据表、字段、关联关系
- [界面配置](./ui-builder) — 创建和编辑页面、区块、弹窗、交互联动
- [工作流管理](./workflow) — 创建、编辑、启用和诊断工作流
- [权限配置](./acl) — 管理角色、权限策略、用户绑定和风险评估
- [解决方案](./dsl-reconciler) — 从 YAML 批量搭建整套业务系统
- [插件管理](./plugin-manage) — 查看、启用和停用插件
- [发布管理](./publish) — 跨环境发布、备份恢复和迁移

:::tip 提示

NocoBase CLI 在初始化过程中（`nb init`）会自动安装 Skills，不需要手动安装。

:::

## 相关链接

- [NocoBase CLI](../ai/quick-start.md) — 安装和管理 NocoBase 的命令行工具
- [NocoBase CLI 参考](../api/cli/cli) — 所有命令的完整参数说明
- [AI 开发插件](../ai-dev/index.md) — 用 AI 辅助开发 NocoBase 插件
- [安全与审计](./security) — 鉴权方式、权限控制和操作审计
- [AI 员工](../ai-employees/index.md) — NocoBase 的智能体能力，支持在业务界面中协作和执行操作
