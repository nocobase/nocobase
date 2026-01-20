:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# BelongsToManyRepository

`BelongsToManyRepository` to `Relation Repository` służący do zarządzania relacjami typu `BelongsToMany`.

W przeciwieństwie do innych typów relacji, relacje `BelongsToMany` wymagają użycia tabeli pośredniczącej do ich zapisywania. Podczas definiowania relacji w NocoBase, tabela pośrednicząca może zostać utworzona automatycznie lub może Pan/Pani ją jawnie określić.

## Metody klasy

### `find()`

Znajduje powiązane obiekty.

**Sygnatura**

- `async find(options?: FindOptions): Promise<M[]>`

**Szczegóły**

Parametry zapytania są zgodne z [`Repository.find()`](../repository.md#find).

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

Pobiera z bazy danych zestaw danych i ich całkowitą liczbę, spełniające określone warunki.

**Sygnatura**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Typ**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Tworzy powiązany obiekt.

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

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Dodaje nowe powiązane obiekty.

**Sygnatura**

- `async add(
options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions
): Promise<void>`

**Typ**

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

**Szczegóły**

Może Pan/Pani bezpośrednio przekazać `targetKey` powiązanego obiektu lub przekazać `targetKey` wraz z wartościami pól tabeli pośredniczącej.

**Przykład**

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

// Przekazanie targetKey
PostTagRepository.add([t1.id, t2.id]);

// Przekazanie pól tabeli pośredniczącej
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

Ustawia powiązane obiekty.

**Sygnatura**

- `async set(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void>`

**Szczegóły**

Parametry są takie same jak w metodzie [add()](#add).

### `remove()`

Usuwa powiązanie z podanymi obiektami.

**Sygnatura**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Typ**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

Przełącza powiązane obiekty.

W niektórych scenariuszach biznesowych często zachodzi potrzeba przełączania powiązanych obiektów. Na przykład, użytkownik może dodać produkt do ulubionych, usunąć go z ulubionych, a następnie ponownie dodać. Metoda `toggle` pozwala szybko zaimplementować taką funkcjonalność.

**Sygnatura**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**Szczegóły**

Metoda `toggle` automatycznie sprawdza, czy powiązany obiekt już istnieje. Jeśli tak, to go usuwa; jeśli nie, to go dodaje.