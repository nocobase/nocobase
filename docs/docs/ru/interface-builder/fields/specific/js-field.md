:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/interface-builder/fields/specific/js-field).
:::

# JS Field

## Введение

JS Field используется для кастомного рендеринга содержимого в позиции поля с помощью JavaScript. Часто встречается в блоках деталей, элементах форм только для чтения или в «Других пользовательских элементах» столбцов таблицы. Подходит для персонализированного отображения, комбинирования производной информации, значков статуса, форматированного текста или диаграмм.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Типы

- Только для чтения: используется для нередактируемого отображения, считывает `ctx.value` для рендеринга вывода.
- Редактируемый: используется для пользовательского взаимодействия при вводе, предоставляет `ctx.getValue()`/`ctx.setValue(v)` и событие контейнера `js-field:value-change` для двусторонней синхронизации со значениями формы.

## Сценарии использования

- Только для чтения
  - Блок деталей: отображение результатов вычислений, значков статуса, фрагментов форматированного текста, диаграмм и другого содержимого только для чтения;
  - Блок таблицы: используется как «Другой пользовательский столбец > JS Field» для отображения только для чтения (если нужен столбец, не привязанный к полю, используйте JS Column);

- Редактируемый
  - Блок формы (CreateForm/EditForm): используется для пользовательских элементов управления вводом или составного ввода, проверяется и отправляется вместе с формой;
  - Подходящие сценарии: компоненты ввода из внешних библиотек, редакторы форматированного текста/кода, сложные динамические компоненты и т. д.;

## API контекста выполнения

Код JS Field во время выполнения может напрямую использовать следующие возможности контекста:

- `ctx.element`: DOM-контейнер поля (ElementProxy), поддерживает `innerHTML`, `querySelector`, `addEventListener` и т. д.;
- `ctx.value`: текущее значение поля (только для чтения);
- `ctx.record`: текущий объект записи (только для чтения);
- `ctx.collection`: метаинформация **коллекции**, к которой принадлежит поле (только для чтения);
- `ctx.requireAsync(url)`: асинхронная загрузка библиотеки AMD/UMD по URL;
- `ctx.importAsync(url)`: динамический импорт ESM-модуля по URL;
- `ctx.openView(options)`: открыть настроенное представление (всплывающее окно / выдвижная панель / страница);
- `ctx.i18n.t()` / `ctx.t()`: интернационализация;
- `ctx.onRefReady(ctx.ref, cb)`: рендеринг после готовности контейнера;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: встроенные React / ReactDOM / Ant Design / иконки Ant Design / dayjs / lodash / math.js / formula.js и другие общие библиотеки для рендеринга JSX, обработки времени, манипулирования данными и математических вычислений. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` по-прежнему сохранены для совместимости.)
- `ctx.render(vnode)`: рендерит React-элемент, HTML-строку или DOM-узел в контейнер по умолчанию `ctx.element`; повторный рендеринг будет повторно использовать Root и перезаписывать существующее содержимое контейнера.

Особенности редактируемого типа (JSEditableField):

- `ctx.getValue()`: получить текущее значение формы (приоритет отдается состоянию формы, затем свойствам поля).
- `ctx.setValue(v)`: установить значение формы и свойства поля, поддерживая двустороннюю синхронизацию.
- Событие контейнера `js-field:value-change`: срабатывает при изменении внешнего значения, что упрощает обновление отображения ввода скриптом.

## Редактор и фрагменты кода

Редактор скриптов JS Field поддерживает подсветку синтаксиса, подсказки об ошибках и встроенные фрагменты кода (Snippets).

- `Snippets`: открыть список встроенных фрагментов кода, которые можно найти и вставить в текущую позицию курсора одним щелчком.
- `Run`: напрямую запустить текущий код, журнал выполнения выводится на нижнюю панель `Logs`, поддерживается `console.log/info/warn/error` и подсветка ошибок для позиционирования.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

Можно комбинировать с AI-сотрудником для генерации кода:

- [AI-сотрудник · Nathan: Frontend-инженер](/ai-employees/features/built-in-employee)

## Общие способы использования

### 1) Базовый рендеринг (чтение значения поля)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) Использование JSX для рендеринга React-компонента

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) Загрузка сторонних библиотек (AMD/UMD или ESM)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) Нажатие для открытия всплывающего окна/выдвижной панели (openView)

```js
ctx.element.innerHTML = `<a class="open-detail">Посмотреть детали</a>`;
const a = ctx.element.querySelector('.open-detail');
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
a?.addEventListener('click', async () => {
  await ctx.openView('target-view-uid', {
    navigation: false,
    mode: 'drawer',
    dataSourceKey: ctx.collection?.dataSourceKey,
    collectionName: ctx.collection?.name,
    filterByTk: tk,
  });
});
```

### 5) Редактируемый ввод (JSEditableFieldModel)

```js
// Рендеринг простого поля ввода с помощью JSX и синхронизация значения формы
function InputView() {
  return (
    <input
      className="nb-js-editable"
      style={{ width: '100%', padding: '4px 8px' }}
      defaultValue={String(ctx.getValue() ?? '')}
      onInput={(e) => ctx.setValue(e.currentTarget.value)}
    />
  );
}

// Синхронизация ввода при изменении внешнего значения (необязательно)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## Примечания

- Загрузку внешних библиотек рекомендуется выполнять через надежные CDN и предусматривать обработку ошибок (например, `if (!lib) return;`).
- Для селекторов рекомендуется отдавать приоритет `class` или `[name=...]`, избегая использования фиксированных `id`, чтобы предотвратить дублирование `id` в нескольких блоках или всплывающих окнах.
- Очистка событий: поле может быть перерисовано несколько раз из-за изменения данных или переключения представлений. Перед привязкой событий следует выполнить очистку или дедупликацию, чтобы избежать повторных срабатываний. Можно использовать подход «сначала remove, затем add».