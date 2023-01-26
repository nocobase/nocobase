
# HasManyRepository

`HasManyRepository` is the `Relation Repository` for handling `HasMany` relationships.

## Class Method

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

* `async destroy(options?: TK | DestroyOptions): Promise<M>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Add association relationships between objects.

**Signature**
* `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Type**
```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

**Detailed Information**

* `tk` - The targetKey value of the associated object, either as a single value or an array. 
<embed src="../shared/transaction.md"></embed>

### `remove()`

Remove the association with the given object.

**Signature**

* `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Detailed Information**

Same parameters as the [`add()`](#add) method.

### `set()`

Set the associated object of the current relationship.

**Signature**

* `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Detailed Information**

Same parameters as the [`add()`](#add) method.
