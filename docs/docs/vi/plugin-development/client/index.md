---
title: "Tổng quan phát triển Plugin Client"
description: "Tổng quan phát triển Plugin NocoBase phía client: dòng kiến thức chính Plugin → Router → Component → Context → FlowEngine, bảng chỉ mục nhanh giúp định vị chương."
keywords: "Plugin client,Plugin,Router,Component,Context,FlowEngine,FlowModel,NocoBase"
---

# Tổng quan

Plugin phía client của NocoBase có thể làm rất nhiều việc: đăng ký trang mới, viết Component tùy chỉnh, gọi API backend, thêm Block và Field, thậm chí mở rộng nút Action. Tất cả các năng lực này đều được tổ chức thông qua một lối vào Plugin thống nhất.

Nếu bạn đã có kinh nghiệm phát triển React, sẽ tiếp cận rất nhanh — phần lớn các tình huống chỉ là viết Component React thông thường, sau đó dùng các năng lực context mà NocoBase cung cấp (như gửi request, i18n) để kết nối với NocoBase. Chỉ khi bạn cần Component xuất hiện trong giao diện cấu hình trực quan của NocoBase, mới cần tìm hiểu [FlowEngine](./flow-engine/index.md).

:::warning Lưu ý

NocoBase đang chuyển từ `client` (v1) sang `client-v2`, hiện tại `client-v2` vẫn đang được phát triển. Nội dung được giới thiệu trong tài liệu này dùng để trải nghiệm sớm, không khuyến nghị dùng trực tiếp cho môi trường sản xuất. Plugin phát triển mới hãy dùng thư mục `src/client-v2/` và API của `@nocobase/client-v2`.

:::

## Lộ trình học

Khuyến nghị tìm hiểu phát triển Plugin client theo thứ tự sau, từ đơn giản đến phức tạp:

```
Plugin (Lối vào) → Router (Trang) → Component (Component) → Context (Ngữ cảnh) → FlowEngine (Mở rộng UI)
```

Trong đó:

1. **[Plugin](./plugin)**: Lớp lối vào của Plugin, đăng ký các tài nguyên như route, model trong các vòng đời như `load()`.
2. **[Router](./router)**: Đăng ký route trang thông qua `router.add()`, đăng ký trang cài đặt plugin thông qua `pluginSettingsManager`.
3. **[Component](./component/index.md)**: Cái mà route mount chính là Component React. Mặc định viết bằng React + Antd là được, không khác gì phát triển frontend thông thường.
4. **[Context](./ctx/index.md)**: Trong Plugin có thể lấy context thông qua `this.context`, trong Component lấy thông qua `useFlowContext()`, để dùng các năng lực mà NocoBase cung cấp — gửi request (`ctx.api`), i18n (`ctx.t`), log (`ctx.logger`), v.v.
5. **[FlowEngine](./flow-engine/index.md)**: Nếu Component của bạn cần xuất hiện trong menu "Thêm Block / Field / Action", hỗ trợ người dùng cấu hình trực quan, thì cần dùng FlowModel để bọc.

Bốn bước đầu đáp ứng được hầu hết các tình huống Plugin. Chỉ khi cần tích hợp sâu vào hệ thống cấu hình UI của NocoBase, mới cần đến bước thứ năm. Nếu không chắc dùng cách nào, có thể xem [Component vs FlowModel](./component-vs-flow-model).

## Chỉ mục nhanh

| Tôi muốn...                             | Xem ở đâu                                                |
| ------------------------------------ | ------------------------------------------------------- |
| Tìm hiểu cấu trúc cơ bản của Plugin client               | [Plugin](./plugin)                                 |
| Thêm một trang độc lập                     | [Router](./router)                                 |
| Thêm một trang cài đặt plugin                   | [Router](./router)                                 |
| Viết một Component React thông thường                | [Phát triển Component](./component/index.md)                       |
| Gọi API backend, sử dụng các năng lực tích hợp của NocoBase | [Context → Năng lực phổ biến](./ctx/common-capabilities)         |
| Tùy chỉnh kiểu Component                       | [Styles & Themes](./component/styles-themes) |
| Thêm một Block mới                     | [FlowEngine → Mở rộng Block](./flow-engine/block)            |
| Thêm một component Field mới                 | [FlowEngine → Mở rộng Field](./flow-engine/field)            |
| Thêm một nút Action mới                 | [FlowEngine → Mở rộng Action](./flow-engine/action)           |
| Không chắc dùng Component hay FlowModel    | [Component vs FlowModel](./component-vs-flow-model)     |
| Xem một Plugin hoàn chỉnh được làm như thế nào           | [Ví dụ thực tế Plugin](./examples/index.md)                              |

## Liên kết liên quan

- [Viết Plugin đầu tiên](../write-your-first-plugin) — Tạo một Plugin có thể chạy từ đầu
- [Tổng quan phát triển server](../server) — Plugin client thường cần phối hợp với server
- [Tài liệu FlowEngine đầy đủ](../../flow-engine/index.md) — Tham chiếu đầy đủ FlowModel, Flow, Context
- [Cấu trúc thư mục dự án](../project-structure) — Các tệp Plugin được đặt ở đâu
