---
title: "安全与审计：让 AI 操作有迹可循"
description: "了解 AI Agent 搭建 NocoBase 的鉴权方式、权限控制策略、推荐使用方法，以及如何追溯每一次操作记录。"
keywords: "AI 搭建,安全,权限,鉴权,Token,OAuth,操作记录,审计"
---

# 安全与审计

:::tip 前置条件

阅读本页前，请确保你已按照 [AI 搭建快速开始](./index.md) 安装了 NocoBase CLI 并完成了初始化。

:::

当你用 AI Agent 操作 NocoBase 时，需要考虑身份认证、操作权限和审计追溯。这篇文档帮你了解这些机制，确保 AI 只做该做的事，每一步都有记录。

## 鉴权方式

<!-- TODO: 介绍 AI Agent 连接 NocoBase 的两种鉴权方式 -->

### Token 鉴权

<!-- TODO: 通过 API Keys 插件创建 Token，适合自动化场景。说明如何创建、配置和使用 -->

### OAuth 授权

<!-- TODO: 通过 OAuth 授权登录，适合需要用户身份的场景。说明 NocoBase CLI 的 `nb env auth` 流程 -->

### 推荐使用方式

<!-- TODO: 什么场景用 Token、什么场景用 OAuth，给出明确建议 -->

## 权限控制

<!-- TODO: 介绍 AI Agent 操作时的权限边界 -->

### 角色与权限策略

<!-- TODO: AI Agent 的操作权限由绑定的角色决定。说明如何为 AI Agent 配置专属角色，限制可操作的数据表和页面 -->

### 最小权限原则

<!-- TODO: 建议为 AI Agent 创建专用角色，只开放必要的权限。给出配置示例 -->

## 操作记录与审计

<!-- TODO: 介绍如何追溯 AI Agent 的每一次操作 -->

### 查看操作日志

<!-- TODO: 通过 NocoBase 的审计日志功能查看 AI Agent 的操作记录，包括谁、什么时候、做了什么 -->

### 回滚与恢复

<!-- TODO: 如果 AI 的操作出了问题，如何回滚。比如通过备份恢复、手动撤销配置等 -->

## 安全建议

<!-- TODO: 3-5 条实用的安全建议，比如：
- 不要给 AI Agent 绑定 root/admin 角色
- 定期轮换 API Token
- 在测试环境验证后再在生产环境执行
- 启用操作日志插件
- 敏感操作（删除数据表、修改权限）建议人工确认后再执行
-->

## 相关链接

- [AI 搭建快速开始](./index.md) — 安装和环境准备
- [环境管理](./env-bootstrap) — 环境检查、添加环境和故障诊断
- [NocoBase CLI](../get-started/nocobase-cli) — 安装和管理 NocoBase 的命令行工具
- [NocoBase MCP](../ai/mcp/index.md) — 通过 MCP 协议连接 AI Agent
