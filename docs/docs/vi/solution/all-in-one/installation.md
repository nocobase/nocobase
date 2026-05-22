---
title: "Hệ thống quản lý kinh doanh tích hợp - Hướng dẫn cài đặt"
description: "Cài đặt và triển khai Hệ thống quản lý kinh doanh tích hợp: khôi phục bằng Backup Manager (bản Pro/Enterprise) hoặc import file SQL (bản Community). Yêu cầu PostgreSQL 16, DB_UNDERSCORED không được đặt thành true."
keywords: "Cài đặt Hệ thống quản lý kinh doanh tích hợp, All-in-One, khôi phục backup, Backup Manager, import SQL, PostgreSQL, NocoBase"
---

# Hướng dẫn cài đặt

Hệ thống quản lý kinh doanh tích hợp bao gồm sáu mô-đun: **CRM, Quản lý bán hàng, Help Desk, Quản lý dự án, Quản lý tài sản cố định, Quản lý nhân sự**. Ở đây cung cấp hai cách khôi phục, chọn một cách tùy phiên bản NocoBase và nền tảng kỹ thuật của bạn.

:::tip Yêu cầu trước

- Đã có một môi trường NocoBase cơ bản đang chạy. Cài đặt hệ thống chính xem [tài liệu cài đặt chính thức](https://docs.nocobase.com/welcome/getting-started/installation)
- Phiên bản NocoBase **v2.1.0-alpha.34 trở lên**
- Đã tải một trong các file backup của giải pháp tích hợp:
  - **Backup nbdata**: [nocobase_all_in_one_backup_260521.nbdata](https://static-docs.nocobase.com/nocobase_all_in_one_backup_260521.nbdata) — dùng cho phương án 1
  - **Gói nén SQL**: [nocobase_all_in_one_sql_260521.zip](https://static-docs.nocobase.com/nocobase_all_in_one_sql_260521.zip) — dùng cho phương án 2

:::

:::warning Lưu ý

- Giải pháp này được tạo dựa trên **PostgreSQL 16**, môi trường bắt buộc phải là PostgreSQL 16
- **`DB_UNDERSCORED` không được đặt thành `true`** — kiểm tra `docker-compose.yml`, nếu đặt `true` việc khôi phục sẽ thất bại

:::

Nói chung, có plugin Backup Manager thì chọn phương án 1, không có thì chọn phương án 2. Phiên bản hiện tại triển khai theo dạng **khôi phục backup**, phiên bản sau sẽ chuyển sang migration tăng dần để thuận tiện tích hợp vào hệ thống NocoBase sẵn có.

---

## Phương án 1: Khôi phục bằng Backup Manager (khuyến nghị cho Pro/Enterprise)

Cách này khôi phục một thao tác bằng plugin "[Backup Manager](https://docs.nocobase.com/handbook/backups)" tích hợp sẵn trong NocoBase, thao tác UI đơn giản nhất. Tuy nhiên yêu cầu về môi trường và phụ thuộc plugin khá nghiêm ngặt.

### Đặc điểm

**Ưu điểm:**

- **Thao tác tiện lợi** — hoàn thành trên giao diện UI, có thể khôi phục đầy đủ mọi nội dung bao gồm cả cấu hình plugin
- **Khôi phục đầy đủ** — khôi phục được toàn bộ file hệ thống, bao gồm file template in, file upload trong field đính kèm, avatar AI Employee, v.v.

**Hạn chế:**

- **Chỉ dành cho Pro/Enterprise** — Backup Manager là plugin cấp doanh nghiệp, bản Community không dùng được
- **Yêu cầu môi trường nghiêm ngặt** — phiên bản cơ sở dữ liệu, cấu hình phân biệt chữ hoa thường, v.v. phải tương thích cao với nguồn backup
- **Phụ thuộc plugin mạnh** — các plugin thương mại có trong backup phải có sẵn trong môi trường cục bộ, nếu không việc khôi phục sẽ thất bại

### Các bước

**Bước 1: Khởi chạy ứng dụng bằng image `full`**

Khuyến nghị mạnh dùng image Docker phiên bản `full`, nó tích hợp sẵn database client và tất cả các chương trình phụ trợ, không cần cấu hình thêm:

```bash
docker pull nocobase/nocobase:alpha-full
```

Sau đó dùng image này để khởi chạy dịch vụ NocoBase.

:::tip

Nếu không dùng image `full`, có thể bạn sẽ phải cài thủ công database client `pg_dump` trong container, quá trình này rườm rà và không ổn định.

:::

**Bước 2: Bật plugin "Backup Manager"**

1. Đăng nhập hệ thống NocoBase
2. Vào **Quản lý Plugin**
3. Tìm và kích hoạt plugin **Backup Manager**

**Bước 3: Khôi phục từ file backup cục bộ**

1. Sau khi kích hoạt plugin, làm mới trang
2. Vào menu bên trái **Quản trị hệ thống / Backup Manager**
3. Nhấn nút **Khôi phục từ backup cục bộ** ở góc phải trên
4. Kéo thả file `nocobase_all_in_one_backup_260521.nbdata` đã tải xuống vào vùng upload
5. Nhấn **Gửi**, chờ khôi phục hoàn tất, thường mất từ vài chục giây đến vài phút

### Lưu ý

- **Khả năng tương thích cơ sở dữ liệu** — phiên bản, charset, cấu hình phân biệt chữ hoa thường của PostgreSQL phải khớp với nguồn backup, tên `schema` đặc biệt phải nhất quán
- **Khớp plugin thương mại** — cục bộ phải bật trước tất cả plugin thương mại được dùng trong backup, nếu không việc khôi phục sẽ bị gián đoạn. Plugin thương mại liên quan đến giải pháp tích hợp gồm: Backup Manager, Email Manager, Audit Log, AI Employee, v.v.

---

## Phương án 2: Import file SQL trực tiếp (phổ thông)

Thao tác trực tiếp trên cơ sở dữ liệu để khôi phục dữ liệu, bỏ qua Backup Manager, không bị giới hạn về phiên bản và plugin.

### Đặc điểm

**Ưu điểm:**

- **Không giới hạn phiên bản** — phù hợp với mọi người dùng NocoBase, bao gồm cả bản Community
- **Khả năng tương thích cao** — không phụ thuộc công cụ dump trong ứng dụng, chỉ cần kết nối được cơ sở dữ liệu là làm được
- **Khả năng chịu lỗi cao** — plugin thương mại có trong backup nhưng cục bộ chưa cài sẽ không được kích hoạt, không ảnh hưởng đến hoạt động bình thường của các mô-đun khác

**Hạn chế:**

- **Yêu cầu khả năng thao tác cơ sở dữ liệu** — ví dụ biết cách thực thi một file `.sql`
- **Mất file hệ thống** — cách này sẽ làm mất toàn bộ file hệ thống, bao gồm file template in, file upload trong field đính kèm, avatar AI Employee, v.v.

### Các bước

**Bước 1: Chuẩn bị một cơ sở dữ liệu sạch**

Chuẩn bị một cơ sở dữ liệu trống hoàn toàn mới (PostgreSQL 16) cho dữ liệu sắp được import.

**Bước 2: Import file `.sql` vào cơ sở dữ liệu**

Giải nén `nocobase_all_in_one_sql_260521.zip` đã tải để lấy file `.sql`, import vào cơ sở dữ liệu đã chuẩn bị ở bước trước. Có hai cách thực thi:

**Tùy chọn A: Command line trên server (ví dụ Docker)**

Nếu NocoBase và cơ sở dữ liệu đều triển khai bằng Docker, upload file `.sql` lên server rồi dùng `docker exec` để import. Giả sử container PostgreSQL có tên là `my-nocobase-db`:

```bash
# Copy file sql vào container
docker cp nocobase_all_in_one_sql_260521.sql my-nocobase-db:/tmp/
# Vào container thực thi lệnh import
docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_all_in_one_sql_260521.sql
```

**Tùy chọn B: Database client từ xa (Navicat, v.v.)**

Nếu cơ sở dữ liệu đã mở port, dùng bất kỳ client đồ họa nào (Navicat, DBeaver, pgAdmin, v.v.) để kết nối, sau đó:

1. Click chuột phải vào cơ sở dữ liệu đích
2. Chọn **Run SQL File** hoặc **Execute SQL Script**
3. Chọn file `.sql` đã giải nén và thực thi

**Bước 3: Kết nối cơ sở dữ liệu và khởi chạy ứng dụng**

Cấu hình các tham số khởi chạy NocoBase (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, v.v.) trỏ tới cơ sở dữ liệu vừa import dữ liệu, sau đó khởi chạy dịch vụ NocoBase bình thường.

### Lưu ý

- **Quyền cơ sở dữ liệu** — cách này yêu cầu có tài khoản và mật khẩu có thể thao tác trực tiếp trên cơ sở dữ liệu
- **Trạng thái plugin** — sau khi import thành công, dữ liệu plugin thương mại có tồn tại, nhưng khi cục bộ chưa cài plugin tương ứng thì các chức năng đó không dùng được. Ứng dụng không bị crash

---

## So sánh hai phương án

| Đặc điểm | Phương án 1: Backup Manager | Phương án 2: Import SQL trực tiếp |
| :--- | :--- | :--- |
| **Đối tượng phù hợp** | Bản Pro/Enterprise | Mọi người dùng (bao gồm bản Community) |
| **Độ dễ thao tác** | ⭐⭐⭐⭐⭐ (thao tác UI) | ⭐⭐⭐ (cần kiến thức cơ sở dữ liệu) |
| **Yêu cầu môi trường** | Nghiêm ngặt, cơ sở dữ liệu và phiên bản hệ thống cần tương thích cao | Bình thường, chỉ cần cơ sở dữ liệu tương thích |
| **Phụ thuộc plugin** | Phụ thuộc mạnh, thiếu plugin sẽ khôi phục thất bại | Dữ liệu có thể import độc lập, thiếu plugin thì chức năng liên quan không dùng được |
| **File hệ thống** | Giữ lại đầy đủ (template in, file upload, avatar, v.v.) | Sẽ bị mất (template in, file upload, avatar, v.v.) |
| **Tình huống khuyến nghị** | Khách hàng doanh nghiệp, môi trường có thể kiểm soát | Thiếu một phần plugin, ưu tiên tính tương thích, bản Community |

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

### Bản Pro có dùng được không? Có báo lỗi không?

Dùng được trực tiếp, không báo lỗi. Demo có dùng một số plugin bản Enterprise (Email Manager, Audit Log, AI Employee, v.v.), khi bản Pro thiếu các plugin này, lối vào chức năng tương ứng sẽ không hiển thị, nhưng không ảnh hưởng các mô-đun khác. Ví dụ lối vào Audit Log sẽ biến mất, nhưng CRM, Quản lý bán hàng, Help Desk, Dự án, Tài sản, Nhân sự và các mô-đun cốt lõi khác vẫn hoạt động bình thường.

### Sau khi khôi phục nên chọn phiên bản nào?

Khuyến nghị dùng image `alpha-full` mới nhất (`nocobase/nocobase:alpha-full`). Image `full` tích hợp sẵn các phụ thuộc như database client, tránh thất bại khi khôi phục do thiếu công cụ.

### Sau khi khôi phục Logo không hiển thị?

Logo trên trang Demo chính thức có cấu hình giới hạn domain, domain cục bộ không tải được. Vào **Cài đặt hệ thống** để upload lại Logo của bạn là được.

### Upload file báo lỗi (lỗi OSS Key)?

Sau khi cài bằng cách SQL, upload file có thể báo lỗi liên quan đến OSS. Vào **Quản lý Plugin / Trình quản lý Tệp**, đặt **Local Storage (Lưu trữ cục bộ)** làm storage mặc định, lưu lại là upload được bình thường.

Cách xử lý chi tiết xem mục [Engine lưu trữ tệp](#1-engine-lưu-trữ-tệp-oss--cục-bộ) ở trên.

### Chuyển ngôn ngữ?

Giải pháp tích hợp đã được bản địa hóa hơn 20 ngôn ngữ (namespace `nb_demo`). Sau khi khôi phục mặc định là tiếng Trung, chuyển sang ngôn ngữ khác: **Cài đặt hệ thống / Kích hoạt ngôn ngữ tương ứng**.

### Nâng cấp tăng dần thế nào?

Nâng cấp phiên bản hiện tại là thay thế toàn bộ, các tùy chỉnh sẽ bị ghi đè. Bắt buộc backup trước khi nâng cấp. Phương án migration tăng dần đang được lên kế hoạch, sẽ ưu tiên hỗ trợ Pro/Enterprise. Bản Community do thiếu plugin Migration Manager nên tạm thời khó hỗ trợ.
