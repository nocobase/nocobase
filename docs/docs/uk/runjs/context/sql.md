:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/runjs/context/sql).
:::

# ctx.sql

`ctx.sql` надає можливості виконання та керування SQL, що часто використовується в RunJS (наприклад, JSBlock, робочі процеси) для прямого доступу до бази даних. Підтримує тимчасове виконання SQL, виконання збережених SQL-шаблонів за ID, прив'язку параметрів, змінні шаблону (`{{ctx.xxx}}`) та контроль типу результату.

## Сценарії застосування

| Сценарій | Опис |
|------|------|
| **JSBlock** | Спеціальні статистичні звіти, списки зі складною фільтрацією, агреговані запити між таблицями. |
| **Блок діаграм** | Збереження SQL-шаблонів для формування джерел даних діаграм. |
| **Робочий процес / Взаємодія** | Виконання попередньо встановлених SQL для отримання даних та використання їх у подальшій логіці. |
| **SQLResource** | Використовується разом із `ctx.initResource('SQLResource')` для таких сценаріїв, як списки з пагінацією. |

> Примітка: `ctx.sql` отримує доступ до бази даних через API `flowSql`. Переконайтеся, що поточний користувач має права на виконання запитів до відповідного джерела даних.

## Опис прав доступу

| Права | Метод | Опис |
|------|------|------|
| **Авторизований користувач** | `runById` | Виконання на основі налаштованого ID SQL-шаблону. |
| **Права на конфігурацію SQL** | `run`, `save`, `destroy` | Тимчасове виконання SQL, збереження/оновлення/видалення SQL-шаблонів. |

Фронтенд-логіка для звичайних користувачів має використовувати `ctx.sql.runById(uid, options)`. Якщо потрібен динамічний SQL або керування шаблонами, переконайтеся, що поточна роль має права на конфігурацію SQL.

## Визначення типів

```ts
sql: FlowSQLRepository;

interface FlowSQLRepository {
  run<T = any>(
    sql: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  save(options: { uid: string; sql: string; dataSourceKey?: string }): Promise<void>;

  runById<T = any>(
    uid: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  destroy(uid: string): Promise<void>;
}
```

## Основні методи

| Метод | Опис | Вимоги до прав |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | Виконує тимчасовий SQL; підтримує прив'язку параметрів та змінні шаблону. | Права на конфігурацію SQL |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | Зберігає або оновлює SQL-шаблон за ID для повторного використання. | Права на конфігурацію SQL |
| `ctx.sql.runById(uid, options?)` | Виконує раніше збережений SQL-шаблон за його ID. | Будь-який авторизований користувач |
| `ctx.sql.destroy(uid)` | Видаляє вказаний SQL-шаблон за ID. | Права на конфігурацію SQL |

Примітка:

- `run` використовується для налагодження SQL і потребує прав конфігурації.
- `save` та `destroy` використовуються для керування SQL-шаблонами та потребують прав конфігурації.
- `runById` відкритий для звичайних користувачів; він може лише виконувати збережені шаблони та не дозволяє налагоджувати або змінювати SQL.
- При зміні SQL-шаблону необхідно викликати `save` для збереження змін.

## Опис параметрів

### options для run / runById

| Параметр | Тип | Опис |
|------|------|------|
| `bind` | `Record<string, any>` \| `any[]` | Змінні прив'язки. Об'єкт для плейсхолдерів `:name`, масив для плейсхолдерів `?`. |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | Тип результату: кілька рядків, один рядок або одне значення. За замовчуванням `selectRows`. |
| `dataSourceKey` | `string` | Ідентифікатор джерела даних. За замовчуванням використовується головне джерело даних. |
| `filter` | `Record<string, any>` | Додаткові умови фільтрації (залежно від підтримки інтерфейсу). |

### options для save

| Параметр | Тип | Опис |
|------|------|------|
| `uid` | `string` | Унікальний ідентифікатор шаблону. Після збереження його можна виконати через `runById(uid, ...)`. |
| `sql` | `string` | Вміст SQL. Підтримує змінні шаблону `{{ctx.xxx}}` та плейсхолдери `:name` / `?`. |
| `dataSourceKey` | `string` | Необов'язково. Ідентифікатор джерела даних. |

## Змінні SQL-шаблону та прив'язка параметрів

### Змінні шаблону `{{ctx.xxx}}`

У SQL можна використовувати `{{ctx.xxx}}` для посилання на змінні контексту. Перед виконанням вони перетворюються на фактичні значення:

```js
// Посилання на ctx.user.id
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

Джерела змінних, на які можна посилатися, такі ж самі, як і для `ctx.getVar()` (наприклад, `ctx.user.*`, `ctx.record.*`, власні `ctx.defineProperty` тощо).

### Прив'язка параметрів

- **Іменовані параметри**: Використовуйте `:name` у SQL та передавайте об'єкт `{ name: value }` у `bind`.
- **Позиційні параметри**: Використовуйте `?` у SQL та передавайте масив `[value1, value2]` у `bind`.

```js
// Іменовані параметри
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = :status AND age > :minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);

// Позиційні параметри
const count = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE city = ? AND status = ?',
  { bind: ['Kyiv', 'active'], type: 'selectVar' }
);
```

## Приклади

### Виконання тимчасового SQL (потребує прав на конфігурацію SQL)

```js
// Кілька рядків (за замовчуванням)
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// Один рядок
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = :id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// Одне значення (наприклад, COUNT, SUM)
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### Використання змінних шаблону

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### Збереження та повторне використання шаблонів

```js
// Збереження (потребує прав на конфігурацію SQL)
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = :status ORDER BY created_at DESC',
});

// Будь-який авторизований користувач може це виконати
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// Видалення шаблону (потребує прав на конфігурацію SQL)
await ctx.sql.destroy('active-users-report');
```

### Список з пагінацією (SQLResource)

```js
// Використовуйте SQLResource, коли потрібна пагінація або фільтрація
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // ID збереженого SQL-шаблону
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // Містить page, pageSize тощо.
```

## Зв'язок із ctx.resource та ctx.request

| Призначення | Рекомендоване використання |
|------|----------|
| **Виконання SQL-запиту** | `ctx.sql.run()` або `ctx.sql.runById()` |
| **SQL список з пагінацією (блок)** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **Загальний HTTP-запит** | `ctx.request()` |

`ctx.sql` є обгорткою над API `flowSql` і спеціалізується на SQL-сценаріях; `ctx.request` можна використовувати для виклику будь-якого API.

## Примітки

- Використовуйте прив'язку параметрів (`:name` / `?`) замість конкатенації рядків, щоб уникнути SQL-ін'єкцій.
- `type: 'selectVar'` повертає скалярне значення, зазвичай використовується для `COUNT`, `SUM` тощо.
- Змінні шаблону `{{ctx.xxx}}` обробляються перед виконанням; переконайтеся, що відповідні змінні визначені в контексті.

## Пов'язане

- [ctx.resource](./resource.md): Ресурси даних; SQLResource внутрішньо викликає API `flowSql`.
- [ctx.initResource()](./init-resource.md): Ініціалізація SQLResource для списків з пагінацією тощо.
- [ctx.request()](./request.md): Загальні HTTP-запити.