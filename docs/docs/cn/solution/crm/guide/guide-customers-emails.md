---
title: "客户、联系人与邮件"
description: "CRM 客户 360 视图、AI 健康评分、客户合并、联系人角色管理、邮件收发与 AI 辅助、活动记录。"
keywords: "客户管理,联系人,邮件,健康评分,客户合并,NocoBase CRM"
---

# 客户、联系人与邮件

> 客户、联系人和邮件是紧密关联的三个模块——客户是主体，联系人是沟通对象，邮件是沟通记录。本章统一介绍。

![cn_04-customers-emails](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_04-customers-emails.png)

## 客户管理

从顶部菜单进入 **客户** 页面，包含两个标签页：客户列表 和 客户合并工具。

### 客户列表

列表上方有筛选按钮：

| 筛选条件 | 说明 |
|---------|------|
| **All** | 所有客户 |
| **Active** | 活跃客户 |
| **Potential** | 潜在客户，尚未成交 |
| **Dormant** | 沉睡客户，长时间无互动 |
| **Key Accounts** | 大客户/重点客户 |
| **New This Month** | 本月新增 |


![04-customers-emails-2026-04-07-01-32-03](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-32-03.png)


**关键列**：

- **AI 健康评分**：环形进度条 0–100 分（🟢 70–100 健康 / 🟡 40–69 预警 / 🔴 0–39 危险）
- **最近活动**：相对时间 + 颜色编码，越久没联系颜色越深

### 客户详情

点击客户名称打开详情弹窗，包含 **3 个标签页**：

| 标签页 | 内容 |
|-------|------|
| **详情** | 客户画像、统计卡片、联系人、商机、评论 |
| **邮件** | 与该客户所有联系人的往来邮件，5 个 AI 按钮 |
| **变更历史** | 字段级审计日志 |

**详情标签页**采用左 2/3 + 右 1/3 两栏布局：

- **左栏**：客户头像（按级别染色：Normal=灰、Important=琥珀、VIP=金）、4 列摘要（级别/规模/区域/类型）、统计卡片（累计成交金额 / 活跃商机数 / 本月互动次数，实时 API 查询）、联系人列表、商机列表、评论区
- **右栏**：AI 智能画像（AI 标签、健康评分环形图、流失风险、最佳联系时间、沟通策略）

![04-customers-emails-2026-04-07-01-33-47](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-33-47.png)

### AI 健康评分

健康评分综合以下维度自动计算：互动频率、商机活跃度、订单情况、联系人覆盖。

使用建议：

1. 每天打开客户列表，按健康评分排序
2. 优先关注红色（Critical）客户——可能正在流失
3. 黄色（Warning）客户——安排轻量级跟进
4. 绿色（Healthy）客户——正常节奏维护

### 客户合并

出现重复客户记录时，通过合并工具清理：

1. **发起合并**：在客户列表中勾选多个客户 → 点击「Customer Merge」按钮
2. **进入合并工具**：切换到第二个标签页，查看合并请求列表（Pending / Merged / Cancelled）
3. **执行合并**：选择主记录（Master）→ 逐字段对比差异 → 预览 → 确认。后台工作流自动迁移所有关联数据（商机、联系人、活动、评论、订单、报价、共享）并停用被合并客户

![04-customers-emails-2026-04-07-01-35-37](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-35-37.png)

![04-customers-emails-2026-04-07-01-38-07](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-38-07.png)

:::tip[合并前请仔细核对]
客户合并是不可逆操作。执行前请仔细确认主记录的选择和字段值的取舍。
:::


![04-customers-emails-2026-04-07-01-37-44](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-37-44.gif)

---

## 联系人管理

从顶部菜单进入 **设置 → 联系人** 页面。

### 联系人信息

| 字段 | 说明 |
|------|------|
| Name | 联系人姓名 |
| Company | 所属公司（关联客户记录） |
| Email | 邮箱地址（用于邮件自动关联） |
| Phone | 电话号码 |
| Role | 角色标签 |
| Level | 联系人级别 |
| Primary Contact | 是否为该客户的主要联系人 |

### 角色标签

| 角色 | 含义 |
|------|------|
| Decision Maker | 决策者 |
| Influencer | 影响者 |
| Technical | 技术负责人 |
| Procurement | 采购负责人 |

![04-customers-emails-2026-04-07-01-38-26](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-38-26.png)

### 从联系人发邮件

打开联系人详情页，和其他数据管理类似，包含详情、邮件、字段记录等标签页。

![04-customers-emails-2026-04-07-01-38-52](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-38-52.png)

---

### 邮件与 CRM 关联

邮件自动关联到客户、联系人和商机：

- 客户详情的「邮件」标签页 → 该客户所有联系人的往来邮件
- 联系人详情 → 该联系人的完整邮件历史
- 商机详情 → 相关沟通记录

关联通过视图，基于联系人的邮箱地址自动匹配。

![04-customers-emails-2026-04-07-01-40-26](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-40-26.png)

![04-customers-emails-2026-04-07-01-41-13](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-41-13.png)

### AI 邮件辅助

邮件页面提供 6 个 AI 辅助场景：

| 场景 | 功能 |
|------|------|
| **提案起草** | AI 根据客户和商机上下文生成提案邮件 |
| **跟进邮件** | AI 生成语气恰当的跟进邮件 |
| **邮件分析** | AI 分析邮件情感倾向和关键要点 |
| **邮件摘要** | AI 对邮件线程生成摘要 |
| **客户上下文** | AI 汇总客户背景信息 |
| **高管简报** | AI 从邮件线程提取关键信息生成简报 |

![04-customers-emails-2026-04-07-01-41-46](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-41-46.png)

---

## 活动记录

从顶部菜单进入 **设置 → 活动** 页面。这是所有客户互动的中央日志。

| 活动类型 | 说明 |
|---------|------|
| Meeting | 会议 |
| Call | 电话 |
| Email | 邮件 |
| Visit | 拜访 |
| Note | 备注 |
| Task | 任务 |

![04-customers-emails-2026-04-07-01-42-20](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-42-20.png)

活动记录也会出现在 Overview 仪表盘的日历视图中。

---

## 相关页面

- [CRM 操作指南](./index.md)
- [线索管理](./guide-leads) — 线索转化后自动创建客户和联系人
- [商机管理](./guide-opportunities) — 客户关联的商机
- [AI 员工](./guide-ai)
