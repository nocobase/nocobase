:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# HasManyRepository

`HasManyRepository` je `Relation Repository` používaný pro správu vztahů typu `HasMany`.

## Metody třídy

### `find()`

Vyhledá přidružené objekty.

**Podpis**

- `async find(options?: FindOptions): Promise<M[]>`

**Podrobnosti**

Parametry dotazu jsou stejné jako u metody [`Repository.find()`](../repository.md#find).

### `findOne()`

Vyhledá přidružený objekt a vrátí pouze jeden záznam.

**Podpis**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Vrátí počet záznamů, které odpovídají podmínkám dotazu.

**Podpis**

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

Dotazuje se databáze na sadu dat a počet výsledků, které odpovídají specifickým podmínkám.

**Podpis**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Typ**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Vytvoří přidružené objekty.

**Podpis**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Aktualizuje přidružené objekty, které splňují dané podmínky.

**Podpis**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Odstraní přidružené objekty, které splňují dané podmínky.

**Podpis**

- `async destroy(options?: TK | DestroyOptions): Promise<M>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Přidá asociace objektů.

**Podpis**

- `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Typ**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

**Podrobnosti**

- `tk` – Hodnota `targetKey` přidruženého objektu, může být buď jedna hodnota, nebo pole hodnot.
  <embed src="../shared/transaction.md"></embed>

### `remove()`

Odebere asociaci s danými objekty.

**Podpis**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Podrobnosti**

Parametry jsou stejné jako u metody [`add()`](#add).

### `set()`

Nastaví přidružené objekty pro aktuální vztah.

**Podpis**

- `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Podrobnosti**

Parametry jsou stejné jako u metody [`add()`](#add).