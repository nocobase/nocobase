# BelongsToManyRepository - Репозиторий BelongsToMany

`BelongsToManyRepository` — это репозиторий отношений (Relation Repository) для обработки отношений `BelongsToMany`.

В отличие от других типов отношений, отношения `BelongsToMany` необходимо записывать через соединительную таблицу.
При определении связей в NocoBase соединительная таблица может быть создана автоматически или может быть указана явно.

## Методы класса

### `find()`

Находит связанные объекты

**Сигнатура**

- `async find(options?: FindOptions): Promise<M[]>`

**Подробности**

Параметры запроса соответствуют [`Repository.find()`](../repository.md#find).

### `findOne()`

Находит связанный объект, возвращая только одну запись

**Сигнатура**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Возвращает количество записей, соответствующих условиям запроса.

**Сигнатура**

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

Запрашивает у базы данных набор данных и общее количество при определенных условиях.

**Сигнатура**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Тип**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Создает связанный объект

**Сигнатура**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Обновляет связанные объекты, соответствующие условиям.

**Сигнатура**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Удаляет связанные объекты, соответствующие условиям

**Сигнатура**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Добавляет новые связанные объекты

**Сигнатура**

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

**Подробности**

Вы можете напрямую передать `targetKey` связанного объекта или передать `targetKey` вместе со значениями полей соединительной таблицы.

**Пример**

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

// Передать целевой ключ
PostTagRepository.add([t1.id, t2.id]);

// Передача полей соединительной таблицы
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

Устанавливает связанные объекты

**Сигнатура**

- async set(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void>

**Подробности**

Параметры такие же, как у [add()](#add)

### `remove()`

Удаляет связь с заданными объектами

**Сигнатура**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Тип**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

Переключает связанные объекты.

В некоторых бизнес-сценариях часто необходимо переключать связанные объекты. Например, пользователь может добавить продукт в избранное, удалить его из избранного и снова добавить в избранное. Метод `toggle` можно использовать для быстрой реализации такой функциональности.

**Сигнатура**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**Подробности**

Метод `toggle` автоматически проверяет, существует ли связанный объект. Если он существует, он удаляется; если нет, то он добавляется.