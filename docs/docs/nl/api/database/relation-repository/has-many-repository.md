:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# HasManyRepository

`HasManyRepository` is een `Relation Repository` die wordt gebruikt om `HasMany`-relaties te beheren.

## Klassemethoden

### `find()`

Gekoppelde objecten zoeken

**Handtekening**

- `async find(options?: FindOptions): Promise<M[]>`

**Details**

De zoekparameters zijn hetzelfde als die van [`Repository.find()`](../repository.md#find).

### `findOne()`

Zoek een gekoppeld object en retourneer slechts één record.

**Handtekening**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Retourneert het aantal records dat voldoet aan de zoekcriteria.

**Handtekening**

- `async count(options?: CountOptions)`

**Type**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

### `findAndCount()`

Zoekt in de database naar een dataset en het aantal resultaten dat aan specifieke voorwaarden voldoet.

**Handtekening**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Type**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Gekoppelde objecten aanmaken

**Handtekening**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Gekoppelde objecten bijwerken die aan de voorwaarden voldoen.

**Handtekening**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Gekoppelde objecten verwijderen die aan de voorwaarden voldoen.

**Handtekening**

- `async destroy(options?: TK | DestroyOptions): Promise<M>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Objectkoppelingen toevoegen

**Handtekening**

- `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Type**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

**Details**

- `tk` - De `targetKey`-waarde van het gekoppelde object, dit kan een enkele waarde of een array zijn.
  <embed src="../shared/transaction.md"></embed>

### `remove()`

De koppeling met de opgegeven objecten verwijderen.

**Handtekening**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Details**

De parameters zijn hetzelfde als die van de [`add()`](#add)-methode.

### `set()`

De gekoppelde objecten voor de huidige relatie instellen.

**Handtekening**

- `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Details**

De parameters zijn hetzelfde als die van de [`add()`](#add)-methode.