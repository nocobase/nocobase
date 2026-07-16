# Действие JS

## Введение

Действие JS используется для выполнения JavaScript при нажатии кнопки — это позволяет реализовывать пользовательскую бизнес-логику. Его можно применять в тулбарах инструментов формы, тулбарах таблицы (на уровне коллекции), строках таблицы (на уровне записи) и в других местах, чтобы выполнять задачи вроде валидации, отображения уведомлений, вызовов API, открытия всплывающего окна/выдвижного блока и обновления данных.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## API среды выполнения (частоиспользуемые)

- `ctx.api.request(options)`: выполняет HTTP-запрос.
- `ctx.openView(viewUid, options)`: открывает настроенный элемент отображения (выдвижной блок/диалог/страница).
- `ctx.message` / `ctx.notification`: глобальные сообщения и уведомления.
- `ctx.t()` / `ctx.i18n.t()`: международные строки (i18n).
- `ctx.resource`: data resource для контекста уровня коллекции (например, тулбар таблицы), включая методы вроде `getSelectedRows()` и `refresh()`.
- `ctx.record`: текущая запись строки для контекста уровня записи (например, кнопка в строке таблицы).
- `ctx.form`: экземпляр AntD Form для контекста формы (например, кнопка в тулбаре формы).
- `ctx.collection`: метаданные текущей коллекции.
- Редактор кода поддерживает `Сниппеты` и `Запуск` для предварительного выполнения (см. ниже).

- `ctx.requireAsync(url)`: асинхронно загружает библиотеку AMD/UMD по URL.
- `ctx.importAsync(url)`: динамически импортирует ESM-модуль по URL.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: встроенные библиотеки React, ReactDOM, Ant Design, иконки Ant Design, dayjs, lodash, math.js и formula.js для JSX-рендеринга, утилит для работы с датой-временем, манипуляций с данными и математических операций.

> Набор реально доступных переменных может отличаться в зависимости от расположения кнопки. Список выше — обзор типовых возможностей.

## Редактор и сниппеты

- `Сниппеты`: открывает список встроенных фрагментов кода, который можно искать и вставлять в текущую позицию курсора одним кликом.
- `Запуск`: выполняет текущий код напрямую и выводит журналы выполнения в панель `Логи` снизу. Поддерживает `console.log/info/warn/error` и подсвечивает ошибки для удобного поиска.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

Вы можете использовать ИИ-сотрудников для генерации/модификации скриптов: [ИИ-сотрудник · Nathan: инженер фронтенда](/ai-employees/features/built-in-employee)

## Типовое использование (упрощенные примеры)

### 1. Запрос к API и уведомление

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2. Кнопка коллекции: валидация выбора и обработка

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: Implement business logic...
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3. Кнопка записи: чтение текущей строки

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4. Открыть представление (выдвижной блок/диалог)

```js
const popupUid = ctx.model.uid + '-open'; // Bind to the current button for stability
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5. Обновить данные после отправки

```js
// Общий refresh: сначала приоритет у table/list ресурсов, затем у ресурса блока, содержащего форму
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```


## Примечания

- **Идемпотентные действия**: чтобы предотвратить несколько отправок при повторных кликах, можно добавить флаг состояния в вашу логику или отключить кнопку.
- **Обработка ошибок**: оборачивайте вызовы API в `try/catch` и возвращайте пользователю понятные сообщения.
- **Взаимодействие с представлением**: при открытии всплывающего окна/выдвижного блока через `ctx.openView` рекомендуется передавать параметры явно и, при необходимости, после успешной отправки активно обновлять родительский ресурс.

## Связанные документы

- [Переменные и контекст](/interface-builder/variables)
- [Правила связывания](/interface-builder/linkage-rule)
- [Представления и всплывающие окна](/interface-builder/actions/types/view)