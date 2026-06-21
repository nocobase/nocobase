---
title: "HasManyRepository"
description: "Repository quan hệ HasMany của NocoBase: xử lý CRUD cho quan hệ một-nhiều."
keywords: "HasManyRepository,HasMany,một-nhiều,Repository,NocoBase"
---

# HasManyRepository

`HasManyRepository` là `Relation Repository` dùng để xử lý quan hệ `HasMany`.

## Phương thức của lớp

### `find()`

Tìm các đối tượng quan hệ.

**Chữ ký**

- `async find(options?: FindOptions): Promise<M[]>`

**Thông tin chi tiết**

Tham số truy vấn giống [`Repository.find()`](../repository.md#find).

### `findOne()`

Tìm đối tượng quan hệ, chỉ trả về một bản ghi.

**Chữ ký**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Trả về số lượng bản ghi thỏa mãn điều kiện truy vấn.

**Chữ ký**

- `async count(options?: CountOptions)`

**Kiểu**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

### `findAndCount()`

Truy vấn từ cơ sở dữ liệu tập dữ liệu thỏa mãn điều kiện cụ thể và số lượng kết quả.

**Chữ ký**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Kiểu**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Tạo đối tượng quan hệ.

**Chữ ký**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Cập nhật các đối tượng quan hệ thỏa mãn điều kiện.

**Chữ ký**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Xóa các đối tượng quan hệ thỏa mãn điều kiện.

**Chữ ký**

- `async destroy(options?: TK | DestroyOptions): Promise<M>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Thêm quan hệ giữa các đối tượng.

**Chữ ký**

- `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Kiểu**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

**Thông tin chi tiết**

- `tk` - Giá trị targetKey của đối tượng quan hệ, có thể là giá trị đơn lẻ hoặc mảng.
  <embed src="../shared/transaction.md"></embed>

### `remove()`

Gỡ bỏ quan hệ với đối tượng cho trước.

**Chữ ký**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Thông tin chi tiết**

Tham số giống phương thức [`add()`](#add).

### `set()`

Đặt đối tượng quan hệ của quan hệ hiện tại.

**Chữ ký**

- `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Thông tin chi tiết**

Tham số giống phương thức [`add()`](#add).
