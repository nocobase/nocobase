---
title: "Hệ thống quản lý kinh doanh tích hợp - Hướng dẫn cài đặt"
description: "Cài đặt và triển khai Hệ thống quản lý kinh doanh tích hợp: khôi phục một thao tác file backup nbdata qua plugin Backup Manager. Yêu cầu NocoBase v2.1.0-alpha.40 trở lên, PostgreSQL 16; DB_UNDERSCORED không được đặt thành true."
keywords: "Cài đặt Hệ thống quản lý kinh doanh tích hợp, All-in-One, khôi phục backup, Backup Manager, nbdata, PostgreSQL, NocoBase"
---

# Hướng dẫn cài đặt

Hệ thống quản lý kinh doanh tích hợp bao gồm sáu mô-đun: **CRM, Quản lý bán hàng, Help Desk, Quản lý dự án, Quản lý tài sản cố định, Quản lý nhân sự**. Chỉ cần dùng plugin "Backup Manager" tích hợp sẵn trong NocoBase để khôi phục một thao tác file backup `.nbdata` là có đầy đủ dữ liệu.

:::tip Yêu cầu trước

- Đã có một môi trường NocoBase cơ bản đang chạy. Cài đặt hệ thống chính xem [tài liệu cài đặt chính thức](https://docs.nocobase.com/welcome/getting-started/installation)
- Phiên bản NocoBase **v2.1.0-alpha.40 trở lên** (plugin Backup Manager được mở mã nguồn kể từ phiên bản này, bản Community dùng được)
- Đã tải file backup: [nocobase_all_in_one_backup_260521.nbdata](https://static-docs.nocobase.com/nocobase_all_in_one_backup_260521.nbdata)

:::

:::warning Lưu ý

- Giải pháp này được tạo dựa trên **PostgreSQL 16**, môi trường bắt buộc phải là PostgreSQL 16
- **`DB_UNDERSCORED` không được đặt thành `true`** — kiểm tra `docker-compose.yml`, nếu đặt `true` việc khôi phục sẽ thất bại
- **Khôi phục sẽ ghi đè TOÀN BỘ dữ liệu của ứng dụng đích** — nếu môi trường đích đã có dữ liệu, hãy sao lưu ứng dụng hiện tại trước rồi mới thận trọng thực hiện khôi phục

:::

Phiên bản hiện tại triển khai theo dạng **khôi phục backup**, phiên bản sau sẽ chuyển sang migration tăng dần để thuận tiện tích hợp vào hệ thống NocoBase sẵn có.

---

## Các bước thực hiện

### Bước 1: Khởi chạy ứng dụng bằng image `full`

Khuyến nghị mạnh dùng image Docker phiên bản `full`, nó tích hợp sẵn database client và tất cả các chương trình phụ trợ, không cần cấu hình thêm:

```bash
docker pull nocobase/nocobase:alpha-full
```

Sau đó dùng image này để khởi chạy dịch vụ NocoBase.

:::tip

Nếu không dùng image `full`, có thể bạn sẽ phải cài thủ công database client `pg_dump` trong container, quá trình này rườm rà và không ổn định.

:::

### Bước 2: Bật plugin "Backup Manager"

1. Đăng nhập hệ thống NocoBase
2. Vào **Quản lý Plugin**
3. Tìm và kích hoạt plugin **Backup Manager**

### Bước 3: Khôi phục từ file backup cục bộ

1. Sau khi kích hoạt plugin, làm mới trang
2. Vào menu bên trái **Quản trị hệ thống / Backup Manager**

   ![Giao diện chính của Backup Manager](https://static-docs.nocobase.com/202510302154966.png)

3. Nhấn nút **Khôi phục từ backup cục bộ** ở góc phải trên
4. Kéo thả file `nocobase_all_in_one_backup_260521.nbdata` đã tải xuống vào vùng upload

   ![Khôi phục từ tệp sao lưu cục bộ (hộp thoại tải lên)](https://static-docs.nocobase.com/202510302155602.png)

5. Nhấn **Gửi**, chờ khôi phục hoàn tất, thường mất từ vài chục giây đến vài phút

---

## Lưu ý

- **Khả năng tương thích cơ sở dữ liệu** — phiên bản, charset, cấu hình phân biệt chữ hoa thường của PostgreSQL phải khớp với nguồn backup, tên `schema` đặc biệt phải nhất quán
- **Khớp plugin thương mại** — cục bộ phải bật trước tất cả plugin thương mại được dùng trong backup, nếu không việc khôi phục sẽ bị gián đoạn. Plugin thương mại liên quan đến giải pháp tích hợp gồm: Email Manager, Audit Log, AI Employee. Khi bản Community thiếu các plugin này, lối vào chức năng tương ứng sẽ không hiển thị, nhưng không ảnh hưởng các mô-đun khác

---

## Cấu hình bắt buộc sau khi cài đặt

Sau khi khôi phục xong, hệ thống đã mở được, nhưng có hai chỗ cấu hình **đang trỏ về môi trường demo của chúng tôi**, cần chuyển sang của bạn.

### 1. Engine lưu trữ tệp (OSS / cục bộ)

Engine lưu trữ mặc định trong backup demo trỏ về Aliyun OSS dùng cho demo của chúng tôi, Access Key không mở cho bên ngoài, nên mọi thao tác upload qua field đính kèm, template in, avatar AI Employee đều sẽ thất bại.

Thông thường chuyển sang lưu trữ cục bộ là đủ, chỉ khi cần CDN tăng tốc hoặc xử lý file lớn mới dùng OSS của bạn.

**Các bước chuyển:**

1. Vào **Quản lý Plugin / Trình quản lý Tệp** (hoặc truy cập trực tiếp `/admin/settings/file-manager`)

2. **Tùy chọn A — Dùng lưu trữ cục bộ** (đơn giản nhất, phù hợp tự triển khai):

   - Tìm mục **Local Storage (Lưu trữ cục bộ)** được tạo tự động
   - Nhấn **Sửa**, ở dưới cùng panel cấu hình tick **Đặt làm engine lưu trữ mặc định** → Gửi

   ![Cấu hình chung của engine lưu trữ (dưới cùng "Đặt làm engine lưu trữ mặc định")](https://static-docs.nocobase.com/20240529115151.png)

   :::warning Lưu ý

   Khi triển khai bằng Docker, lưu trữ cục bộ nằm trong container, xóa container sẽ mất file. Môi trường production khuyến nghị mount volume hoặc chuyển sang lưu trữ cloud.

   :::

3. **Tùy chọn B — Dùng OSS / S3 / COS của riêng bạn**:

   - Nhấn **Thêm mới**, chọn loại tương ứng (Aliyun OSS / Amazon S3 / Tencent COS / S3 Pro)
   - Điền Access Key, Bucket, Region, domain và các tham số khác, tick **Đặt làm engine lưu trữ mặc định**, gửi

   ![Ví dụ cấu hình engine lưu trữ Aliyun OSS](https://static-docs.nocobase.com/20240712220011.png)

4. Xóa hoặc vô hiệu hóa mục OSS có sẵn trong demo, tránh dùng nhầm

Chi tiết các tham số xem [Tổng quan engine lưu trữ](../../file-manager/storage/index.md).

### 2. Khóa dịch vụ LLM cho AI Employees

Backup demo có sẵn một số mục dịch vụ LLM (OpenAI, Claude, Gemini, DeepSeek, Qwen, Kimi, v.v.), điền API Key của chúng tôi, **không hoạt động bên ngoài**. Chức năng AI Employee không dùng được cho đến khi chuyển khóa.

**Các bước cấu hình:**

1. Vào **Cài đặt hệ thống / AI Employees / LLM service** (hoặc truy cập `/admin/settings/ai/llm-services`)

   ![Vào trang cấu hình LLM service](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

2. Trong danh sách dịch vụ có sẵn, có thể kéo thả để sắp xếp, dùng công tắc `Enabled` để bật/tắt

   ![Danh sách dịch vụ LLM (bật/tắt + sắp xếp)](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

3. Với mỗi dịch vụ định dùng:

   - Nhấn **Sửa**
   - Thay **API Key** bằng khóa của bạn (lấy từ tài khoản nhà cung cấp tương ứng: OpenAI, Anthropic, Google AI Studio, DeepSeek, Qwen, Kimi, v.v.)
   - Nếu đi qua proxy hoặc trung chuyển trong nước, điều chỉnh **Base URL**
   - Trong **Enabled Models** giữ lại các model định dùng, các model khác có thể bỏ

   ![Sửa dịch vụ LLM (API Key, Base URL, Enabled Models)](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

4. Nhấn **Test flight** ở dưới cùng để kiểm tra kết nối, qua thì **Submit** để lưu

   ![Test flight kiểm tra kết nối](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)

5. Các dịch vụ không định dùng cứ Disabled là được, không cần xóa

Chi tiết cấu hình xem [Cấu hình dịch vụ LLM](../../ai-employees/features/llm-service.md).

:::tip

Hai mục này là hai chỗ bắt buộc phải sửa sau khi khôi phục demo. Các cấu hình khác (Logo trang, SMTP, plugin bản Enterprise, v.v.) tùy nhu cầu điều chỉnh.

:::

---

## Câu hỏi thường gặp

### Bản Community có dùng được không? Có báo lỗi không?

Dùng được trực tiếp, không báo lỗi. Backup Manager được mở mã nguồn kể từ `v2.1.0-alpha.40`, bản Community có thể cài. Demo có dùng một số plugin bản Enterprise (Email Manager, Audit Log, AI Employee, v.v.), khi bản Community thiếu các plugin này, lối vào chức năng tương ứng sẽ không hiển thị, nhưng không ảnh hưởng các mô-đun khác. Ví dụ lối vào Audit Log sẽ biến mất, nhưng CRM, Quản lý bán hàng, Help Desk, Dự án, Tài sản, Nhân sự và các mô-đun cốt lõi khác vẫn hoạt động bình thường.

### Sau khi khôi phục nên chọn phiên bản nào?

Khuyến nghị dùng image `alpha-full` mới nhất (`nocobase/nocobase:alpha-full`). Image `full` tích hợp sẵn các phụ thuộc như database client, tránh thất bại khi khôi phục do thiếu công cụ.

### Sau khi khôi phục Logo không hiển thị?

Logo trên trang Demo chính thức có cấu hình giới hạn domain, domain cục bộ không tải được. Vào **Cài đặt hệ thống** để upload lại Logo của bạn là được.

### Upload file báo lỗi (lỗi OSS Key)?

Engine lưu trữ mặc định trong backup demo trỏ về OSS chúng tôi dùng cho demo, Key không mở cho bên ngoài. Vào **Quản lý Plugin / Trình quản lý Tệp**, đặt **Local Storage (Lưu trữ cục bộ)** làm storage mặc định, lưu lại là upload được bình thường.

Cách xử lý chi tiết xem mục [Engine lưu trữ tệp](#1-engine-lưu-trữ-tệp-oss--cục-bộ) ở trên.

### Chuyển ngôn ngữ?

Giải pháp tích hợp đã được bản địa hóa hơn 20 ngôn ngữ (namespace `nb_demo`). Sau khi khôi phục mặc định là tiếng Trung, chuyển sang ngôn ngữ khác: **Cài đặt hệ thống / Kích hoạt ngôn ngữ tương ứng**.

### Nâng cấp tăng dần thế nào?

Nâng cấp phiên bản hiện tại là thay thế toàn bộ, các tùy chỉnh sẽ bị ghi đè. Bắt buộc backup trước khi nâng cấp. Phương án migration tăng dần đang được lên kế hoạch.
