---
pkg: "@nocobase/plugin-ai"
title: "与 AI 员工协作"
description: "与 AI 员工协作：右下角主入口、区块 Action 入口、对话操作、会话内切换员工与模型（AI Employee Switcher、Model Switcher）。"
keywords: "AI 员工协作,对话面板,员工切换,模型切换,NocoBase"
---

# 与 AI 员工协作

创建并启用 AI 员工后，可在页面中与其进行协作。

## 入口

常用入口有两类：

1. **右下角主入口**：在业务页面右下角唤起 AI 对话面板，适合通用问答与跨区块协作。
2. **区块 Action 入口**：在支持 `Actions` 的区块中，通过 `Actions -> AI employees` 进入，适合针对当前区块执行任务（例如 JSBlock 等场景）。

### 右下角主入口

![20260331165456](https://static-docs.nocobase.com/20260331165456.png)

### 区块 Action 入口

![20251022135306](https://static-docs.nocobase.com/20251022135306.png)

## 对话基础操作

对话框支持发送消息、上传附件、查看历史会话、新建会话和编辑系统提示词等常见操作。

## 会话内切换

大部分情况下直接和  Atlas 对话即可，他会协调合适的 AI 员工协助处理问题。

如果要使用指定 AI 员工，可以点击发送框的 AI 员工下拉列表进行选择

![20260331174320](https://static-docs.nocobase.com/20260331174320.png)

模型会按员工维度保存偏好，下一次进入时优先恢复。

![chat-footer-employee-switcher-and-model-switcher.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/chat-footer-employee-switcher-and-model-switcher.png)
