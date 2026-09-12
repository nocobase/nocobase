---
title: "Tham số cấu hình Collection"
description: "Cấu hình defineCollection NocoBase: name, title, migrationRules, inherits, fields, timestamps, autoGenId, v.v."
keywords: "CollectionOptions,defineCollection,name,fields,migrationRules,inherits,NocoBase"
---


## Mô tả tham số cấu hình Collection

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

### `name` - Tên bảng dữ liệu
- **Loại**: `string`
- **Bắt buộc**: ✅
- **Mô tả**: Định danh duy nhất của bảng dữ liệu, phải duy nhất trong toàn ứng dụng
- **Ví dụ**:
```typescript
{
  name: 'users'  // Bảng dữ liệu users
}
```

### `title` - Tiêu đề bảng dữ liệu
- **Loại**: `string`
- **Bắt buộc**: ❌
- **Mô tả**: Tiêu đề hiển thị của bảng dữ liệu, dùng để hiển thị trên giao diện front-end
- **Ví dụ**:
```typescript
{
  name: 'users',
  title: 'Quản lý người dùng'  // Hiển thị trên giao diện là "Quản lý người dùng"
}
```

### `migrationRules` - Quy tắc migration
- **Loại**: `MigrationRule[]`
- **Bắt buộc**: ❌
- **Mô tả**: Quy tắc xử lý khi migration dữ liệu
- **Ví dụ**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // Ghi đè dữ liệu hiện có
  fields: [...]
}
```

### `inherits` - Kế thừa bảng dữ liệu
- **Loại**: `string[] | string`
- **Bắt buộc**: ❌
- **Mô tả**: Kế thừa định nghĩa Field từ các bảng dữ liệu khác, hỗ trợ kế thừa từ một hoặc nhiều bảng
- **Ví dụ**:

```typescript
// Kế thừa đơn
{
  name: 'admin_users',
  inherits: 'users',  // Kế thừa tất cả Field của bảng users
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
  inherits: ['users', 'admin_users'],  // Kế thừa nhiều bảng dữ liệu
  fields: [...]
}
```

### `filterTargetKey` - Khóa target để filter
- **Loại**: `string | string[]`
- **Bắt buộc**: ❌
- **Mô tả**: Khóa target dùng để filter truy vấn, hỗ trợ một hoặc nhiều khóa
- **Ví dụ**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // Filter theo userId
  fields: [...]
}

// Nhiều khóa filter
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // Filter theo userId và categoryId
  fields: [...]
}
```

### `fields` - Định nghĩa Field
- **Loại**: `FieldOptions[]`
- **Bắt buộc**: ❌
- **Giá trị mặc định**: `[]`
- **Mô tả**: Mảng định nghĩa Field của bảng dữ liệu, mỗi Field bao gồm thông tin về kiểu, tên, cấu hình, v.v.
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

### `model` - Model tùy chỉnh
- **Loại**: `string | ModelStatic<Model>`
- **Bắt buộc**: ❌
- **Mô tả**: Chỉ định lớp Sequelize Model tùy chỉnh, có thể là tên lớp hoặc bản thân lớp Model
- **Ví dụ**:
```typescript
// Dùng chuỗi để chỉ định tên lớp Model
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// Dùng lớp Model
import { UserModel } from './models/UserModel';
{
  name: 'users',
  model: UserModel,
  fields: [...]
}
```

### `repository` - Repository tùy chỉnh
- **Loại**: `string | RepositoryType`
- **Bắt buộc**: ❌
- **Mô tả**: Chỉ định lớp Repository tùy chỉnh, dùng để xử lý logic truy cập dữ liệu
- **Ví dụ**:
```typescript
// Dùng chuỗi để chỉ định tên lớp Repository
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// Dùng lớp Repository
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - Tự sinh ID
- **Loại**: `boolean`
- **Bắt buộc**: ❌
- **Giá trị mặc định**: `true`
- **Mô tả**: Có tự động sinh primary key ID hay không
- **Ví dụ**:
```typescript
{
  name: 'users',
  autoGenId: true,  // Tự động sinh primary key ID
  fields: [...]
}

// Tắt sinh ID tự động (cần chỉ định primary key thủ công)
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

### `timestamps` - Bật timestamp
- **Loại**: `boolean`
- **Bắt buộc**: ❌
- **Giá trị mặc định**: `true`
- **Mô tả**: Có bật Field thời gian tạo và thời gian cập nhật hay không
- **Ví dụ**:
```typescript
{
  name: 'users',
  timestamps: true,  // Bật timestamp
  fields: [...]
}
```

### `createdAt` - Field thời gian tạo
- **Loại**: `boolean | string`
- **Bắt buộc**: ❌
- **Giá trị mặc định**: `true`
- **Mô tả**: Cấu hình của Field thời gian tạo
- **Ví dụ**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // Tên Field thời gian tạo tùy chỉnh
  fields: [...]
}
```

### `updatedAt` - Field thời gian cập nhật
- **Loại**: `boolean | string`
- **Bắt buộc**: ❌
- **Giá trị mặc định**: `true`
- **Mô tả**: Cấu hình của Field thời gian cập nhật
- **Ví dụ**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // Tên Field thời gian cập nhật tùy chỉnh
  fields: [...]
}
```

### `deletedAt` - Field soft-delete
- **Loại**: `boolean | string`
- **Bắt buộc**: ❌
- **Giá trị mặc định**: `false`
- **Mô tả**: Cấu hình của Field soft-delete
- **Ví dụ**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // Bật soft-delete
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - Chế độ soft-delete
- **Loại**: `boolean`
- **Bắt buộc**: ❌
- **Giá trị mặc định**: `false`
- **Mô tả**: Có bật chế độ soft-delete hay không
- **Ví dụ**:
```typescript
{
  name: 'users',
  paranoid: true,  // Bật soft-delete
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - Đặt tên dấu gạch dưới
- **Loại**: `boolean`
- **Bắt buộc**: ❌
- **Giá trị mặc định**: `false`
- **Mô tả**: Có dùng phong cách đặt tên với dấu gạch dưới hay không
- **Ví dụ**:
```typescript
{
  name: 'users',
  underscored: true,  // Dùng phong cách đặt tên với dấu gạch dưới
  fields: [...]
}
```

### `indexes` - Cấu hình index
- **Loại**: `ModelIndexesOptions[]`
- **Bắt buộc**: ❌
- **Mô tả**: Cấu hình index database
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

## Mô tả cấu hình tham số Field

NocoBase hỗ trợ nhiều kiểu Field, tất cả Field đều dựa trên union type `FieldOptions` để định nghĩa. Cấu hình Field bao gồm thuộc tính cơ bản, thuộc tính riêng theo kiểu dữ liệu, thuộc tính quan hệ và thuộc tính render front-end.

### Tùy chọn Field cơ bản

Tất cả các kiểu Field đều kế thừa từ `BaseFieldOptions`, cung cấp năng lực cấu hình Field chung:

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // Tham số chung
  name?: string;                    // Tên Field
  hidden?: boolean;                 // Có ẩn hay không
  validation?: ValidationOptions<T>; // Quy tắc validation

  // Thuộc tính column thường dùng
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // Liên quan front-end
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
  allowNull: false,        // Không cho phép null
  unique: true,           // Ràng buộc duy nhất
  defaultValue: '',       // Mặc định chuỗi rỗng
  index: true,            // Tạo index
  comment: 'Tên đăng nhập của người dùng'    // Comment database
}
```

### `name` - Tên Field

- **Loại**: `string`
- **Bắt buộc**: ❌
- **Mô tả**: Tên column của Field trong database, phải duy nhất trong collection
- **Ví dụ**:
```typescript
{
  type: 'string',
  name: 'username',  // Tên Field
  title: 'Tên người dùng'
}
```

### `hidden` - Field ẩn

- **Loại**: `boolean`
- **Giá trị mặc định**: `false`
- **Mô tả**: Có mặc định ẩn Field này trong danh sách/form hay không
- **Ví dụ**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // Ẩn Field internalId
  title: 'Internal ID'
}
```

### `validation` - Quy tắc validation

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // Kiểu validation
  rules: FieldValidationRule<T>[];  // Mảng quy tắc validation
  [key: string]: any;              // Tùy chọn validation khác
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

- **Loại**: `ValidationOptions<T>`
- **Mô tả**: Dùng Joi để định nghĩa quy tắc validation phía server
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

### `allowNull` - Cho phép null

- **Loại**: `boolean`
- **Giá trị mặc định**: `true`
- **Mô tả**: Kiểm soát database có cho phép ghi giá trị `NULL` hay không
- **Ví dụ**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // Không cho phép null
  title: 'Tên người dùng'
}
```

### `defaultValue` - Giá trị mặc định

- **Loại**: `any`
- **Mô tả**: Giá trị mặc định của Field, sẽ được dùng khi tạo record mà không cung cấp giá trị Field này
- **Ví dụ**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // Mặc định trạng thái nháp
  title: 'Trạng thái'
}
```

### `unique` - Ràng buộc duy nhất

- **Loại**: `boolean | string`
- **Giá trị mặc định**: `false`
- **Mô tả**: Có duy nhất hay không; chuỗi có thể chỉ định tên ràng buộc
- **Ví dụ**:
```typescript
{
  type: 'string',
  name: 'email',
  unique: true,  // Email phải duy nhất
  title: 'Email'
}
```

### `primaryKey` - Primary key

- **Loại**: `boolean`
- **Giá trị mặc định**: `false`
- **Mô tả**: Khai báo Field này là primary key
- **Ví dụ**:
```typescript
{
  type: 'integer',
  name: 'id',
  primaryKey: true,  // Đặt làm primary key
  autoIncrement: true
}
```

### `autoIncrement` - Tự tăng

- **Loại**: `boolean`
- **Giá trị mặc định**: `false`
- **Mô tả**: Bật tự tăng (chỉ áp dụng cho Field kiểu số)
- **Ví dụ**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // Tự động tăng
  primaryKey: true
}
```

### `field` - Tên column trong database

- **Loại**: `string`
- **Mô tả**: Chỉ định tên column thực tế trong database (giống `field` của Sequelize)
- **Ví dụ**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // Tên column trong database
  title: 'User ID'
}
```

### `comment` - Comment database

- **Loại**: `string`
- **Mô tả**: Ghi chú Field database, dùng để mô tả tài liệu
- **Ví dụ**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: 'Tên đăng nhập của người dùng, dùng để đăng nhập vào hệ thống',  // Comment database
  title: 'Tên người dùng'
}
```

### `title` - Tiêu đề hiển thị

- **Loại**: `string`
- **Mô tả**: Tiêu đề hiển thị của Field, thường dùng để hiển thị trên giao diện front-end
- **Ví dụ**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Tên người dùng',  // Tiêu đề hiển thị front-end
  allowNull: false
}
```

### `description` - Mô tả Field

- **Loại**: `string`
- **Mô tả**: Thông tin mô tả Field, giúp người dùng hiểu công dụng Field
- **Ví dụ**:
```typescript
{
  type: 'string',
  name: 'email',
  title: 'Email',
  description: 'Vui lòng nhập địa chỉ email hợp lệ',  // Mô tả Field
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
```

### `interface` - Component giao diện

- **Loại**: `string`
- **Mô tả**: Component giao diện Field front-end được khuyến nghị
- **Ví dụ**:
```typescript
{
  type: 'string',
  name: 'content',
  title: 'Nội dung',
  interface: 'textarea',  // Khuyến nghị dùng component textarea
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### Interface kiểu Field

### `type: 'string'` - Field chuỗi

- **Mô tả**: Dùng để lưu dữ liệu văn bản ngắn, hỗ trợ giới hạn độ dài và tự động trim
- **Loại database**: `VARCHAR`
- **Thuộc tính riêng**:
  - `length`: Giới hạn độ dài chuỗi
  - `trim`: Có tự động xóa khoảng trắng đầu cuối hay không

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // Giới hạn độ dài chuỗi
  trim?: boolean;     // Có tự động xóa khoảng trắng đầu cuối hay không
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

### `type: 'text'` - Field text

- **Mô tả**: Dùng để lưu dữ liệu văn bản dài, hỗ trợ các kiểu text độ dài khác nhau của MySQL
- **Loại database**: `TEXT`, `MEDIUMTEXT`, `LONGTEXT`
- **Thuộc tính riêng**:
  - `length`: Kiểu độ dài text MySQL (tiny/medium/long)

```ts
interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';  // Kiểu độ dài text MySQL
}
```

**Ví dụ**:
```typescript
{
  type: 'text',
  name: 'content',
  title: 'Nội dung',
  length: 'medium',     // Dùng MEDIUMTEXT
  allowNull: true
}
```

### Kiểu số

### `type: 'integer'` - Field số nguyên

- **Mô tả**: Dùng để lưu dữ liệu số nguyên, hỗ trợ tự tăng và primary key
- **Loại database**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // Kế thừa tất cả tùy chọn của kiểu Sequelize INTEGER
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

### `type: 'bigInt'` - Field số nguyên lớn

- **Mô tả**: Dùng để lưu dữ liệu số nguyên lớn, phạm vi lớn hơn integer
- **Loại database**: `BIGINT`

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
  title: 'User ID',
  allowNull: false,
  unique: true
}
```

### `type: 'float'` - Field số thực

- **Mô tả**: Dùng để lưu số thực độ chính xác đơn
- **Loại database**: `FLOAT`
- **Thuộc tính riêng**:
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

### `type: 'double'` - Field số thực độ chính xác kép

- **Mô tả**: Dùng để lưu số thực độ chính xác kép, độ chính xác cao hơn float
- **Loại database**: `DOUBLE`
- **Thuộc tính riêng**:
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

### `type: 'real'` - Field số thực

- **Mô tả**: Dùng để lưu số thực, phụ thuộc vào database
- **Loại database**: `REAL`
- **Thuộc tính riêng**:
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

### `type: 'decimal'` - Field số thập phân chính xác

- **Mô tả**: Dùng để lưu số thập phân chính xác, phù hợp cho tính toán tài chính
- **Loại database**: `DECIMAL`
- **Thuộc tính riêng**:
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

### Kiểu Boolean

### `type: 'boolean'` - Field Boolean

- **Mô tả**: Dùng để lưu giá trị đúng/sai, thường dùng cho trạng thái bật/tắt
- **Loại database**: `BOOLEAN` hoặc `TINYINT(1)`

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
  title: 'Có hoạt động không',
  defaultValue: true,
  allowNull: false
}
```

### `type: 'radio'` - Field radio

- **Mô tả**: Dùng để lưu giá trị radio, thường dùng cho trường hợp chọn 1 trong 2
- **Loại database**: `BOOLEAN` hoặc `TINYINT(1)`

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
  title: 'Có mặc định không',
  defaultValue: false,
  allowNull: false
}
```

### Kiểu ngày giờ

### `type: 'date'` - Field ngày

- **Mô tả**: Dùng để lưu dữ liệu ngày, không bao gồm thông tin giờ
- **Loại database**: `DATE`
- **Thuộc tính riêng**:
  - `timezone`: Có bao gồm thông tin timezone hay không

```typescript
interface DateFieldOptions extends BaseColumnFieldOptions<'date'> {
  type: 'date';
  timezone?: boolean;  // Có bao gồm thông tin timezone hay không
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

### `type: 'time'` - Field giờ

- **Mô tả**: Dùng để lưu dữ liệu giờ, không bao gồm thông tin ngày
- **Loại database**: `TIME`
- **Thuộc tính riêng**:
  - `timezone`: Có bao gồm thông tin timezone hay không

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

### `type: 'datetimeTz'` - Field ngày giờ có timezone

- **Mô tả**: Dùng để lưu dữ liệu ngày giờ có timezone
- **Loại database**: `TIMESTAMP WITH TIME ZONE`
- **Thuộc tính riêng**:
  - `timezone`: Có bao gồm thông tin timezone hay không

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

### `type: 'datetimeNoTz'` - Field ngày giờ không timezone

- **Mô tả**: Dùng để lưu dữ liệu ngày giờ không có timezone
- **Loại database**: `TIMESTAMP` hoặc `DATETIME`
- **Thuộc tính riêng**:
  - `timezone`: Có bao gồm thông tin timezone hay không

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

### `type: 'dateOnly'` - Field chỉ ngày

- **Mô tả**: Dùng để lưu dữ liệu chỉ chứa ngày, không bao gồm giờ
- **Loại database**: `DATE`
- **Ví dụ**:
```typescript
{
  type: 'dateOnly',
  name: 'publishDate',
  title: 'Ngày phát hành',
  allowNull: true
}
```

### `type: 'unixTimestamp'` - Field Unix timestamp

- **Mô tả**: Dùng để lưu dữ liệu Unix timestamp
- **Loại database**: `BIGINT`
- **Thuộc tính riêng**:
  - `epoch`: Thời gian epoch

```typescript
interface UnixTimestampFieldOptions extends BaseColumnFieldOptions<'unixTimestamp'> {
  type: 'unixTimestamp';
  epoch?: number;  // Thời gian epoch
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

### Kiểu JSON

### `type: 'json'` - Field JSON

- **Mô tả**: Dùng để lưu dữ liệu định dạng JSON, hỗ trợ cấu trúc dữ liệu phức tạp
- **Loại database**: `JSON` hoặc `TEXT`
- **Ví dụ**:
```typescript
{
  type: 'json',
  name: 'metadata',
  title: 'Metadata',
  allowNull: true,
  defaultValue: {}
}
```

### `type: 'jsonb'` - Field JSONB

- **Mô tả**: Dùng để lưu dữ liệu định dạng JSONB (riêng PostgreSQL), hỗ trợ index và truy vấn
- **Loại database**: `JSONB` (PostgreSQL)
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

### Kiểu mảng

### `type: 'array'` - Field mảng

- **Mô tả**: Dùng để lưu dữ liệu mảng, hỗ trợ nhiều kiểu phần tử
- **Loại database**: `JSON` hoặc `ARRAY`
- **Thuộc tính riêng**:
  - `dataType`: Kiểu lưu trữ (json/array)
  - `elementType`: Kiểu phần tử (STRING/INTEGER/BOOLEAN/JSON)

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
  title: 'Tag',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### `type: 'set'` - Field set

- **Mô tả**: Dùng để lưu dữ liệu set, giống mảng nhưng có ràng buộc duy nhất
- **Loại database**: `JSON` hoặc `ARRAY`
- **Thuộc tính riêng**:
  - `dataType`: Kiểu lưu trữ (json/array)
  - `elementType`: Kiểu phần tử (STRING/INTEGER/BOOLEAN/JSON)

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
      title: 'Phân loại',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### Kiểu định danh

### `type: 'uuid'` - Field UUID

- **Mô tả**: Dùng để lưu định danh duy nhất định dạng UUID
- **Loại database**: `UUID` hoặc `VARCHAR(36)`
- **Thuộc tính riêng**:
  - `autoFill`: Tự động fill

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // Tự động fill
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

### `type: 'nanoid'` - Field Nanoid

- **Mô tả**: Dùng để lưu định danh duy nhất ngắn định dạng Nanoid
- **Loại database**: `VARCHAR`
- **Thuộc tính riêng**:
  - `size`: Độ dài ID
  - `customAlphabet`: Tập ký tự tùy chỉnh
  - `autoFill`: Tự động fill

```ts
interface NanoidFieldOptions extends BaseColumnFieldOptions<'nanoid'> {
  type: 'nanoid';
  size?: number;  // Độ dài ID
  customAlphabet?: string;  // Tập ký tự tùy chỉnh
  autoFill?: boolean;
}
```

**Ví dụ**:
```typescript
{
  type: 'nanoid',
  name: 'shortId',
  title: 'Short ID',
  size: 12,
  customAlphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  autoFill: true,
  allowNull: false,
  unique: true
}
```

### `type: 'uid'` - Field UID tùy chỉnh

- **Mô tả**: Dùng để lưu định danh duy nhất định dạng tùy chỉnh
- **Loại database**: `VARCHAR`
- **Thuộc tính riêng**:
  - `prefix`: Tiền tố
  - `pattern`: Mẫu validation

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // Tiền tố
  pattern?: string; // Mẫu validation
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

### `type: 'snowflakeId'` - Field Snowflake ID

- **Mô tả**: Dùng để lưu định danh duy nhất sinh bởi thuật toán Snowflake
- **Loại database**: `BIGINT`
- **Ví dụ**:
```typescript
{
  type: 'snowflakeId',
  name: 'snowflakeId',
  title: 'Snowflake ID',
  allowNull: false,
  unique: true
}
```

### Field chức năng

### `type: 'password'` - Field mật khẩu

- **Mô tả**: Dùng để lưu dữ liệu mật khẩu đã mã hóa
- **Loại database**: `VARCHAR`
- **Thuộc tính riêng**:
  - `length`: Độ dài hash
  - `randomBytesSize`: Kích thước byte ngẫu nhiên

```ts
interface PasswordFieldOptions extends BaseColumnFieldOptions<'password'> {
  type: 'password';
  length?: number;  // Độ dài hash
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

### `type: 'encryption'` - Field mã hóa

- **Mô tả**: Dùng để lưu dữ liệu nhạy cảm đã mã hóa
- **Loại database**: `VARCHAR`
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

### `type: 'virtual'` - Field ảo

- **Mô tả**: Dùng để lưu dữ liệu ảo được tính toán, không lưu trong database
- **Loại database**: Không (Field ảo)
- **Ví dụ**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: 'Họ và tên'
}
```

### `type: 'context'` - Field Context

- **Mô tả**: Dùng để đọc dữ liệu từ ngữ cảnh runtime (như thông tin user hiện tại)
- **Loại database**: Xác định bởi dataType
- **Thuộc tính riêng**:
  - `dataIndex`: Đường dẫn index dữ liệu
  - `dataType`: Kiểu dữ liệu
  - `createOnly`: Chỉ set khi tạo

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // Đường dẫn index dữ liệu
  dataType?: string;   // Kiểu dữ liệu
  createOnly?: boolean; // Chỉ set khi tạo
}
```

**Ví dụ**:
```typescript
{
  type: 'context',
  name: 'currentUserId',
  title: 'ID user hiện tại',
  dataIndex: 'user.id',
  dataType: 'integer',
  createOnly: true,
  allowNull: false
}
```

### Field quan hệ

### `type: 'belongsTo'` - Quan hệ thuộc về

- **Mô tả**: Biểu thị quan hệ nhiều-một, record hiện tại thuộc về một record khác
- **Loại database**: Field foreign key
- **Thuộc tính riêng**:
  - `target`: Tên bảng dữ liệu đích
  - `foreignKey`: Tên Field foreign key
  - `targetKey`: Tên Field key bảng đích
  - `onDelete`: Hành vi cascade khi xóa
  - `onUpdate`: Hành vi cascade khi cập nhật
  - `constraints`: Có bật ràng buộc foreign key hay không

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // Tên bảng dữ liệu đích
  foreignKey?: string;  // Tên Field foreign key
  targetKey?: string;   // Tên Field key bảng đích
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;  // Có bật ràng buộc foreign key hay không
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

### `type: 'hasOne'` - Quan hệ sở hữu một

- **Mô tả**: Biểu thị quan hệ một-một, record hiện tại sở hữu một record liên quan
- **Loại database**: Field foreign key
- **Thuộc tính riêng**:
  - `target`: Tên bảng dữ liệu đích
  - `foreignKey`: Tên Field foreign key
  - `sourceKey`: Tên Field key bảng nguồn
  - `onDelete`: Hành vi cascade khi xóa
  - `onUpdate`: Hành vi cascade khi cập nhật
  - `constraints`: Có bật ràng buộc foreign key hay không

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // Tên Field key bảng nguồn
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
  title: 'Hồ sơ user',
  target: 'user_profiles',
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasMany'` - Quan hệ sở hữu nhiều

- **Mô tả**: Biểu thị quan hệ một-nhiều, record hiện tại sở hữu nhiều record liên quan
- **Loại database**: Field foreign key
- **Thuộc tính riêng**:
  - `target`: Tên bảng dữ liệu đích
  - `foreignKey`: Tên Field foreign key
  - `sourceKey`: Tên Field key bảng nguồn
  - `sortBy`: Field sắp xếp
  - `sortable`: Có thể sắp xếp hay không
  - `onDelete`: Hành vi cascade khi xóa
  - `onUpdate`: Hành vi cascade khi cập nhật
  - `constraints`: Có bật ràng buộc foreign key hay không

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // Field sắp xếp
  sortable?: boolean; // Có thể sắp xếp hay không
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

### `type: 'belongsToMany'` - Quan hệ nhiều-nhiều

- **Mô tả**: Biểu thị quan hệ nhiều-nhiều, kết nối hai bảng dữ liệu thông qua bảng trung gian
- **Loại database**: Bảng trung gian
- **Thuộc tính riêng**:
  - `target`: Tên bảng dữ liệu đích
  - `through`: Tên bảng trung gian
  - `foreignKey`: Tên Field foreign key
  - `otherKey`: Foreign key của đầu kia bảng trung gian
  - `sourceKey`: Tên Field key bảng nguồn
  - `targetKey`: Tên Field key bảng đích
  - `onDelete`: Hành vi cascade khi xóa
  - `onUpdate`: Hành vi cascade khi cập nhật
  - `constraints`: Có bật ràng buộc foreign key hay không

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // Tên bảng trung gian
  foreignKey?: string;
  otherKey?: string;  // Foreign key của đầu kia bảng trung gian
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
  title: 'Tag',
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
