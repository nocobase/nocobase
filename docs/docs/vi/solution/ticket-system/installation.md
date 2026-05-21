---
title: "Cách cài đặt giải pháp Ticket"
description: "Triển khai cài đặt giải pháp Ticket: khôi phục bằng Backup Manager (Pro/Enterprise) hoặc nhập file SQL (Community), yêu cầu PostgreSQL 16, NocoBase 2.0.0-beta.5 trở lên."
keywords: "Cài đặt Ticket,Khôi phục backup,Backup Manager,Nhập SQL,PostgreSQL,NocoBase"
---

# Cách cài đặt

> Phiên bản hiện tại sử dụng hình thức **khôi phục backup** để triển khai. Trong các phiên bản sau, chúng tôi có thể chuyển sang hình thức **migration tăng dần**, để dễ dàng tích hợp giải pháp vào hệ thống đã có của bạn.

Để bạn có thể nhanh chóng và thuận lợi triển khai giải pháp Ticket vào môi trường NocoBase của riêng mình, chúng tôi cung cấp hai cách khôi phục. Vui lòng chọn cách phù hợp nhất tùy theo phiên bản người dùng và nền tảng kỹ thuật của bạn.

Trước khi bắt đầu, vui lòng đảm bảo:

- Bạn đã có một môi trường NocoBase cơ bản đang chạy. Về việc cài đặt hệ thống chính, vui lòng tham khảo [tài liệu cài đặt chính thức](https://docs-cn.nocobase.com/welcome/getting-started/installation) chi tiết hơn.
- Phiên bản NocoBase **2.0.0-beta.5 trở lên**
- Bạn đã tải xuống các file tương ứng của hệ thống Ticket:
  - **File backup**: [nocobase_tickets_v2_backup_260324.nbdata](https://static-docs.nocobase.com/nocobase_tickets_v2_backup_260324.nbdata) - Áp dụng cho phương pháp một
  - **File SQL**: [nocobase_tickets_v2_sql_260324.zip](https://static-docs.nocobase.com/nocobase_tickets_v2_sql_260324.zip) - Áp dụng cho phương pháp hai

**Lưu ý quan trọng**:
- Giải pháp này được tạo dựa trên cơ sở dữ liệu **PostgreSQL 16**, vui lòng đảm bảo môi trường của bạn sử dụng PostgreSQL 16.
- **DB_UNDERSCORED không được là true**: Vui lòng kiểm tra file `docker-compose.yml` của bạn, đảm bảo biến môi trường `DB_UNDERSCORED` không được đặt là `true`, nếu không sẽ xung đột với backup giải pháp dẫn đến khôi phục thất bại.

---

## Phương pháp một: Khôi phục bằng Backup Manager (khuyến nghị cho người dùng Pro/Enterprise)

Cách này thông qua Plugin "[Backup Manager](https://docs-cn.nocobase.com/handbook/backups)" tích hợp sẵn của NocoBase (Pro/Enterprise) để khôi phục một cú nhấn, thao tác đơn giản nhất. Nhưng có một số yêu cầu về môi trường và phiên bản người dùng.

### Đặc điểm cốt lõi

* **Ưu điểm**:
  1. **Thao tác tiện lợi**: Có thể hoàn thành ngay trên giao diện UI, có thể khôi phục đầy đủ tất cả cấu hình bao gồm cả Plugin.
  2. **Khôi phục đầy đủ**: **Có thể khôi phục tất cả file hệ thống**, bao gồm các file Template in ấn, file đã upload trong trường file của bảng..., đảm bảo đầy đủ tính năng.
* **Hạn chế**:
  1. **Chỉ dành cho Pro/Enterprise**: "Backup Manager" là Plugin cấp doanh nghiệp, chỉ có người dùng Pro/Enterprise mới có thể dùng.
  2. **Yêu cầu môi trường nghiêm ngặt**: Yêu cầu môi trường cơ sở dữ liệu của bạn (phiên bản, cài đặt phân biệt hoa thường...) phải tương thích cao với môi trường khi chúng tôi tạo backup.
  3. **Phụ thuộc Plugin**: Nếu giải pháp chứa Plugin thương mại không có trong môi trường local của bạn, việc khôi phục sẽ thất bại.

### Các bước thực hiện

**Bước 1: 【Khuyến nghị mạnh】Khởi động ứng dụng bằng image `full`**

Để tránh khôi phục thất bại do thiếu database client, chúng tôi mạnh mẽ khuyến nghị bạn sử dụng phiên bản Docker image `full`. Nó tích hợp sẵn tất cả các chương trình phối hợp cần thiết, giúp bạn không cần cấu hình thêm.

Ví dụ lệnh pull image:

```bash
docker pull nocobase/nocobase:beta-full
```

Sau đó dùng image này để khởi động dịch vụ NocoBase của bạn.

> **Lưu ý**: Nếu không sử dụng image `full`, có thể bạn sẽ phải cài đặt thủ công database client `pg_dump` trong container, quá trình rườm rà và không ổn định.

**Bước 2: Bật Plugin "Backup Manager"**

1. Đăng nhập vào hệ thống NocoBase của bạn.
2. Vào **`Quản lý Plugin`**.
3. Tìm và kích hoạt Plugin **`Backup Manager`**.

**Bước 3: Khôi phục từ file backup local**

1. Sau khi kích hoạt Plugin, làm mới trang.
2. Vào menu bên trái **`Quản lý hệ thống`** -> **`Backup Manager`**.
3. Nhấn nút **`Khôi phục từ backup local`** ở góc trên bên phải.
4. Kéo file backup đã tải xuống vào khu vực upload.
5. Nhấn **`Submit`**, kiên nhẫn đợi hệ thống khôi phục xong, quá trình này có thể mất từ vài chục giây đến vài phút.

### Lưu ý

* **Tương thích cơ sở dữ liệu**: Đây là điểm quan trọng nhất của phương pháp này. **Phiên bản, bộ ký tự, cài đặt phân biệt hoa thường** của cơ sở dữ liệu PostgreSQL của bạn phải khớp với file backup nguồn. Đặc biệt tên `schema` phải nhất quán.
* **Khớp Plugin thương mại**: Vui lòng đảm bảo bạn đã sở hữu và kích hoạt tất cả Plugin thương mại mà giải pháp yêu cầu, nếu không việc khôi phục sẽ bị gián đoạn.

---

## Phương pháp hai: Nhập trực tiếp file SQL (chung, phù hợp hơn với Community)

Cách này thông qua thao tác trực tiếp trên cơ sở dữ liệu để khôi phục dữ liệu, bỏ qua Plugin "Backup Manager", do đó không có giới hạn của Plugin Pro/Enterprise.

### Đặc điểm cốt lõi

* **Ưu điểm**:
  1. **Không giới hạn phiên bản**: Áp dụng cho tất cả người dùng NocoBase, bao gồm cả Community.
  2. **Tương thích cao**: Không phụ thuộc vào công cụ `dump` trong ứng dụng, chỉ cần kết nối được cơ sở dữ liệu là có thể thao tác.
  3. **Khả năng dung lỗi cao**: Nếu giải pháp chứa Plugin thương mại bạn không có, các tính năng liên quan sẽ không được kích hoạt, nhưng không ảnh hưởng đến việc sử dụng bình thường của các tính năng khác, ứng dụng có thể khởi động thành công.
* **Hạn chế**:
  1. **Yêu cầu khả năng thao tác cơ sở dữ liệu**: Yêu cầu người dùng có khả năng thao tác cơ sở dữ liệu cơ bản, ví dụ như cách thực thi một file `.sql`.
  2. **Mất file hệ thống**: **Phương pháp này sẽ mất tất cả file hệ thống**, bao gồm Template in ấn, file đã upload trong trường file của bảng...

### Các bước thực hiện

**Bước 1: Chuẩn bị một cơ sở dữ liệu sạch**

Chuẩn bị một cơ sở dữ liệu hoàn toàn mới và trống cho dữ liệu sắp được nhập.

**Bước 2: Nhập file `.sql` vào cơ sở dữ liệu**

Lấy file cơ sở dữ liệu đã tải xuống (thường ở định dạng `.sql`), và nhập nội dung của nó vào cơ sở dữ liệu mà bạn đã chuẩn bị ở bước trước. Có nhiều cách thực thi, tùy thuộc vào môi trường của bạn:

* **Phương án A: Qua command line server (lấy Docker làm ví dụ)**
  Nếu bạn cài đặt NocoBase và cơ sở dữ liệu bằng Docker, có thể upload file `.sql` lên server, sau đó dùng lệnh `docker exec` để thực thi nhập. Giả sử container PostgreSQL của bạn tên là `my-nocobase-db`, file tên là `ticket_system.sql`:

  ```bash
  # Sao chép file sql vào container
  docker cp ticket_system.sql my-nocobase-db:/tmp/
  # Vào container thực thi lệnh nhập
  docker exec -it my-nocobase-db psql -U your_username -d your_database_name -f /tmp/ticket_system.sql
  ```
* **Phương án B: Qua database client từ xa**
  Nếu cơ sở dữ liệu của bạn đã expose port, có thể sử dụng bất kỳ database client đồ họa nào (như DBeaver, Navicat, pgAdmin...) để kết nối với cơ sở dữ liệu, mở một cửa sổ truy vấn mới, dán toàn bộ nội dung của file `.sql` vào, sau đó thực thi.

**Bước 3: Kết nối cơ sở dữ liệu và khởi động ứng dụng**

Cấu hình các tham số khởi động NocoBase của bạn (như biến môi trường `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`...), trỏ đến cơ sở dữ liệu mà bạn vừa nhập dữ liệu vào. Sau đó, khởi động dịch vụ NocoBase bình thường.

### Lưu ý

* **Quyền cơ sở dữ liệu**: Phương pháp này yêu cầu bạn có tài khoản và mật khẩu có thể thao tác trực tiếp trên cơ sở dữ liệu.
* **Trạng thái Plugin**: Sau khi nhập thành công, dữ liệu Plugin thương mại trong hệ thống tuy tồn tại, nhưng nếu local của bạn chưa cài đặt và kích hoạt Plugin tương ứng, các tính năng liên quan sẽ không thể hiển thị và sử dụng, nhưng điều này sẽ không gây sập ứng dụng.

---

## Tóm tắt và so sánh

| Đặc điểm        | Phương pháp một: Backup Manager                                  | Phương pháp hai: Nhập trực tiếp SQL                                                                    |
| :-------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Người dùng áp dụng**    | Người dùng **Pro/Enterprise**                                              | **Tất cả người dùng** (bao gồm Community)                                                                             |
| **Độ đơn giản thao tác**  | ⭐⭐⭐⭐⭐ (Rất đơn giản, thao tác UI)                                   | ⭐⭐⭐ (Cần kiến thức cơ sở dữ liệu cơ bản)                                                                            |
| **Yêu cầu môi trường**    | **Nghiêm ngặt**, cơ sở dữ liệu, phiên bản hệ thống... cần tương thích cao                           | **Bình thường**, cần tương thích cơ sở dữ liệu                                                                               |
| **Phụ thuộc Plugin**    | **Phụ thuộc mạnh**, khi khôi phục sẽ kiểm tra Plugin, thiếu bất kỳ Plugin nào sẽ dẫn đến **khôi phục thất bại**. | **Tính năng phụ thuộc mạnh vào Plugin**. Dữ liệu có thể nhập độc lập, hệ thống có tính năng cơ bản. Nhưng nếu thiếu Plugin tương ứng, các tính năng liên quan sẽ **hoàn toàn không thể sử dụng**. |
| **File hệ thống**    | **Giữ nguyên đầy đủ** (Template in ấn, file đã upload...)                          | **Sẽ bị mất** (Template in ấn, file đã upload...)                                                                  |
| **Kịch bản khuyến nghị**   | Người dùng doanh nghiệp, môi trường có thể kiểm soát, nhất quán, cần tính năng đầy đủ                     | Thiếu một số Plugin, theo đuổi tính tương thích cao, linh hoạt, không phải người dùng Pro/Enterprise, có thể chấp nhận thiếu tính năng file                                |

Hy vọng tutorial này giúp bạn triển khai thành công hệ thống Ticket. Nếu bạn gặp bất kỳ vấn đề gì trong quá trình thao tác, hãy tự nhiên liên hệ với chúng tôi!

---

*Last updated: 2026-03-24*
