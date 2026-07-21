---
title: "ctx.ai"
description: "Используйте ctx.ai в RunJS, чтобы запускать задачи AI-сотрудника в глобальном диалоге или в указанном AI Chat Box: с содержимым задачи напрямую или с задачами, настроенными в действии AI-сотрудника."
keywords: "ctx.ai,AI employee,uploadFile,attachments,triggerTask,triggerModelTask,chatBoxUid,AI Chat Box,RunJS,NocoBase"
---

# ctx.ai

В RunJS `ctx.ai` используется для запуска **задач AI-сотрудника**. Это удобно в JSBlock, JSAction и других взаимодействиях, где кнопка, форма или бизнес-процесс должны передать работу конкретному AI-сотруднику.

`ctx.ai` загружает вложения для AI-задач и запускает задачи. Завершения загрузки файла можно дождаться, но запуск задачи не возвращает результат ее выполнения. После вызова задача попадает в поток диалога AI-сотрудника.

:::warning Примечание

`ctx.ai` предоставляет AI-плагин. Если AI-плагин не включен или текущая среда RunJS не загрузила соответствующую клиентскую возможность, `ctx.ai` может отсутствовать. Перед вызовом можно проверить `ctx.ai?.uploadFile`, `ctx.ai?.triggerTask` или `ctx.ai?.triggerModelTask`.

:::

## Методы

### ctx.ai.uploadFile()

Загружает файл и возвращает объект вложения, который можно напрямую передать в задачу AI-сотрудника.

```ts
const attachment = await ctx.ai.uploadFile(file, options);
```

| Параметр | Тип | Описание |
|------|------|------|
| `file` | `File` | Объект файла браузера для загрузки. |
| `options.onProgress` | `(percent: number) => void` | Callback прогресса загрузки. `percent` находится в диапазоне от `0` до `100`. |
| `options.signal` | `AbortSignal` | Сигнал для отмены загрузки. |

При загрузке используется файловое хранилище, настроенное в AI-плагине, и создается запись в `aiFiles`. Возвращаемый объект содержит поля `id`, `filename`, `url`, `source` и другие:

```ts
const attachment = await ctx.ai.uploadFile(file, {
  onProgress(percent) {
    console.log('upload progress', percent);
  },
});

// attachment можно напрямую добавить в message.attachments
```

При ошибке загрузки Promise отклоняется. Удаление вложения только из локального списка не удаляет уже созданную запись в `aiFiles`, как и в стандартном окне AI-чата.

### ctx.ai.triggerTask()

Запускает задачу AI-сотрудника напрямую.

```ts
ctx.ai.triggerTask(options: TriggerTaskOptions): void
```

| Параметр | Тип | Описание |
|------|------|------|
| `aiEmployee` | `string \| AIEmployee` | AI-сотрудник. Если передана строка, NocoBase ищет точное совпадение с `AIEmployee.username`, и AI-сотрудник должен быть доступен текущему пользователю. |
| `tasks` | `Task[]` | Список задач для запуска. |
| `chatBoxUid` | `string` | FlowModel uid блока AI Chat Box, который должен получить задачу. |
| `open` | `boolean` | Открывать ли панель диалога AI-сотрудника. |
| `auto` | `boolean` | Использовать ли семантику автоматического запуска действия AI-сотрудника. |

Часто используемые поля `Task`:

| Поле | Тип | Описание |
|------|------|------|
| `title` | `string` | Заголовок задачи. |
| `message.system` | `string` | Системное сообщение, ограничивающее роль и требования к ответу AI-сотрудника. |
| `message.user` | `string` | Пользовательское сообщение, то есть основная инструкция задачи. |
| `message.attachments` | `Attachment[]` | Вложения задачи, обычно полученные из `ctx.ai.uploadFile()`. |
| `message.workContext` | `ContextItem[]` | Контекст блоков страницы, используемый задачей. |
| `autoSend` | `boolean` | Отправлять ли сообщение задачи автоматически. |
| `webSearch` | `boolean` | Разрешен ли Web search для этой задачи. |
| `model` | `{ llmService: string; model: string } \| null` | Модель, используемая этой задачей. |
| `skillSettings` | `SkillSettings` | Настройки skills / tools для этой задачи. |

### Выбрать AI Chat Box

Укажите `chatBoxUid` в параметрах верхнего уровня `triggerTask()`, чтобы запустить задачу в смонтированном блоке AI Chat Box вместо глобального диалога AI-сотрудника.

```ts
ctx.ai.triggerTask({
  aiEmployee: 'nathan',
  chatBoxUid: 'AI_CHAT_BOX_BLOCK_UID',
  open: true,
  tasks: [
    {
      title: ctx.t('Review current page'),
      message: {
        user: 'Review the current page and summarize the main risks.',
      },
    },
  ],
});
```

uid должен принадлежать внешнему блоку AI Chat Box, смонтированному на текущей странице. Не помещайте это значение маршрутизации в `tasks`. Если целевой блок не найден, NocoBase сообщает об ошибке и не переключается на глобальный диалог. Если `chatBoxUid` не указан, задача запускается в глобальном диалоге AI-сотрудника.

### Загрузить и отправить вложения в JSBlock

В следующем примере JSBlock отображает загрузку файлов, инструкции к задаче и кнопку отправки. Загруженные файлы передаются AI-сотруднику через `message.attachments`:

```tsx
if (!ctx.ai?.uploadFile || !ctx.ai?.triggerTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

const { React } = ctx.libs;
const { useState } = React;
const { Button, Card, Input, Space, Upload } = ctx.libs.antd;
const { InboxOutlined, SendOutlined } = ctx.libs.antdIcons;

const AttachmentTask = () => {
  const [prompt, setPrompt] = useState('');
  const [fileList, setFileList] = useState([]);

  const uploadAttachment = async ({ file, onError, onProgress, onSuccess }) => {
    try {
      const attachment = await ctx.ai.uploadFile(file, {
        onProgress(percent) {
          onProgress?.({ percent });
        },
      });
      onSuccess?.(attachment);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(ctx.t('File upload failed')));
    }
  };

  const sendTask = () => {
    const attachments = fileList
      .filter((file) => file.status === 'done' && file.response)
      .map((file) => file.response);

    if (!prompt.trim()) {
      ctx.message.warning(ctx.t('Enter task instructions'));
      return;
    }

    ctx.ai.triggerTask({
      aiEmployee: 'viz',
      open: true,
      tasks: [
        {
          title: ctx.t('Analyze uploaded files'),
          message: {
            user: prompt.trim(),
            attachments,
          },
          autoSend: true,
        },
      ],
    });
    setPrompt('');
    setFileList([]);
  };

  const uploading = fileList.some((file) => file.status === 'uploading');

  return (
    <Card title={ctx.t('AI file analysis')}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Upload.Dragger
          multiple
          fileList={fileList}
          customRequest={uploadAttachment}
          onChange={({ fileList: nextFileList }) => setFileList(nextFileList)}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p>{ctx.t('Click or drag files here to upload')}</p>
        </Upload.Dragger>
        <Input.TextArea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={ctx.t('Describe the task for the AI employee')}
          autoSize={{ minRows: 3, maxRows: 8 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          disabled={uploading || !prompt.trim()}
          onClick={sendTask}
        >
          {ctx.t('Send to AI')}
        </Button>
      </Space>
    </Card>
  );
};

ctx.render(<AttachmentTask />);
```

При `autoSend: false` вложения и инструкции к задаче помещаются в черновик AI-чата и не отправляются сразу.

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

Публичные параметры `triggerModelTask()` не принимают `chatBoxUid`. Чтобы выбрать AI Chat Box, настройте `chatBoxUid` в предустановленной задаче действия AI-сотрудника. `triggerModelTask()` продолжит использовать это предустановленное значение.

```ts
ctx.ai.triggerModelTask(uid: string, taskIndex: number, options?: TriggerModelTaskOptions): void
```

| Параметр | Тип | Описание |
|------|------|------|
| `uid` | `string` | FlowModel uid действия AI-сотрудника. |
| `taskIndex` | `number` | Индекс задачи, начиная с `0`. |
| `options.open` | `boolean` | Открывать ли панель диалога AI-сотрудника. |
| `options.auto` | `boolean` | Использовать ли семантику автоматического запуска действия AI-сотрудника. |
| `options.attachments` | `Attachment[]` | Вложения, динамически добавляемые к настроенной задаче. |

```ts
if (!ctx.ai?.triggerModelTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

const weeklyReviewActionUid = 'AI_EMPLOYEE_ACTION_MODEL_UID';

ctx.ai.triggerModelTask(weeklyReviewActionUid, 0, {
  open: true,
  attachments,
});

ctx.message.success(ctx.t('Configured AI employee task triggered.'));
```

Если целевая модель не существует, в ней не настроен AI-сотрудник или по указанному индексу нет задачи, задача не запускается, а в консоль выводится предупреждение.

## Примечания

- `triggerTask()` и `triggerModelTask()` работают как fire-and-forget. Они не возвращают результат выполнения задачи.
- `uploadFile()` возвращает Promise. Дождитесь завершения загрузки, прежде чем запускать задачу с этим вложением.
- Строка `aiEmployee` сопоставляется только с точным значением `AIEmployee.username`.
- `triggerModelTask()` использует `taskIndex`, начинающийся с `0`.
- `message.workContext` сейчас описывает только контекст блоков страницы.
- Значение верхнего уровня `triggerTask().chatBoxUid` должно ссылаться на блок AI Chat Box, смонтированный на текущей странице.
- `triggerModelTask()` продолжает использовать `chatBoxUid`, настроенный в предустановленной задаче.
- Динамические вложения `triggerModelTask()` добавляются к существующим `message.attachments` предустановленной задачи без изменения сохраненной конфигурации.

## Связанные разделы

- [ctx.message](./message.md): Показать легкие сообщения до и после запуска задач.
- [ctx.render](./render.md): Отрисовать кнопки или формы в JSBlock.
- [ctx.model](./model.md): Получить информацию о текущем FlowModel.
