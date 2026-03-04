:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/runjs/context/filter-manager).
:::

# ctx.filterManager

Менеджер з'єднань фільтрів використовується для керування зв'язками між формами фільтрації (FilterForm) та блоками даних (таблиці, списки, діаграми тощо). Він надається `BlockGridModel` і доступний лише в її контексті (наприклад, у блоках форм фільтрації або блоках даних).

## Сценарії застосування

| Сценарій | Опис |
|------|------|
| **Блок форми фільтрації** | Керує конфігураціями з'єднання між елементами фільтра та цільовими блоками; оновлює цільові дані при зміні фільтрів. |
| **Блок даних (таблиця/список)** | Виступає як ціль фільтрації, прив'язуючи умови фільтрації через `bindToTarget`. |
| **Правила зв'язку / Спеціальна FilterModel** | Викликає `refreshTargetsByFilter` у `doFilter` або `doReset` для запуску оновлення цілі. |
| **Конфігурація полів з'єднання** | Використовує `getConnectFieldsConfig` та `saveConnectFieldsConfig` для підтримки зіставлення полів між фільтрами та цілями. |

> Примітка: `ctx.filterManager` доступний лише в контекстах RunJS, які мають `BlockGridModel` (наприклад, на сторінці, що містить форму фільтрації); він має значення `undefined` у звичайних JS-блоках або на незалежних сторінках. Перед доступом рекомендується використовувати оператор опціонального ланцюжка.

## Визначення типів

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;   // UID моделі фільтра
  targetId: string;   // UID моделі цільового блоку даних
  filterPaths?: string[];  // Шляхи полів цільового блоку
  operator?: string;  // Оператор фільтрації
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## Основні методи

| Метод | Опис |
|------|------|
| `getFilterConfigs()` | Отримує всі поточні конфігурації з'єднань фільтрів. |
| `getConnectFieldsConfig(filterId)` | Отримує конфігурацію полів з'єднання для конкретного фільтра. |
| `saveConnectFieldsConfig(filterId, config)` | Зберігає конфігурацію полів з'єднання для фільтра. |
| `addFilterConfig(config)` | Додає конфігурацію фільтра (filterId + targetId + filterPaths). |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | Видаляє конфігурації фільтрів за filterId, targetId або обома. |
| `bindToTarget(targetId)` | Прив'язує конфігурацію фільтра до цільового блоку, змушуючи його ресурс застосувати фільтр. |
| `unbindFromTarget(targetId)` | Відв'язує фільтр від цільового блоку. |
| `refreshTargetsByFilter(filterId | filterId[])` | Оновлює дані пов'язаних цільових блоків на основі фільтра(ів). |

## Основні концепції

- **FilterModel**: Модель, що надає умови фільтрації (наприклад, FilterFormItemModel), яка повинна реалізовувати `getFilterValue()` для повернення поточного значення фільтра.
- **TargetModel**: Блок даних, що фільтрується; його `resource` повинен підтримувати `addFilterGroup`, `removeFilterGroup` та `refresh`.

## Приклади

### Додавання конфігурації фільтра

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### Оновлення цільових блоків

```ts
// У doFilter / doReset форми фільтрації
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

// Оновлення цілей, пов'язаних з кількома фільтрами
ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### Конфігурація полів з'єднання

```ts
// Отримання конфігурації з'єднання
const config = ctx.filterManager?.getConnectFieldsConfig(ctx.model.uid);

// Збереження конфігурації з'єднання
await ctx.filterManager?.saveConnectFieldsConfig(ctx.model.uid, {
  targets: [
    { targetId: 'table-uid', filterPaths: ['status'] },
    { targetId: 'chart-uid', filterPaths: ['category'] },
  ],
});
```

### Видалення конфігурації

```ts
// Видалення всіх конфігурацій для конкретного фільтра
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

// Видалення всіх конфігурацій фільтрів для конкретної цілі
await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## Пов'язано

- [ctx.resource](./resource.md): Ресурс цільового блоку повинен підтримувати інтерфейс фільтрації.
- [ctx.model](./model.md): Використовується для отримання UID поточної моделі для filterId / targetId.