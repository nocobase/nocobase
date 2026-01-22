---
pkg: '@nocobase/plugin-auth'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Chính sách bảo mật Token

## Giới thiệu

Chính sách bảo mật Token là một cấu hình chức năng được thiết kế để bảo vệ an toàn hệ thống và nâng cao trải nghiệm người dùng. Chính sách này bao gồm ba mục cấu hình chính: "Thời hạn hiệu lực phiên", "Thời hạn hiệu lực Token" và "Thời gian giới hạn làm mới Token hết hạn".

## Vị trí cấu hình

Bạn có thể tìm thấy cấu hình này tại Cài đặt plugin - Bảo mật - Chính sách Token:

![20250105111821-2025-01-05-11-18-24](https://static-docs.nocobase.com/20250105111821-2025-01-05-11-18-24.png)

## Thời hạn hiệu lực phiên

**Định nghĩa:**

Thời hạn hiệu lực phiên là khoảng thời gian tối đa mà hệ thống cho phép người dùng duy trì phiên hoạt động sau khi đăng nhập.

**Tác dụng:**

Khi vượt quá thời hạn hiệu lực phiên, người dùng sẽ nhận được phản hồi lỗi 401 khi truy cập lại hệ thống. Sau đó, hệ thống sẽ chuyển hướng người dùng đến trang đăng nhập để xác thực lại.
Ví dụ:
Nếu thời hạn hiệu lực phiên được đặt là 8 giờ, tính từ thời điểm người dùng đăng nhập và không có tương tác bổ sung nào, phiên sẽ hết hạn sau 8 giờ.

**Cài đặt đề xuất:**

- Đối với các kịch bản thao tác ngắn hạn: Nên đặt từ 1-2 giờ để tăng cường bảo mật.
- Đối với các kịch bản làm việc dài hạn: Có thể đặt là 8 giờ để phù hợp với nhu cầu kinh doanh.

## Thời hạn hiệu lực Token

**Định nghĩa:**

Thời hạn hiệu lực Token là vòng đời của mỗi Token được hệ thống cấp trong phiên hoạt động của người dùng.

**Tác dụng:**

Khi Token hết hạn, hệ thống sẽ tự động cấp một Token mới để duy trì phiên hoạt động.
Mỗi Token đã hết hạn chỉ được phép làm mới một lần.

**Cài đặt đề xuất:**

Vì lý do bảo mật, nên đặt trong khoảng từ 15 đến 30 phút.
Có thể điều chỉnh tùy theo yêu cầu của kịch bản. Ví dụ:
- Các kịch bản bảo mật cao: Thời hạn hiệu lực Token có thể rút ngắn xuống 10 phút hoặc ít hơn.
- Các kịch bản rủi ro thấp: Thời hạn hiệu lực Token có thể kéo dài hợp lý đến 1 giờ.

## Thời gian giới hạn làm mới Token hết hạn

**Định nghĩa:**

Thời gian giới hạn làm mới Token hết hạn là khoảng thời gian tối đa cho phép người dùng lấy lại Token mới thông qua thao tác làm mới sau khi Token đã hết hạn.

**Đặc điểm:**

- Nếu vượt quá thời gian giới hạn làm mới, người dùng phải đăng nhập lại để lấy Token mới.
- Thao tác làm mới sẽ không kéo dài thời hạn hiệu lực phiên, mà chỉ tạo lại Token.

**Cài đặt đề xuất:**

Vì lý do bảo mật, nên đặt trong khoảng từ 5 đến 10 phút.