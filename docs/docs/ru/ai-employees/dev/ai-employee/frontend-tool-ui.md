---
title: "Добавление фронтенд-взаимодействия для Tool"
description: "Card, modal, decisions.edit и frontend execution для Tool ИИ-сотрудников NocoBase, а также полный пример карточки выбора."
keywords: "NocoBase,фронтенд-карточка Tool,ToolsUIProperties,decisions.edit,SuggestionsOptionsCard,frontend Tool"
---

# Добавление фронтенд-взаимодействия для Tool

Некоторые Tool выполняются только на сервере и не требуют специального интерфейса. Если Tool должен позволять пользователю подтверждать, выбирать или редактировать параметры, для Tool с тем же именем можно зарегистрировать карточку, модальное окно или логику выполнения в браузере.

:::tip Различайте два понятия

**Фронтенд-карточка** отвечает только за отображение ToolCall и взаимодействие с пользователем. Она не означает, что бизнес-логика Tool обязательно выполняется в браузере.

Если нужно лишь отобразить варианты, как в `suggestions`, и после выбора пользователя продолжить серверный `invoke()`, оставьте значение по умолчанию `execution: 'backend'`. Устанавливать `execution: 'frontend'` и реализовывать фронтенд-функцию `invoke` следует только тогда, когда фактической логике Tool нужен доступ к текущей странице браузера, FlowModel или состоянию редактора.

:::

## Сначала определите параметры и логику выполнения на сервере

Встроенный Tool `suggestions` находится здесь:

```text
packages/plugins/@nocobase/plugin-ai/src/ai/tools/suggestions.ts
```

Его schema содержит и варианты, и окончательный выбор пользователя:

```ts
schema: z.object({
  option: z.string().describe('user selected option, ignore this param').optional(),
  options: z.array(z.string()).describe('A list of suggested prompts for the user to choose from.'),
})
```

Согласно описанию Tool, при первом вызове модель должна сформировать только `options`. Поскольку для Tool не задано `defaultPermission: 'ALLOW'`, по умолчанию применяется разрешение `ASK`: ToolCall приостанавливается и ждёт действия пользователя.

После выбора пользователя фронтенд с помощью `decisions.edit()` объединяет `option` с исходными параметрами и возобновляет ToolCall. Серверный `invoke()` возвращает выбранное значение:

```ts
return {
  status: 'success',
  content: args?.option,
};
```

Встроенная реализация также записывает результат выбора обратно в `aiMessages.toolCalls`, чтобы при повторном отображении истории сообщений по-прежнему было видно, какой вариант выбрал пользователь.

## Создание компонента карточки

Фронтенд-карточка получает `ToolsUIProperties`:

```tsx
import { useState } from 'react';
import type { ToolsUIProperties } from '@nocobase/client-v2';
import { Button, Flex } from 'antd';

interface DeveloperChoiceArgs {
  options?: string[] | string;
  option?: string;
}

const parseOptions = (value: DeveloperChoiceArgs['options']): string[] => {
  if (Array.isArray(value)) {
    return value.filter((option): option is string => typeof option === 'string');
  }
  if (typeof value !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((option): option is string => typeof option === 'string') : [];
  } catch {
    return [];
  }
};

export const DeveloperChoiceCard = ({
  toolCall,
  decisions,
}: ToolsUIProperties<DeveloperChoiceArgs>) => {
  const [submitting, setSubmitting] = useState(false);
  const options = parseOptions(toolCall.args?.options);

  const handleSelect = async (option: string) => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await decisions.edit({
        ...toolCall.args,
        option,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex gap="small" wrap="wrap">
      {options.map((option, index) => (
        <Button
          key={`${option}-${index}`}
          disabled={toolCall.invokeStatus !== 'interrupted' || submitting}
          onClick={() => handleSelect(option)}
        >
          {option}
        </Button>
      ))}
    </Flex>
  );
};
```

:::warning Внимание

Этот компонент демонстрирует общий способ использования `decisions.edit()` и обрабатывает повторные нажатия и параметры в виде JSON-строки. В готовой реализации также нужно учитывать режим чтения диалога, текущее активное сообщение и состояние исторического выбора. Полный пример находится в `packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/tools/SuggestionsOptionsCard.tsx`.

:::

`decisions` предоставляет три операции:

| Метод | Назначение |
| --- | --- |
| `approve()` | Продолжить выполнение с исходными параметрами |
| `edit(args)` | Изменить параметры и продолжить выполнение |
| `reject(message?)` | Отклонить выполнение и вернуть причину в процесс диалога |

Встроенный `SuggestionsOptionsCard.tsx` дополнительно обрабатывает следующие детали:

- Поддерживает две формы `options`: массив и JSON-строку
- Показывает loading, пока ToolCall ещё формируется
- Разрешает выбор только для ToolCall в состоянии `interrupted`
- Сразу отключает кнопки после нажатия, чтобы предотвратить повторную отправку
- Сохраняет и выделяет выбранный вариант в истории сообщений
- Разрешает действия только в текущем редактируемом диалоге

## Регистрация в клиентском плагине

Имя регистрации во фронтенде должно точно совпадать с именем серверного Tool:

```tsx
import { Plugin } from '@nocobase/client-v2';
import { DeveloperChoiceCard } from './ai-employees/tools/DeveloperChoiceCard';

export class PluginDeveloperHelperClient extends Plugin {
  async load() {
    this.ai.toolsManager.registerTools('developerChoice', {
      ui: {
        card: DeveloperChoiceCard,
      },
    });
  }
}

export default PluginDeveloperHelperClient;
```

Если серверный файл называется `src/ai/tools/developerChoice.ts`, здесь нужно зарегистрировать `developerChoice`.

Встроенный `suggestions` регистрируется таким же образом:

```ts
export const suggestionsTool = [
  'suggestions',
  {
    ui: {
      card: SuggestionsOptionsCard,
    },
  },
];
```

Затем `PluginAIClientV2.load()` вызывает `registerPluginAIClientV2BuiltinTools(this.ai.toolsManager)` и объединяет карточку с определением серверного Tool с тем же именем.

## Когда использовать карточку, модальное окно и выполнение во фронтенде

Ниже перечислены только основные параметры клиентского `ToolsOptions`. Полное определение типа находится в `packages/core/client-v2/src/ai/tools-manager/types.ts`.

```ts
type ToolsOptions = {
  ui?: {
    card?: ComponentType<ToolsUIProperties>;
    modal?: {
      title?: string;
      okText?: string;
      Component?: ComponentType;
      footer?: ComponentType;
      hideOkButton?: boolean;
      // modal.props、useOnOk 等配置请查看完整类型。
    };
  };
  invoke?: (app, params) => unknown | Promise<unknown>;
  // useHooks 等其他配置请查看完整类型。
};
```

### Использование карточки

По умолчанию сначала используйте `card`. Карточка подходит для отображения состояния выполнения, кнопок подтверждения и небольшого числа вариантов непосредственно в ToolCall.

### Использование модального окна

Добавляйте `modal`, когда содержимого много, нужен крупный предпросмотр или требуется сложное редактирование параметров.

### Выполнение Tool в браузере

Если для серверного Tool задано `execution: 'frontend'`, на клиенте также нужно предоставить `invoke`. Такой Tool подходит для чтения контекста текущей страницы, содержимого редактора или состояния FlowEngine, но не для записи данных, требующей защиты серверными разрешениями.

## Полный пример: добавление карточки выбора для встроенного ИИ-сотрудника

После завершения [полного примера создания встроенного ИИ-сотрудника](./complete-example.md) следующий вопрос `Dev Helper` можно превратить в варианты для выбора. Для этого определите дополнительный Tool `developerChoice` и зарегистрируйте для него фронтенд-карточку. Поместите серверный файл сюда:

```text
src/ai/ai-employees/dev-helper/skills/welcome-developer/tools/developerChoice.ts
```

Этот Tool объявляет варианты и принимает выбор пользователя:

```ts
import type { Context } from '@nocobase/actions';
import { defineTools } from '@nocobase/ai';
import { z } from 'zod';

export default defineTools({
  scope: 'SPECIFIED',
  introduction: {
    title: '{{t("ai.tools.developerChoice.title", { ns: "@nocobase/plugin-developer-helper" })}}',
    about: '{{t("ai.tools.developerChoice.about", { ns: "@nocobase/plugin-developer-helper" })}}',
  },
  definition: {
    name: 'developerChoice',
    description: 'Show a short list of plugin-development directions for the user to choose from.',
    schema: z.object({
      options: z.array(z.string()).min(2).max(4),
      option: z.string().optional(),
    }),
  },
  invoke: async (_ctx: Context, args: { options: string[]; option?: string }) => {
    return {
      status: 'success',
      content: args.option,
    };
  },
});
```
Поскольку `developerChoice.ts` находится в каталоге `tools/` Skill `welcome-developer`, он автоматически привязывается к текущему Skill. Однако привязка означает только, что модель может использовать этот Tool, а не то, что она обязательно его вызовет.

Также измените рабочий процесс в `SKILLS.md`, заменив прежние шаги 5–6 следующими:

```md
5. Use `content.name` to write a short welcome message in the same language as the user.
6. Call `developerChoice` exactly once with 2–4 plugin-development directions written in the user's language.
7. Wait for the user to select an option.
8. Continue according to the selected option.
```

Сохраните определённый выше компонент `DeveloperChoiceCard`, который используется повторно, по следующему пути:

```text
src/client-v2/ai-employees/tools/DeveloperChoiceCard.tsx
```

Наконец, зарегистрируйте его в `src/client-v2/plugin.tsx`:

```tsx
import { Plugin } from '@nocobase/client-v2';
import { DeveloperChoiceCard } from './ai-employees/tools/DeveloperChoiceCard';

export class PluginDeveloperHelperClient extends Plugin {
  async load() {
    this.ai.toolsManager.registerTools('developerChoice', {
      ui: {
        card: DeveloperChoiceCard,
      },
    });
  }
}

export default PluginDeveloperHelperClient;
```

После регистрации карточки пересоберите клиент. Когда диалог дойдёт до `developerChoice`, ToolCall приостановится и покажет варианты, на которые можно нажать.

<!-- 需要一张对话中显示 developerChoice 可点击选项的截图 -->


## Связанные ссылки

- [Определение серверного Tool](./define-tool.md) — определение серверного Tool для фронтенд-карточки
- [Полный пример: создание встроенного ИИ-сотрудника](./complete-example.md) — сначала создайте базовый пример Dev Helper
- [Интернационализация плагина ИИ-сотрудника](./internationalization.md) — перевод текстов Tool и Skill для интерфейса управления
- [Клиентский Plugin](../../../plugin-development/client/plugin.md) — точка входа клиентского плагина и метод `load()`
