---
pkg: '@nocobase/plugin-migration-manager'
title: "Quản lý Migration"
description: "Quản lý vận hành migration: di chuyển cấu hình application từ một environment sang environment khác, hỗ trợ các quy tắc migration như chỉ structure, ghi đè, Upsert, insert bỏ qua trùng lặp, skip, phụ thuộc plugin Backup Manager."
keywords: "Quản lý Migration,Migration,di chuyển cấu hình application,quy tắc migration,Upsert,migration database,quản lý vận hành,NocoBase"
---
# Quản lý Migration

## Giới thiệu

Plugin Migration Manager dùng để di chuyển cấu hình application từ một environment (ví dụ Staging) sang environment khác (ví dụ PROD).

**Sự khác biệt cốt lõi:**

- **Quản lý Migration:** Tập trung vào việc di chuyển cấu hình application cụ thể, structure data table hoặc một phần dữ liệu.
- **[Quản lý Sao lưu](../backup-manager/index.mdx):** Tập trung vào sao lưu và khôi phục toàn bộ dữ liệu.

## Cài đặt

Phụ thuộc vào plugin [Quản lý Sao lưu](../backup-manager/index.mdx), vui lòng đảm bảo đã cài đặt và kích hoạt.

## Quy trình và nguyên lý

Di chuyển data table và dữ liệu của database chính theo quy tắc migration, từ một application sang application khác. Lưu ý rằng dữ liệu của database bên ngoài và sub-application sẽ không được di chuyển.

![20250102202546](https://static-docs.nocobase.com/20250102202546.png)

## Quy tắc Migration

### Quy tắc tích hợp sẵn

Hỗ trợ năm quy tắc migration sau:

- **Chỉ structure:** Chỉ đồng bộ structure data table, không liên quan đến việc insert hoặc update dữ liệu.
- **Ghi đè (xóa trắng và insert lại):** Xóa trắng record của table hiện tại, sau đó insert dữ liệu mới.
- **Insert hoặc Update (Upsert):** Phán đoán theo primary key, nếu record tồn tại thì update, nếu không tồn tại thì insert.
- **Insert bỏ qua trùng lặp:** Insert record mới, nếu primary key bị trùng thì bỏ qua (không update record hiện tại).
- **Skip:** Không xử lý gì cho table này.

**Ghi chú:**
- Ghi đè, Insert hoặc Update, Insert bỏ qua trùng lặp cũng sẽ đồng bộ thay đổi structure table.
- Table có ID tự tăng làm primary key hoặc không có primary key không hỗ trợ "Insert hoặc Update" và "Insert bỏ qua trùng lặp".

### Thiết kế chi tiết

![20250102204909](https://static-docs.nocobase.com/20250102204909.png)

### Giao diện cấu hình

Cấu hình quy tắc migration

![20250102205450](https://static-docs.nocobase.com/20250102205450.png)

Bật quy tắc độc lập

![20250107105005](https://static-docs.nocobase.com/20250107105005.png)

Chọn quy tắc độc lập và data table được xử lý theo quy tắc độc lập hiện tại

![20250107104644](https://static-docs.nocobase.com/20250107104644.png)

## File Migration

![20250102205844](https://static-docs.nocobase.com/20250102205844.png)

### Tạo migration mới

![20250102205857](https://static-docs.nocobase.com/20250102205857.png)

### Thực thi migration

![20250102205915](https://static-docs.nocobase.com/20250102205915.png)

#### Kiểm tra biến môi trường

Kiểm tra biến môi trường application (tìm hiểu [biến môi trường](../variables-and-secrets/index.md) là gì)

![20250102212311](https://static-docs.nocobase.com/20250102212311.png)

Nếu các biến `DB_UNDERSCORED`, `USE_DB_SCHEMA_IN_SUBAPP`, `DB_TABLE_PREFIX`, `DB_SCHEMA`, `COLLECTION_MANAGER_SCHEMA` trong .env không khớp, popup sẽ thông báo không thể tiếp tục migration

![918b8d56037681b29db8396ccad63364](https://static-docs.nocobase.com/918b8d56037681b29db8396ccad63364.png)

Nếu thiếu biến môi trường hoặc secret được cấu hình động, popup sẽ thông báo cho người dùng, cần điền biến môi trường hoặc secret cần thêm tại đây, sau đó tiếp tục

![93a4fcb44f92c43d827d57b7874f6ae6](https://static-docs.nocobase.com/93a4fcb44f92c43d827d57b7874f6ae6.png)

#### Kiểm tra Plugin

Kiểm tra plugin của application, nếu environment hiện tại thiếu plugin sẽ có popup thông báo, lúc này cũng có thể chọn tiếp tục migration

![bb5690a1e95660e1a5e0fd7440b6425c](https://static-docs.nocobase.com/bb5690a1e95660e1a5e0fd7440b6425c.png)

## Log Migration và lưu trữ

Sau khi thực thi migration, file log thực thi sẽ được lưu trên server, có thể xem online hoặc tải xuống.

![20251225184721](https://static-docs.nocobase.com/20251225184721.png)

Khi xem online file log thực thi, còn có thể tải xuống SQL được thực thi khi migration data structure.

![20251227164116](https://static-docs.nocobase.com/20251227164116.png)

Bấm nút `Quá trình` để xem quá trình thực thi migration đã hoàn thành

![c065716cfbb7655f5826bf0ceae4b156](https://static-docs.nocobase.com/c065716cfbb7655f5826bf0ceae4b156.png)

![f4abe566de1186a9432174ce70b2f960](https://static-docs.nocobase.com/f4abe566de1186a9432174ce70b2f960.png)

### Về thư mục `storage`

Migration Manager chủ yếu xử lý record của database. Một phần dữ liệu trong thư mục `storage` (như log, lịch sử backup, log request...) sẽ không được tự động migrate.

- Nếu cần giữ lại các file này trong environment mới, bạn cần copy thủ công các thư mục liên quan trong thư mục `storage`.

## Rollback

Trước khi thực thi migration, hệ thống sẽ tự động tạo bản sao lưu.

### Nguyên tắc rollback

1.  **Dừng dịch vụ:** Trước khi bắt đầu rollback, dừng application để ngăn dữ liệu mới được ghi vào.
2.  **Khớp phiên bản:** Phiên bản kernel NocoBase (Docker image) **bắt buộc** phải khớp với phiên bản tại thời điểm tạo file backup.
3.  **Khôi phục environment hoàn toàn mới:** Nếu database hoặc storage hiện tại đã bị hỏng, chỉ khôi phục phiên bản image có thể không đủ. Cách đáng tin cậy nhất là **trong instance application hoàn toàn mới (database và storage mới)** sử dụng image kernel đúng để khôi phục bản sao lưu.

### Quy trình rollback

#### Tình huống A: Task migration thực thi thất bại
Nếu chỉ là task migration thực thi gặp lỗi nhưng phiên bản kernel chưa thay đổi, vui lòng sử dụng trực tiếp [Quản lý Sao lưu](../backup-manager/index.mdx) để khôi phục bản sao lưu được tạo tự động trước khi migration.

#### Tình huống B: Hệ thống bị hỏng hoặc nâng cấp kernel thất bại
Nếu việc nâng cấp hoặc migration khiến hệ thống không thể hoạt động, cần rollback về trạng thái ổn định:
1.  **Dừng application:** Dừng dịch vụ container hiện tại.
2.  **Chuẩn bị environment hoàn toàn mới:** Chuẩn bị một database trống và storage trống mới.
3.  **Triển khai phiên bản mục tiêu:** Đổi tag Docker image về phiên bản *tại thời điểm tạo backup*.
4.  **Khôi phục bản sao lưu:** Trong environment sạch này, qua [Quản lý Sao lưu](../backup-manager/index.mdx) thực thi khôi phục.
5.  **Chuyển traffic:** Cập nhật gateway/load balancer, chuyển traffic đến instance hoàn toàn mới đã được khôi phục này.

![20251227164004](https://static-docs.nocobase.com/20251227164004.png)

## Command line

### `yarn nocobase migration generate`

```bash
Usage: nocobase migration generate [options]

Options:
  --title [title]    migration title
  --ruleId <ruleId>  migration rule id
```

Ví dụ

```bash
yarn nocobase migration generate --ruleId=1
```

### `yarn nocobase migration run`

```bash
Usage: nocobase migration run [options] <filePath>

Arguments:
  filePath           migration file path

Options:
  --skip-backup      skip backup
  --var [var]        variable (default: [])
  --secret [secret]  secret (default: [])
```

Ví dụ

```bash
yarn nocobase migration run /your/path/migration_1775658568158.nbdata \
  && --var A=a --var B=b \
  && --secret C=c --secret D=d
```

## Best Practice

### Quy trình triển khai khuyến nghị (Blue-Green Switch)

Để đảm bảo không downtime hoặc downtime cực ngắn, và đạt được độ an toàn cao nhất, khuyến nghị sử dụng phương án chuyển đổi hai environment:

1.  **Giai đoạn chuẩn bị (Staging):** Tạo file migration trong environment Staging.
2.  **Sao lưu an toàn (PROD-A):** Tạo bản sao lưu toàn bộ cho environment production hiện tại (PROD-A).
3.  **Triển khai song song (PROD-B):** Triển khai một instance production *hoàn toàn mới, database trống* (PROD-B), sử dụng phiên bản kernel mục tiêu.
4.  **Khôi phục và migration:**
    *   Khôi phục bản sao lưu của PROD-A vào PROD-B.
    *   Trong PROD-B thực thi file migration từ Staging.
5.  **Xác minh:** Trong khi PROD-A vẫn đang phục vụ, thực hiện kiểm tra kỹ lưỡng PROD-B.
6.  **Chuyển traffic:** Cập nhật Nginx/gateway, chuyển traffic từ PROD-A sang PROD-B.
    *   *Nếu gặp vấn đề, có thể chuyển ngay lập tức về PROD-A.*

### Tính nhất quán dữ liệu và bảo trì downtime

Hiện tại NocoBase chưa hỗ trợ migration không downtime. Để tránh dữ liệu không nhất quán trong quá trình backup hoặc migration:
- **Đóng gateway/entry:** Khuyến nghị mạnh mẽ dừng truy cập của người dùng trước khi bắt đầu backup hoặc migration. Bạn có thể qua cấu hình Nginx hoặc gateway để cấu hình **trang bảo trì 503**, thông báo cho người dùng rằng hệ thống đang bảo trì và ngăn dữ liệu mới được ghi vào.
- **Đồng bộ dữ liệu thủ công:** Nếu trong quá trình migration người dùng vẫn tiếp tục tạo dữ liệu trong phiên bản cũ, các dữ liệu này cần được đồng bộ thủ công sau đó.
