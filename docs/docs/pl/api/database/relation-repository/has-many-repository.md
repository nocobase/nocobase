:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# HasManyRepository

`HasManyRepository` to `Relation Repository` służące do zarządzania relacjami typu `HasMany`.

## Metody klasy

### `find()`

Znajduje powiązane obiekty.

**Sygnatura**

- `async find(options?: FindOptions): Promise<M[]>`

**Szczegóły**

Parametry zapytania są takie same jak w [`Repository.find()`](../repository.md#find).

### `findOne()`

Znajduje powiązany obiekt, zwracając tylko jeden rekord.

**Sygnatura**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Zwraca liczbę rekordów spełniających warunki zapytania.

**Sygnatura**

- `async count(options?: CountOptions)`

**Typ**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

### `findAndCount()`

Wykonuje zapytanie do bazy danych o zestaw danych i liczbę wyników spełniających określone warunki.

**Sygnatura**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Typ**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Tworzy powiązane obiekty.

**Sygnatura**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Aktualizuje powiązane obiekty spełniające określone warunki.

**Sygnatura**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Usuwa powiązane obiekty spełniające określone warunki.

**Sygnatura**

- `async destroy(options?: TK | DestroyOptions): Promise<M>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Dodaje powiązania obiektów.

**Sygnatura**

- `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Typ**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

**Szczegóły**

- `tk` - Wartość `targetKey` powiązanego obiektu, która może być pojedynczą wartością lub tablicą.
  <embed src="../shared/transaction.md"></embed>

### `remove()`

Usuwa powiązanie z podanymi obiektami.

**Sygnatura**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Szczegóły**

Parametry są takie same jak w metodzie [`add()`](#add).

### `set()`

Ustawia powiązane obiekty dla bieżącej relacji.

**Sygnatura**

- `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Szczegóły**

Parametry są takie same jak w metodzie [`add()`](#add).