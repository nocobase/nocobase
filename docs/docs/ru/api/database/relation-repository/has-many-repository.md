# HasManyRepository - Репозиторий HasMany

`HasManyRepository` — это репозиторий отношений (Relation Repository), используемый для обработки отношений `HasMany`.

## Методы класса

### `find()`

Найти связанные объекты

**Сигнатура**

- `async find(options?: FindOptions): Promise<M[]>`

**Подробности**

Параметры запроса такие же, как у [`Repository.find()`](../repository.md#find).

### `findOne()`

Найти связанный объект, вернув только одну запись

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

Запрашивает у базы данных набор данных и количество результатов, соответствующих определенным условиям.

**Сигнатура**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Тип**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Создание связанных объектов

**Сигнатура**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Обновить связанные объекты, соответствующие условиям.

**Сигнатура**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Удалить связанные объекты, соответствующие условиям

**Сигнатура**

- `async destroy(options?: TK | DestroyOptions): Promise<M>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Добавить ассоциации объектов

**Сигнатура**

- `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Тип**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

**Подробности**

- `tk` — значение targetKey связанного объекта, которое может быть одним значением или массивом.
  <embed src="../shared/transaction.md"></embed>

### `remove()`

Удалить связь с данными объектами

**Сигнатура**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Подробности**

Параметры такие же, как у метода [`add()`](#add).

### `set()`

Установите связанные объекты для текущего отношения

**Сигнатура**

- `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Подробности**

Параметры такие же, как у метода [`add()`](#add).