---
title: "Полный пример: создание встроенного ИИ-сотрудника"
description: "Полный пример определения Tool, Skill, системного промпта и встроенного ИИ-сотрудника в плагине NocoBase."
keywords: "NocoBase,Dev Helper,пример ИИ-сотрудника,defineTools,defineAIEmployee,SKILLS.md"
---

# Полный пример: создание встроенного ИИ-сотрудника

Ниже приведён полный пример встроенного ИИ-сотрудника, который помогает начать разработку плагинов. В примере сотрудник называется `Dev Helper`; для него настроены Tool, Skill и системный промпт. Когда пользователь говорит «Поприветствуй Alice», сотрудник загружает Skill `welcome-developer`, вызывает Tool `greetDeveloper`, чтобы подтвердить имя, а затем формирует приветствие на текущем языке пользователя.

:::tip Что прочитать заранее

- [Определение серверного Tool](./define-tool.md) — основная структура `defineTools()` и Tool
- [Определение Skill](./define-skill.md) — `SKILLS.md` и привязка Tool
- [Определение встроенного ИИ-сотрудника](./define-ai-employee.md) — `defineAIEmployee()` и каталог сотрудника

:::

## Итоговый результат

После завершения плагин будет предоставлять следующие возможности:

- Создавать встроенного ИИ-сотрудника с именем `Dev Helper`
- Автоматически привязывать к сотруднику Skill `welcome-developer`
- Проверять имя разработчика, вызывая Tool `greetDeveloper` через Skill
- Формировать приветствие и следующий вопрос на текущем языке пользователя

<!-- 需要一张 AI 员工管理页中 Dev Helper 被标记为内置员工的截图 -->

## Итоговая структура каталогов

```text
src/ai/ai-employees/dev-helper/
├── index.ts
├── prompt.md
└── skills/
    └── welcome-developer/
        ├── SKILLS.md
        └── tools/
            └── greetDeveloper.ts
```

Для этого примера не нужен фронтенд-код или ручная регистрация в `src/server/plugin.ts`.

## Шаг 1. Определите Tool

Создайте `src/ai/ai-employees/dev-helper/skills/welcome-developer/tools/greetDeveloper.ts`:

```ts
import type { Context } from '@nocobase/actions';
import { defineTools } from '@nocobase/ai';
import { z } from 'zod';

export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: '{{t("ai.tools.greetDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}',
    about: '{{t("ai.tools.greetDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}',
  },
  definition: {
    name: 'greetDeveloper',
    description: 'Validate the developer name before the assistant writes a welcome message.',
    schema: z.object({
      name: z.string().min(1).describe('The developer name provided by the user.'),
    }),
  },
  invoke: async (_ctx: Context, args: { name: string }) => {
    return {
      status: 'success',
      content: {
        name: args.name,
      },
    };
  },
});
```

## Шаг 2. Определите Skill

Создайте `src/ai/ai-employees/dev-helper/skills/welcome-developer/SKILLS.md`:

```md
---
scope: SPECIFIED
name: welcome-developer
description: Greet a developer by name and guide them to the next NocoBase plugin-development step.
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
---

You welcome developers who are starting NocoBase plugin development.

# Workflow

1. Read the developer name from the user's request.
2. If the name is missing, ask the user for it.
3. Call `greetDeveloper` exactly once.
4. Wait for a tool result with `status: "success"`.
5. Use `content.name` to write a short welcome message in the same language as the user.
6. Ask which plugin capability the developer wants to build next, using the same language as the user.

# Constraints

- Do not invent a name.
- Do not claim the Tool succeeded before receiving its result.
- Write both the welcome message and the follow-up question in the same language as the user.
```

Поскольку `greetDeveloper.ts` находится в каталоге `tools/` текущего Skill, указывать `tools: [greetDeveloper]` отдельно не нужно.

## Шаг 3. Определите профиль ИИ-сотрудника

Создайте `src/ai/ai-employees/dev-helper/index.ts`:

```ts
import { defineAIEmployee } from '@nocobase/ai';

export default defineAIEmployee({
  username: 'developer-helper-dev-assistant',
  category: 'developer',
  description: 'AI employee for helping developers start NocoBase plugin development.',
  avatar: 'nocobase-002-male',
  nickname: 'Dev Helper',
  position: 'Plugin development guide',
  bio: 'Welcomes developers and guides them into a small, verifiable plugin-development task.',
  greeting: 'Hello, I can help you begin a NocoBase plugin development task. Who are we welcoming today?',
});
```

`username` — уникальный идентификатор в базе данных. Не меняйте его без необходимости после публикации, иначе NocoBase воспримет новое значение как другого встроенного ИИ-сотрудника.

:::warning Внимание

`username` должен не только оставаться стабильным, но и не совпадать с именами из других плагинов или существующих ИИ-сотрудников. Если в базе данных уже есть такой `username`, при загрузке плагина соответствующая запись будет обновлена, а не создан отдельный сотрудник.

При повторной загрузке плагина в базу данных могут быть перезаписаны значения `category`, `nickname`, `position`, `avatar`, `bio`, `greeting`, системного промпта по умолчанию, привязок Skill и Tool, `chatSettings` и `sort`. Для готового плагина рекомендуется использовать имя с префиксом плагина, например `developer-helper-dev-assistant`.

:::

## Шаг 4. Определите системный промпт

Создайте `src/ai/ai-employees/dev-helper/prompt.md`:

```md
You are Dev Helper, a NocoBase plugin development guide.

Help users begin with a small, verifiable task.

When the user asks you to greet or welcome a developer, load the `welcome-developer` skill and follow its workflow.

Never claim that a Tool succeeded before receiving its result.
```

Теперь связи между каталогами настроены автоматически:

```text
greetDeveloper Tool
  → welcome-developer Skill
  → dev-helper AI employee
```

## Шаг 5. Включите и проверьте

Пересоберите или перезапустите службу разработки и убедитесь, что плагин с этими файлами включён. Затем проверьте на странице управления ИИ-сотрудниками:

- Отображается `Dev Helper`
- Сотрудник помечен как встроенный
- Среди собственных Skill сотрудника есть `welcome-developer`
- После загрузки Skill доступен `greetDeveloper`

Введите в диалоге:

```text
请向 Alice 打个招呼。
```

Ожидаемый процесс:

```text
加载 welcome-developer
  → 调用 greetDeveloper({ name: "Alice" })
  → 收到 status: "success" 和 content.name
  → Skill 使用用户当前语言生成问候语
  → 询问接下来要开发什么插件能力
```

Если Tool не должен запрашивать подтверждение пользователя перед каждым вызовом, задайте `defaultPermission: 'ALLOW'`. Для Tool, которые удаляют данные, вносят массовые изменения или вызывают внешние побочные эффекты, обычно лучше сохранить значение `ASK`.

## Краткие итоги

| Файл | За что отвечает |
| --- | --- |
| `greetDeveloper.ts` | Проверяет входные данные и возвращает структурированный результат Tool |
| `SKILLS.md` | Определяет порядок вызова Tool и формирования ответа |
| `prompt.md` | Задаёт роль сотрудника и общие ограничения |
| `index.ts` | Определяет профиль встроенного ИИ-сотрудника |


## Связанные ссылки

- [Разработка плагинов для ИИ-сотрудников](./index.md) — связи между Tool, Skill и встроенным ИИ-сотрудником
- [Определение серверного Tool](./define-tool.md) — полная конфигурация `defineTools()`
- [Определение Skill](./define-skill.md) — поля и структура `SKILLS.md`
- [Определение встроенного ИИ-сотрудника](./define-ai-employee.md) — `defineAIEmployee()` и привязка по каталогам
- [Интернационализация плагина ИИ-сотрудника](./internationalization.md) — переводы текстов интерфейса управления из примера
