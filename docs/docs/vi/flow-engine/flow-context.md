
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tổng quan về Hệ thống Ngữ cảnh

Hệ thống ngữ cảnh của công cụ **luồng công việc** NocoBase được chia thành ba lớp, mỗi lớp tương ứng với một phạm vi khác nhau. Việc sử dụng hợp lý giúp chia sẻ và cô lập linh hoạt các dịch vụ, cấu hình và dữ liệu, từ đó nâng cao khả năng bảo trì và mở rộng của hệ thống.

- **FlowEngineContext (Ngữ cảnh Toàn cục)**: Duy nhất trên toàn hệ thống, tất cả các mô hình và **luồng công việc** đều có thể truy cập. Thích hợp để đăng ký các dịch vụ, cấu hình toàn cục, v.v.
- **FlowModelContext (Ngữ cảnh Mô hình)**: Dùng để chia sẻ ngữ cảnh bên trong cây mô hình. Các mô hình con tự động ủy quyền cho ngữ cảnh của mô hình cha, hỗ trợ ghi đè tên trùng lặp. Thích hợp để cô lập logic và dữ liệu ở cấp độ mô hình.
- **FlowRuntimeContext (Ngữ cảnh Thời gian Chạy của Luồng công việc)**: Được tạo mỗi khi một **luồng công việc** được thực thi và tồn tại trong suốt chu kỳ chạy của **luồng công việc**. Thích hợp để truyền dữ liệu, lưu trữ biến và ghi lại trạng thái chạy trong **luồng công việc**. Hỗ trợ hai chế độ: `mode: 'runtime' | 'settings'`, tương ứng với trạng thái chạy và trạng thái cấu hình.

Tất cả `FlowEngineContext` (Ngữ cảnh Toàn cục), `FlowModelContext` (Ngữ cảnh Mô hình), `FlowRuntimeContext` (Ngữ cảnh Thời gian Chạy của Luồng công việc), v.v., đều là các lớp con hoặc thể hiện của `FlowContext`.

---

## 🗂️ Sơ đồ Phân cấp

```text
FlowEngineContext (Ngữ cảnh Toàn cục)
│
├── FlowModelContext (Ngữ cảnh Mô hình)
│     ├── 子 FlowModelContext (Mô hình con)
│     │     ├── FlowRuntimeContext (Ngữ cảnh Thời gian Chạy của Luồng công việc)
│     │     └── FlowRuntimeContext (Ngữ cảnh Thời gian Chạy của Luồng công việc)
│     └── FlowRuntimeContext (Ngữ cảnh Thời gian Chạy của Luồng công việc)
│
├── FlowModelContext (Ngữ cảnh Mô hình)
│     └── FlowRuntimeContext (Ngữ cảnh Thời gian Chạy của Luồng công việc)
│
└── FlowModelContext (Ngữ cảnh Mô hình)
      ├── 子 FlowModelContext (Mô hình con)
      │     └── FlowRuntimeContext (Ngữ cảnh Thời gian Chạy của Luồng công việc)
      └── FlowRuntimeContext (Ngữ cảnh Thời gian Chạy của Luồng công việc)
```

- `FlowModelContext` có thể truy cập các thuộc tính và phương thức của `FlowEngineContext` thông qua cơ chế ủy quyền (delegate), cho phép chia sẻ các khả năng toàn cục.
- `FlowModelContext` của mô hình con có thể truy cập ngữ cảnh của mô hình cha (quan hệ đồng bộ) thông qua cơ chế ủy quyền (delegate), hỗ trợ ghi đè tên trùng lặp.
- Các mô hình cha-con không đồng bộ sẽ không thiết lập quan hệ ủy quyền (delegate) để tránh làm ô nhiễm trạng thái.
- `FlowRuntimeContext` luôn truy cập `FlowModelContext` tương ứng của nó thông qua cơ chế ủy quyền (delegate), nhưng không truyền ngược lên trên.

## 🧭 Chế độ Thời gian Chạy và Cấu hình (mode)

`FlowRuntimeContext` hỗ trợ hai chế độ, được phân biệt bằng tham số `mode`:

- `mode: 'runtime'` (Chế độ thời gian chạy): Được sử dụng trong giai đoạn thực thi thực tế của **luồng công việc**. Các thuộc tính và phương thức trả về dữ liệu thực. Ví dụ:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (Chế độ cấu hình): Được sử dụng trong giai đoạn thiết kế và cấu hình **luồng công việc**. Việc truy cập thuộc tính trả về một chuỗi mẫu biến, tạo điều kiện thuận lợi cho việc chọn biểu thức và biến. Ví dụ:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Thiết kế hai chế độ này vừa đảm bảo tính khả dụng của dữ liệu trong thời gian chạy, vừa tạo điều kiện thuận lợi cho việc tham chiếu biến và tạo biểu thức trong quá trình cấu hình, từ đó nâng cao tính linh hoạt và dễ sử dụng của công cụ **luồng công việc**.