:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/runjs/context/init-resource).
:::

# ctx.initResource()

**Ініціалізує** ресурс (resource) для поточного контексту: якщо `ctx.resource` ще не існує, створює його зазначеного типу та прив'язує до контексту; якщо вже існує — використовує його безпосередньо. Після цього доступ до нього можна отримати через `ctx.resource`.

## Сценарії використання

Зазвичай використовується в сценаріях **JSBlock** (незалежний блок). Більшість блоків, спливаючих вікон тощо мають попередньо прив'язаний `ctx.resource`, тому ручний виклик не потрібен. JSBlock за замовчуванням не має ресурсу, тому необхідно спочатку викликати `ctx.initResource(type)`, а потім завантажувати дані через `ctx.resource`.

## Визначення типу

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| Параметр | Тип | Опис |
|----------|------|-------------|
| `type` | `string` | Тип ресурсу: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Повертає**: Екземпляр ресурсу в поточному контексті (тобто `ctx.resource`).

## Різниця з ctx.makeResource()

| Метод | Поведінка |
|--------|----------|
| `ctx.initResource(type)` | Створює та прив'язує, якщо `ctx.resource` не існує; повертає існуючий, якщо він є. Гарантує доступність `ctx.resource`. |
| `ctx.makeResource(type)` | Тільки створює та повертає новий екземпляр, **не** записуючи його в `ctx.resource`. Підходить для сценаріїв, що потребують кількох незалежних ресурсів або тимчасового використання. |

## Приклади

### Дані списку (MultiRecordResource)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### Одиночний запис (SingleRecordResource)

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1); // Вказати основний ключ
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Вказання джерела даних

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## Примітки

- У більшості сценаріїв блоків (форми, таблиці, деталі тощо) та спливаючих вікон `ctx.resource` вже попередньо прив'язаний середовищем виконання, тому викликати `ctx.initResource` не потрібно.
- Ручна ініціалізація потрібна лише в таких контекстах, як JSBlock, де за замовчуванням немає ресурсу.
- Після ініціалізації необхідно викликати `setResourceName(name)`, щоб вказати назву колекції, а потім `refresh()` для завантаження даних.

## Пов'язані теми

- [ctx.resource](./resource.md) — Екземпляр ресурсу в поточному контексті
- [ctx.makeResource()](./make-resource.md) — Створює новий екземпляр ресурсу без прив'язки до `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) — Декілька записів/список
- [SingleRecordResource](../resource/single-record-resource.md) — Одиночний запис
- [APIResource](../resource/api-resource.md) — Загальний API ресурс
- [SQLResource](../resource/sql-resource.md) — Ресурс SQL-запиту