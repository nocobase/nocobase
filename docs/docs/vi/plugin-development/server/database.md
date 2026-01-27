:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Database

`Database` là một thành phần quan trọng của các nguồn dữ liệu (`DataSource`) thuộc loại cơ sở dữ liệu. Mỗi nguồn dữ liệu loại cơ sở dữ liệu sẽ có một thể hiện `Database` tương ứng, có thể truy cập thông qua `dataSource.db`. Thể hiện cơ sở dữ liệu của nguồn dữ liệu chính cũng cung cấp bí danh tiện lợi `app.db`. Việc làm quen với các phương thức phổ biến của `db` là nền tảng để viết các plugin phía máy chủ.

## Các Thành Phần của Database

Một `Database` điển hình bao gồm các phần sau:

- **Bộ sưu tập**: Định nghĩa cấu trúc bảng dữ liệu.
- **Model**: Tương ứng với các model của ORM (thường được quản lý bởi Sequelize).
- **Repository**: Lớp kho lưu trữ đóng gói logic truy cập dữ liệu, cung cấp các phương thức thao tác cấp cao hơn.
- **FieldType**: Các kiểu trường.
- **FilterOperator**: Các toán tử dùng để lọc.
- **Event**: Các sự kiện vòng đời và sự kiện cơ sở dữ liệu.

## Thời Điểm Sử Dụng trong Plugin

### Những việc nên làm trong giai đoạn beforeLoad

Ở giai đoạn này, không được phép thực hiện các thao tác cơ sở dữ liệu. Nó phù hợp để đăng ký các lớp tĩnh hoặc lắng nghe sự kiện.

- `db.registerFieldTypes()` — Các kiểu trường tùy chỉnh
- `db.registerModels()` — Đăng ký các lớp model tùy chỉnh
- `db.registerRepositories()` — Đăng ký các lớp repository tùy chỉnh
- `db.registerOperators()` — Đăng ký các toán tử lọc tùy chỉnh
- `db.on()` — Lắng nghe các sự kiện liên quan đến cơ sở dữ liệu

### Những việc nên làm trong giai đoạn load

Ở giai đoạn này, tất cả các định nghĩa lớp và sự kiện đã được tải trước đó, vì vậy việc tải các bảng dữ liệu sẽ không bị thiếu hoặc bỏ sót.

- `db.defineCollection()` — Định nghĩa các bảng dữ liệu mới
- `db.extendCollection()` — Mở rộng cấu hình bảng dữ liệu hiện có

Nếu dùng để định nghĩa các bảng tích hợp của plugin, bạn nên đặt chúng trong thư mục `./src/server/collections`. Xem chi tiết tại [Bộ sưu tập](./collections.md).

## Thao Tác Dữ Liệu

`Database` cung cấp hai cách chính để truy cập và thao tác dữ liệu:

### Thao tác thông qua Repository

```ts
const repo = db.getRepository('users');
const user = await repo.findOne({ filter: { id: 1 } });
```

Lớp Repository thường được dùng để đóng gói logic nghiệp vụ, ví dụ như phân trang, lọc, kiểm tra quyền, v.v.

### Thao tác thông qua Model

```ts
const UserModel = db.getModel('users');
const user = await UserModel.findByPk(1);
```

Lớp Model tương ứng trực tiếp với các thực thể ORM, phù hợp để thực hiện các thao tác cơ sở dữ liệu cấp thấp hơn.

## Những Giai Đoạn Nào Có Thể Thực Hiện Thao Tác Cơ Sở Dữ Liệu?

### Vòng đời Plugin

| Giai đoạn | Cho phép thao tác cơ sở dữ liệu |
|------|----------------|
| `staticImport` | Không |
| `afterAdd` | Không |
| `beforeLoad` | Không |
| `load` | Không |
| `install` | Có |
| `beforeEnable` | Có |
| `afterEnable` | Có |
| `beforeDisable` | Có |
| `afterDisable` | Có |
| `remove` | Có |
| `handleSyncMessage` | Có |

### Sự kiện App

| Giai đoạn | Cho phép thao tác cơ sở dữ liệu |
|------|----------------|
| `beforeLoad` | Không |
| `afterLoad` | Không |
| `beforeStart` | Có |
| `afterStart` | Có |
| `beforeInstall` | Không |
| `afterInstall` | Có |
| `beforeStop` | Có |
| `afterStop` | Không |
| `beforeDestroy` | Có |
| `afterDestroy` | Không |
| `beforeLoadPlugin` | Không |
| `afterLoadPlugin` | Không |
| `beforeEnablePlugin` | Có |
| `afterEnablePlugin` | Có |
| `beforeDisablePlugin` | Có |
| `afterDisablePlugin` | Có |
| `afterUpgrade` | Có |

### Sự kiện/Hook của Database

| Giai đoạn | Cho phép thao tác cơ sở dữ liệu |
|------|----------------|
| `beforeSync` | Không |
| `afterSync` | Có |
| `beforeValidate` | Có |
| `afterValidate` | Có |
| `beforeCreate` | Có |
| `afterCreate` | Có |
| `beforeUpdate` | Có |
| `afterUpdate` | Có |
| `beforeSave` | Có |
| `afterSave` | Có |
| `beforeDestroy` | Có |
| `afterDestroy` | Có |
| `afterCreateWithAssociations` | Có |
| `afterUpdateWithAssociations` | Có |
| `afterSaveWithAssociations` | Có |
| `beforeDefineCollection` | Không |
| `afterDefineCollection` | Không |
| `beforeRemoveCollection` | Không |
| `afterRemoveCollection` | Không |