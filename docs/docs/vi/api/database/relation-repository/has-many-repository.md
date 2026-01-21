:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# HasManyRepository

`HasManyRepository` là một `Relation Repository` được dùng để xử lý các mối quan hệ `HasMany`.

## Phương thức của lớp

### `find()`

Tìm các đối tượng liên quan

**Chữ ký phương thức**

- `async find(options?: FindOptions): Promise<M[]>`

**Chi tiết**

Các tham số truy vấn tương tự như [`Repository.find()`](../repository.md#find).

### `findOne()`

Tìm một đối tượng liên quan, chỉ trả về một bản ghi

**Chữ ký phương thức**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Trả về số lượng bản ghi phù hợp với điều kiện truy vấn

**Chữ ký phương thức**

- `async count(options?: CountOptions)`

**Kiểu dữ liệu**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

### `findAndCount()`

Truy vấn cơ sở dữ liệu để lấy một tập dữ liệu và số lượng kết quả phù hợp với các điều kiện cụ thể.

**Chữ ký phương thức**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Kiểu dữ liệu**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Tạo các đối tượng liên quan

**Chữ ký phương thức**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Cập nhật các đối tượng liên quan phù hợp với điều kiện

**Chữ ký phương thức**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Xóa các đối tượng liên quan phù hợp với điều kiện

**Chữ ký phương thức**

- `async destroy(options?: TK | DestroyOptions): Promise<M>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Thêm mối quan hệ liên kết đối tượng

**Chữ ký phương thức**

- `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Kiểu dữ liệu**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

**Chi tiết**

- `tk` - Giá trị `targetKey` của đối tượng liên quan, có thể là một giá trị đơn hoặc một mảng.
  <embed src="../shared/transaction.md"></embed>

### `remove()`

Xóa mối quan hệ liên kết với các đối tượng đã cho

**Chữ ký phương thức**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Chi tiết**

Các tham số tương tự như phương thức [`add()`](#add).

### `set()`

Thiết lập các đối tượng liên quan cho mối quan hệ hiện tại

**Chữ ký phương thức**

- `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Chi tiết**

Các tham số tương tự như phương thức [`add()`](#add).