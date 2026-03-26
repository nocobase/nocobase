# NocoBase 2.0 入门教程

本教程将带你从零开始，用 NocoBase 2.0 搭建一个**极简的 IT 工单系统（HelpDesk）**。整个系统只需要 **2 张数据表**，不写一行代码，即可实现工单提交、分类管理、变更追踪、权限控制和数据仪表盘。

## 教程定位

- **目标读者**：业务人员、技术人员或任何对 NocoBase 感兴趣的人（建议具备一定计算机背景知识）
- **案例项目**：极简 IT 工单系统（HelpDesk），仅 2 张表
- **预计耗时**：2-3 小时（非技术人员），1-1.5 小时（技术人员）
- **前置要求**：Docker 环境或[在线 Demo](https://demo-cn.nocobase.com/new)（有效期 24 小时，无需安装）
- **版本**：NocoBase 2.0

## 你将学到什么

通过 7 个章节的实战，你将掌握 NocoBase 的核心概念和搭建流程：

| # | 章节 | 要点 |
|---|------|------|
| 1 | [认识 NocoBase — 5 分钟跑起来](./01-getting-started/) | Docker 安装、配置模式 vs 使用模式 |
| 2 | [数据建模 — 给工单系统搭骨架](./02-data-modeling/) | Collection/Field、关联关系 |
| 3 | [搭建页面 — 让数据看得见](./03-building-pages/) | Block、表格区块、筛选排序 |
| 4 | [表单与详情 — 让数据填得进](./04-forms-and-details/) | 表单区块、字段联动、记录历史 |
| 5 | [用户与权限 — 谁能看什么](./05-roles-and-permissions/) | 角色、菜单权限、数据权限 |
| 6 | [工作流 — 让系统自己动起来](./06-workflows/) | 自动通知、状态变更触发 |
| 7 | [仪表盘 — 一眼看全局](./07-dashboard/) | 饼图/折线图/柱状图、Markdown 区块 |

## 数据模型预览

本教程围绕一个极简的数据模型展开——只有 **2 张表**，但足以覆盖数据建模、页面搭建、表单设计、权限控制、工作流和仪表盘等核心功能。

| 数据表 | 主要字段 |
|--------|---------|
| 工单（tickets） | 标题、描述、状态、优先级 |
| 工单分类（categories） | 分类名称、颜色 |

## 常见问题

### NocoBase 适合什么场景？

适合企业内部工具、数据管理系统、审批流程、CRM、ERP 等需要灵活定制的场景，支持私有化部署。

### 完成本教程需要什么基础？

不需要编程，但建议具备一定的计算机基础知识。教程会逐步讲解数据表、字段、关联关系等概念，有数据库或 Excel 使用经验会更容易上手。

### 教程中的系统可以扩展吗？

可以。本教程只用了 2 张表，但 NocoBase 支持复杂的多表关联、外部 API 集成、自定义插件等。

### 需要什么部署环境？

推荐 Docker（Docker Desktop 或 Linux 服务器），最低 2 核 4GB 内存。也支持 Git 源码运行。如果只是学习体验，可以直接申请[在线 Demo](https://demo-cn.nocobase.com/new)，无需安装，有效期 24 小时。

### 免费版有什么限制？

核心功能完全免费开源。商业版提供额外高级插件和技术支持，详见[商业版定价](https://www.nocobase.com/cn/commercial)。

## 相关技术栈

NocoBase 2.0 基于以下技术构建：

- **前端框架**: React + [Ant Design](https://ant.design/) 5.0
- **后端**: Node.js + Koa
- **数据库**: PostgreSQL（也支持 [MySQL](/get-started/installation/docker)、MariaDB）
- **部署方式**: [Docker](/get-started/installation/docker)、Kubernetes

## 类似平台参考

如果你正在评估无代码/低代码平台，以下是一些对比参考：

| 平台 | 特点 | 与 NocoBase 的差异 |
|------|------|-------------------|
| [Appsmith](https://www.appsmith.com/) | 开源无代码，前端定制能力强 | NocoBase 更侧重数据模型驱动 |
| [Retool](https://retool.com/) | 内部工具平台 | NocoBase 完全开源，无使用限制 |
| [Airtable](https://airtable.com/) | 在线协作数据库 | NocoBase 支持私有化部署，数据自主 |
| [Budibase](https://budibase.com/) | 开源低代码，支持自托管 | NocoBase 插件化架构，扩展性更强 |

## 相关文档

### 入门指南
- [NocoBase 是如何工作的](/get-started/how-nocobase-works) — 核心概念介绍
- [快速开始](/get-started/quickstart) — 安装与初始配置
- [系统要求](/get-started/system-requirements) — 环境配置要求

### 更多教程
- [NocoBase 1.x 教程](/tutorials/v1/) — 以任务管理系统为案例的进阶教程

### 方案参考
- [工单系统方案](/solution/ticket-system/) — AI 驱动的智能工单管理方案
- [CRM 系统方案](/solution/crm/) — 客户关系管理基座
- [AI 员工](/ai-employees/quick-start) — 为系统接入 AI 能力

准备好了吗？从 [第 1 章：认识 NocoBase](./01-getting-started/) 开始吧！
