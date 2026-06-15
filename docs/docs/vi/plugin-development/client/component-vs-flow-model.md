---
title: "Component vs FlowModel"
description: "Hướng dẫn lựa chọn phát triển NocoBase: khi nào dùng component React thông thường, khi nào dùng FlowModel, sự khác biệt năng lực, so sánh vòng đời và lựa chọn ngữ cảnh."
keywords: "Component,FlowModel,Hướng dẫn lựa chọn,Component React,Cấu hình trực quan,Cây model,NocoBase"
---

# Component vs FlowModel

Trong phát triển Plugin NocoBase, viết UI frontend có hai cách: **component React thông thường** và **[FlowModel](../../flow-engine/index.md)**. Hai cái không phải là quan hệ thay thế lẫn nhau — FlowModel là một lớp bọc trên component React, thêm khả năng cấu hình trực quan cho component.

Thông thường, bạn không cần đắn đo quá lâu. Hãy tự hỏi mình một câu hỏi:

> **Component này có cần xuất hiện trong menu "Thêm Block / Field / Action" của NocoBase, để người dùng cấu hình trực quan trên giao diện không?**

- **Không cần** → Dùng component React thông thường, là phát triển React tiêu chuẩn
- **Cần** → Dùng FlowModel để bọc

## Phương án mặc định: Component React

Phần lớn ngữ cảnh Plugin dùng component React thông thường là đủ. Ví dụ:

- Đăng ký một trang độc lập (trang cài đặt plugin, trang route tùy chỉnh)
- Viết một dialog, form, list, v.v. làm component nội bộ
- Đóng gói một component UI loại tiện ích

Trong các ngữ cảnh này, viết component bằng React + Antd, lấy năng lực context của NocoBase (gửi request, i18n, v.v.) thông qua `useFlowContext()`, không khác gì phát triển frontend thông thường.

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MySettingsPage() {
  const ctx = useFlowContext();

  return (
    <div>
      <h2>{ctx.t('Plugin settings')}</h2>
      {/* Component React thông thường, không cần FlowModel */}
    </div>
  );
}
```

Cách dùng chi tiết xem tại [Phát triển Component](./component/index.md).

## Khi nào dùng FlowModel

Khi component của bạn cần đáp ứng các điều kiện sau, dùng FlowModel:

1. **Xuất hiện trong menu**: Cần để người dùng thêm thông qua menu "Thêm Block", "Thêm Field", "Thêm Action"
2. **Hỗ trợ cấu hình trực quan**: Người dùng có thể click vào các mục cấu hình trên giao diện để chỉnh sửa thuộc tính của component (ví dụ chỉnh tiêu đề, chuyển chế độ hiển thị)
3. **Cấu hình cần được lưu trữ**: Cấu hình của người dùng cần được lưu lại, khi mở trang lần sau vẫn còn

Nói đơn giản, FlowModel giải quyết vấn đề "làm cho component có thể cấu hình, có thể lưu trữ". Nếu component của bạn không cần các năng lực này, không cần dùng nó.

## Mối quan hệ giữa hai cái

FlowModel không dùng để "thay thế" component React. Nó là một lớp trừu tượng trên component React:

```
Component React: chịu trách nhiệm render UI
    ↓ Bọc
FlowModel: quản lý nguồn props, bảng cấu hình, lưu trữ cấu hình
```

Trong phương thức `render()` của một FlowModel, viết chính là code React thông thường. Sự khác biệt là: props của component thông thường là cố định hoặc được truyền từ component cha vào, còn props của FlowModel được sinh ra động thông qua Flow (quy trình cấu hình).

Thực tế, hai cái có cấu trúc cơ bản khá tương đồng:

```tsx pure
// Component React
class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}

// FlowModel
class HelloModel extends FlowModel {
  render() {
    return <div>Hello</div>;
  }
}
```

Tuy nhiên cách quản lý của chúng hoàn toàn khác nhau. Component React dựa vào lồng JSX để tạo thành **cây component** — đây là cây render UI khi runtime. Còn FlowModel được [FlowEngine](../../flow-engine/index.md) quản lý, tạo thành **cây model** — một cây cấu trúc logic có thể lưu trữ, có thể đăng ký động, kiểm soát quan hệ cha-con tường minh thông qua `setSubModel` / `addSubModel`, phù hợp để xây dựng các cấu trúc cần quản lý cấu hình hóa như Block trang, luồng thao tác, model dữ liệu.

## So sánh năng lực

Nhìn từ góc độ kỹ thuật hơn về sự khác biệt giữa hai cái:

| Năng lực | Component React | FlowModel |
| --- | --- | --- |
| Render UI | `render()` | `render()` |
| Quản lý trạng thái | `state` / `setState` tích hợp | Quản lý qua `props` và cấu trúc cây model |
| Vòng đời | `constructor`, `componentDidMount`, `componentWillUnmount` | `onInit`, `onMount`, `onUnmount` |
| Phản hồi thay đổi đầu vào | `componentDidUpdate` | `onBeforeAutoFlows`, `onAfterAutoFlows` |
| Xử lý lỗi | `componentDidCatch` | `onAutoFlowsError` |
| Component con | Lồng JSX | `setSubModel` / `addSubModel` thiết lập subModel tường minh |
| Hành vi động | Gắn sự kiện, cập nhật trạng thái | Đăng ký và phát Flow |
| Lưu trữ | Không có cơ chế tích hợp | `model.save()`, v.v., kết nối với backend |
| Tái sử dụng nhiều instance | Cần xử lý thủ công | `createFork` — ví dụ mỗi hàng của bảng |
| Quản lý engine | Không | Được FlowEngine đăng ký, tải, quản lý thống nhất |

Nếu bạn quen thuộc với vòng đời React, vòng đời của FlowModel rất dễ map qua — `onInit` tương ứng `constructor`, `onMount` tương ứng `componentDidMount`, `onUnmount` tương ứng `componentWillUnmount`.

Ngoài ra, FlowModel còn cung cấp một số năng lực mà component React không có:

- **`registerFlow`** — Đăng ký Flow, định nghĩa quy trình cấu hình
- **`applyFlow` / `dispatchEvent`** — Thực thi hoặc kích hoạt Flow
- **`openFlowSettings`** — Mở bảng cài đặt của bước Flow
- **`save` / `saveStepParams()`** — Lưu trữ cấu hình model
- **`createFork`** — Một logic model được tái sử dụng render nhiều lần (ví dụ mỗi hàng của bảng)

Các năng lực này là nền tảng hỗ trợ trải nghiệm "cấu hình trực quan". Nếu ngữ cảnh của bạn không liên quan đến cấu hình trực quan, không cần quan tâm đến chúng. Cách dùng chi tiết xem tại [Tài liệu FlowEngine đầy đủ](../../flow-engine/index.md).

## Đối chiếu ngữ cảnh

| Ngữ cảnh | Phương án | Lý do |
| --- | --- | --- |
| Trang cài đặt plugin | Component React | Trang độc lập, không cần xuất hiện trong menu cấu hình |
| Dialog tiện ích | Component React | Component nội bộ, không cần cấu hình trực quan |
| Block bảng dữ liệu tùy chỉnh | FlowModel | Cần xuất hiện trong menu "Thêm Block", người dùng có thể cấu hình nguồn dữ liệu |
| Component hiển thị Field tùy chỉnh | FlowModel | Cần xuất hiện trong cấu hình Field, người dùng có thể chọn cách hiển thị |
| Nút Action tùy chỉnh | FlowModel | Cần xuất hiện trong menu "Thêm Action" |
| Đóng gói một component biểu đồ cho Block dùng | Component React | Bản thân biểu đồ là component nội bộ, được Block của FlowModel gọi |

## Áp dụng từng bước

Khi không chắc chắn, trước tiên dùng component React để triển khai chức năng. Sau khi xác nhận cần năng lực cấu hình trực quan, dùng FlowModel để bọc — đây là cách làm tiệm tiến được khuyến nghị. Nội dung khối lớn dùng FlowModel để quản lý, chi tiết bên trong dùng component React để triển khai, hai cái phối hợp với nhau.

## Liên kết liên quan

- [Phát triển Component](./component/index.md) — Cách viết component React và cách dùng useFlowContext
- [Tổng quan FlowEngine](./flow-engine/index.md) — Cách dùng cơ bản FlowModel và registerFlow
- [Tài liệu FlowEngine đầy đủ](../../flow-engine/index.md) — Tham chiếu đầy đủ FlowModel, Flow, Context
