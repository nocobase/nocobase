# Элемент JS

## Введение

Элемент JS используется для пользовательских элементов (не привязанных к полю) в форме. С помощью JavaScript и JSX можно отрисовать любое содержимое (например, подсказки, статистику, предпросмотр, кнопки и т. д.), а также работать с контекстом формы и записи. Подходит для сценариев вроде предпросмотра в реальном времени, обучающих подсказок и небольших интерактивных компонентов.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## API контекста выполнения

- `ctx.element`: объект-контейнер текущего элемента в дереве разметки (`ElementProxy`); поддерживаются `innerHTML`, `querySelector`, `addEventListener` и т. д.
- `ctx.form`: экземпляр формы Ant Design — операции вроде `getFieldValue` / `getFieldsValue` / `setFieldsValue` / `validateFields` и т. д.
- `ctx.blockModel`: модель блока формы, к которому относится элемент; можно подписаться на `formValuesChange` для реакции на изменение значений (связывание с формой).
- `ctx.record` / `ctx.collection`: текущая запись и метаданные коллекции (доступно не во всех сценариях).
- `ctx.requireAsync(url)`: асинхронная загрузка библиотеки в формате AMD или UMD по URL.
- `ctx.importAsync(url)`: динамический импорт модуля в формате ES-модулей по URL.
- `ctx.openView(viewUid, options)`: открывает настроенный элемент просмотра (всплывающее окно, выдвижной блок или страницу).
- `ctx.message` / `ctx.notification`: глобальные сообщения и уведомления.
- `ctx.t()` / `ctx.i18n.t()`: интернационализация.
- `ctx.onRefReady(ctx.ref, cb)`: вызывает отрисовку после готовности контейнера.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: встроенные библиотеки React, ReactDOM, Ant Design, иконки Ant Design, dayjs, lodash, math.js и formula.js для разметки на JSX, работы с датой и временем, обработки данных и вычислений. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` сохранены для совместимости.)
- `ctx.render(vnode)`: отрисовывает элемент на React, разметку HTML или узел дерева документа в контейнер по умолчанию `ctx.element`. При нескольких вызовах снова используется корень и перезаписывается содержимое контейнера.

## Редактор и сниппеты

- **Сниппеты**: открывает список встроенных сниппетов — можно искать и вставлять их в позицию курсора одним щелчком.
- **Запуск**: выполняет текущий код напрямую. Вывод выполнения показывается на панели **Журнал** внизу; поддерживаются вызовы `console.log`, `console.info`, `console.warn`, `console.error` и подсветка ошибок.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- Можно использовать ИИ-сотрудника для генерации или правки сценариев: [ИИ-сотрудник · Nathan: инженер фронтенда](/ai-employees/features/built-in-employee)

## Типовое использование

### 1) Предпросмотр в реальном времени (чтение значений формы)

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

### 2) Просмотр (выдвижной блок)

```js
ctx.render(
  <a onClick={async () => {
    const popupUid = ctx.model.uid + '-preview';
    await ctx.openView(popupUid, { mode: 'drawer', title: 'Предпросмотр', size: 'large' });
  }}>
    Открыть предпросмотр
  </a>
);
```

### 3) Загрузка и рендер сторонних библиотек

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ES-модули
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## Примечания

- Рекомендуется использовать доверенную сеть доставки контента для загрузки внешних библиотек и предусмотреть запасной сценарий на случай ошибок (например, `if (!lib) return;`).
- Рекомендуется использовать селекторы по атрибуту `class` или `[name=...]` вместо фиксированных `id`, чтобы избежать дублирования идентификаторов в разных блоках или модальных окнах.
- Очистка событий: частые изменения значений формы могут вызывать множественные отрисовки. Перед привязкой обработчика очищайте подписки или исключайте дубликаты (например, вызывайте `remove` перед `add`, используйте `{ once: true }` или атрибут `dataset`, чтобы не допускать повторов).

## Связанные документы

- [Переменные и контекст](/interface-builder/variables)
- [Правила связывания](/interface-builder/linkage-rule)
- [Просмотр и всплывающие окна](/interface-builder/actions/types/view)