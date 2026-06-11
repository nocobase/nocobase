---
title: "Quản lý phiên bản"
description: "Skill Quản lý phiên bản (nocobase-revision) tạo phiên bản ứng dụng có thể khôi phục sau khi AI Builder hoàn thành các mốc."
keywords: "AI Builder,quản lý phiên bản,nocobase-revision,nb revision create,khôi phục phiên bản"
---

# Quản lý phiên bản

:::tip Điều kiện tiên quyết

- Trước khi đọc trang này, hãy cài đặt NocoBase CLI và hoàn tất khởi tạo theo [Bắt đầu nhanh AI Builder](./index.md)
- Bật hai plugin Backup Management và Version Control
- Bản Community và Standard không bao gồm plugin Version Control. Nếu chỉ cần giữ một điểm quay lại trước thay đổi quan trọng, hãy dùng [Backup Management](../ops-management/backup-manager/index.mdx)

:::

## Giới thiệu

Skill Quản lý phiên bản (`nocobase-revision`) tạo một phiên bản ứng dụng có thể khôi phục sau khi AI Builder hoàn thành một mốc có ý nghĩa. Ví dụ, sau khi tạo xong một trang, tạo một nhóm collection hoặc cấu hình một workflow, AI có thể chạy `nb revision create` để lưu trạng thái hiện tại.

Skill này không tạo phiên bản cho từng thay đổi field. Theo mặc định, chỉ khi một mốc rõ ràng đã hoàn thành và được kiểm tra, phiên bản mới được lưu. Nhờ vậy danh sách phiên bản dễ đọc hơn và điểm khôi phục cũng dễ chọn hơn.

Để xem danh sách phiên bản, tạo thủ công, khôi phục và cấu hình giữ lại phiên bản, hãy đọc [hướng dẫn plugin Version Control](../ops-management/version-control/index.md).

## Phạm vi khả năng

Có thể làm:

- Tạo phiên bản sau khi một mốc xây dựng đã hoàn thành và được kiểm tra
- Ghi mô tả ngắn gọn cho biết nội dung đã được lưu
- Tạo phiên bản bằng môi trường CLI hiện tại

Không thể làm:

- Thay thế năng lực lưu và khôi phục nền tảng của plugin Backup Management
- Tạo phiên bản khi plugin Version Control chưa được bật
- Tự động khôi phục về một phiên bản. Hãy dùng [plugin Version Control](../ops-management/version-control/index.md) để khôi phục

## Ví dụ prompt

### Tình huống A: Lưu cấu hình trang đã hoàn thành

```text
Lưu kết quả xây dựng hiện tại thành phiên bản: đã hoàn thành trang quản lý khách hàng, vùng lọc và form chỉnh sửa
```

Skill sẽ chỉnh mô tả thành ghi chú phiên bản ngắn gọn rồi tạo phiên bản.

Chế độ dòng lệnh:

```bash
nb revision create "Đã hoàn thành trang quản lý khách hàng, vùng lọc và form chỉnh sửa"
```

### Tình huống B: Lưu mô hình dữ liệu và workflow

```text
Các collection nhà cung cấp và workflow phê duyệt mua hàng đã được kiểm tra. Tạo giúp tôi một phiên bản.
```

Phù hợp với công việc kết hợp nhiều khả năng. Ví dụ, tạo collection bằng [Mô hình hóa dữ liệu](./data-modeling), cấu hình quy trình phê duyệt bằng [Quản lý Workflow](./workflow), kiểm tra kết quả rồi lưu phiên bản.

### Tình huống C: Tạo phiên bản trong môi trường chỉ định

```text
Trong môi trường dev, lưu một phiên bản: đã hoàn thành trang quản lý ticket và field SLA
```

Nếu môi trường chỉ định không phải môi trường CLI hiện tại, Skill sẽ xác nhận mục tiêu trước để tránh lưu phiên bản vào nhầm ứng dụng.

Chế độ dòng lệnh:

```bash
nb revision create --env dev --yes "Đã hoàn thành trang quản lý ticket và field SLA"
```

## Cách viết mô tả phiên bản

Mô tả phiên bản nên nói rõ “đã hoàn thành gì”, thay vì chỉ dùng một nhãn mơ hồ.

Khuyến nghị:

- `Hoàn thành sổ khách hàng, trang chi tiết và luồng gửi phê duyệt`
- `Hoàn thành collection nhà cung cấp, form yêu cầu mua hàng và workflow phê duyệt`
- `Completed customer detail page, edit form, and submission workflow wiring`

Không khuyến nghị:

- `snapshot`
- `backup`
- `test`
- `version 2`
- Chỉ có ngày hoặc timestamp

Ngoài ra, không đưa token, URL, mật khẩu hoặc thông tin nhạy cảm khác vào mô tả. Mô tả sẽ xuất hiện trong danh sách phiên bản, nên cần rõ ràng, dễ đọc và thuận tiện cho kiểm toán.

## FAQ

**Khi nào nên tạo phiên bản?**

Sau một mốc có thể kiểm tra độc lập. Ví dụ, trang đã mở và chỉnh sửa bình thường, quan hệ giữa các collection đã được kiểm tra, hoặc workflow đã lưu và chuỗi node đã được rà soát.

**Vì sao không tạo phiên bản sau mỗi lần AI chỉnh sửa?**

Quá nhiều phiên bản nhỏ sẽ làm danh sách nhanh chóng khó đọc. Thông thường, một phiên bản nên là điểm có thể khôi phục để tiếp tục làm việc, không chỉ là một lần đổi tên field hoặc đổi vị trí nút.

**Có cần kiểm tra kết quả trước khi tạo phiên bản không?**

Có. Skill Quản lý phiên bản dùng để lưu kết quả đã hoàn thành và được kiểm tra. Nếu trang vẫn lỗi hoặc workflow chưa xác nhận, hãy để AI sửa và kiểm tra trước.

**Sau khi tạo thì khôi phục ở đâu?**

Khôi phục trong danh sách phiên bản của plugin Version Control. Việc khôi phục sẽ ghi đè cấu hình ứng dụng hiện tại và dữ liệu được bao gồm trong phiên bản đó. Trước khi thao tác, hãy đọc [hướng dẫn plugin Version Control](../ops-management/version-control/index.md).

## Liên kết liên quan

- [Hướng dẫn plugin Version Control](../ops-management/version-control/index.md) — tạo thủ công, khôi phục và cấu hình quy tắc phiên bản
- [Backup Management](../ops-management/backup-manager/index.mdx) — năng lực nền tảng mà Version Control phụ thuộc
- [Tổng quan AI Builder](./index.md) — tổng quan và cài đặt tất cả AI Builder Skills
- [Quản lý phát hành](./publish.md) — phát hành đa môi trường, sao lưu khôi phục và di chuyển
