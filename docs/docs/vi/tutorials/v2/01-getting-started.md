# Chương 1: Làm quen với NocoBase — Chạy lên trong 5 phút

Trong loạt bài này, bạn sẽ bắt đầu từ con số 0, dùng NocoBase để xây dựng một **hệ thống quản lý ticket cực kỳ đơn giản (HelpDesk)**. Toàn bộ hệ thống chỉ cần **2 [bảng dữ liệu](/data-sources/data-modeling/collection)**, không cần viết một dòng code, vẫn có thể submit ticket, quản lý phân loại, theo dõi thay đổi, kiểm soát quyền và [dashboard](/data-visualization) dữ liệu.

Chương này sẽ deploy NocoBase một bước qua [Docker](/get-started/installation/docker), hoàn tất đăng nhập lần đầu, tìm hiểu sự khác biệt giữa [chế độ cấu hình và chế độ sử dụng](/get-started/how-nocobase-works), và xem trước toàn cảnh hệ thống ticket.


## 1.1 NocoBase là gì

Bạn đã từng gặp tình huống như thế này chưa:

- Team cần một hệ thống nội bộ để quản lý nghiệp vụ, nhưng các phần mềm trên thị trường lúc nào cũng thiếu một chút gì đó
- Tìm team dev tùy chỉnh thì lại quá đắt, quá chậm, mà yêu cầu vẫn liên tục thay đổi
- Dùng Excel tạm bợ, dữ liệu càng lúc càng lộn xộn, hợp tác càng lúc càng khó

**NocoBase ra đời chính là để giải quyết vấn đề này.** Nó là một **nền tảng phát triển AI no-code** mã nguồn mở, cực kỳ dễ mở rộng. Bạn có thể xây dựng hệ thống nghiệp vụ của riêng mình thông qua cấu hình và kéo thả, mà không cần viết code.

So với các công cụ no-code khác, NocoBase có một vài triết lý cốt lõi:

- **Hướng theo data model**: Định nghĩa [data source](/data-sources) và cấu trúc dữ liệu trước, sau đó dùng [Block](/interface-builder/blocks) để hiển thị dữ liệu, cuối cùng dùng [Action](/interface-builder/actions) để xử lý dữ liệu — giao diện và dữ liệu được tách biệt hoàn toàn
- **WYSIWYG**: Trang chính là canvas, click đâu sửa đó, trực quan như xây trang Notion
- **Tất cả đều là Plugin**: Tất cả tính năng đều là [Plugin](/development/plugin), giống WordPress, cài theo nhu cầu, mở rộng linh hoạt
- **AI hòa nhập vào nghiệp vụ**: Tích hợp sẵn [AI Employee](/ai-employees/quick-start), có thể thực hiện các Task như phân tích, dịch thuật, nhập liệu, thực sự hòa nhập vào workflow của bạn
- **Mã nguồn mở + triển khai riêng**: Code core hoàn toàn open source, dữ liệu hoàn toàn nằm trên server của bạn


## 1.2 Cài đặt NocoBase

NocoBase hỗ trợ nhiều cách cài đặt, chúng ta chọn cách đơn giản nhất là **[cài đặt qua Docker](/get-started/installation/docker)**.

### Điều kiện tiên quyết

Máy tính của bạn cần cài [Docker](https://docs.docker.com/get-docker/) và Docker Compose, đồng thời đảm bảo dịch vụ Docker đang chạy. Hỗ trợ Windows / Mac / Linux.

### Bước 1: Tải file cấu hình

Mở terminal (Windows dùng PowerShell, Mac dùng Terminal), thực hiện:

```bash
# Tạo thư mục dự án và đi vào
mkdir my-project && cd my-project

# Tải docker-compose.yml (mặc định dùng PostgreSQL)
curl -fsSL https://static-docs.nocobase.com/docker-compose/cn/latest-postgres.yml -o docker-compose.yml
```

> **Cơ sở dữ liệu khác?** Thay `postgres` trong link bên trên thành `mysql` hoặc `mariadb` là được.
> Cũng có thể chọn các phiên bản khác: `latest` (bản ổn định), `beta` (bản thử nghiệm), `alpha` (bản phát triển), xem chi tiết tại [Tài liệu cài đặt chính thức](https://docs.nocobase.com/get-started/installation/docker).
>
> | Cơ sở dữ liệu | Link tải |
> |--------|---------|
> | PostgreSQL (khuyến nghị) | `https://static-docs.nocobase.com/docker-compose/cn/latest-postgres.yml` |
> | MySQL | `https://static-docs.nocobase.com/docker-compose/cn/latest-mysql.yml` |
> | MariaDB | `https://static-docs.nocobase.com/docker-compose/cn/latest-mariadb.yml` |

### Bước 2: Khởi động

```bash
# Pull image
docker compose pull

# Khởi động ngầm (lần đầu sẽ tự động chạy install)
docker compose up -d

# Xem log, xác nhận khởi động thành công
docker compose logs -f app
```

Khi nhìn thấy dòng output dưới đây, nghĩa là đã khởi động thành công:

```
🚀 NocoBase server running at: http://localhost:13000/
```

![01-getting-started-2026-03-11-07-49-19](https://static-docs.nocobase.com/01-getting-started-2026-03-11-07-49-19.png)

### Bước 3: Đăng nhập

Mở trình duyệt truy cập `http://localhost:13000`, dùng tài khoản mặc định để đăng nhập:

- **Tài khoản**: `admin@nocobase.com`
- **Mật khẩu**: `admin123`

> Sau khi đăng nhập lần đầu, hãy kịp thời đổi mật khẩu mặc định.


## 1.3 Làm quen với giao diện

Sau khi đăng nhập thành công, bạn sẽ thấy một giao diện ban đầu sạch sẽ. Đừng vội, chúng ta hãy làm quen với hai khái niệm quan trọng nhất trước.

### Chế độ cấu hình vs Chế độ sử dụng

Giao diện NocoBase có hai chế độ:

| Chế độ | Mô tả | Ai dùng |
|------|------|------|
| **Chế độ sử dụng** | Giao diện Người dùng thông thường dùng hàng ngày | Tất cả mọi người |
| **Chế độ cấu hình** | Chế độ thiết kế để xây dựng và điều chỉnh giao diện | Admin |

Cách chuyển: Click nút **"[Cấu hình giao diện](/get-started/how-nocobase-works) (UI Editor)"** ở góc trên bên phải (biểu tượng bút highlight).

![01-getting-started-2026-03-11-08-17-26](https://static-docs.nocobase.com/01-getting-started-2026-03-11-08-17-26.png)

Sau khi bật chế độ cấu hình, bạn sẽ thấy nhiều phần tử trên trang xuất hiện **viền cam highlight** xung quanh — điều này có nghĩa là chúng có thể được cấu hình. Mỗi phần tử có thể cấu hình sẽ có một biểu tượng nhỏ ở góc trên bên phải, click vào để cài đặt.

Chúng ta tìm một hệ thống demo để xem hiệu ứng:

![01-getting-started-2026-03-11-08-19-24](https://static-docs.nocobase.com/01-getting-started-2026-03-11-08-19-24.png)

Như hình bên trên: menu, thanh Action của bảng, phần dưới trang đều xuất hiện gợi ý màu cam, click vào có thể tiến hành các bước tạo tiếp theo.

> **Hãy nhớ quy luật này**: Trong NocoBase, muốn sửa giao diện, hãy vào chế độ cấu hình, tìm biểu tượng nhỏ ở góc trên bên phải của nó, click vào là được.

### Cấu trúc cơ bản của giao diện

Giao diện NocoBase bao gồm ba khu vực:

```
┌──────────────────────────────────────────┐
│            Top navigation                  │
├──────────┬───────────────────────────────┤
│          │                               │
│  Menu    │         Khu vực nội dung       │
│  bên trái│    (đặt các Block)             │
│ (group)  │                               │
│          │                               │
└──────────┴───────────────────────────────┘
```

- **Top navigation**: Đặt menu cấp 1, chuyển đổi giữa các module khác nhau
- **Menu bên trái (group)**: Nếu là menu nhóm, sẽ chứa menu cấp 2 này, tổ chức cấp bậc trang
- **Khu vực nội dung**: Phần thân của trang, đặt các **Block** để hiển thị và thao tác dữ liệu

![01-getting-started-2026-03-11-08-24-34](https://static-docs.nocobase.com/01-getting-started-2026-03-11-08-24-34.png)

Hiện tại vẫn còn trống, không sao — bắt đầu từ chương sau, chúng ta sẽ điền nội dung vào.


## 1.4 Chúng ta sẽ xây dựng cái gì

Trong các phần tutorial tiếp theo, chúng ta sẽ từng bước xây dựng một **hệ thống ticket IT**, nó có thể làm được:

- ✅ Submit ticket: [Người dùng](/users-permissions/user) điền tiêu đề, mô tả, chọn phân loại và mức độ ưu tiên
- ✅ Danh sách ticket: Lọc theo trạng thái, phân loại, nhìn vào là rõ ngay
- ✅ Kiểm soát [quyền](/users-permissions/acl/role): Người dùng thông thường chỉ thấy ticket của mình, admin thấy toàn bộ
- ✅ Dashboard dữ liệu: Thống kê thời gian thực phân bố và xu hướng ticket
- ✅ Log thao tác dữ liệu (tích hợp sẵn)

Toàn bộ hệ thống chỉ cần **2 bảng dữ liệu**:

| Bảng dữ liệu | Tác dụng | Số Field tùy chỉnh |
|--------|------|--------|
| Phân loại ticket | Loại của ticket (như: vấn đề mạng, lỗi phần mềm) | 2 cái |
| Ticket | Bảng cốt lõi, ghi lại từng ticket | 7-8 cái |

Đúng vậy, chỉ 2 bảng. Các khả năng chung như Người dùng, quyền, quản lý file, thậm chí phòng ban, email, log thao tác, NocoBase đều có Plugin sẵn cung cấp, không cần phát minh lại bánh xe. Chúng ta chỉ cần tập trung vào dữ liệu nghiệp vụ của riêng mình.


## Tóm tắt

Chương này chúng ta đã hoàn thành:

1. Hiểu NocoBase là gì — một nền tảng no-code mã nguồn mở
2. Dùng Docker cài đặt và khởi động NocoBase một bước
3. Làm quen với hai chế độ giao diện (chế độ cấu hình/chế độ sử dụng) và bố cục cơ bản
4. Xem trước bản thiết kế hệ thống ticket mà chúng ta sẽ xây dựng

**Chương tiếp theo**, chúng ta sẽ bắt tay vào — vào quản lý data source, tạo bảng dữ liệu đầu tiên. Đây là khung xương của toàn bộ hệ thống, cũng là khả năng cốt lõi nhất của NocoBase.

Hẹn gặp lại ở chương sau!

## Tài nguyên liên quan

- [Cài đặt Docker chi tiết](/get-started/installation/docker) — Tùy chọn cài đặt đầy đủ và mô tả biến môi trường
- [Yêu cầu hệ thống](/get-started/system-requirements) — Yêu cầu môi trường phần cứng và phần mềm
- [NocoBase hoạt động như thế nào](/get-started/how-nocobase-works) — Các khái niệm cốt lõi như data source, Block, Action
