---
title: "BelongsToManyRepository"
description: "Repository quan hệ BelongsToMany của NocoBase: xử lý CRUD cho quan hệ nhiều-nhiều."
keywords: "BelongsToManyRepository,BelongsToMany,nhiều-nhiều,Repository,NocoBase"
---

# BelongsToManyRepository

`BelongsToManyRepository` là `Relation Repository` dùng để xử lý quan hệ `BelongsToMany`.

Khác với các loại quan hệ khác, quan hệ kiểu `BelongsToMany` cần thông qua bảng trung gian để lưu trữ.
Khi định nghĩa quan hệ trong NocoBase, có thể tự động tạo bảng trung gian, hoặc chỉ định rõ bảng trung gian.

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

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Thêm đối tượng quan hệ mới.

**Chữ ký**

- `async add(
options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions
): Promise<void>`

**Kiểu**

```typescript
type PrimaryKeyWithThroughValues = [TargetKey, Values];

interface AssociatedOptions extends Transactionable {
  tk?:
    | TargetKey
    | TargetKey[]
    | PrimaryKeyWithThroughValues
    | PrimaryKeyWithThroughValues[];
}
```

**Thông tin chi tiết**

Có thể truyền trực tiếp `targetKey` của đối tượng quan hệ, hoặc truyền `targetKey` cùng với giá trị field của bảng trung gian.

**Ví dụ**

```typescript
const t1 = await Tag.repository.create({
  values: { name: 't1' },
});

const t2 = await Tag.repository.create({
  values: { name: 't2' },
});

const p1 = await Post.repository.create({
  values: { title: 'p1' },
});

const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

// Truyền targetKey
PostTagRepository.add([t1.id, t2.id]);

// Truyền field bảng trung gian
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

Đặt đối tượng quan hệ.

**Chữ ký**

- async set(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void>

**Thông tin chi tiết**

Tham số giống [add()](#add).

### `remove()`

Gỡ bỏ quan hệ với đối tượng cho trước.

**Chữ ký**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Kiểu**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

Bật/tắt đối tượng quan hệ.

Trong một số tình huống nghiệp vụ, thường cần bật/tắt đối tượng quan hệ, ví dụ user yêu thích sản phẩm, user có thể bỏ yêu thích, cũng có thể thêm yêu thích lại. Dùng phương thức `toggle` có thể nhanh chóng triển khai chức năng này.

**Chữ ký**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**Thông tin chi tiết**

Phương thức `toggle` sẽ tự động kiểm tra đối tượng quan hệ có tồn tại hay không, nếu tồn tại thì gỡ, nếu không tồn tại thì thêm.
