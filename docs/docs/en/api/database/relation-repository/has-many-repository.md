# HasManyRepository

`HasManyRepository` is a `Relation Repository` used to handle `HasMany` relationships.

## Class Methods

### `find()`

Find associated objects

**Signature**

- `async find(options?: FindOptions): Promise<M[]>`

**Details**

The query parameters are the same as [`Repository.find()`](../repository.md#find).

### `findOne()`

Find an associated object, returning only one record

**Signature**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Returns the number of records that match the query conditions

**Signature**

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

Queries the database for a dataset and the number of results that match specific conditions.

**Signature**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Type**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Create associated objects

**Signature**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Update associated objects that meet the conditions

**Signature**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Delete associated objects that meet the conditions

**Signature**

- `async destroy(options?: TK | DestroyOptions): Promise<M>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Add object associations

**Signature**

- `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Type**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

**Details**

- `tk` - The targetKey value of the associated object, which can be a single value or an array.
  <embed src="../shared/transaction.md"></embed>

### `remove()`

Remove the association with the given objects

**Signature**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Details**

Parameters are the same as the [`add()`](#add) method.

### `set()`

Set the associated objects for the current relationship

**Signature**

- `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Details**

Parameters are the same as the [`add()`](#add) method.