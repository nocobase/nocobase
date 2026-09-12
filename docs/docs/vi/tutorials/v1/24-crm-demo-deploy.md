# Hướng dẫn Triển khai CRM Demo

Để giúp bạn có thể nhanh chóng và thuận lợi Triển khai Demo này vào môi trường NocoBase của riêng mình, chúng tôi cung cấp hai phương thức khôi phục. Vui lòng chọn phương thức phù hợp nhất với bạn dựa trên phiên bản người dùng và nền tảng kỹ thuật của bạn.

Trước khi bắt đầu, vui lòng đảm bảo

- Bạn đã có một môi trường NocoBase chạy cơ bản. Về cài đặt hệ thống chính, vui lòng tham khảo [Tài liệu cài đặt chính thức](https://docs-cn.nocobase.com/welcome/getting-started/installation) chi tiết hơn.
- Bạn đã tải các file tương ứng của CRM Demo (phiên bản tiếng Trung):
  - **File Backup** (khoảng 21.2MB): [nocobase_crm_demo_cn.nbdata](https://static-docs.nocobase.com/nocobase_crm_demo_cn.nbdata) - Áp dụng cho phương pháp 1
  - **File SQL** (sau khi nén khoảng 9MB): [nocobase_crm_demo_cn.zip](https://static-docs.nocobase.com/nocobase_crm_demo_cn.zip) - Áp dụng cho phương pháp 2

**Lưu ý quan trọng**: Demo này được tạo dựa trên cơ sở dữ liệu **PostgreSQL**, vui lòng đảm bảo môi trường của bạn sử dụng cơ sở dữ liệu PostgreSQL.

---

### Phương pháp 1: Sử dụng Backup Manager để khôi phục (Khuyến nghị cho người dùng phiên bản chuyên nghiệp/doanh nghiệp)

Phương thức này thông qua Plugin "[Backup Manager](https://docs-cn.nocobase.com/handbook/backups)" (phiên bản chuyên nghiệp/doanh nghiệp) tích hợp sẵn của NocoBase để khôi phục một cú nhấp chuột, thao tác đơn giản nhất. Nhưng nó có một số yêu cầu nhất định về môi trường và phiên bản người dùng.

#### Đặc điểm cốt lõi

* **Ưu điểm**:
  1. **Thao tác tiện lợi**: Có thể hoàn thành trong giao diện UI, có thể khôi phục đầy đủ tất cả cấu hình bao gồm cả Plugin.
  2. **Khôi phục đầy đủ**: **Có thể khôi phục tất cả các file hệ thống**, bao gồm file in template, file được upload từ Field file trong bảng, v.v., đảm bảo tính đầy đủ chức năng của Demo.
* **Hạn chế**:
  1. **Giới hạn phiên bản chuyên nghiệp/doanh nghiệp**: "Backup Manager" là Plugin cấp doanh nghiệp, chỉ người dùng phiên bản chuyên nghiệp/doanh nghiệp mới có thể sử dụng.
  2. **Yêu cầu môi trường nghiêm ngặt**: Yêu cầu môi trường cơ sở dữ liệu của bạn (phiên bản, cài đặt phân biệt chữ hoa chữ thường, v.v.) phải tương thích cao với môi trường khi chúng tôi tạo Backup.
  3. **Phụ thuộc Plugin**: Nếu Demo bao gồm Plugin thương mại không có trong môi trường cục bộ của bạn, việc khôi phục sẽ thất bại.

#### Các bước thao tác

**Bước 1: 【Khuyến nghị mạnh mẽ】 Sử dụng image `full` để khởi động ứng dụng**

Để tránh việc khôi phục thất bại do thiếu client cơ sở dữ liệu, chúng tôi khuyến nghị mạnh mẽ bạn sử dụng image Docker phiên bản `full`. Nó tích hợp sẵn tất cả các chương trình hỗ trợ cần thiết, cho phép bạn không cần thực hiện cấu hình bổ sung. (Lưu ý: Image của chúng tôi được tạo từ 1.9.0-alpha.1, vui lòng chú ý đến tính tương thích phiên bản)

Ví dụ lệnh kéo image:

```bash
docker pull nocobase/nocobase:1.9.0-alpha.3-full
```

Sau đó sử dụng image này để khởi động dịch vụ NocoBase của bạn.

> **Lưu ý**: Nếu không sử dụng image `full`, bạn có thể cần cài đặt thủ công client cơ sở dữ liệu `pg_dump` trong container, quá trình rườm rà và không ổn định.

**Bước 2: Bật Plugin "Backup Manager"**

1. Đăng nhập vào hệ thống NocoBase của bạn.
2. Vào **`Plugin Manage`**.
3. Tìm và kích hoạt Plugin **`Backup Manager`**.

![20250711014113](https://static-docs.nocobase.com/20250711014113.png)

**Bước 3: Khôi phục từ file Backup cục bộ**

1. Sau khi kích hoạt Plugin, làm mới trang.
2. Vào menu bên trái **`Quản lý hệ thống`** -\> **`Backup Manager`**.
3. Nhấp vào nút **`Khôi phục từ Backup cục bộ`** ở góc trên bên phải.
   ![20250711014216](https://static-docs.nocobase.com/20250711014216.png)
4. Kéo và thả file Backup Demo mà chúng tôi cung cấp (thường là định dạng `.zip`) vào khu vực upload.
5. Nhấp vào **`Submit`**, kiên nhẫn chờ hệ thống hoàn tất khôi phục, quá trình này có thể mất từ vài chục giây đến vài phút.
   ![20250711014250](https://static-docs.nocobase.com/20250711014250.png)

#### Lưu ý

* **Tính tương thích cơ sở dữ liệu**: Đây là điểm quan trọng nhất của phương pháp này. **Phiên bản, bộ ký tự, cài đặt phân biệt chữ hoa chữ thường** của cơ sở dữ liệu PostgreSQL của bạn phải khớp với file nguồn Backup Demo. Đặc biệt tên `schema` phải nhất quán.
* **Khớp Plugin thương mại**: Vui lòng đảm bảo bạn đã sở hữu và kích hoạt tất cả các Plugin thương mại mà Demo yêu cầu, nếu không quá trình khôi phục sẽ bị gián đoạn.

---

### Phương pháp 2: Import trực tiếp file SQL (thông dụng, phù hợp hơn với phiên bản cộng đồng)

Phương thức này thông qua thao tác trực tiếp cơ sở dữ liệu để khôi phục dữ liệu, bỏ qua Plugin "Backup Manager", do đó không có giới hạn của Plugin phiên bản chuyên nghiệp/doanh nghiệp.

#### Đặc điểm cốt lõi

* **Ưu điểm**:
  1. **Không giới hạn phiên bản**: Áp dụng cho tất cả người dùng NocoBase, bao gồm phiên bản cộng đồng.
  2. **Khả năng tương thích cao**: Không phụ thuộc vào công cụ `dump` trong ứng dụng, chỉ cần có thể kết nối với cơ sở dữ liệu là có thể thao tác.
  3. **Khả năng dung lỗi cao**: Nếu Demo bao gồm Plugin thương mại bạn không có (như biểu đồ ECharts), các chức năng liên quan sẽ không được kích hoạt, nhưng sẽ không ảnh hưởng đến việc sử dụng bình thường các chức năng khác, ứng dụng có thể khởi động thành công.
* **Hạn chế**:
  1. **Cần khả năng thao tác cơ sở dữ liệu**: Yêu cầu người dùng có khả năng thao tác cơ sở dữ liệu cơ bản, ví dụ như cách thực thi một file `.sql`.
  2. **Mất file hệ thống**: **Phương pháp này sẽ mất tất cả các file hệ thống**, bao gồm file in template, file được upload từ Field file trong bảng, v.v. Điều này có nghĩa là:
     - Chức năng in template có thể không hoạt động bình thường
     - Các file hình ảnh, tài liệu đã upload sẽ bị mất
     - Các chức năng liên quan đến Field file sẽ bị ảnh hưởng

#### Các bước thao tác

**Bước 1: Chuẩn bị một cơ sở dữ liệu sạch**

Chuẩn bị một cơ sở dữ liệu hoàn toàn mới, trống cho dữ liệu Demo bạn sắp import.

**Bước 2: Import file `.sql` vào cơ sở dữ liệu**

Lấy file cơ sở dữ liệu Demo mà chúng tôi cung cấp (thường là định dạng `.sql`), và import nội dung của nó vào cơ sở dữ liệu bạn đã chuẩn bị ở bước trước. Có nhiều cách thực thi, tùy thuộc vào môi trường của bạn:

* **Tùy chọn A: Thông qua dòng lệnh server (lấy Docker làm ví dụ)**
  Nếu bạn sử dụng Docker để cài đặt NocoBase và cơ sở dữ liệu, bạn có thể upload file `.sql` lên server, sau đó sử dụng lệnh `docker exec` để thực thi import. Giả sử container PostgreSQL của bạn có tên `my-nocobase-db`, tên file là `crm_demo.sql`:

  ```bash
  # Sao chép file sql vào container
  docker cp crm_demo.sql my-nocobase-db:/tmp/
  # Vào container thực thi lệnh import
  docker exec -it my-nocobase-db psql -U your_username -d your_database_name -f /tmp/crm_demo.sql
  ```
* **Tùy chọn B: Thông qua client cơ sở dữ liệu từ xa**
  Nếu cơ sở dữ liệu của bạn đã expose port, bạn có thể sử dụng bất kỳ client cơ sở dữ liệu đồ họa nào (như DBeaver, Navicat, pgAdmin, v.v.) để kết nối với cơ sở dữ liệu, tạo một cửa sổ truy vấn mới, dán toàn bộ nội dung file `.sql` vào, sau đó thực thi.

**Bước 3: Kết nối cơ sở dữ liệu và khởi động ứng dụng**

Cấu hình các tham số khởi động NocoBase của bạn (như biến môi trường `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, v.v.), trỏ chúng đến cơ sở dữ liệu mà bạn vừa import dữ liệu. Sau đó, khởi động dịch vụ NocoBase bình thường.

![img_v3_02o3_eb637bd2-88c3-400b-8421-1ac2057d1aag](https://static-docs.nocobase.com/img_v3_02o3_eb637bd2-88c3-400b-8421-1ac2057d1aag.png)

#### Lưu ý

* **Quyền cơ sở dữ liệu**: Phương pháp này yêu cầu bạn có tài khoản và mật khẩu có thể thao tác trực tiếp cơ sở dữ liệu.
* **Trạng thái Plugin**: Sau khi import thành công, dữ liệu Plugin thương mại bao gồm trong hệ thống mặc dù tồn tại, nhưng nếu cục bộ bạn chưa cài đặt và kích hoạt Plugin tương ứng, các chức năng liên quan (như biểu đồ Echarts, Field cụ thể, v.v.) sẽ không thể hiển thị và sử dụng, nhưng điều này sẽ không khiến ứng dụng bị crash.

---

### Tổng kết và so sánh


| Đặc tính               | Phương pháp 1: Backup Manager                                       | Phương pháp 2: Import SQL trực tiếp                                                                                |
| :--------------------- | :----------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| **Người dùng phù hợp** | Người dùng phiên bản **chuyên nghiệp/doanh nghiệp**                | **Tất cả người dùng** (bao gồm phiên bản cộng đồng)                                                               |
| **Độ dễ thao tác**     | (Rất đơn giản, thao tác UI)                                        | (Cần kiến thức cơ sở dữ liệu cơ bản)                                                                              |
| **Yêu cầu môi trường** | **Nghiêm ngặt**, cơ sở dữ liệu, phiên bản hệ thống cần tương thích cao | **Bình thường**, cần cơ sở dữ liệu tương thích                                                                    |
| **Phụ thuộc Plugin**   | **Phụ thuộc mạnh**, sẽ kiểm tra Plugin khi khôi phục, thiếu bất kỳ Plugin nào sẽ dẫn đến **khôi phục thất bại**. | **Chức năng phụ thuộc mạnh vào Plugin**. Dữ liệu có thể được import độc lập, hệ thống có chức năng cơ bản. Nhưng nếu thiếu Plugin tương ứng, các chức năng liên quan sẽ **hoàn toàn không thể sử dụng**. |
| **File hệ thống**      | **Giữ lại đầy đủ** (template in, file upload, v.v.)                | **Sẽ bị mất** (template in, file upload, v.v.)                                                                    |
| **Kịch bản khuyến nghị** | Người dùng doanh nghiệp, môi trường có thể kiểm soát, nhất quán, cần demo chức năng đầy đủ | Thiếu một số Plugin, theo đuổi tính tương thích cao, linh hoạt, không phải người dùng phiên bản chuyên nghiệp/doanh nghiệp, có thể chấp nhận thiếu chức năng file |

Hy vọng hướng dẫn này có thể giúp bạn Triển khai CRM Demo một cách thuận lợi. Nếu bạn gặp bất kỳ vấn đề nào trong quá trình thao tác, hãy liên hệ với chúng tôi bất cứ lúc nào!
