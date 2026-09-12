---
title: "Quản lý Workflow"
description: "Skill quản lý Workflow dùng để tạo, chỉnh sửa, kích hoạt và chẩn đoán Workflow của NocoBase."
keywords: "AI Builder,Workflow,Trigger,Node,Phê duyệt,Tự động hóa"
---

# Quản lý Workflow

:::tip Điều kiện tiên quyết

Trước khi đọc trang này, vui lòng đảm bảo bạn đã cài đặt NocoBase CLI và hoàn thành khởi tạo theo [Bắt đầu nhanh với AI Builder](./index.md).

:::

## Giới thiệu

Skill quản lý Workflow dùng để tạo, chỉnh sửa, kích hoạt và chẩn đoán Workflow của NocoBase — bao quát toàn bộ vòng đời sử dụng Workflow từ chọn trigger, xây dựng chuỗi Node đến điều tra kết quả thực thi.


## Phạm vi năng lực

Có thể làm:

- Tạo Workflow: chọn kiểu trigger, thêm từng Node xử lý
- Chỉnh sửa Workflow: sửa cấu hình trigger, thêm/xóa/sửa Node, di chuyển và sao chép Node
- Quản lý phiên bản: phiên bản đã thực thi sẽ tự động tạo revision mới, không ảnh hưởng đến lịch sử
- Kích hoạt và thực thi Workflow thủ công
- Chẩn đoán execution thất bại: định vị Node lỗi và thông tin lỗi

Không thể làm:

- Không thể thiết kế mô hình dữ liệu (dùng [Skill mô hình hóa dữ liệu](./data-modeling))
- Không thể cài MCP hoặc xử lý vấn đề môi trường (dùng [Skill quản lý môi trường](./env-bootstrap))
- Không thể xóa toàn bộ Workflow (cần xác nhận riêng biệt do là thao tác rủi ro cao)
- Không thể bịa ra kiểu Node hoặc kiểu trigger không tồn tại

## Ví dụ câu lệnh

### Tình huống A: Tạo Workflow mới

```
Sắp xếp giúp tôi một Workflow tự động trừ tồn kho hàng hóa sau khi tạo Order
```

Skill sẽ xác nhận kiểu trigger và thiết kế chuỗi Node trước, sau khi xác nhận sẽ tạo từng bước.

![20260419234303](https://static-docs.nocobase.com/20260419234303.png)

### Tình huống B: Chỉnh sửa Workflow đã có

```
Trong Workflow tạo Order, thêm một Node thông báo khi tồn kho không đủ, gửi tin nhắn nội bộ cho admin
```

Nếu phiên bản hiện tại đã từng được thực thi, sẽ tạo revision mới trước khi chỉnh sửa, không ảnh hưởng đến lịch sử thực thi.

![20260419234419](https://static-docs.nocobase.com/20260419234419.png)

### Tình huống C: Chẩn đoán execution thất bại

```
Workflow trừ tồn kho khi tạo Order vừa rồi đã thực thi thất bại, xem giúp tôi vấn đề ở đâu
```

Sẽ tìm execution thất bại gần nhất, định vị Node lỗi và thông tin lỗi, đưa ra gợi ý sửa chữa.

![20260419234532](https://static-docs.nocobase.com/20260419234532.png)

### Tình huống D: Phân tích hoặc tóm tắt logic Workflow

```
Phân tích giúp tôi logic xử lý của Workflow "Trừ tồn kho hàng hóa khi tạo Order"
```

Output:

```markdown
# Phân tích Workflow: Trừ tồn kho hàng hóa khi tạo Order

## Tổng quan Workflow
**Tên Workflow:** Trừ tồn kho hàng hóa khi tạo Order

### Trigger
- **Kiểu:** Sự kiện sau Action (Action)
- **Điều kiện kích hoạt:** Khi Collection `orders` thực thi Action "create" sẽ kích hoạt (kích hoạt toàn cục).
- **Dữ liệu liên quan:** Mang theo dữ liệu liên kết `details` (chi tiết Order) khi kích hoạt.
- **Chế độ thực thi:** Bất đồng bộ

---

### Chuỗi thực thi Node

**[Trigger] Tạo Order**
        │
        ▼
**[1] Lặp chi tiết Order (Loop)**
    * **Mục tiêu:** `{{$context.data.details}}`
    * *Thao tác: với mỗi mục chi tiết thực thi các bước sau:*
        │
        ▼
    **branchIndex=0 (thân loop)**
        │
        ▼
    **[2] Truy vấn tồn kho hàng hóa (Query)**
    * **Collection:** `products`
    * **Điều kiện lọc:** `id = {{$scopes.5u6lsjzf8vh.item.productId}}`
        │
        ▼
    **[3] Kiểm tra tồn kho có đủ không (Condition)**
    * **Engine:** `formula.js`
    * **Biểu thức:** `{{$jobsMapByNodeKey.n6rf8lf2lum.inventory}} < {{$scopes.5u6lsjzf8vh.item.quantity}}`
        │
        ├── **YES (branchIndex=1, tồn kho không đủ, điều kiện là TRUE):**
        │   ▼
        │   **[4] Thông báo cho super admin (Notification)**
        │   *Gửi thông báo cho user vai trò root, nội dung gồm:*
        │   *Tên hàng hóa, ID hàng hóa, tồn kho hiện tại, số lượng cần của Order.*
        │
        └── **NO (branchIndex=0, tồn kho đủ, nhánh trống)**
        │
        ▼
    **[5] Trừ tồn kho (SQL)**
    * **Câu lệnh SQL:** `UPDATE products SET inventory = inventory - :quantity`

---

### Giải thích logic chính

| Giai đoạn | Mô tả |
| :--- | :--- |
| **Trigger** | Khi tạo Order, hệ thống mang theo danh sách chi tiết Order đầy đủ vào Workflow. |
| **Loop** | Xử lý từng dòng chi tiết, mỗi dòng tương ứng một hàng hóa và số lượng mua. |
| **Query** | Tìm tồn kho hiện tại của hàng hóa đó qua `productId`. |
| **Phán đoán** | Xác định `inventory < quantity` có đúng không (tức tồn kho có không đủ không). |
| **Thông báo** | Nếu tồn kho không đủ, gửi tin nhắn nội bộ nhắc nhở cho user có vai trò `root`. |
| **Trừ kho** | Cập nhật trực tiếp tồn kho qua SQL; do các nhánh hợp lại, dù tồn kho có đủ hay không cũng đều thực thi trừ kho. |

---

### ⚠️ Vấn đề thiết kế tiềm ẩn

`downstreamId` của Node Condition trỏ đến Node "Trừ tồn kho", nghĩa là dù đi nhánh nào (tồn kho đủ hay không đủ), cuối cùng đều hợp lại để thực thi Action trừ kho. Hành vi thực tế như sau:

- **Tồn kho đủ** $\rightarrow$ Trừ tồn kho trực tiếp (luồng bình thường). ✓
- **Tồn kho không đủ** $\rightarrow$ Thông báo cho admin trước, **sau đó vẫn thực thi trừ kho** (có thể dẫn đến tồn kho âm).

**Phân tích:** Thiết kế này thuộc mô hình "cho phép bán quá tồn kho và phát cảnh báo", cũng có thể là một sơ suất logic (ý ban đầu là chặn trừ kho khi tồn kho không đủ). Cần xác nhận thêm ý đồ thiết kế với bộ phận nghiệp vụ.

---

### Trạng thái hiện tại

- **Trạng thái kích hoạt:** `false` (đã tắt)
- **Lịch sử thực thi:** Đã thực thi 1 lần.
- **Quản lý phiên bản:** Phiên bản hiện tại đang ở trạng thái đóng băng, nếu cần sửa phải tạo phiên bản mới trước.
```

## Câu hỏi thường gặp

**Tại sao Workflow đã tạo mà không trigger?**

Workflow vừa tạo mặc định ở trạng thái tắt (`enabled: false`). Cần xác nhận cấu hình trigger đúng rồi mới kích hoạt thủ công.

**Sau khi sửa Workflow, lịch sử thực thi có bị ảnh hưởng không?**

Không. Nếu phiên bản hiện tại đã có lịch sử thực thi, Skill sẽ tự động tạo revision mới, lịch sử thực thi gắn với phiên bản cũ và không bị ảnh hưởng.

## Liên kết liên quan

- [Tổng quan về AI Builder](./index.md) — Tổng quan và cách cài đặt tất cả Skills của AI Builder
- [Mô hình hóa dữ liệu](./data-modeling) — Sử dụng AI để tạo và quản lý bảng dữ liệu
- [Quản lý môi trường](./env-bootstrap) — Kiểm tra môi trường, cài đặt triển khai và chẩn đoán sự cố
