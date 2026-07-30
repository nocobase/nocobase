---
title: "Определение серверного Tool"
description: "Определение серверного Tool ИИ-сотрудника NocoBase: defineTools, scope, schema, invoke, разрешения и регистрация по каталогу."
keywords: "NocoBase,Tool ИИ-сотрудника,defineTools,ToolsOptions,Zod,invoke"
---

# Определение серверного Tool

В NocoBase **Tool (инструмент)** отвечает за конкретные операции: запросы, запись данных и внешние вызовы. Серверный Tool обычно определяют с помощью `defineTools()` из `@nocobase/ai` и помещают в каталог `src/ai/**/tools/` плагина.

## Минимальная структура Tool

Серверный Tool определяется с помощью функции `defineTools()` из `@nocobase/ai`. Следующий Tool принимает имя и возвращает приветствие:

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
    description: 'Generate a short greeting for the developer named by the user.',
    schema: z.object({
      name: z.string().min(1).describe('The developer name to greet.'),
    }),
  },
  invoke: async (_ctx: Context, args: { name: string }) => {
    return {
      status: 'success',
      content: `Hello ${args.name}, welcome to NocoBase plugin development!`,
    };
  },
});
```

Если файл находится по пути `src/ai/tools/greetDeveloper.ts`, загрузчик использует имя файла `greetDeveloper` как итоговое имя Tool. Даже если в `definition.name` указано другое значение, при регистрации оно будет заменено именем файла.

Поэтому по умолчанию используйте одно и то же имя для файла, `definition.name`, ссылки в Skill и регистрации во фронтенде.

## Параметры конфигурации Tool

Основные параметры `defineTools()`:

| Параметр | Назначение | Значение по умолчанию |
| --- | --- | --- |
| `scope` | Определяет область доступности Tool | Обязательный параметр |
| `execution` | Указывает, где выполняется логика: в `backend` или `frontend` | `backend` |
| `defaultPermission` | Разрешить вызов сразу или запросить подтверждение | `ASK` |
| `silence` | Скрывать ли уведомление о вызове Tool в диалоге | `false` |
| `introduction` | Заголовок и описание в интерфейсе управления | Используется имя Tool |
| `definition` | Имя, описание и schema параметров для модели | Обязательный параметр |
| `invoke` | Фактическая логика выполнения Tool | Обязательный параметр |

Выбор `scope` непосредственно определяет, как Tool попадает в контекст ИИ-сотрудника:

| `scope` | Способ использования |
| --- | --- |
| `GENERAL` | Доступен всем ИИ-сотрудникам; обычно используется для общих базовых возможностей |
| `SPECIFIED` | Доступен только Skill или ИИ-сотруднику, к которому привязан |
| `CUSTOM` | Администратор может вручную добавить его в конфигурацию ИИ-сотрудника и выбрать «Спрашивать» или «Разрешить» |

По умолчанию рекомендуется `SPECIFIED`. Используйте `GENERAL`, только если возможность точно нужна каждому ИИ-сотруднику. Если администратор должен выбирать её отдельно для каждого сотрудника, используйте `CUSTOM`.

## `definition` предназначен для модели

`definition.description` и `definition.schema` влияют на то, выберет ли модель этот Tool и как сформирует параметры. В описании нужно ясно указать три аспекта:

- Когда вызывать Tool
- Что означает каждый параметр
- Какие задачи не должен выполнять этот Tool

Для schema параметров рекомендуется использовать Zod:

```ts
schema: z.object({
  query: z.string().describe('A specific search query.'),
  limit: z.number().int().min(1).max(20).default(5).describe('Maximum number of records to return.'),
})
```

Имя Tool также должно оставаться стабильным. Skill, конфигурация ИИ-сотрудника, фронтенд-карточки и сохранённые сообщения чата находят Tool по имени.

## Что доступно в `invoke()`

Серверный `invoke()` получает три аргумента:

```ts
invoke: async (ctx, args, runtime) => {
  // ctx：当前 NocoBase action Context
  // args：模型根据 schema 生成的参数
  // runtime.toolCallId：当前 ToolCall ID
  // runtime.writer(chunk)：流式写出中间结果
}
```

Через `ctx` доступны текущее приложение, база данных, данные аутентификации и параметры action. Например:

```ts
const repository = ctx.app.db.getRepository('posts');
const currentUser = ctx.auth?.user;
const values = ctx.action?.params?.values;
```

Tool должен возвращать структуру, по которой можно определить успех или ошибку. Встроенные Tool обычно используют следующую форму:

```ts
return {
  status: 'success',
  content: result,
};
```

При ожидаемой бизнес-ошибке также возвращайте понятный статус и причину, чтобы модели не приходилось угадывать, завершилась ли операция успешно.

## Использование каталога для длинного описания

Tool можно определить не только одним файлом, но и каталогом:

```text
src/ai/tools/documentSearch/
├── index.ts
└── description.md
```

`index.ts` по умолчанию экспортирует результат `defineTools()`. Если существует `description.md`, его полное содержимое переопределяет `definition.description`; это удобно для длинных инструкций по использованию Tool.

Имя каталога `documentSearch` становится итоговым регистрационным именем.

## Пример встроенного Tool: `subAgentWebSearch`

Файл `packages/plugins/@nocobase/plugin-ai/src/ai/tools/subAgentWebSearch.ts` демонстрирует полный серверный Tool:

```ts
export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: '{{t("Web search")}}',
    about: '{{t("Use web search to quickly find up-to-date information from the internet.")}}',
  },
  definition: {
    name: 'subAgentWebSearch',
    description: 'Search the web for current information...',
    schema: z.object({
      query: z.array(z.string()),
    }),
  },
  invoke: async (ctx, args) => {
    // 获取 AI 插件和当前会话使用的模型配置。
    const pluginAI = ctx.app.pm.get('ai') as PluginAIServer;
    const { model } = ctx.action?.params?.values ?? {};
    const { provider } = await pluginAI.aiManager.getLLMService({
      ...model,
      webSearch: true,
      reasoning: { mode: 'off' },
    });

    // 独立查询并行执行，最后统一返回。
    const result = await Promise.all(
      args.query.map(async (query) => {
        const content = await provider.invoke(/* messages */);
        return { query, result: content.text };
      }),
    );

    return { status: 'success', content: result };
  },
});
```

В этой реализации есть несколько приёмов, которые можно использовать повторно:

- Ограничение доступа к инструменту конкретными сотрудниками или навыками с помощью `SPECIFIED`
- Проверка создаваемых моделью параметров с помощью Zod
- Получение конфигурации модели текущего ИИ-диалога из `ctx.action.params.values`
- Объединение нескольких независимых запросов в один ToolCall и их параллельное выполнение через `Promise.all()`
- Возврат структурированного результата с понятными источниками для дальнейшей обработки вышестоящей моделью

## Связанные ссылки

- [Разработка плагинов для ИИ-сотрудников](./index.md) — выбор уровня расширения
- [Определение Skill](./define-skill.md) — организация порядка вызова нескольких Tool с помощью Skill
- [Полный пример: создание встроенного ИИ-сотрудника](./complete-example.md) — рабочий пример Tool
- [Добавление фронтенд-взаимодействия для Tool](./frontend-tool-ui.md) — интерфейс подтверждения и выбора для ToolCall
