:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/interface-builder/actions/types/js-action).
:::

# JS Action

## Введение

JS Action используется для выполнения JavaScript при нажатии кнопки и настройки любого бизнес-поведения. Его можно использовать в панелях инструментов форм, панелях инструментов таблиц (уровень коллекции), строках таблиц (уровень записи) и других местах для реализации валидации, подсказок, вызовов интерфейсов, открытия всплывающих окон/боковых панелей, обновления данных и других операций.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## API контекста выполнения (часто используемые)

- `ctx.api.request(options)`: выполнение HTTP-запроса;
- `ctx.openView(viewUid, options)`: открытие настроенного представления (боковая панель/диалоговое окно/страница);
- `ctx.message` / `ctx.notification`: глобальные подсказки и уведомления;
- `ctx.t()` / `ctx.i18n.t()`: интернационализация;
- `ctx.resource`: ресурс данных контекста уровня коллекции (например, панель инструментов таблицы, включает `getSelectedRows()`, `refresh()` и т. д.);
- `ctx.record`: текущая запись строки в контексте уровня записи (например, кнопка в строке таблицы);
- `ctx.form`: экземпляр AntD Form в контексте уровня формы (например, кнопка на панели инструментов формы);
- `ctx.collection`: метаинформация текущей коллекции;
- Редактор кода поддерживает фрагменты `Snippets` и предварительный запуск `Run` (см. ниже).

- `ctx.requireAsync(url)`: асинхронная загрузка библиотек AMD/UMD по URL;
- `ctx.importAsync(url)`: динамический импорт модулей ESM по URL;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: встроенные библиотеки React / ReactDOM / Ant Design / иконки Ant Design / dayjs / lodash / math.js / formula.js и другие общие библиотеки для рендеринга JSX, обработки времени, манипуляций с данными и математических вычислений.

> Фактически доступные переменные могут различаться в зависимости от расположения кнопки, выше представлен обзор общих возможностей.

## Редактор и фрагменты кода

- `Snippets`: открывает список встроенных фрагментов кода, которые можно искать и вставлять в текущую позицию курсора одним щелчком мыши.
- `Run`: запускает текущий код напрямую и выводит логи выполнения в панель `Logs` внизу; поддерживает `console.log/info/warn/error` и подсветку ошибок для позиционирования.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- Можно комбинировать с AI-сотрудником для генерации/изменения скриптов: [AI-сотрудник · Nathan: Фронтенд-инженер](/ai-employees/features/built-in-employee)

## Распространенные способы использования (краткие примеры)

### 1) Запрос к интерфейсу и подсказка

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) Кнопка коллекции: валидация выбора и обработка

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: Выполнение бизнес-логики…
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) Кнопка записи: чтение текущей записи строки

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) Открытие представления (боковая панель/диалоговое окно)

```js
const popupUid = ctx.model.uid + '-open'; // Привязка к текущей кнопке для стабильности
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) Обновление данных после отправки

```js
// Общее обновление: приоритет отдается ресурсам таблицы/списка, затем ресурсу блока, в котором находится форма
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```


## Примечания

- Идемпотентность действий: избегайте многократных отправок из-за повторных нажатий, вы можете добавить переключатель состояния в логику или отключить кнопку.
- Обработка ошибок: добавляйте try/catch для вызовов интерфейсов и выводите подсказки пользователю.
- Взаимодействие представлений: при открытии всплывающих окон/боковых панелей через `ctx.openView` рекомендуется явно передавать параметры и при необходимости активно обновлять родительский ресурс после успешной отправки.

## Связанные документы

- [Переменные и контекст](/interface-builder/variables)
- [Правила связки](/interface-builder/linkage-rule)
- [Представления и всплывающие окна](/interface-builder/actions/types/view)