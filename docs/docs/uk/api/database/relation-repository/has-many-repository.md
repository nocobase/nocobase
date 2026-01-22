:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# HasManyRepository

`HasManyRepository` — це репозиторій відносин, призначений для роботи з відносинами типу `HasMany`.

## Методи класу

### `find()`

Знайти пов'язані об'єкти

**Сигнатура**

- `async find(options?: FindOptions): Promise<M[]>`

**Деталі**

Параметри запиту збігаються з [`Repository.find()`](../repository.md#find).

### `findOne()`

Знайти пов'язаний об'єкт, повертаючи лише один запис

**Сигнатура**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Повертає кількість записів, що відповідають умовам запиту

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

Запитує базу даних для набору даних та кількості результатів, які відповідають певним умовам.

**Сигнатура**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Тип**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Створити пов'язані об'єкти

**Сигнатура**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Оновити пов'язані об'єкти, що відповідають умовам

**Сигнатура**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Видалити пов'язані об'єкти, що відповідають умовам

**Сигнатура**

- `async destroy(options?: TK | DestroyOptions): Promise<M>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Додати асоціації об'єктів

**Сигнатура**

- `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Тип**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

**Деталі**

- `tk` — значення `targetKey` пов'язаного об'єкта, яке може бути як одним значенням, так і масивом.
  <embed src="../shared/transaction.md"></embed>

### `remove()`

Вилучити асоціацію з вказаними об'єктами

**Сигнатура**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Деталі**

Параметри ідентичні методу [`add()`](#add).

### `set()`

Встановити пов'язані об'єкти для поточного відношення

**Сигнатура**

- `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Деталі**

Параметри ідентичні методу [`add()`](#add).