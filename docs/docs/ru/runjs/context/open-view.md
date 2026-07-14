# ctx.openView()

Открывает сконфигурированное представление (выдвижной блок, диалоговое окно, встраивание и т. п.) программно. Предоставляется `FlowModelContext`; используется в JS-блоке, ячейках таблицы, потоке событий и т. д. для открытия представлений `ChildPage` или `PopupAction`.

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **JS-блок** | Кнопка открывает диалог подробностей или редактирования; передайте текущую строку через `filterByTk` |
| **Ячейка таблицы** | Кнопка в ячейке открывает диалог подробностей строки |
| **Поток событий / Действие JS** | Открывает следующее представление или диалог после успешного выполнения действия |
| **Поле связи** | `ctx.runAction('openView', params)` для диалога выбора или редактирования |

> `ctx.openView` требует контекст `FlowModel`; если для `uid` не существует модели, создаётся и сохраняется `PopupActionModel`.

## Сигнатура

```ts
openView(uid: string, options?: OpenViewOptions): Promise<void>
```

## Параметры

### uid

Уникальный `uid` модели представления. Если он отсутствует, он создаётся и сохраняется. Используйте стабильный `uid` (например, `${ctx.model.uid}-detail`), чтобы то же всплывающее окно можно было переиспользовать.

### options (общие поля)

| Поле | Тип | Описание |
|------|-----|----------|
| `mode` | `drawer` / `dialog` / `embed` | Как открыть: выдвижной блок, диалоговое окно, встраивание; по умолчанию `drawer` |
| `size` | `small` / `medium` / `large` | Размер диалогового окна или выдвижного блока; по умолчанию `medium` |
| `title` | `string` | Заголовок представления |
| `params` | `Record<string, any>` | Произвольные параметры, передаваемые представлению |
| `filterByTk` | `any` | Первичный ключ для детализации или редактирования одной записи |
| `sourceId` | `string` | ID исходной записи (ассоциации) |
| `dataSourceKey` | `string` | Источник данных |
| `collectionName` | `string` | Имя коллекции |
| `associationName` | `string` | Имя поля ассоциации |
| `navigation` | `boolean` | Использовать навигацию по маршрутам; принудительно `false`, когда передаются `defineProperties` / `defineMethods` |
| `preventClose` | `boolean` | Запрет закрытия |
| `defineProperties` | `Record<string, PropertyOptions>` | Внедрить свойства в модели представления |
| `defineMethods` | `Record<string, Function>` | Внедрить методы в модели представления |

## Примеры

### Базовое открытие в выдвижном блоке

```ts
const popupUid = `${ctx.model.uid}-detail`;
await ctx.openView(popupUid, {
  mode: 'drawer',
  size: 'medium',
  title: ctx.t('Detail'),
});
```

### Передача контекста текущей строки

```ts
const primaryKey = ctx.collection?.primaryKey || 'id';
await ctx.openView(`${ctx.model.uid}-1`, {
  mode: 'dialog',
  title: ctx.t('Row detail'),
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Открытие через runAction

Когда у модели есть действие `openView` (например, поле ассоциации, кликабельное поле):

```ts
await ctx.runAction('openView', {
  navigation: false,
  mode: 'dialog',
  collectionName: 'users',
  filterByTk: ctx.record?.id,
});
```

### Внедрение пользовательского контекста

```ts
await ctx.openView(`${ctx.model.uid}-edit`, {
  mode: 'drawer',
  filterByTk: ctx.record?.id,
  defineProperties: {
    onSaved: {
      get: () => () => ctx.resource?.refresh?.(),
      cache: false,
    },
  },
});
```

## Связь с `ctx.viewer` и `ctx.view`

| Задача | Рекомендуется |
|--------|----------------|
| **Открыть сконфигурированное представление потока** | `ctx.openView(uid, options)` |
| **Открыть пользовательский контент (без потока)** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` |
| **Управлять текущим представлением** | `ctx.view.close()`, `ctx.view.inputArgs` |

`ctx.openView` открывает `FlowPage` (`ChildPageModel`) с полным рабочим потоком; `ctx.viewer` открывает произвольный React-контент.

## Примечания

- Предпочитайте `uid`, связанные с `ctx.model.uid` (например, `${ctx.model.uid}-xxx`), чтобы избежать конфликтов между блоками.
- При передаче `defineProperties` / `defineMethods` параметр `navigation` принудительно выставляется в `false`, чтобы контекст не терялся при обновлении страницы.
- Внутри всплывающего окна `ctx.view` — это текущее представление, а `ctx.view.inputArgs` содержит параметры, переданные при открытии.

## Связанные материалы

- [ctx.view](./view.md): текущий экземпляр представления
- [ctx.model](./model.md): текущая модель; используйте для стабильного `popupUid`