:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/runjs/context/filter-manager).
:::

# ctx.filterManager

Менеджер соединений фильтров, используемый для управления связями фильтрации между формами фильтрации (FilterForm) и блоками данных (таблицы, списки, диаграммы и т. д.). Предоставляется `BlockGridModel` и доступен только в его контексте (например, в блоках форм фильтрации или блоках данных).

## Сценарии использования

| Сценарий | Описание |
|------|------|
| **Блок формы фильтрации** | Управляет конфигурациями соединений между элементами фильтра и целевыми блоками; обновляет целевые данные при изменении фильтров. |
| **Блок данных (таблица/список)** | Выступает в качестве цели фильтрации, привязывая условия фильтра через `bindToTarget`. |
| **Правила связки / Пользовательская FilterModel** | Вызывает `refreshTargetsByFilter` внутри `doFilter` или `doReset` для запуска обновления целевых блоков. |
| **Конфигурация полей соединения** | Использует `getConnectFieldsConfig` и `saveConnectFieldsConfig` для поддержки сопоставления полей между фильтрами и целями. |

> Примечание: `ctx.filterManager` доступен только в контекстах RunJS, имеющих `BlockGridModel` (например, внутри страницы, содержащей форму фильтрации); в обычных JSBlock или на независимых страницах он имеет значение `undefined`. Перед обращением рекомендуется использовать опциональную цепочку.

## Определение типов

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;   // UID модели фильтра
  targetId: string;   // UID модели целевого блока данных
  filterPaths?: string[];  // Пути к полям целевого блока
  operator?: string;  // Оператор фильтрации
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## Общие методы

| Метод | Описание |
|------|------|
| `getFilterConfigs()` | Получает все текущие конфигурации соединений фильтров. |
| `getConnectFieldsConfig(filterId)` | Получает конфигурацию полей соединения для конкретного фильтра. |
| `saveConnectFieldsConfig(filterId, config)` | Сохраняет конфигурацию полей соединения для фильтра. |
| `addFilterConfig(config)` | Добавляет конфигурацию фильтра (filterId + targetId + filterPaths). |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | Удаляет конфигурации фильтров по filterId, targetId или обоим параметрам. |
| `bindToTarget(targetId)` | Привязывает конфигурацию фильтра к целевому блоку, заставляя его ресурс (resource) применить фильтр. |
| `unbindFromTarget(targetId)` | Отвязывает фильтр от целевого блока. |
| `refreshTargetsByFilter(filterId | filterId[])` | Обновляет данные связанных целевых блоков на основе фильтра(ов). |

## Основные концепции

- **FilterModel**: Модель, предоставляющая условия фильтрации (например, FilterFormItemModel), которая должна реализовывать метод `getFilterValue()` для возврата текущего значения фильтра.
- **TargetModel**: Блок данных, подвергающийся фильтрации; его `resource` должен поддерживать методы `addFilterGroup`, `removeFilterGroup` и `refresh`.

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

### Конфигурация полей соединения

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

## Связанные разделы

- [ctx.resource](./resource.md): Ресурс целевого блока должен поддерживать интерфейс фильтрации.
- [ctx.model](./model.md): Используется для получения UID текущей модели для filterId / targetId.