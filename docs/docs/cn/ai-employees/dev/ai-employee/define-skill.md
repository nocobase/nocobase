---
title: "定义 Skill"
description: "介绍 NocoBase AI 员工 SKILLS.md 的 frontmatter、提示词正文、Tool 绑定和目录自动发现。"
keywords: "NocoBase,AI 员工 Skill,SKILLS.md,Skill Tool 绑定,business-analysis-report"
---

# 定义 Skill

Skill 不执行代码。它是一份提供给模型的操作指南，用来规定处理流程、可用工具、检查步骤和输出要求。

## Skill 目录

每个 Skill 使用一个独立目录：

```text
src/ai/skills/business-analysis-report/
├── SKILLS.md
└── tools/
    └── businessReportGenerator.ts
```

其中：

- `SKILLS.md` 定义元数据和提示词正文
- `tools/` 保存只跟这个 Skill 配合使用的 Tool
- `tools/` 中发现的 Tool 会自动加入这个 Skill 的工具列表

## `SKILLS.md` 的 frontmatter

一个最小 Skill 如下：

```md
---
scope: SPECIFIED
name: welcome-developer
description: Greet a developer by name and explain the next step for starting NocoBase plugin development.
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
---

You help welcome developers who are starting NocoBase plugin development.

When the user asks you to greet or welcome a developer:

1. Extract the developer name from the request.
2. Call `greetDeveloper` exactly once.
3. Return the greeting from the tool result.
4. Ask which plugin capability the developer wants to build next.

Do not claim that the greeting was generated until the tool returns `status: "success"`.
```

frontmatter 中常用的字段如下：

| 字段 | 作用 |
| --- | --- |
| `scope` | Skill 的可用范围，省略时为 `SPECIFIED` |
| `name` | Skill 的唯一名称 |
| `description` | 帮助模型判断何时加载这个 Skill |
| `introduction.title` | 管理界面展示的标题 |
| `introduction.about` | 管理界面展示的说明 |
| `tools` | 需要绑定的额外 Tool 名称列表 |

Skill 正文会原样保存，并在 Skill 被加载后加入模型上下文。正文应该关注工作流和约束，不要复制 Tool 的实现细节。

## 给 Skill 绑定 Tool

有两种方式。

第一种是在 frontmatter 中显式声明：

```yaml
tools:
  - getSkill
  - businessReportGenerator
```

第二种是把 Tool 放进当前 Skill 的 `tools/` 目录：

```text
src/ai/skills/welcome-developer/
├── SKILLS.md
└── tools/
    └── greetDeveloper.ts
```

加载器会自动发现 `greetDeveloper`，并把它合并到 Skill 的工具列表。专属于某个 Skill 的 Tool 默认推荐放在 Skill 目录下，这样文件位置就能表达绑定关系。

## 怎样写好 Skill

一份可用的 Skill 通常包含这些内容：

1. 角色和任务边界
2. 必须遵循的处理顺序
3. 每一步应该调用哪个 Tool
4. 什么情况下需要向用户确认
5. Tool 失败后的处理方式
6. 最终输出的结构和验证条件

如果 Tool 会修改数据，Skill 需要明确要求模型等待 Tool 返回成功结果，不能在调用前声称操作已经完成。

## 内置 Skill 示例：`business-analysis-report`

`packages/plugins/@nocobase/plugin-ai/src/ai/skills/business-analysis-report/SKILLS.md` 把业务分析拆成了清楚的工作流：

```yaml
---
scope: GENERAL
name: business-analysis-report
description: Analyze business data with the data-query workflow and generate stakeholder-facing reports with markdown and ECharts.
introduction:
  title: '{{t("ai.skills.businessAnalysisReport.title", { ns: "@nocobase/plugin-ai" })}}'
  about: '{{t("ai.skills.businessAnalysisReport.about", { ns: "@nocobase/plugin-ai" })}}'
tools:
  - getSkill
  - businessReportGenerator
---
```

正文没有只写“生成一份业务报告”，而是继续规定：

- 先理解决策目标、受众、时间范围和指标
- 涉及业务数据时，第一次 ToolCall 必须加载 `data-query` Skill
- 不允许猜测数据表、关联路径和查询结果
- 数据准备好后才调用 `businessReportGenerator`
- 图表和 Markdown 报告在同一次 ToolCall 中生成
- 根据 Tool 返回的 `status`、`chartCount`、`errors` 和 `warnings` 判断是否成功
- 图表失败时只重试一次，之后回退为纯 Markdown 报告

这类规则就是 Skill 的主要价值——它把“模型可以做什么”收敛成一个可重复、可检查的过程。


## 相关链接

- [AI 员工插件开发](./index.md) — 了解 Skill 在 AI 员工扩展中的位置
- [定义服务端 Tool](./define-tool.md) — 定义 Skill 可以调用的 Tool
- [定义内置 AI 员工](./define-ai-employee.md) — 把 Skill 绑定到固定员工
- [完整示例：创建内置 AI 员工](./complete-example.md) — 查看 Skill 和 Tool 的完整绑定示例
