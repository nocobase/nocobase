# Repository

## Overview

On a given `Collection` object, you can get its `Repository` object to perform read and write operations on the collection.

```javascript
const { UserCollection } = require('./collections');

const UserRepository = UserCollection.repository;

const user = await UserRepository.findOne({
  filter: {
    id: 1,
  },
});

user.name = 'new name';
await user.save();
```

### Query

#### Basic Query

On the `Repository` object, call `find*` related methods to perform query operations. All query methods support passing a `filter` parameter to filter data.

```javascript
// SELECT * FROM users WHERE id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### Operators

The `filter` parameter in `Repository` also provides a variety of operators to perform more diverse query operations.

```javascript
// SELECT * FROM users WHERE age > 18
userRepository.find({
  filter: {
    age: {
      $gt: 18,
    },
  },
});

// SELECT * FROM users WHERE age > 18 OR name LIKE '%John%'
userRepository.find({
  filter: {
    $or: [{ age: { $gt: 18 } }, { name: { $like: '%John%' } }],
  },
});
```

For more details on operators, please refer to [Filter Operators](/api/database/operators).

#### Field Control

When performing a query operation, you can control the output fields through the `fields`, `except`, and `appends` parameters.

- `fields`: Specify output fields
- `except`: Exclude output fields
- `appends`: Append associated fields to the output

```javascript
// The result will only include id and name fields
userRepository.find({
  fields: ['id', 'name'],
});

// The result will not include the password field
userRepository.find({
  except: ['password'],
});

// The result will include data from the associated object posts
userRepository.find({
  appends: ['posts'],
});
```

#### Querying Association Fields

The `filter` parameter supports filtering by association fields, for example:

```javascript
// Query for user objects whose associated posts have an object with the title 'post title'
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

Association fields can also be nested.

```javascript
// Query for user objects where the comments of their posts contain keywords
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### Sorting

You can sort the query results using the `sort` parameter.

```javascript
// SELECT * FROM users ORDER BY age
await userRepository.find({
  sort: 'age',
});

// SELECT * FROM users ORDER BY age DESC
await userRepository.find({
  sort: '-age',
});

// SELECT * FROM users ORDER BY age DESC, name ASC
await userRepository.find({
  sort: ['-age', 'name'],
});
```

You can also sort by the fields of associated objects.

```javascript
await userRepository.find({
  sort: 'profile.createdAt',
});
```

### Create

#### Basic Create

Create new data objects through the `Repository`.

```javascript
await userRepository.create({
  name: 'John Doe',
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('John Doe', 18)

// Supports bulk creation
await userRepository.create([
  {
    name: 'John Doe',
    age: 18,
  },
  {
    name: 'Jane Smith',
    age: 20,
  },
]);
```

#### Creating Associations

When creating, you can also create associated objects simultaneously. Similar to querying, nested use of associated objects is also supported, for example:

```javascript
await userRepository.create({
  name: 'John Doe',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          name: 'tag1',
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
// When creating a user, a post is created and associated with the user, and tags are created and associated with the post.
```

If the associated object already exists in the database, you can pass its ID to establish an association with it during creation.

```javascript
const tag1 = await tagRepository.findOne({
  filter: {
    name: 'tag1',
  },
});

await userRepository.create({
  name: 'John Doe',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          id: tag1.id, // Establish an association with an existing associated object
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
```

### Update

#### Basic Update

After getting a data object, you can directly modify its properties on the data object (`Model`) and then call the `save` method to save the changes.

```javascript
const user = await userRepository.findOne({
  filter: {
    name: 'John Doe',
  },
});

user.age = 20;
await user.save();
```

The data object `Model` inherits from the Sequelize Model. For operations on the `Model`, please refer to [Sequelize Model](https://sequelize.org/master/manual/model-basics.html).

You can also update data through the `Repository`:

```javascript
// Update data records that meet the filter criteria
await userRepository.update({
  filter: {
    name: 'John Doe',
  },
  values: {
    age: 20,
  },
});
```

When updating, you can control which fields are updated using the `whitelist` and `blacklist` parameters, for example:

```javascript
await userRepository.update({
  filter: {
    name: 'John Doe',
  },
  values: {
    age: 20,
    name: 'Jane Smith',
  },
  whitelist: ['age'], // Only update the age field
});
```

#### Updating Association Fields

When updating, you can set associated objects, for example:

```javascript
const tag1 = tagRepository.findOne({
  filter: {
    id: 1,
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    title: 'new post title',
    tags: [
      {
        id: tag1.id, // Establish an association with tag1
      },
      {
        name: 'tag2', // Create a new tag and establish an association
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // Disassociate the post from the tags
  },
});
```

### Delete

You can call the `destroy()` method in the `Repository` to perform a delete operation. You need to specify filter criteria when deleting:

```javascript
await userRepository.destroy({
  filter: {
    status: 'blocked',
  },
});
```

## Constructor

Usually not called directly by developers. It is mainly instantiated after registering the type through `db.registerRepositories()` and specifying the corresponding registered repository type in the parameters of `db.collection()`.

**Signature**

- `constructor(collection: Collection)`

**Example**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  async myQuery(sql) {
    return this.database.sequelize.query(sql);
  }
}

db.registerRepositories({
  books: MyRepository,
});

db.collection({
  name: 'books',
  // here link to the registered repository
  repository: 'books',
});

await db.sync();

const books = db.getRepository('books') as MyRepository;
await books.myQuery('SELECT * FROM books;');
```

## Instance Members

### `database`

The database management instance of the context.

### `collection`

The corresponding collection management instance.

### `model`

The corresponding model class.

## Instance Methods

### `find()`

Queries a dataset from the database, allowing specification of filter conditions, sorting, etc.

**Signature**

- `async find(options?: FindOptions): Promise<Model[]>`

**Type**

```typescript
type Filter = FilterWithOperator | FilterWithValue | FilterAnd | FilterOr;
type Appends = string[];
type Except = string[];
type Fields = string[];
type Sort = string[] | string;

interface SequelizeFindOptions {
  limit?: number;
  offset?: number;
}

interface FilterByTk {
  filterByTk?: TargetKey;
}

interface CommonFindOptions extends Transactionable {
  filter?: Filter;
  fields?: Fields;
  appends?: Appends;
  except?: Except;
  sort?: Sort;
}

type FindOptions = SequelizeFindOptions & CommonFindOptions & FilterByTk;
```

**Details**

#### `filter: Filter`

Query condition used to filter data results. In the passed query parameters, the `key` is the field name to query, and the `value` can be the value to query or used with operators for other conditional data filtering.

```typescript
// Query for records where name is 'foo' and age is greater than 18
repository.find({
  filter: {
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
```

For more operators, please refer to [Query Operators](./operators.md).

#### `filterByTk: TargetKey`

Queries data by `TargetKey`, which is a convenient method for the `filter` parameter. The specific field for `TargetKey` can be [configured](./collection.md#filtertargetkey) in the `Collection`, defaulting to `primaryKey`.

```typescript
// By default, finds the record with id = 1
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

Query columns, used to control the data field results. After passing this parameter, only the specified fields will be returned.

#### `except: string[]`

Excluded columns, used to control the data field results. After passing this parameter, the passed fields will not be output.

#### `appends: string[]`

Appended columns, used to load associated data. After passing this parameter, the specified association fields will also be output.

#### `sort: string[] | string`

Specifies the sorting method for the query results. The parameter is the field name, which defaults to ascending `asc` order. For descending `desc` order, add a `-` symbol before the field name, e.g., `['-id', 'name']`, which means sort by `id desc, name asc`.

#### `limit: number`

Limits the number of results, same as `limit` in `SQL`.

#### `offset: number`

Query offset, same as `offset` in `SQL`.

**Example**

```ts
const posts = db.getRepository('posts');

const results = await posts.find({
  filter: {
    createdAt: {
      $gt: '2022-01-01T00:00:00.000Z',
    },
  },
  fields: ['title'],
  appends: ['user'],
});
```

### `findOne()`

Queries a single piece of data from the database that meets specific criteria. Equivalent to `Model.findOne()` in Sequelize.

**Signature**

- `async findOne(options?: FindOneOptions): Promise<Model | null>`

<embed src="./shared/find-one.md"></embed>

**Example**

```ts
const posts = db.getRepository('posts');

const result = await posts.findOne({
  filterByTk: 1,
});
```

### `count()`

Queries the total number of data entries that meet specific criteria from the database. Equivalent to `Model.count()` in Sequelize.

**Signature**

- `count(options?: CountOptions): Promise<number>`

**Type**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

**Example**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: 'The Great Gatsby',
  },
});
```

### `findAndCount()`

Queries a dataset and the total number of results that meet specific criteria from the database. Equivalent to `Model.findAndCountAll()` in Sequelize.

**Signature**

- `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**Type**

```typescript
type FindAndCountOptions = Omit<
  SequelizeAndCountOptions,
  'where' | 'include' | 'order'
> &
  CommonFindOptions;
```

**Details**

The query parameters are the same as `find()`. The return value is an array where the first element is the query result and the second element is the total count.

### `create()`

Inserts a new record into the collection. Equivalent to `Model.create()` in Sequelize. When the data object to be created carries information about relationship fields, the corresponding relationship data records will be created or updated as well.

**Signature**

- `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**Example**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 Release Notes',
    tags: [
      // When the primary key of the association table exists, it updates the data
      { id: 1 },
      // When there is no primary key value, it creates new data
      { name: 'NocoBase' },
    ],
  },
});
```

### `createMany()`

Inserts multiple new records into the collection. Equivalent to calling the `create()` method multiple times.

**Signature**

- `createMany(options: CreateManyOptions): Promise<Model[]>`

**Type**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**Details**

- `records`: An array of data objects for the records to be created.
- `transaction`: Transaction object. If no transaction parameter is passed, the method will automatically create an internal transaction.

**Example**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'NocoBase 1.0 Release Notes',
      tags: [
        // When the primary key of the association table exists, it updates the data
        { id: 1 },
        // When there is no primary key value, it creates new data
        { name: 'NocoBase' },
      ],
    },
    {
      title: 'NocoBase 1.1 Release Notes',
      tags: [{ id: 1 }],
    },
  ],
});
```

### `update()`

Updates data in the collection. Equivalent to `Model.update()` in Sequelize. When the data object to be updated carries information about relationship fields, the corresponding relationship data records will be created or updated as well.

**Signature**

- `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**Example**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'NocoBase 1.0 Release Notes',
    tags: [
      // When the primary key of the association table exists, it updates the data
      { id: 1 },
      // When there is no primary key value, it creates new data
      { name: 'NocoBase' },
    ],
  },
});
```

### `destroy()`

Deletes data from the collection. Equivalent to `Model.destroy()` in Sequelize.

**Signature**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<number>`

**Type**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Details**

- `filter`: Specifies the filter conditions for the records to be deleted. For detailed usage of Filter, refer to the [`find()`](#find) method.
- `filterByTk`: Specifies the filter conditions for the records to be deleted by TargetKey.
- `truncate`: Whether to truncate the collection data, effective when no `filter` or `filterByTk` parameter is passed.
- `transaction`: Transaction object. If no transaction parameter is passed, the method will automatically create an internal transaction.