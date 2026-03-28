:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/flow-engine/runjs-extension-points).
:::

# Точки расширения плагинов RunJS (документация ctx / сниппеты / сопоставление сценариев)

Когда плагин добавляет или расширяет возможности RunJS, рекомендуется регистрировать «сопоставление контекста / документацию `ctx` / примеры кода» через **официальные точки расширения**. Это гарантирует, что:

- CodeEditor сможет автоматически дополнять `ctx.xxx.yyy`.
- AI-кодинг получит структурированные справочники API `ctx` и примеры.

В этой главе представлены две точки расширения:

- `registerRunJSContextContribution(...)`
- `registerRunJSSnippet(...)`

## 1. `registerRunJSContextContribution`

Используется для регистрации «вкладов» (contributions) RunJS. Типичные варианты использования:

- Добавление/переопределение сопоставлений `RunJSContextRegistry` (`modelClass` -> `RunJSContext`, включая `scenes`).
- Расширение `RunJSDocMeta` (описания/примеры/шаблоны автодополнения для API `ctx`) для `FlowRunJSContext` или пользовательского `RunJSContext`.

### Описание поведения

- Вклады выполняются коллективно на этапе `setupRunJSContexts()`.
- Если `setupRunJSContexts()` уже завершен, **поздние регистрации будут выполнены немедленно** (повторный запуск setup не требуется).
- Каждый вклад выполняется **не более одного раза** для каждой версии `RunJSVersion`.

### Пример: Добавление контекста модели с поддержкой написания JS

```ts
import { registerRunJSContextContribution, FlowRunJSContext, RunJSContextRegistry } from '@nocobase/flow-engine';

registerRunJSContextContribution(({ version, FlowRunJSContext: BaseCtx, RunJSContextRegistry: Registry }) => {
  if (version !== 'v1') return;

  class MyPluginRunJSContext extends BaseCtx {}

  // 1) Документация/автодополнение ctx (RunJSDocMeta)
  MyPluginRunJSContext.define({
    label: 'MyPlugin RunJS context',
    properties: {
      myPlugin: {
        description: 'My plugin namespace',
        detail: 'object',
        properties: {
          hello: {
            description: 'Say hello',
            detail: '(name: string) => string',
            completion: { insertText: `ctx.myPlugin.hello('World')` },
          },
        },
      },
    },
  });

  // 2) Сопоставление модель -> контекст (scene влияет на автодополнение в редакторе и фильтрацию сниппетов)
  Registry.register('v1', 'MyPluginJSModel', MyPluginRunJSContext, { scenes: ['block'] });
});
```

## 2. `registerRunJSSnippet`

Используется для регистрации фрагментов кода (сниппетов) для RunJS, которые применяются для:

- Автодополнения сниппетов в CodeEditor.
- Использования в качестве примеров/справочных материалов для AI-кодинга (можно фильтровать по сценарию/версии/локали).

### Рекомендуемое именование ref

Рекомендуется использовать формат: `plugin/<pluginName>/<topic>`, например:

- `plugin/plugin-my/foo`
- `plugin/plugin-my/api-request-example`

Избегайте конфликтов с пространствами имен ядра `global/*` или `scene/*`.

### Стратегия конфликтов

- По умолчанию существующие записи `ref` не перезаписываются (возвращается `false` без вызова ошибки).
- Для явной перезаписи передайте `{ override: true }`.

### Пример: Регистрация сниппета

```ts
import { registerRunJSSnippet } from '@nocobase/flow-engine';

registerRunJSSnippet('plugin/plugin-my/hello', async () => ({
  default: {
    label: 'Hello (My Plugin)',
    description: 'Minimal example for my plugin',
    prefix: 'my-hello',
    versions: ['v1'],
    scenes: ['block'],
    contexts: ['*'],
    content: `
// My plugin snippet
ctx.message.success('Hello from plugin');
`,
  },
}));
```

## 3. Лучшие практики

- **Раздельное обслуживание документации и сниппетов**:
  - `RunJSDocMeta`: Описания/шаблоны автодополнения (короткие, структурированные).
  - Сниппеты: Длинные примеры (многоразовые, фильтруемые по сценарию/версии).
- **Избегайте чрезмерной длины промптов**: Примеры должны быть лаконичными; отдавайте приоритет «минимальным рабочим шаблонам».
- **Приоритет сценариев**: Если ваш JS-код в основном выполняется в таких сценариях, как формы или таблицы, убедитесь, что поле `scenes` заполнено правильно, чтобы повысить релевантность дополнений и примеров.

## 4. Скрытие автодополнений на основе реального ctx: `hidden(ctx)`

Некоторые API `ctx` сильно зависят от контекста (например, `ctx.popup` доступен только при открытом всплывающем окне или боковой панели). Если вы хотите скрыть эти недоступные API при автодополнении, вы можете определить `hidden(ctx)` для соответствующей записи в `RunJSDocMeta`:

- Возвращает `true`: скрывает текущий узел и его поддерево.
- Возвращает `string[]`: скрывает определенные подпути под текущим узлом (поддерживается возврат нескольких путей; пути являются относительными; поддеревья скрываются на основе сопоставления префиксов).

`hidden(ctx)` поддерживает `async`: вы можете использовать `await ctx.getVar('ctx.xxx')` для определения видимости (на ваше усмотрение). Рекомендуется, чтобы эта логика была быстрой и не имела побочных эффектов (например, избегайте сетевых запросов).

Пример: Показывать дополнения `ctx.popup.*` только при наличии `popup.uid`.

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup context (async)',
      hidden: async (ctx) => !(await ctx.getVar('ctx.popup'))?.uid,
      properties: {
        uid: 'Popup uid',
      },
    },
  },
});
```

Пример: Всплывающее окно доступно, но некоторые подпути скрыты (только относительные пути; например, скрытие `record` и `parent.record`).

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup context (async)',
      hidden: async (ctx) => {
        const popup = await ctx.getVar('ctx.popup');
        if (!popup?.uid) return true;
        const hidden: string[] = [];
        if (!popup?.record) hidden.push('record');
        if (!popup?.parent?.record) hidden.push('parent.record');
        return hidden;
      },
      properties: {
        uid: 'Popup uid',
        record: 'Popup record',
        parent: {
          properties: {
            record: 'Parent record',
          },
        },
      },
    },
  },
});
```

Примечание: CodeEditor всегда включает фильтрацию дополнений на основе реального `ctx` (отказоустойчивость: ошибки не выбрасываются).

## 5. Свойства `info/meta` во время выполнения и API информации о контексте (для автодополнения и LLM)

Помимо статического ведения документации `ctx` через `FlowRunJSContext.define()`, вы также можете внедрять **info/meta** во время выполнения через `FlowContext.defineProperty/defineMethod`. Затем вы можете выводить **сериализуемую** информацию о контексте для CodeEditor или LLM, используя следующие API:

- `await ctx.getApiInfos(options?)`: Статическая информация об API.
- `await ctx.getVarInfos(options?)`: Информация о структуре переменных (извлекается из `meta`, поддерживает развертывание по пути/глубине `maxDepth`).
- `await ctx.getEnvInfos()`: Снимок среды выполнения.

### 5.1 `defineMethod(name, fn, info?)`

`info` поддерживает (все параметры необязательны):

- `description` / `detail` / `examples`
- `ref: string | { url: string; title?: string }`
- `params` / `returns` (в стиле JSDoc)

> Примечание: `getApiInfos()` выводит статическую документацию API и не включает такие поля, как `deprecated`, `disabled` или `disabledReason`.

Пример: Предоставление ссылок на документацию для `ctx.refreshTargets()`.

```ts
ctx.defineMethod('refreshTargets', async () => {
  // ...
}, {
  description: 'Обновить данные целевых блоков',
  detail: '() => Promise<void>',
  ref: { url: 'https://docs.nocobase.com/', title: 'Документация' },
});
```

### 5.2 `defineProperty(key, { meta?, info? })`

- `meta`: Используется для интерфейса выбора переменных (`getPropertyMetaTree` / `FlowContextSelector`). Определяет видимость, древовидную структуру, состояние блокировки и т. д. (поддерживает функции/async).
  - Общие поля: `title` / `type` / `properties` / `sort` / `hidden` / `disabled` / `disabledReason` / `buildVariablesParams`
- `info`: Используется для статической документации API (`getApiInfos`) и описаний для LLM. Не влияет на интерфейс выбора переменных (поддерживает функции/async).
  - Общие поля: `title` / `type` / `interface` / `description` / `examples` / `ref` / `params` / `returns`

Если предоставлен только `meta` (без `info`):

- `getApiInfos()` не вернет этот ключ (так как статическая документация API не выводится из `meta`).
- `getVarInfos()` построит структуру переменных на основе `meta` (используется для селекторов переменных / динамических деревьев переменных).

### 5.3 API информации о контексте

Используется для вывода «информации о доступных возможностях контекста».

```ts
type FlowContextInfosEnvNode = {
  description?: string;
  getVar?: string; // Можно использовать напрямую в await ctx.getVar(getVar), рекомендуется начинать с "ctx."
  value?: any; // Разрешенное статическое значение (сериализуемое, возвращается только если его можно вычислить)
  properties?: Record<string, FlowContextInfosEnvNode>;
};

type FlowContextApiInfos = Record<string, any>; // Статическая документация (верхний уровень)
type FlowContextVarInfos = Record<string, any>; // Структура переменных (разворачивается по path/maxDepth)
type FlowContextEnvInfos = {
  popup?: FlowContextInfosEnvNode;
  block?: FlowContextInfosEnvNode;
  flowModel?: FlowContextInfosEnvNode;
  resource?: FlowContextInfosEnvNode;
  record?: FlowContextInfosEnvNode;
  currentViewBlocks?: FlowContextInfosEnvNode;
};
```

Общие параметры:

- `getApiInfos({ version })`: Версия документации RunJS (по умолчанию `v1`).
- `getVarInfos({ path, maxDepth })`: Обрезка и максимальная глубина развертывания (по умолчанию 3).

Примечание: Результаты, возвращаемые вышеуказанными API, не содержат функций и подходят для прямой сериализации и передачи в LLM.

### 5.4 `await ctx.getVar(path)`

Если у вас есть «строка пути к переменной» (например, из конфигурации или пользовательского ввода) и вы хотите получить значение этой переменной во время выполнения напрямую, используйте `getVar`:

- Пример: `const v = await ctx.getVar('ctx.record.roles.id')`
- `path` — это путь выражения, начинающийся с `ctx.` (например, `ctx.record.id` / `ctx.record.roles[0].id`).

Дополнительно: методы или свойства, начинающиеся с подчеркивания `_`, считаются приватными членами и не будут отображаться в выводе `getApiInfos()` или `getVarInfos()`.