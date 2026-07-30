---
title: "Интернационализация плагина ИИ-сотрудника"
description: "Файлы локализации, шаблоны переводов и текущие ограничения для Tool, Skill и профилей встроенных ИИ-сотрудников NocoBase."
keywords: "NocoBase,интернационализация плагина ИИ-сотрудника,Tool introduction,Skill introduction,locale"
---

# Интернационализация плагина ИИ-сотрудника

Тексты интерфейса управления в плагине ИИ-сотрудника должны отображаться на текущем языке интерфейса. Для Tool и Skill можно использовать locale-файлы плагина через `introduction`, а данные профиля сотрудника обрабатываются иначе.

## Что нужно интернационализировать

Обычно перевод нужен для текстов, которые видят администраторы и пользователи:

- `introduction.title` и `introduction.about` у Tool
- `introduction.title` и `introduction.about` у Skill
- Тексты фронтенд-карточек, модальных окон и кнопок действий

`definition.name`, `definition.description`, описания schema, текст Skill и системный промпт ИИ-сотрудника предназначены главным образом для модели. Не меняйте стабильное имя Tool или содержимое рабочего процесса ради перевода интерфейса.

## Перевод текстов Tool и Skill в интерфейсе управления

В `introduction` Tool можно использовать шаблон перевода `{{t(...)}}`:

```ts
introduction: {
  title: '{{t("ai.tools.greetDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}',
  about: '{{t("ai.tools.greetDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}',
},
```

Во frontmatter файла `SKILLS.md` используется тот же синтаксис:

```yaml
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
```

Значение `ns` должно совпадать с фактическим пространством имён интернационализации плагина.

## Добавление языковых файлов

Языковые файлы плагина находятся в каталоге `src/locale/`. Для разных языков используются одинаковые ключи, меняются только соответствующие тексты.

### Добавление английских текстов

Добавьте в `src/locale/en-US.json`:

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

### Добавление китайских текстов

Добавьте в `src/locale/zh-CN.json`:

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

## Текущие ограничения профиля ИИ-сотрудника

Поля профиля ИИ-сотрудника `nickname`, `position`, `bio` и `greeting` не используют описанный выше механизм шаблонов `{{t(...)}}`. Сейчас встроенные сотрудники переводят исходные строки во время выполнения в пространстве имён `@nocobase/plugin-ai`, поэтому стороннему плагину не следует рассчитывать на автоматическое применение собственного пространства имён.

Если дополнительная логика локализации не подключена, выберите для профиля сотрудника один язык по умолчанию, а тексты Tool, Skill и фронтенд-взаимодействия храните в locale-файлах самого плагина.


## Связанные ссылки

- [Разработка плагинов для ИИ-сотрудников](./index.md) — вернуться к обзору руководства разработчика
- [Определение серверного Tool](./define-tool.md) — использование шаблонов переводов в `introduction` Tool
- [Определение Skill](./define-skill.md) — использование шаблонов переводов во frontmatter Skill
- [Определение встроенного ИИ-сотрудника](./define-ai-employee.md) — поля профиля сотрудника
- [Добавление фронтенд-взаимодействия для Tool](./frontend-tool-ui.md) — перевод интерфейса фронтенд-карточек и модальных окон
