# ctx.filterManager

Менеджер связей фильтров, который соединяет формы фильтра (FilterForm) с блоками данных (таблицы, списки, графики и т. д.). Предоставляется `BlockGridModel` и доступен только в этом контексте (например, на страницах с блоком формы фильтра).

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **Блок формы фильтра** | Управление связями между элементами фильтра и целевыми блоками; обновление целей при изменении фильтра |
| **Блок данных (таблица/список)** | Работа в роли цели фильтра; привязка условий фильтра через `bindToTarget` |
| **Связывание / пользовательский FilterModel** | В `doFilter`, `doReset` вызов `refreshTargetsByFilter` для обновления целей |
| **Конфигурация связанных полей** | Использование `getConnectFieldsConfig`, `saveConnectFieldsConfig` для сопоставления полей фильтра и цели |

> **Примечание**: `ctx.filterManager` доступен только в контекстах RunJS с `BlockGridModel` (например, на страницах с формой фильтра). В обычном **JS-блоке** или на автономной странице это может быть `undefined` — проверяйте перед использованием.

## Тип

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;
  targetId: string;
  filterPaths?: string[];
  operator?: string;
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## Основные методы

| Метод | Описание |
|-------|----------|
| `getFilterConfigs()` | Получить все конфигурации связей фильтра |
| `getConnectFieldsConfig(filterId)` | Получить конфигурацию связанных полей для фильтра |
| `saveConnectFieldsConfig(filterId, config)` | Сохранить конфигурацию связанных полей для фильтра |
| `addFilterConfig(config)` | Добавить конфигурацию фильтра (filterId + targetId + filterPaths) |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | Удалить конфигурацию по filterId и/или targetId |
| `bindToTarget(targetId)` | Привязать фильтр к целевому блоку; фильтр применяется к ресурсу цели |
| `unbindFromTarget(targetId)` | Отвязать фильтр от цели |
| `refreshTargetsByFilter(filterId or filterId[])` | Обновить целевой блок(и) по фильтру |

## Понятия

- **FilterModel**: предоставляет значения фильтра (например, FilterFormItemModel); должен реализовывать `getFilterValue()`.
- **TargetModel**: блок данных, к которому применяется фильтр; его `resource` должен поддерживать `addFilterGroup`, `removeFilterGroup`, `refresh`.

## Примеры

### Добавление конфигурации фильтра

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### Обновление целевых блоков

```ts
// В doFilter / doReset формы фильтрации
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

// Обновление целей, связанных с несколькими фильтрами
ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### Конфигурация связанных полей

```ts
// Получение конфигурации соединения
const config = ctx.filterManager?.getConnectFieldsConfig(ctx.model.uid);

// Сохранение конфигурации соединения
await ctx.filterManager?.saveConnectFieldsConfig(ctx.model.uid, {
  targets: [
    { targetId: 'table-uid', filterPaths: ['status'] },
    { targetId: 'chart-uid', filterPaths: ['category'] },
  ],
});
```

### Удаление конфигурации

```ts
// Удаление всех конфигураций для конкретного фильтра
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

// Удаление всех конфигураций фильтров для конкретной цели
await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## Связанные материалы

- [ctx.resource](./resource.md): ресурс целевого блока должен поддерживать API фильтра
- [ctx.model](./model.md): uid текущей модели для filterId / targetId