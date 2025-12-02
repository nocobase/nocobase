:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# JS-элемент

## Введение

JS-элемент используется для «пользовательских элементов» (не привязанных к полям) в форме. Вы можете использовать JavaScript/JSX для рендеринга любого содержимого (например, подсказок, статистики, предварительного просмотра, кнопок и т. д.) и взаимодействия с формой и контекстом записи. Он подходит для таких сценариев, как предварительный просмотр в реальном времени, информационные подсказки и небольшие интерактивные компоненты.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## API контекста выполнения (основные)

- `ctx.element`: Контейнер DOM (ElementProxy) текущего элемента, поддерживающий `innerHTML`, `querySelector`, `addEventListener` и т. д.
- `ctx.form`: Экземпляр формы AntD, позволяющий выполнять такие операции, как `getFieldValue / getFieldsValue / setFieldsValue / validateFields` и т. д.
- `ctx.blockModel`: Модель блока формы, к которому он принадлежит, способная прослушивать `formValuesChange` для реализации связывания.
- `ctx.record` / `ctx.collection`: Текущая запись и метаданные коллекции (доступно в некоторых сценариях).
- `ctx.requireAsync(url)`: Асинхронная загрузка библиотеки AMD/UMD по URL.
- `ctx.importAsync(url)`: Динамический импорт модуля ESM по URL.
- `ctx.openView(viewUid, options)`: Открытие настроенного представления (выдвижная панель/диалоговое окно/страница).
- `ctx.message` / `ctx.notification`: Глобальные сообщения и уведомления.
- `ctx.t()` / `ctx.i18n.t()`: Интернационализация.
- `ctx.onRefReady(ctx.ref, cb)`: Рендеринг после готовности контейнера.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Встроенные библиотеки React, ReactDOM, Ant Design, Ant Design icons и dayjs для рендеринга JSX и работы с датами/временем. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` сохранены для совместимости.)
- `ctx.render(vnode)`: Отображает элемент React/HTML/DOM в контейнере по умолчанию `ctx.element`. Многократный рендеринг будет повторно использовать Root и перезаписывать существующее содержимое контейнера.

## Редактор и сниппеты

- `Snippets`: Открывает список встроенных сниппетов кода, позволяя искать и вставлять их в текущую позицию курсора одним щелчком.
- `Run`: Непосредственно выполняет текущий код и выводит журналы выполнения на панель `Logs` внизу. Поддерживает `console.log/info/warn/error` и подсветку ошибок.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- Может использоваться с AI-сотрудником для генерации/изменения скриптов: [AI-сотрудник · Натан: Frontend-инженер](/ai-employees/built-in/ai-coding)

## Распространенные сценарии использования (упрощенные примеры)

### 1) Предварительный просмотр в реальном времени (чтение значений формы)

```js
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  ctx.render(
    <div style={{ padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
      <div style={{ fontWeight: 600, color: '#389e0d' }}>{ctx.t('Payable:')} ¥{(final || 0).toFixed(2)}</div>
    </div>
  );
};
render();
ctx.blockModel?.on?.('formValuesChange', () => render());
```

### 2) Открытие представления (выдвижная панель)

```js
ctx.render(
  <a onClick={async () => {
    const popupUid = ctx.model.uid + '-preview';
    await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Preview'), size: 'large' });
  }}>
    {ctx.t('Open preview')}
  </a>
);
```

### 3) Загрузка и рендеринг внешних библиотек

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## Примечания

- Для загрузки внешних библиотек рекомендуется использовать доверенные CDN, а в случае сбоя необходимо предусмотреть запасной вариант (например, `if (!lib) return;`).
- Для селекторов рекомендуется отдавать предпочтение `class` или `[name=...]` и избегать использования фиксированных `id`, чтобы предотвратить дублирование `id` в нескольких блоках/всплывающих окнах.
- Очистка событий: Частые изменения значений формы могут вызывать многократный рендеринг. Перед привязкой события его следует очистить или дедуплицировать (например, сначала `remove`, затем `add`, или использовать `{ once: true }`, или метку `dataset` для предотвращения дублирования).

## Связанная документация

- [Переменные и контекст](/interface-builder/variables)
- [Правила связывания](/interface-builder/linkage-rule)
- [Представления и всплывающие окна](/interface-builder/actions/types/view)