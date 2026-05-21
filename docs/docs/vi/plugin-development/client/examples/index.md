---
title: "Ví dụ thực tế Plugin"
description: "Các ví dụ thực tế đầy đủ của Plugin NocoBase phía client: trang cài đặt, Block tùy chỉnh, kết hợp frontend-backend, Field tùy chỉnh, Plugin hoàn chỉnh từ đầu đến cuối."
keywords: "Ví dụ Plugin,Trường hợp thực tế,Plugin hoàn chỉnh,NocoBase"
---

# Ví dụ thực tế Plugin

Các chương trước đã giới thiệu lần lượt các năng lực [Plugin](../plugin), [Router](../router), [Component](../component/index.md), [Context](../ctx/index.md), [FlowEngine](../flow-engine/index.md). Chương này sẽ kết nối chúng lại — thông qua một số ví dụ thực tế đầy đủ, trình bày toàn bộ quá trình của một Plugin từ tạo mới đến hoàn thành.

Mỗi ví dụ đều tương ứng với một Plugin mẫu có thể chạy được, bạn có thể xem trực tiếp mã nguồn hoặc chạy cục bộ.

## Danh sách ví dụ

| Ví dụ | Năng lực liên quan | Độ khó |
| --- | --- | --- |
| [Tạo trang cài đặt plugin](./settings-page) | Plugin + Router + Component + Context + Server | Khởi đầu |
| [Tạo Block hiển thị tùy chỉnh](./custom-block) | Plugin + FlowEngine (BlockModel) | Khởi đầu |
| [Tạo component Field tùy chỉnh](./custom-field) | Plugin + FlowEngine (FieldModel) | Khởi đầu |
| [Tạo nút Action tùy chỉnh](./custom-action) | Plugin + FlowEngine (ActionModel) | Khởi đầu |
| [Tạo plugin quản lý dữ liệu kết hợp frontend-backend](./fullstack-plugin) | Plugin + FlowEngine (TableBlockModel + FieldModel + ActionModel) + Server | Nâng cao |

Khuyến nghị đọc theo thứ tự. Ví dụ đầu tiên dùng component React + interface server đơn giản, không liên quan đến FlowEngine; ba ví dụ giữa lần lượt minh họa ba lớp cơ sở Block, Field, Action của FlowEngine; ví dụ cuối kết nối Block, Field, Action đã học vào với nhau, thêm bảng dữ liệu phía server, tạo thành một Plugin kết hợp frontend-backend hoàn chỉnh. Nếu bạn vẫn chưa chắc nên dùng component React hay FlowModel, có thể xem trước [Component vs FlowModel](../component-vs-flow-model).

## Liên kết liên quan

- [Viết Plugin đầu tiên](../../write-your-first-plugin) — Tạo Plugin có thể chạy từ đầu
- [Tổng quan phát triển Client](../index.md) — Lộ trình học và chỉ mục nhanh
- [Tổng quan FlowEngine](../flow-engine/index.md) — Cách dùng cơ bản FlowModel và registerFlow
- [Tài liệu FlowEngine đầy đủ](../../../flow-engine/index.md) — Tham chiếu đầy đủ FlowModel, Flow, Context
- [Component vs FlowModel](../component-vs-flow-model) — Chọn component hay FlowModel
