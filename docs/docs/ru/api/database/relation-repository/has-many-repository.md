:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# HasManyRepository

`HasManyRepository` — это репозиторий связей (`Relation Repository`), используемый для работы со связями типа `HasMany`.

## Методы класса

### `find()`

Найти связанные объекты.

**Сигнатура**

- `async find(options?: FindOptions): Promise<M[]>`

**Подробности**

Параметры запроса совпадают с параметрами метода [`Repository.find()`](../repository.md#find).

### `findOne()`

Найти связанный объект, возвращая только одну запись.

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

Выполняет запрос к базе данных для получения набора данных и количества результатов, соответствующих заданным условиям.

**Сигнатура**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Тип**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Создать связанные объекты.

**Сигнатура**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Обновить связанные объекты, соответствующие условиям.

**Сигнатура**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Удалить связанные объекты, соответствующие условиям.

**Сигнатура**

- `async destroy(options?: TK | DestroyOptions): Promise<M>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Добавить ассоциации объектов.

**Сигнатура**

- `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Тип**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

**Подробности**

- `tk` — значение `targetKey` связанного объекта, которое может быть как одним значением, так и массивом.
  <embed src="../shared/transaction.md"></embed>

### `remove()`

Удалить связь с указанными объектами.

**Сигнатура**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Подробности**

Параметры совпадают с параметрами метода [`add()`](#add).

### `set()`

Установить связанные объекты для текущей связи.

**Сигнатура**

- `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Подробности**

Параметры совпадают с параметрами метода [`add()`](#add).