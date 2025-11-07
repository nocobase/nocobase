# BelongsToManyRepository

`BelongsToManyRepository` is a `Relation Repository` for handling `BelongsToMany` relationships.

Unlike other relationship types, `BelongsToMany` relationships need to be recorded through a junction table.
When defining an association relationship in NocoBase, a junction table can be created automatically, or it can be explicitly specified.

## Class Methods

### `find()`

Finds associated objects

**Signature**

- `async find(options?: FindOptions): Promise<M[]>`

**Details**

The query parameters are consistent with [`Repository.find()`](../repository.md#find).

### `findOne()`

Finds an associated object, returning only one record

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

Queries the database for a dataset and the total count under specific conditions.

**Signature**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Type**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Creates an associated object

**Signature**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Updates associated objects that meet the conditions

**Signature**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Deletes associated objects that meet the conditions

**Signature**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Adds new associated objects

**Signature**

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

You can directly pass the `targetKey` of the associated object, or pass the `targetKey` along with the field values of the junction table.

**Example**

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

// Pass targetKey
PostTagRepository.add([t1.id, t2.id]);

// Pass junction table fields
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

Sets associated objects

**Signature**

- async set(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void>

**Details**

Parameters are the same as [add()](#add)

### `remove()`

Removes the association with the given objects

**Signature**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Type**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

Toggles associated objects.

In some business scenarios, it is often necessary to toggle associated objects. For example, a user can favorite a product, unfavorite it, and favorite it again. The `toggle` method can be used to quickly implement such functionality.

**Signature**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**Details**

The `toggle` method automatically checks if the associated object already exists. If it exists, it is removed; if not, it is added.