---
title: "Internationalization for AI Employee Plugins"
description: "Explains internationalization files, translation templates, and current limitations for NocoBase AI employee Tools, Skills, and built-in employee profiles."
keywords: "NocoBase,AI employee plugin internationalization,Tool introduction,Skill introduction,locale"
---

# Internationalization for AI Employee Plugins

Management-interface text in an AI employee plugin should follow the current interface language. Tools and Skills can use the plugin's own locale files through `introduction`, while AI employee profile fields are handled differently.

## What needs internationalization

Usually, you need to internationalize text displayed to administrators or users:

- `introduction.title` and `introduction.about` for Tools
- `introduction.title` and `introduction.about` for Skills
- Text in frontend cards, modals, and action buttons

`definition.name`, `definition.description`, schema descriptions, Skill content, and AI employee system prompts are primarily intended for the model. Do not change a Tool's stable name or workflow content for interface translation.

## Translate Tool and Skill management-interface text

A Tool's `introduction` can use the `{{t(...)}}` translation template:

```ts
introduction: {
  title: '{{t("ai.tools.greetDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}',
  about: '{{t("ai.tools.greetDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}',
},
```

Use the same format in the frontmatter of a Skill's `SKILLS.md`:

```yaml
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
```

The `ns` value must match the internationalization namespace actually used by the plugin.

## Add locale files

Plugin locale files are stored in `src/locale/`. Use the same keys for each language and change only the corresponding text.

### Add English text

Add the following to `src/locale/en-US.json`:

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

### Add Chinese text

Add the following to `src/locale/zh-CN.json`:

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

## Current limitations for AI employee profiles

The `nickname`, `position`, `bio`, and `greeting` fields in an AI employee profile do not use the `{{t(...)}}` template mechanism above. At runtime, built-in employees currently translate these raw strings in the `@nocobase/plugin-ai` namespace, so third-party plugins should not assume that a custom namespace will take effect automatically.

Unless you add separate localization logic, choose one default language for the employee profile and put the interface text for Tools, Skills, and frontend interactions in the plugin's own locale files.

## Related links

- [AI employee plugin development](./index.md) — Return to the development guide overview
- [Define a server-side Tool](./define-tool.md) — Use translation templates in a Tool introduction
- [Define a Skill](./define-skill.md) — Use translation templates in Skill frontmatter
- [Define a built-in AI employee](./define-ai-employee.md) — Learn about employee profile fields
- [Add frontend interaction to a Tool](./frontend-tool-ui.md) — Add interface translations to frontend cards and modals
