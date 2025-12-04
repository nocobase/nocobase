:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# RelationRepository

`RelationRepository` là một đối tượng `Repository` dành cho các kiểu quan hệ. `RelationRepository` cho phép bạn thao tác với dữ liệu liên quan mà không cần tải toàn bộ mối quan hệ. Dựa trên `RelationRepository`, mỗi kiểu quan hệ sẽ có một triển khai phái sinh tương ứng, bao gồm:

- [`HasOneRepository`](#has-one-repository)
- `HasManyRepository`
- `BelongsToRepository`
- `BelongsToManyRepository`

## Hàm khởi tạo

**Chữ ký**

- `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**Tham số**

| Tên tham số        | Kiểu               | Giá trị mặc định | Mô tả                                                                   |
| :----------------- | :----------------- | :--------------- | :---------------------------------------------------------------------- |
| `sourceCollection` | `Collection`       | -                | Đối tượng `bộ sưu tập` tương ứng với quan hệ tham chiếu trong mối quan hệ |
| `association`      | `string`           | -                | Tên mối quan hệ                                                         |
| `sourceKeyValue`   | `string \| number` | -                | Giá trị khóa tương ứng trong quan hệ tham chiếu                         |

## Thuộc tính của lớp cơ sở

### `db: Database`

Đối tượng cơ sở dữ liệu

### `sourceCollection`

Đối tượng `bộ sưu tập` tương ứng với quan hệ tham chiếu trong mối quan hệ

### `targetCollection`

Đối tượng `bộ sưu tập` tương ứng với quan hệ được tham chiếu trong mối quan hệ

### `association`

Đối tượng mối quan hệ trong Sequelize tương ứng với mối quan hệ hiện tại

### `associationField`

Trường trong `bộ sưu tập` tương ứng với mối quan hệ hiện tại

### `sourceKeyValue`

Giá trị khóa tương ứng trong quan hệ tham chiếu