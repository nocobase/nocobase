---
title: "DataSourceManager"
description: "API trình quản lý nguồn dữ liệu của NocoBase: quản lý nhiều instance DataSource, lớp trừu tượng DataSource."
keywords: "DataSourceManager,DataSource,nhiều nguồn dữ liệu,quản lý nguồn dữ liệu,NocoBase"
---

# DataSourceManager

`DataSourceManager` là lớp quản lý nhiều instance `dataSource`.

## API

### add()
Thêm một instance `dataSource`.

#### Chữ ký

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### use()

Thêm middleware toàn cục cho instance `dataSource`.

### middleware()

Lấy middleware của instance `dataSourceManager` hiện tại, có thể dùng để xử lý HTTP request.

### afterAddDataSource()

Hàm hook sau khi thêm `dataSource` mới.

#### Chữ ký

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### registerDataSourceType()

Đăng ký kiểu nguồn dữ liệu và lớp tương ứng.

#### Chữ ký

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### getDataSourceType()

Lấy lớp nguồn dữ liệu.

#### Chữ ký

- `getDataSourceType(type: string): typeof DataSource`

### buildDataSourceByType()

Tạo instance nguồn dữ liệu theo kiểu nguồn dữ liệu đã đăng ký và tham số instance.

#### Chữ ký

- `buildDataSourceByType(type: string, options: any): DataSource`
