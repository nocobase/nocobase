---
title: "Database"
description: "API Database của NocoBase: instance cơ sở dữ liệu, định nghĩa Collection, thao tác Repository, cấu hình kết nối."
keywords: "Database API,instance cơ sở dữ liệu,Collection,Repository,cấu hình kết nối,NocoBase"
---

# Database

## Tổng quan

Database là công cụ tương tác cơ sở dữ liệu mà NocoBase cung cấp, cung cấp các chức năng tương tác cơ sở dữ liệu rất tiện lợi cho ứng dụng no-code, low-code. Các cơ sở dữ liệu được hỗ trợ hiện tại:

- SQLite 3.8.8+
- MySQL 8.0.17+
- PostgreSQL 10.0+

### Kết nối cơ sở dữ liệu

Trong constructor `Database`, có thể cấu hình kết nối cơ sở dữ liệu bằng cách truyền tham số `options`.

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

Để biết tham số cấu hình chi tiết, vui lòng tham khảo [Constructor](#constructor).

### Định nghĩa model dữ liệu

`Database` định nghĩa cấu trúc cơ sở dữ liệu thông qua `Collection`, một đối tượng `Collection` đại diện cho một bảng trong cơ sở dữ liệu.

```javascript
// Định nghĩa Collection
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

Sau khi định nghĩa cấu trúc cơ sở dữ liệu xong, có thể dùng phương thức `sync()` để đồng bộ cấu trúc cơ sở dữ liệu.

```javascript
await database.sync();
```

Cách dùng `Collection` chi tiết hơn vui lòng tham khảo [Collection](/api/database/collection).

### Đọc/ghi dữ liệu

`Database` thao tác dữ liệu thông qua `Repository`.

```javascript
const UserRepository = UserCollection.repository();

// Tạo
await UserRepository.create({
  name: 'Nguyễn Văn A',
  age: 18,
});

// Truy vấn
const user = await UserRepository.findOne({
  filter: {
    name: 'Nguyễn Văn A',
  },
});

// Sửa
await UserRepository.update({
  values: {
    age: 20,
  },
});

// Xóa
await UserRepository.destroy(user.id);
```

Cách dùng CRUD dữ liệu chi tiết hơn vui lòng tham khảo [Repository](/api/database/repository).

## Constructor

**Chữ ký**

- `constructor(options: DatabaseOptions)`

Tạo một instance cơ sở dữ liệu.

**Tham số**

| Tên tham số            | Kiểu           | Giá trị mặc định | Mô tả                                                                                                              |
| ---------------------- | -------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| `options.host`         | `string`       | `'localhost'`    | Host cơ sở dữ liệu                                                                                                 |
| `options.port`         | `number`       | -                | Cổng dịch vụ cơ sở dữ liệu, có cổng mặc định tương ứng với cơ sở dữ liệu được dùng                                  |
| `options.username`     | `string`       | -                | User cơ sở dữ liệu                                                                                                  |
| `options.password`     | `string`       | -                | Mật khẩu cơ sở dữ liệu                                                                                              |
| `options.database`     | `string`       | -                | Tên cơ sở dữ liệu                                                                                                   |
| `options.dialect`      | `string`       | `'mysql'`        | Loại cơ sở dữ liệu                                                                                                  |
| `options.storage?`     | `string`       | `':memory:'`     | Chế độ lưu trữ của SQLite                                                                                           |
| `options.logging?`     | `boolean`      | `false`          | Có bật log hay không                                                                                                |
| `options.define?`      | `Object`       | `{}`             | Tham số định nghĩa bảng mặc định                                                                                    |
| `options.tablePrefix?` | `string`       | `''`             | Mở rộng của NocoBase, tiền tố tên bảng                                                                              |
| `options.migrator?`    | `UmzugOptions` | `{}`             | Mở rộng của NocoBase, tham số liên quan đến trình quản lý migration, tham khảo triển khai [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15) |

## Phương thức liên quan đến migration

### `addMigration()`

Thêm một file migration đơn lẻ.

**Chữ ký**

- `addMigration(options: MigrationItem)`

**Tham số**

| Tên tham số          | Kiểu               | Giá trị mặc định | Mô tả                  |
| -------------------- | ------------------ | ---------------- | ---------------------- |
| `options.name`       | `string`           | -                | Tên file migration     |
| `options.context?`   | `string`           | -                | Ngữ cảnh của file migration |
| `options.migration?` | `typeof Migration` | -                | Lớp tùy chỉnh của file migration |
| `options.up`         | `Function`         | -                | Phương thức `up` của file migration |
| `options.down`       | `Function`         | -                | Phương thức `down` của file migration |

**Ví dụ**

```ts
db.addMigration({
  name: '20220916120411-test-1',
  async up() {
    const queryInterface = this.context.db.sequelize.getQueryInterface();
    await queryInterface.query(/* your migration sqls */);
  },
});
```

### `addMigrations()`

Thêm các file migration trong thư mục chỉ định.

**Chữ ký**

- `addMigrations(options: AddMigrationsOptions): void`

**Tham số**

| Tên tham số          | Kiểu       | Giá trị mặc định | Mô tả                  |
| -------------------- | ---------- | ---------------- | ---------------------- |
| `options.directory`  | `string`   | `''`             | Thư mục chứa file migration |
| `options.extensions` | `string[]` | `['js', 'ts']`   | Phần mở rộng file       |
| `options.namespace?` | `string`   | `''`             | Namespace               |
| `options.context?`   | `Object`   | `{ db }`         | Ngữ cảnh của file migration |

**Ví dụ**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test',
});
```

## Phương thức tiện ích

### `inDialect()`

Kiểm tra loại cơ sở dữ liệu hiện tại có phải là loại chỉ định hay không.

**Chữ ký**

- `inDialect(dialect: string[]): boolean`

**Tham số**

| Tên tham số | Kiểu       | Giá trị mặc định | Mô tả                                            |
| ----------- | ---------- | ---------------- | ------------------------------------------------ |
| `dialect`   | `string[]` | -                | Loại cơ sở dữ liệu, các tùy chọn `mysql`/`postgres`/`mariadb` |

### `getTablePrefix()`

Lấy tiền tố tên bảng từ cấu hình.

**Chữ ký**

- `getTablePrefix(): string`

## Cấu hình bảng dữ liệu

### `collection()`

Định nghĩa một bảng dữ liệu. Lệnh gọi này tương tự phương thức `define` của Sequelize, chỉ tạo cấu trúc bảng trong bộ nhớ. Nếu cần lưu vào cơ sở dữ liệu, cần gọi phương thức `sync`.

**Chữ ký**

- `collection(options: CollectionOptions): Collection`

**Tham số**

Mọi tham số cấu hình của `options` giống với constructor của lớp `Collection`, tham khảo [Collection](/api/database/collection#constructor).

**Sự kiện**

- `'beforeDefineCollection'`: Kích hoạt trước khi định nghĩa bảng.
- `'afterDefineCollection'`: Kích hoạt sau khi định nghĩa bảng.

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

// sync collection as table to db
await db.sync();
```

### `getCollection()`

Lấy bảng dữ liệu đã định nghĩa.

**Chữ ký**

- `getCollection(name: string): Collection`

**Tham số**

| Tên tham số | Kiểu     | Giá trị mặc định | Mô tả   |
| ----------- | -------- | ---------------- | ------- |
| `name`      | `string` | -                | Tên bảng |

**Ví dụ**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

Kiểm tra bảng dữ liệu chỉ định đã được định nghĩa hay chưa.

**Chữ ký**

- `hasCollection(name: string): boolean`

**Tham số**

| Tên tham số | Kiểu     | Giá trị mặc định | Mô tả   |
| ----------- | -------- | ---------------- | ------- |
| `name`      | `string` | -                | Tên bảng |

**Ví dụ**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // true

db.hasCollection('authors'); // false
```

### `removeCollection()`

Gỡ bảng dữ liệu đã định nghĩa. Chỉ gỡ trong bộ nhớ. Nếu cần lưu, cần gọi phương thức `sync`.

**Chữ ký**

- `removeCollection(name: string): void`

**Tham số**

| Tên tham số | Kiểu     | Giá trị mặc định | Mô tả   |
| ----------- | -------- | ---------------- | ------- |
| `name`      | `string` | -                | Tên bảng |

**Sự kiện**

- `'beforeRemoveCollection'`: Kích hoạt trước khi gỡ bảng.
- `'afterRemoveCollection'`: Kích hoạt sau khi gỡ bảng.

**Ví dụ**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

Import tất cả file trong thư mục chỉ định làm cấu hình collection nạp vào bộ nhớ.

**Chữ ký**

- `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**Tham số**

| Tên tham số          | Kiểu       | Giá trị mặc định | Mô tả                  |
| -------------------- | ---------- | ---------------- | ---------------------- |
| `options.directory`  | `string`   | -                | Đường dẫn thư mục cần import |
| `options.extensions` | `string[]` | `['ts', 'js']`   | Quét đuôi file cụ thể    |

**Ví dụ**

Collection được định nghĩa trong file `./collections/books.ts` như sau:

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

Import cấu hình tương ứng khi load Plugin:

```ts
class Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }
}
```

## Đăng ký và lấy phần mở rộng

### `registerFieldTypes()`

Đăng ký kiểu field tùy chỉnh.

**Chữ ký**

- `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**Tham số**

`fieldTypes` là cặp khóa-giá trị, khóa là tên kiểu field, giá trị là lớp kiểu field.

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

Đăng ký lớp model dữ liệu tùy chỉnh.

**Chữ ký**

- `registerModels(models: MapOf<ModelStatic<any>>): void`

**Tham số**

`models` là cặp khóa-giá trị, khóa là tên model, giá trị là lớp model.

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

Đăng ký lớp repository tùy chỉnh.

**Chữ ký**

- `registerRepositories(repositories: MapOf<RepositoryType>): void`

**Tham số**

`repositories` là cặp khóa-giá trị, khóa là tên repository, giá trị là lớp repository.

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

Đăng ký toán tử truy vấn dữ liệu tùy chỉnh.

**Chữ ký**

- `registerOperators(operators: MapOf<OperatorFunc>)`

**Tham số**

`operators` là cặp khóa-giá trị, khóa là tên toán tử, giá trị là hàm sinh câu lệnh so sánh của toán tử.

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
      // registered operator
      $dateOn: '2020-01-01',
    },
  },
});
```

### `getModel()`

Lấy lớp model dữ liệu đã định nghĩa. Nếu trước đó chưa đăng ký lớp model tùy chỉnh, sẽ trả về lớp model mặc định của Sequelize. Tên mặc định giống với tên định nghĩa của collection.

**Chữ ký**

- `getModel(name: string): Model`

**Tham số**

| Tên tham số | Kiểu     | Giá trị mặc định | Mô tả          |
| ----------- | -------- | ---------------- | -------------- |
| `name`      | `string` | -                | Tên model đã đăng ký |

**Ví dụ**

```ts
db.registerModels({
  books: class MyModel extends Model {},
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel); // true
```

Lưu ý: Lớp model lấy từ collection không hoàn toàn bằng với lớp model khi đăng ký, mà là kế thừa từ lớp model khi đăng ký. Do thuộc tính của lớp model Sequelize bị thay đổi trong quá trình khởi tạo, nên NocoBase đã tự động xử lý quan hệ kế thừa này. Ngoại trừ lớp không bằng, mọi định nghĩa khác đều có thể dùng bình thường.

### `getRepository()`

Lấy lớp repository tùy chỉnh. Nếu trước đó chưa đăng ký lớp repository tùy chỉnh, sẽ trả về lớp repository mặc định của NocoBase. Tên mặc định giống với tên định nghĩa của collection.

Lớp repository chủ yếu dùng cho thao tác CRUD dựa trên model dữ liệu, tham khảo [Repository](/api/database/repository).

**Chữ ký**

- `getRepository(name: string): Repository`
- `getRepository(name: string, relationId?: string | number): Repository`

**Tham số**

| Tên tham số  | Kiểu                 | Giá trị mặc định | Mô tả               |
| ------------ | -------------------- | ---------------- | ------------------- |
| `name`       | `string`             | -                | Tên repository đã đăng ký |
| `relationId` | `string` \| `number` | -                | Giá trị khóa ngoại của dữ liệu quan hệ |

Khi tên có dạng `'tables.relactions'` chứa quan hệ, sẽ trả về lớp repository quan hệ. Nếu cung cấp tham số thứ hai, repository khi sử dụng (truy vấn, sửa, v.v.) sẽ dựa vào giá trị khóa ngoại của dữ liệu quan hệ.

**Ví dụ**

Giả sử có hai bảng dữ liệu *bài viết* và *tác giả*, và bảng bài viết có một khóa ngoại trỏ đến bảng tác giả:

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // true
```

## Sự kiện cơ sở dữ liệu

### `on()`

Lắng nghe sự kiện cơ sở dữ liệu.

**Chữ ký**

- `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**Tham số**

| Tên tham số | Kiểu     | Giá trị mặc định | Mô tả      |
| ----------- | -------- | ---------------- | ---------- |
| event       | string   | -                | Tên sự kiện |
| listener    | Function | -                | Listener sự kiện |

Tên sự kiện mặc định hỗ trợ sự kiện Model của Sequelize. Đối với sự kiện toàn cục, lắng nghe theo dạng tên `<sequelize_model_global_event>`. Đối với sự kiện của một Model, lắng nghe theo dạng tên `<model_name>.<sequelize_model_event>`.

Mọi mô tả tham số và ví dụ chi tiết của các kiểu sự kiện có sẵn tham khảo phần [Sự kiện có sẵn](#sự-kiện-có-sẵn).

### `off()`

Gỡ hàm listener sự kiện.

**Chữ ký**

- `off(name: string, listener: Function)`

**Tham số**

| Tên tham số | Kiểu     | Giá trị mặc định | Mô tả      |
| ----------- | -------- | ---------------- | ---------- |
| name        | string   | -                | Tên sự kiện |
| listener    | Function | -                | Listener sự kiện |

**Ví dụ**

```ts
const listener = async (model, options) => {
  console.log(model);
};

db.on('afterCreate', listener);

db.off('afterCreate', listener);
```

## Thao tác cơ sở dữ liệu

### `auth()`

Xác thực kết nối cơ sở dữ liệu. Có thể dùng để đảm bảo ứng dụng đã thiết lập kết nối với cơ sở dữ liệu.

**Chữ ký**

- `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**Tham số**

| Tên tham số            | Kiểu                  | Giá trị mặc định | Mô tả                |
| ---------------------- | --------------------- | ---------------- | -------------------- |
| `options?`             | `Object`              | -                | Tùy chọn xác thực    |
| `options.retry?`       | `number`              | `10`             | Số lần thử lại khi xác thực thất bại |
| `options.transaction?` | `Transaction`         | -                | Đối tượng transaction |
| `options.logging?`     | `boolean \| Function` | `false`          | Có in log hay không  |

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

Kiểm tra cơ sở dữ liệu đã đóng kết nối hay chưa.

**Chữ ký**

- `closed(): boolean`

### `close()`

Đóng kết nối cơ sở dữ liệu. Tương đương với `sequelize.close()`.

### `sync()`

Đồng bộ cấu trúc bảng cơ sở dữ liệu. Tương đương với `sequelize.sync()`, tham số tham khảo [Tài liệu Sequelize](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync).

### `clean()`

Làm sạch cơ sở dữ liệu, sẽ xóa toàn bộ bảng dữ liệu.

**Chữ ký**

- `clean(options: CleanOptions): Promise<void>`

**Tham số**

| Tên tham số           | Kiểu          | Giá trị mặc định | Mô tả               |
| --------------------- | ------------- | ---------------- | ------------------- |
| `options.drop`        | `boolean`     | `false`          | Có xóa toàn bộ bảng dữ liệu hay không |
| `options.skip`        | `string[]`    | -                | Cấu hình tên bảng cần bỏ qua |
| `options.transaction` | `Transaction` | -                | Đối tượng transaction |

**Ví dụ**

Xóa tất cả bảng ngoại trừ bảng `users`.

```ts
await db.clean({
  drop: true,
  skip: ['users'],
});
```

## Export cấp package

### `defineCollection()`

Tạo nội dung cấu hình của một bảng dữ liệu.

**Chữ ký**

- `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**Tham số**

| Tên tham số         | Kiểu                | Giá trị mặc định | Mô tả                              |
| ------------------- | ------------------- | ---------------- | ---------------------------------- |
| `collectionOptions` | `CollectionOptions` | -                | Giống tham số của `db.collection()` |

**Ví dụ**

Đối với file cấu hình bảng dữ liệu sẽ được `db.import()` import:

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

Mở rộng nội dung cấu hình cấu trúc bảng đã có trong bộ nhớ, chủ yếu dùng cho nội dung file được import bởi phương thức `import()`. Phương thức này là phương thức cấp cao nhất được export từ package `@nocobase/database`, không gọi qua instance db. Cũng có thể dùng alias `extend`.

**Chữ ký**

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**Tham số**

| Tên tham số         | Kiểu                | Giá trị mặc định | Mô tả                                                          |
| ------------------- | ------------------- | ---------------- | -------------------------------------------------------------- |
| `collectionOptions` | `CollectionOptions` | -                | Giống tham số của `db.collection()`                            |
| `mergeOptions?`     | `MergeOptions`      | -                | Tham số của npm package [deepmerge](https://npmjs.com/package/deepmerge) |

**Ví dụ**

Định nghĩa bảng books gốc (books.ts):

```ts
export default {
  name: 'books',
  fields: [{ name: 'title', type: 'string' }],
};
```

Mở rộng định nghĩa bảng books (books.extend.ts):

```ts
import { extend } from '@nocobase/database';

// Mở rộng tiếp
export default extend({
  name: 'books',
  fields: [{ name: 'price', type: 'number' }],
});
```

Hai file trên nếu được import khi gọi `import()`, sau khi mở rộng tiếp bằng `extend()`, bảng books sẽ có hai field `title` và `price`.

Phương thức này rất hữu ích khi mở rộng cấu trúc bảng đã được Plugin khác định nghĩa.

## Sự kiện có sẵn

Cơ sở dữ liệu sẽ kích hoạt các sự kiện tương ứng tại các vòng đời tương ứng. Sau khi đăng ký bằng phương thức `on()` để xử lý cụ thể có thể đáp ứng một số nhu cầu nghiệp vụ.

### `'beforeSync'` / `'afterSync'`

Kích hoạt trước và sau khi cấu hình cấu trúc bảng mới (field, index, v.v.) được đồng bộ vào cơ sở dữ liệu, thường được kích hoạt khi thực thi `collection.sync()` (gọi nội bộ), thường dùng cho xử lý logic mở rộng field đặc biệt.

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
  // do something
});

db.on('users.afterSync', async (options) => {
  // do something
});

await users.sync();
```

### `'beforeValidate'` / `'afterValidate'`

Trước khi tạo hoặc cập nhật dữ liệu sẽ có quá trình kiểm tra dữ liệu dựa trên các quy tắc định nghĩa trong collection, kích hoạt sự kiện tương ứng trước và sau khi kiểm tra. Khi gọi `repository.create()` hoặc `repository.update()` sẽ kích hoạt.

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

// all models
db.on('beforeValidate', async (model, options) => {
  // do something
});
// tests model
db.on('tests.beforeValidate', async (model, options) => {
  // do something
});

// all models
db.on('afterValidate', async (model, options) => {
  // do something
});
// tests model
db.on('tests.afterValidate', async (model, options) => {
  // do something
});

const repository = db.getRepository('tests');
await repository.create({
  values: {
    email: 'abc', // checks for email format
  },
});
// or
await repository.update({
  filterByTk: 1,
  values: {
    email: 'abc', // checks for email format
  },
});
```

### `'beforeCreate'` / `'afterCreate'`

Kích hoạt sự kiện tương ứng trước và sau khi tạo một dữ liệu, khi gọi `repository.create()` sẽ kích hoạt.

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
  // do something
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

Kích hoạt sự kiện tương ứng trước và sau khi cập nhật một dữ liệu, khi gọi `repository.update()` sẽ kích hoạt.

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
  // do something
});

db.on('books.afterUpdate', async (model, options) => {
  // do something
});
```

### `'beforeSave'` / `'afterSave'`

Kích hoạt sự kiện tương ứng trước và sau khi tạo hoặc cập nhật một dữ liệu, khi gọi `repository.create()` hoặc `repository.update()` sẽ kích hoạt.

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
  // do something
});

db.on('books.afterSave', async (model, options) => {
  // do something
});
```

### `'beforeDestroy'` / `'afterDestroy'`

Kích hoạt sự kiện tương ứng trước và sau khi xóa một dữ liệu, khi gọi `repository.destroy()` sẽ kích hoạt.

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
  // do something
});

db.on('books.afterDestroy', async (model, options) => {
  // do something
});
```

### `'afterCreateWithAssociations'`

Kích hoạt sự kiện tương ứng sau khi tạo một dữ liệu kèm theo dữ liệu quan hệ phân cấp, khi gọi `repository.create()` sẽ kích hoạt.

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
  // do something
});

db.on('books.afterCreateWithAssociations', async (model, options) => {
  // do something
});
```

### `'afterUpdateWithAssociations'`

Kích hoạt sự kiện tương ứng sau khi cập nhật một dữ liệu kèm theo dữ liệu quan hệ phân cấp, khi gọi `repository.update()` sẽ kích hoạt.

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
  // do something
});

db.on('books.afterUpdateWithAssociations', async (model, options) => {
  // do something
});
```

### `'afterSaveWithAssociations'`

Kích hoạt sự kiện tương ứng sau khi tạo hoặc cập nhật một dữ liệu kèm theo dữ liệu quan hệ phân cấp, khi gọi `repository.create()` hoặc `repository.update()` sẽ kích hoạt.

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
  // do something
});

db.on('books.afterSaveWithAssociations', async (model, options) => {
  // do something
});
```

### `'beforeDefineCollection'`

Kích hoạt trước khi định nghĩa một bảng dữ liệu, ví dụ khi gọi `db.collection()`.

Lưu ý: Sự kiện này là sự kiện đồng bộ.

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
  // do something
});
```

### `'afterDefineCollection'`

Kích hoạt sau khi định nghĩa một bảng dữ liệu, ví dụ khi gọi `db.collection()`.

Lưu ý: Sự kiện này là sự kiện đồng bộ.

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
  // do something
});
```

### `'beforeRemoveCollection'` / `'afterRemoveCollection'`

Kích hoạt trước và sau khi gỡ một bảng dữ liệu khỏi bộ nhớ, ví dụ khi gọi `db.removeCollection()`.

Lưu ý: Sự kiện này là sự kiện đồng bộ.

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
  // do something
});

db.on('afterRemoveCollection', (collection) => {
  // do something
});
```
