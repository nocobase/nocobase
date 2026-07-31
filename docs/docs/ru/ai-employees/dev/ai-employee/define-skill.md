---
title: "Определение Skill"
description: "Frontmatter, текст промпта, привязка Tool и автоматическое обнаружение каталогов для SKILLS.md ИИ-сотрудников NocoBase."
keywords: "NocoBase,Skill ИИ-сотрудника,SKILLS.md,привязка Skill и Tool,business-analysis-report"
---

# Определение Skill

Skill не выполняет код. Это инструкция для модели, которая определяет рабочий процесс, доступные инструменты, этапы проверки и требования к результату.

## Каталог Skill

Для каждого Skill используется отдельный каталог:

```text
src/ai/skills/business-analysis-report/
├── SKILLS.md
└── tools/
    └── businessReportGenerator.ts
```

В этой структуре:

- `SKILLS.md` определяет метаданные и текст промпта
- `tools/` содержит Tool, используемые только вместе с этим Skill
- Tool, найденные в `tools/`, автоматически добавляются в список инструментов Skill

## Frontmatter файла `SKILLS.md`

Минимальный Skill выглядит так:

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

Часто используемые поля frontmatter:

| Поле | Назначение |
| --- | --- |
| `scope` | Область доступности Skill; если поле опущено, используется `SPECIFIED` |
| `name` | Уникальное имя Skill |
| `description` | Помогает модели определить, когда загружать Skill |
| `introduction.title` | Заголовок в интерфейсе управления |
| `introduction.about` | Описание в интерфейсе управления |
| `tools` | Список имён дополнительных Tool, которые нужно привязать |

Текст Skill сохраняется без изменений и после загрузки Skill добавляется в контекст модели. В нём следует описывать рабочий процесс и ограничения, а не дублировать детали реализации Tool.

## Привязка Tool к Skill

Есть два способа.

Первый — явно указать Tool во frontmatter:

```yaml
tools:
  - getSkill
  - businessReportGenerator
```

Второй — поместить Tool в каталог `tools/` текущего Skill:

```text
src/ai/skills/welcome-developer/
├── SKILLS.md
└── tools/
    └── greetDeveloper.ts
```

Загрузчик автоматически обнаружит `greetDeveloper` и добавит его в список инструментов Skill. Tool, предназначенный только для одного Skill, рекомендуется размещать в каталоге этого Skill — тогда само расположение файла выражает связь.

## Как написать хороший Skill

Практичный Skill обычно включает:

1. Роль и границы задачи
2. Обязательный порядок действий
3. Tool, который следует вызывать на каждом этапе
4. Условия, при которых требуется подтверждение пользователя
5. Порядок действий при ошибке Tool
6. Структуру итогового результата и условия проверки

Если Tool изменяет данные, Skill должен явно требовать дождаться успешного результата Tool. Модель не должна утверждать, что операция завершена, до вызова.

## Пример встроенного Skill: `business-analysis-report`

Файл `packages/plugins/@nocobase/plugin-ai/src/ai/skills/business-analysis-report/SKILLS.md` разбивает бизнес-анализ на понятный рабочий процесс:

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

Текст не ограничивается указанием «создать бизнес-отчёт», а задаёт дополнительные правила:

- Сначала определить цель решения, аудиторию, временной диапазон и показатели
- При работе с бизнес-данными первым ToolCall обязательно загрузить Skill `data-query`
- Не угадывать таблицы данных, пути связей и результаты запросов
- Вызывать `businessReportGenerator` только после подготовки данных
- Создавать диаграммы и Markdown-отчёт в одном ToolCall
- Определять успешность по возвращённым Tool значениям `status`, `chartCount`, `errors` и `warnings`
- При ошибке диаграммы повторить попытку только один раз, а затем перейти к отчёту только в Markdown

Именно в этом заключается основная ценность Skill: он превращает общую возможность модели в повторяемый и проверяемый процесс.


## Связанные ссылки

- [Разработка плагинов для ИИ-сотрудников](./index.md) — место Skill среди расширений ИИ-сотрудников
- [Определение серверного Tool](./define-tool.md) — создание Tool, который может вызывать Skill
- [Определение встроенного ИИ-сотрудника](./define-ai-employee.md) — привязка Skill к конкретному сотруднику
- [Полный пример: создание встроенного ИИ-сотрудника](./complete-example.md) — полный пример привязки Skill и Tool
