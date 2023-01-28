# Repository

## Overview

On a given `Collection` object, you can get its `Repository` object to perform read and write operations on the data table.

```javascript
const { UserCollection } = require("./collections");

const UserRepository = UserCollection.repository;

const user = await UserRepository.findOne({
  filter: {
    id: 1
  },
});

user.name = "new name";
await user.save();
```

### Query

#### Basic Query

On the `Repository` object, call the `find*` methods to perform query. The `filter` parameter is supported by all query methods to filter the data.

```javascript
// SELECT * FROM users WHERE id = 1 
userRepository.find({
  filter: {
      id: 1
  }
});

```

#### Operator

The `filter` parameter in the `Repository` also provides a variety of operators to perform more diverse queries.

```javascript
// SELECT * FROM users WHERE age > 18
userRepository.find({
  filter: {
    age: {
      $gt: 18
    }
  }
});

// SELECT * FROM users WHERE age > 18 OR name LIKE '%张%'
userRepository.find({
  filter: {
    $or: [
      { age: { $gt: 18 } },
      { name: { $like: "%张%" } }
    ]
  }
});

```

Refer to [Filter Operators](/api/database/operators) for more details on operators.

#### Field Control

Control the output fields by the `fields`, `except`, and `appends` parameters when performing query.

* `fields`: Specify output fields
* `except`: Exclude output fields
* `appends`: Append output associated fields

```javascript
// The result contains only the id and name fields
userRepository.find({
  fields: ["id", "name"],
});

// The result does not contain only the password field
userRepository.find({
  except: ["password"],
});

// The result contains data associated with the posts object
userRepository.find({
  appends: ["posts"],
});
```

#### Associated Field Query

The `filter` parameter supports filtering by associated fields, for example:

```javascript
// Find the user objects whose associated posts have title of "post title"
userRepository.find({
  filter: {
      "posts.title": "post title"
  }
});
```

Associated fields can also be nested:

```javascript
// Find the user objects whose associated posts have comments containing "keywords"
await userRepository.find({
  filter: {
    "posts.comments.content": {
      $like: "%keywords%"
    }
  }
});
```

#### Sort

Sort query results by the `sort` parameter. 

```javascript

// SELECT * FROM users ORDER BY age
await userRepository.find({
  sort: 'age'
});


// SELECT * FROM users ORDER BY age DESC
await userRepository.find({
  sort: '-age'
});

// SELECT * FROM users ORDER BY age DESC, name ASC
await userRepository.find({
  sort: ['-age', "name"],
});
```

Sort by the field of the associated object is also supported:

```javascript
await userRepository.find({
  sort: 'profile.createdAt'
});
```

### Create

#### Basic Create

Create new data objects via `Repository`.

```javascript

await userRepository.create({
  name: "Mark",
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('Mark', 18)


// Bulk creation
await userRepository.create([
  {
    name: "Mark",
    age: 18,
  },
  {
    name: "Alex",
    age: 20,
  },
])
```

#### Create Association

Create associated objects at the same time of creating data. Like query, nested use of associated objects is also supported. For example:

```javascript
await userRepository.create({
  name: "Mark",
  age: 18,
  posts: [
    {
      title: "post title",
      content: "post content",
      tags: [
        {
          name: "tag1",
        },
        {
          name: "tag2",
        },
      ],
    },
  ],
});
// When creating a user, create a post to associate with the user, and create tags to associate with the post
```

If the associated object is already in the database, you can pass its ID to create an association with it.

```javascript
const tag1 = await tagRepository.findOne({
  filter: {
    name: "tag1"
  },
});

await userRepository.create({
  name: "Mark",
  age: 18,
  posts: [
    {
      title: "post title",
      content: "post content",
      tags: [
        {
          id: tag1.id,  // Create an association with an existing associated object
        },
        {
          name: "tag2",
        },
      ],
    },
  ],
});
```

### Update

#### Basic Update

After getting the data object, you can modify the properties directly on the data object (`Model`), and then call the `save` method to save the changes.

```javascript
const user = await userRepository.findOne({
  filter: {
    name: "Mark",
  },
});


user.age = 20;
await user.save();
```

The data object `Model` is inherited from Sequelize Model, refer to [Sequelize Model](https://sequelize.org/master/manual/model-basics.html) for the operations on `Model`.

Or update data via `Repository`:

```javascript
// Update the records that meet the filtering condition
await userRepository.update({
  filter: {
    name: "Mark",
  },
  values: {
    age: 20,
  },
});
```

Control which fields to update by the `whitelist` and `blacklist` parameters, for example:

```javascript
await userRepository.update({
  filter: {
    name: "Mark",
  },
  values: {
    age: 20,
    name: "Alex",
  },
  whitelist: ["age"], // Only update the age field
});
````

#### Update Associated Field

Associated objects can be set while updating, for example:

```javascript
const tag1 = tagRepository.findOne({
  filter: {
    id: 1
  },
});

await postRepository.update({
  filter: {
    id: 1
  },
  values: {
    title: "new post title",
    tags: [
      {
        id: tag1.id // Associate with tag1
      },
      {
        name: "tag2", // Create new tag and associate with it
      },
    ],
  },
});


await postRepository.update({
  filter: {
    id: 1
  },
  values: {
    tags: null // Disassociate post from tags
  },
})
```

### Delete

Call the `destroy()` method in `Repository` to perform the deletion operation. Filtering condition has to be specified to delete.

```javascript
await userRepository.destroy({
  filter: {
    status: "blocked",
  },
});
```

## Constructor

It is usually not called directly by the developer, the instantiation is done mainly by specifying a corresponding repository type that is already registered in the parameter of `db.colletion()`. Repository type is registered through `db.registerRepositories()`.

**Signature**

* `constructor(collection: Collection)`

**Example**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  async myQuery(sql) {
    return this.database.sequelize.query(sql);
  }
}

db.registerRepositories({
  books: MyRepository
});

db.collection({
  name: 'books',
  // here link to the registered repository
  repository: 'books'
});

await db.sync();

const books = db.getRepository('books') as MyRepository;
await books.myQuery('SELECT * FROM books;');
```

## Instance Member

### `database`

The database management instance where the context is located.

### `collection`

The corresponding data table management instance.

### `model`

The corresponding data model class.

## Instance Method

### `find()`

Find datasets from the database with the specified filtering conditions and sorting, etc.

**Signature**

* `async find(options?: FindOptions): Promise<Model[]>`

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

**Detailed Information**

#### `filter: Filter` 

Query conditions for filtering data results. In the query parameters that passed in, `key` is the name of the field, `value` is the corresponding value. Operators can be used in conjunction with other filtering conditions.

```typescript
// Find records with name "foo" and age above 18
repository.find({
  filter: {
    name: "foo",
    age: {
      $gt: 18,
    },
  }
})
```

Refer to [Operators](./operators.md) for more information.

#### `filterByTk: TargetKey`

Query data by `TargetKey`, this is shortcut for the `filter` parameter. The field of `TargetKey` can be [configured](./collection.md#filtertargetkey) in `Collection`, the default is `primaryKey`.

```typescript
// By default, find records with id 1
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

Query columns. It is used to control which data fields to output. With this parameter, only the specified fields will be returned.

#### `except: string[]`

Exclude columns. It is used to control which data fields to output. With this parameter, the specified fields will not be returned.

#### `appends: string[]`

Append columns. It is used to load associated data. With this parameter, the specified associated fields will be returned together.

#### `sort: string[] | string`

Specify the sorting method of the query results. The input parameter is the name of the field, by default is to sort in the ascending order (`asc`); a `-` symbol needs to be added before the field name to sort in the descending order (`desc`). For example, `['-id', 'name']` means to sort by `id desc, name asc`.

#### `limit: number`

Limit the number of results, same as `limit` in `SQL`.

#### `offset: number` 

The offset of the query, same as `offset` in `SQL`.

**Example**

```ts
const posts = db.getRepository('posts');

const results = await posts.find({
  filter: {
    createdAt: {
      $gt: '2022-01-01T00:00:00.000Z',
    }
  },
  fields: ['title'],
  appends: ['user'],
});
```

### `findOne()`

Find a single piece of data from the database for specific conditions. Equivalent to `Model.findOne()` in Sequelize.

**Signature**

* `async findOne(options?: FindOneOptions): Promise<Model | null>`

<embed src="./shared/find-one.md"></embed>

**Example**

```ts
const posts = db.getRepository('posts');

const result = await posts.findOne({
  filterByTk: 1,
});
```

### `count()`

Query a certain amount of data from the database for specific conditions. Equivalent to `Model.count()` in Sequelize.

**Signature**

* `count(options?: CountOptions): Promise<number>`

**Type**

```typescript
interface CountOptions extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>, Transactionable {
  filter?: Filter;
}
```

**Example**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: 'Three character classic'
  }
});
```

### `findAndCount()`

Find datasets from the database with the specified filtering conditions and return the number of results. Equivalent to `Model.findAndCountAll()` in Sequelize.

**Signature**

* `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**Type**

```typescript
type FindAndCountOptions = Omit<SequelizeAndCountOptions, 'where' | 'include' | 'order'> & CommonFindOptions;
```

**Detailed Information**

The query parameters are the same as `find()`. An array is returned with the first element of the query results, and the second element of the total number of results.

### `create()`

Inserts a newly created data into the data table. Equivalent to `Model.create()` in Sequelize. When the data object to be created carries any associated field, the corresponding associated data record is created or updated along with it.

**Signature**

* `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**Example**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 Release Notes',
    tags: [
      // Update data when there is a primary key and value of the associated table
      { id: 1 },
      // Create data when there is no primary key and value
      { name: 'NocoBase' },
    ]
  },
});
```

### `createMany()`

Inserts multiple newly created data into the data table. This is equivalent to calling the `create()` method multiple times.

**Signature**

* `createMany(options: CreateManyOptions): Promise<Model[]>`

**Type**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**Detailed Information**

* `records`: An array of data objects to be created.
* `transaction`: Transaction object. If no transaction parameter is passed, the method will automatically create an internal transaction.

**Example**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'NocoBase 1.0 Release Notes',
      tags: [
        // Update data when there is a primary key and value of the associated table
        { id: 1 },
        // Create data when there is no primary key and value
        { name: 'NocoBase' },
      ]
    },
    {
      title: 'NocoBase 1.1 Release Notes',
      tags: [
        { id: 1 }
      ]
    },
  ],
});
```

### `update()`

Update data in the data table. Equivalent to `Model.update()` in Sequelize. When the data object to be updated carries any associated field, the corresponding associated data record is created or updated along with it.

**Signature**

* `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**Example**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'NocoBase 1.0 Release Notes',
    tags: [
       // Update data when there is a primary key and value of the associated table
      { id: 1 },
       // Create data when there is no primary key and value
      { name: 'NocoBase' },
    ]
  },
});
```

### `destroy()`

Delete data from the data table. Equivalent to `Model.destroy()` in Sequelize.

**Signature**

* `async destroy(options?: TargetKey | TargetKey[] | DestoryOptions): Promise<number>`

**Type**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Detailed Information**

* `filter`：Specify the filtering conditions of the records to be deleted. Refer to the [`find()`](#find) method for the detailed usage of the filter.
* `filterByTk`：Specify the filtering conditions by TargetKey.
* `truncate`: Whether to empty the table data, this parameter is valid if no `filter` or `filterByTk` parameter is passed.
* `transaction`: Transaction object. If no transaction parameter is passed, the method will automatically create an internal transaction.
