# Hiện thực Chuyển đổi Lead CRM

## 1. Giới thiệu

Hướng dẫn này sẽ từng bước hướng dẫn bạn cách hiện thực chức năng Chuyển đổi cơ hội (Opportunity Conversion) của CRM trong NocoBase. Chúng ta sẽ giới thiệu cách tạo các collections (bảng dữ liệu) cần thiết, cấu hình trang quản lý dữ liệu, thiết kế quy trình chuyển đổi và thiết lập quản lý liên kết, từ đó giúp bạn xây dựng toàn bộ quy trình nghiệp vụ một cách thuận lợi.

[NocoBase CRM Solution chính thức ra mắt! Mời bạn trải nghiệm](https://www.nocobase.com/cn/blog/crm-solution)

## 2. Chuẩn bị: Tạo các Collections cần thiết

Trước khi bắt đầu, chúng ta cần chuẩn bị 4 collections sau và cấu hình mối quan hệ giữa chúng.

### 2.1 LEAD Collection (Lead)

Đây là collection dùng để lưu trữ thông tin khách hàng tiềm năng, các Field được định nghĩa như sau:


| Field name     | Tên hiển thị Field | Field interface  | Description                                                      |
| -------------- | ------------------ | ---------------- | ---------------------------------------------------------------- |
| id             | **Id**             | Integer          | Khóa chính                                                       |
| account_id     | **account_id**     | Integer          | Khóa ngoại ACCOUNT                                               |
| contact_id     | **contact_id**     | Integer          | Khóa ngoại CONTACT                                               |
| opportunity_id | **opportunity_id** | Integer          | Khóa ngoại OPPORTUNITY                                           |
| name           | **Tên Lead**       | Single line text | Tên khách hàng tiềm năng                                         |
| company        | **Tên công ty**    | Single line text | Tên công ty của khách hàng tiềm năng                             |
| email          | **Email**          | Email            | Địa chỉ email của khách hàng tiềm năng                           |
| phone          | **Số điện thoại**  | Phone            | Số điện thoại liên hệ                                            |
| status         | **Trạng thái**     | Single select    | Trạng thái hiện tại của Lead (Không đạt, Lead mới, Đang xử lý, Đang theo dõi, Đang giao dịch, Hoàn thành) |
| Account        | **Công ty**        | Many to one      | Liên kết đến Collection công ty                                  |
| Contact        | **Liên hệ**        | Many to one      | Liên kết đến Collection liên hệ                                  |
| Opportunity    | **Cơ hội**         | Many to one      | Liên kết đến Collection cơ hội                                   |

### 2.2 ACCOUNT Collection (Công ty)

Dùng để lưu thông tin chi tiết của công ty, cấu hình Field như sau:


| Field name | Tên hiển thị Field | Field interface  | Description                |
| ---------- | ------------------ | ---------------- | -------------------------- |
| name       | **Tên**            | Single line text | Tên tài khoản (tên công ty hoặc tổ chức) |
| industry   | **Ngành**          | Single select    | Ngành thuộc về của tài khoản |
| phone      | **Điện thoại**     | Phone            | Số điện thoại liên hệ tài khoản |
| website    | **Website**        | URL              | Địa chỉ website chính thức của tài khoản |

### 2.3 CONTACT Collection (Liên hệ)

Collection lưu trữ thông tin liên hệ, bao gồm các Field sau:


| Field name | Tên hiển thị Field | Field interface  | Description          |
| ---------- | ------------------ | ---------------- | -------------------- |
| name       | **Tên**            | Single line text | Tên của liên hệ      |
| email      | **Email**          | Email            | Địa chỉ email của liên hệ |
| phone      | **Điện thoại**     | Phone            | Số điện thoại liên hệ |

### 2.4 OPPORTUNITY Collection (Cơ hội)

Dùng để ghi lại thông tin cơ hội, các Field được định nghĩa như sau:


| Field name | Tên hiển thị Field | Field interface  | Description                                                      |
| ---------- | ------------------ | ---------------- | ---------------------------------------------------------------- |
| name       | **Tên**            | Single line text | Tên của cơ hội                                                   |
| stage      | **Giai đoạn**      | Single select    | Giai đoạn hiện tại của cơ hội (Sàng lọc đủ điều kiện, Nhu cầu, Đề xuất, Đàm phán, Đóng giao dịch, Thành công, Thất bại) |
| amount     | **Số tiền**        | Number           | Số tiền của cơ hội                                               |
| close_date | **Ngày đóng**      | Datetime         | Ngày đóng dự kiến của cơ hội                                     |

## 3. Hiểu quy trình Chuyển đổi cơ hội

### 3.1 Tổng quan quy trình chuyển đổi thông thường

Một cơ hội từ Lead chuyển đổi thành cơ hội chính thức thường trải qua quy trình như sau:

![20250225211802](https://static-docs.nocobase.com/20250225211802.png)

### 3.2 Mô tả mối quan hệ liên kết

Giả sử bạn đã tạo thành công 4 collections trên và cấu hình mối quan hệ nghiệp vụ giữa chúng:

![Mối quan hệ liên kết](https://static-docs.nocobase.com/20250225090913.png)

## 4. Tạo trang quản lý dữ liệu

Trong workspace của NocoBase, tạo trang quản lý dữ liệu cho từng collections, đồng thời thêm ngẫu nhiên một số dữ liệu Lead để kiểm tra sau này.

![Trang quản lý dữ liệu](https://static-docs.nocobase.com/20250224234721.png)

## 5. Hiện thực chức năng Chuyển đổi cơ hội

Phần này tập trung giải thích cách chuyển đổi một Lead thành dữ liệu công ty, liên hệ và cơ hội, đồng thời đảm bảo thao tác chuyển đổi không bị kích hoạt lặp lại.

### 5.1 Tạo Action chỉnh sửa "Chuyển đổi"

Trong giao diện chi tiết Lead tương ứng, tạo một Action chỉnh sửa, đặt tên là "Chuyển đổi". Trong popup chuyển đổi, cấu hình như sau:

#### 5.1.1 Hiển thị thông tin cơ bản của Lead

Hiển thị thông tin cơ bản của Lead hiện tại ở chế độ chỉ đọc, đảm bảo người dùng không vô tình sửa dữ liệu gốc.

#### 5.1.2 Hiển thị các Field liên kết

Trong popup, hiển thị ba Field liên kết sau và bật chức năng "Tạo nhanh" cho mỗi Field, để khi không tìm thấy dữ liệu phù hợp có thể tạo dữ liệu mới ngay lập tức.

![Hiển thị Field liên kết](https://static-docs.nocobase.com/20250224234155.png)

#### 5.1.3 Cấu hình ánh xạ mặc định cho tạo nhanh

Trong cài đặt popup "Tạo nhanh", cấu hình giá trị mặc định cho từng Field liên kết, từ đó tự động ánh xạ thông tin Lead vào collection đích. Quy tắc ánh xạ như sau:

- Lead/Tên Lead → Công ty/Tên
- Lead/Email → Công ty/Email
- Lead/Số điện thoại → Công ty/Điện thoại
- Lead/Tên Lead → Liên hệ/Tên
- Lead/Email → Liên hệ/Email
- Lead/Số điện thoại → Liên hệ/Điện thoại
- Lead/Tên Lead → Cơ hội/Tên
- Lead/Trạng thái → Cơ hội/Giai đoạn

Ảnh chụp ví dụ cấu hình:

![Ánh xạ mặc định 1](https://static-docs.nocobase.com/20250225000218.png)

Tiếp theo, chúng ta thêm phản hồi thân thiện cho Action submit:
![20250226154935](https://static-docs.nocobase.com/20250226154935.png)
![20250226154952](https://static-docs.nocobase.com/20250226154952.png)

Hiệu ứng submit:
![Ánh xạ mặc định 2](https://static-docs.nocobase.com/20250225001256.png)

#### 5.1.4 Xem hiệu quả chuyển đổi

Sau khi cấu hình xong, khi thực hiện Action chuyển đổi, hệ thống sẽ tạo và liên kết dữ liệu công ty, liên hệ và cơ hội mới theo quan hệ ánh xạ. Ví dụ hiệu quả như sau:

![](https://static-docs.nocobase.com/202502252130-transfer1.gif)
![](https://static-docs.nocobase.com/202502252130-transfer2.gif)

### 5.2 Ngăn chặn chuyển đổi lặp lại

Để tránh cùng một Lead bị chuyển đổi nhiều lần, có thể kiểm soát thông qua các cách sau:

#### 5.2.1 Cập nhật trạng thái Lead

Trong Action submit của form chuyển đổi, thêm một bước cập nhật dữ liệu tự động, sửa trạng thái Lead thành "Đã chuyển đổi".

Ảnh chụp cấu hình:

![Cập nhật trạng thái 1](https://static-docs.nocobase.com/20250225001758.png)
![Cập nhật trạng thái 2](https://static-docs.nocobase.com/20250225001817.png)
Demo hiệu quả:
![202502252130-transfer](https://static-docs.nocobase.com/202502252130-transfer.gif)

#### 5.2.2 Thiết lập quy tắc liên động cho nút

Thêm quy tắc liên động cho nút chuyển đổi: khi trạng thái Lead là "Đã chuyển đổi", tự động ẩn nút chuyển đổi để tránh thao tác lặp lại.

Ảnh chụp cấu hình:

![Liên động nút 1](https://static-docs.nocobase.com/20250225001838.png)
![Liên động nút 2](https://static-docs.nocobase.com/20250225001939.png)
![Liên động nút 3](https://static-docs.nocobase.com/20250225002026.png)

## 6. Cấu hình Block quản lý liên kết trên trang chi tiết

Để người dùng có thể xem dữ liệu liên kết trên trang chi tiết của từng Collection, bạn cần cấu hình Block list hoặc Block chi tiết tương ứng.

### 6.1 Cấu hình trang chi tiết Collection công ty

Trên trang chi tiết của công ty (ví dụ trong popup chỉnh sửa/chi tiết của liên hệ), lần lượt thêm các Block list sau:

- Liên hệ list
- Cơ hội list
- Lead list

Ảnh chụp ví dụ:

![Trang chi tiết công ty](https://static-docs.nocobase.com/20250225085418.png)

### 6.2 Thêm điều kiện lọc

Thêm quy tắc lọc cho từng Block list, đảm bảo chỉ hiển thị dữ liệu liên kết với ID công ty hiện tại.

Ảnh chụp cấu hình:

![Điều kiện lọc 1](https://static-docs.nocobase.com/20250225085513.png)
![Điều kiện lọc 2](https://static-docs.nocobase.com/20250225085638.png)

### 6.3 Cấu hình trang chi tiết liên hệ và cơ hội

Trong popup chi tiết của Collection liên hệ, thêm các Block sau:

- Cơ hội list
- Chi tiết công ty
- Lead list (lọc theo ID)

Ảnh chụp:

![Chi tiết liên hệ](https://static-docs.nocobase.com/20250225090231.png)

Trên trang chi tiết cơ hội, cũng thêm:

- Liên hệ list
- Chi tiết công ty
- Lead list (lọc theo ID)

Ảnh chụp:

![Chi tiết cơ hội](https://static-docs.nocobase.com/20250225091208.png)

## 7. Tổng kết

Thông qua các bước trên, bạn đã hiện thực thành công một chức năng Chuyển đổi cơ hội CRM đơn giản và cấu hình quản lý liên kết giữa liên hệ, công ty và Lead. Hy vọng hướng dẫn này có thể giúp bạn nắm vững việc xây dựng toàn bộ quy trình nghiệp vụ một cách rõ ràng và từng bước, từ đó mang lại trải nghiệm thao tác tiện lợi và hiệu quả cho dự án của bạn.

---

Nếu bạn gặp bất kỳ vấn đề nào trong quá trình thao tác, hãy đến [Cộng đồng NocoBase](https://forum.nocobase.com) để trao đổi hoặc xem [Tài liệu chính thức](https://docs-cn.nocobase.com). Hy vọng hướng dẫn này có thể giúp bạn hiện thực kiểm duyệt người dùng đăng ký theo nhu cầu thực tế và mở rộng linh hoạt theo yêu cầu. Chúc bạn sử dụng thuận lợi và dự án thành công!
