:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# DataSourceManager Quản lý nguồn dữ liệu

NocoBase cung cấp `DataSourceManager` để quản lý nhiều nguồn dữ liệu. Mỗi `DataSource` có các thể hiện (instance) `Database`, `ResourceManager` và `ACL` riêng, giúp nhà phát triển dễ dàng quản lý và mở rộng nhiều nguồn dữ liệu một cách linh hoạt.

## Khái niệm cơ bản

Mỗi thể hiện `DataSource` bao gồm các thành phần sau:

- **`dataSource.collectionManager`**: Dùng để quản lý các bộ sưu tập và trường dữ liệu.
- **`dataSource.resourceManager`**: Xử lý các thao tác liên quan đến tài nguyên (ví dụ: thêm, sửa, xóa, truy vấn, v.v.).
- **`dataSource.acl`**: Kiểm soát truy cập (ACL) cho các thao tác trên tài nguyên.

Để truy cập thuận tiện, các bí danh (alias) được cung cấp cho các thành phần của nguồn dữ liệu chính:

- `app.db` tương đương với `dataSourceManager.get('main').collectionManager.db`
- `app.acl` tương đương với `dataSourceManager.get('main').acl`
- `app.resourceManager` tương đương với `dataSourceManager.get('main').resourceManager`

## Các phương thức phổ biến

### dataSourceManager.get(dataSourceKey)

Phương thức này trả về thể hiện `DataSource` được chỉ định.

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

Đăng ký middleware cho tất cả các nguồn dữ liệu. Điều này sẽ ảnh hưởng đến các thao tác trên tất cả các nguồn dữ liệu.

```ts
dataSourceManager.use((ctx, next) => {
  console.log('This middleware applies to all data sources.');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

Thực thi trước khi nguồn dữ liệu được tải. Thường được sử dụng để đăng ký các lớp tĩnh, chẳng hạn như lớp mô hình và đăng ký loại trường:

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // Loại trường tùy chỉnh
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

Thực thi sau khi nguồn dữ liệu được tải. Thường được sử dụng để đăng ký các thao tác, thiết lập kiểm soát truy cập, v.v.

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // Thiết lập quyền truy cập
});
```

## Mở rộng nguồn dữ liệu

Để biết thêm chi tiết về cách mở rộng nguồn dữ liệu, vui lòng tham khảo chương mở rộng nguồn dữ liệu.