:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# HasManyRepository

`HasManyRepository` ist ein `Relation Repository`, das für die Verwaltung von `HasMany`-Beziehungen verwendet wird.

## Klassenmethoden

### `find()`

Verknüpfte Objekte finden

**Signatur**

- `async find(options?: FindOptions): Promise<M[]>`

**Details**

Die Abfrageparameter sind identisch mit denen von [`Repository.find()`](../repository.md#find).

### `findOne()`

Ein verknüpftes Objekt finden, das nur einen Datensatz zurückgibt

**Signatur**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Gibt die Anzahl der Datensätze zurück, die den Abfragebedingungen entsprechen

**Signatur**

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

Fragt die Datenbank nach einem Datensatz und der Anzahl der Ergebnisse ab, die bestimmten Bedingungen entsprechen.

**Signatur**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Typ**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Verknüpfte Objekte erstellen

**Signatur**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Verknüpfte Objekte aktualisieren, die den Bedingungen entsprechen

**Signatur**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Verknüpfte Objekte löschen, die den Bedingungen entsprechen

**Signatur**

- `async destroy(options?: TK | DestroyOptions): Promise<M>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Objektverknüpfungen hinzufügen

**Signatur**

- `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Typ**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

**Details**

- `tk` – Der `targetKey`-Wert des verknüpften Objekts, der ein einzelner Wert oder ein Array sein kann.
  <embed src="../shared/transaction.md"></embed>

### `remove()`

Die Verknüpfung mit den angegebenen Objekten entfernen

**Signatur**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Details**

Die Parameter sind identisch mit denen der [`add()`](#add)-Methode.

### `set()`

Die verknüpften Objekte für die aktuelle Beziehung festlegen

**Signatur**

- `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Details**

Die Parameter sind identisch mit denen der [`add()`](#add)-Methode.