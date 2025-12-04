:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# BelongsToManyRepository

`BelongsToManyRepository` is een `Relation Repository` voor het beheren van `BelongsToMany`-relaties.

In tegenstelling tot andere relatietypen, moeten `BelongsToMany`-relaties via een tussentabel worden vastgelegd.
Bij het definiëren van een associatierelatie in NocoBase kan een tussentabel automatisch worden aangemaakt, of u kunt deze expliciet specificeren.

## Klassemethoden

### `find()`

Zoekt gekoppelde objecten

**Signatuur**

- `async find(options?: FindOptions): Promise<M[]>`

**Details**

De queryparameters zijn consistent met [`Repository.find()`](../repository.md#find).

### `findOne()`

Zoekt een gekoppeld object en retourneert slechts één record

**Signatuur**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Retourneert het aantal records dat voldoet aan de zoekcriteria

**Signatuur**

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

Haalt uit de database een dataset en het totale aantal op basis van specifieke voorwaarden.

**Signatuur**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Type**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Maakt een gekoppeld object aan

**Signatuur**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Werkt gekoppelde objecten bij die aan de voorwaarden voldoen

**Signatuur**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Verwijdert gekoppelde objecten die aan de voorwaarden voldoen

**Signatuur**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Voegt nieuwe gekoppelde objecten toe

**Signatuur**

- `async add(
options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions
): Promise<void>`

**Type**

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

**Details**

U kunt de `targetKey` van het gekoppelde object direct doorgeven, of de `targetKey` samen met de veldwaarden van de tussentabel doorgeven.

**Voorbeeld**

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

// Geef targetKey door
PostTagRepository.add([t1.id, t2.id]);

// Geef velden van de tussentabel door
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

Stelt gekoppelde objecten in

**Signatuur**

- async set(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void>

**Details**

De parameters zijn gelijk aan [add()](#add)

### `remove()`

Verwijdert de koppeling met de opgegeven objecten

**Signatuur**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Type**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

Wisselt gekoppelde objecten.

In sommige bedrijfsscenario's is het vaak nodig om gekoppelde objecten te wisselen. Een gebruiker kan bijvoorbeeld een product favoriet maken, de favoriet ongedaan maken en het vervolgens opnieuw favoriet maken. De `toggle`-methode kan worden gebruikt om dergelijke functionaliteit snel te implementeren.

**Signatuur**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**Details**

De `toggle`-methode controleert automatisch of het gekoppelde object al bestaat. Als het bestaat, wordt het verwijderd; zo niet, dan wordt het toegevoegd.