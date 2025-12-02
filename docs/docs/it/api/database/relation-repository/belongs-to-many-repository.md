:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# BelongsToManyRepository

`BelongsToManyRepository` è un `Relation Repository` utilizzato per gestire le relazioni `BelongsToMany`.

A differenza di altri tipi di relazione, le relazioni `BelongsToMany` richiedono l'utilizzo di una tabella intermedia per la loro registrazione. Quando si definisce una relazione di associazione in NocoBase, la tabella intermedia può essere creata automaticamente o specificata esplicitamente.

## Metodi di Classe

### `find()`

Trova gli oggetti associati

**Firma**

- `async find(options?: FindOptions): Promise<M[]>`

**Dettagli**

I parametri di query sono coerenti con [`Repository.find()`](../repository.md#find).

### `findOne()`

Trova un oggetto associato, restituendo una sola riga

**Firma**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Restituisce il numero di righe che corrispondono ai criteri di query

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

Interroga il database per un set di dati e il conteggio totale in base a condizioni specifiche.

**Firma**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Tipo**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Crea un oggetto associato

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

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Aggiunge nuovi oggetti associati

**Firma**

- `async add(
options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions
): Promise<void>`

**Tipo**

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

**Dettagli**

È possibile passare direttamente la `targetKey` dell'oggetto associato, oppure passare la `targetKey` insieme ai valori dei campi della tabella intermedia.

**Esempio**

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

// Passa la targetKey
PostTagRepository.add([t1.id, t2.id]);

// Passa i campi della tabella intermedia
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

Imposta gli oggetti associati

**Firma**

- async set(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void>

**Dettagli**

I parametri sono gli stessi di [add()](#add)

### `remove()`

Rimuove l'associazione con gli oggetti specificati

**Firma**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Tipo**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

Attiva/disattiva gli oggetti associati.

In alcuni scenari di business, è spesso necessario attivare/disattiva gli oggetti associati. Ad esempio, un utente può aggiungere un prodotto ai preferiti, rimuoverlo dai preferiti e aggiungerlo di nuovo. Il metodo `toggle` può essere utilizzato per implementare rapidamente funzionalità simili.

**Firma**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**Dettagli**

Il metodo `toggle` verifica automaticamente se l'oggetto associato esiste già. Se esiste, viene rimosso; altrimenti, viene aggiunto.