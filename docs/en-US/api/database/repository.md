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
// The result contains only the <i>id</i> and <i>name</i> fields
userRepository.find({
  fields: ["id", "name"],
});

// The result does not contain only the <i>password</i> field
userRepository.find({
  except: ["password"],
});

// The result contains data associated with the <i>posts</i> object
userRepository.find({
  appends: ["posts"],
});
```

#### Associated Field Query

The `filter` parameter supports filtering by associated fields, for example:

```javascript
// Find the <i>user</i> objects whose associated posts have title of "post title"
userRepository.find({
  filter: {
      "posts.title": "post title"
  }
});
```

Associated fields can also be nested:

```javascript
// Find the <i>user</i> objects whose associated posts have comments containing "keywords"
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

Create associated objects at the same time of creating data. Similar to query, nested use of associated objects is also supported. For example:

```javascript
await userRepository.create({
  name: "张三",
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
// When crearing a user, creat a post to associate with the user, and create tags to associate with the post
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
  whitelist: ["age"], // Only update the <i>age</i> field
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

It is usually not called directly by the developer, the instantiation is done mainly by specifying a coressponding repository type that is already registered in the parameter of `db.colletion()`. Repository type is registered through `db.registerRepositories()`.

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

上下文所在的数据库管理实例。

### `collection`

对应的数据表管理实例。

### `model`

对应的数据模型类。

## 实例方法


### `find()`

从数据库查询数据集，可指定筛选条件、排序等。

**Signature**

* `async find(options?: FindOptions): Promise<Model[]>`

**类型**
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

**详细信息**

#### `filter: Filter` 
查询条件，用于过滤数据结果。传入的查询参数中，`key` 为查询的字段名，`value` 可传要查询的值，
也可配合使用操作符进行其他条件的数据筛选。

```typescript
// 查询 name 为 foo，并且 age 大于 18 的记录
repository.find({
  filter: {
    name: "foo",
    age: {
      $gt: 18,
    },
  }
})
```
更多操作符请参考 [查询操作符](./operators.md)。

#### `filterByTk: TargetKey`
通过 `TargetKey` 查询数据，为 `filter` 参数的便捷方法。`TargetKey` 具体是哪一个字段， 
可在 `Collection` 中进行[配置](./collection.md#filtertargetkey)，默认为 `primaryKey`。

```typescript

// 默认情况下，查找 id 为 1 的记录
repository.find({
  filterByTk: 1,
});

```

#### `fields: string[]`
查询列，用户控制数据字段结果。传入此参数之后，只会返回指定的字段。

#### `except: string[]`
排除列，用于控制数据字段结果。传入此参数之后，传入的字段将不会输出。

#### `appends: string[]`
追加列，用于加载关联数据。传入此参数之后，指定的关联字段将一并输出。

#### `sort: string[] | string`
指定查询结果排序方式，传入参数为字段名称，默认按照升序 `asc` 排序，若需按降序 `desc` 排序，
可在字段名称前加上 `-` 符号，如：`['-id', 'name']`，表示按 `id desc, name asc` 排序。

#### `limit: number`
限制结果数量，同 `SQL` 中的 `limit`

#### `offset: number` 
查询偏移量，同 `SQL` 中的 `offset`

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

从数据库查询特定条件的单条数据。相当于 Sequelize 中的 `Model.findOne()`。

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

从数据库查询特定条件的数据总数。相当于 Sequelize 中的 `Model.count()`。

**Signature**

* `count(options?: CountOptions): Promise<number>`

**类型**
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
    title: '三字经'
  }
});
```


### `findAndCount()`

从数据库查询特定条件的数据集和结果数。相当于 Sequelize 中的 `Model.findAndCountAll()`。

**Signature**

* `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**类型**
```typescript
type FindAndCountOptions = Omit<SequelizeAndCountOptions, 'where' | 'include' | 'order'> & CommonFindOptions;
```

**详细信息**

查询参数与 `find()` 相同。返回值为一个数组，第一个元素为查询结果，第二个元素为结果总数。

### `create()`

向数据表插入一条新创建的数据。相当于 Sequelize 中的 `Model.create()`。当要创建的数据对象携带关系字段的信息时，会一并创建或更新相应的关系数据记录。

**Signature**

* `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**Example**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // 有关系表主键值时为更新该条数据
      { id: 1 },
      // 没有主键值时为创建新数据
      { name: 'NocoBase' },
    ]
  },
});
```

### `createMany()`

向数据表插入多条新创建的数据。相当于多次调用 `create()` 方法。

**Signature**

* `createMany(options: CreateManyOptions): Promise<Model[]>`

**类型**
```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**详细信息**

* `records`：要创建的记录的数据对象数组。
* `transaction`: 事务对象。如果没有传入事务参数，该方法会自动创建一个内部事务。

**Example**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'NocoBase 1.0 发布日志',
      tags: [
        // 有关系表主键值时为更新该条数据
        { id: 1 },
        // 没有主键值时为创建新数据
        { name: 'NocoBase' },
      ]
    },
    {
      title: 'NocoBase 1.1 发布日志',
      tags: [
        { id: 1 }
      ]
    },
  ],
});
```

### `update()`

更新数据表中的数据。相当于 Sequelize 中的 `Model.update()`。当要更新的数据对象携带关系字段的信息时，会一并创建或更新相应的关系数据记录。

**Signature**

* `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**Example**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // 有关系表主键值时为更新该条数据
      { id: 1 },
      // 没有主键值时为创建新数据
      { name: 'NocoBase' },
    ]
  },
});
```

### `destory()`

删除数据表中的数据。相当于 Sequelize 中的 `Model.destroy()`。

**Signature**

* `async destory(options?: TargetKey | TargetKey[] | DestoryOptions): Promise<number>`

**类型**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**详细信息**

* `filter`：指定要删除的记录的过滤条件。Filter 详细用法可参考 [`find()`](#find) 方法。
* `filterByTk`：按 TargetKey 指定要删除的记录的过滤条件。
* `truncate`: 是否清空表数据，在没有传入 `filter` 或 `filterByTk` 参数时有效。
* `transaction`: 事务对象。如果没有传入事务参数，该方法会自动创建一个内部事务。
![image](https://user-images.githubusercontent.com/63629092/213859493-1eb7eb5b-0368-41e8-8fb5-d0d735afd429.png)
