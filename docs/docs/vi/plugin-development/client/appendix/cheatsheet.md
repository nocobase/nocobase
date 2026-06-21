---
title: "Bảng tra cứu phát triển Plugin"
description: "Bảng tra cứu phát triển Plugin NocoBase: làm gì → trong tệp nào → gọi API gì, định vị nhanh code đặt ở đâu."
keywords: "Bảng tra cứu,Cheatsheet,Cách đăng ký,Vị trí tệp,NocoBase"
---

# Bảng tra cứu phát triển Plugin

Khi viết Plugin thường tự hỏi "thứ này nên viết trong tệp nào, gọi API nào". Bảng tra cứu này giúp bạn định vị nhanh.

## Cấu trúc thư mục Plugin

Tạo Plugin thông qua `yarn pm create @my-project/plugin-name`, sẽ tự động sinh cấu trúc thư mục sau. Đừng tạo thư mục thủ công, để tránh thiếu bước đăng ký dẫn đến Plugin không có hiệu lực. Xem chi tiết tại [Viết Plugin đầu tiên](../../write-your-first-plugin).

```bash
plugin-name/
├── src/
│   ├── client-v2/              # Code client (v2)
│   │   ├── plugin.tsx          # Lối vào Plugin client
│   │   ├── locale.ts           # useT / tExpr hook dịch
│   │   ├── models/             # FlowModel (Block, Field, Action)
│   │   └── pages/              # Component trang
│   ├── client/                 # Code client (v1, tương thích)
│   │   ├── plugin.tsx
│   │   ├── locale.ts
│   │   ├── models/
│   │   └── pages/
│   ├── server/                 # Code server
│   │   ├── plugin.ts           # Lối vào Plugin server
│   │   └── collections/        # Định nghĩa bảng dữ liệu
│   └── locale/                 # Tệp dịch đa ngôn ngữ
│       ├── zh-CN.json
│       └── en-US.json
├── client-v2.js                # Lối vào thư mục gốc (build artifact trỏ đến)
├── client-v2.d.ts
├── client.js
├── client.d.ts
├── server.js
├── server.d.ts
└── package.json
```

## Client: Tôi muốn làm gì → Viết như thế nào

| Tôi muốn làm gì | Viết trong tệp nào | Gọi API gì | Tài liệu |
| --- | --- | --- | --- |
| Đăng ký một route trang | `load()` của `plugin.tsx` | `this.router.add()` | [Router](../router) |
| Đăng ký một trang cài đặt plugin | `load()` của `plugin.tsx` | `pluginSettingsManager.addMenuItem()` + `addPageTabItem()` | [Router](../router) |
| Đăng ký một Block tùy chỉnh | `load()` của `plugin.tsx` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → Mở rộng Block](../flow-engine/block) |
| Đăng ký một Field tùy chỉnh | `load()` của `plugin.tsx` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → Mở rộng Field](../flow-engine/field) |
| Đăng ký một Action tùy chỉnh | `load()` của `plugin.tsx` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → Mở rộng Action](../flow-engine/action) |
| Cho bảng nội bộ xuất hiện trong lựa chọn bảng dữ liệu của Block | `load()` của `plugin.tsx` | `mainDS.addCollection()` | [Collections](../../server/collections) |
| Dịch văn bản của Plugin | `locale/zh-CN.json` + `locale/en-US.json` | — | [I18n](../component/i18n) |

## Server: Tôi muốn làm gì → Viết như thế nào

| Tôi muốn làm gì | Viết trong tệp nào | Gọi API gì | Tài liệu |
| --- | --- | --- | --- |
| Định nghĩa một bảng dữ liệu | `server/collections/xxx.ts` | `defineCollection()` | [Collections](../../server/collections) |
| Mở rộng bảng dữ liệu hiện có | `server/collections/xxx.ts` | `extendCollection()` | [Collections](../../server/collections) |
| Đăng ký interface tùy chỉnh | `load()` của `server/plugin.ts` | `this.app.resourceManager.define()` | [ResourceManager](../../server/resource-manager) |
| Cấu hình quyền interface | `load()` của `server/plugin.ts` | `this.app.acl.allow()` | [ACL](../../server/acl) |
| Ghi dữ liệu khởi tạo khi cài Plugin | `install()` của `server/plugin.ts` | `this.db.getRepository().create()` | [Plugin](../../server/plugin) |

## Bảng tra cứu FlowModel

| Tôi muốn làm gì | Kế thừa lớp cơ sở nào | API quan trọng |
| --- | --- | --- |
| Tạo một Block hiển thị thuần | `BlockModel` | `renderComponent()` + `define()` |
| Tạo một Block gắn bảng dữ liệu (render tùy chỉnh) | `CollectionBlockModel` | `createResource()` + `renderComponent()` |
| Tạo một Block bảng đầy đủ (tùy chỉnh trên cơ sở bảng tích hợp) | `TableBlockModel` | `filterCollection()` + `customModelClasses` |
| Tạo một component hiển thị Field | `ClickableFieldModel` | `renderComponent(value)` + `bindModelToInterface()` |
| Tạo một nút Action | `ActionModel` | `static scene` + `registerFlow({ on: 'click' })` |

## Bảng tra cứu phương thức dịch

| Ngữ cảnh | Dùng gì | Import từ đâu |
| --- | --- | --- |
| Trong `load()` của Plugin | `this.t('key')` | Lớp cơ sở Plugin có sẵn |
| Trong component React | `const t = useT(); t('key')` | `locale.ts` |
| Định nghĩa tĩnh FlowModel (`define()`, `registerFlow()`) | `tExpr('key')` | `locale.ts` |

## Bảng tra cứu gọi API phổ biến

| Tôi muốn làm gì | Trong Plugin | Trong component |
| --- | --- | --- |
| Gửi API request | `this.context.api.request()` | `ctx.api.request()` |
| Lấy bản dịch | `this.t()` | `useT()` |
| Lấy logger | `this.context.logger` | `ctx.logger` |
| Đăng ký route | `this.router.add()` | — |
| Điều hướng trang | — | `ctx.router.navigate()` |
| Mở dialog | — | `ctx.viewer.dialog()` |

## Liên kết liên quan

- [Tổng quan phát triển Client](../index.md) — Lộ trình học và chỉ mục nhanh
- [Plugin](../plugin) — Lối vào Plugin và vòng đời
- [FAQ & Hướng dẫn xử lý lỗi](./faq) — Tìm và xử lý lỗi
- [Router](../router) — Đăng ký route trang
- [FlowEngine → Mở rộng Block](../flow-engine/block) — Các lớp cơ sở BlockModel
- [FlowEngine → Mở rộng Field](../flow-engine/field) — Phát triển FieldModel
- [FlowEngine → Mở rộng Action](../flow-engine/action) — Phát triển ActionModel
- [Collections](../../server/collections) — defineCollection và các kiểu Field
- [I18n](../component/i18n) — Cách viết tệp dịch
- [ResourceManager](../../server/resource-manager) — REST API tùy chỉnh
- [ACL](../../server/acl) — Cấu hình quyền
- [Plugin (Server)](../../server/plugin) — Vòng đời Plugin server
- [Viết Plugin đầu tiên](../../write-your-first-plugin) — Tạo khung Plugin
