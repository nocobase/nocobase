# Колонка JS

## Введение

Колонка JS используется для пользовательских столбцов в таблицах: она отображает содержимое ячейки каждой строки с помощью JavaScript. Колонка не привязана к конкретному полю и подходит для таких сценариев, как вычисляемые столбцы, сводное отображение данных из нескольких полей, индикаторы статусов, кнопки действий и агрегация данных вне интерфейса таблицы.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## API контекста выполнения

При отрисовке каждой ячейки колонка JS предоставляет следующие возможности контекста:

- `ctx.element`: контейнер DOM текущей ячейки (ElementProxy), поддерживает `innerHTML`, `querySelector`, `addEventListener` и т.д.
- `ctx.record`: объект текущей записи строки (только для чтения).
- `ctx.recordIndex`: индекс строки на текущей странице (начинается с 0, может зависеть от пагинации).
- `ctx.collection`: метаданные коллекции, привязанной к таблице (только для чтения).
- `ctx.requireAsync(url)`: асинхронная загрузка библиотеки в формате AMD или UMD по URL.
- `ctx.importAsync(url)`: динамический импорт модуля в формате ES-модулей по URL.
- `ctx.openView(options)`: открывает настроенный элемент просмотра (модальное окно, выдвижной блок или страницу).
- `ctx.i18n.t()` / `ctx.t()`: интернационализация.
- `ctx.onRefReady(ctx.ref, cb)`: вызывает отрисовку после готовности контейнера.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: встроенные библиотеки React, ReactDOM, Ant Design, иконки Ant Design, dayjs, lodash, math.js и formula.js для разметки на JSX, работы с датой и временем, обработки данных и вычислений. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` сохранены для совместимости.)
- `ctx.render(vnode)`: отрисовывает элемент на React, разметку HTML или узел дерева документа в контейнер по умолчанию `ctx.element` (текущая ячейка). При нескольких вызовах создаётся новый корень и перезаписывается содержимое контейнера.

## Редактор и сниппеты

Редактор сценариев для колонки JS поддерживает подсветку синтаксиса, подсказки по ошибкам и встроенные сниппеты кода.

- **Сниппеты**: открывает список встроенных сниппетов — можно искать и вставлять их в позицию курсора одним щелчком.
- **Запуск**: выполняет текущий код напрямую. Вывод выполнения показывается на панели **Журнал** внизу; поддерживаются вызовы `console.log`, `console.info`, `console.warn`, `console.error` и подсветка ошибок.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

Также можно использовать ИИ-сотрудника для генерации кода:

- [ИИ-сотрудник · Nathan: инженер фронтенда](/ai-employees/features/built-in-employee)

## Типовое использование

### 1) Базовый рендеринг (чтение текущей записи строки)

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

### 3) Открыть модальное окно или выдвижной блок из ячейки (просмотр или редактирование)

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

### 4) Загрузка сторонних библиотек (AMD, UMD или ES-модули)

```js
// AMD/UMD
const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const items = _.take(Object.keys(ctx.record || {}), 3);
ctx.render(<code>{items.join(', ')}</code>);

// ES-модули
const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
ctx.render(<span>{dayjs().format('YYYY-MM-DD')}</span>);
```

## Примечания

- Рекомендуется использовать доверенную сеть доставки контента для загрузки внешних библиотек и предусмотреть запасной сценарий на случай ошибок (например, `if (!lib) return;`).
- Рекомендуется использовать селекторы по атрибуту `class` или `[name=...]` вместо фиксированных `id`, чтобы избежать дублирования идентификаторов в разных блоках или модальных окнах.
- Очистка событий: строки таблицы могут динамически меняться при постраничном выводе или обновлении, из-за чего ячейки могут перерисовываться несколько раз. Перед привязкой обработчиков событий очистите их или исключите дубликаты, чтобы избежать повторных срабатываний.
- Совет по производительности: избегайте повторной загрузки крупных библиотек в каждой ячейке. Лучше кэшировать библиотеку на более высоком уровне (например, с помощью глобальной или табличной переменной) и переиспользовать её.