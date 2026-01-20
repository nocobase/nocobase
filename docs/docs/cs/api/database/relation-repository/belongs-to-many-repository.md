:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# BelongsToManyRepository

`BelongsToManyRepository` je `Relation Repository` pro práci se vztahy typu `BelongsToMany`.

Na rozdíl od jiných typů vztahů je u vztahů `BelongsToMany` nutné ukládat data prostřednictvím spojovací tabulky.
Při definování asociace v NocoBase může být spojovací tabulka vytvořena automaticky, nebo ji můžete explicitně specifikovat.

## Metody třídy

### `find()`

Vyhledá asociované objekty.

**Podpis**

- `async find(options?: FindOptions): Promise<M[]>`

**Podrobnosti**

Parametry dotazu jsou konzistentní s [`Repository.find()`](../repository.md#find).

### `findOne()`

Vyhledá asociovaný objekt a vrátí pouze jeden záznam.

**Podpis**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Vrátí počet záznamů odpovídajících zadaným podmínkám dotazu.

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

Dotazuje databázi na sadu dat a celkový počet výsledků za specifických podmínek.

**Podpis**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Typ**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Vytvoří asociovaný objekt.

**Podpis**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Aktualizuje asociované objekty, které splňují zadané podmínky.

**Podpis**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Odstraní asociované objekty, které splňují zadané podmínky.

**Podpis**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Přidá nové asociované objekty.

**Podpis**

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

**Podrobnosti**

Můžete přímo předat `targetKey` asociovaného objektu, nebo předat `targetKey` společně s hodnotami polí spojovací tabulky.

**Příklad**

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

// Předání targetKey
PostTagRepository.add([t1.id, t2.id]);

// Předání polí spojovací tabulky
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

Nastaví asociované objekty.

**Podpis**

- async set(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void>

**Podrobnosti**

Parametry jsou stejné jako u metody [add()](#add).

### `remove()`

Odebere asociaci s danými objekty.

**Podpis**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Typ**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

Přepíná asociované objekty.

V některých obchodních scénářích je často potřeba přepínat asociované objekty. Například uživatel může označit produkt jako oblíbený, zrušit toto označení a znovu jej označit. Metoda `toggle` umožňuje rychle implementovat podobnou funkcionalitu.

**Podpis**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**Podrobnosti**

Metoda `toggle` automaticky zkontroluje, zda asociovaný objekt již existuje. Pokud ano, je odstraněn; pokud ne, je přidán.