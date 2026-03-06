:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/runjs/context/make-resource).
:::

# ctx.makeResource()

**Створює** та повертає новий екземпляр ресурсу, **не** записуючи та не змінюючи `ctx.resource`. Підходить для сценаріїв, що потребують кількох незалежних ресурсів або тимчасового використання.

## Сценарії використання

| Сценарій | Опис |
|------|------|
| **Кілька ресурсів** | Одночасне завантаження кількох джерел даних (наприклад, список користувачів + список замовлень), де кожен використовує незалежний ресурс. |
| **Тимчасові запити** | Одноразові запити, які не використовуються повторно, без необхідності прив'язки до `ctx.resource`. |
| **Допоміжні дані** | Використання `ctx.resource` для основних даних та `makeResource` для створення екземплярів для додаткових даних. |

Якщо вам потрібен лише один ресурс і ви хочете прив'язати його до `ctx.resource`, доцільніше використовувати [ctx.initResource()](./init-resource.md).

## Визначення типів

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| Параметр | Тип | Опис |
|------|------|------|
| `resourceType` | `string` | Тип ресурсу: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Повертає**: Новостворений екземпляр ресурсу.

## Відмінність від ctx.initResource()

| Метод | Поведінка |
|------|------|
| `ctx.makeResource(type)` | Тільки створює та повертає новий екземпляр, **не** записуючи його в `ctx.resource`. Можна викликати кілька разів для отримання кількох незалежних ресурсів. |
| `ctx.initResource(type)` | Створює та прив'язує ресурс, якщо `ctx.resource` не існує; повертає його безпосередньо, якщо він уже існує. Гарантує доступність `ctx.resource`. |

## Приклади

### Один ресурс

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource залишається зі своїм початковим значенням (якщо воно було)
```

### Кілька ресурсів

```ts
const usersRes = ctx.makeResource('MultiRecordResource');
usersRes.setResourceName('users');
await usersRes.refresh();

const ordersRes = ctx.makeResource('MultiRecordResource');
ordersRes.setResourceName('orders');
await ordersRes.refresh();

ctx.render(
  <div>
    <p>Кількість користувачів: {usersRes.getData().length}</p>
    <p>Кількість замовлень: {ordersRes.getData().length}</p>
  </div>
);
```

### Тимчасовий запит

```ts
// Одноразовий запит, не засмічує ctx.resource
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## Примітки

- Для новоствореного ресурсу необхідно викликати `setResourceName(name)`, щоб вказати колекцію, а потім завантажити дані за допомогою `refresh()`.
- Кожен екземпляр ресурсу є незалежним і не впливає на інші; підходить для паралельного завантаження кількох джерел даних.

## Пов'язано

- [ctx.initResource()](./init-resource.md): Ініціалізація та прив'язка до `ctx.resource`
- [ctx.resource](./resource.md): Екземпляр ресурсу в поточному контексті
- [MultiRecordResource](../resource/multi-record-resource) — Кілька записів/Список
- [SingleRecordResource](../resource/single-record-resource) — Один запис
- [APIResource](../resource/api-resource) — Загальний API ресурс
- [SQLResource](../resource/sql-resource) — Ресурс SQL-запиту