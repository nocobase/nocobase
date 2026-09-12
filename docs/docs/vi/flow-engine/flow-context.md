---
title: "Hệ thống Context của FlowEngine"
description: "Hệ thống Context của FlowEngine: FlowContext, DataSourceManager, quản lý tài nguyên, hiểu Context và data source runtime của FlowEngine."
keywords: "FlowContext,hệ thống Context,DataSourceManager,quản lý tài nguyên,FlowEngine runtime,NocoBase"
---

# Tổng quan hệ thống Context

Hệ thống Context của Flow engine NocoBase được chia thành ba tầng, tương ứng với các phạm vi tác dụng khác nhau, sử dụng hợp lý có thể giúp chia sẻ và cách ly linh hoạt service, cấu hình, dữ liệu, nâng cao khả năng bảo trì và mở rộng nghiệp vụ.

- **FlowEngineContext (Context toàn cục)**: Duy nhất toàn cục, tất cả Model và Flow đều có thể truy cập, phù hợp để đăng ký service, cấu hình toàn cục.
- **FlowModelContext (Context Model)**: Dùng để chia sẻ Context bên trong cây Model, sub model tự động proxy Context của Model cha, hỗ trợ ghi đè cùng tên, phù hợp với logic và cách ly dữ liệu cấp Model.
- **FlowRuntimeContext (Context runtime của Flow)**: Được tạo mỗi khi Flow thực thi, xuyên suốt vòng đời chạy của Flow, phù hợp để truyền dữ liệu, lưu biến, ghi nhận trạng thái chạy trong Flow. Hỗ trợ hai chế độ `mode: 'runtime' | 'settings'`, tương ứng với chế độ runtime và chế độ cấu hình.

Tất cả các `FlowEngineContext` (Context toàn cục), `FlowModelContext` (Context Model), `FlowRuntimeContext` (Context runtime của Flow) đều là class con hoặc instance của `FlowContext`.

---

## 🗂️ Sơ đồ phân cấp

```text
FlowEngineContext (Context toàn cục)
│
├── FlowModelContext (Context Model)
│     ├── FlowModelContext con (sub model)
│     │     ├── FlowRuntimeContext (Context runtime của Flow)
│     │     └── FlowRuntimeContext (Context runtime của Flow)
│     └── FlowRuntimeContext (Context runtime của Flow)
│
├── FlowModelContext (Context Model)
│     └── FlowRuntimeContext (Context runtime của Flow)
│
└── FlowModelContext (Context Model)
      ├── FlowModelContext con (sub model)
      │     └── FlowRuntimeContext (Context runtime của Flow)
      └── FlowRuntimeContext (Context runtime của Flow)
```

- `FlowModelContext` thông qua cơ chế proxy (delegate) có thể truy cập thuộc tính và phương thức của `FlowEngineContext`, đạt được chia sẻ năng lực toàn cục.
- `FlowModelContext` của sub model thông qua cơ chế proxy (delegate) có thể truy cập Context của Model cha (quan hệ đồng bộ), hỗ trợ ghi đè cùng tên.
- Sub model bất đồng bộ và Model cha không thiết lập quan hệ proxy (delegate), tránh ô nhiễm trạng thái.
- `FlowRuntimeContext` luôn truy cập `FlowModelContext` tương ứng thông qua cơ chế proxy (delegate), nhưng không truyền ngược lên trên.

---

## 🧭 Chế độ runtime và chế độ cấu hình (mode)

`FlowRuntimeContext` hỗ trợ hai chế độ, phân biệt qua tham số `mode`:

- `mode: 'runtime'` (chế độ runtime): Dùng cho giai đoạn thực thi thực tế của Flow, các thuộc tính và phương thức trả về dữ liệu thật. Ví dụ:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (chế độ cấu hình): Dùng cho giai đoạn thiết kế và cấu hình Flow, truy cập thuộc tính trả về chuỗi template biến, thuận tiện cho biểu thức và lựa chọn biến. Ví dụ:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Thiết kế chế độ kép này vừa đảm bảo tính khả dụng của dữ liệu khi chạy, vừa thuận tiện cho việc tham chiếu biến và sinh biểu thức khi cấu hình, nâng cao tính linh hoạt và dễ sử dụng của Flow engine.

---

## 🤖 Thông tin Context cho công cụ/mô hình lớn

Trong một số kịch bản (ví dụ chỉnh sửa code RunJS của JS*Model, AI coding), cần để "bên gọi" hiểu được mà không cần thực thi code:

- `ctx` hiện tại có những **năng lực tĩnh** nào (tài liệu API, tham số, ví dụ, link tài liệu, v.v.)
- Giao diện/runtime hiện tại có những **biến tùy chọn** nào (ví dụ "record hiện tại", "record popup hiện tại", v.v., cấu trúc động)
- **Snapshot nhỏ gọn** của môi trường runtime hiện tại (dùng cho prompt)

### 1) `await ctx.getApiInfos(options?)` (thông tin API tĩnh)

### 2) `await ctx.getVarInfos(options?)` (thông tin cấu trúc biến)

- Xây dựng cấu trúc biến dựa trên `defineProperty(...).meta` (bao gồm meta factory)
- Hỗ trợ cắt giảm `path` và kiểm soát độ sâu `maxDepth`
- Chỉ mở rộng xuống khi cần

Tham số thường dùng:

- `maxDepth`: Số tầng mở rộng tối đa (mặc định 3)
- `path: string | string[]`: Cắt giảm, chỉ xuất subtree theo path chỉ định

### 3) `await ctx.getEnvInfos()` (snapshot môi trường runtime)

Cấu trúc node (đơn giản hóa):

```ts
type EnvNode = {
  description?: string;
  getVar?: string; // Có thể dùng trực tiếp cho await ctx.getVar(getVar), bắt đầu bằng "ctx."
  value?: any; // Giá trị tĩnh đã được giải quyết/có thể serialize
  properties?: Record<string, EnvNode>;
};
```
