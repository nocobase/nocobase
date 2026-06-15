---
title: "Repository"
description: "API Repository của NocoBase Database: CRUD trên Collection, find/findOne/create/update/destroy."
keywords: "Repository,CRUD,find,findOne,create,update,destroy,NocoBase"
---

# Repository

## Tổng quan

Trên một đối tượng `Collection` cho trước, có thể lấy đối tượng `Repository` của nó để thực hiện thao tác đọc/ghi trên bảng dữ liệu.

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

### Truy vấn

#### Truy vấn cơ bản

Trên đối tượng `Repository`, gọi các phương thức liên quan `find*` để thực hiện thao tác truy vấn. Các phương thức truy vấn đều hỗ trợ truyền tham số `filter` để lọc dữ liệu.

```javascript
// SELECT * FROM users WHERE id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### Toán tử

Tham số `filter` trong `Repository` còn cung cấp nhiều toán tử để thực hiện các thao tác truy vấn đa dạng hơn.

```javascript
// SELECT * FROM users WHERE age > 18
userRepository.find({
  filter: {
    age: {
      $gt: 18,
    },
  },
});

// SELECT * FROM users WHERE age > 18 OR name LIKE '%Nguyễn%'
userRepository.find({
  filter: {
    $or: [{ age: { $gt: 18 } }, { name: { $like: '%Nguyễn%' } }],
  },
});
```

Để biết thêm thông tin chi tiết về toán tử, vui lòng tham khảo [Filter Operators](/api/database/operators).

#### Kiểm soát field

Khi thực hiện thao tác truy vấn, có thể kiểm soát field kết quả qua các tham số `fields`, `except`, `appends`.

- `fields`: Chỉ định các field được trả về.
- `except`: Loại trừ các field không trả về.
- `appends`: Thêm các field quan hệ vào kết quả.

```javascript
// Kết quả chỉ chứa field id và name
userRepository.find({
  fields: ['id', 'name'],
});

// Kết quả không chứa field password
userRepository.find({
  except: ['password'],
});

// Kết quả sẽ chứa dữ liệu của đối tượng quan hệ posts
userRepository.find({
  appends: ['posts'],
});
```

#### Truy vấn field quan hệ

Tham số `filter` hỗ trợ lọc theo field quan hệ, ví dụ:

```javascript
// Truy vấn đối tượng user, có quan hệ posts với title là 'post title'
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

Field quan hệ cũng có thể lồng nhau:

```javascript
// Truy vấn đối tượng user, kết quả là user có posts mà comments chứa keywords
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### Sắp xếp

Qua tham số `sort`, có thể sắp xếp kết quả truy vấn.

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

Cũng có thể sắp xếp theo field của đối tượng quan hệ:

```javascript
await userRepository.find({
  sort: 'profile.createdAt',
});
```

### Tạo

#### Tạo cơ bản

Tạo đối tượng dữ liệu mới qua `Repository`.

```javascript
await userRepository.create({
  name: 'Nguyễn Văn A',
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('Nguyễn Văn A', 18)

// Hỗ trợ tạo hàng loạt
await userRepository.create([
  {
    name: 'Nguyễn Văn A',
    age: 18,
  },
  {
    name: 'Trần Văn B',
    age: 20,
  },
]);
```

#### Tạo quan hệ

Khi tạo có thể đồng thời tạo đối tượng quan hệ. Tương tự truy vấn, cũng hỗ trợ sử dụng lồng nhau với đối tượng quan hệ, ví dụ:

```javascript
await userRepository.create({
  name: 'Nguyễn Văn A',
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
// Đồng thời với việc tạo user, sẽ tạo post liên kết với user, tạo tags liên kết với post.
```

Nếu đối tượng quan hệ đã tồn tại trong cơ sở dữ liệu, có thể truyền ID, khi tạo sẽ thiết lập quan hệ với đối tượng quan hệ đó.

```javascript
const tag1 = await tagRepository.findOne({
  filter: {
    name: 'tag1',
  },
});

await userRepository.create({
  name: 'Nguyễn Văn A',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          id: tag1.id, // Thiết lập quan hệ với đối tượng quan hệ đã tồn tại
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
```

### Cập nhật

#### Cập nhật cơ bản

Sau khi lấy được đối tượng dữ liệu, có thể trực tiếp sửa thuộc tính trên đối tượng dữ liệu (`Model`), sau đó gọi phương thức `save` để lưu sửa đổi.

```javascript
const user = await userRepository.findOne({
  filter: {
    name: 'Nguyễn Văn A',
  },
});

user.age = 20;
await user.save();
```

Đối tượng dữ liệu `Model` kế thừa từ Sequelize Model, các thao tác trên `Model` có thể tham khảo [Sequelize Model](https://sequelize.org/master/manual/model-basics.html).

Cũng có thể cập nhật dữ liệu qua `Repository`:

```javascript
// Sửa các bản ghi thỏa điều kiện lọc
await userRepository.update({
  filter: {
    name: 'Nguyễn Văn A',
  },
  values: {
    age: 20,
  },
});
```

Khi cập nhật, có thể kiểm soát field cập nhật qua tham số `whitelist`, `blacklist`, ví dụ:

```javascript
await userRepository.update({
  filter: {
    name: 'Nguyễn Văn A',
  },
  values: {
    age: 20,
    name: 'Trần Văn B',
  },
  whitelist: ['age'], // Chỉ cập nhật field age
});
```

#### Cập nhật field quan hệ

Khi cập nhật, có thể đặt đối tượng quan hệ, ví dụ:

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
        id: tag1.id, // Thiết lập quan hệ với tag1
      },
      {
        name: 'tag2', // Tạo tag mới và thiết lập quan hệ
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // Gỡ quan hệ giữa post và tags
  },
});
```

### Xóa

Có thể gọi phương thức `destroy()` trong `Repository` để thực hiện thao tác xóa. Khi xóa cần chỉ định điều kiện lọc:

```javascript
await userRepository.destroy({
  filter: {
    status: 'blocked',
  },
});
```

## Constructor

Thông thường nhà phát triển không gọi trực tiếp, mà chủ yếu sau khi đăng ký kiểu qua `db.registerRepositories()`, chỉ định kiểu repository đã đăng ký trong tham số của `db.colletion()` và hoàn tất khởi tạo.

**Chữ ký**

- `constructor(collection: Collection)`

**Ví dụ**

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

## Thành viên của instance

### `database`

Instance quản lý cơ sở dữ liệu trong ngữ cảnh.

### `collection`

Instance quản lý bảng dữ liệu tương ứng.

### `model`

Lớp model dữ liệu tương ứng.

## Phương thức của instance

### `find()`

Truy vấn tập dữ liệu từ cơ sở dữ liệu, có thể chỉ định điều kiện lọc, sắp xếp, v.v.

**Chữ ký**

- `async find(options?: FindOptions): Promise<Model[]>`

**Kiểu**

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

**Thông tin chi tiết**

#### `filter: Filter`

Điều kiện truy vấn, dùng để lọc kết quả dữ liệu. Trong tham số truy vấn được truyền vào, `key` là tên field cần truy vấn, `value` có thể là giá trị cần truy vấn, hoặc kết hợp với toán tử để lọc dữ liệu theo điều kiện khác.

```typescript
// Truy vấn các bản ghi có name là foo và age lớn hơn 18
repository.find({
  filter: {
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
```

Để biết thêm toán tử, vui lòng tham khảo [Toán tử truy vấn](./operators.md).

#### `filterByTk: TargetKey`

Truy vấn dữ liệu qua `TargetKey`, là phương thức tắt của tham số `filter`. `TargetKey` là field nào cụ thể có thể được [cấu hình](./collection.md#filtertargetkey) trong `Collection`, mặc định là `primaryKey`.

```typescript
// Mặc định, tìm bản ghi có id là 1
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

Cột truy vấn, dùng để kiểm soát field kết quả. Sau khi truyền tham số này, chỉ trả về các field được chỉ định.

#### `except: string[]`

Cột loại trừ, dùng để kiểm soát field kết quả. Sau khi truyền tham số này, các field được truyền vào sẽ không được xuất ra.

#### `appends: string[]`

Cột bổ sung, dùng để load dữ liệu quan hệ. Sau khi truyền tham số này, các field quan hệ được chỉ định sẽ được xuất cùng.

#### `sort: string[] | string`

Chỉ định cách sắp xếp kết quả truy vấn, tham số truyền vào là tên field, mặc định sắp xếp tăng dần `asc`. Nếu cần sắp xếp giảm dần `desc`, có thể thêm dấu `-` trước tên field, ví dụ: `['-id', 'name']` biểu thị sắp xếp theo `id desc, name asc`.

#### `limit: number`

Giới hạn số lượng kết quả, giống `limit` trong `SQL`.

#### `offset: number`

Offset truy vấn, giống `offset` trong `SQL`.

**Ví dụ**

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

Truy vấn từ cơ sở dữ liệu một bản ghi đơn lẻ thỏa mãn điều kiện cụ thể. Tương đương với `Model.findOne()` trong Sequelize.

**Chữ ký**

- `async findOne(options?: FindOneOptions): Promise<Model | null>`

<embed src="./shared/find-one.md"></embed>

**Ví dụ**

```ts
const posts = db.getRepository('posts');

const result = await posts.findOne({
  filterByTk: 1,
});
```

### `count()`

Truy vấn từ cơ sở dữ liệu tổng số bản ghi thỏa mãn điều kiện cụ thể. Tương đương với `Model.count()` trong Sequelize.

**Chữ ký**

- `count(options?: CountOptions): Promise<number>`

**Kiểu**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

**Ví dụ**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: 'Tam Tự Kinh',
  },
});
```

### `findAndCount()`

Truy vấn từ cơ sở dữ liệu tập dữ liệu thỏa mãn điều kiện cụ thể và số lượng kết quả. Tương đương với `Model.findAndCountAll()` trong Sequelize.

**Chữ ký**

- `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**Kiểu**

```typescript
type FindAndCountOptions = Omit<
  SequelizeAndCountOptions,
  'where' | 'include' | 'order'
> &
  CommonFindOptions;
```

**Thông tin chi tiết**

Tham số truy vấn giống `find()`. Giá trị trả về là một mảng, phần tử đầu tiên là kết quả truy vấn, phần tử thứ hai là tổng số kết quả.

### `create()`

Insert một bản ghi vừa được tạo vào bảng dữ liệu. Tương đương với `Model.create()` trong Sequelize. Khi đối tượng dữ liệu cần tạo mang theo thông tin field quan hệ, sẽ đồng thời tạo hoặc cập nhật bản ghi dữ liệu quan hệ tương ứng.

**Chữ ký**

- `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**Ví dụ**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'Nhật ký phát hành NocoBase 1.0',
    tags: [
      // Có giá trị khóa chính của bảng quan hệ thì sẽ cập nhật bản ghi đó
      { id: 1 },
      // Không có giá trị khóa chính thì sẽ tạo dữ liệu mới
      { name: 'NocoBase' },
    ],
  },
});
```

### `createMany()`

Insert nhiều bản ghi vừa được tạo vào bảng dữ liệu. Tương đương với gọi nhiều lần phương thức `create()`.

**Chữ ký**

- `createMany(options: CreateManyOptions): Promise<Model[]>`

**Kiểu**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**Thông tin chi tiết**

- `records`: Mảng đối tượng dữ liệu của các bản ghi cần tạo.
- `transaction`: Đối tượng transaction. Nếu không truyền tham số transaction, phương thức sẽ tự động tạo một transaction nội bộ.

**Ví dụ**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'Nhật ký phát hành NocoBase 1.0',
      tags: [
        // Có giá trị khóa chính của bảng quan hệ thì sẽ cập nhật bản ghi đó
        { id: 1 },
        // Không có giá trị khóa chính thì sẽ tạo dữ liệu mới
        { name: 'NocoBase' },
      ],
    },
    {
      title: 'Nhật ký phát hành NocoBase 1.1',
      tags: [{ id: 1 }],
    },
  ],
});
```

### `update()`

Cập nhật dữ liệu trong bảng dữ liệu. Tương đương với `Model.update()` trong Sequelize. Khi đối tượng dữ liệu cần cập nhật mang theo thông tin field quan hệ, sẽ đồng thời tạo hoặc cập nhật bản ghi dữ liệu quan hệ tương ứng.

**Chữ ký**

- `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**Ví dụ**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'Nhật ký phát hành NocoBase 1.0',
    tags: [
      // Có giá trị khóa chính của bảng quan hệ thì sẽ cập nhật bản ghi đó
      { id: 1 },
      // Không có giá trị khóa chính thì sẽ tạo dữ liệu mới
      { name: 'NocoBase' },
    ],
  },
});
```

### `destroy()`

Xóa dữ liệu trong bảng dữ liệu. Tương đương với `Model.destroy()` trong Sequelize.

**Chữ ký**

- `async destory(options?: TargetKey | TargetKey[] | DestoryOptions): Promise<number>`

**Kiểu**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Thông tin chi tiết**

- `filter`: Chỉ định điều kiện lọc của bản ghi cần xóa. Cách dùng chi tiết Filter có thể tham khảo phương thức [`find()`](#find).
- `filterByTk`: Chỉ định điều kiện lọc của bản ghi cần xóa theo TargetKey.
- `truncate`: Có làm sạch dữ liệu bảng hay không, có hiệu lực khi không truyền tham số `filter` hoặc `filterByTk`.
- `transaction`: Đối tượng transaction. Nếu không truyền tham số transaction, phương thức sẽ tự động tạo một transaction nội bộ.
