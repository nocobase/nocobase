---
title: "Hệ thống quản lý kinh doanh tích hợp - Hướng dẫn cài đặt"
description: "Cài đặt và triển khai Hệ thống quản lý kinh doanh tích hợp: khôi phục bằng Backup Manager (bản Pro/Enterprise) hoặc import file SQL (bản Community). Yêu cầu PostgreSQL 16, DB_UNDERSCORED không được đặt thành true."
keywords: "Cài đặt Hệ thống quản lý kinh doanh tích hợp, All-in-One, khôi phục backup, Backup Manager, import SQL, PostgreSQL, NocoBase"
---

# Hướng dẫn cài đặt

> Phiên bản hiện tại sử dụng hình thức **khôi phục backup** để triển khai. Các phiên bản sau có thể chuyển sang hình thức **migration tăng dần** để thuận tiện tích hợp giải pháp vào hệ thống NocoBase sẵn có của bạn.

Hệ thống quản lý kinh doanh tích hợp bao gồm sáu mô-đun: **CRM (Quản lý khách hàng), Quản lý bán hàng, Help Desk (Phiếu hỗ trợ), Quản lý dự án, Quản lý tài sản, Quản lý nhân sự**. Để bạn có thể triển khai giải pháp này vào môi trường NocoBase của mình một cách nhanh chóng và thuận lợi, chúng tôi cung cấp hai cách khôi phục. Vui lòng chọn cách phù hợp nhất với phiên bản và nền tảng kỹ thuật của bạn.

Trước khi bắt đầu, hãy đảm bảo:

- Bạn đã có một môi trường NocoBase cơ bản đang chạy. Về việc cài đặt hệ thống chính, vui lòng tham khảo [tài liệu cài đặt chính thức](https://docs.nocobase.com/welcome/getting-started/installation).
- Phiên bản NocoBase **v2.1.0-alpha.34 trở lên**
- Bạn đã tải các file tương ứng của giải pháp tích hợp:
  - **File backup**: [nocobase_all_in_one_backup_260521.nbdata](https://static-docs.nocobase.com/nocobase_all_in_one_backup_260521.nbdata) — dùng cho phương pháp 1
  - **File SQL**: [nocobase_all_in_one_sql_260521.zip](https://static-docs.nocobase.com/nocobase_all_in_one_sql_260521.zip) — dùng cho phương pháp 2

**Lưu ý quan trọng**:

- Giải pháp này được tạo dựa trên cơ sở dữ liệu **PostgreSQL 16**, vui lòng đảm bảo môi trường của bạn sử dụng PostgreSQL 16.
- **DB_UNDERSCORED không được đặt thành true**: vui lòng kiểm tra `docker-compose.yml` của bạn, đảm bảo biến môi trường `DB_UNDERSCORED` chưa được đặt thành `true`, nếu không sẽ xung đột với backup của giải pháp và dẫn đến khôi phục thất bại.

---

## Phương pháp 1: Khôi phục bằng Backup Manager (khuyến nghị cho người dùng Pro/Enterprise)

Phương pháp này khôi phục một thao tác duy nhất thông qua plugin "[Backup Manager](https://docs.nocobase.com/handbook/backups)" (bản Pro/Enterprise) được tích hợp sẵn trong NocoBase, thao tác đơn giản nhất. Nhưng nó có một số yêu cầu nhất định về môi trường và phiên bản người dùng.

### Đặc điểm chính

* **Ưu điểm**:
  1. **Thao tác tiện lợi**: hoàn thành ngay trên giao diện UI, có thể khôi phục đầy đủ toàn bộ cấu hình bao gồm cả plugin.
  2. **Khôi phục đầy đủ**: **có thể khôi phục mọi file hệ thống**, bao gồm file template in, file được upload trong các field file, avatar AI Employee, v.v.
* **Hạn chế**:
  1. **Chỉ dành cho bản Pro/Enterprise**: "Backup Manager" là plugin cấp doanh nghiệp, chỉ người dùng bản Pro/Enterprise mới có thể sử dụng.
  2. **Yêu cầu môi trường nghiêm ngặt**: yêu cầu môi trường cơ sở dữ liệu của bạn (phiên bản, cấu hình phân biệt chữ hoa thường, v.v.) phải tương thích cao với môi trường lúc tạo backup.
  3. **Phụ thuộc plugin**: nếu giải pháp chứa các plugin thương mại mà môi trường cục bộ của bạn không có, việc khôi phục sẽ thất bại.

### Các bước thao tác

**Bước 1: [Khuyến nghị mạnh] Khởi chạy ứng dụng bằng image `full`**

Để tránh việc khôi phục thất bại do thiếu database client, chúng tôi khuyến nghị mạnh bạn sử dụng image Docker phiên bản `full`. Nó tích hợp sẵn tất cả các chương trình cần thiết, không cần cấu hình thêm.

Ví dụ lệnh pull image:

```bash
docker pull nocobase/nocobase:alpha-full
```

Sau đó dùng image này để khởi chạy dịch vụ NocoBase của bạn.

> **Lưu ý**: nếu không sử dụng image `full`, bạn có thể cần phải cài đặt thủ công database client `pg_dump` trong container, quá trình này rườm rà và không ổn định.

**Bước 2: Bật plugin "Backup Manager"**

1. Đăng nhập vào hệ thống NocoBase của bạn.
2. Vào **`Quản lý plugin`**.
3. Tìm và kích hoạt plugin **`Backup Manager`**.

**Bước 3: Khôi phục từ file backup cục bộ**

1. Sau khi kích hoạt plugin, làm mới trang.
2. Vào menu bên trái **`Quản trị hệ thống`** → **`Backup Manager`**.
3. Nhấn nút **`Khôi phục từ backup cục bộ`** ở góc phải trên.
4. Kéo thả file `nocobase_all_in_one_backup_260521.nbdata` đã tải xuống vào vùng upload.
5. Nhấn **`Gửi`** và kiên nhẫn chờ hệ thống hoàn tất khôi phục. Quá trình này có thể mất từ vài chục giây đến vài phút.

### Lưu ý

* **Khả năng tương thích cơ sở dữ liệu**: đây là điểm mấu chốt nhất của phương pháp này. **Phiên bản, charset, cấu hình phân biệt chữ hoa thường** của cơ sở dữ liệu PostgreSQL của bạn phải khớp với file nguồn backup, đặc biệt tên `schema` phải nhất quán.
* **Khớp plugin thương mại**: vui lòng đảm bảo bạn đã có và bật tất cả các plugin thương mại mà giải pháp yêu cầu, nếu không việc khôi phục sẽ bị gián đoạn. Các plugin thương mại liên quan đến giải pháp tích hợp bao gồm: Backup Manager, Email Manager, Audit Log, AI Employee, v.v.

---

## Phương pháp 2: Import trực tiếp file SQL (phổ thông, phù hợp hơn cho bản Community)

Phương pháp này khôi phục dữ liệu bằng cách thao tác trực tiếp trên cơ sở dữ liệu, bỏ qua plugin "Backup Manager", do đó không có giới hạn của plugin bản Pro/Enterprise.

### Đặc điểm chính

* **Ưu điểm**:
  1. **Không giới hạn phiên bản**: phù hợp với mọi người dùng NocoBase, bao gồm cả bản Community.
  2. **Khả năng tương thích cao**: không phụ thuộc vào công cụ `dump` trong ứng dụng, chỉ cần có thể kết nối tới cơ sở dữ liệu là có thể thao tác.
  3. **Khả năng chịu lỗi cao**: nếu giải pháp chứa các plugin thương mại mà bạn không có, các chức năng liên quan sẽ không được kích hoạt, nhưng không ảnh hưởng đến hoạt động bình thường của các chức năng khác, ứng dụng vẫn có thể khởi động thành công.
* **Hạn chế**:
  1. **Yêu cầu khả năng thao tác cơ sở dữ liệu**: người dùng cần có khả năng thao tác cơ sở dữ liệu cơ bản, ví dụ như cách thực thi một file `.sql`.
  2. **Mất file hệ thống**: **phương pháp này sẽ làm mất toàn bộ file hệ thống**, bao gồm file template in, file được upload trong các field file, avatar AI Employee, v.v.

### Các bước thao tác

**Bước 1: Chuẩn bị một cơ sở dữ liệu sạch**

Chuẩn bị một cơ sở dữ liệu mới hoàn toàn, trống rỗng (PostgreSQL 16) cho dữ liệu sắp được import.

**Bước 2: Import file `.sql` vào cơ sở dữ liệu**

Giải nén file `nocobase_all_in_one_sql_260521.zip` đã tải xuống để lấy file `.sql`, sau đó import nội dung của nó vào cơ sở dữ liệu đã chuẩn bị ở bước trước. Có nhiều cách thực thi, tùy thuộc vào môi trường của bạn:

* **Tùy chọn A: Qua command line của server (lấy Docker làm ví dụ)**

  Nếu bạn cài NocoBase và cơ sở dữ liệu bằng Docker, có thể upload file `.sql` lên server, sau đó dùng lệnh `docker exec` để import. Giả sử container PostgreSQL của bạn có tên là `my-nocobase-db`:

  ```bash
  # Copy file sql vào container
  docker cp nocobase_all_in_one_sql_260521.sql my-nocobase-db:/tmp/
  # Vào container thực thi lệnh import
  docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_all_in_one_sql_260521.sql
  ```

* **Tùy chọn B: Qua database client từ xa (Navicat, v.v.)**

  Nếu cơ sở dữ liệu của bạn đã mở port, bạn có thể dùng bất kỳ database client đồ họa nào (như Navicat, DBeaver, pgAdmin, v.v.) để kết nối, sau đó:

  1. Click chuột phải vào cơ sở dữ liệu đích
  2. Chọn "Run SQL File" hoặc "Execute SQL Script"
  3. Chọn file `.sql` đã tải xuống và thực thi

**Bước 3: Kết nối cơ sở dữ liệu và khởi chạy ứng dụng**

Cấu hình các tham số khởi chạy NocoBase (như các biến môi trường `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, v.v.) trỏ tới cơ sở dữ liệu vừa được import dữ liệu, sau đó khởi chạy dịch vụ NocoBase bình thường.

### Lưu ý

* **Quyền cơ sở dữ liệu**: phương pháp này yêu cầu bạn có tài khoản và mật khẩu có thể thao tác trực tiếp trên cơ sở dữ liệu.
* **Trạng thái plugin**: sau khi import thành công, dữ liệu của các plugin thương mại trong hệ thống tuy đã tồn tại, nhưng nếu bạn chưa cài đặt và kích hoạt các plugin tương ứng ở cục bộ, các chức năng liên quan sẽ không hiển thị và không sử dụng được, tuy nhiên điều này sẽ không khiến ứng dụng bị crash.

---

## Tổng kết và so sánh

| Đặc điểm | Phương pháp 1: Backup Manager | Phương pháp 2: Import trực tiếp SQL |
| :--- | :--- | :--- |
| **Đối tượng phù hợp** | Người dùng **bản Pro/Enterprise** | **Mọi người dùng** (bao gồm bản Community) |
| **Độ dễ thao tác** | ⭐⭐⭐⭐⭐ (rất đơn giản, thao tác UI) | ⭐⭐⭐ (cần kiến thức cơ bản về cơ sở dữ liệu) |
| **Yêu cầu môi trường** | **Nghiêm ngặt**, cơ sở dữ liệu, phiên bản hệ thống, v.v. cần tương thích cao | **Bình thường**, chỉ cần cơ sở dữ liệu tương thích |
| **Phụ thuộc plugin** | **Phụ thuộc mạnh**, khi khôi phục sẽ kiểm tra plugin, thiếu bất kỳ plugin nào cũng sẽ dẫn đến **khôi phục thất bại** | **Chức năng phụ thuộc mạnh vào plugin**. Dữ liệu có thể import độc lập, hệ thống có chức năng cơ bản. Nhưng nếu thiếu plugin tương ứng, chức năng liên quan sẽ **hoàn toàn không thể sử dụng** |
| **File hệ thống** | **Giữ lại đầy đủ** (template in, file upload, avatar, v.v.) | **Sẽ bị mất** (template in, file upload, avatar, v.v.) |
| **Tình huống khuyến nghị** | Khách hàng doanh nghiệp, môi trường có thể kiểm soát và nhất quán, cần chức năng đầy đủ | Thiếu một phần plugin, ưu tiên tính tương thích và linh hoạt, không phải bản Pro/Enterprise, chấp nhận thiếu chức năng file |

---

## Câu hỏi thường gặp

### Bản Pro có dùng được không? Có báo lỗi không?

Có thể dùng trực tiếp, không báo lỗi. Demo có sử dụng một số plugin bản Enterprise (như Email Manager, Audit Log, AI Employee, v.v.), khi bản Pro thiếu các plugin này, lối vào chức năng tương ứng sẽ không hiển thị, nhưng **không ảnh hưởng đến các mô-đun khác của hệ thống**. Ví dụ lối vào Audit Log sẽ biến mất, nhưng các mô-đun cốt lõi như CRM, Quản lý bán hàng, Help Desk, Dự án, Tài sản, Nhân sự vẫn hoạt động hoàn toàn bình thường.

### Sau khi khôi phục nên chọn phiên bản nào?

Khuyến nghị sử dụng image phiên bản `alpha-full` mới nhất (như `nocobase/nocobase:alpha-full`). Image `full` tích hợp sẵn các phụ thuộc như database client, tránh thất bại khi khôi phục do thiếu công cụ.

### Sau khi khôi phục Logo không hiển thị?

Logo của Demo trên website chính thức có cấu hình giới hạn domain, domain cục bộ không thể tải. Vào **Cài đặt hệ thống** để upload lại Logo của bạn là được.

### Upload file báo lỗi (lỗi OSS Key)?

Sau khi cài bằng cách SQL, upload file có thể báo lỗi liên quan đến OSS. Cách khắc phục: vào **Quản lý plugin → File Manager**, đặt **Local Storage** làm storage mặc định, lưu lại là có thể upload bình thường.

### Chuyển ngôn ngữ?

Giải pháp tích hợp đã được bản địa hóa hơn 20 ngôn ngữ (namespace `nb_demo`). Sau khi khôi phục, mặc định là tiếng Trung, để chuyển sang ngôn ngữ khác cần: **Cài đặt hệ thống → Kích hoạt ngôn ngữ tương ứng** (tránh kích hoạt `ar-SA`, hiện đang gây render bất thường cho NocoBase).

### Nâng cấp tăng dần thế nào?

Nâng cấp phiên bản hiện tại là thay thế toàn bộ, các tùy chỉnh sẽ bị ghi đè. Bắt buộc phải backup trước khi nâng cấp. Phương án migration tăng dần đang được lên kế hoạch và sẽ ưu tiên hỗ trợ bản Pro/Enterprise. Do bản Community thiếu plugin Migration Manager nên tạm thời khó hỗ trợ.

Hy vọng hướng dẫn này giúp bạn triển khai Hệ thống quản lý kinh doanh tích hợp thuận lợi. Nếu gặp bất kỳ vấn đề nào trong quá trình thao tác, hãy liên hệ với chúng tôi.
