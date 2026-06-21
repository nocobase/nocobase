---
title: "DataSourceManager - Quản lý nguồn dữ liệu"
description: "Quản lý nguồn dữ liệu phía server NocoBase: app.dataSourceManager, đa nguồn dữ liệu, addDataSource, getDataSource."
keywords: "DataSourceManager,Quản lý nguồn dữ liệu,Đa nguồn dữ liệu,addDataSource,getDataSource,NocoBase"
---

# DataSourceManager - Quản lý nguồn dữ liệu

NocoBase cung cấp `DataSourceManager`, dùng để quản lý nhiều nguồn dữ liệu. Mỗi `DataSource` đều có instance `Database`, `ResourceManager` và `ACL` riêng, bạn có thể quản lý và mở rộng các nguồn dữ liệu khác nhau một cách linh hoạt.

## Khái niệm cơ bản

Mỗi instance `DataSource` chứa các nội dung sau:

- **`dataSource.collectionManager`**: Dùng để quản lý bảng dữ liệu và Field.
- **`dataSource.resourceManager`**: Xử lý các thao tác liên quan đến resource (như CRUD, v.v.).
- **`dataSource.acl`**: Kiểm soát truy cập (ACL) cho thao tác resource.

Để tiện truy cập, NocoBase cung cấp các bí danh tắt cho các thành viên liên quan của nguồn dữ liệu chính:

- `app.db` tương đương với `dataSourceManager.get('main').collectionManager.db`
- `app.acl` tương đương với `dataSourceManager.get('main').acl`
- `app.resourceManager` tương đương với `dataSourceManager.get('main').resourceManager`

## Phương thức phổ biến

### dataSourceManager.get(dataSourceKey)

Trả về instance `DataSource` đã chỉ định.

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

Đăng ký middleware cho tất cả nguồn dữ liệu, sẽ ảnh hưởng đến thao tác của tất cả nguồn dữ liệu.

```ts
dataSourceManager.use(async (ctx, next) => {
  console.log('Middleware này có hiệu lực với tất cả nguồn dữ liệu');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

Thực thi trước khi nguồn dữ liệu được tải. Thường được dùng để đăng ký lớp tĩnh, ví dụ đăng ký lớp model, kiểu Field:

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // Đăng ký kiểu Field tùy chỉnh
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

Thực thi sau khi nguồn dữ liệu được tải. Thường được dùng để đăng ký thao tác, đặt kiểm soát truy cập, v.v.

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // Người dùng đã đăng nhập là có thể truy cập
});
```

## Mở rộng nguồn dữ liệu

Cách mở rộng nguồn dữ liệu đầy đủ vui lòng tham khảo chương Mở rộng nguồn dữ liệu.

## Liên kết liên quan

- [Database](./database.md) — CRUD, Repository, transaction và sự kiện database
- [Collections](./collections.md) — Định nghĩa hoặc mở rộng cấu trúc bảng dữ liệu bằng code
- [ResourceManager](./resource-manager.md) — Đăng ký interface tùy chỉnh và thao tác resource
- [ACL](./acl.md) — Quyền role, đoạn quyền và kiểm soát truy cập
- [Plugin](./plugin.md) — Vòng đời lớp Plugin, phương thức thành viên và đối tượng `app`
