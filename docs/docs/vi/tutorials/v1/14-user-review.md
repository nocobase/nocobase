# Hiện thực Kiểm duyệt người dùng đăng ký

Tài liệu này cung cấp hai phương án hiện thực kiểm duyệt người dùng đăng ký, được thiết kế cho các kịch bản nghiệp vụ khác nhau:

- **Phương án 1**: Phù hợp cho kịch bản cần hiện thực quy trình kiểm duyệt đăng ký một cách đơn giản và nhanh chóng. Phương án này tận dụng chức năng đăng ký người dùng mới mặc định của hệ thống, gán cho tất cả người dùng mới một role "khách" không có quyền hạn, sau đó quản trị viên sẽ kiểm duyệt và cập nhật role thủ công ở backend.
- **Phương án 2**: Phù hợp cho kịch bản cần quy trình kiểm duyệt đăng ký linh hoạt và tùy chỉnh. Thông qua việc thiết kế bảng thông tin đăng ký chuyên dụng, cấu hình Workflow kiểm duyệt và kích hoạt [Plugin Public Forms](https://docs-cn.nocobase.com/handbook/public-forms), hiện thực quản lý toàn bộ quy trình từ submit đăng ký đến tự động tạo người dùng mới.

  ![](https://static-docs.nocobase.com/20250219144832.png)

---

## 1. Phương án 1: Sử dụng role "khách" không có quyền hạn

### 1.0 Kịch bản áp dụng

Phù hợp cho kịch bản yêu cầu kiểm duyệt đăng ký đơn giản, mong muốn sử dụng chức năng đăng ký có sẵn của hệ thống và kiểm duyệt người dùng thủ công ở backend.

### 1.1 Bật xác thực mật khẩu, cho phép người dùng đăng ký

#### 1.1.1 Vào trang xác thực người dùng

Đầu tiên, chúng ta cần xác nhận chức năng đăng ký người dùng đã được bật hay chưa. Trong cài đặt hệ thống, vào trang [Xác thực người dùng](https://docs-cn.nocobase.com/handbook/auth/user), trang này quản lý tất cả các kênh xác thực danh tính, ví dụ "Đăng nhập tài khoản mật khẩu", [Đăng nhập Google](https://docs-cn.nocobase.com/handbook/auth-oidc/example/google), v.v. (có thể mở rộng thông qua Plugin).

![](https://static-docs.nocobase.com/20250208164554.png)

Công tắc của chức năng đăng ký ở đây:
![](https://static-docs.nocobase.com/20250219084856.png)

### 1.2 Đặt role mặc định (cốt lõi)

#### 1.2.1 Tạo role "khách"

Hệ thống mặc định bật chức năng đăng ký, nhưng role mặc định có thể không phù hợp với yêu cầu.

Vì vậy chúng ta cần tạo một role "khách" trong [Danh sách role] làm role mặc định, không bao gồm bất kỳ quyền hạn nào. Tất cả người dùng đăng ký mới sẽ tự động được gán role này.

![](https://static-docs.nocobase.com/20250208163521.png)

### 1.3 Cấu hình giao diện kiểm duyệt người dùng đăng ký (cốt lõi)

Chuyển sang chế độ chỉnh sửa, ở backend cấu hình một Block bảng đơn giản, chọn bảng người dùng, dùng để hiển thị và quản lý người dùng đăng ký.

![](https://static-docs.nocobase.com/20250208165406.png)

### 1.4 Kiểm tra quy trình kiểm duyệt đăng ký, cập nhật role thủ công

- Sau khi người dùng mới đăng ký, trang mặc định hiển thị trống
  ![](https://static-docs.nocobase.com/20250219084449.png)
- Trong giao diện quản lý, đối với người dùng có thông tin đăng ký không có vấn đề, sửa role của họ thành role chỉ định thủ công, hoàn thành kiểm duyệt.
  ![](https://static-docs.nocobase.com/20250219084702.png)

### 1.5 Cấu hình trang gợi ý (tùy chọn)

#### 1.5.1 Tạo một trang mới, ví dụ "Đăng ký thành công", nội dung điền thông tin gợi ý

> **Bước tùy chọn**: Chúng ta có thể thêm gợi ý thân thiện vào trang trống đó, ví dụ "Tài khoản của bạn đang được kiểm duyệt, vui lòng kiên nhẫn chờ đợi", để thông báo trạng thái hiện tại cho người dùng.
> ![](https://static-docs.nocobase.com/Pasted%20image%2020250208231631.png)

#### 1.5.2 Phân quyền cho trang gợi ý

Tiếp theo, chúng ta đến cấu hình quản lý quyền người dùng, gán trang này cho "khách". Sau khi đăng ký thành công sẽ tự động chuyển hướng.
![](https://static-docs.nocobase.com/20250211223123.png)

### 1.6 Mở rộng Field bảng người dùng (tùy chọn)

> **Bước tùy chọn**: Nếu cần thu thập thông tin bổ sung khi đăng ký để hỗ trợ kiểm duyệt, có thể thêm các Field liên quan trong bảng người dùng (ví dụ "Lý do đăng ký" hoặc "Mã mời"). Nếu chỉ cần kiểm duyệt đăng ký cơ bản, có thể bỏ qua bước này.

#### 1.6.1 Thêm Field đăng ký mới

Vào [Bảng người dùng], thêm một Field mới cho người dùng, dùng để ghi lại lý do đăng ký hoặc thông tin mã mời mà người dùng điền khi đăng ký.
![](https://static-docs.nocobase.com/20250208164321.png)

#### 1.6.2 Bật Field trong "Xác thực người dùng"

![](https://static-docs.nocobase.com/Pasted%20image%2020250219090248.png)

Sau khi cấu hình hoàn tất, đến trang đăng nhập nhấp vào [Đăng ký tài khoản], bạn sẽ thấy Field tương ứng trong form đăng ký (nếu cấu hình tùy chọn thì hiển thị, nếu không thì hiển thị form cơ bản).
![](https://static-docs.nocobase.com/20250219090447.png)

#### 1.6.3 Trang kiểm duyệt thêm Field tương ứng

Chúng ta cũng thêm hai Field này vào trang kiểm duyệt, có thể kiểm duyệt và sửa role người dùng theo thời gian thực.

![](https://static-docs.nocobase.com/20250208165622.png)

---

## 2. Phương án 2: Không mở kênh đăng ký, thêm bảng trung gian kiểm duyệt

### 2.0 Kịch bản áp dụng

Phù hợp cho kịch bản cần quy trình kiểm duyệt đăng ký linh hoạt và tùy chỉnh hơn.

Phương án này thông qua bảng thông tin đăng ký độc lập, thiết lập Workflow và [Plugin Public Forms](https://docs-cn.nocobase.com/handbook/public-forms), hiện thực toàn bộ quy trình từ người dùng submit đăng ký đến tự động tạo người dùng. Các bước cốt lõi đảm bảo chức năng cơ bản, sau này có thể mở rộng thêm chức năng theo nhu cầu.

### 2.1 Chuẩn bị ban đầu (cốt lõi)

#### 2.1.1 Thiết kế bảng thông tin đăng ký

##### 2.1.1.1 Tạo bảng "Thông tin đăng ký"

- **Tạo bảng**
  Tạo một bảng mới ở backend NocoBase, dùng để lưu trữ thông tin đăng ký người dùng.
- **Cấu hình Field**
  Thêm các Field sau cho bảng và đảm bảo loại Field và mô tả chính xác:


  | Field display name     | Field name         | Field interface  | Description                                      |
  | ---------------------- | ------------------ | ---------------- | ------------------------------------------------ |
  | **ID**                 | id                 | Integer          | Hệ thống tự động tạo, định danh ID duy nhất của bản ghi |
  | **Username**           | username           | Single line text | Tên người dùng của người đăng ký                 |
  | **Email**              | email              | Email            | Địa chỉ email của người đăng ký                  |
  | **Phone**              | phone              | Phone            | Số điện thoại liên hệ của người đăng ký          |
  | **Full Name**          | full_name          | Single line text | Họ tên đầy đủ của người đăng ký                  |
  | **Application Reason** | application_reason | Long text        | Lý do hoặc giải thích đăng ký do người đăng ký điền |
  | **User Type**          | user_type          | Single select    | Chỉ định loại người dùng tương lai của người đăng ký (ví dụ đăng ký email, đăng ký mở) |
  | **Status**             | status             | Single select    | Trạng thái hiện tại của đơn đăng ký (ví dụ: chờ kiểm duyệt, đã thông qua, đã từ chối) |
  | **Initial Password**   | initial_password   | Single line text | Mật khẩu ban đầu của người dùng mới (mặc định là nocobase) |
  | **Created at**         | createdAt          | Created at       | Thời gian tạo do hệ thống ghi lại                |
  | **Created by**         | createdBy          | Created by       | Người tạo do hệ thống ghi lại                    |
  | **Last updated at**    | updatedAt          | Last updated at  | Thời gian cập nhật cuối do hệ thống ghi lại      |
  | **Last updated by**    | updatedBy          | Last updated by  | Người cập nhật cuối do hệ thống ghi lại          |
- **Xem trước cấu trúc bảng**
  Tham khảo hình bên dưới để xác nhận cấu trúc bảng đã cấu hình đúng:
  ![](https://static-docs.nocobase.com/20250208145543.png)

##### 2.1.1.2 Nhập và hiển thị dữ liệu

- **Cấu hình giao diện kiểm duyệt**
  Trong giao diện chính, cấu hình một giao diện quản lý "Kiểm duyệt thông tin đăng ký", dùng để hiển thị thông tin đăng ký do người dùng submit.
- **Nhập dữ liệu kiểm tra**
  Vào giao diện quản lý, nhập dữ liệu kiểm tra, đảm bảo dữ liệu có thể hiển thị chính xác.
  ![](https://static-docs.nocobase.com/20250208151429.png)

### 2.2 Cấu hình Workflow

Phần này giới thiệu cách cấu hình Workflow để hiện thực chức năng tự động tạo người dùng mới sau khi kiểm duyệt thông qua.

#### 2.2.1 Tạo Workflow kiểm duyệt

##### 2.2.1.1 Tạo Workflow mới

- **Vào giao diện Workflow**
  Vào trang cấu hình Workflow ở backend NocoBase, chọn "Tạo Workflow mới".
- **Chọn sự kiện trigger**
  Có thể chọn ["sự kiện sau Action"](https://docs-cn.nocobase.com/handbook/workflow/triggers/post-action) hoặc ["sự kiện trước Action"](https://docs-cn.nocobase.com/handbook/workflow/triggers/pre-action), ở đây lấy sự kiện trước Action làm ví dụ.
- **Cấu hình Node Workflow**
  Tạo một Node "Thêm người dùng" mới, chuyển đổi dữ liệu form hiện tại thành dữ liệu người dùng mới, đồng thời thiết lập ánh xạ Field và logic xử lý.
  Tham khảo hình minh họa:
  ![](https://static-docs.nocobase.com/20250208153202.png)

#### 2.2.2 Thiết lập nút kiểm duyệt form

##### 2.2.2.1 Thêm nút "Thông qua" và "Từ chối"

Trong form thông tin đăng ký, lần lượt thêm hai nút "Kiểm duyệt thông qua" và "Kiểm duyệt từ chối".
![](https://static-docs.nocobase.com/20250208153302.png)

##### 2.2.2.2 Cấu hình chức năng nút

- **Cấu hình nút "Kiểm duyệt thông qua"**
  - Liên kết với Workflow vừa tạo;
  - Khi submit, đặt giá trị Field 【Trạng thái】 thành "Kiểm duyệt thông qua".
    Tham khảo hình minh họa:
    ![](https://static-docs.nocobase.com/20250208153429.png)
    ![](https://static-docs.nocobase.com/20250208153409.png)
- **Cấu hình nút "Kiểm duyệt từ chối"**
  - Khi submit, đặt giá trị Field 【Trạng thái】 thành "Kiểm duyệt từ chối".

##### 2.2.2.3 Thiết lập quy tắc liên động cho nút

Để ngăn chặn thao tác lặp lại, thiết lập quy tắc liên động: khi 【Trạng thái】 không phải 【Chờ kiểm duyệt】 thì ẩn nút.
Tham khảo hình minh họa:
![](https://static-docs.nocobase.com/20250208153749.png)

### 2.3 Kích hoạt và cấu hình Plugin Public Forms

Sử dụng [Plugin Public Forms](https://docs-cn.nocobase.com/handbook/public-forms) để cho phép người dùng submit đăng ký thông qua trang.

#### 2.3.1 Kích hoạt Plugin Public Forms

##### 2.3.1.1 Thao tác kích hoạt Plugin

- **Vào quản lý Plugin**
  Trong giao diện quản lý backend, tìm và kích hoạt Plugin "Public Forms".
  Tham khảo hình minh họa:
  ![](https://static-docs.nocobase.com/20250208154258.png)

#### 2.3.2 Tạo và cấu hình Public Form mới

##### 2.3.2.1 Tạo Public Form

- **Tạo Form mới**
  Tạo một Public Form trong quản lý backend, dùng để người dùng submit đăng ký.
- **Cấu hình các thành phần Form**
  Thêm các thành phần Form cần thiết (ví dụ tên người dùng, email, số điện thoại liên hệ, v.v.), đồng thời thiết lập quy tắc kiểm tra tương ứng.
  Tham khảo hình minh họa:
  ![](https://static-docs.nocobase.com/20250208155044.png)

#### 2.3.3 Kích hoạt và cấu hình Plugin Public Forms (cốt lõi)

##### 2.3.3.1 Kiểm tra Public Form

- **Mở trang**
  Truy cập trang Public Form, điền và submit dữ liệu đăng ký.
- **Xác minh chức năng**
  Kiểm tra dữ liệu có vào bảng thông tin đăng ký chính xác hay không, và sau khi qua kiểm duyệt Workflow tự động tạo người dùng mới.
  Tham khảo hiệu quả kiểm tra:
  ![](https://static-docs.nocobase.com/202502191351-register2.gif)

### 2.4 Mở rộng tiếp theo (bước tùy chọn)

Sau khi hoàn thành quy trình đăng ký và kiểm duyệt cơ bản, chúng ta có thể mở rộng các chức năng khác theo nhu cầu:

#### 2.4.1 Đăng ký mã mời

- **Mô tả chức năng**: Thông qua việc đặt mã mời để giới hạn phạm vi và số lượng người dùng đăng ký.
- **Ý tưởng cấu hình**: Thêm Field mã mời trong bảng đăng ký, sử dụng "sự kiện trước Action" để kiểm tra tính hợp lệ và chặn Field này trước khi submit.

#### 2.4.2 Thông báo email tự động

- **Mô tả chức năng**: Hiện thực thông báo kết quả kiểm duyệt, đăng ký thành công và các email tự động khác.
- **Ý tưởng cấu hình**: Kết hợp với Node email của NocoBase, thêm thao tác gửi email trong Workflow.

---

Nếu bạn gặp bất kỳ vấn đề nào trong quá trình thao tác, hãy đến [Cộng đồng NocoBase](https://forum.nocobase.com) để trao đổi hoặc xem [Tài liệu chính thức](https://docs-cn.nocobase.com). Hy vọng hướng dẫn này có thể giúp bạn hiện thực kiểm duyệt người dùng đăng ký theo nhu cầu thực tế và mở rộng linh hoạt theo yêu cầu. Chúc bạn sử dụng thuận lợi và dự án thành công!
