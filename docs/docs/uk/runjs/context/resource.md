:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/runjs/context/resource).
:::

# ctx.resource

Екземпляр **FlowResource** у поточному контексті, який використовується для доступу до даних та маніпулювання ними. У більшості блоків (форми, таблиці, деталі тощо) та сценаріях зі спливаючими вікнами середовище виконання попередньо прив’язує `ctx.resource`. У сценаріях на кшталт JSBlock, де ресурс за замовчуванням відсутній, необхідно спочатку викликати [ctx.initResource()](./init-resource.md) для ініціалізації, а потім використовувати його через `ctx.resource`.

## Сценарії застосування

`ctx.resource` можна використовувати в будь-якому сценарії RunJS, що потребує доступу до структурованих даних (списки, окремі записи, кастомні API, SQL). Форми, таблиці, блоки деталей та спливаючі вікна зазвичай уже мають попередню прив’язку. Для JSBlock, JSField, JSItem, JSColumn тощо, якщо потрібно завантажити дані, ви можете спочатку викликати `ctx.initResource(type)`, а потім звернутися до `ctx.resource`.

## Визначення типу

```ts
resource: FlowResource | undefined;
```

- У контекстах із попередньою прив’язкою `ctx.resource` є відповідним екземпляром ресурсу;
- У сценаріях на кшталт JSBlock, де ресурс за замовчуванням відсутній, він має значення `undefined`, доки не буде викликано `ctx.initResource(type)`.

## Поширені методи

Методи, що надаються різними типами ресурсів (MultiRecordResource, SingleRecordResource, APIResource, SQLResource), дещо відрізняються. Нижче наведено універсальні або часто використовувані методи:

| Метод | Опис |
|------|------|
| `getData()` | Отримати поточні дані (список або окремий запис) |
| `setData(value)` | Встановити локальні дані |
| `refresh()` | Ініціювати запит із поточними параметрами для оновлення даних |
| `setResourceName(name)` | Встановити назву ресурсу (наприклад, `'users'`, `'users.tags'`) |
| `setFilterByTk(tk)` | Встановити фільтр за первинним ключем (для `get` окремого запису тощо) |
| `runAction(actionName, options)` | Викликати будь-яку дію (action) ресурсу (наприклад, `create`, `update`) |
| `on(event, callback)` / `off(event, callback)` | Підписатися/скасувати підписку на події (наприклад, `refresh`, `saved`) |

**Особливості MultiRecordResource**: `getSelectedRows()`, `destroySelectedRows()`, `setPage()`, `next()`, `previous()` тощо.

## Приклади

### Дані списку (спочатку потрібно викликати initResource)

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### Сценарій таблиці (вже прив’язано)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Видалено'));
```

### Окремий запис

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Виклик кастомної дії (action)

```js
await ctx.resource.runAction('create', { data: { name: 'Іван Іванов' } });
```

## Зв'язок із ctx.initResource / ctx.makeResource

- **ctx.initResource(type)**: Якщо `ctx.resource` не існує, створює та прив’язує його; якщо вже існує, повертає наявний екземпляр. Гарантує доступність `ctx.resource`.
- **ctx.makeResource(type)**: Створює новий екземпляр ресурсу та повертає його, але **не** записує в `ctx.resource`. Підходить для сценаріїв, що потребують кількох незалежних ресурсів або тимчасового використання.
- **ctx.resource**: Доступ до ресурсу, вже прив’язаного до поточного контексту. Більшість блоків/спливаючих вікон мають попередню прив’язку; якщо ні, він має значення `undefined` і потребує `ctx.initResource`.

## Примітки

- Перед використанням рекомендується виконувати перевірку на пусте значення: `ctx.resource?.refresh()`, особливо в сценаріях на кшталт JSBlock, де попередня прив’язка може бути відсутня.
- Після ініціалізації необхідно викликати `setResourceName(name)`, щоб вказати колекцію, перш ніж завантажувати дані через `refresh()`.
- Повний API для кожного типу Resource дивіться за посиланнями нижче.

## Пов'язано

- [ctx.initResource()](./init-resource.md) - Ініціалізація та прив’язка ресурсу до поточного контексту
- [ctx.makeResource()](./make-resource.md) - Створення нового екземпляра ресурсу без прив’язки до `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) - Кілька записів/Списки
- [SingleRecordResource](../resource/single-record-resource.md) - Окремий запис
- [APIResource](../resource/api-resource.md) - Загальний ресурс API
- [SQLResource](../resource/sql-resource.md) - Ресурс SQL-запиту