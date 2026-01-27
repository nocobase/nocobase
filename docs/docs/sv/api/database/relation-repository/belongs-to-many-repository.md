:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# BelongsToManyRepository

`BelongsToManyRepository` är ett `Relation Repository` för att hantera `BelongsToMany`-relationer.

Till skillnad från andra relationstyper måste `BelongsToMany`-relationer registreras via en mellantabell.
När ni definierar en associerad relation i NocoBase kan en mellantabell skapas automatiskt, eller så kan ni uttryckligen ange en.

## Klassmetoder

### `find()`

Hittar associerade objekt.

**Signatur**

- `async find(options?: FindOptions): Promise<M[]>`

**Detaljer**

Frågeparametrarna är konsekventa med [`Repository.find()`](../repository.md#find).

### `findOne()`

Hittar ett associerat objekt och returnerar endast en post.

**Signatur**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Returnerar antalet poster som matchar frågevillkoren.

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

Frågar databasen efter en datamängd och det totala antalet under specifika villkor.

**Signatur**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Typ**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Skapar ett associerat objekt.

**Signatur**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Uppdaterar associerade objekt som uppfyller villkoren.

**Signatur**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Tar bort associerade objekt som uppfyller villkoren.

**Signatur**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Lägger till nya associerade objekt.

**Signatur**

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

**Detaljer**

Ni kan direkt skicka in det associerade objektets `targetKey`, eller skicka in `targetKey` tillsammans med fältvärdena från mellantabellen.

**Exempel**

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

// Skicka in targetKey
PostTagRepository.add([t1.id, t2.id]);

// Skicka in fält från mellantabellen
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

Ställer in associerade objekt.

**Signatur**

- async set(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void>

**Detaljer**

Parametrarna är desamma som för [add()](#add).

### `remove()`

Tar bort associationen med de angivna objekten.

**Signatur**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Typ**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

Växlar associerade objekt.

I vissa affärsscenarier är det ofta nödvändigt att växla associerade objekt. Till exempel kan en användare favoritmarkera en produkt, ta bort favoritmarkeringen och sedan favoritmarkera den igen. Metoden `toggle` kan användas för att snabbt implementera liknande funktionalitet.

**Signatur**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**Detaljer**

Metoden `toggle` kontrollerar automatiskt om det associerade objektet redan finns. Om det finns tas det bort; om det inte finns läggs det till.