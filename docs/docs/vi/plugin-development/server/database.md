---
title: "Database"
description: "Database NocoBase: Collection, Model, Repository, FieldType, FilterOperator, dataSource.db, app.db."
keywords: "Database,Collection,Model,Repository,Sequelize,dataSource.db,NocoBase"
---

# Database

`Database` là thành phần cốt lõi của nguồn dữ liệu kiểu database (`DataSource`). Mỗi nguồn dữ liệu kiểu database đều có một instance `Database` tương ứng, có thể truy cập qua `dataSource.db`. Instance database của nguồn dữ liệu chính còn có alias tiện lợi là `app.db`. Làm quen với các phương thức thường dùng của `db` là nền tảng để viết Plugin server.

## Các thành phần của Database

Một `Database` điển hình bao gồm các phần sau:

- **Collection**: Định nghĩa cấu trúc bảng dữ liệu.
- **Model**: Tương ứng với model của ORM (thường được Sequelize quản lý).
- **Repository**: Tầng repository đóng gói logic truy cập dữ liệu, cung cấp các phương thức thao tác cấp cao hơn.
- **FieldType**: Kiểu Field.
- **FilterOperator**: Toán tử dùng cho filter.
- **Event**: Sự kiện vòng đời và sự kiện database.

## Thời điểm sử dụng trong Plugin

### Việc nên làm trong giai đoạn beforeLoad

Giai đoạn này chưa thể thao tác database, phù hợp để đăng ký lớp tĩnh hoặc lắng nghe event.

- `db.registerFieldTypes()` — Đăng ký kiểu Field tùy chỉnh
- `db.registerModels()` — Đăng ký lớp Model tùy chỉnh
- `db.registerRepositories()` — Đăng ký lớp Repository tùy chỉnh
- `db.registerOperators()` — Đăng ký toán tử filter tùy chỉnh
- `db.on()` — Lắng nghe các sự kiện liên quan đến database

### Việc nên làm trong giai đoạn load

Giai đoạn này tất cả các định nghĩa lớp và sự kiện đầu vào đã được load xong, lúc này load bảng dữ liệu sẽ không bị thiếu hoặc sót.

- `db.defineCollection()` — Định nghĩa bảng dữ liệu mới
- `db.extendCollection()` — Mở rộng cấu hình bảng dữ liệu hiện có

Tuy nhiên nếu định nghĩa bảng tích hợp sẵn của Plugin, khuyến khích đặt trong thư mục `./src/server/collections` hơn, xem chi tiết tại [Collections](./collections.md).

## Thao tác dữ liệu

`Database` cung cấp hai cách chính để truy cập và thao tác dữ liệu:

### Thao tác qua Repository

```ts
const repo = db.getRepository('users');
const user = await repo.findOne({ filter: { id: 1 } });
```

Tầng Repository thường dùng để đóng gói logic nghiệp vụ như phân trang, filter, kiểm tra quyền, v.v.

### Thao tác qua Model

```ts
const UserModel = db.getModel('users');
const user = await UserModel.findByPk(1);
```

Tầng Model trực tiếp tương ứng với entity ORM, phù hợp để thực hiện các thao tác database ở mức thấp hơn.

## Các giai đoạn nào có thể thao tác database?

### Vòng đời Plugin

| Giai đoạn | Có thể thao tác database |
|-----------|--------------------------|
| `staticImport` | No |
| `afterAdd` | No |
| `beforeLoad` | No |
| `load` | No |
| `install` | Yes |
| `beforeEnable` | Yes |
| `afterEnable` | Yes |
| `beforeDisable` | Yes |
| `afterDisable` | Yes |
| `remove` | Yes |
| `handleSyncMessage` | Yes |

### Sự kiện App

| Giai đoạn | Có thể thao tác database |
|-----------|--------------------------|
| `beforeLoad` | No |
| `afterLoad` | No |
| `beforeStart` | Yes |
| `afterStart` | Yes |
| `beforeInstall` | No |
| `afterInstall` | Yes |
| `beforeStop` | Yes |
| `afterStop` | No |
| `beforeDestroy` | Yes |
| `afterDestroy` | No |
| `beforeLoadPlugin` | No |
| `afterLoadPlugin` | No |
| `beforeEnablePlugin` | Yes |
| `afterEnablePlugin` | Yes |
| `beforeDisablePlugin` | Yes |
| `afterDisablePlugin` | Yes |
| `afterUpgrade` | Yes |

### Sự kiện/Hook Database

| Giai đoạn | Có thể thao tác database |
|-----------|--------------------------|
| `beforeSync` | No |
| `afterSync` | Yes |
| `beforeValidate` | Yes |
| `afterValidate` | Yes |
| `beforeCreate` | Yes |
| `afterCreate` | Yes |
| `beforeUpdate` | Yes |
| `afterUpdate` | Yes |
| `beforeSave` | Yes |
| `afterSave` | Yes |
| `beforeDestroy` | Yes |
| `afterDestroy` | Yes |
| `afterCreateWithAssociations` | Yes |
| `afterUpdateWithAssociations` | Yes |
| `afterSaveWithAssociations` | Yes |
| `beforeDefineCollection` | No |
| `afterDefineCollection` | No |
| `beforeRemoveCollection` | No |
| `afterRemoveCollection` | No |

## Liên kết liên quan

- [Collections](./collections.md) — Định nghĩa hoặc mở rộng cấu trúc bảng dữ liệu bằng code
- [DataSourceManager](./data-source-manager.md) — Quản lý nhiều nguồn dữ liệu và instance database của chúng
- [Context (Ngữ cảnh request)](./context.md) — Lấy instance `db` trong request
- [Plugin](./plugin.md) — Vòng đời lớp Plugin, các phương thức thành viên và đối tượng `app`
- [Event](./event.md) — Lắng nghe và xử lý sự kiện cấp ứng dụng và database
