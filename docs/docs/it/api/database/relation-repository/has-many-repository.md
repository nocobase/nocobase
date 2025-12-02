:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# HasManyRepository

`HasManyRepository` è un `Relation Repository` utilizzato per gestire le relazioni `HasMany`.

## Metodi della classe

### `find()`

Trova gli oggetti associati

**Firma**

- `async find(options?: FindOptions): Promise<M[]>`

**Dettagli**

I parametri di query sono gli stessi di [`Repository.find()`](../repository.md#find).

### `findOne()`

Trova un oggetto associato, restituendo un solo record

**Firma**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Restituisce il numero di record che corrispondono alle condizioni della query

**Firma**

- `async count(options?: CountOptions)`

**Tipo**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

### `findAndCount()`

Interroga il database per ottenere un set di dati e il numero di risultati che corrispondono a condizioni specifiche.

**Firma**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Tipo**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Crea oggetti associati

**Firma**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Aggiorna gli oggetti associati che soddisfano le condizioni

**Firma**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Elimina gli oggetti associati che soddisfano le condizioni

**Firma**

- `async destroy(options?: TK | DestroyOptions): Promise<M>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Aggiunge associazioni di oggetti

**Firma**

- `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Tipo**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

**Dettagli**

- `tk` - Il valore `targetKey` dell'oggetto associato, che può essere un singolo valore o un array.
  <embed src="../shared/transaction.md"></embed>

### `remove()`

Rimuove l'associazione con gli oggetti specificati

**Firma**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Dettagli**

I parametri sono gli stessi del metodo [`add()`](#add).

### `set()`

Imposta gli oggetti associati per la relazione corrente

**Firma**

- `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Dettagli**

I parametri sono gli stessi del metodo [`add()`](#add).