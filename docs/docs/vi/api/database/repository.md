:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Repository

## Tổng quan

Trên một đối tượng `bộ sưu tập` nhất định, bạn có thể lấy đối tượng `Repository` của nó để thực hiện các thao tác đọc và ghi trên bảng dữ liệu.

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

Trên đối tượng `Repository`, bạn có thể gọi các phương thức liên quan đến `find*` để thực hiện các thao tác truy vấn. Tất cả các phương thức truy vấn đều hỗ trợ truyền tham số `filter` để lọc dữ liệu.

```javascript
// SELECT * FROM users WHERE id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### Toán tử

Tham số `filter` trong `Repository` còn cung cấp nhiều toán tử khác nhau để thực hiện các thao tác truy vấn đa dạng hơn.

```javascript
// SELECT * FROM users WHERE age > 18
userRepository.find({
  filter: {
    age: {
      $gt: 18,
    },
  },
});

// SELECT * FROM users WHERE age > 18 OR name LIKE '%张%'
userRepository.find({
  filter: {
    $or: [{ age: { $gt: 18 } }, { name: { $like: '%张%' } }],
  },
});
```

Để biết thêm chi tiết về các toán tử, vui lòng tham khảo [Toán tử lọc](/api/database/operators).

#### Kiểm soát trường dữ liệu

Khi thực hiện thao tác truy vấn, bạn có thể kiểm soát các trường dữ liệu đầu ra thông qua các tham số `fields`, `except` và `appends`.

- `fields`: Chỉ định các trường dữ liệu đầu ra
- `except`: Loại trừ các trường dữ liệu đầu ra
- `appends`: Thêm các trường dữ liệu liên kết vào đầu ra

```javascript
// Kết quả chỉ bao gồm các trường id và name
userRepository.find({
  fields: ['id', 'name'],
});

// Kết quả sẽ không bao gồm trường password
userRepository.find({
  except: ['password'],
});

// Kết quả sẽ bao gồm dữ liệu từ đối tượng liên kết posts
userRepository.find({
  appends: ['posts'],
});
```

#### Truy vấn trường liên kết

Tham số `filter` hỗ trợ lọc theo các trường liên kết, ví dụ:

```javascript
// Truy vấn các đối tượng người dùng (user) mà các bài đăng (posts) liên kết của họ có một đối tượng với tiêu đề là 'post title'.
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

Các trường liên kết cũng có thể được lồng vào nhau.

```javascript
// Truy vấn các đối tượng người dùng (user) mà kết quả truy vấn thỏa mãn điều kiện các bình luận (comments) của bài đăng (posts) của họ chứa từ khóa.
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### Sắp xếp

Bạn có thể sắp xếp kết quả truy vấn bằng cách sử dụng tham số `sort`.

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

Bạn cũng có thể sắp xếp theo các trường của đối tượng liên kết.

```javascript
await userRepository.find({
  sort: 'profile.createdAt',
});
```

### Tạo mới

#### Tạo mới cơ bản

Tạo các đối tượng dữ liệu mới thông qua `Repository`.

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('张三', 18)

// Hỗ trợ tạo hàng loạt
await userRepository.create([
  {
    name: '张三',
    age: 18,
  },
  {
    name: '李四',
    age: 20,
  },
]);
```

#### Tạo liên kết

Khi tạo mới, bạn có thể đồng thời tạo các đối tượng liên kết. Tương tự như truy vấn, việc sử dụng lồng ghép các đối tượng liên kết cũng được hỗ trợ, ví dụ:

```javascript
await userRepository.create({
  name: '张三',
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
// Khi tạo người dùng, một bài đăng (post) sẽ được tạo và liên kết với người dùng, và các thẻ (tags) sẽ được tạo và liên kết với bài đăng đó.
```

Nếu đối tượng liên kết đã tồn tại trong cơ sở dữ liệu, bạn có thể truyền ID của nó. Khi tạo mới, một mối quan hệ liên kết sẽ được thiết lập với đối tượng liên kết đó.

```javascript
const tag1 = await tagRepository.findOne({
  filter: {
    name: 'tag1',
  },
});

await userRepository.create({
  name: '张三',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          id: tag1.id, // Thiết lập liên kết với đối tượng liên kết đã tồn tại
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

Sau khi lấy được đối tượng dữ liệu, bạn có thể trực tiếp sửa đổi các thuộc tính trên đối tượng dữ liệu (`Model`) và sau đó gọi phương thức `save` để lưu các thay đổi.

```javascript
const user = await userRepository.findOne({
  filter: {
    name: '张三',
  },
});

user.age = 20;
await user.save();
```

Đối tượng dữ liệu `Model` kế thừa từ Sequelize Model. Để biết các thao tác trên `Model`, vui lòng tham khảo [Sequelize Model](https://sequelize.org/master/manual/model-basics.html).

Bạn cũng có thể cập nhật dữ liệu thông qua `Repository`:

```javascript
// Cập nhật các bản ghi dữ liệu thỏa mãn điều kiện lọc.
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
  },
});
```

Khi cập nhật, bạn có thể kiểm soát các trường dữ liệu được cập nhật bằng cách sử dụng các tham số `whitelist` và `blacklist`, ví dụ:

```javascript
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
    name: '李四',
  },
  whitelist: ['age'], // Chỉ cập nhật trường age
});
```

#### Cập nhật trường liên kết

Khi cập nhật, bạn có thể thiết lập các đối tượng liên kết, ví dụ:

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
        id: tag1.id, // Thiết lập liên kết với tag1
      },
      {
        name: 'tag2', // Tạo một thẻ (tag) mới và thiết lập liên kết
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // Hủy liên kết giữa bài đăng (post) và các thẻ (tags)
  },
});
```

### Xóa

Bạn có thể gọi phương thức `destroy()` trong `Repository` để thực hiện thao tác xóa. Khi xóa, bạn cần chỉ định điều kiện lọc:

```javascript
await userRepository.destroy({
  filter: {
    status: 'blocked',
  },
});
```

## Hàm tạo

Thông thường, hàm này không được gọi trực tiếp bởi nhà phát triển. Nó chủ yếu được khởi tạo sau khi đăng ký kiểu thông qua `db.registerRepositories()` và chỉ định kiểu repository đã đăng ký tương ứng trong các tham số của `db.collection()`.

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
  // liên kết đến repository đã đăng ký ở đây
  repository: 'books',
});

await db.sync();

const books = db.getRepository('books') as MyRepository;
await books.myQuery('SELECT * FROM books;');
```

## Thành viên thể hiện

### `database`

Thể hiện quản lý cơ sở dữ liệu của ngữ cảnh hiện tại.

### `collection`

Thể hiện quản lý `bộ sưu tập` tương ứng.

### `model`

Lớp mô hình dữ liệu tương ứng.

## Phương thức thể hiện

### `find()`

Truy vấn một tập dữ liệu từ cơ sở dữ liệu, có thể chỉ định các điều kiện lọc, sắp xếp, v.v.

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

**Chi tiết**

#### `filter: Filter`

Điều kiện truy vấn, dùng để lọc kết quả dữ liệu. Trong các tham số truy vấn được truyền vào, `key` là tên trường cần truy vấn, và `value` có thể là giá trị cần truy vấn hoặc được sử dụng kết hợp với các toán tử để lọc dữ liệu theo các điều kiện khác.

```typescript
// Truy vấn các bản ghi có tên là foo và tuổi lớn hơn 18
repository.find({
  filter: {
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
```

Để biết thêm các toán tử, vui lòng tham khảo [Toán tử truy vấn](./operators.md).

#### `filterByTk: TargetKey`

Truy vấn dữ liệu bằng `TargetKey`, đây là một phương thức tiện lợi cho tham số `filter`. Trường cụ thể mà `TargetKey` đại diện có thể được [cấu hình](./collection.md#filtertargetkey) trong `bộ sưu tập`, mặc định là `primaryKey`.

```typescript
// Theo mặc định, tìm bản ghi có id là 1
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

Các cột truy vấn, dùng để kiểm soát kết quả trường dữ liệu. Sau khi truyền tham số này, chỉ các trường được chỉ định sẽ được trả về.

#### `except: string[]`

Các cột loại trừ, dùng để kiểm soát kết quả trường dữ liệu. Sau khi truyền tham số này, các trường được truyền vào sẽ không được xuất ra.

#### `appends: string[]`

Các cột bổ sung, dùng để tải dữ liệu liên kết. Sau khi truyền tham số này, các trường liên kết được chỉ định cũng sẽ được xuất ra.

#### `sort: string[] | string`

Chỉ định cách sắp xếp kết quả truy vấn. Tham số được truyền vào là tên trường, mặc định sắp xếp theo thứ tự tăng dần `asc`. Nếu cần sắp xếp theo thứ tự giảm dần `desc`, bạn có thể thêm ký hiệu `-` trước tên trường, ví dụ: `['-id', 'name']`, có nghĩa là sắp xếp theo `id giảm dần, name tăng dần`.

#### `limit: number`

Giới hạn số lượng kết quả, tương tự như `limit` trong `SQL`.

#### `offset: number`

Độ lệch truy vấn, tương tự như `offset` trong `SQL`.

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

Truy vấn một bản ghi dữ liệu duy nhất từ cơ sở dữ liệu thỏa mãn các điều kiện cụ thể. Tương đương với `Model.findOne()` trong Sequelize.

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

Truy vấn tổng số dữ liệu thỏa mãn các điều kiện cụ thể từ cơ sở dữ liệu. Tương đương với `Model.count()` trong Sequelize.

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
    title: '三字经',
  },
});
```

### `findAndCount()`

Truy vấn một tập dữ liệu và tổng số kết quả thỏa mãn các điều kiện cụ thể từ cơ sở dữ liệu. Tương đương với `Model.findAndCountAll()` trong Sequelize.

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

**Chi tiết**

Các tham số truy vấn giống như `find()`. Giá trị trả về là một mảng, phần tử đầu tiên là kết quả truy vấn, phần tử thứ hai là tổng số kết quả.

### `create()`

Chèn một bản ghi dữ liệu mới vào bảng dữ liệu. Tương đương với `Model.create()` trong Sequelize. Khi đối tượng dữ liệu cần tạo mang thông tin về các trường quan hệ, các bản ghi dữ liệu quan hệ tương ứng cũng sẽ được tạo hoặc cập nhật đồng thời.

**Chữ ký**

- `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**Ví dụ**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // Khi có giá trị khóa chính của bảng quan hệ, sẽ cập nhật bản ghi đó
      { id: 1 },
      // Khi không có giá trị khóa chính, sẽ tạo dữ liệu mới
      { name: 'NocoBase' },
    ],
  },
});
```

### `createMany()`

Chèn nhiều bản ghi dữ liệu mới vào bảng dữ liệu. Tương đương với việc gọi phương thức `create()` nhiều lần.

**Chữ ký**

- `createMany(options: CreateManyOptions): Promise<Model[]>`

**Kiểu**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**Chi tiết**

- `records`: Một mảng các đối tượng dữ liệu cho các bản ghi cần tạo.
- `transaction`: Đối tượng giao dịch. Nếu không truyền tham số giao dịch, phương thức này sẽ tự động tạo một giao dịch nội bộ.

**Ví dụ**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'NocoBase 1.0 发布日志',
      tags: [
        // Khi có giá trị khóa chính của bảng quan hệ, sẽ cập nhật bản ghi đó
        { id: 1 },
        // Khi không có giá trị khóa chính, sẽ tạo dữ liệu mới
        { name: 'NocoBase' },
      ],
    },
    {
      title: 'NocoBase 1.1 发布日志',
      tags: [{ id: 1 }],
    },
  ],
});
```

### `update()`

Cập nhật dữ liệu trong bảng dữ liệu. Tương đương với `Model.update()` trong Sequelize. Khi đối tượng dữ liệu cần cập nhật mang thông tin về các trường quan hệ, các bản ghi dữ liệu quan hệ tương ứng cũng sẽ được tạo hoặc cập nhật đồng thời.

**Chữ ký**

- `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**Ví dụ**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // Khi có giá trị khóa chính của bảng quan hệ, sẽ cập nhật bản ghi đó
      { id: 1 },
      // Khi không có giá trị khóa chính, sẽ tạo dữ liệu mới
      { name: 'NocoBase' },
    ],
  },
});
```

### `destroy()`

Xóa dữ liệu trong bảng dữ liệu. Tương đương với `Model.destroy()` trong Sequelize.

**Chữ ký**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<number>`

**Kiểu**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Chi tiết**

- `filter`: Chỉ định các điều kiện lọc cho các bản ghi cần xóa. Để biết cách sử dụng chi tiết của Filter, vui lòng tham khảo phương thức [`find()`](#find).
- `filterByTk`: Chỉ định các điều kiện lọc cho các bản ghi cần xóa theo TargetKey.
- `truncate`: Có xóa sạch dữ liệu bảng hay không, có hiệu lực khi không truyền tham số `filter` hoặc `filterByTk`.
- `transaction`: Đối tượng giao dịch. Nếu không truyền tham số giao dịch, phương thức này sẽ tự động tạo một giao dịch nội bộ.