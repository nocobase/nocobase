---
title: "Thực hành: Phát triển plugin watermark"
description: "Phát triển một plugin watermark NocoBase chỉ với một câu prompt: phủ watermark lên trang, kiểm tra chống can thiệp, tham số watermark có thể cấu hình."
keywords: "AI Development,plugin watermark,NocoBase plugin,case thực hành,lập trình AI"
---

# Thực hành: Phát triển plugin watermark

Case này trình bày cách dùng một câu để AI phát triển một plugin watermark NocoBase hoàn chỉnh — từ việc tạo scaffold đến enable và kiểm tra, toàn bộ quá trình do AI hoàn thành.

## Hiệu ứng cuối cùng

Sau khi enable plugin:

- Trên các trang NocoBase phủ watermark bán trong suốt, hiển thị tên Người dùng đang đăng nhập
- Watermark không thể bị xóa bằng cách xóa DOM — kiểm tra định kỳ sẽ tự động sinh lại
- Trong "Cấu hình plugin" có thể điều chỉnh nội dung watermark, độ trong suốt và cỡ chữ

![watermark plugin](https://static-docs.nocobase.com/20260416170645.png)

## Điều kiện tiên quyết

:::tip Đọc trước

- [NocoBase CLI](../ai/quick-start.md) — Cài đặt và khởi động NocoBase
- [Bắt đầu nhanh với AI Development Plugin](./index.md) — Cài đặt Skills

:::

Đảm bảo bạn đã:

1. Có một môi trường phát triển NocoBase đang chạy (NocoBase CLI khi khởi tạo sẽ tự động cài đặt NocoBase Skills)
2. Đã mở editor hỗ trợ AI Agent (như Claude Code, Codex, Cursor, v.v.)

:::warning Lưu ý

- NocoBase đang chuyển từ `client` (v1) sang `client-v2`, hiện `client-v2` vẫn đang trong quá trình phát triển. Mã client do AI Development sinh ra dựa trên `client-v2`, chỉ có thể dùng dưới đường dẫn `/v2/`, dùng để trải nghiệm trước, không khuyến nghị dùng trực tiếp trong môi trường production.
- Mã do AI sinh ra không phải lúc nào cũng đúng 100%, khuyến nghị review trước khi enable. Nếu gặp vấn đề khi runtime, có thể gửi thông báo lỗi cho AI để nó tiếp tục kiểm tra và sửa — thường vài lượt trao đổi là giải quyết được.

:::

## Bắt đầu

Tại thư mục gốc của dự án NocoBase của bạn, gửi prompt dưới đây cho AI:

```
Hãy dùng nocobase-plugin-development skill để phát triển một plugin watermark cho NocoBase,
yêu cầu: phủ watermark bán trong suốt lên trang, hiển thị tên Người dùng đang đăng nhập, ngăn chặn rò rỉ qua chụp màn hình.
Định kỳ kiểm tra DOM của watermark có bị xóa hay không, nếu bị xóa thì sinh lại.
Trong trang cài đặt plugin hỗ trợ cấu hình nội dung watermark, độ trong suốt và cỡ chữ.
Tên plugin là @my-project/plugin-watermark
```

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/nocobase-plugin-dev-compressed.mp4" type="video/mp4">
</video>

## AI đã làm gì

Sau khi nhận yêu cầu, AI sẽ tự động thực hiện theo các bước sau:

### 1. Phân tích nhu cầu và xác nhận kế hoạch

AI sẽ phân tích trước plugin này cần những extension point nào của NocoBase, sau đó đưa cho bạn một kế hoạch phát triển. Ví dụ:

> **Phía server:**
> - Một bảng dữ liệu `watermarkSettings`, lưu cấu hình watermark (nội dung, độ trong suốt, cỡ chữ)
> - Một API tùy chỉnh, đọc/ghi cấu hình watermark
> - Cấu hình ACL, Người dùng đã đăng nhập có thể đọc, admin có thể ghi
>
> **Phía client:**
> - Trang cài đặt plugin, dùng form để cấu hình tham số watermark
> - Logic render watermark, đọc cấu hình rồi phủ watermark lên trang
> - Kiểm tra chống can thiệp, timer giám sát DOM watermark

Sau khi xác nhận kế hoạch, AI bắt đầu viết code.

<!-- Cần một ảnh chụp màn hình terminal AI xuất ra kế hoạch phát triển -->

### 2. Tạo scaffold plugin

```bash
yarn pm create @my-project/plugin-watermark
```

AI đã sinh cấu trúc thư mục plugin chuẩn dưới `packages/plugins/@my-project/plugin-watermark/`.

### 3. Viết code phía server

AI sẽ sinh các file sau:

- **Định nghĩa bảng dữ liệu** — Bảng `watermarkSettings`, bao gồm các Field `text`, `opacity`, `fontSize`
- **API tùy chỉnh** — Interface đọc và cập nhật cấu hình watermark
- **Cấu hình ACL** — Người dùng đã đăng nhập có thể đọc cấu hình watermark, admin có thể sửa

<!-- Cần một ảnh chụp màn hình terminal trình bày quá trình AI sinh code phía server -->

### 4. Viết code phía client

- **Trang cài đặt plugin** — Một form Ant Design, cấu hình nội dung watermark, độ trong suốt (slider), cỡ chữ
- **Render watermark** — Tạo lớp phủ canvas/div toàn màn hình trên trang, hiển thị tên Người dùng đang đăng nhập
- **Kiểm tra chống can thiệp** — `MutationObserver` + timer kép, DOM bị xóa sẽ lập tức sinh lại

<!-- Cần một ảnh chụp màn hình terminal trình bày quá trình AI sinh code phía client -->

### 5. Quốc tế hóa

AI tự động sinh language pack tiếng Trung và tiếng Anh, bạn không cần thao tác thêm:

- `src/locale/zh-CN.json` — Bản dịch tiếng Trung
- `src/locale/en-US.json` — Bản dịch tiếng Anh

### 6. Enable plugin

```bash
yarn pm enable @my-project/plugin-watermark
```

Sau khi enable, mở trang NocoBase, bạn sẽ thấy watermark phủ lên trên nội dung.

<!-- Cần một video: từ nhập prompt → AI sinh code → enable plugin → trang xuất hiện watermark → mở trang cài đặt điều chỉnh tham số → watermark thay đổi theo, là toàn bộ luồng -->

## Toàn bộ quá trình mất bao lâu

Từ lúc nhập prompt đến lúc plugin có thể dùng, khoảng **3-5 phút**. AI đã hoàn thành các công việc sau:

| Công việc                  | Phát triển thủ công ước tính | AI hoàn thành |
| -------------------------- | --------------------------- | ------------- |
| Tạo scaffold               | 2 phút                      | Tự động       |
| Bảng dữ liệu + API         | 20 phút                     | Tự động       |
| Trang cài đặt plugin       | 30 phút                     | Tự động       |
| Render watermark + chống can thiệp | 40 phút             | Tự động       |
| Cấu hình ACL               | 10 phút                     | Tự động       |
| Quốc tế hóa                | 15 phút                     | Tự động       |
| **Tổng cộng**              | **~2 giờ**                  | **~5 phút**   |


## Muốn làm thêm nhiều plugin nữa?

Plugin watermark chủ yếu liên quan đến render frontend và lưu trữ backend đơn giản. Nếu bạn muốn tìm hiểu AI còn có thể giúp bạn làm những việc gì — như Block tùy chỉnh, liên kết bảng dữ liệu phức tạp, mở rộng workflow, v.v. — có thể xem [Các khả năng được hỗ trợ](./capabilities).

## Liên kết liên quan

- [Bắt đầu nhanh với AI Development Plugin](./index.md) — Bắt đầu nhanh và tổng quan các khả năng
- [Các khả năng được hỗ trợ](./capabilities) — Tất cả những việc AI có thể giúp bạn, kèm prompt mẫu
- [Phát triển Plugin](../plugin-development/index.md) — Hướng dẫn đầy đủ về phát triển plugin NocoBase
- [NocoBase CLI](../ai/quick-start.md) — Công cụ dòng lệnh để cài đặt và quản lý NocoBase
