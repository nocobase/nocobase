---
title: "DataSource (abstract)"
description: "Lớp trừu tượng DataSource của NocoBase: đại diện cho một loại nguồn dữ liệu (cơ sở dữ liệu, API,...), là container của Collection và Repository."
keywords: "DataSource,lớp trừu tượng,loại nguồn dữ liệu,Collection,container Repository,NocoBase"
---

# DataSource (abstract)

Lớp trừu tượng `DataSource`, dùng để đại diện cho một loại nguồn dữ liệu, có thể là cơ sở dữ liệu, API, v.v.

## Thành viên

### collectionManager

Instance CollectionManager của nguồn dữ liệu, cần triển khai interface [`ICollectionManager`](/api/data-source-manager/i-collection-manager).

### resourceManager

Instance resourceManager của nguồn dữ liệu.

### acl

Instance ACL của nguồn dữ liệu.

## API

### constructor()

Constructor, tạo một instance `DataSource`.

#### Chữ ký

- `constructor(options: DataSourceOptions)`

### init() 

Hàm khởi tạo, được gọi ngay sau `constructor`.

#### Chữ ký

- `init(options: DataSourceOptions)`


### name

#### Chữ ký

- `get name()`

Tên instance của nguồn dữ liệu.

### middleware()

Lấy middleware của DataSource, dùng để mount vào Server để nhận request.

### testConnection()

Phương thức tĩnh, được gọi khi thực hiện thao tác kiểm tra kết nối, có thể dùng để kiểm tra tham số, logic cụ thể do lớp con triển khai.

#### Chữ ký

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### Chữ ký

- `async load(options: any = {})`

Thao tác load nguồn dữ liệu, logic do lớp con triển khai.

### createCollectionManager()

#### Chữ ký
- `abstract createCollectionManager(options?: any): ICollectionManager`

Tạo instance CollectionManager của nguồn dữ liệu, logic do lớp con triển khai.

### createResourceManager()

Tạo instance ResourceManager của nguồn dữ liệu, lớp con có thể override để triển khai, mặc định tạo `ResourceManager` từ `@nocobase/resourcer`.

### createACL()

- Tạo instance ACL của DataSource, lớp con có thể override để triển khai, mặc định tạo `ACL` từ `@nocobase/acl`.

