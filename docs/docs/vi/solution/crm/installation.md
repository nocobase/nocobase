---
title: "CRM 2.0 Cách cài đặt"
description: "Triển khai cài đặt CRM 2.0: khôi phục một cú nhấn bằng plugin Backup Manager nay đã mã nguồn mở, cần PostgreSQL 16, DB_UNDERSCORED không được là true."
keywords: "Cài đặt CRM,Khôi phục backup,Backup Manager,PostgreSQL,NocoBase"
---

# Cách cài đặt

> Phiên bản hiện tại được triển khai dưới hình thức **khôi phục từ backup**. Trong các phiên bản sau, có thể chuyển sang hình thức **migration tăng dần** để dễ dàng tích hợp giải pháp vào hệ thống hiện có của bạn.

> **Plugin Backup Manager nay đã mã nguồn mở**: plugin "[Backup Manager](https://docs-cn.nocobase.com/handbook/backups)" cần thiết để khôi phục giải pháp nay đã mã nguồn mở và khả dụng cho mọi phiên bản (bao gồm cả Community). Chúng tôi khuyến nghị khôi phục trực tiếp qua plugin này.

Trước khi bắt đầu, hãy đảm bảo rằng:

- Bạn đã có một môi trường NocoBase hoạt động cơ bản. Về việc cài đặt hệ thống chính, vui lòng tham khảo [tài liệu cài đặt chính thức](https://docs-cn.nocobase.com/welcome/getting-started/installation) chi tiết hơn.
- Phiên bản NocoBase **v2.1.0-beta.2 trở lên**
- Bạn đã tải xuống file backup của hệ thống CRM: [nocobase_crm_v2_backup_260523.nbdata](https://static-docs.nocobase.com/nocobase_crm_v2_backup_260523.nbdata)

**Lưu ý quan trọng**:
- Giải pháp này được tạo dựa trên cơ sở dữ liệu **PostgreSQL 16**, hãy đảm bảo môi trường của bạn dùng PostgreSQL 16.
- **DB_UNDERSCORED không được là true**: Hãy kiểm tra file `docker-compose.yml`, đảm bảo biến môi trường `DB_UNDERSCORED` không được set là `true`, nếu không sẽ xung đột với backup của giải pháp khiến khôi phục thất bại.

---

## Khôi phục bằng Backup Manager

Cách này dùng Plugin "[Backup Manager](https://docs-cn.nocobase.com/handbook/backups)" tích hợp sẵn của NocoBase để khôi phục một cú nhấn, thao tác đơn giản nhất. Plugin này nay đã mã nguồn mở và khả dụng cho mọi phiên bản (bao gồm cả Community).

### Đặc điểm chính

* **Ưu điểm**:
  1. **Thao tác tiện lợi**: Hoàn thành ngay trên giao diện UI, có thể khôi phục đầy đủ tất cả cấu hình bao gồm cả Plugin.
  2. **Khôi phục đầy đủ**: **Có thể khôi phục tất cả file hệ thống**, bao gồm file template in, file đã upload trong trường file của bảng, đảm bảo tính năng đầy đủ.
* **Hạn chế**:
  1. **Yêu cầu môi trường khắt khe**: Yêu cầu môi trường cơ sở dữ liệu của bạn (phiên bản, cài đặt phân biệt chữ hoa/thường, v.v.) phải tương thích cao với môi trường khi tạo backup.
  2. **Phụ thuộc Plugin**: Nếu giải pháp chứa Plugin thương mại không có trong môi trường local của bạn, khôi phục sẽ thất bại.

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

## Câu hỏi thường gặp

### Bản Pro có dùng được không? Có báo lỗi không?

Có thể dùng trực tiếp, không báo lỗi. Demo có sử dụng một số Plugin Enterprise (như Quản lý Email, Audit Log, v.v.), bản Pro thiếu các Plugin này thì các điểm vào tính năng tương ứng sẽ không hiển thị, nhưng **không ảnh hưởng đến các tính năng khác của hệ thống**. Ví dụ điểm vào Email sẽ biến mất, nhưng các module cốt lõi như Lead, Cơ hội, Đơn hàng vẫn hoạt động hoàn toàn bình thường.

### Sau khi khôi phục nên chọn phiên bản nào?

Khuyến nghị dùng image phiên bản `beta-full` mới nhất (như `nocobase/nocobase:beta-full`). Image `full` tích hợp sẵn các phụ thuộc như client cơ sở dữ liệu, tránh khôi phục thất bại do thiếu công cụ.

### Logo không hiển thị sau khi khôi phục?

Logo trên Demo của trang chính thức được cấu hình giới hạn domain, domain local không thể load. Vào **Cài đặt hệ thống** upload lại Logo của bạn là được.

### Nâng cấp tăng dần thì sao?

Hiện tại nâng cấp phiên bản là thay thế toàn bộ, các tùy chỉnh sẽ bị ghi đè. Nhớ backup trước khi nâng cấp. Phương án migration tăng dần đang được lên kế hoạch, sẽ ưu tiên hỗ trợ bản Pro/Enterprise. Bản Community do thiếu Plugin quản lý migration nên hiện tại khó hỗ trợ.

Hy vọng hướng dẫn này giúp bạn triển khai hệ thống CRM 2.0 thuận lợi. Nếu gặp bất kỳ vấn đề nào trong quá trình thao tác, hãy liên hệ với chúng tôi bất cứ lúc nào!

---

*Cập nhật lần cuối: 2026-04-02*
