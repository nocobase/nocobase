---
title: "AI 员工插件国际化"
description: "介绍 NocoBase AI 员工 Tool、Skill 和内置员工资料的国际化文件、翻译模板和当前限制。"
keywords: "NocoBase,AI 员工插件国际化,Tool introduction,Skill introduction,locale"
---

# AI 员工插件国际化

AI 员工插件中的管理界面文案需要跟随当前界面语言显示。Tool 和 Skill 可以通过 `introduction` 使用插件自己的 locale 文件，员工资料则有不同的处理方式。

## 哪些内容需要国际化

通常需要国际化的是展示给管理员或用户的界面文案：

- Tool 的 `introduction.title` 和 `introduction.about`
- Skill 的 `introduction.title` 和 `introduction.about`
- 前端卡片、弹窗和操作按钮中的文字

`definition.name`、`definition.description`、schema 描述、Skill 正文和 AI 员工系统提示词主要面向模型，不要为了界面翻译而改变 Tool 的稳定名称或工作流内容。

## 翻译 Tool 和 Skill 的管理界面文案

Tool 的 `introduction` 可以使用 `{{t(...)}}` 翻译模板：

```ts
introduction: {
  title: '{{t("ai.tools.greetDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}',
  about: '{{t("ai.tools.greetDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}',
},
```

Skill 在 `SKILLS.md` 的 frontmatter 中使用相同写法：

```yaml
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
```

其中，`ns` 必须和插件实际使用的国际化 namespace 一致。

## 添加语言文件

插件的语言文件放在 `src/locale/` 目录中。不同语言使用相同的 key，只修改对应的文案。

### 添加英文文案

在 `src/locale/en-US.json` 中添加：

```json
{
  "ai.tools.greetDeveloper.title": "Developer name check",
  "ai.tools.greetDeveloper.about": "Validate the developer name before writing a welcome message.",
  "ai.tools.developerChoice.title": "Developer choices",
  "ai.tools.developerChoice.about": "Ask the developer to choose the next plugin capability.",
  "ai.skills.welcomeDeveloper.title": "Developer welcome",
  "ai.skills.welcomeDeveloper.about": "Welcome a developer and ask what plugin capability they want to build."
}
```

### 添加中文文案

在 `src/locale/zh-CN.json` 中添加：

```json
{
  "ai.tools.greetDeveloper.title": "开发者姓名确认",
  "ai.tools.greetDeveloper.about": "在生成欢迎语之前确认开发者姓名。",
  "ai.tools.developerChoice.title": "开发方向选择",
  "ai.tools.developerChoice.about": "让开发者选择下一步要实现的插件能力。",
  "ai.skills.welcomeDeveloper.title": "欢迎开发者",
  "ai.skills.welcomeDeveloper.about": "欢迎开发者，并询问接下来要实现的插件能力。"
}
```

## AI 员工资料的当前限制

AI 员工资料中的 `nickname`、`position`、`bio` 和 `greeting` 不使用上面的 `{{t(...)}}` 模板机制。当前内置员工运行时会在 `@nocobase/plugin-ai` namespace 中翻译这些原始字符串，因此第三方插件不要假设自定义 namespace 会自动生效。

没有额外接入本地化逻辑时，建议为员工资料选择一种默认语言，并把 Tool、Skill 和前端交互的界面文案放在插件自己的 locale 文件中。

## 相关链接

- [AI 员工插件开发](./index.md) — 返回开发指南概述
- [定义服务端 Tool](./define-tool.md) — 在 Tool introduction 中使用翻译模板
- [定义 Skill](./define-skill.md) — 在 Skill frontmatter 中使用翻译模板
- [定义内置 AI 员工](./define-ai-employee.md) — 了解员工资料字段
- [为 Tool 添加前端交互](./frontend-tool-ui.md) — 为前端卡片和弹窗添加界面翻译
