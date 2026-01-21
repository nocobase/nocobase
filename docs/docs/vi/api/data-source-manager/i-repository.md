:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# IRepository

Giao diện `Repository` định nghĩa một loạt các phương thức thao tác mô hình, được sử dụng để thích ứng với các hoạt động CRUD (Tạo, Đọc, Cập nhật, Xóa) của nguồn dữ liệu.

## API 

### find()

Trả về một danh sách các mô hình phù hợp với các tham số truy vấn.

#### Chữ ký

- `find(options?: any): Promise<IModel[]>`

### findOne()

Trả về một mô hình phù hợp với các tham số truy vấn. Nếu có nhiều mô hình phù hợp, chỉ trả về mô hình đầu tiên.

#### Chữ ký 

- `findOne(options?: any): Promise<IModel>`


### count()

Trả về số lượng mô hình phù hợp với các tham số truy vấn.

#### Chữ ký

- `count(options?: any): Promise<Number>`

### findAndCount()

Trả về danh sách và số lượng mô hình phù hợp với các tham số truy vấn.

#### Chữ ký

- `findAndCount(options?: any): Promise<[IModel[], Number]>`

### create()

Tạo một đối tượng dữ liệu mô hình.

#### Chữ ký

- `create(options: any): void`

### update()

Cập nhật một đối tượng dữ liệu mô hình dựa trên các điều kiện truy vấn.

#### Chữ ký

- `update(options: any): void`

### destroy()

Xóa một đối tượng dữ liệu mô hình dựa trên các điều kiện truy vấn.

#### Chữ ký

- `destroy(options: any): void`