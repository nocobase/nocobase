---
title: "Определение встроенного ИИ-сотрудника"
description: "Создание встроенного ИИ-сотрудника в плагине NocoBase с помощью defineAIEmployee, prompt.md и каталогов skills и tools."
keywords: "NocoBase,встроенный ИИ-сотрудник,defineAIEmployee,prompt.md,AIEmployeeOptions,Nathan"
---

# Определение встроенного ИИ-сотрудника

Встроенный ИИ-сотрудник регистрируется вместе с плагином. При первой загрузке плагина NocoBase создаёт соответствующую запись сотрудника и помечает её как встроенную. При последующих загрузках данные профиля, промпт, навыки и инструменты по умолчанию обновляются на основе кода.

## Две формы: один файл или каталог

Если профиль простой и не требует отдельного промпта или собственных ресурсов, можно использовать один файл:

```text
src/ai/ai-employees/lina.ts
```

Если нужны `prompt.md`, собственный Skill или собственный Tool, используйте каталог:

```text
src/ai/ai-employees/nathan/
├── index.ts
├── prompt.md
├── skills/
└── tools/
```

Форма с каталогом лучше подходит для долгосрочной поддержки.

## Использование `defineAIEmployee()`

В `index.ts` используется функция `defineAIEmployee()` из `@nocobase/ai`:

```ts
import { defineAIEmployee } from '@nocobase/ai';

export default defineAIEmployee({
  username: 'developer-helper-dev-assistant',
  category: 'developer',
  description: 'AI employee for helping developers start NocoBase plugin development.',
  avatar: 'nocobase-002-male',
  nickname: 'Dev Helper',
  position: 'Plugin development guide',
  bio: 'Helps developers understand plugin structure and complete small development tasks.',
  greeting: 'Hello, I can help you start a NocoBase plugin development task. What would you like to build?',
});
```

Основные поля:

| Поле | Назначение |
| --- | --- |
| `username` | Уникальный идентификатор ИИ-сотрудника; обязателен и должен оставаться стабильным |
| `category` | Категория сотрудника, например `developer` или `business` |
| `description` | Внутреннее описание и информация для поиска |
| `avatar` | Идентификатор аватара |
| `nickname` | Имя, отображаемое пользователю |
| `position` | Должность |
| `bio` | Краткое описание |
| `greeting` | Приветствие для нового диалога |
| `systemPrompt` | Системный промпт по умолчанию |
| `skills` | Имена явно привязанных Skill |
| `tools` | Конфигурация явно привязанных Tool |
| `chatSettings` | Настройки чата: включение Skill и Tool, режим системного промпта и т. д. |
| `sort` | Порядок встроенных сотрудников |

Сейчас `tools` имеет тип массива объектов:

```ts
tools: [
  { name: 'greetDeveloper' },
  { name: 'customDataExporter', autoCall: true }, // customDataExporter 的 scope 必须是 CUSTOM
]
```

`autoCall` используется только для переопределения разрешения текущего ИИ-сотрудника на вызов Tool с областью `CUSTOM`. Для Tool с областями `GENERAL` и `SPECIFIED` во время выполнения по-прежнему применяется собственное значение `defaultPermission` Tool. Если для `CUSTOM` Tool нет конфигурации на уровне сотрудника, также используется собственное значение `defaultPermission` Tool.

Tool, автоматически обнаруженный в каталоге, нормализуется до формы `{ name: 'toolName' }`.

## Размещение длинного промпта в `prompt.md`

Если ИИ-сотрудник определён каталогом, системный промпт можно вынести в расположенный рядом файл `prompt.md`:

```text
src/ai/ai-employees/dev-helper/prompt.md
```

```md
You are Dev Helper, a NocoBase plugin development guide.

Help the user break a plugin requirement into small, verifiable steps.

When the user asks you to welcome a developer, load the `welcome-developer` skill and follow it.

Never claim that a Tool succeeded before receiving its result.
```

Если существует `prompt.md`, он переопределяет `systemPrompt` из `index.ts`. Длинный промпт в Markdown-файле проще проверять; кроме того, так можно избежать проблем с экранированием в шаблонных строках TypeScript.

## Пример встроенного ИИ-сотрудника: Nathan

Профиль сотрудника в `packages/plugins/@nocobase/plugin-flow-engine/src/ai/ai-employees/nathan/index.ts` очень короткий:

```ts
export default defineAIEmployee({
  username: 'nathan',
  category: 'developer',
  description: 'AI employee for coding',
  avatar: 'nocobase-002-male',
  nickname: 'Nathan',
  position: 'Frontend code engineer',
  greeting: 'Hello, I’m Nathan, your frontend code engineer...',
});
```

Полные возможности Nathan определяются другими ресурсами в том же каталоге:

```text
nathan/
├── index.ts
├── prompt.md
└── skills/
    └── frontend-developer/
        ├── SKILLS.md
        └── tools/
            ├── getContextApis.ts
            ├── getContextEnvs.ts
            ├── getContextVars.ts
            ├── lintAndTestJS.ts
            ├── patchJSCode.ts
            ├── readJSCode.ts
            └── writeJSCode.ts
```

Во время загрузки автоматически создаются три уровня привязок:

1. Файлы в `tools/` регистрируются как Tool
2. Tool автоматически привязываются к Skill `frontend-developer`
3. Skill автоматически привязывается к Nathan

Поэтому в `index.ts` не нужно повторно перечислять весь набор `skills` и `tools`.


## Связанные ссылки

- [Разработка плагинов для ИИ-сотрудников](./index.md) — связи между встроенным ИИ-сотрудником, Tool и Skill
- [Определение Skill](./define-skill.md) — создание собственного Skill сотрудника
- [Полный пример: создание встроенного ИИ-сотрудника](./complete-example.md) — полный каталог сотрудника и процесс регистрации
- [Интернационализация плагина ИИ-сотрудника](./internationalization.md) — различия локализации профиля сотрудника и текстов Tool и Skill
