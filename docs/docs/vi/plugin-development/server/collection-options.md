:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


## Tham số cấu hình bộ sưu tập

```ts
export type MigrationRule =
  | 'overwrite'
  | 'skip'
  | 'upsert'
  | 'schema-only'
  | 'insert-ignore';

export interface CollectionOptions {
  name: string;
  title?: string;
  migrationRules?: MigrationRule[];
  inherits?: string[] | string;
  filterTargetKey?: string | string[];
  fields?: FieldOptions[];
  model?: string | ModelStatic<Model>;
  repository?: string | RepositoryType;
  autoGenId?: boolean;
  timestamps?: boolean;
  createdAt?: boolean;
  updatedAt?: boolean;
  deletedAt?: boolean;
  paranoid?: boolean;
  underscored?: boolean;
  indexes?: ModelIndexesOptions[];
}
```

### `name` - Tên bộ sưu tập
- **Kiểu**: `string`
- **Bắt buộc**: ✅
- **Mô tả**: Mã định danh duy nhất cho bộ sưu tập, phải là duy nhất trong toàn bộ ứng dụng.
- **Ví dụ**:
```typescript
{
  name: 'users'  // Bộ sưu tập người dùng
}
```

### `title` - Tiêu đề bộ sưu tập
- **Kiểu**: `string`
- **Bắt buộc**: ❌
- **Mô tả**: Tiêu đề hiển thị của bộ sưu tập, dùng để hiển thị trên giao diện người dùng.
- **Ví dụ**:
```typescript
{
  name: 'users',
  title: 'Quản lý người dùng'  // Hiển thị là "Quản lý người dùng" trên giao diện
}
```

### `migrationRules` - Quy tắc di chuyển
- **Kiểu**: `MigrationRule[]`
- **Bắt buộc**: ❌
- **Mô tả**: Các quy tắc xử lý khi di chuyển dữ liệu.
- **Ví dụ**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // Ghi đè dữ liệu hiện có
  fields: [...]
}
```

### `inherits` - Kế thừa bộ sưu tập
- **Kiểu**: `string[] | string`
- **Bắt buộc**: ❌
- **Mô tả**: Kế thừa định nghĩa trường từ các bộ sưu tập khác. Hỗ trợ kế thừa từ một hoặc nhiều bộ sưu tập.
- **Ví dụ**:

```typescript
// Kế thừa đơn lẻ
{
  name: 'admin_users',
  inherits: 'users',  // Kế thừa tất cả các trường từ bộ sưu tập người dùng
  fields: [
    {
      type: 'string',
      name: 'admin_level'
    }
  ]
}

// Kế thừa nhiều
{
  name: 'super_admin_users',
  inherits: ['users', 'admin_users'],  // Kế thừa từ nhiều bộ sưu tập
  fields: [...]
}
```

### `filterTargetKey` - Khóa mục tiêu lọc
- **Kiểu**: `string | string[]`
- **Bắt buộc**: ❌
- **Mô tả**: Khóa mục tiêu dùng để lọc truy vấn. Hỗ trợ một hoặc nhiều khóa.
- **Ví dụ**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // Lọc theo ID người dùng
  fields: [...]
}

// Nhiều khóa lọc
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // Lọc theo ID người dùng và ID danh mục
  fields: [...]
}
```

### `fields` - Định nghĩa trường
- **Kiểu**: `FieldOptions[]`
- **Bắt buộc**: ❌
- **Giá trị mặc định**: `[]`
- **Mô tả**: Mảng định nghĩa trường cho bộ sưu tập. Mỗi trường bao gồm thông tin như kiểu, tên và cấu hình.
- **Ví dụ**:
```typescript
{
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
      title: 'Tên người dùng'
    },
    {
      type: 'string',
      name: 'email',
      unique: true,
      title: 'Email'
    },
    {
      type: 'password',
      name: 'password',
      title: 'Mật khẩu'
    },
    {
      type: 'date',
      name: 'createdAt',
      title: 'Thời gian tạo'
    }
  ]
}
```

### `model` - Mô hình tùy chỉnh
- **Kiểu**: `string | ModelStatic<Model>`
- **Bắt buộc**: ❌
- **Mô tả**: Chỉ định lớp mô hình Sequelize tùy chỉnh, có thể là tên lớp hoặc chính lớp mô hình đó.
- **Ví dụ**:
```typescript
// Sử dụng chuỗi để chỉ định tên lớp mô hình
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// Sử dụng lớp mô hình
import { UserModel } from './models/UserModel';
{
  name: 'users',
  model: UserModel,
  fields: [...]
}
```

### `repository` - Kho lưu trữ tùy chỉnh
- **Kiểu**: `string | RepositoryType`
- **Bắt buộc**: ❌
- **Mô tả**: Chỉ định lớp kho lưu trữ (repository) tùy chỉnh để xử lý logic truy cập dữ liệu.
- **Ví dụ**:
```typescript
// Sử dụng chuỗi để chỉ định tên lớp kho lưu trữ
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// Sử dụng lớp kho lưu trữ
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - Tự động tạo ID
- **Kiểu**: `boolean`
- **Bắt buộc**: ❌
- **Giá trị mặc định**: `true`
- **Mô tả**: Có tự động tạo ID khóa chính hay không.
- **Ví dụ**:
```typescript
{
  name: 'users',
  autoGenId: true,  // Tự động tạo ID khóa chính
  fields: [...]
}

// Tắt tự động tạo ID (cần chỉ định khóa chính thủ công)
{
  name: 'external_data',
  autoGenId: false,
fields: [
  {
    type: 'string',
      name: 'id',
      primaryKey: true
    }
  ]
}
```

### `timestamps` - Bật dấu thời gian
- **Kiểu**: `boolean`
- **Bắt buộc**: ❌
- **Giá trị mặc định**: `true`
- **Mô tả**: Có bật các trường thời gian tạo (`createdAt`) và thời gian cập nhật (`updatedAt`) hay không.
- **Ví dụ**:
```typescript
{
  name: 'users',
  timestamps: true,  // Bật dấu thời gian
  fields: [...]
}
```

### `createdAt` - Trường thời gian tạo
- **Kiểu**: `boolean | string`
- **Bắt buộc**: ❌
- **Giá trị mặc định**: `true`
- **Mô tả**: Cấu hình cho trường thời gian tạo (`createdAt`).
- **Ví dụ**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // Tên trường thời gian tạo tùy chỉnh
  fields: [...]
}
```

### `updatedAt` - Trường thời gian cập nhật
- **Kiểu**: `boolean | string`
- **Bắt buộc**: ❌
- **Giá trị mặc định**: `true`
- **Mô tả**: Cấu hình cho trường thời gian cập nhật (`updatedAt`).
- **Ví dụ**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // Tên trường thời gian cập nhật tùy chỉnh
  fields: [...]
}
```

### `deletedAt` - Trường xóa mềm
- **Kiểu**: `boolean | string`
- **Bắt buộc**: ❌
- **Giá trị mặc định**: `false`
- **Mô tả**: Cấu hình cho trường xóa mềm (`deletedAt`).
- **Ví dụ**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // Bật xóa mềm
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - Chế độ xóa mềm
- **Kiểu**: `boolean`
- **Bắt buộc**: ❌
- **Giá trị mặc định**: `false`
- **Mô tả**: Có bật chế độ xóa mềm hay không.
- **Ví dụ**:
```typescript
{
  name: 'users',
  paranoid: true,  // Bật xóa mềm
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - Quy tắc đặt tên dùng dấu gạch dưới
- **Kiểu**: `boolean`
- **Bắt buộc**: ❌
- **Giá trị mặc định**: `false`
- **Mô tả**: Có sử dụng kiểu đặt tên dấu gạch dưới (`underscored`) hay không.
- **Ví dụ**:
```typescript
{
  name: 'users',
  underscored: true,  // Sử dụng kiểu đặt tên dấu gạch dưới
  fields: [...]
}
```

### `indexes` - Cấu hình chỉ mục
- **Kiểu**: `ModelIndexesOptions[]`
- **Bắt buộc**: ❌
- **Mô tả**: Cấu hình chỉ mục cơ sở dữ liệu.
- **Ví dụ**:
```typescript
{
  name: 'users',
  indexes: [
    {
      fields: ['email'],
      unique: true
    },
    {
      fields: ['username', 'status']
    }
  ],
  fields: [...]
}
```

## Cấu hình tham số trường

NocoBase hỗ trợ nhiều loại trường, tất cả đều được định nghĩa dựa trên kiểu liên hợp `FieldOptions`. Cấu hình trường bao gồm các thuộc tính cơ bản, thuộc tính dành riêng cho kiểu dữ liệu, thuộc tính quan hệ và thuộc tính hiển thị giao diện người dùng.

### Các tùy chọn trường cơ bản

Tất cả các kiểu trường đều kế thừa từ `BaseFieldOptions`, cung cấp khả năng cấu hình trường chung:

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // Tham số chung
  name?: string;                    // Tên trường
  hidden?: boolean;                 // Có ẩn hay không
  validation?: ValidationOptions<T>; // Quy tắc xác thực

  // Thuộc tính trường cột phổ biến
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // Liên quan đến giao diện người dùng
  title?: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
}
```

**Ví dụ**:

```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,        // Không cho phép giá trị null
  unique: true,           // Ràng buộc duy nhất
  defaultValue: '',       // Mặc định là chuỗi rỗng
  index: true,            // Tạo chỉ mục
  comment: 'Tên đăng nhập người dùng'    // Chú thích cơ sở dữ liệu
}
```

### `name` - Tên trường

- **Kiểu**: `string`
- **Bắt buộc**: ❌
- **Mô tả**: Tên cột của trường trong cơ sở dữ liệu, phải là duy nhất trong bộ sưu tập.
- **Ví dụ**:
```typescript
{
  type: 'string',
  name: 'username',  // Tên trường
  title: 'Tên người dùng'
}
```

### `hidden` - Ẩn trường

- **Kiểu**: `boolean`
- **Giá trị mặc định**: `false`
- **Mô tả**: Có ẩn trường này theo mặc định trong danh sách/biểu mẫu hay không.
- **Ví dụ**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // Ẩn trường ID nội bộ
  title: 'ID nội bộ'
}
```

### `validation` - Quy tắc xác thực

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // Kiểu xác thực
  rules: FieldValidationRule<T>[];  // Mảng quy tắc xác thực
  [key: string]: any;              // Các tùy chọn xác thực khác
}

interface FieldValidationRule<T extends BasicType> {
  key: string;                      // Tên khóa quy tắc
  name: FieldValidationRuleName<T>; // Tên quy tắc
  args?: {                         // Tham số quy tắc
    [key: string]: any;
  };
  paramsType?: 'object';           // Kiểu tham số
}
```

- **Kiểu**: `ValidationOptions<T>`
- **Mô tả**: Sử dụng Joi để định nghĩa các quy tắc xác thực phía máy chủ.
- **Ví dụ**:
```typescript
{
  type: 'string',
  name: 'email',
  validation: {
    type: 'string',
    rules: [
      { key: 'email', name: 'email' },
      { key: 'required', name: 'required' }
    ]
  }
}
```

### `allowNull` - Cho phép giá trị null

- **Kiểu**: `boolean`
- **Giá trị mặc định**: `true`
- **Mô tả**: Kiểm soát xem cơ sở dữ liệu có cho phép ghi giá trị `NULL` hay không.
- **Ví dụ**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // Không cho phép giá trị null
  title: 'Tên người dùng'
}
```

### `defaultValue` - Giá trị mặc định

- **Kiểu**: `any`
- **Mô tả**: Giá trị mặc định cho trường, sẽ được sử dụng khi tạo bản ghi mà không cung cấp giá trị cho trường này.
- **Ví dụ**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // Mặc định là trạng thái nháp
  title: 'Trạng thái'
}
```

### `unique` - Ràng buộc duy nhất

- **Kiểu**: `boolean | string`
- **Giá trị mặc định**: `false`
- **Mô tả**: Có phải là duy nhất hay không; có thể chỉ định tên ràng buộc bằng một chuỗi.
- **Ví dụ**:
```typescript
{
  type: 'string',
  name: 'email',
  unique: true,  // Email phải là duy nhất
  title: 'Email'
}
```

### `primaryKey` - Khóa chính

- **Kiểu**: `boolean`
- **Giá trị mặc định**: `false`
- **Mô tả**: Khai báo trường này là khóa chính.
- **Ví dụ**:
```typescript
{
  type: 'integer',
  name: 'id',
  primaryKey: true,  // Đặt làm khóa chính
  autoIncrement: true
}
```

### `autoIncrement` - Tự động tăng

- **Kiểu**: `boolean`
- **Giá trị mặc định**: `false`
- **Mô tả**: Bật tự động tăng (chỉ áp dụng cho các trường kiểu số).
- **Ví dụ**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // Tự động tăng dần
  primaryKey: true
}
```

### `field` - Tên cột cơ sở dữ liệu

- **Kiểu**: `string`
- **Mô tả**: Chỉ định tên cột cơ sở dữ liệu thực tế (nhất quán với `field` của Sequelize).
- **Ví dụ**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // Tên cột trong cơ sở dữ liệu
  title: 'ID người dùng'
}
```

### `comment` - Chú thích cơ sở dữ liệu

- **Kiểu**: `string`
- **Mô tả**: Chú thích cho trường cơ sở dữ liệu, dùng cho mục đích tài liệu.
- **Ví dụ**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: 'Tên đăng nhập người dùng, dùng để đăng nhập hệ thống',  // Chú thích cơ sở dữ liệu
  title: 'Tên người dùng'
}
```

### `title` - Tiêu đề hiển thị

- **Kiểu**: `string`
- **Mô tả**: Tiêu đề hiển thị cho trường, thường dùng để hiển thị trên giao diện người dùng.
- **Ví dụ**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Tên người dùng',  // Tiêu đề hiển thị trên giao diện người dùng
  allowNull: false
}
```

### `description` - Mô tả trường

- **Kiểu**: `string`
- **Mô tả**: Thông tin mô tả về trường, dùng để giúp người dùng hiểu mục đích của trường.
- **Ví dụ**:
```typescript
{
  type: 'string',
  name: 'email',
  title: 'Email',
  description: 'Vui lòng nhập địa chỉ email hợp lệ',  // Mô tả trường
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
```

### `interface` - Thành phần giao diện

- **Kiểu**: `string`
- **Mô tả**: Thành phần giao diện người dùng (frontend) được khuyến nghị sử dụng cho trường.
- **Ví dụ**:
```typescript
{
  type: 'string',
  name: 'content',
  title: 'Nội dung',
  interface: 'textarea',  // Khuyến nghị sử dụng thành phần vùng văn bản (textarea)
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### Các giao diện kiểu trường

### `type: 'string'` - Trường chuỗi

- **Mô tả**: Dùng để lưu trữ dữ liệu văn bản ngắn. Hỗ trợ giới hạn độ dài và tự động cắt khoảng trắng.
- **Kiểu cơ sở dữ liệu**: `VARCHAR`
- **Thuộc tính đặc trưng**:
  - `length`: Giới hạn độ dài chuỗi
  - `trim`: Có tự động xóa khoảng trắng ở đầu và cuối hay không

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // Giới hạn độ dài chuỗi
  trim?: boolean;     // Có tự động xóa khoảng trắng ở đầu và cuối hay không
}
```

**Ví dụ**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Tên người dùng',
  length: 50,           // Tối đa 50 ký tự
  trim: true,           // Tự động xóa khoảng trắng
    allowNull: false,
    unique: true,
    validation: {
      type: 'string',
      rules: [
        { key: 'min', name: 'min', args: { limit: 3 } },
      { key: 'max', name: 'max', args: { limit: 20 } }
    ]
  }
}
```

### `type: 'text'` - Trường văn bản

- **Mô tả**: Dùng để lưu trữ dữ liệu văn bản dài. Hỗ trợ các kiểu văn bản có độ dài khác nhau trong MySQL.
- **Kiểu cơ sở dữ liệu**: `TEXT`, `MEDIUMTEXT`, `LONGTEXT`
- **Thuộc tính đặc trưng**:
  - `length`: Kiểu độ dài văn bản MySQL (`tiny`/`medium`/`long`)

```ts
interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';  // Kiểu độ dài văn bản MySQL
}
```

**Ví dụ**:
```typescript
{
  type: 'text',
  name: 'content',
  title: 'Nội dung',
  length: 'medium',     // Sử dụng MEDIUMTEXT
  allowNull: true
}
```

### Các kiểu số

### `type: 'integer'` - Trường số nguyên

- **Mô tả**: Dùng để lưu trữ dữ liệu số nguyên. Hỗ trợ tự động tăng và khóa chính.
- **Kiểu cơ sở dữ liệu**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // Kế thừa tất cả các tùy chọn từ kiểu INTEGER của Sequelize
}
```

**Ví dụ**:
```typescript
  {
    type: 'integer',
  name: 'id',
  title: 'ID',
  primaryKey: true,
  autoIncrement: true,
  allowNull: false
}
```

### `type: 'bigInt'` - Trường số nguyên lớn

- **Mô tả**: Dùng để lưu trữ dữ liệu số nguyên lớn, có phạm vi lớn hơn `integer`.
- **Kiểu cơ sở dữ liệu**: `BIGINT`

```ts
interface BigIntFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'bigInt';
}
```

**Ví dụ**:
```typescript
{
  type: 'bigInt',
  name: 'userId',
  title: 'ID người dùng',
  allowNull: false,
  unique: true
}
```

### `type: 'float'` - Trường số thực (float)

- **Mô tả**: Dùng để lưu trữ số thực dấu phẩy động độ chính xác đơn.
- **Kiểu cơ sở dữ liệu**: `FLOAT`
- **Thuộc tính đặc trưng**:
  - `precision`: Độ chính xác (tổng số chữ số)
  - `scale`: Số chữ số thập phân

```ts
interface FloatFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'float';
  precision?: number;  // Độ chính xác
  scale?: number;      // Số chữ số thập phân
}
```

**Ví dụ**:
```typescript
{
  type: 'float',
  name: 'score',
  title: 'Điểm số',
  precision: 5,
  scale: 2,
  allowNull: true,
  defaultValue: 0.0
}
```

### `type: 'double'` - Trường số thực độ chính xác kép (double)

- **Mô tả**: Dùng để lưu trữ số thực dấu phẩy động độ chính xác kép, có độ chính xác cao hơn `float`.
- **Kiểu cơ sở dữ liệu**: `DOUBLE`
- **Thuộc tính đặc trưng**:
  - `precision`: Độ chính xác (tổng số chữ số)
  - `scale`: Số chữ số thập phân

```ts
interface DoubleFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'double';
  precision?: number;
  scale?: number;
}
```

**Ví dụ**:
```typescript
{
  type: 'double',
    name: 'price',
      title: 'Giá',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00
}
```

### `type: 'real'` - Trường số thực (real)

- **Mô tả**: Dùng để lưu trữ số thực; phụ thuộc vào cơ sở dữ liệu.
- **Kiểu cơ sở dữ liệu**: `REAL`
- **Thuộc tính đặc trưng**:
  - `precision`: Độ chính xác (tổng số chữ số)
  - `scale`: Số chữ số thập phân

```ts
interface RealFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'real';
  precision?: number;
  scale?: number;
}
```

**Ví dụ**:
```typescript
{
  type: 'real',
  name: 'rate',
  title: 'Tỷ giá',
  precision: 8,
  scale: 4,
  allowNull: true
}
```

### `type: 'decimal'` - Trường số thập phân chính xác

- **Mô tả**: Dùng để lưu trữ số thập phân chính xác, phù hợp cho các tính toán tài chính.
- **Kiểu cơ sở dữ liệu**: `DECIMAL`
- **Thuộc tính đặc trưng**:
  - `precision`: Độ chính xác (tổng số chữ số)
  - `scale`: Số chữ số thập phân

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // Độ chính xác (tổng số chữ số)
  scale?: number;      // Số chữ số thập phân
}
```

**Ví dụ**:
```typescript
{
  type: 'decimal',
  name: 'amount',
  title: 'Số tiền',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00,
  validation: {
    type: 'number',
    rules: [
      { key: 'min', name: 'min', args: { limit: 0 } }
    ]
  }
}
```

### Các kiểu Boolean

### `type: 'boolean'` - Trường Boolean

- **Mô tả**: Dùng để lưu trữ giá trị đúng/sai, thường dùng cho trạng thái bật/tắt.
- **Kiểu cơ sở dữ liệu**: `BOOLEAN` hoặc `TINYINT(1)`

```typescript
interface BooleanFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'boolean';
}
```

**Ví dụ**:
```typescript
{
  type: 'boolean',
  name: 'isActive',
  title: 'Đang hoạt động',
  defaultValue: true,
  allowNull: false
}
```

### `type: 'radio'` - Trường chọn một (radio)

- **Mô tả**: Dùng để lưu trữ giá trị được chọn duy nhất, thường dùng cho các lựa chọn nhị phân.
- **Kiểu cơ sở dữ liệu**: `BOOLEAN` hoặc `TINYINT(1)`

```typescript
interface RadioFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'radio';
}
```

**Ví dụ**:
```typescript
{
  type: 'radio',
  name: 'isDefault',
  title: 'Là mặc định',
  defaultValue: false,
  allowNull: false
}
```

### Các kiểu ngày giờ

### `type: 'date'` - Trường ngày

- **Mô tả**: Dùng để lưu trữ dữ liệu ngày, không bao gồm thông tin thời gian.
- **Kiểu cơ sở dữ liệu**: `DATE`
- **Thuộc tính đặc trưng**:
  - `timezone`: Có bao gồm thông tin múi giờ hay không

```typescript
interface DateFieldOptions extends BaseColumnFieldOptions<'date'> {
  type: 'date';
  timezone?: boolean;  // Có bao gồm thông tin múi giờ hay không
}
```

**Ví dụ**:
```typescript
{
  type: 'date',
  name: 'birthday',
  title: 'Ngày sinh',
  allowNull: true,
  timezone: false
}
```

### `type: 'time'` - Trường giờ

- **Mô tả**: Dùng để lưu trữ dữ liệu thời gian, không bao gồm thông tin ngày.
- **Kiểu cơ sở dữ liệu**: `TIME`
- **Thuộc tính đặc trưng**:
  - `timezone`: Có bao gồm thông tin múi giờ hay không

```ts
interface TimeFieldOptions extends BaseColumnFieldOptions<'time'> {
  type: 'time';
  timezone?: boolean;
}
```

**Ví dụ**:
```typescript
{
  type: 'time',
  name: 'startTime',
  title: 'Thời gian bắt đầu',
  allowNull: false,
  timezone: false
}
```

### `type: 'datetimeTz'` - Trường ngày giờ có múi giờ

- **Mô tả**: Dùng để lưu trữ dữ liệu ngày giờ có thông tin múi giờ.
- **Kiểu cơ sở dữ liệu**: `TIMESTAMP WITH TIME ZONE`
- **Thuộc tính đặc trưng**:
  - `timezone`: Có bao gồm thông tin múi giờ hay không

```ts
interface DatetimeTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeTz';
  timezone?: boolean;
}
```

**Ví dụ**:
```typescript
{
  type: 'datetimeTz',
  name: 'createdAt',
  title: 'Thời gian tạo',
  allowNull: false,
  timezone: true,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'datetimeNoTz'` - Trường ngày giờ không có múi giờ

- **Mô tả**: Dùng để lưu trữ dữ liệu ngày giờ không có thông tin múi giờ.
- **Kiểu cơ sở dữ liệu**: `TIMESTAMP` hoặc `DATETIME`
- **Thuộc tính đặc trưng**:
  - `timezone`: Có bao gồm thông tin múi giờ hay không

```ts
interface DatetimeNoTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeNoTz';
  timezone?: boolean;
}
```

**Ví dụ**:
```typescript
{
  type: 'datetimeNoTz',
  name: 'updatedAt',
  title: 'Thời gian cập nhật',
  allowNull: false,
  timezone: false,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'dateOnly'` - Trường chỉ ngày

- **Mô tả**: Dùng để lưu trữ dữ liệu chỉ bao gồm ngày, không bao gồm thời gian.
- **Kiểu cơ sở dữ liệu**: `DATE`
- **Ví dụ**:
```typescript
{
  type: 'dateOnly',
  name: 'publishDate',
  title: 'Ngày xuất bản',
  allowNull: true
}
```

### `type: 'unixTimestamp'` - Trường dấu thời gian Unix

- **Mô tả**: Dùng để lưu trữ dữ liệu dấu thời gian Unix.
- **Kiểu cơ sở dữ liệu**: `BIGINT`
- **Thuộc tính đặc trưng**:
  - `epoch`: Thời gian kỷ nguyên

```typescript
interface UnixTimestampFieldOptions extends BaseColumnFieldOptions<'unixTimestamp'> {
  type: 'unixTimestamp';
  epoch?: number;  // Thời gian kỷ nguyên
}
```

**Ví dụ**:
```typescript
{
  type: 'unixTimestamp',
  name: 'lastLoginAt',
  title: 'Thời gian đăng nhập cuối',
  allowNull: true,
  epoch: 0
}
```

### Các kiểu JSON

### `type: 'json'` - Trường JSON

- **Mô tả**: Dùng để lưu trữ dữ liệu định dạng JSON, hỗ trợ các cấu trúc dữ liệu phức tạp.
- **Kiểu cơ sở dữ liệu**: `JSON` hoặc `TEXT`
- **Ví dụ**:
```typescript
{
  type: 'json',
  name: 'metadata',
  title: 'Siêu dữ liệu',
  allowNull: true,
  defaultValue: {}
}
```

### `type: 'jsonb'` - Trường JSONB

- **Mô tả**: Dùng để lưu trữ dữ liệu định dạng JSONB (đặc trưng của PostgreSQL), hỗ trợ lập chỉ mục và truy vấn.
- **Kiểu cơ sở dữ liệu**: `JSONB` (PostgreSQL)
- **Ví dụ**:
```typescript
{
  type: 'jsonb',
  name: 'config',
  title: 'Cấu hình',
  allowNull: true,
  defaultValue: {}
}
```

### Các kiểu mảng

### `type: 'array'` - Trường mảng

- **Mô tả**: Dùng để lưu trữ dữ liệu mảng, hỗ trợ nhiều kiểu phần tử khác nhau.
- **Kiểu cơ sở dữ liệu**: `JSON` hoặc `ARRAY`
- **Thuộc tính đặc trưng**:
  - `dataType`: Kiểu lưu trữ (`json`/`array`)
  - `elementType`: Kiểu phần tử (`STRING`/`INTEGER`/`BOOLEAN`/`JSON`)

```ts
interface ArrayFieldOptions extends BaseColumnFieldOptions<'array'> {
  type: 'array';
  dataType?: 'json' | 'array';  // Kiểu lưu trữ
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON'; // Kiểu phần tử
}
```

**Ví dụ**:
```typescript
{
  type: 'array',
  name: 'tags',
  title: 'Thẻ',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### `type: 'set'` - Trường tập hợp

- **Mô tả**: Dùng để lưu trữ dữ liệu tập hợp, tương tự mảng nhưng có ràng buộc duy nhất.
- **Kiểu cơ sở dữ liệu**: `JSON` hoặc `ARRAY`
- **Thuộc tính đặc trưng**:
  - `dataType`: Kiểu lưu trữ (`json`/`array`)
  - `elementType`: Kiểu phần tử (`STRING`/`INTEGER`/`BOOLEAN`/`JSON`)

```ts
interface SetFieldOptions extends BaseColumnFieldOptions<'set'> {
  type: 'set';
  dataType?: 'json' | 'array';
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
}
```

**Ví dụ**:
```typescript
{
  type: 'set',
  name: 'categories',
      title: 'Danh mục',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### Các kiểu định danh

### `type: 'uuid'` - Trường UUID

- **Mô tả**: Dùng để lưu trữ mã định danh duy nhất theo định dạng UUID.
- **Kiểu cơ sở dữ liệu**: `UUID` hoặc `VARCHAR(36)`
- **Thuộc tính đặc trưng**:
  - `autoFill`: Tự động điền

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // Tự động điền
}
```

**Ví dụ**:
```typescript
{
  type: 'uuid',
  name: 'id',
  title: 'ID',
  autoFill: true,
  allowNull: false,
  primaryKey: true
}
```

### `type: 'nanoid'` - Trường Nanoid

- **Mô tả**: Dùng để lưu trữ mã định danh duy nhất ngắn theo định dạng Nanoid.
- **Kiểu cơ sở dữ liệu**: `VARCHAR`
- **Thuộc tính đặc trưng**:
  - `size`: Độ dài ID
  - `customAlphabet`: Bộ ký tự tùy chỉnh
  - `autoFill`: Tự động điền

```ts
interface NanoidFieldOptions extends BaseColumnFieldOptions<'nanoid'> {
  type: 'nanoid';
  size?: number;  // Độ dài ID
  customAlphabet?: string;  // Bộ ký tự tùy chỉnh
  autoFill?: boolean;
}
```

**Ví dụ**:
```typescript
{
  type: 'nanoid',
  name: 'shortId',
  title: 'ID ngắn',
  size: 12,
  customAlphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  autoFill: true,
  allowNull: false,
  unique: true
}
```

### `type: 'uid'` - Trường UID tùy chỉnh

- **Mô tả**: Dùng để lưu trữ mã định danh duy nhất theo định dạng tùy chỉnh.
- **Kiểu cơ sở dữ liệu**: `VARCHAR`
- **Thuộc tính đặc trưng**:
  - `prefix`: Tiền tố
  - `pattern`: Mẫu xác thực

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // Tiền tố
  pattern?: string; // Mẫu xác thực
}
```

**Ví dụ**:
```typescript
{
  type: 'uid',
  name: 'code',
  title: 'Mã',
  prefix: 'USR_',
  pattern: '^[A-Za-z0-9_][A-Za-z0-9_-]*$',
  allowNull: false,
  unique: true
}
```

### `type: 'snowflakeId'` - Trường ID Snowflake

- **Mô tả**: Dùng để lưu trữ mã định danh duy nhất được tạo bằng thuật toán Snowflake.
- **Kiểu cơ sở dữ liệu**: `BIGINT`
- **Ví dụ**:
```typescript
{
  type: 'snowflakeId',
  name: 'snowflakeId',
  title: 'ID Snowflake',
  allowNull: false,
  unique: true
}
```

### Các trường chức năng

### `type: 'password'` - Trường mật khẩu

- **Mô tả**: Dùng để lưu trữ dữ liệu mật khẩu đã mã hóa.
- **Kiểu cơ sở dữ liệu**: `VARCHAR`
- **Thuộc tính đặc trưng**:
  - `length`: Độ dài hàm băm (hash)
  - `randomBytesSize`: Kích thước byte ngẫu nhiên

```ts
interface PasswordFieldOptions extends BaseColumnFieldOptions<'password'> {
  type: 'password';
  length?: number;  // Độ dài hàm băm
  randomBytesSize?: number;  // Kích thước byte ngẫu nhiên
}
```

**Ví dụ**:
```typescript
{
  type: 'password',
  name: 'password',
  title: 'Mật khẩu',
  length: 64,
  randomBytesSize: 8,
  allowNull: false,
  hidden: true
}
```

### `type: 'encryption'` - Trường mã hóa

- **Mô tả**: Dùng để lưu trữ dữ liệu nhạy cảm đã mã hóa.
- **Kiểu cơ sở dữ liệu**: `VARCHAR`
- **Ví dụ**:
```typescript
{
  type: 'encryption',
  name: 'secret',
  title: 'Khóa bí mật',
  allowNull: true,
  hidden: true
}
```

### `type: 'virtual'` - Trường ảo

- **Mô tả**: Dùng để lưu trữ dữ liệu ảo được tính toán, không lưu trữ trong cơ sở dữ liệu.
- **Kiểu cơ sở dữ liệu**: Không có (trường ảo)
- **Ví dụ**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: 'Họ và tên'
}
```

### `type: 'context'` - Trường ngữ cảnh

- **Mô tả**: Dùng để đọc dữ liệu từ ngữ cảnh thực thi (ví dụ: thông tin người dùng hiện tại).
- **Kiểu cơ sở dữ liệu**: Được xác định bởi `dataType`
- **Thuộc tính đặc trưng**:
  - `dataIndex`: Đường dẫn chỉ mục dữ liệu
  - `dataType`: Kiểu dữ liệu
  - `createOnly`: Chỉ đặt khi tạo

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // Đường dẫn chỉ mục dữ liệu
  dataType?: string;   // Kiểu dữ liệu
  createOnly?: boolean; // Chỉ đặt khi tạo
}
```

**Ví dụ**:
```typescript
{
  type: 'context',
  name: 'currentUserId',
  title: 'ID người dùng hiện tại',
  dataIndex: 'user.id',
  dataType: 'integer',
  createOnly: true,
  allowNull: false
}
```

### Các trường quan hệ

### `type: 'belongsTo'` - Quan hệ thuộc về (belongsTo)

- **Mô tả**: Biểu thị quan hệ nhiều-một, trong đó bản ghi hiện tại thuộc về một bản ghi khác.
- **Kiểu cơ sở dữ liệu**: Trường khóa ngoại
- **Thuộc tính đặc trưng**:
  - `target`: Tên bộ sưu tập đích
  - `foreignKey`: Tên trường khóa ngoại
  - `targetKey`: Tên trường khóa đích trong bảng đích
  - `onDelete`: Thao tác cascade khi xóa
  - `onUpdate`: Thao tác cascade khi cập nhật
  - `constraints`: Có bật ràng buộc khóa ngoại hay không

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // Tên bộ sưu tập đích
  foreignKey?: string;  // Tên trường khóa ngoại
  targetKey?: string;   // Tên trường khóa đích trong bảng đích
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;  // Có bật ràng buộc khóa ngoại hay không
}
```

**Ví dụ**:
```typescript
  {
    type: 'belongsTo',
  name: 'author',
  title: 'Tác giả',
  target: 'users',
  foreignKey: 'authorId',
  targetKey: 'id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasOne'` - Quan hệ có một (hasOne)

- **Mô tả**: Biểu thị quan hệ một-một, trong đó bản ghi hiện tại có một bản ghi liên quan.
- **Kiểu cơ sở dữ liệu**: Trường khóa ngoại
- **Thuộc tính đặc trưng**:
  - `target`: Tên bộ sưu tập đích
  - `foreignKey`: Tên trường khóa ngoại
  - `sourceKey`: Tên trường khóa nguồn trong bảng nguồn
  - `onDelete`: Thao tác cascade khi xóa
  - `onUpdate`: Thao tác cascade khi cập nhật
  - `constraints`: Có bật ràng buộc khóa ngoại hay không

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // Tên trường khóa nguồn
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Ví dụ**:
```typescript
{
  type: 'hasOne',
  name: 'profile',
  title: 'Hồ sơ người dùng',
  target: 'user_profiles',
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasMany'` - Quan hệ có nhiều (hasMany)

- **Mô tả**: Biểu thị quan hệ một-nhiều, trong đó bản ghi hiện tại có nhiều bản ghi liên quan.
- **Kiểu cơ sở dữ liệu**: Trường khóa ngoại
- **Thuộc tính đặc trưng**:
  - `target`: Tên bộ sưu tập đích
  - `foreignKey`: Tên trường khóa ngoại
  - `sourceKey`: Tên trường khóa nguồn trong bảng nguồn
  - `sortBy`: Trường sắp xếp
  - `sortable`: Có thể sắp xếp được hay không
  - `onDelete`: Thao tác cascade khi xóa
  - `onUpdate`: Thao tác cascade khi cập nhật
  - `constraints`: Có bật ràng buộc khóa ngoại hay không

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // Trường sắp xếp
  sortable?: boolean; // Có thể sắp xếp được hay không
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Ví dụ**:
```typescript
  {
    type: 'hasMany',
  name: 'posts',
  title: 'Danh sách bài viết',
  target: 'articles',
  foreignKey: 'authorId',
  sourceKey: 'id',
    sortBy: ['createdAt'],
  sortable: true,
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'belongsToMany'` - Quan hệ nhiều-nhiều (belongsToMany)

- **Mô tả**: Biểu thị quan hệ nhiều-nhiều, kết nối hai bộ sưu tập thông qua một bảng trung gian.
- **Kiểu cơ sở dữ liệu**: Bảng trung gian
- **Thuộc tính đặc trưng**:
  - `target`: Tên bộ sưu tập đích
  - `through`: Tên bảng trung gian
  - `foreignKey`: Tên trường khóa ngoại
  - `otherKey`: Khóa ngoại khác ở phía bên kia của bảng trung gian
  - `sourceKey`: Tên trường khóa nguồn trong bảng nguồn
  - `targetKey`: Tên trường khóa đích trong bảng đích
  - `onDelete`: Thao tác cascade khi xóa
  - `onUpdate`: Thao tác cascade khi cập nhật
  - `constraints`: Có bật ràng buộc khóa ngoại hay không

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // Tên bảng trung gian
  foreignKey?: string;
  otherKey?: string;  // Khóa ngoại khác ở phía bên kia của bảng trung gian
  sourceKey?: string;
  targetKey?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Ví dụ**:
```typescript
{
  type: 'belongsToMany',
  name: 'tags',
  title: 'Thẻ',
  target: 'article_tags',
  through: 'article_tag_relations',
  foreignKey: 'articleId',
  otherKey: 'tagId',
  sourceKey: 'id',
  targetKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```