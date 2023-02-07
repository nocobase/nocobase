# BelongsToManyRepository

`BelongsToManyRepository` is the `Relation Repository` for handling `BelongsToMany` relationships.

Unlike other relationship types, the `BelongsToMany` type of relationship needs to be recorded through an intermediate table. The intermediate table can be created automatically or explicitly specified when defining association relationships in NocoBase.

## Class Methods

### `find()`

Find associated objects.

**Signature**

* `async find(options?: FindOptions): Promise<M[]>`

**Detailed Information**

Query parameters are the same as [`Repository.find()`](../repository.md#find).

### `findOne()`

Find associated objects, only to return one record.

**Signature**

* `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Return the number of records matching the query criteria.

**Signature**

* `async count(options?: CountOptions)`

**Type**

```typescript
interface CountOptions extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>, Transactionable {
  filter?: Filter;
}
```

### `findAndCount()`

Find datasets from the database with the specified filtering conditions and return the number of results.

**Signature**

* `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Type**

```typescript
type FindAndCountOptions = CommonFindOptions
```

### `create()`

Create associated objects.

**Signature**

* `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Update associated objects that match the conditions.

**Signature**

* `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Delete associated objects.

**Signature**

* `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Add new associated objects.

**Signature**

* `async add(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions
  ): Promise<void>`

**Type**

```typescript
type PrimaryKeyWithThroughValues = [TargetKey, Values];

interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[];
}
```

**Detailed Information**

Pass the `targetKey` of the associated object directly, or pass the `targetKey` along with the field values of the intermediate table.

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

// Pass in the targetKey
PostTagRepository.add([
  t1.id, t2.id
]);

// Pass in intermediate table fields
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

Set the associated objects.

**Signature**

* async set(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void>

**Detailed Information**
  
Parameters are the same as [add()](#add).

### `remove()`
  
Remove the association with the given objects.

**Signature**

* `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Type**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

Toggle the associated object.
  
In some business scenarios, it is often needed to toggle the associated object. For example, user adds a product into collection, and the user cancels the collection and collect it again. Using the `toggle` method can quickly implement similar functions.

**Signature**

* `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**Detailed Information**

The `toggle` method automatically checks whether the associated object already exists, and removes it if it does, or adds it if it does not.
