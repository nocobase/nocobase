:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# BelongsToManyRepository

`BelongsToManyRepository` — это репозиторий связей (`Relation Repository`), предназначенный для работы с отношениями типа `BelongsToMany`.

В отличие от других типов отношений, связи `BelongsToMany` требуют использования промежуточной таблицы для их записи.
При определении таких связей в NocoBase промежуточная таблица может быть создана автоматически или явно указана вами.

## Методы класса

### `find()`

Поиск связанных объектов

**Signature**

- `async find(options?: FindOptions): Promise<M[]>`

**Details**

Параметры запроса совпадают с [`Repository.find()`](../repository.md#find).

### `findOne()`

Поиск связанного объекта, возвращает только одну запись

**Signature**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Возвращает количество записей, соответствующих условиям запроса

**Signature**

- `async count(options?: CountOptions)`

**Type**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

### `findAndCount()`

Выполняет запрос к базе данных для получения набора данных и их общего количества по заданным условиям.

**Signature**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Type**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Создание связанного объекта

**Signature**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Обновление связанных объектов, соответствующих условиям

**Signature**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Удаление связанных объектов, соответствующих условиям

**Signature**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Добавление новых связанных объектов

**Signature**

- `async add(
options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions
): Promise<void>`

**Type**

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

**Details**

Вы можете передать `targetKey` связанного объекта напрямую или передать `targetKey` вместе со значениями полей промежуточной таблицы.

**Example**

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

// Передача полей промежуточной таблицы
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

Установка связанных объектов

**Signature**

- async set(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void>

**Details**

Параметры аналогичны методу [add()](#add).

### `remove()`

Удаление связи с указанными объектами

**Signature**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Type**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

Переключение связанных объектов.

В некоторых бизнес-сценариях часто требуется переключать связанные объекты. Например, пользователь может добавить товар в избранное, затем удалить его из избранного и снова добавить. Метод `toggle` позволяет быстро реализовать подобную функциональность.

**Signature**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**Details**

Метод `toggle` автоматически проверяет, существует ли связанный объект. Если он существует, то объект удаляется; в противном случае — добавляется.