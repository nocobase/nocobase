:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# BelongsToManyRepository

`BelongsToManyRepository` là một `Relation Repository` dùng để xử lý các quan hệ `BelongsToMany`.

Không giống như các loại quan hệ khác, quan hệ kiểu `BelongsToMany` cần được ghi lại thông qua một bảng trung gian.
Khi định nghĩa quan hệ liên kết trong NocoBase, bạn có thể tự động tạo bảng trung gian hoặc chỉ định rõ ràng bảng trung gian đó.

## Các phương thức của lớp

### `find()`

Tìm các đối tượng liên kết

**Chữ ký**

- `async find(options?: FindOptions): Promise<M[]>`

**Chi tiết**

Các tham số truy vấn nhất quán với [`Repository.find()`](../repository.md#find).

### `findOne()`

Tìm một đối tượng liên kết, chỉ trả về một bản ghi

**Chữ ký**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Trả về số lượng bản ghi phù hợp với điều kiện truy vấn

**Chữ ký**

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

Truy vấn cơ sở dữ liệu để lấy tập dữ liệu và tổng số kết quả theo các điều kiện cụ thể.

**Chữ ký**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Kiểu dữ liệu**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Tạo đối tượng liên kết

**Chữ ký**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Cập nhật các đối tượng liên kết phù hợp với điều kiện

**Chữ ký**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Xóa các đối tượng liên kết phù hợp với điều kiện

**Chữ ký**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Thêm các đối tượng liên kết mới

**Chữ ký**

- `async add(
options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions
): Promise<void>`

**Kiểu dữ liệu**

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

**Chi tiết**

Bạn có thể truyền trực tiếp `targetKey` của đối tượng liên kết, hoặc truyền `targetKey` cùng với các giá trị trường của bảng trung gian.

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

// Truyền các trường của bảng trung gian
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

Thiết lập các đối tượng liên kết

**Chữ ký**

- async set(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void>

**Chi tiết**

Các tham số tương tự như [add()](#add)

### `remove()`

Xóa bỏ quan hệ liên kết với các đối tượng đã cho

**Chữ ký**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Kiểu dữ liệu**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

Chuyển đổi đối tượng liên kết.

Trong một số tình huống nghiệp vụ, việc chuyển đổi các đối tượng liên kết thường xuyên cần thiết. Ví dụ, người dùng có thể thêm sản phẩm vào mục yêu thích, hủy yêu thích, hoặc thêm lại. Phương thức `toggle` giúp bạn nhanh chóng triển khai các chức năng tương tự.

**Chữ ký**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**Chi tiết**

Phương thức `toggle` sẽ tự động kiểm tra xem đối tượng liên kết đã tồn tại hay chưa. Nếu đã tồn tại, nó sẽ xóa bỏ; nếu chưa tồn tại, nó sẽ thêm vào.