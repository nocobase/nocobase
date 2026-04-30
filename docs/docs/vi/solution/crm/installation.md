---
title: "CRM 2.0 Cách cài đặt"
description: "Triển khai cài đặt CRM 2.0: khôi phục bằng Backup Manager (bản Pro/Enterprise) hoặc import file SQL (bản Community), cần PostgreSQL 16, DB_UNDERSCORED không được là true."
keywords: "Cài đặt CRM,Khôi phục backup,Backup Manager,Import SQL,PostgreSQL,NocoBase"
---

# Cách cài đặt

> Phiên bản hiện tại được triển khai dưới hình thức **khôi phục từ backup**. Trong các phiên bản sau, có thể chuyển sang hình thức **migration tăng dần** để dễ dàng tích hợp giải pháp vào hệ thống hiện có của bạn.

Để bạn có thể nhanh chóng và mượt mà triển khai giải pháp CRM 2.0 vào môi trường NocoBase của riêng mình, chúng tôi cung cấp hai cách khôi phục. Vui lòng chọn cách phù hợp nhất dựa trên phiên bản người dùng và nền tảng kỹ thuật của bạn.

Trước khi bắt đầu, hãy đảm bảo rằng:

- Bạn đã có một môi trường NocoBase hoạt động cơ bản. Về việc cài đặt hệ thống chính, vui lòng tham khảo [tài liệu cài đặt chính thức](https://docs-cn.nocobase.com/welcome/getting-started/installation) chi tiết hơn.
- Phiên bản NocoBase **v2.1.0-beta.2 trở lên**
- Bạn đã tải xuống các file tương ứng của hệ thống CRM:
  - **File backup**: [nocobase_crm_v2_backup_260406.nbdata](https://static-docs.nocobase.com/nocobase_crm_v2_backup_260406.nbdata) - dùng cho cách 1
  - **File SQL**: [nocobase_crm_v2_sql_260406.zip](https://static-docs.nocobase.com/nocobase_crm_v2_sql_260406.zip) - dùng cho cách 2

**Lưu ý quan trọng**:
- Giải pháp này được tạo dựa trên cơ sở dữ liệu **PostgreSQL 16**, hãy đảm bảo môi trường của bạn dùng PostgreSQL 16.
- **DB_UNDERSCORED không được là true**: Hãy kiểm tra file `docker-compose.yml`, đảm bảo biến môi trường `DB_UNDERSCORED` không được set là `true`, nếu không sẽ xung đột với backup của giải pháp khiến khôi phục thất bại.

---

## Cách 1: Dùng Backup Manager để khôi phục (khuyến nghị cho người dùng Pro/Enterprise)

Cách này dùng Plugin "[Backup Manager](https://docs-cn.nocobase.com/handbook/backups)" tích hợp sẵn của NocoBase (bản Pro/Enterprise) để khôi phục một cú nhấn, thao tác đơn giản nhất. Tuy nhiên có yêu cầu nhất định về môi trường và phiên bản người dùng.

### Đặc điểm chính

* **Ưu điểm**:
  1. **Thao tác tiện lợi**: Hoàn thành ngay trên giao diện UI, có thể khôi phục đầy đủ tất cả cấu hình bao gồm cả Plugin.
  2. **Khôi phục đầy đủ**: **Có thể khôi phục tất cả file hệ thống**, bao gồm file template in, file đã upload trong trường file của bảng, đảm bảo tính năng đầy đủ.
* **Hạn chế**:
  1. **Giới hạn bản Pro/Enterprise**: "Backup Manager" là Plugin cấp doanh nghiệp, chỉ người dùng Pro/Enterprise mới dùng được.
  2. **Yêu cầu môi trường khắt khe**: Yêu cầu môi trường cơ sở dữ liệu của bạn (phiên bản, cài đặt phân biệt chữ hoa/thường, v.v.) phải tương thích cao với môi trường khi tạo backup.
  3. **Phụ thuộc Plugin**: Nếu giải pháp chứa Plugin thương mại không có trong môi trường local của bạn, khôi phục sẽ thất bại.

### Các bước thao tác

**Bước 1: 【Cực kỳ khuyến nghị】Khởi động ứng dụng bằng image `full`**

Để tránh khôi phục thất bại do thiếu client cơ sở dữ liệu, chúng tôi cực kỳ khuyến nghị bạn dùng phiên bản Docker image `full`. Image này tích hợp sẵn tất cả chương trình phụ trợ cần thiết, không cần cấu hình thêm.

Ví dụ lệnh pull image:

```bash
docker pull nocobase/nocobase:beta-full
```

Sau đó dùng image này để khởi động dịch vụ NocoBase.

> **Lưu ý**: Nếu không dùng image `full`, bạn có thể phải cài thủ công client cơ sở dữ liệu `pg_dump` trong container, quy trình phức tạp và không ổn định.

**Bước 2: Bật Plugin "Backup Manager"**

1. Đăng nhập vào hệ thống NocoBase.
2. Vào **`Quản lý Plugin`**.
3. Tìm và bật Plugin **`Backup Manager`**.

**Bước 3: Khôi phục từ file backup local**

1. Sau khi bật Plugin, refresh trang.
2. Vào menu bên trái **`Quản lý hệ thống`** -> **`Backup Manager`**.
3. Nhấn nút **`Khôi phục từ backup local`** ở góc trên bên phải.
4. Kéo thả file backup đã tải xuống vào vùng upload.
5. Nhấn **`Submit`**, kiên nhẫn chờ hệ thống hoàn thành khôi phục, quá trình này có thể mất từ vài chục giây đến vài phút.

### Lưu ý

* **Tương thích cơ sở dữ liệu**: Đây là điểm quan trọng nhất của cách này. Cơ sở dữ liệu PostgreSQL của bạn về **phiên bản, charset, cài đặt phân biệt chữ hoa/thường** phải khớp với file backup nguồn. Đặc biệt tên `schema` phải giống nhau.
* **Khớp Plugin thương mại**: Hãy đảm bảo bạn đã có và bật tất cả Plugin thương mại mà giải pháp cần, nếu không khôi phục sẽ bị gián đoạn.

---

## Cách 2: Import trực tiếp file SQL (chung, phù hợp hơn với bản Community)

Cách này khôi phục dữ liệu bằng cách thao tác trực tiếp với cơ sở dữ liệu, bỏ qua Plugin "Backup Manager", do đó không bị giới hạn của Plugin Pro/Enterprise.

### Đặc điểm chính

* **Ưu điểm**:
  1. **Không giới hạn phiên bản**: Áp dụng cho mọi người dùng NocoBase, bao gồm cả bản Community.
  2. **Tương thích cao**: Không phụ thuộc vào công cụ `dump` trong app, chỉ cần kết nối được cơ sở dữ liệu là dùng được.
  3. **Khả năng chịu lỗi cao**: Nếu giải pháp chứa Plugin thương mại bạn không có, các tính năng liên quan sẽ không được kích hoạt, nhưng không ảnh hưởng đến hoạt động bình thường của các tính năng khác, ứng dụng có thể khởi động thành công.
* **Hạn chế**:
  1. **Cần khả năng thao tác cơ sở dữ liệu**: Cần người dùng có khả năng thao tác cơ sở dữ liệu cơ bản, ví dụ như cách thực thi một file `.sql`.
  2. **Mất file hệ thống**: **Cách này sẽ mất tất cả file hệ thống**, bao gồm file template in, file đã upload trong trường file của bảng.

### Các bước thao tác

**Bước 1: Chuẩn bị một cơ sở dữ liệu sạch**

Chuẩn bị một cơ sở dữ liệu mới hoàn toàn, trống cho dữ liệu bạn sắp import.

**Bước 2: Import file `.sql` vào cơ sở dữ liệu**

Lấy file cơ sở dữ liệu đã tải xuống (thường ở định dạng `.sql`), import nội dung của nó vào cơ sở dữ liệu đã chuẩn bị ở bước trước. Có nhiều cách thực hiện, tùy thuộc vào môi trường:

* **Phương án A: Qua command line server (ví dụ với Docker)**
  Nếu bạn cài NocoBase và cơ sở dữ liệu bằng Docker, có thể upload file `.sql` lên server, sau đó dùng lệnh `docker exec` để thực thi import. Giả sử container PostgreSQL của bạn tên là `my-nocobase-db`, file tên là `nocobase_crm_v2_sql_260327.sql`:

  ```bash
  # Copy file sql vào container
  docker cp nocobase_crm_v2_sql_260327.sql my-nocobase-db:/tmp/
  # Vào container thực thi lệnh import
  docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_crm_v2_sql_260327.sql
  ```
* **Phương án B: Qua client cơ sở dữ liệu từ xa (Navicat, v.v.)**
  Nếu cơ sở dữ liệu của bạn mở port, có thể dùng bất kỳ client cơ sở dữ liệu đồ họa nào (như Navicat, DBeaver, pgAdmin, v.v.) kết nối đến cơ sở dữ liệu, sau đó:
  1. Chuột phải vào cơ sở dữ liệu đích
  2. Chọn "Run SQL File" hoặc "Execute SQL Script"
  3. Chọn file `.sql` đã tải xuống và thực thi

**Bước 3: Kết nối cơ sở dữ liệu và khởi động ứng dụng**

Cấu hình tham số khởi động NocoBase (như biến môi trường `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, v.v.) trỏ đến cơ sở dữ liệu vừa import dữ liệu. Sau đó khởi động dịch vụ NocoBase bình thường.

### Lưu ý

* **Quyền cơ sở dữ liệu**: Cách này yêu cầu bạn có tài khoản và mật khẩu có thể thao tác trực tiếp với cơ sở dữ liệu.
* **Trạng thái Plugin**: Sau khi import thành công, dữ liệu Plugin thương mại trong hệ thống tuy có tồn tại, nhưng nếu môi trường local của bạn chưa cài và bật Plugin tương ứng, các tính năng liên quan sẽ không hiển thị và không dùng được, nhưng việc này sẽ không làm crash ứng dụng.

---

## Tổng kết và so sánh

| Đặc điểm        | Cách 1: Backup Manager                                         | Cách 2: Import trực tiếp SQL                                                                       |
| :-------------- | :------------------------------------------------------------- | :------------------------------------------------------------------------------------------------ |
| **Người dùng phù hợp** | Người dùng **Pro/Enterprise**                          | **Tất cả người dùng** (bao gồm cả bản Community)                                                  |
| **Độ dễ thao tác** | ⭐⭐⭐⭐⭐ (Rất đơn giản, thao tác UI)                      | ⭐⭐⭐ (Cần kiến thức cơ sở dữ liệu cơ bản)                                                       |
| **Yêu cầu môi trường** | **Khắt khe**, cơ sở dữ liệu, phiên bản hệ thống cần tương thích cao | **Bình thường**, chỉ cần cơ sở dữ liệu tương thích                                                |
| **Phụ thuộc Plugin** | **Phụ thuộc mạnh**, khôi phục sẽ kiểm tra Plugin, thiếu bất kỳ Plugin nào sẽ dẫn đến **khôi phục thất bại**. | **Tính năng phụ thuộc mạnh vào Plugin**. Dữ liệu có thể import độc lập, hệ thống có tính năng cơ bản. Nhưng nếu thiếu Plugin tương ứng, các tính năng liên quan sẽ **hoàn toàn không dùng được**. |
| **File hệ thống** | **Giữ đầy đủ** (template in, file upload, v.v.)               | **Sẽ mất** (template in, file upload, v.v.)                                                      |
| **Tình huống khuyến nghị** | Người dùng doanh nghiệp, có môi trường được kiểm soát, đồng nhất, cần tính năng đầy đủ | Thiếu một số Plugin, theo đuổi tính tương thích cao, linh hoạt, không phải bản Pro/Enterprise, có thể chấp nhận mất tính năng file |

---

## Câu hỏi thường gặp

### Bản Pro có dùng được không? Có báo lỗi không?

Có thể dùng trực tiếp, không báo lỗi. Demo có sử dụng một số Plugin Enterprise (như Quản lý Email, Audit Log, v.v.), bản Pro thiếu các Plugin này thì các điểm vào tính năng tương ứng sẽ không hiển thị, nhưng **không ảnh hưởng đến các tính năng khác của hệ thống**. Ví dụ điểm vào Email sẽ biến mất, nhưng các module cốt lõi như Lead, Cơ hội, Đơn hàng vẫn hoạt động hoàn toàn bình thường.

### Sau khi khôi phục nên chọn phiên bản nào?

Khuyến nghị dùng image phiên bản `beta-full` mới nhất (như `nocobase/nocobase:beta-full`). Image `full` tích hợp sẵn các phụ thuộc như client cơ sở dữ liệu, tránh khôi phục thất bại do thiếu công cụ.

### Logo không hiển thị sau khi khôi phục?

Logo trên Demo của trang chính thức được cấu hình giới hạn domain, domain local không thể load. Vào **Cài đặt hệ thống** upload lại Logo của bạn là được.

### Lỗi khi upload file (lỗi OSS Key)?

Sau khi cài đặt bằng cách SQL, upload file có thể báo lỗi liên quan đến OSS. Cách giải quyết: vào **Quản lý Plugin → File Manager**, đặt **Local Storage (lưu trữ cục bộ)** làm storage mặc định, lưu lại là có thể upload bình thường.

### Nâng cấp tăng dần thì sao?

Hiện tại nâng cấp phiên bản là thay thế toàn bộ, các tùy chỉnh sẽ bị ghi đè. Nhớ backup trước khi nâng cấp. Phương án migration tăng dần đang được lên kế hoạch, sẽ ưu tiên hỗ trợ bản Pro/Enterprise. Bản Community do thiếu Plugin quản lý migration nên hiện tại khó hỗ trợ.

Hy vọng hướng dẫn này giúp bạn triển khai hệ thống CRM 2.0 thuận lợi. Nếu gặp bất kỳ vấn đề nào trong quá trình thao tác, hãy liên hệ với chúng tôi bất cứ lúc nào!

---

*Cập nhật lần cuối: 2026-04-02*
