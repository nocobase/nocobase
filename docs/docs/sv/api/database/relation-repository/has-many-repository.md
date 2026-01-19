:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# HasManyRepository

`HasManyRepository` är ett `Relation Repository` som används för att hantera `HasMany`-relationer.

## Klassmetoder

### `find()`

Hitta associerade objekt

**Signatur**

- `async find(options?: FindOptions): Promise<M[]>`

**Detaljer**

Frågeparametrarna är desamma som för [`Repository.find()`](../repository.md#find).

### `findOne()`

Hitta ett associerat objekt, returnerar endast en post

**Signatur**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Returnerar antalet poster som matchar frågevillkoren

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

Frågar databasen efter en datamängd och antalet resultat som matchar specifika villkor.

**Signatur**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Typ**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Skapa associerade objekt

**Signatur**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Uppdatera associerade objekt som uppfyller villkoren

**Signatur**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Ta bort associerade objekt som uppfyller villkoren

**Signatur**

- `async destroy(options?: TK | DestroyOptions): Promise<M>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Lägg till objektassociationer

**Signatur**

- `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Typ**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

**Detaljer**

- `tk` - `targetKey`-värdet för det associerade objektet, vilket kan vara ett enskilt värde eller en array.
  <embed src="../shared/transaction.md"></embed>

### `remove()`

Ta bort associationen med de angivna objekten

**Signatur**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Detaljer**

Parametrarna är desamma som för metoden [`add()`](#add).

### `set()`

Ställ in de associerade objekten för den aktuella relationen

**Signatur**

- `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Detaljer**

Parametrarna är desamma som för metoden [`add()`](#add).