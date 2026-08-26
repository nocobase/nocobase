---
title: "Giải pháp"
description: "Skill giải pháp dùng để xây dựng hàng loạt ứng dụng NocoBase từ file cấu hình YAML."
keywords: "AI Builder,Giải pháp,Xây dựng ứng dụng,YAML,Tạo bảng hàng loạt,Dashboard"
---

# Giải pháp

:::tip Điều kiện tiên quyết

Trước khi đọc trang này, vui lòng đảm bảo bạn đã cài đặt NocoBase CLI và hoàn thành khởi tạo theo [Bắt đầu nhanh với AI Builder](./index.md).

:::

:::warning Lưu ý

Tính năng giải pháp hiện vẫn đang trong giai đoạn test, độ ổn định có hạn, chỉ phù hợp để trải nghiệm.

:::

## Giới thiệu

Skill giải pháp dùng để xây dựng hàng loạt ứng dụng NocoBase từ file cấu hình YAML — tạo bảng dữ liệu, cấu hình trang, sinh dashboard và biểu đồ trong một lần.

Phù hợp cho các tình huống cần xây dựng nhanh nguyên cả hệ thống nghiệp vụ, ví dụ CRM, quản lý ticket, ERP...


## Phạm vi năng lực

Có thể làm:

- Thiết kế giải pháp ứng dụng hoàn chỉnh dựa trên mô tả nhu cầu, gồm bảng dữ liệu, trang và dashboard
- Tạo bảng dữ liệu và trang hàng loạt qua `structure.yaml`
- Cấu hình popup và biểu mẫu qua `enhance.yaml`
- Tự động sinh dashboard, gồm KPI card và biểu đồ
- Cập nhật incremental — luôn dùng chế độ `--force`, không phá hủy dữ liệu đã có

Không thể làm:

- Không phù hợp để tinh chỉnh từng Field (dùng [Skill mô hình hóa dữ liệu](./data-modeling) phù hợp hơn)
- Không thể di chuyển hoặc import dữ liệu
- Không thể cấu hình quyền và Workflow (cần kết hợp với các Skill khác)

## Ví dụ câu lệnh

### Tình huống A: Xây dựng hệ thống hoàn chỉnh

```
Hãy dùng skill nocobase-dsl-reconciler xây dựng cho tôi một hệ thống quản lý ticket, gồm dashboard, danh sách ticket, quản lý người dùng, cấu hình SLA
```

Skill sẽ output phương án thiết kế trước — liệt kê tất cả bảng dữ liệu và cấu trúc trang, sau khi xác nhận sẽ thực thi xây dựng theo từng vòng.

![Phương án thiết kế](https://static-docs.nocobase.com/20260420100420.png)

![Hiệu quả xây dựng](https://static-docs.nocobase.com/20260420100450.png)

### Tình huống B: Sửa module đã có

```
Hãy dùng skill nocobase-dsl-reconciler thêm một Field dropdown "Mức độ khẩn cấp" vào bảng ticket, các tùy chọn từ P0 đến P3
```

Sửa `structure.yaml` rồi cập nhật bằng `--force` là được.

### Tình huống C: Tùy chỉnh biểu đồ

```
Hãy dùng skill nocobase-dsl-reconciler đổi "Ticket mới trong tuần" trên dashboard thành "Ticket mới trong tháng"
```

![Tùy chỉnh biểu đồ](https://static-docs.nocobase.com/20260420100517.png)

Chỉnh sửa file SQL tương ứng, đổi phạm vi thời gian từ `'7 days'` thành `'1 month'`, sau đó chạy `--verify-sql` để kiểm tra.

## Câu hỏi thường gặp

**SQL kiểm tra thất bại thì sao?**

NocoBase dùng PostgreSQL, tên cột phải dùng camelCase và đặt trong dấu ngoặc kép (ví dụ `"createdAt"`), hàm ngày tháng dùng `NOW() - '7 days'::interval` chứ không phải cú pháp SQLite. Chạy `--verify-sql` có thể phát hiện các vấn đề này trước khi deploy.

**Sau khi xây dựng muốn tinh chỉnh một Field thì sao?**

Toàn bộ việc xây dựng dùng Skill giải pháp, sau đó tinh chỉnh dùng [Skill mô hình hóa dữ liệu](./data-modeling) hoặc [Skill cấu hình giao diện](./ui-builder) sẽ linh hoạt hơn.

## Liên kết liên quan

- [Tổng quan về AI Builder](./index.md) — Tổng quan và cách cài đặt tất cả Skills của AI Builder
- [Mô hình hóa dữ liệu](./data-modeling) — Tinh chỉnh từng Field bằng Skill mô hình hóa dữ liệu
- [Cấu hình giao diện](./ui-builder) — Tinh chỉnh trang và bố cục Block sau khi xây dựng
