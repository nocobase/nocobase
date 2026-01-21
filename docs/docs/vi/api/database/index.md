:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Database

## Tổng quan

`Database` là công cụ tương tác cơ sở dữ liệu do NocoBase cung cấp, mang đến khả năng tương tác cơ sở dữ liệu rất tiện lợi cho các ứng dụng không mã (no-code) và ít mã (low-code). Các cơ sở dữ liệu hiện được hỗ trợ bao gồm:

- SQLite 3.8.8+
- MySQL 8.0.17+
- PostgreSQL 10.0+

### Kết nối cơ sở dữ liệu

Trong hàm tạo (`constructor`) của `Database`, bạn có thể cấu hình kết nối cơ sở dữ liệu bằng cách truyền tham số `options`.

```javascript
const { Database } = require('@nocobase/database');

// Tham số cấu hình cơ sở dữ liệu SQLite
const database = new Database({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'nocobase',
  username: 'root',
  password: 'password'
})

// Tham số cấu hình cơ sở dữ liệu MySQL \ PostgreSQL
const database = new Database({
  dialect: /* 'postgres' hoặc 'mysql' */,
  database: 'database',
  username: 'username',
  password: 'password',
  host: 'localhost',
  port: 'port'
})

```

Để biết chi tiết các tham số cấu hình, vui lòng tham khảo [Hàm tạo](#构造函数).

### Định nghĩa mô hình dữ liệu

`Database` định nghĩa cấu trúc cơ sở dữ liệu thông qua `bộ sưu tập`. Một đối tượng `bộ sưu tập` đại diện cho một bảng trong cơ sở dữ liệu.

```javascript
// Định nghĩa bộ sưu tập
const UserCollection = database.collection({
  name: 'users',
  fields: [
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'age',
      type: 'integer',
    },
  ],
});
```

Sau khi định nghĩa cấu trúc cơ sở dữ liệu hoàn tất, bạn có thể sử dụng phương thức `sync()` để đồng bộ hóa cấu trúc cơ sở dữ liệu.

```javascript
await database.sync();
```

Để biết thêm chi tiết về cách sử dụng `bộ sưu tập`, vui lòng tham khảo [Bộ sưu tập](/api/database/collection).

### Đọc/Ghi dữ liệu

`Database` thực hiện các thao tác trên dữ liệu thông qua `Repository`.

```javascript
const UserRepository = UserCollection.repository();

// Tạo mới
await UserRepository.create({
  name: '张三',
  age: 18,
});

// Truy vấn
const user = await UserRepository.findOne({
  filter: {
    name: '张三',
  },
});

// Cập nhật
await UserRepository.update({
  values: {
    age: 20,
  },
});

// Xóa
await UserRepository.destroy(user.id);
```

Để biết thêm chi tiết về cách sử dụng CRUD dữ liệu, vui lòng tham khảo [Repository](/api/database/repository).

## Hàm tạo

**Chữ ký**

- `constructor(options: DatabaseOptions)`

Tạo một phiên bản cơ sở dữ liệu.

**Tham số**

| Tham số | Kiểu | Mặc định | Mô tả |
| :--------------------- | :-------------- | :------------- | :------------------------------------------------------------------------------------------------------------------- |
| `options.host` | `string` | `'localhost'` | Máy chủ cơ sở dữ liệu |
| `options.port` | `number` | - | Cổng dịch vụ cơ sở dữ liệu, có cổng mặc định tương ứng với cơ sở dữ liệu được sử dụng |
| `options.username` | `string` | - | Tên người dùng cơ sở dữ liệu |
| `options.password` | `string` | - | Mật khẩu cơ sở dữ liệu |
| `options.database` | `string` | - | Tên cơ sở dữ liệu |
| `options.dialect` | `string` | `'mysql'` | Loại cơ sở dữ liệu |
| `options.storage?` | `string` | `':memory:'` | Chế độ lưu trữ cho SQLite |
| `options.logging?` | `boolean` | `false` | Có bật ghi nhật ký không |
| `options.define?` | `Object` | `{}` | Các tham số định nghĩa bảng mặc định |
| `options.tablePrefix?` | `string` | `''` | Phần mở rộng của NocoBase, tiền tố tên bảng |
| `options.migrator?` | `UmzugOptions` | `{}` | Phần mở rộng của NocoBase, các tham số liên quan đến trình quản lý di chuyển (migration manager), tham khảo triển khai [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15) |

## Các phương thức liên quan đến di chuyển (Migration)

### `addMigration()`

Thêm một tệp di chuyển (migration file) duy nhất.

**Chữ ký**

- `addMigration(options: MigrationItem)`

**Tham số**

| Tham số | Kiểu | Mặc định | Mô tả |
| :-------------------- | :------------------ | :----- | :---------------------- |
| `options.name` | `string` | - | Tên tệp di chuyển |
| `options.context?` | `string` | - | Ngữ cảnh của tệp di chuyển |
| `options.migration?` | `typeof Migration` | - | Lớp tùy chỉnh cho tệp di chuyển |
| `options.up` | `Function` | - | Phương thức `up` của tệp di chuyển |
| `options.down` | `Function` | - | Phương thức `down` của tệp di chuyển |

**Ví dụ**

```ts
db.addMigration({
  name: '20220916120411-test-1',
  async up() {
    const queryInterface = this.context.db.sequelize.getQueryInterface();
    await queryInterface.query(/* các câu lệnh SQL di chuyển của bạn */);
  },
});
```

### `addMigrations()`

Thêm các tệp di chuyển từ một thư mục được chỉ định.

**Chữ ký**

- `addMigrations(options: AddMigrationsOptions): void`

**Tham số**

| Tham số | Kiểu | Mặc định | Mô tả |
| :-------------------- | :--------- | :------------- | :---------------- |
| `options.directory` | `string` | `''` | Thư mục chứa các tệp di chuyển |
| `options.extensions` | `string[]` | `['js', 'ts']` | Phần mở rộng tệp |
| `options.namespace?` | `string` | `''` | Không gian tên (Namespace) |
| `options.context?` | `Object` | `{ db }` | Ngữ cảnh của tệp di chuyển |

**Ví dụ**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test',
});
```

## Các phương thức tiện ích

### `inDialect()`

Kiểm tra xem loại cơ sở dữ liệu hiện tại có phải là một trong các loại được chỉ định hay không.

**Chữ ký**

- `inDialect(dialect: string[]): boolean`

**Tham số**

| Tham số | Kiểu | Mặc định | Mô tả |
| :-------- | :--------- | :----- | :----------------------------------------------- |
| `dialect` | `string[]` | - | Loại cơ sở dữ liệu, các giá trị có thể là `mysql`/`postgres`/`mariadb` |

### `getTablePrefix()`

Lấy tiền tố tên bảng từ cấu hình.

**Chữ ký**

- `getTablePrefix(): string`

## Cấu hình bảng dữ liệu

### `collection()`

Định nghĩa một bảng dữ liệu. Lời gọi này tương tự phương thức `define` của Sequelize, chỉ tạo cấu trúc bảng trong bộ nhớ. Để lưu trữ vĩnh viễn vào cơ sở dữ liệu, bạn cần gọi phương thức `sync`.

**Chữ ký**

- `collection(options: CollectionOptions): Collection`

**Tham số**

Tất cả các tham số cấu hình `options` đều nhất quán với hàm tạo của lớp `bộ sưu tập`, tham khảo [Bộ sưu tập](/api/database/collection#构造函数).

**Sự kiện**

- `'beforeDefineCollection'`: Kích hoạt trước khi định nghĩa một bảng.
- `'afterDefineCollection'`: Kích hoạt sau khi định nghĩa một bảng.

**Ví dụ**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'float',
      name: 'price',
    },
  ],
});

// đồng bộ bộ sưu tập thành bảng vào cơ sở dữ liệu
await db.sync();
```

### `getCollection()`

Lấy bảng dữ liệu đã được định nghĩa.

**Chữ ký**

- `getCollection(name: string): Collection`

**Tham số**

| Tham số | Kiểu | Mặc định | Mô tả |
| :------- | :------- | :----- | :--- |
| `name` | `string` | - | Tên bảng |

**Ví dụ**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

Kiểm tra xem bảng dữ liệu được chỉ định đã được định nghĩa hay chưa.

**Chữ ký**

- `hasCollection(name: string): boolean`

**Tham số**

| Tham số | Kiểu | Mặc định | Mô tả |
| :------- | :------- | :----- | :--- |
| `name` | `string` | - | Tên bảng |

**Ví dụ**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // true

db.hasCollection('authors'); // false
```

### `removeCollection()`

Xóa bảng dữ liệu đã được định nghĩa. Việc xóa chỉ diễn ra trong bộ nhớ; để lưu trữ vĩnh viễn thay đổi, bạn cần gọi phương thức `sync`.

**Chữ ký**

- `removeCollection(name: string): void`

**Tham số**

| Tham số | Kiểu | Mặc định | Mô tả |
| :------- | :------- | :----- | :--- |
| `name` | `string` | - | Tên bảng |

**Sự kiện**

- `'beforeRemoveCollection'`: Kích hoạt trước khi xóa một bảng.
- `'afterRemoveCollection'`: Kích hoạt sau khi xóa một bảng.

**Ví dụ**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

Nhập tất cả các tệp trong một thư mục làm cấu hình `bộ sưu tập` vào bộ nhớ.

**Chữ ký**

- `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**Tham số**

| Tham số | Kiểu | Mặc định | Mô tả |
| :-------------------- | :--------- | :------------- | :--------------- |
| `options.directory` | `string` | - | Đường dẫn thư mục cần nhập |
| `options.extensions` | `string[]` | `['ts', 'js']` | Quét các hậu tố cụ thể |

**Ví dụ**

`bộ sưu tập` được định nghĩa trong tệp `./collections/books.ts` như sau:

```ts
export default {
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
};
```

Nhập cấu hình liên quan khi `plugin` tải:

```ts
class Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }
}
```

## Đăng ký và truy xuất phần mở rộng

### `registerFieldTypes()`

Đăng ký các loại trường tùy chỉnh.

**Chữ ký**

- `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**Tham số**

`fieldTypes` là một cặp khóa-giá trị, trong đó khóa là tên loại trường và giá trị là lớp loại trường.

**Ví dụ**

```ts
import { Field } from '@nocobase/database';

class MyField extends Field {
  // ...
}

db.registerFieldTypes({
  myField: MyField,
});
```

### `registerModels()`

Đăng ký các lớp mô hình dữ liệu tùy chỉnh.

**Chữ ký**

- `registerModels(models: MapOf<ModelStatic<any>>): void`

**Tham số**

`models` là một cặp khóa-giá trị, trong đó khóa là tên mô hình dữ liệu và giá trị là lớp mô hình dữ liệu.

**Ví dụ**

```ts
import { Model } from '@nocobase/database';

class MyModel extends Model {
  // ...
}

db.registerModels({
  myModel: MyModel,
});

db.collection({
  name: 'myCollection',
  model: 'myModel',
});
```

### `registerRepositories()`

Đăng ký các lớp kho dữ liệu (repository) tùy chỉnh.

**Chữ ký**

- `registerRepositories(repositories: MapOf<RepositoryType>): void`

**Tham số**

`repositories` là một cặp khóa-giá trị, trong đó khóa là tên kho dữ liệu và giá trị là lớp kho dữ liệu.

**Ví dụ**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  // ...
}

db.registerRepositories({
  myRepository: MyRepository,
});

db.collection({
  name: 'myCollection',
  repository: 'myRepository',
});
```

### `registerOperators()`

Đăng ký các toán tử truy vấn dữ liệu tùy chỉnh.

**Chữ ký**

- `registerOperators(operators: MapOf<OperatorFunc>)`

**Tham số**

`operators` là một cặp khóa-giá trị, trong đó khóa là tên toán tử và giá trị là hàm tạo câu lệnh so sánh của toán tử.

**Ví dụ**

```ts
db.registerOperators({
  $dateOn(value) {
    return {
      [Op.and]: [
        { [Op.gte]: stringToDate(value) },
        { [Op.lt]: getNextDay(value) },
      ],
    };
  },
});

db.getRepository('books').count({
  filter: {
    createdAt: {
      // toán tử đã đăng ký
      $dateOn: '2020-01-01',
    },
  },
});
```

### `getModel()`

Lấy lớp mô hình dữ liệu đã được định nghĩa. Nếu không có lớp mô hình tùy chỉnh nào được đăng ký trước đó, nó sẽ trả về lớp mô hình mặc định của Sequelize. Tên mặc định giống với tên của `bộ sưu tập` được định nghĩa.

**Chữ ký**

- `getModel(name: string): Model`

**Tham số**

| Tham số | Kiểu | Mặc định | Mô tả |
| :------- | :------- | :----- | :------------- |
| `name` | `string` | - | Tên mô hình đã đăng ký |

**Ví dụ**

```ts
db.registerModels({
  books: class MyModel extends Model {},
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel); // true
```

Lưu ý: Lớp mô hình được lấy từ `bộ sưu tập` không hoàn toàn giống với lớp mô hình đã đăng ký, mà kế thừa từ lớp mô hình đã đăng ký. Do các thuộc tính của lớp mô hình Sequelize sẽ được sửa đổi trong quá trình khởi tạo, NocoBase tự động xử lý mối quan hệ kế thừa này. Ngoại trừ việc các lớp không hoàn toàn giống nhau, tất cả các định nghĩa khác đều có thể được sử dụng bình thường.

### `getRepository()`

Lấy lớp kho dữ liệu tùy chỉnh. Nếu không có lớp kho dữ liệu tùy chỉnh nào được đăng ký trước đó, nó sẽ trả về lớp kho dữ liệu mặc định của NocoBase. Tên mặc định giống với tên của `bộ sưu tập` được định nghĩa.

Các lớp kho dữ liệu chủ yếu được sử dụng cho các thao tác CRUD (Tạo, Đọc, Cập nhật, Xóa) dựa trên mô hình dữ liệu, tham khảo [Repository](/api/database/repository).

**Chữ ký**

- `getRepository(name: string): Repository`
- `getRepository(name: string, relationId?: string | number): Repository`

**Tham số**

| Tham số | Kiểu | Mặc định | Mô tả |
| :----------- | :------------------- | :----- | :----------------- |
| `name` | `string` | - | Tên kho dữ liệu đã đăng ký |
| `relationId` | `string` \| `number` | - | Giá trị khóa ngoại cho dữ liệu quan hệ |

Khi tên là một tên liên kết có dạng như `'tables.relations'`, nó sẽ trả về lớp kho dữ liệu liên kết. Nếu tham số thứ hai được cung cấp, kho dữ liệu khi sử dụng (truy vấn, cập nhật, v.v.) sẽ dựa trên giá trị khóa ngoại của dữ liệu quan hệ.

**Ví dụ**

Giả sử có hai bảng dữ liệu là *bài viết* và *tác giả*, và bảng bài viết có một khóa ngoại trỏ đến bảng tác giả:

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // true
```

## Sự kiện cơ sở dữ liệu

### `on()`

Lắng nghe các sự kiện cơ sở dữ liệu.

**Chữ ký**

- `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**Tham số**

| Tham số | Kiểu | Mặc định | Mô tả |
| :------- | :------- | :----- | :--------- |
| event | `string` | - | Tên sự kiện |
| listener | `Function` | - | Trình lắng nghe sự kiện |

Tên sự kiện mặc định hỗ trợ các sự kiện Model của Sequelize. Đối với các sự kiện toàn cục, hãy lắng nghe bằng cách sử dụng định dạng tên `<sequelize_model_global_event>`, và đối với các sự kiện Model đơn lẻ, hãy sử dụng định dạng tên `<model_name>.<sequelize_model_event>`.

Để biết mô tả tham số và ví dụ chi tiết về tất cả các loại sự kiện tích hợp, vui lòng tham khảo phần [Sự kiện tích hợp](#内置事件).

### `off()`

Xóa một hàm lắng nghe sự kiện.

**Chữ ký**

- `off(name: string, listener: Function)`

**Tham số**

| Tham số | Kiểu | Mặc định | Mô tả |
| :------- | :------- | :----- | :--------- |
| name | `string` | - | Tên sự kiện |
| listener | `Function` | - | Trình lắng nghe sự kiện |

**Ví dụ**

```ts
const listener = async (model, options) => {
  console.log(model);
};

db.on('afterCreate', listener);

db.off('afterCreate', listener);
```

## Các thao tác cơ sở dữ liệu

### `auth()`

Xác thực kết nối cơ sở dữ liệu. Có thể được sử dụng để đảm bảo ứng dụng đã thiết lập kết nối với dữ liệu.

**Chữ ký**

- `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**Tham số**

| Tham số | Kiểu | Mặc định | Mô tả |
| :--------------------- | :-------------------- | :------ | :----------------- |
| `options?` | `Object` | - | Các tùy chọn xác thực |
| `options.retry?` | `number` | `10` | Số lần thử lại khi xác thực thất bại |
| `options.transaction?` | `Transaction` | - | Đối tượng giao dịch |
| `options.logging?` | `boolean \| Function` | `false` | Có in nhật ký không |

**Ví dụ**

```ts
await db.auth();
```

### `reconnect()`

Kết nối lại cơ sở dữ liệu.

**Ví dụ**

```ts
await db.reconnect();
```

### `closed()`

Kiểm tra xem kết nối cơ sở dữ liệu đã đóng hay chưa.

**Chữ ký**

- `closed(): boolean`

### `close()`

Đóng kết nối cơ sở dữ liệu. Tương đương với `sequelize.close()`.

### `sync()`

Đồng bộ hóa cấu trúc bảng cơ sở dữ liệu. Tương đương với `sequelize.sync()`, các tham số tham khảo [tài liệu Sequelize](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync).

### `clean()`

Dọn dẹp cơ sở dữ liệu, sẽ xóa tất cả các bảng dữ liệu.

**Chữ ký**

- `clean(options: CleanOptions): Promise<void>`

**Tham số**

| Tham số | Kiểu | Mặc định | Mô tả |
| :-------------------- | :------------ | :------ | :----------------- |
| `options.drop` | `boolean` | `false` | Có xóa tất cả các bảng dữ liệu không |
| `options.skip` | `string[]` | - | Cấu hình tên bảng cần bỏ qua |
| `options.transaction` | `Transaction` | - | Đối tượng giao dịch |

**Ví dụ**

Xóa tất cả các bảng trừ bảng `users`.

```ts
await db.clean({
  drop: true,
  skip: ['users'],
});
```

## Các xuất cấp gói (Package-level Exports)

### `defineCollection()`

Tạo nội dung cấu hình cho một bảng dữ liệu.

**Chữ ký**

- `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**Tham số**

| Tham số | Kiểu | Mặc định | Mô tả |
| :------------------ | :------------------ | :----- | :---------------------------------- |
| `collectionOptions` | `CollectionOptions` | - | Giống với tất cả các tham số của `db.collection()` |

**Ví dụ**

Đối với tệp cấu hình bảng dữ liệu sẽ được `db.import()` nhập:

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
  ],
});
```

### `extendCollection()`

Mở rộng nội dung cấu hình cấu trúc bảng đã có trong bộ nhớ, chủ yếu dùng cho nội dung tệp được nhập bằng phương thức `import()`. Phương thức này là một phương thức cấp cao nhất được xuất từ gói `@nocobase/database`, không được gọi thông qua một phiên bản db. Bạn cũng có thể sử dụng bí danh `extend`.

**Chữ ký**

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**Tham số**

| Tham số | Kiểu | Mặc định | Mô tả |
| :------------------ | :------------------ | :----- | :------------------------------------------------------------- |
| `collectionOptions` | `CollectionOptions` | - | Giống với tất cả các tham số của `db.collection()` |
| `mergeOptions?` | `MergeOptions` | - | Các tham số cho gói npm [deepmerge](https://npmjs.com/package/deepmerge) |

**Ví dụ**

Định nghĩa bảng books gốc (books.ts):

```ts
export default {
  name: 'books',
  fields: [{ name: 'title', type: 'string' }],
};
```

Định nghĩa bảng books mở rộng (books.extend.ts):

```ts
import { extend } from '@nocobase/database';

// mở rộng thêm
export default extend({
  name: 'books',
  fields: [{ name: 'price', type: 'number' }],
});
```

Nếu hai tệp trên được nhập khi gọi `import()`, sau khi được mở rộng thêm bằng `extend()`, bảng books sẽ có cả hai trường `title` và `price`.

Phương thức này rất hữu ích khi mở rộng cấu trúc bảng đã được định nghĩa bởi các `plugin` hiện có.

## Các sự kiện tích hợp

Cơ sở dữ liệu sẽ kích hoạt các sự kiện tương ứng sau đây tại các giai đoạn khác nhau trong vòng đời của nó. Việc đăng ký các sự kiện này bằng phương thức `on()` và xử lý cụ thể có thể đáp ứng một số nhu cầu nghiệp vụ.

### `'beforeSync'` / `'afterSync'`

Kích hoạt trước và sau khi cấu hình cấu trúc bảng mới (trường, chỉ mục, v.v.) được đồng bộ hóa vào cơ sở dữ liệu. Thường được kích hoạt khi `bộ sưu tập.sync()` (gọi nội bộ) được thực thi và thường được sử dụng để xử lý logic cho các phần mở rộng trường đặc biệt.

**Chữ ký**

```ts
on(eventName: `${string}.beforeSync` | 'beforeSync' | `${string}.afterSync` | 'afterSync', listener: SyncListener): this
```

**Kiểu**

```ts
import type { SyncOptions, HookReturn } from 'sequelize/types';

type SyncListener = (options?: SyncOptions) => HookReturn;
```

**Ví dụ**

```ts
const users = db.collection({
  name: 'users',
  fields: [{ type: 'string', name: 'username' }],
});

db.on('beforeSync', async (options) => {
  // thực hiện một hành động nào đó
});

db.on('users.afterSync', async (options) => {
  // thực hiện một hành động nào đó
});

await users.sync();
```

### `'beforeValidate'` / `'afterValidate'`

Trước khi tạo hoặc cập nhật dữ liệu, có một quá trình xác thực dữ liệu dựa trên các quy tắc được định nghĩa trong `bộ sưu tập`. Các sự kiện tương ứng sẽ được kích hoạt trước và sau quá trình xác thực. Điều này xảy ra khi gọi `repository.create()` hoặc `repository.update()`.

**Chữ ký**

```ts
on(eventName: `${string}.beforeValidate` | 'beforeValidate' | `${string}.afterValidate` | 'afterValidate', listener: ValidateListener): this
```

**Kiểu**

```ts
import type { ValidationOptions } from 'sequelize/types/lib/instance-validator';
import type { HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

type ValidateListener = (
  model: Model,
  options?: ValidationOptions,
) => HookReturn;
```

**Ví dụ**

```ts
db.collection({
  name: 'tests',
  fields: [
    {
      type: 'string',
      name: 'email',
      validate: {
        isEmail: true,
      },
    },
  ],
});

// tất cả các mô hình
db.on('beforeValidate', async (model, options) => {
  // thực hiện một hành động nào đó
});
// mô hình tests
db.on('tests.beforeValidate', async (model, options) => {
  // thực hiện một hành động nào đó
});

// tất cả các mô hình
db.on('afterValidate', async (model, options) => {
  // thực hiện một hành động nào đó
});
// mô hình tests
db.on('tests.afterValidate', async (model, options) => {
  // thực hiện một hành động nào đó
});

const repository = db.getRepository('tests');
await repository.create({
  values: {
    email: 'abc', // kiểm tra định dạng email
  },
});
// hoặc
await repository.update({
  filterByTk: 1,
  values: {
    email: 'abc', // kiểm tra định dạng email
  },
});
```

### `'beforeCreate'` / `'afterCreate'`

Các sự kiện tương ứng sẽ được kích hoạt trước và sau khi tạo một bản ghi dữ liệu. Điều này xảy ra khi gọi `repository.create()`.

**Chữ ký**

```ts
on(eventName: `${string}.beforeCreate` | 'beforeCreate' | `${string}.afterCreate` | 'afterCreate', listener: CreateListener): this
```

**Kiểu**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Ví dụ**

```ts
db.on('beforeCreate', async (model, options) => {
  // thực hiện một hành động nào đó
});

db.on('books.afterCreate', async (model, options) => {
  const { transaction } = options;
  const result = await model.constructor.findByPk(model.id, {
    transaction,
  });
  console.log(result);
});
```

### `'beforeUpdate'` / `'afterUpdate'`

Các sự kiện tương ứng sẽ được kích hoạt trước và sau khi cập nhật một bản ghi dữ liệu. Điều này xảy ra khi gọi `repository.update()`.

**Chữ ký**

```ts
on(eventName: `${string}.beforeUpdate` | 'beforeUpdate' | `${string}.afterUpdate` | 'afterUpdate', listener: UpdateListener): this
```

**Kiểu**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Ví dụ**

```ts
db.on('beforeUpdate', async (model, options) => {
  // thực hiện một hành động nào đó
});

db.on('books.afterUpdate', async (model, options) => {
  // thực hiện một hành động nào đó
});
```

### `'beforeSave'` / `'afterSave'`

Các sự kiện tương ứng sẽ được kích hoạt trước và sau khi tạo hoặc cập nhật một bản ghi dữ liệu. Điều này xảy ra khi gọi `repository.create()` hoặc `repository.update()`.

**Chữ ký**

```ts
on(eventName: `${string}.beforeSave` | 'beforeSave' | `${string}.afterSave` | 'afterSave', listener: SaveListener): this
```

**Kiểu**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveListener = (model: Model, options?: SaveOptions) => HookReturn;
```

**Ví dụ**

```ts
db.on('beforeSave', async (model, options) => {
  // thực hiện một hành động nào đó
});

db.on('books.afterSave', async (model, options) => {
  // thực hiện một hành động nào đó
});
```

### `'beforeDestroy'` / `'afterDestroy'`

Các sự kiện tương ứng sẽ được kích hoạt trước và sau khi xóa một bản ghi dữ liệu. Điều này xảy ra khi gọi `repository.destroy()`.

**Chữ ký**

```ts
on(eventName: `${string}.beforeDestroy` | 'beforeDestroy' | `${string}.afterDestroy` | 'afterDestroy', listener: DestroyListener): this
```

**Kiểu**

```ts
import type { DestroyOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type DestroyListener = (
  model: Model,
  options?: DestroyOptions,
) => HookReturn;
```

**Ví dụ**

```ts
db.on('beforeDestroy', async (model, options) => {
  // thực hiện một hành động nào đó
});

db.on('books.afterDestroy', async (model, options) => {
  // thực hiện một hành động nào đó
});
```

### `'afterCreateWithAssociations'`

Sự kiện này được kích hoạt sau khi tạo một bản ghi dữ liệu có dữ liệu liên kết phân cấp. Điều này xảy ra khi gọi `repository.create()`.

**Chữ ký**

```ts
on(eventName: `${string}.afterCreateWithAssociations` | 'afterCreateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Kiểu**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateWithAssociationsListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Ví dụ**

```ts
db.on('afterCreateWithAssociations', async (model, options) => {
  // thực hiện một hành động nào đó
});

db.on('books.afterCreateWithAssociations', async (model, options) => {
  // thực hiện một hành động nào đó
});
```

### `'afterUpdateWithAssociations'`

Sự kiện này được kích hoạt sau khi cập nhật một bản ghi dữ liệu có dữ liệu liên kết phân cấp. Điều này xảy ra khi gọi `repository.update()`.

**Chữ ký**

```ts
on(eventName: `${string}.afterUpdateWithAssociations` | 'afterUpdateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Kiểu**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateWithAssociationsListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Ví dụ**

```ts
db.on('afterUpdateWithAssociations', async (model, options) => {
  // thực hiện một hành động nào đó
});

db.on('books.afterUpdateWithAssociations', async (model, options) => {
  // thực hiện một hành động nào đó
});
```

### `'afterSaveWithAssociations'`

Sự kiện này được kích hoạt sau khi tạo hoặc cập nhật một bản ghi dữ liệu có dữ liệu liên kết phân cấp. Điều này xảy ra khi gọi `repository.create()` hoặc `repository.update()`.

**Chữ ký**

```ts
on(eventName: `${string}.afterSaveWithAssociations` | 'afterSaveWithAssociations', listener: SaveWithAssociationsListener): this
```

**Kiểu**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveWithAssociationsListener = (
  model: Model,
  options?: SaveOptions,
) => HookReturn;
```

**Ví dụ**

```ts
db.on('afterSaveWithAssociations', async (model, options) => {
  // thực hiện một hành động nào đó
});

db.on('books.afterSaveWithAssociations', async (model, options) => {
  // thực hiện một hành động nào đó
});
```

### `'beforeDefineCollection'`

Kích hoạt trước khi một bảng dữ liệu được định nghĩa, ví dụ, khi gọi `db.collection()`.

Lưu ý: Đây là một sự kiện đồng bộ.

**Chữ ký**

```ts
on(eventName: 'beforeDefineCollection', listener: BeforeDefineCollectionListener): this
```

**Kiểu**

```ts
import type { CollectionOptions } from '@nocobase/database';

export type BeforeDefineCollectionListener = (
  options: CollectionOptions,
) => void;
```

**Ví dụ**

```ts
db.on('beforeDefineCollection', (options) => {
  // thực hiện một hành động nào đó
});
```

### `'afterDefineCollection'`

Kích hoạt sau khi một bảng dữ liệu được định nghĩa, ví dụ, khi gọi `db.collection()`.

Lưu ý: Đây là một sự kiện đồng bộ.

**Chữ ký**

```ts
on(eventName: 'afterDefineCollection', listener: AfterDefineCollectionListener): this
```

**Kiểu**

```ts
import type { Collection } from '@nocobase/database';

export type AfterDefineCollectionListener = (options: Collection) => void;
```

**Ví dụ**

```ts
db.on('afterDefineCollection', (collection) => {
  // thực hiện một hành động nào đó
});
```

### `'beforeRemoveCollection'` / `'afterRemoveCollection'`

Kích hoạt trước và sau khi một bảng dữ liệu được xóa khỏi bộ nhớ, ví dụ, khi gọi `db.removeCollection()`.

Lưu ý: Đây là một sự kiện đồng bộ.

**Chữ ký**

```ts
on(eventName: 'beforeRemoveCollection' | 'afterRemoveCollection', listener: RemoveCollectionListener): this
```

**Kiểu**

```ts
import type { Collection } from '@nocobase/database';

export type RemoveCollectionListener = (options: Collection) => void;
```

**Ví dụ**

```ts
db.on('beforeRemoveCollection', (collection) => {
  // thực hiện một hành động nào đó
});

db.on('afterRemoveCollection', (collection) => {
  // thực hiện một hành động nào đó
});
```