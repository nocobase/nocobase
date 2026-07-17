---
title: "ctx.ai"
description: "Используйте ctx.ai в RunJS, чтобы запускать задачи AI-сотрудника: с содержимым задачи напрямую или с задачами, настроенными в действии AI-сотрудника."
keywords: "ctx.ai,AI employee,triggerTask,triggerModelTask,RunJS,NocoBase"
---

# ctx.ai

В RunJS `ctx.ai` используется для запуска **задач AI-сотрудника**. Это удобно в JSBlock, JSAction и других взаимодействиях, где кнопка, форма или бизнес-процесс должны передать работу конкретному AI-сотруднику.

`ctx.ai` только запускает задачи. Он не возвращает результат выполнения задачи. После вызова задача попадает в поток диалога AI-сотрудника.

:::warning Примечание

`ctx.ai` предоставляет AI-плагин. Если AI-плагин не включен или текущая среда RunJS не загрузила соответствующую клиентскую возможность, `ctx.ai` может отсутствовать. Перед вызовом можно проверить `ctx.ai?.triggerTask` или `ctx.ai?.triggerModelTask`.

:::

## Методы

### ctx.ai.triggerTask()

Запускает задачу AI-сотрудника напрямую.

```ts
ctx.ai.triggerTask(options: TriggerTaskOptions): void
```

| Параметр | Тип | Описание |
|------|------|------|
| `aiEmployee` | `string \| AIEmployee` | AI-сотрудник. Если передана строка, NocoBase ищет точное совпадение с `AIEmployee.username`, и AI-сотрудник должен быть доступен текущему пользователю. |
| `tasks` | `Task[]` | Список задач для запуска. |
| `open` | `boolean` | Открывать ли панель диалога AI-сотрудника. |
| `auto` | `boolean` | Использовать ли семантику автоматического запуска действия AI-сотрудника. |

Часто используемые поля `Task`:

| Поле | Тип | Описание |
|------|------|------|
| `title` | `string` | Заголовок задачи. |
| `message.system` | `string` | Системное сообщение, ограничивающее роль и требования к ответу AI-сотрудника. |
| `message.user` | `string` | Пользовательское сообщение, то есть основная инструкция задачи. |
| `message.workContext` | `ContextItem[]` | Контекст блоков страницы, используемый задачей. |
| `autoSend` | `boolean` | Отправлять ли сообщение задачи автоматически. |
| `webSearch` | `boolean` | Разрешен ли Web search для этой задачи. |
| `model` | `{ llmService: string; model: string } \| null` | Модель, используемая этой задачей. |
| `skillSettings` | `SkillSettings` | Настройки skills / tools для этой задачи. |

### Добавить контекст блока страницы

`message.workContext` сейчас используется для передачи блоков страницы. Укажите в нем FlowModel uid целевого блока:

```ts
message: {
  user: 'Review the current users table and summarize operational risks.',
  workContext: [
    {
      type: 'flow-model',
      uid: 'USERS_TABLE_BLOCK_UID',
    },
  ],
}
```

| Поле | Описание |
|------|------|
| `type` | Фиксированное значение `flow-model`, обозначающее контекст блока страницы. |
| `uid` | FlowModel uid блока страницы, например таблицы, карточки деталей или графика. |

Чтобы использовать текущий JSBlock как контекст, используйте uid текущей модели:

```ts
workContext: [
  {
    type: 'flow-model',
    uid: ctx.model.uid,
  },
],
```

### Указать модель

`model` задает модель для одной задачи. Если поле пропущено, используется модель по умолчанию AI-сотрудника. Значение `null` означает, что модель на уровне задачи не задается.

```ts
model: {
  llmService: 'openai-main',
  model: 'gpt-4.1',
}
```

### Настроить skills / tools

`skillSettings` задает skills и tools, доступные одной задаче. Если поле пропущено, используется конфигурация возможностей AI-сотрудника.

```ts
skillSettings: {
  skillsVersion: 2,
  toolsVersion: 2,
  skills: ['business-analysis-report'],
  tools: ['businessReportGenerator'],
}
```

Чтобы явно отключить все skills или tools для этой задачи, передайте пустые массивы и оставьте поля версий:

```ts
skillSettings: {
  skillsVersion: 2,
  toolsVersion: 2,
  skills: [],
  tools: [],
}
```

Пример:

```ts
if (!ctx.ai?.triggerTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

ctx.ai.triggerTask({
  aiEmployee: 'viz',
  open: true,
  tasks: [
    {
      title: ctx.t('Daily operations handoff brief'),
      message: {
        system:
          'You prepare reusable daily operations handoff briefs. Focus on risks, blockers, decisions, owners, and next actions.',
        user: [
          "Prepare today's operations handoff brief.",
          'Cover customer escalations, SLA risks, approvals, and follow-up owners.',
          'Return a concise brief that can be posted to the team channel.',
        ].join('\n'),
      },
      autoSend: true,
      webSearch: false,
    },
  ],
});

ctx.message.success(ctx.t('AI employee task triggered.'));
```

Если `aiEmployee` является строкой, NocoBase ищет точное совпадение по `username` среди AI-сотрудников, доступных текущему пользователю.

### ctx.ai.triggerModelTask()

Считывает задачу из модели действия AI-сотрудника на странице и запускает ее.

```ts
ctx.ai.triggerModelTask(uid: string, taskIndex: number, options?: TriggerModelTaskOptions): void
```

| Параметр | Тип | Описание |
|------|------|------|
| `uid` | `string` | FlowModel uid действия AI-сотрудника. |
| `taskIndex` | `number` | Индекс задачи, начиная с `0`. |
| `options.open` | `boolean` | Открывать ли панель диалога AI-сотрудника. |
| `options.auto` | `boolean` | Использовать ли семантику автоматического запуска действия AI-сотрудника. |

```ts
if (!ctx.ai?.triggerModelTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

const weeklyReviewActionUid = 'AI_EMPLOYEE_ACTION_MODEL_UID';

ctx.ai.triggerModelTask(weeklyReviewActionUid, 0, {
  open: true,
});

ctx.message.success(ctx.t('Configured AI employee task triggered.'));
```

Если целевая модель не существует, в ней не настроен AI-сотрудник или по указанному индексу нет задачи, задача не запускается, а в консоль выводится предупреждение.

## Примечания

- `triggerTask()` и `triggerModelTask()` работают как fire-and-forget. Они не возвращают результат выполнения задачи.
- Строка `aiEmployee` сопоставляется только с точным значением `AIEmployee.username`.
- `triggerModelTask()` использует `taskIndex`, начинающийся с `0`.
- `message.workContext` сейчас описывает только контекст блоков страницы.

## Связанные разделы

- [ctx.message](./message.md): Показать легкие сообщения до и после запуска задач.
- [ctx.render](./render.md): Отрисовать кнопки или формы в JSBlock.
- [ctx.model](./model.md): Получить информацию о текущем FlowModel.
