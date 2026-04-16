---
title: "AI 搭建概述"
description: "AI 搭建是 NocoBase 的 AI 辅助搭建能力，通过 Agent Skills 让 AI 工具理解 NocoBase，用自然语言完成数据建模、界面配置、工作流编排等操作。"
keywords: "AI 搭建,AI Builder,NocoBase AI,Agent Skills,自然语言搭建,低代码 AI"
---

# AI 搭建

AI 搭建是 NocoBase 提供的 AI 辅助搭建能力——你可以用自然语言描述需求，AI 会自动完成数据建模、页面配置、权限设置等操作。

比如你跟 AI 说「帮我建一个客户管理页面，包含姓名、电话、跟进状态」，它就能帮你把数据表、列表区块、表单一起搭好。不需要手动一个个拖拽配置。

:::tip 提示

AI 搭建生成的配置和手动搭建的一致，你随时可以在可视化界面里调整和修改。

:::

<!-- 需要一张 AI 搭建对话界面的截图，展示用户输入需求后生成页面的效果 -->

## Agent Skills

Agent Skills 是可安装到 AI Agent 中的领域知识包。安装后，AI 工具（比如 Claude Code、Codex、Cursor、Windsurf 等）就能理解 NocoBase 的配置体系，帮你完成搭建任务。

### 一键安装所有 skills

```sh
npx skills add nocobase/skills -y
```

### 按需安装单个 skill

如果你只需要某个功能域，也可以单独安装：

| Skill | 安装命令 | 说明 |
|-------|---------|------|
| [多环境管理](./env-bootstrap) | `npx skills add nocobase/skills --skill nocobase-env-bootstrap -y` | 环境检查、安装部署、升级和故障诊断 |
| [数据建模](./data-modeling) | `npx skills add nocobase/skills --skill nocobase-data-modeling -y` | 创建和管理数据表、字段、关联关系 |
| [界面配置](./ui-builder) | `npx skills add nocobase/skills --skill nocobase-ui-builder -y` | 创建和编辑页面、区块、弹窗、交互联动 |
| [工作流配置](./workflow) | `npx skills add nocobase/skills --skill nocobase-workflow-manage -y` | 创建、编辑、启用和诊断工作流 |
| [权限配置](./acl) | `npx skills add nocobase/skills --skill nocobase-acl-manage -y` | 管理角色、权限策略、用户绑定和风险评估 |
| [解决方案](./dsl-reconciler) | `npx skills add nocobase/skills --skill nocobase-dsl-reconciler -y` | 从 YAML 批量搭建整套业务系统 |
| [插件管理](./plugin-manage) | `npx skills add nocobase/skills --skill nocobase-plugin-manage -y` | 查看、安装、启用和停用插件 |
| [发布管理](./publish) | `npx skills add nocobase/skills --skill nocobase-publish-manage -y` | 跨环境发布、备份恢复和迁移 |

## 相关链接

- [AI 员工](/ai-employees) — NocoBase 的智能体能力，支持在业务界面中协作和执行操作
