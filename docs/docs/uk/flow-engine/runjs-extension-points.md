:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/flow-engine/runjs-extension-points).
:::

# Точки розширення плагіна RunJS (документація ctx / фрагменти коду / мапінг сцен)

Коли плагін додає або розширює можливості RunJS, рекомендується реєструвати «мапінг контексту / документацію `ctx` / приклади коду» через **офіційні точки розширення**. Це забезпечує:

- Автодоповнення `ctx.xxx.yyy` у CodeEditor.
- Отримання структурованого API-довідника `ctx` та прикладів для AI-кодингу.

У цьому розділі представлено дві точки розширення:

- `registerRunJSContextContribution(...)`
- `registerRunJSSnippet(...)`

## 1. `registerRunJSContextContribution`

Використовується для реєстрації «внесків» (contributions) RunJS. Типові випадки використання:

- Додавання/перевизначення мапінгів `RunJSContextRegistry` (`modelClass` -> `RunJSContext`, включаючи `scenes`).
- Розширення `RunJSDocMeta` (описи/приклади/шаблони автодоповнення для API `ctx`) для `FlowRunJSContext` або власного `RunJSContext`.

### Опис поведінки

- Внески виконуються колективно під час фази `setupRunJSContexts()`.
- Якщо `setupRunJSContexts()` уже завершено, **пізня реєстрація буде виконана негайно** (не потрібно повторно запускати setup).
- Кожен внесок виконується **не більше одного разу** для кожної версії `RunJSVersion`.

### Приклад: додавання контексту моделі з підтримкою JS

```ts
import { registerRunJSContextContribution, FlowRunJSContext, RunJSContextRegistry } from '@nocobase/flow-engine';

registerRunJSContextContribution(({ version, FlowRunJSContext: BaseCtx, RunJSContextRegistry: Registry }) => {
  if (version !== 'v1') return;

  class MyPluginRunJSContext extends BaseCtx {}

  // 1) Документація/автодоповнення ctx (RunJSDocMeta)
  MyPluginRunJSContext.define({
    label: 'Контекст RunJS мого плагіна',
    properties: {
      myPlugin: {
        description: 'Простір імен мого плагіна',
        detail: 'object',
        properties: {
          hello: {
            description: 'Привітання',
            detail: '(name: string) => string',
            completion: { insertText: `ctx.myPlugin.hello('World')` },
          },
        },
      },
    },
  });

  // 2) Мапінг модель -> контекст (scene впливає на автодоповнення в редакторі та фільтрацію фрагментів)
  Registry.register('v1', 'MyPluginJSModel', MyPluginRunJSContext, { scenes: ['block'] });
});
```

## 2. `registerRunJSSnippet`

Використовується для реєстрації прикладів фрагментів коду (snippets) для RunJS, які застосовуються для:

- Автодоповнення фрагментів у CodeEditor.
- Використання як прикладів/довідкових матеріалів для AI-кодингу (можна фільтрувати за сценою/версією/локаллю).

### Рекомендоване іменування ref

Рекомендується використовувати формат: `plugin/<pluginName>/<topic>`, наприклад:

- `plugin/plugin-my/foo`
- `plugin/plugin-my/api-request-example`

Уникайте конфліктів із системними просторами імен `global/*` або `scene/*`.

### Стратегія конфліктів

- За замовчуванням існуючі записи `ref` не перезаписуються (повертається `false` без помилки).
- Для явного перезапису передайте `{ override: true }`.

### Приклад: реєстрація фрагмента коду

```ts
import { registerRunJSSnippet } from '@nocobase/flow-engine';

registerRunJSSnippet('plugin/plugin-my/hello', async () => ({
  default: {
    label: 'Hello (Мій плагін)',
    description: 'Мінімальний приклад для мого плагіна',
    prefix: 'my-hello',
    versions: ['v1'],
    scenes: ['block'],
    contexts: ['*'],
    content: `
// Фрагмент коду мого плагіна
ctx.message.success('Привіт від плагіна');
`,
  },
}));
```

## 3. Найкращі практики

- **Рівневе обслуговування документації та фрагментів**:
  - `RunJSDocMeta`: Описи/шаблони автодоповнення (короткі, структуровані).
  - Snippets: Довгі приклади (багаторазові, з можливістю фільтрації за сценою/версією).
- **Уникайте занадто довгих промптів**: Приклади мають бути лаконічними; віддавайте перевагу «мінімальним робочим шаблонам».
- **Пріоритет сцени**: Якщо ваш JS-код переважно виконується в таких сценаріях, як форми або таблиці, обов'язково правильно заповнюйте поле `scenes`, щоб підвищити релевантність автодоповнень та прикладів.

## 4. Приховування автодоповнень на основі фактичного ctx: `hidden(ctx)`

Деякі API `ctx` залежать від конкретного контексту (наприклад, `ctx.popup` доступний лише тоді, коли відкрите спливаюче вікно або бічна панель). Якщо ви хочете приховати ці недоступні API під час автодоповнення, ви можете визначити `hidden(ctx)` для відповідного запису в `RunJSDocMeta`:

- Повертає `true`: Приховує поточний вузол та його піддерево.
- Повертає `string[]`: Приховує конкретні підшляхи під поточним вузлом (підтримує повернення кількох шляхів; шляхи є відносними; піддерева приховуються на основі збігу префіксів).

`hidden(ctx)` підтримує `async`: ви можете використовувати `await ctx.getVar('ctx.xxx')` для визначення видимості (на розсуд розробника). Рекомендується, щоб ця логіка була швидкою та не мала побічних ефектів (наприклад, уникайте мережевих запитів).

Приклад: показувати автодоповнення `ctx.popup.*` лише тоді, коли існує `popup.uid`.

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Контекст спливаючого вікна (async)',
      hidden: async (ctx) => !(await ctx.getVar('ctx.popup'))?.uid,
      properties: {
        uid: 'UID спливаючого вікна',
      },
    },
  },
});
```

Приклад: спливаюче вікно доступне, але деякі підшляхи приховані (тільки відносні шляхи; наприклад, приховування `record` та `parent.record`).

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Контекст спливаючого вікна (async)',
      hidden: async (ctx) => {
        const popup = await ctx.getVar('ctx.popup');
        if (!popup?.uid) return true;
        const hidden: string[] = [];
        if (!popup?.record) hidden.push('record');
        if (!popup?.parent?.record) hidden.push('parent.record');
        return hidden;
      },
      properties: {
        uid: 'UID спливаючого вікна',
        record: 'Запис спливаючого вікна',
        parent: {
          properties: {
            record: 'Батьківський запис',
          },
        },
      },
    },
  },
});
```

Примітка: CodeEditor завжди вмикає фільтрацію автодоповнення на основі фактичного `ctx` (fail-open, не видає помилок).

## 5. Runtime `info/meta` та API інформації про контекст (для автодоповнень та LLM)

Окрім статичного ведення документації `ctx` через `FlowRunJSContext.define()`, ви також можете впроваджувати **info/meta** під час виконання через `FlowContext.defineProperty/defineMethod`. Потім ви можете виводити **серіалізовану** інформацію про контекст для CodeEditor або LLM за допомогою наступних API:

- `await ctx.getApiInfos(options?)`: Статична інформація про API.
- `await ctx.getVarInfos(options?)`: Інформація про структуру змінних (отримана з `meta`, підтримує розгортання path/maxDepth).
- `await ctx.getEnvInfos()`: Знімок середовища виконання.

### 5.1 `defineMethod(name, fn, info?)`

`info` підтримує (усі необов'язкові):

- `description` / `detail` / `examples`
- `ref: string | { url: string; title?: string }`
- `params` / `returns` (у стилі JSDoc)

> Примітка: `getApiInfos()` виводить статичну документацію API і не включає такі поля, як `deprecated`, `disabled` або `disabledReason`.

Приклад: надання посилань на документацію для `ctx.refreshTargets()`.

```ts
ctx.defineMethod('refreshTargets', async () => {
  // ...
}, {
  description: 'Оновити дані цільових блоків',
  detail: '() => Promise<void>',
  ref: { url: 'https://docs.nocobase.com/', title: 'Документація' },
});
```

### 5.2 `defineProperty(key, { meta?, info? })`

- `meta`: Використовується для інтерфейсу вибору змінних (`getPropertyMetaTree` / `FlowContextSelector`). Визначає видимість, структуру дерева, відключення тощо (підтримує функції/async).
  - Загальні поля: `title` / `type` / `properties` / `sort` / `hidden` / `disabled` / `disabledReason` / `buildVariablesParams`
- `info`: Використовується для статичної документації API (`getApiInfos`) та описів для LLM. Не впливає на інтерфейс вибору змінних (підтримує функції/async).
  - Загальні поля: `title` / `type` / `interface` / `description` / `examples` / `ref` / `params` / `returns`

Коли надається лише `meta` (без `info`):

- `getApiInfos()` не повертатиме цей ключ (оскільки статична документація API не виводиться з `meta`).
- `getVarInfos()` побудує структуру змінних на основі `meta` (використовується для селекторів змінних/динамічних дерев змінних).

### 5.3 API інформації про контекст

Використовується для виведення «інформації про доступні можливості контексту».

```ts
type FlowContextInfosEnvNode = {
  description?: string;
  getVar?: string; // Може використовуватися безпосередньо в await ctx.getVar(getVar), рекомендується починати з "ctx."
  value?: any; // Роздільна статична величина (серіалізована, повертається лише коли її можна вивести)
  properties?: Record<string, FlowContextInfosEnvNode>;
};

type FlowContextApiInfos = Record<string, any>; // Статична документація (верхній рівень)
type FlowContextVarInfos = Record<string, any>; // Структура змінних (розгортається за path/maxDepth)
type FlowContextEnvInfos = {
  popup?: FlowContextInfosEnvNode;
  block?: FlowContextInfosEnvNode;
  flowModel?: FlowContextInfosEnvNode;
  resource?: FlowContextInfosEnvNode;
  record?: FlowContextInfosEnvNode;
  currentViewBlocks?: FlowContextInfosEnvNode;
};
```

Загальні параметри:

- `getApiInfos({ version })`: Версія документації RunJS (за замовчуванням `v1`).
- `getVarInfos({ path, maxDepth })`: Обрізка та максимальна глибина розгортання (за замовчуванням 3).

Примітка: Результати, що повертаються вищевказаними API, не містять функцій і придатні для прямої серіалізації для LLM.

### 5.4 `await ctx.getVar(path)`

Коли у вас є «рядок шляху до змінної» (наприклад, з конфігурації або введення користувача) і ви хочете отримати значення цієї змінної безпосередньо під час виконання, використовуйте `getVar`:

- Приклад: `const v = await ctx.getVar('ctx.record.roles.id')`
- `path` — це шлях виразу, що починається з `ctx.` (наприклад, `ctx.record.id` / `ctx.record.roles[0].id`).

Додатково: Методи або властивості, що починаються з підкреслення `_`, вважаються приватними членами і не з'являтимуться у виводі `getApiInfos()` або `getVarInfos()`.