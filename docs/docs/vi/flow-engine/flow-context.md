:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/flow-engine/flow-context).
:::

# Tổng quan về hệ thống ngữ cảnh

Hệ thống ngữ cảnh của luồng công việc NocoBase được chia thành ba lớp, tương ứng với các phạm vi khác nhau. Sử dụng hợp lý có thể thực hiện chia sẻ và cô lập linh hoạt các dịch vụ, cấu hình và dữ liệu, nâng cao khả năng bảo trì và mở rộng nghiệp vụ.

- **FlowEngineContext (Ngữ cảnh toàn cục)**: Duy nhất toàn cục, tất cả các mô hình và luồng công việc đều có thể truy cập, phù hợp để đăng ký các dịch vụ, cấu hình toàn cục, v.v.
- **FlowModelContext (Ngữ cảnh mô hình)**: Dùng để chia sẻ ngữ cảnh bên trong cây mô hình, mô hình con tự động ủy quyền cho ngữ cảnh mô hình cha, hỗ trợ ghi đè cùng tên, phù hợp để cô lập logic và dữ liệu ở cấp độ mô hình.
- **FlowRuntimeContext (Ngữ cảnh thực thi luồng)**: Được tạo mỗi khi luồng thực thi, xuyên suốt toàn bộ chu kỳ chạy của luồng, phù hợp để truyền dữ liệu, lưu trữ biến, ghi lại trạng thái chạy, v.v. trong luồng. Hỗ trợ hai chế độ `mode: 'runtime' | 'settings'`, tương ứng với trạng thái thực thi và trạng thái cấu hình.

Tất cả `FlowEngineContext` (Ngữ cảnh toàn cục), `FlowModelContext` (Ngữ cảnh mô hình), `FlowRuntimeContext` (Ngữ cảnh thực thi luồng), v.v., đều là các lớp con hoặc thực thể của `FlowContext`.

---

## 🗂️ Sơ đồ cấu trúc tầng thứ

```text
FlowEngineContext (Ngữ cảnh toàn cục)
│
├── FlowModelContext (Ngữ cảnh mô hình)
│     ├── FlowModelContext con (Mô hình con)
│     │     ├── FlowRuntimeContext (Ngữ cảnh thực thi luồng)
│     │     └── FlowRuntimeContext (Ngữ cảnh thực thi luồng)
│     └── FlowRuntimeContext (Ngữ cảnh thực thi luồng)
│
├── FlowModelContext (Ngữ cảnh mô hình)
│     └── FlowRuntimeContext (Ngữ cảnh thực thi luồng)
│
└── FlowModelContext (Ngữ cảnh mô hình)
      ├── FlowModelContext con (Mô hình con)
      │     └── FlowRuntimeContext (Ngữ cảnh thực thi luồng)
      └── FlowRuntimeContext (Ngữ cảnh thực thi luồng)
```

- `FlowModelContext` thông qua cơ chế ủy quyền (delegate) có thể truy cập các thuộc tính và phương thức của `FlowEngineContext`, thực hiện chia sẻ năng lực toàn cục.
- `FlowModelContext` của mô hình con thông qua cơ chế ủy quyền (delegate) có thể truy cập ngữ cảnh của mô hình cha (quan hệ đồng bộ), hỗ trợ ghi đè cùng tên.
- Mô hình cha con không đồng bộ sẽ không thiết lập quan hệ ủy quyền (delegate), tránh gây ô nhiễm trạng thái.
- `FlowRuntimeContext` luôn truy cập `FlowModelContext` tương ứng thông qua cơ chế ủy quyền (delegate), nhưng không truyền ngược lên trên.

---

## 🧭 Trạng thái thực thi và trạng thái cấu hình (mode)

`FlowRuntimeContext` hỗ trợ hai chế độ, được phân biệt bằng tham số `mode`:

- `mode: 'runtime'` (Trạng thái thực thi): Dùng cho giai đoạn thực thi thực tế của luồng, các thuộc tính và phương thức trả về dữ liệu thực. Ví dụ:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (Trạng thái cấu hình): Dùng cho giai đoạn thiết kế và cấu hình luồng, truy cập thuộc tính trả về chuỗi mẫu biến, thuận tiện cho việc chọn biểu thức và biến. Ví dụ:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Thiết kế chế độ kép này vừa đảm bảo tính khả dụng của dữ liệu khi thực thi, vừa thuận tiện cho việc tham chiếu biến và tạo biểu thức khi cấu hình, nâng cao tính linh hoạt và dễ sử dụng của luồng công việc.

---

## 🤖 Thông tin ngữ cảnh hướng tới công cụ/mô hình lớn

Trong một số kịch bản (ví dụ: chỉnh sửa mã RunJS của JS*Model, AI coding), cần để “bên gọi” hiểu được các thông tin sau mà không cần thực thi mã:

- Hiện tại dưới `ctx` có những **năng lực tĩnh** nào (tài liệu API, tham số, ví dụ, liên kết tài liệu, v.v.)
- Giao diện/trạng thái thực thi hiện tại có những **biến tùy chọn** nào (ví dụ: “bản ghi hiện tại”, “bản ghi cửa sổ bật lên hiện tại” và các cấu trúc động khác)
- **Bản sao nhanh dung lượng nhỏ** của môi trường thực thi hiện tại (dùng cho prompt)

### 1) `await ctx.getApiInfos(options?)` (Thông tin API tĩnh)

### 2) `await ctx.getVarInfos(options?)` (Thông tin cấu trúc biến)

- Xây dựng cấu trúc biến dựa trên `defineProperty(...).meta` (bao gồm meta factory)
- Hỗ trợ cắt tỉa `path` và kiểm soát độ sâu `maxDepth`
- Chỉ mở rộng xuống dưới khi cần thiết

Tham số thường dùng:

- `maxDepth`: Cấp độ mở rộng tối đa (mặc định là 3)
- `path: string | string[]`: Cắt tỉa, chỉ xuất cây con của đường dẫn được chỉ định

### 3) `await ctx.getEnvInfos()` (Bản sao nhanh môi trường thực thi)

Cấu trúc nút (rút gọn):

```ts
type EnvNode = {
  description?: string;
  getVar?: string; // Có thể dùng trực tiếp cho await ctx.getVar(getVar), bắt đầu bằng "ctx."
  value?: any; // Giá trị tĩnh đã phân giải/có thể tuần tự hóa
  properties?: Record<string, EnvNode>;
};
```