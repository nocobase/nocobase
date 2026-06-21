---
title: "FlowContext"
description: "API FlowContext của NocoBase: tham khảo đầy đủ các thuộc tính và phương thức của đối tượng ctx trong handler của registerFlow."
keywords: "FlowContext,FlowRuntimeContext,ctx,registerFlow,handler,FlowEngine,NocoBase"
---

# FlowContext

Trong step handler của `registerFlow`, tham số `ctx` chính là một instance `FlowRuntimeContext`. Thông qua chuỗi delegate, nó có thể truy cập tất cả các thuộc tính và phương thức ở cấp model và cấp engine.

Chuỗi delegate là:

```
FlowRuntimeContext (ngữ cảnh runtime của flow hiện tại)
  → FlowModelContext (model.context, cấp model)
    → FlowEngineContext (engine.context, cấp toàn cục)
```

## Thuộc tính thường dùng

Các thuộc tính `ctx` được dùng nhiều nhất trong phát triển Plugin:

| Thuộc tính | Kiểu | Mô tả |
|------|------|------|
| `ctx.model` | `FlowModel` | Instance FlowModel hiện tại |
| `ctx.api` | `APIClient` | Client HTTP request, đến từ `@nocobase/sdk` |
| `ctx.viewer` | `FlowViewer` | Trình quản lý dialog/drawer, cung cấp các phương thức `dialog()`, `drawer()` |
| `ctx.message` | `MessageInstance` | Instance message của Antd, ví dụ `ctx.message.success('OK')` |
| `ctx.notification` | `NotificationInstance` | Instance notification của Antd |
| `ctx.modal` | `HookAPI` | Instance Modal.useModal của Antd |
| `ctx.t(key, options?)` | `(string, object?) => string` | Phương thức dịch i18n |
| `ctx.router` | `Router` | Instance router của react-router |
| `ctx.route` | `RouteOptions` | Thông tin route hiện tại (observable) |
| `ctx.location` | `Location` | Đối tượng location của URL hiện tại (observable) |
| `ctx.ref` | `React.RefObject` | DOM ref của container view của model hiện tại |
| `ctx.flowKey` | `string` | Key của flow hiện tại |
| `ctx.mode` | `'runtime' \| 'settings'` | Chế độ thực thi hiện tại, runtime là runtime, settings là panel cấu hình |
| `ctx.token` | `string` | Token xác thực của người dùng hiện tại |
| `ctx.role` | `string` | Vai trò của người dùng hiện tại |
| `ctx.auth` | `object` | Thông tin xác thực: `{ roleName, locale, token, user }` |
| `ctx.themeToken` | `object` | Token theme của Antd, dùng để lấy màu chủ đề |
| `ctx.dataSourceManager` | `DataSourceManager` | Trình quản lý nguồn dữ liệu |
| `ctx.engine` | `FlowEngine` | Instance FlowEngine |
| `ctx.app` | `Application` | Instance Application của NocoBase |
| `ctx.i18n` | `i18n` | Instance i18next |

## Phương thức thường dùng

### Liên quan đến request

| Phương thức | Mô tả |
|------|------|
| `ctx.request(options)` | Gửi HTTP request, URL nội bộ qua `APIClient`, URL bên ngoài qua `axios` |
| `ctx.makeResource(ResourceClass)` | Tạo một instance Resource (ví dụ `MultiRecordResource`, `SingleRecordResource`) |
| `ctx.initResource(className)` | Khởi tạo một resource trên model context |

### Liên quan đến popup

| Phương thức | Mô tả |
|------|------|
| `ctx.viewer.dialog(options)` | Mở dialog, `options.content` nhận `(view) => JSX`, dùng `view.close()` để đóng |
| `ctx.viewer.drawer(options)` | Mở drawer |
| `ctx.openView(uid, options)` | Mở view đã đăng ký (popup / drawer / dialog) |

### Kiểm soát thực thi Flow

| Phương thức | Mô tả |
|------|------|
| `ctx.exit()` | Ngắt thực thi flow hiện tại |
| `ctx.exitAll()` | Ngắt thực thi tất cả flow |
| `ctx.getStepParams(stepKey)` | Lấy tham số đã lưu của step chỉ định |
| `ctx.setStepParams(stepKey, params)` | Đặt tham số cho step chỉ định |
| `ctx.getStepResults(stepKey)` | Lấy kết quả thực thi của step trước đó |

### Action và Event

| Phương thức | Mô tả |
|------|------|
| `ctx.runAction(actionName, params?)` | Thực thi một action đã đăng ký |
| `ctx.getAction(name)` | Lấy định nghĩa action đã đăng ký |
| `ctx.getActions()` | Lấy tất cả action đã đăng ký |
| `ctx.getEvents()` | Lấy tất cả event đã đăng ký |

### Quyền

| Phương thức | Mô tả |
|------|------|
| `ctx.aclCheck(params)` | Kiểm tra quyền ACL |
| `ctx.acl` | Instance ACL |

### Khác

| Phương thức | Mô tả |
|------|------|
| `ctx.resolveJsonTemplate(template)` | Phân giải template biểu thức `{{ ctx.xxx }}` |
| `ctx.getVar(path)` | Phân giải đường dẫn biểu thức `ctx.xxx.yyy` |
| `ctx.runjs(code, variables?, options?)` | Thực thi mã JavaScript động |
| `ctx.requireAsync(url)` | Tải module động (kiểu CommonJS) |
| `ctx.importAsync(url)` | Tải module động (kiểu ESM) |
| `ctx.loadCSS(href)` | Tải file CSS động |
| `ctx.onRefReady(ref, callback, timeout)` | Chờ React ref sẵn sàng rồi thực thi callback |
| `ctx.defineProperty(key, options)` | Đăng ký thuộc tính mới động |
| `ctx.defineMethod(name, fn, info?)` | Đăng ký phương thức mới động |

## Cách dùng điển hình trong phát triển Plugin

### Hiển thị thông báo trong click handler

```ts
MyModel.registerFlow({
  key: 'clickFlow',
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.success(ctx.t('Thao tác thành công'));
      },
    },
  },
});
```

### Mở popup tạo bản ghi

```ts
MyModel.registerFlow({
  key: 'clickFlow',
  on: 'click',
  steps: {
    openDialog: {
      async handler(ctx) {
        ctx.viewer.dialog({
          title: ctx.t('Tạo bản ghi mới'),
          content: (view) => <MyForm onClose={() => view.close()} />,
        });
      },
    },
  },
});
```

### Lấy dữ liệu hàng hiện tại (thao tác cấp bản ghi)

```ts
MyRecordAction.registerFlow({
  key: 'clickFlow',
  on: 'click',
  steps: {
    showRecord: {
      async handler(ctx) {
        const index = ctx.model.context.recordIndex;
        const record = ctx.model.context.record;
        ctx.message.info(`Hàng ${index}: ${record.title}`);
      },
    },
  },
});
```

### Thao tác dữ liệu qua resource

```ts
async handler(ctx) {
  const resource = ctx.model.context.resource;
  // Tạo bản ghi
  await resource.create({ title: 'New item', completed: false });
  // Refresh dữ liệu
  await resource.refresh();
}
```

## Liên kết liên quan

- [Tổng quan FlowEngine (phát triển Plugin)](../../plugin-development/client/flow-engine/index.md) — Cách dùng cơ bản FlowModel và registerFlow
- [FlowDefinition](../../flow-engine/definitions/flow-definition.md) — Mô tả tham số đầy đủ của registerFlow
- [Tài liệu đầy đủ FlowEngine](../../flow-engine/index.md) — Tham khảo đầy đủ FlowModel, Flow
