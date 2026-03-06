:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/interface-builder/fields/specific/js-column).
:::

# JS Column

## Введение

JS Column используется для «пользовательских колонок» в таблицах, визуализируя содержимое ячеек каждой строки с помощью JavaScript. Он не привязан к конкретному полю и подходит для таких сценариев, как производные колонки, комбинированное отображение данных из разных полей, значки статуса, кнопки действий, агрегация удаленных данных и т. д.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## Контекстный API времени выполнения

При рендеринге каждой ячейки JS Column предоставляет следующие возможности контекста:

- `ctx.element`: DOM-контейнер текущей ячейки (ElementProxy), поддерживающий `innerHTML`, `querySelector`, `addEventListener` и т. д.;
- `ctx.record`: Объект записи текущей строки (только для чтения);
- `ctx.recordIndex`: Индекс строки внутри текущей страницы (начинается с 0, может зависеть от пагинации);
- `ctx.collection`: Метаинформация коллекции, привязанной к таблице (только для чтения);
- `ctx.requireAsync(url)`: Асинхронная загрузка библиотек AMD/UMD по URL;
- `ctx.importAsync(url)`: Динамический импорт ESM-модулей по URL;
- `ctx.openView(options)`: Открытие настроенного представления (модальное окно/выдвижная панель/страница);
- `ctx.i18n.t()` / `ctx.t()`: Интернационализация;
- `ctx.onRefReady(ctx.ref, cb)`: Рендеринг после готовности контейнера;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Встроенные React / ReactDOM / Ant Design / Иконки Ant Design / dayjs / lodash / math.js / formula.js и другие общие библиотеки для рендеринга JSX, обработки времени, манипулирования данными и математических вычислений. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` по-прежнему сохранены для совместимости.)
- `ctx.render(vnode)`: Рендерит React-элемент/HTML/DOM в контейнер по умолчанию `ctx.element` (текущая ячейка). При многократном рендеринге будет повторно использоваться Root, перезаписывая существующее содержимое контейнера.

## Редактор и сниппеты

Редактор скриптов JS Column поддерживает подсветку синтаксиса, подсказки об ошибках и встроенные фрагменты кода (Snippets).

- `Snippets`: Открывает список встроенных фрагментов кода, которые можно искать и вставлять в текущую позицию курсора одним щелчком мыши.
- `Run`: Прямой запуск текущего кода, журнал выполнения выводится на нижнюю панель `Logs`, поддерживается `console.log/info/warn/error` и подсветка ошибок.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

Можно комбинировать с AI-сотрудниками для генерации кода:

- [AI-сотрудник · Nathan: Фронтенд-инженер](/ai-employees/features/built-in-employee)

## Типовое использование

### 1) Базовый рендеринг (чтение записи текущей строки)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) Использование JSX для рендеринга React-компонентов

```js
const { Tag } = ctx.libs.antd;
const status = ctx.record?.status ?? 'unknown';
const color = status === 'active' ? 'green' : status === 'blocked' ? 'red' : 'default';
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={color}>{String(status)}</Tag>
  </div>
);
```

### 3) Открытие модального окна/выдвижной панели в ячейке (просмотр/редактирование)

```js
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
ctx.render(
  <a onClick={async () => {
    await ctx.openView('target-view-uid', {
      navigation: false,
      mode: 'drawer',
      dataSourceKey: ctx.collection?.dataSourceKey,
      collectionName: ctx.collection?.name,
      filterByTk: tk,
    });
  }}>Просмотр</a>
);
```

### 4) Загрузка сторонних библиотек (AMD/UMD или ESM)

```js
// AMD/UMD
const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const items = _.take(Object.keys(ctx.record || {}), 3);
ctx.render(<code>{items.join(', ')}</code>);

// ESM
const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
ctx.render(<span>{dayjs().format('YYYY-MM-DD')}</span>);
```

## Примечания

- Для загрузки внешних библиотек рекомендуется использовать надежные CDN и предусматривать запасные варианты на случай сбоя (например, `if (!lib) return;`).
- Для селекторов рекомендуется отдавать предпочтение `class` или `[name=...]`, избегая использования фиксированных `id`, чтобы предотвратить дублирование `id` в нескольких блоках/модальных окнах.
- Очистка событий: Строки таблицы могут динамически меняться в зависимости от пагинации/обновления, и ячейки будут рендериться многократно. Перед привязкой событий следует очистить их или устранить дубликаты, чтобы избежать повторных срабатываний.
- Рекомендация по производительности: Избегайте повторной загрузки больших библиотек в каждой ячейке; следует кэшировать библиотеки на верхнем уровне (например, через глобальные переменные или переменные уровня таблицы) для последующего повторного использования.