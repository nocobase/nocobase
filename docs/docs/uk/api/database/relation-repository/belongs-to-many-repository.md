:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# BelongsToManyRepository

`BelongsToManyRepository` — це `Relation Repository` для роботи з відносинами типу `BelongsToMany`.

На відміну від інших типів відносин, зв'язки `BelongsToMany` вимагають запису через проміжну таблицю.
При визначенні асоціативного зв'язку в NocoBase проміжна таблиця може створюватися автоматично або бути явно вказаною.

## Методи класу

### `find()`

Знаходить асоційовані об'єкти

**Підпис**

- `async find(options?: FindOptions): Promise<M[]>`

**Деталі**

Параметри запиту узгоджуються з [`Repository.find()`](../repository.md#find).

### `findOne()`

Знаходить асоційований об'єкт, повертаючи лише один запис

**Підпис**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Повертає кількість записів, що відповідають умовам запиту

**Підпис**

- `async count(options?: CountOptions)`

**Тип**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

### `findAndCount()`

Запитує базу даних для отримання набору даних та загальної кількості результатів за певними умовами.

**Підпис**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Тип**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Створює асоційований об'єкт

**Підпис**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Оновлює асоційовані об'єкти, що відповідають умовам

**Підпис**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Видаляє асоційовані об'єкти, що відповідають умовам

**Підпис**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Додає нові асоційовані об'єкти

**Підпис**

- `async add(
options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions
): Promise<void>`

**Тип**

```typescript
type PrimaryKeyWithThroughValues = [TargetKey, Values];

interface AssociatedOptions extends Transactionable {
  tk?:
    | TargetKey
    | TargetKey[]
    | PrimaryKeyWithThroughValues
    | PrimaryKeyWithThroughValues[];
}
```

**Деталі**

Ви можете безпосередньо передати `targetKey` асоційованого об'єкта або передати `targetKey` разом зі значеннями полів проміжної таблиці.

**Приклад**

```typescript
const t1 = await Tag.repository.create({
  values: { name: 't1' },
});

const t2 = await Tag.repository.create({
  values: { name: 't2' },
});

const p1 = await Post.repository.create({
  values: { title: 'p1' },
});

const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

// Передача targetKey
PostTagRepository.add([t1.id, t2.id]);

// Передача полів проміжної таблиці
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

Встановлює асоційовані об'єкти

**Підпис**

- async set(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void>

**Деталі**

Параметри такі ж, як у [add()](#add).

### `remove()`

Видаляє асоціацію із заданими об'єктами

**Підпис**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Тип**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

Перемикає асоційовані об'єкти.

У деяких бізнес-сценаріях часто виникає потреба перемикати асоційовані об'єкти. Наприклад, користувач може додати товар до обраного, видалити його звідти, а потім знову додати. Метод `toggle` дозволяє швидко реалізувати подібну функціональність.

**Підпис**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**Деталі**

Метод `toggle` автоматично перевіряє, чи існує асоційований об'єкт. Якщо він існує, його буде видалено; якщо ні — додано.