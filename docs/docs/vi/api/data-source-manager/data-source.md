:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# DataSource (trừu tượng)

`DataSource` là một lớp trừu tượng, được dùng để biểu diễn một loại **nguồn dữ liệu**, có thể là cơ sở dữ liệu, API, v.v.

## Thành viên

### collectionManager

Phiên bản CollectionManager của **nguồn dữ liệu**, cần triển khai giao diện [`ICollectionManager`](/api/data-source-manager/i-collection-manager).

### resourceManager

Phiên bản resourceManager của **nguồn dữ liệu**.

### acl

Phiên bản ACL của **nguồn dữ liệu**.

## API

### constructor()

Hàm khởi tạo, tạo một phiên bản `DataSource`.

#### Chữ ký

- `constructor(options: DataSourceOptions)`

### init()

Hàm khởi tạo ban đầu, được gọi ngay sau `constructor`.

#### Chữ ký

- `init(options: DataSourceOptions)`

### name

#### Chữ ký

- `get name()`

Trả về tên phiên bản của **nguồn dữ liệu**.

### middleware()

Lấy middleware cho `DataSource`, được dùng để gắn vào Server nhằm nhận các yêu cầu.

### testConnection()

Một phương thức tĩnh được gọi trong quá trình kiểm tra kết nối. Nó có thể được dùng để xác thực tham số, và logic cụ thể sẽ được triển khai bởi lớp con.

#### Chữ ký

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### Chữ ký

- `async load(options: any = {})`

Thao tác tải của **nguồn dữ liệu**. Logic sẽ được triển khai bởi lớp con.

### createCollectionManager()

#### Chữ ký
- `abstract createCollectionManager(options?: any): ICollectionManager`

Tạo một phiên bản CollectionManager cho **nguồn dữ liệu**. Logic sẽ được triển khai bởi lớp con.

### createResourceManager()

Tạo một phiên bản ResourceManager cho **nguồn dữ liệu**. Các lớp con có thể ghi đè việc triển khai. Mặc định, nó sẽ tạo `ResourceManager` từ `@nocobase/resourcer`.

### createACL()

- Tạo một phiên bản ACL cho `DataSource`. Các lớp con có thể ghi đè việc triển khai. Mặc định, nó sẽ tạo `ACL` từ `@nocobase/acl`.