:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# DataSourceManager

`DataSourceManager` là lớp quản lý cho nhiều thể hiện (instance) của `dataSource`.

## API

### add()
Thêm một thể hiện `dataSource`.

#### Chữ ký

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### use()

Thêm middleware toàn cục vào thể hiện `dataSource`.

### middleware()

Lấy middleware của thể hiện `dataSourceManager` hiện tại, có thể dùng để phản hồi các yêu cầu HTTP.

### afterAddDataSource()

Một hàm hook được gọi sau khi một `dataSource` mới được thêm vào.

#### Chữ ký

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### registerDataSourceType()

Đăng ký một loại nguồn dữ liệu và lớp của nó.

#### Chữ ký

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### getDataSourceType()

Lấy lớp nguồn dữ liệu.

#### Chữ ký

- `getDataSourceType(type: string): typeof DataSource`

### buildDataSourceByType()

Tạo một thể hiện nguồn dữ liệu dựa trên loại nguồn dữ liệu đã đăng ký và các tùy chọn của thể hiện.

#### Chữ ký

- `buildDataSourceByType(type: string, options: any): DataSource`