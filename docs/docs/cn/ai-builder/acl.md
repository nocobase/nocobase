---
title: "权限配置"
description: "权限配置 Skill 用于通过自然语言管理 NocoBase 的角色、权限策略、用户绑定和 ACL 风险评估。"
keywords: "AI 搭建,权限配置,ACL,角色,权限,用户绑定,风险评估"
---

# 权限配置

:::tip 前置条件

阅读本页前，请确保你已按照 [AI 搭建快速开始](./index.md) 安装了 NocoBase CLI 并完成了初始化。

:::

## 简介

权限配置 Skill 用于通过自然语言管理 NocoBase 的角色、权限策略、用户绑定和 ACL 风险评估——你描述业务目标，它来选择命令和参数。


## 能力范围

- 创建新角色
- 切换全局角色模式（独立模式 / 联合模式）
- 批量给数据表配置动作权限和数据范围
- 解绑用户与角色的关系
- 输出角色级、用户级、系统级风险评估报告

## 提示词示例

### 场景 A：批量绑定用户
:::tip 前置条件
当前环境存在一个 Member 角色和多个用户
:::

```
帮我给这几个新用户绑定 Member 角色 James 、Emma 、Michael 
```

![批量绑定用户](https://static-docs.nocobase.com/20260422202343.png)

### 场景 B：批量配置页面权限
:::tip 前置条件
当前环境存在一个 Member 角色和多个页面
:::
```
帮我给 Member 角色配置这几个页面的权限 Product、Order、Stock
```

![批量配置页面权限](https://static-docs.nocobase.com/20260422202949.png)

### 场景 C：批量配置多数据表权限
:::tip 前置条件
当前环境存在一个 Member 角色和多个数据表
:::

```
给 Member 角色添加这几个数据表的独立只读权限，order、product、stock
```

![批量配置数据表独立权限](https://static-docs.nocobase.com/20260422205341.png)

![批量配置数据表独立权限2](https://static-docs.nocobase.com/20260422205430.png)

### 场景 D：多角色多数据表权限配置
:::tip 前置条件
当前环境存在多个角色和多个数据表
:::

```
给 Member、Sales 角色添加这几个数据表独立读写权限，order、product、stock
```

![多角色多数据表配置](https://static-docs.nocobase.com/20260422213524.png)

### 场景 E：风险评估

```
评估一下 Member  角色的权限风险
```

会输出风险评分、影响范围说明和改进建议。

## 常见问题

**配置了权限但不生效怎么办？**

先确认全局角色模式是否正确——如果用户同时拥有多个角色，联合模式和独立模式的行为差异很大，可以查看当前模式确认问题。

## 相关链接

- [AI 搭建概述](./index.md) — 所有 AI 搭建 Skill 的总览和安装方式
- [NocoBase CLI](../ai/quick-start.md) — 安装和管理 NocoBase 的命令行工具
