---
title: "Cách cài đặt giải pháp Ticket"
description: "Triển khai cài đặt giải pháp Ticket: khôi phục một cú nhấn bằng plugin Backup Manager nay đã mã nguồn mở, yêu cầu PostgreSQL 16, NocoBase 2.0.0-beta.5 trở lên."
keywords: "Cài đặt Ticket,Khôi phục backup,Backup Manager,PostgreSQL,NocoBase"
---

# Cách cài đặt

> Phiên bản hiện tại sử dụng hình thức **khôi phục backup** để triển khai. Trong các phiên bản sau, chúng tôi có thể chuyển sang hình thức **migration tăng dần**, để dễ dàng tích hợp giải pháp vào hệ thống đã có của bạn.

> **Plugin Backup Manager nay đã mã nguồn mở**: plugin "[Backup Manager](https://docs-cn.nocobase.com/handbook/backups)" cần thiết để khôi phục giải pháp nay đã mã nguồn mở và khả dụng cho mọi phiên bản (bao gồm cả Community). Chúng tôi khuyến nghị khôi phục trực tiếp qua plugin này.

Trước khi bắt đầu, vui lòng đảm bảo:

- Bạn đã có một môi trường NocoBase cơ bản đang chạy. Về việc cài đặt hệ thống chính, vui lòng tham khảo [tài liệu cài đặt chính thức](https://docs-cn.nocobase.com/welcome/getting-started/installation) chi tiết hơn.
- Phiên bản NocoBase **2.0.0-beta.5 trở lên**
- Bạn đã tải xuống file backup của hệ thống Ticket: [nocobase_tickets_v2_backup_260324.nbdata](https://static-docs.nocobase.com/nocobase_tickets_v2_backup_260324.nbdata)

**Lưu ý quan trọng**:
- Giải pháp này được tạo dựa trên cơ sở dữ liệu **PostgreSQL 16**, vui lòng đảm bảo môi trường của bạn sử dụng PostgreSQL 16.
- **DB_UNDERSCORED không được là true**: Vui lòng kiểm tra file `docker-compose.yml` của bạn, đảm bảo biến môi trường `DB_UNDERSCORED` không được đặt là `true`, nếu không sẽ xung đột với backup giải pháp dẫn đến khôi phục thất bại.

---

## Khôi phục bằng Backup Manager

Cách này thông qua Plugin "[Backup Manager](https://docs-cn.nocobase.com/handbook/backups)" tích hợp sẵn của NocoBase để khôi phục một cú nhấn, thao tác đơn giản nhất. Plugin này nay đã mã nguồn mở và khả dụng cho mọi phiên bản (bao gồm cả Community).

### Đặc điểm cốt lõi

* **Ưu điểm**:
  1. **Thao tác tiện lợi**: Có thể hoàn thành ngay trên giao diện UI, có thể khôi phục đầy đủ tất cả cấu hình bao gồm cả Plugin.
  2. **Khôi phục đầy đủ**: **Có thể khôi phục tất cả file hệ thống**, bao gồm các file Template in ấn, file đã upload trong trường file của bảng..., đảm bảo đầy đủ tính năng.
* **Hạn chế**:
  1. **Yêu cầu môi trường nghiêm ngặt**: Yêu cầu môi trường cơ sở dữ liệu của bạn (phiên bản, cài đặt phân biệt hoa thường...) phải tương thích cao với môi trường khi chúng tôi tạo backup.
  2. **Phụ thuộc Plugin**: Nếu giải pháp chứa Plugin thương mại không có trong môi trường local của bạn, việc khôi phục sẽ thất bại.

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

Hy vọng tutorial này giúp bạn triển khai thành công hệ thống Ticket. Nếu bạn gặp bất kỳ vấn đề gì trong quá trình thao tác, hãy tự nhiên liên hệ với chúng tôi!

---

*Last updated: 2026-03-24*
