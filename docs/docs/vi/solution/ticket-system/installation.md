:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/solution/ticket-system/installation).
:::

# Cách cài đặt

> Phiên bản hiện tại sử dụng hình thức **sao lưu và khôi phục** để triển khai. Trong các phiên bản sau, chúng tôi có thể chuyển sang hình thức **di chuyển tăng cường** (incremental migration) để tạo điều kiện tích hợp giải pháp vào hệ thống hiện có của bạn.

Để bạn có thể triển khai giải pháp công đơn vào môi trường NocoBase của riêng mình một cách nhanh chóng và suôn sẻ, chúng tôi cung cấp hai phương thức khôi phục. Vui lòng chọn phương thức phù hợp nhất với phiên bản người dùng và nền tảng kỹ thuật của bạn.

Trước khi bắt đầu, vui lòng đảm bảo:

- Bạn đã có một môi trường chạy NocoBase cơ bản. Về việc cài đặt hệ thống chính, vui lòng tham khảo [tài liệu cài đặt chính thức](https://docs-cn.nocobase.com/welcome/getting-started/installation) chi tiết hơn.
- Phiên bản NocoBase **2.0.0-beta.5 trở lên**
- Bạn đã tải xuống các tệp tương ứng của hệ thống công đơn:
  - **Tệp sao lưu**: [nocobase_tts_v2_backup_260302.nbdata](https://static-docs.nocobase.com/nocobase_tts_v2_backup_260302.nbdata) - Áp dụng cho phương pháp một
  - **Tệp SQL**: [nocobase_tts_v2_sql_260302.zip](https://static-docs.nocobase.com/nocobase_tts_v2_sql_260302.zip) - Áp dụng cho phương pháp hai

**Thông báo quan trọng**:
- Giải pháp này được xây dựng dựa trên cơ sở dữ liệu **PostgreSQL 16**, vui lòng đảm bảo môi trường của bạn sử dụng PostgreSQL 16.
- **DB_UNDERSCORED không được là true**: Vui lòng kiểm tra tệp `docker-compose.yml` của bạn, đảm bảo biến môi trường `DB_UNDERSCORED` không được thiết lập là `true`, nếu không sẽ xung đột với bản sao lưu giải pháp dẫn đến khôi phục thất bại.

---

## Phương pháp một: Sử dụng Trình quản lý sao lưu để khôi phục (Khuyến nghị cho người dùng bản Chuyên nghiệp/Doanh nghiệp)

Phương thức này thực hiện khôi phục bằng một cú nhấp chuột thông qua plugin "[Trình quản lý sao lưu](https://docs-cn.nocobase.com/handbook/backups)" (bản Chuyên nghiệp/Doanh nghiệp) tích hợp sẵn của NocoBase, thao tác đơn giản nhất. Tuy nhiên, nó có yêu cầu nhất định về môi trường và phiên bản người dùng.

### Đặc điểm cốt lõi

* **Ưu điểm**:
  1. **Thao tác thuận tiện**: Có thể hoàn tất trên giao diện UI, có thể khôi phục hoàn chỉnh tất cả cấu hình bao gồm cả plugin.
  2. **Khôi phục hoàn chỉnh**: **Có thể khôi phục tất cả các tệp hệ thống**, bao gồm các tệp in mẫu, các tệp được tải lên trong trường tệp của bảng, v.v., đảm bảo tính toàn vẹn của chức năng.
* **Hạn chế**:
  1. **Giới hạn bản Chuyên nghiệp/Doanh nghiệp**: "Trình quản lý sao lưu" là một plugin cấp doanh nghiệp, chỉ dành cho người dùng bản Chuyên nghiệp/Doanh nghiệp.
  2. **Yêu cầu môi trường nghiêm ngặt**: Yêu cầu môi trường cơ sở dữ liệu của bạn (phiên bản, thiết lập phân biệt chữ hoa chữ thường, v.v.) phải tương thích cao với môi trường khi chúng tôi tạo bản sao lưu.
  3. **Phụ thuộc vào plugin**: Nếu giải pháp bao gồm các plugin thương mại mà môi trường cục bộ của bạn không có, việc khôi phục sẽ thất bại.

### Các bước thao tác

**Bước 1: 【Khuyến nghị mạnh mẽ】 Sử dụng hình ảnh `full` để khởi động ứng dụng**

Để tránh thất bại khi khôi phục do thiếu máy khách cơ sở dữ liệu mà dẫn đến, chúng tôi khuyên bạn nên sử dụng phiên bản hình ảnh Docker `full`. Nó tích hợp sẵn tất cả các chương trình hỗ trợ cần thiết, giúp bạn không cần thực hiện cấu hình bổ sung.

Ví dụ về lệnh kéo hình ảnh:

```bash
docker pull nocobase/nocobase:beta-full
```

Sau đó sử dụng hình ảnh này để khởi động dịch vụ NocoBase của bạn.

> **Lưu ý**: Nếu không sử dụng hình ảnh `full`, bạn có thể cần cài đặt thủ công máy khách cơ sở dữ liệu `pg_dump` bên trong container, quá trình này rất rườm rà và không ổn định.

**Bước 2: Bật plugin "Trình quản lý sao lưu"**

1. Đăng nhập vào hệ thống NocoBase của bạn.
2. Vào **`Quản lý plugin`**.
3. Tìm và bật plugin **`Trình quản lý sao lưu`**.

**Bước 3: Khôi phục từ tệp sao lưu cục bộ**

1. Sau khi bật plugin, làm mới trang.
2. Vào menu bên trái **`Quản trị hệ thống`** -> **`Trình quản lý sao lưu`**.
3. Nhấp vào nút **`Khôi phục từ bản sao lưu cục bộ`** ở góc trên bên phải.
4. Kéo tệp sao lưu đã tải xuống vào khu vực tải lên.
5. Nhấp vào **`Gửi`**, kiên nhẫn đợi hệ thống hoàn tất khôi phục, quá trình này có thể mất từ vài chục giây đến vài phút.

### Lưu ý

* **Khả năng tương thích cơ sở dữ liệu**: Đây là điểm quan trọng nhất của phương pháp này. **Phiên bản, bộ ký tự, thiết lập phân biệt chữ hoa chữ thường** của cơ sở dữ liệu PostgreSQL của bạn phải khớp với tệp nguồn sao lưu. Đặc biệt là tên `schema` phải nhất quán.
* **Khớp plugin thương mại**: Vui lòng đảm bảo bạn đã sở hữu và bật tất cả các plugin thương mại mà giải pháp yêu cầu, nếu không quá trình khôi phục sẽ bị gián đoạn.

---

## Phương pháp hai: Nhập trực tiếp tệp SQL (Phổ biến, phù hợp hơn cho bản Cộng đồng)

Phương thức này khôi phục dữ liệu bằng cách thao tác trực tiếp với cơ sở dữ liệu, bỏ qua plugin "Trình quản lý sao lưu", do đó không có giới hạn về plugin bản Chuyên nghiệp/Doanh nghiệp.

### Đặc điểm cốt lõi

* **Ưu điểm**:
  1. **Không giới hạn phiên bản**: Áp dụng cho tất cả người dùng NocoBase, bao gồm cả bản Cộng đồng.
  2. **Khả năng tương thích cao**: Không phụ thuộc vào công cụ `dump` trong ứng dụng, chỉ cần có thể kết nối với cơ sở dữ liệu là có thể thao tác.
  3. **Khả năng chịu lỗi cao**: Nếu giải pháp chứa các plugin thương mại mà bạn không có, các chức năng liên quan sẽ không được bật, nhưng sẽ không ảnh hưởng đến việc sử dụng bình thường của các chức năng khác, ứng dụng có thể khởi động thành công.
* **Hạn chế**:
  1. **Yêu cầu khả năng thao tác cơ sở dữ liệu**: Yêu cầu người dùng có khả năng thao tác cơ sở dữ liệu cơ bản, ví dụ như cách thực thi một tệp `.sql`.
  2. **Mất tệp hệ thống**: **Phương pháp này sẽ làm mất tất cả các tệp hệ thống**, bao gồm các tệp in mẫu, các tệp được tải lên trong trường tệp của bảng, v.v.

### Các bước thao tác

**Bước 1: Chuẩn bị một cơ sở dữ liệu sạch**

Chuẩn bị một cơ sở dữ liệu hoàn toàn mới và trống cho dữ liệu bạn sắp nhập.

**Bước 2: Nhập tệp `.sql` vào cơ sở dữ liệu**

Lấy tệp cơ sở dữ liệu đã tải xuống (thường là định dạng `.sql`) và nhập nội dung của nó vào cơ sở dữ liệu bạn đã chuẩn bị ở bước trước. Có nhiều cách thực hiện, tùy thuộc vào môi trường của bạn:

* **Tùy chọn A: Thông qua dòng lệnh máy chủ (Lấy Docker làm ví dụ)**
  Nếu bạn sử dụng Docker để cài đặt NocoBase và cơ sở dữ liệu, bạn có thể tải tệp `.sql` lên máy chủ, sau đó sử dụng lệnh `docker exec` để thực hiện việc nhập. Giả sử tên container PostgreSQL của bạn là `my-nocobase-db`, tên tệp là `ticket_system.sql`:

  ```bash
  # Sao chép tệp sql vào trong container
  docker cp ticket_system.sql my-nocobase-db:/tmp/
  # Vào container thực hiện lệnh nhập
  docker exec -it my-nocobase-db psql -U your_username -d your_database_name -f /tmp/ticket_system.sql
  ```
* **Tùy chọn B: Thông qua máy khách cơ sở dữ liệu từ xa**
  Nếu cơ sở dữ liệu của bạn mở cổng, bạn có thể sử dụng bất kỳ máy khách cơ sở dữ liệu đồ họa nào (như DBeaver, Navicat, pgAdmin, v.v.) để kết nối với cơ sở dữ liệu, mở một cửa sổ truy vấn mới, dán toàn bộ nội dung của tệp `.sql` vào đó và thực thi.

**Bước 3: Kết nối cơ sở dữ liệu và khởi động ứng dụng**

Cấu hình các tham số khởi động NocoBase của bạn (như các biến môi trường `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, v.v.) để trỏ đến cơ sở dữ liệu bạn vừa nhập dữ liệu. Sau đó, khởi động dịch vụ NocoBase bình thường.

### Lưu ý

* **Quyền cơ sở dữ liệu**: Phương pháp này yêu cầu bạn có tài khoản và mật khẩu có thể thao tác trực tiếp với cơ sở dữ liệu.
* **Trạng thái plugin**: Sau khi nhập thành công, mặc dù dữ liệu của các plugin thương mại có trong hệ thống, nhưng nếu bạn chưa cài đặt và bật các plugin tương ứng tại cục bộ, các chức năng liên quan sẽ không thể hiển thị và sử dụng, nhưng điều này sẽ không khiến ứng dụng bị sập.

---

## Tổng kết và so sánh

| Đặc tính | Phương pháp một: Trình quản lý sao lưu | Phương pháp hai: Nhập trực tiếp SQL |
| :-------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Người dùng áp dụng** | Người dùng bản **Chuyên nghiệp/Doanh nghiệp** | **Tất cả người dùng** (bao gồm bản Cộng đồng) |
| **Độ dễ thao tác** | ⭐⭐⭐⭐⭐ (Rất đơn giản, thao tác UI) | ⭐⭐⭐ (Cần kiến thức cơ sở dữ liệu cơ bản) |
| **Yêu cầu môi trường** | **Nghiêm ngặt**, cơ sở dữ liệu, phiên bản hệ thống v.v. cần tương thích cao | **Thông thường**, cần tương thích cơ sở dữ liệu |
| **Phụ thuộc plugin** | **Phụ thuộc mạnh**, khi khôi phục sẽ kiểm tra plugin, thiếu bất kỳ plugin nào cũng dẫn đến **khôi phục thất bại**. | **Chức năng phụ thuộc mạnh vào plugin**. Dữ liệu có thể nhập độc lập, hệ thống có các chức năng cơ bản. Nhưng nếu thiếu plugin tương ứng, các chức năng liên quan sẽ **hoàn toàn không thể sử dụng**. |
| **Tệp hệ thống** | **Giữ lại hoàn chỉnh** (mẫu in, tệp tải lên, v.v.) | **Sẽ bị mất** (mẫu in, tệp tải lên, v.v.) |
| **Kịch bản đề xuất** | Người dùng doanh nghiệp, môi trường có thể kiểm soát và nhất quán, cần chức năng hoàn chỉnh | Thiếu một số plugin, theo đuổi khả năng tương thích và linh hoạt cao, người dùng không phải bản Chuyên nghiệp/Doanh nghiệp, có thể chấp nhận thiếu chức năng tệp |

Hy vọng hướng dẫn này có thể giúp bạn triển khai hệ thống công đơn một cách suôn sẻ. Nếu bạn gặp bất kỳ vấn đề nào trong quá trình thao tác, vui lòng liên hệ với chúng tôi bất cứ lúc nào!