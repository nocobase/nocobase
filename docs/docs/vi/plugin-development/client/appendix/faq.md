---
title: "FAQ & Hướng dẫn xử lý lỗi"
description: "Các vấn đề thường gặp khi phát triển Plugin client NocoBase: Plugin không hiển thị, Block không xuất hiện, dịch không hiệu lực, không tìm thấy route, hot reload không hoạt động, lỗi build/đóng gói, khởi động thất bại sau khi deploy."
keywords: "FAQ,Vấn đề thường gặp,Hướng dẫn xử lý lỗi,Troubleshooting,NocoBase,Build,Deploy,tar,axios"
---

# FAQ & Hướng dẫn xử lý lỗi

Đây là tổng hợp những "cái bẫy" dễ gặp khi phát triển Plugin client. Nếu bạn gặp tình huống "rõ ràng đã viết đúng nhưng không hoạt động", có thể tìm ở đây trước.

## Liên quan đến Plugin

### Sau khi tạo Plugin không thấy trong trình quản lý

Xác nhận đã thực thi `yarn pm create` thay vì tạo thư mục thủ công. `yarn pm create` ngoài việc sinh tệp, còn đăng ký Plugin vào bảng `applicationPlugins` của database. Nếu đã tạo thư mục thủ công, có thể thực thi `yarn nocobase upgrade` để quét lại.

### Sau khi bật Plugin trang không thay đổi

Kiểm tra theo thứ tự sau:

1. Xác nhận đã thực thi `yarn pm enable <pluginName>`
2. Làm mới trình duyệt (đôi khi cần làm mới cứng `Ctrl+Shift+R`)
3. Kiểm tra console của trình duyệt có lỗi không

### Sau khi sửa code trang không cập nhật

Các loại tệp khác nhau có hành vi hot reload khác nhau:

| Loại tệp | Sau khi sửa cần |
| --- | --- |
| tsx/ts trong `src/client-v2/` | Tự động hot reload, không cần thao tác |
| Tệp dịch trong `src/locale/` | **Khởi động lại ứng dụng** |
| Thêm hoặc sửa collection trong `src/server/collections/` | Thực thi `yarn nocobase upgrade` |

Nếu code client đã sửa nhưng không hot reload, thử làm mới trình duyệt trước.

## Liên quan đến route

### Route trang đã đăng ký không truy cập được

Route của NocoBase v2 mặc định sẽ thêm tiền tố `/v2`. Ví dụ bạn đã đăng ký `path: '/hello'`, địa chỉ truy cập thực tế là `/v2/hello`:

```ts
this.router.add('hello', {
  path: '/hello', // Truy cập thực tế -> /v2/hello
  componentLoader: () => import('./pages/HelloPage'),
});
```

Xem chi tiết tại [Router](../router).

### Click vào trang cài đặt plugin thì trống

Nếu menu trang cài đặt xuất hiện nhưng nội dung trống, thường là một trong hai nguyên nhân:

**Nguyên nhân 1: v1 client dùng `componentLoader`**

`componentLoader` là cách viết của client-v2, v1 client phải dùng `Component` để truyền component trực tiếp:

```ts
// ❌ v1 client không hỗ trợ componentLoader
this.pluginSettingsManager.addPageTabItem({
  menuKey: 'my-settings',
  key: 'index',
  componentLoader: () => import('./pages/MyPage'),
});

// ✅ v1 client dùng Component
import MyPage from './pages/MyPage';
this.pluginSettingsManager.addPageTabItem({
  menuKey: 'my-settings',
  key: 'index',
  Component: MyPage,
});
```

**Nguyên nhân 2: Component trang không dùng `export default` để export**

`componentLoader` cần module có default export, thiếu `default` sẽ không tải được.

## Liên quan đến Block

### Block tùy chỉnh không thấy trong menu "Thêm Block"

Xác nhận đã đăng ký model trong `load()`:

```ts
this.flowEngine.registerModelLoaders({
  MyBlockModel: {
    loader: () => import('./models/MyBlockModel'),
  },
});
```

Nếu dùng `registerModels` (cách viết không tải theo nhu cầu), xác nhận `models/index.ts` đã export model đúng.

### Sau khi thêm Block, danh sách lựa chọn bảng dữ liệu không có bảng của tôi

Bảng được định nghĩa qua `defineCollection` là bảng nội bộ của server, mặc định không xuất hiện trong danh sách bảng dữ liệu của UI.

**Cách làm khuyến nghị**: Thêm bảng dữ liệu tương ứng trong "[Quản lý nguồn dữ liệu](../../../data-sources/data-source-main/index.md)" của giao diện NocoBase, sau khi cấu hình Field và loại interface, bảng sẽ tự động xuất hiện trong danh sách lựa chọn bảng dữ liệu của Block.

Nếu thực sự cần đăng ký trong code Plugin (ví dụ tình huống demo trong Plugin mẫu), có thể đăng ký thủ công thông qua `addCollection`, xem chi tiết tại [Tạo plugin quản lý dữ liệu kết hợp frontend-backend](../examples/fullstack-plugin). Lưu ý phải đăng ký theo mô hình `eventBus`, không thể gọi trực tiếp trong `load()` — `ensureLoaded()` sẽ chạy sau `load()` và xóa rồi thiết lập lại tất cả collection.

### Block tùy chỉnh chỉ muốn gắn vào bảng dữ liệu cụ thể

Ghi đè `static filterCollection` trên model, chỉ collection trả về `true` mới xuất hiện trong danh sách lựa chọn:

```ts
export class MyBlockModel extends TableBlockModel {
  static filterCollection(collection: Collection) {
    return collection.name === 'myTable';
  }
}
```

## Liên quan đến Field

### Component Field tùy chỉnh không thấy trong menu thả xuống "Field component"

Kiểm tra theo thứ tự sau:

1. Xác nhận đã gọi `DisplayItemModel.bindModelToInterface('ModelName', ['input'])`, và loại interface khớp — ví dụ `input` tương ứng Field văn bản một dòng, `checkbox` tương ứng Checkbox
2. Xác nhận model đã đăng ký trong `load()` (`registerModels` hoặc `registerModelLoaders`)
3. Xác nhận Field model đã gọi `define({ label })`

### Menu thả xuống component Field hiển thị tên class

Quên gọi `define({ label })` trên Field model, thêm vào là được:

```ts
MyFieldModel.define({
  label: tExpr('My field'),
});
```

Đồng thời đảm bảo tệp dịch trong `src/locale/` có key tương ứng, nếu không trong môi trường tiếng Trung vẫn hiển thị bản gốc tiếng Anh.

## Liên quan đến Action

### Nút Action tùy chỉnh không thấy trong "Cấu hình thao tác"

Xác nhận model đã đặt `static scene` đúng:

| Giá trị | Vị trí xuất hiện |
| --- | --- |
| `ActionSceneEnum.collection` | Thanh thao tác phía trên Block (ví dụ bên cạnh nút "Tạo mới") |
| `ActionSceneEnum.record` | Cột thao tác của mỗi hàng trong bảng (ví dụ bên cạnh "Chỉnh sửa", "Xóa") |
| `ActionSceneEnum.both` | Xuất hiện ở cả hai ngữ cảnh |

### Click nút Action không có phản ứng

Xác nhận `on` của `registerFlow` được đặt là `'click'`:

```ts
MyActionModel.registerFlow({
  key: 'myFlow',
  on: 'click', // Lắng nghe click nút
  steps: {
    doSomething: {
      async handler(ctx) {
        // Logic của bạn
      },
    },
  },
});
```

:::warning Lưu ý

`uiSchema` trong `registerFlow` là UI của bảng cấu hình (trạng thái cài đặt), không phải dialog runtime. Nếu bạn muốn hiển thị một form sau khi click nút, nên dùng `ctx.viewer.dialog()` để mở dialog trong `handler`.

:::

## Liên quan đến i18n

### Bản dịch không có hiệu lực

Nguyên nhân phổ biến nhất:

- **Lần đầu thêm** thư mục hoặc tệp `src/locale/` — cần khởi động lại ứng dụng để có hiệu lực
- **Key dịch không khớp** — xác nhận key giống hệt với chuỗi trong code, chú ý khoảng trắng và viết hoa/thường
- **Trong component dùng trực tiếp `ctx.t()`** — `ctx.t()` không tự động đưa namespace của plugin, trong component nên dùng hook `useT()` (import từ `locale.ts`)

### Dùng sai ngữ cảnh `tExpr()`, `useT()` và `this.t()`

Ba phương thức dịch này có ngữ cảnh sử dụng khác nhau, dùng sai sẽ báo lỗi hoặc dịch không có hiệu lực:

| Phương thức | Dùng ở đâu | Mô tả |
| --- | --- | --- |
| `tExpr()` | Định nghĩa tĩnh như `define()`, `registerFlow()` | Khi module load i18n chưa khởi tạo, dùng dịch trễ |
| `useT()` | Bên trong component React | Trả về hàm dịch đã gắn namespace của plugin |
| `this.t()` | Trong `load()` của Plugin | Tự động đưa tên gói plugin làm namespace |

Xem chi tiết tại [I18n](../component/i18n).

## Liên quan đến API request

### Request trả về 403 Forbidden

Thường là ACL của server chưa được cấu hình. Ví dụ collection của bạn tên là `todoItems`, cần cho phép thao tác tương ứng trong `load()` của Plugin server:

```ts
// Chỉ cho phép truy vấn
this.app.acl.allow('todoItems', ['list', 'get'], 'loggedIn');

// Cho phép CRUD đầy đủ
this.app.acl.allow('todoItems', ['list', 'get', 'create', 'update', 'destroy'], 'loggedIn');
```

`'loggedIn'` biểu thị người dùng đã đăng nhập là có thể truy cập. Nếu không đặt `acl.allow`, mặc định chỉ admin mới có thể thao tác.

### Request trả về 404 Not Found

Kiểm tra theo thứ tự sau:

- Nếu dùng `defineCollection`, xác nhận tên collection viết đúng chính tả
- Nếu dùng `resourceManager.define`, xác nhận tên resource và tên action đều đúng
- Kiểm tra định dạng URL request — định dạng API của NocoBase là `resourceName:actionName`, ví dụ `todoItems:list`, `externalApi:get`

## Liên quan đến build và deploy

### `yarn build --tar` báo lỗi "no paths specified to add to archive"

Khi thực thi `yarn build <pluginName> --tar` báo lỗi:

```bash
TypeError: no paths specified to add to archive
```

Tuy nhiên thực thi riêng `yarn build <pluginName>` (không có `--tar`) thì bình thường.

Vấn đề này thường do `.npmignore` của Plugin **dùng cú pháp phủ định** (tiền tố `!` của npm). Khi đóng gói `--tar`, NocoBase sẽ đọc từng dòng của `.npmignore` và thêm `!` ở đầu để chuyển thành mẫu loại trừ của `fast-glob`. Nếu `.npmignore` của bạn đã dùng cú pháp phủ định, ví dụ:

```
*
!dist
!package.json
```

Sau khi xử lý sẽ trở thành `['!*', '!!dist', '!!package.json', '**/*']`. Trong đó `!*` sẽ loại trừ tất cả tệp ở cấp gốc (bao gồm `package.json`), còn `!!dist` không được `fast-glob` nhận diện là "bao gồm lại dist" — phủ định mất hiệu lực. Nếu thư mục `dist/` đúng lúc trống hoặc build không có sản phẩm tệp, danh sách tệp thu thập cuối cùng sẽ trống, `tar` sẽ ném lỗi này.

**Cách giải quyết:** Trong `.npmignore` đừng dùng cú pháp phủ định, đổi thành chỉ liệt kê các thư mục cần loại trừ:

```
/node_modules
/src
```

Logic đóng gói sẽ chuyển những cái này thành mẫu loại trừ (`!./node_modules`, `!./src`), thêm `**/*` để khớp tất cả các tệp khác. Cách viết này vừa đơn giản vừa không gặp vấn đề về xử lý phủ định.

### Plugin upload lên môi trường production thất bại khi bật (local bình thường)

Plugin khi phát triển local mọi thứ đều bình thường, nhưng sau khi upload qua "Trình quản lý plugin" lên môi trường production thì bật thất bại, trong log có lỗi tương tự như:

```bash
TypeError: Cannot assign to read only property 'constructor' of object '[object Object]'
```

Vấn đề này thường do **Plugin đóng gói các phụ thuộc tích hợp của NocoBase vào `node_modules/` của chính nó**. Hệ thống build của NocoBase duy trì một [danh sách external](../../dependency-management), trong đó các package (như `react`, `antd`, `axios`, `lodash`, v.v.) do host NocoBase cung cấp, không nên được đóng gói vào Plugin. Nếu Plugin có một bản sao riêng, runtime có thể xung đột với phiên bản host đã tải, gây ra nhiều lỗi kỳ lạ.

**Tại sao local không có vấn đề:** Khi phát triển local Plugin nằm trong thư mục `packages/plugins/`, không có `node_modules/` riêng, các phụ thuộc sẽ resolve về phiên bản đã tải ở thư mục gốc dự án, không gây xung đột.

**Cách giải quyết:** Chuyển tất cả `dependencies` trong `package.json` của Plugin sang `devDependencies` — hệ thống build của NocoBase sẽ tự động xử lý các phụ thuộc của Plugin:

```diff
{
- "dependencies": {
-   "axios": "1.7.7"
- },
+ "devDependencies": {
+   "axios": "1.7.7"
+ },
}
```

Sau đó build và đóng gói lại. Như vậy `dist/node_modules/` của Plugin sẽ không chứa các package này, runtime sẽ dùng phiên bản host NocoBase cung cấp.

:::tip Nguyên tắc chung

Hệ thống build của NocoBase duy trì một [danh sách external](../../dependency-management), trong đó các package (như `react`, `antd`, `axios`, `lodash`, v.v.) do host NocoBase cung cấp, Plugin không nên đóng gói riêng. Tất cả phụ thuộc của Plugin nên đặt trong `devDependencies`, hệ thống build sẽ tự động phán đoán cái nào cần đóng gói vào `dist/node_modules/`, cái nào do host cung cấp.

:::

## Liên kết liên quan

- [Plugin](../plugin) — Lối vào Plugin và vòng đời
- [Router](../router) — Đăng ký route và tiền tố `/v2`
- [Tổng quan FlowEngine](../flow-engine/index.md) — Cách dùng cơ bản FlowModel
- [FlowEngine → Mở rộng Block](../flow-engine/block) — BlockModel, TableBlockModel, filterCollection
- [FlowEngine → Mở rộng Field](../flow-engine/field) — FieldModel, bindModelToInterface
- [FlowEngine → Mở rộng Action](../flow-engine/action) — ActionModel, ActionSceneEnum
- [I18n](../component/i18n) — Cách dùng tệp dịch, useT, tExpr
- [Context → Năng lực phổ biến](../ctx/common-capabilities) — ctx.api, ctx.viewer, v.v.
- [Server → Collections](../../server/collections) — defineCollection và addCollection
- [Server → ACL](../../server/acl) — Cấu hình quyền interface
- [Build Plugin](../../build) — Cấu hình build, danh sách external, quy trình đóng gói
