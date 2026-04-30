---
title: "Hướng dẫn bảo mật NocoBase"
description: "Hướng dẫn bảo mật NocoBase: xác thực người dùng, chính sách JWT Token, APP_KEY, kiểm soát truy cập, mã hóa dữ liệu, hạn chế IP, chính sách mật khẩu, audit log, lưu trữ LocalStorage/SessionStorage."
keywords: "Bảo mật NocoBase,xác thực người dùng,chính sách Token,kiểm soát truy cập,mã hóa dữ liệu,hạn chế IP,chính sách mật khẩu,audit log,NocoBase"
---

# Hướng dẫn bảo mật NocoBase

NocoBase từ thiết kế chức năng đến triển khai hệ thống đều coi trọng tính bảo mật của dữ liệu và ứng dụng. Nền tảng tích hợp sẵn nhiều tính năng bảo mật như xác thực người dùng, kiểm soát truy cập, mã hóa dữ liệu, đồng thời cho phép cấu hình linh hoạt các chính sách bảo mật theo nhu cầu thực tế. Cho dù là bảo vệ dữ liệu người dùng, quản lý quyền truy cập hay cô lập môi trường phát triển và sản xuất, NocoBase đều cung cấp các công cụ và giải pháp thực tế. Hướng dẫn này nhằm cung cấp hướng dẫn để sử dụng NocoBase một cách an toàn, giúp bạn bảo vệ dữ liệu, ứng dụng và môi trường, đảm bảo sử dụng các tính năng hệ thống hiệu quả với điều kiện tiên quyết là an toàn.

## Xác thực người dùng

Xác thực người dùng dùng để nhận diện danh tính của người dùng, ngăn người dùng truy cập hệ thống khi chưa được ủy quyền và đảm bảo danh tính người dùng không bị lạm dụng.

### Khóa Token

Mặc định, NocoBase sử dụng JWT (JSON Web Token) để xác thực API server. Bạn có thể đặt khóa Token thông qua biến môi trường hệ thống `APP_KEY`. Vui lòng quản lý cẩn thận khóa Token của ứng dụng, ngăn rò rỉ ra bên ngoài. Cần lưu ý rằng nếu `APP_KEY` được sửa, các Token cũ cũng sẽ hết hiệu lực.

### Chính sách Token

NocoBase hỗ trợ đặt các chính sách bảo mật sau cho Token người dùng:

| Mục cấu hình              | Mô tả                                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Thời hạn session          | Thời gian hiệu lực tối đa của mỗi lần đăng nhập của người dùng. Trong thời hạn session, Token sẽ tự động cập nhật, sau khi hết hạn yêu cầu người dùng đăng nhập lại.                                                                                                |
| Thời hạn Token        | Thời hạn của API Token được cấp phát mỗi lần. Sau khi Token hết hạn, nếu vẫn trong thời hạn session và không vượt quá thời hạn refresh, server sẽ tự động cấp phát Token mới để duy trì session người dùng, ngược lại yêu cầu người dùng đăng nhập lại. (Mỗi Token chỉ có thể được refresh một lần) |
| Thời hạn refresh Token đã hết hạn | Thời hạn tối đa cho phép refresh sau khi Token hết hạn                                                                                                                                                        |

Thông thường, chúng tôi khuyến nghị quản trị viên:

- Đặt thời hạn Token ngắn để giới hạn thời gian phơi nhiễm của Token.
- Đặt thời hạn session hợp lý, dài hơn thời hạn Token nhưng không quá dài, để cân bằng trải nghiệm người dùng và bảo mật. Sử dụng cơ chế tự động refresh Token để đảm bảo session người dùng hoạt động không bị gián đoạn đồng thời giảm rủi ro session dài hạn bị lạm dụng.
- Đặt thời hạn refresh Token đã hết hạn hợp lý, để Token tự nhiên hết hạn mà không cấp phát Token mới khi người dùng không hoạt động trong thời gian dài, giảm rủi ro session nhàn rỗi của người dùng bị lạm dụng.

### Lưu trữ Token phía client

Mặc định, Token người dùng được lưu trong LocalStorage của trình duyệt. Sau khi đóng trang trình duyệt và mở lại, nếu Token vẫn trong thời hạn, người dùng không cần đăng nhập lại.

Nếu bạn muốn người dùng phải đăng nhập lại mỗi lần vào trang, có thể đặt biến môi trường `API_CLIENT_STORAGE_TYPE=sessionStorage`, để lưu Token người dùng vào SessionStorage của trình duyệt, đạt mục đích người dùng phải đăng nhập lại mỗi lần mở trang.

### Chính sách mật khẩu

> Phiên bản chuyên nghiệp trở lên

NocoBase hỗ trợ đặt quy tắc mật khẩu và chính sách khóa khi đăng nhập với mật khẩu cho tất cả người dùng để tăng cường bảo mật cho ứng dụng NocoBase đã kích hoạt đăng nhập bằng mật khẩu. Bạn có thể tham khảo [Chính sách mật khẩu](./password-policy/index.md) để hiểu từng mục cấu hình.

#### Quy tắc mật khẩu

| Mục cấu hình                     | Mô tả                                                     |
| -------------------------- | -------------------------------------------------------- |
| **Độ dài mật khẩu**               | Yêu cầu độ dài tối thiểu của mật khẩu, độ dài tối đa là 64.                      |
| **Độ phức tạp mật khẩu**             | Đặt yêu cầu độ phức tạp của mật khẩu, các loại ký tự phải chứa.               |
| **Mật khẩu không thể chứa username** | Đặt mật khẩu có thể chứa username của người dùng hiện tại hay không.                     |
| **Ghi nhớ mật khẩu lịch sử**           | Ghi nhớ số lượng mật khẩu gần đây nhất của người dùng, không thể sử dụng lại khi đổi mật khẩu. |

#### Cấu hình hết hạn mật khẩu

| Mục cấu hình                   | Mô tả                                                                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Thời hạn mật khẩu**           | Thời hạn của mật khẩu người dùng. Người dùng phải đổi mật khẩu trước khi mật khẩu hết hạn thì thời hạn mới được tính lại. Nếu không đổi mật khẩu trước khi hết hạn, sẽ không thể sử dụng mật khẩu cũ để đăng nhập, cần quản trị viên hỗ trợ đặt lại.<br>Nếu đã cấu hình các phương thức đăng nhập khác, người dùng có thể sử dụng phương thức khác để đăng nhập. |
| **Kênh thông báo nhắc nhở mật khẩu hết hạn** | Trong vòng 10 ngày trước khi mật khẩu của người dùng hết hạn, mỗi lần đăng nhập sẽ gửi nhắc nhở.                                                                                                                                         |

#### Bảo mật đăng nhập mật khẩu

| Mục cấu hình                             | Mô tả                                                                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Số lần thử đăng nhập với mật khẩu không hợp lệ tối đa**       | Đặt số lần đăng nhập tối đa người dùng có thể thử trong khoảng thời gian quy định.                                                                                      |
| **Khoảng thời gian đăng nhập với mật khẩu không hợp lệ tối đa (giây)** | Đặt khoảng thời gian tính số lần đăng nhập không hợp lệ tối đa của người dùng, đơn vị giây.                                                                                  |
| **Thời gian khóa (giây)**                 | Đặt thời gian khóa người dùng sau khi vượt quá giới hạn đăng nhập với mật khẩu không hợp lệ (0 đại diện cho không giới hạn).<br>Trong thời gian người dùng bị khóa, sẽ bị cấm truy cập hệ thống bằng bất kỳ phương thức xác thực nào, bao gồm cả API keys. |

Thông thường, chúng tôi khuyến nghị:

- Đặt quy tắc mật khẩu có độ mạnh cao để giảm rủi ro mật khẩu bị đoán liên kết, brute force.
- Đặt thời hạn mật khẩu hợp lý để buộc người dùng đổi mật khẩu định kỳ.
- Kết hợp cấu hình số lần và thời gian đăng nhập với mật khẩu không hợp lệ để giới hạn các thử đăng nhập tần suất cao trong thời gian ngắn, ngăn chặn các hành vi brute force mật khẩu.
- Trong các tình huống yêu cầu bảo mật nghiêm ngặt, có thể đặt thời gian khóa người dùng sau khi vượt quá giới hạn đăng nhập hợp lý. Nhưng cần lưu ý rằng cài đặt thời gian khóa có thể bị lợi dụng độc hại, kẻ tấn công có thể cố tình nhập sai mật khẩu nhiều lần đối với tài khoản mục tiêu, buộc tài khoản bị khóa, không thể sử dụng bình thường. Trong quá trình sử dụng thực tế, có thể kết hợp với hạn chế IP, hạn chế tần suất API và các phương pháp khác để phòng chống các loại tấn công này.
- Sửa username, email, mật khẩu của user root mặc định của NocoBase để tránh bị lợi dụng độc hại.
- Vì mật khẩu hết hạn hoặc tài khoản bị khóa đều sẽ không thể vào hệ thống, bao gồm cả tài khoản quản trị viên, khuyến nghị thiết lập nhiều tài khoản có quyền đặt lại mật khẩu, mở khóa người dùng trong hệ thống.

![](https://static-docs.nocobase.com/202501031618900.png)

### Khóa người dùng

> Phiên bản chuyên nghiệp trở lên, bao gồm trong plugin chính sách mật khẩu

Quản lý người dùng bị khóa do vượt quá giới hạn đăng nhập với mật khẩu không hợp lệ, có thể chủ động mở khóa hoặc chủ động thêm người dùng bất thường vào danh sách khóa. Sau khi người dùng bị khóa, sẽ bị cấm truy cập hệ thống bằng bất kỳ phương thức xác thực nào, bao gồm cả API keys.

![](https://static-docs.nocobase.com/202501031618399.png)

### API key

NocoBase hỗ trợ gọi API hệ thống thông qua API key, bạn có thể thêm API key trong cấu hình plugin API key.

- Vui lòng gắn API key với vai trò chính xác và đảm bảo các quyền liên kết với vai trò được cấu hình chính xác.
- Trong quá trình sử dụng API key, ngăn API key bị rò rỉ ra bên ngoài.
- Thông thường, chúng tôi khuyến nghị bạn đặt thời hạn cho API key, không sử dụng tùy chọn "Không bao giờ hết hạn".
- Nếu phát hiện API key bị sử dụng bất thường, có thể có rủi ro rò rỉ, bạn có thể xóa API key tương ứng để vô hiệu hóa nó.

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

### Single Sign-On (SSO)

> Plugin thương mại

NocoBase cung cấp các plugin xác thực SSO phong phú, hỗ trợ nhiều giao thức chính như OIDC, SAML 2.0, LDAP, CAS. Đồng thời, NocoBase cũng có giao diện mở rộng phương thức xác thực hoàn chỉnh, có thể hỗ trợ phát triển nhanh và tích hợp các loại xác thực khác. Có thể dễ dàng kết nối IdP hiện có với NocoBase, quản lý tập trung danh tính người dùng trên IdP để tăng cường bảo mật.
![](https://static-docs.nocobase.com/202501031619427.png)

### Two-factor Authentication

> Phiên bản doanh nghiệp

Two-factor authentication yêu cầu người dùng cung cấp thông tin hợp lệ thứ hai để chứng minh danh tính khi đăng nhập bằng mật khẩu, ví dụ gửi mã xác minh động một lần đến thiết bị tin cậy của người dùng để xác minh danh tính người dùng, đảm bảo danh tính người dùng không bị lạm dụng, giảm rủi ro do rò rỉ mật khẩu.

### Kiểm soát truy cập IP

> Phiên bản doanh nghiệp

NocoBase hỗ trợ đặt blacklist hoặc whitelist cho IP truy cập của người dùng.

- Trong môi trường yêu cầu bảo mật nghiêm ngặt, có thể đặt whitelist IP, chỉ cho phép IP cụ thể hoặc dải IP truy cập hệ thống để hạn chế kết nối mạng bên ngoài trái phép, giảm rủi ro bảo mật từ nguồn.
- Trong điều kiện truy cập mạng công khai, nếu quản trị viên phát hiện truy cập bất thường, có thể đặt blacklist IP để chặn các địa chỉ IP độc hại đã biết hoặc các nguồn truy cập đáng ngờ, giảm các mối đe dọa bảo mật như quét độc hại, brute force.
- Đối với các yêu cầu truy cập bị từ chối, lưu lại bản ghi log.

## Kiểm soát quyền

Thông qua việc thiết lập các vai trò khác nhau trong hệ thống và đặt các quyền tương ứng cho vai trò, có thể kiểm soát chi tiết quyền truy cập tài nguyên của người dùng. Quản trị viên cần kết hợp với nhu cầu tình huống thực tế, cấu hình hợp lý để giảm rủi ro rò rỉ tài nguyên hệ thống.

### User root

Khi cài đặt NocoBase lần đầu, ứng dụng sẽ khởi tạo một user root. Khuyến nghị bạn sửa thông tin liên quan của user root thông qua đặt biến môi trường hệ thống để tránh bị lợi dụng độc hại.

- `INIT_ROOT_USERNAME` - username của root
- `INIT_ROOT_EMAIL` - email của root
- `INIT_ROOT_PASSWORD` - mật khẩu của root, vui lòng đặt mật khẩu có độ mạnh cao.

Trong quá trình sử dụng hệ thống tiếp theo, khuyến nghị bạn thiết lập và sử dụng các tài khoản quản trị viên khác, cố gắng tránh trực tiếp sử dụng user root để thao tác ứng dụng.

### Vai trò và quyền

NocoBase điều khiển quyền truy cập tài nguyên của người dùng thông qua việc thiết lập vai trò trong hệ thống, cấp quyền cho các vai trò khác nhau và gắn người dùng với vai trò tương ứng. Mỗi người dùng có thể có nhiều vai trò, người dùng có thể thông qua chuyển đổi vai trò để thao tác tài nguyên với các góc nhìn khác nhau. Nếu đã cài đặt plugin phòng ban, còn có thể gắn vai trò với phòng ban, người dùng sẽ có vai trò gắn trên phòng ban thuộc về.

![](https://static-docs.nocobase.com/202501031620965.png)

### Quyền cấu hình hệ thống

Quyền cấu hình hệ thống bao gồm các thiết lập sau:

- Có cho phép cấu hình giao diện hay không
- Có cho phép cài đặt, kích hoạt, vô hiệu hóa plugin hay không
- Có cho phép cấu hình plugin hay không
- Có cho phép xóa cache, khởi động lại ứng dụng hay không
- Quyền cấu hình của từng plugin

### Quyền menu

Quyền menu dùng để điều khiển quyền của người dùng vào các trang menu khác nhau, bao gồm desktop và mobile.
![](https://static-docs.nocobase.com/202501031620717.png)

### Quyền dữ liệu

NocoBase cung cấp kiểm soát chi tiết cho quyền truy cập dữ liệu trong hệ thống của người dùng, đảm bảo các người dùng khác nhau chỉ có thể truy cập dữ liệu liên quan đến trách nhiệm của họ, ngăn chặn vượt quyền và rò rỉ dữ liệu.

#### Kiểm soát toàn cục

![](https://static-docs.nocobase.com/202501031620866.png)

#### Kiểm soát cấp bảng, cấp field

![](https://static-docs.nocobase.com/202501031621047.png)

#### Kiểm soát phạm vi dữ liệu

Đặt phạm vi dữ liệu mà người dùng có thể thao tác. Lưu ý phạm vi dữ liệu ở đây khác với phạm vi dữ liệu được cấu hình trong block. Phạm vi dữ liệu được cấu hình trong block thông thường chỉ dùng để lọc dữ liệu phía frontend. Nếu cần kiểm soát nghiêm ngặt quyền truy cập tài nguyên dữ liệu của người dùng, cần cấu hình ở đây, do server kiểm soát.

![](https://static-docs.nocobase.com/202501031621712.png)

## Bảo mật dữ liệu

Trong quá trình lưu trữ, sao lưu dữ liệu, NocoBase cung cấp các cơ chế hiệu quả để đảm bảo bảo mật dữ liệu.

### Lưu trữ mật khẩu

Mật khẩu người dùng của NocoBase được mã hóa bằng thuật toán scrypt và lưu trữ, có thể đối phó hiệu quả với các cuộc tấn công phần cứng quy mô lớn.

### Biến môi trường và khóa

Khi sử dụng các dịch vụ bên thứ ba trong NocoBase, chúng tôi khuyến nghị bạn cấu hình thông tin khóa của bên thứ ba vào biến môi trường, lưu trữ mã hóa. Vừa thuận tiện cấu hình sử dụng ở các nơi khác nhau, vừa tăng cường bảo mật. Bạn có thể xem tài liệu để hiểu cách sử dụng chi tiết.

:::warning
Mặc định, khóa được mã hóa bằng thuật toán AES-256-CBC, NocoBase sẽ tự động tạo khóa mã hóa 32 bit và lưu vào storage/.data/environment/aes_key.dat. Bạn nên giữ gìn cẩn thận file khóa, ngăn file khóa bị đánh cắp. Nếu cần migrate dữ liệu, file khóa cần được migrate cùng.
:::

![](https://static-docs.nocobase.com/202501031622612.png)

### Lưu trữ file

Nếu có nhu cầu lưu trữ file nhạy cảm, khuyến nghị sử dụng dịch vụ cloud storage tương thích giao thức S3, kết hợp với plugin phiên bản thương mại File storage: S3 (Pro) để thực hiện đọc/ghi riêng tư cho file. Nếu cần sử dụng trong môi trường mạng nội bộ, khuyến nghị sử dụng MinIO và các ứng dụng lưu trữ tương thích S3, hỗ trợ triển khai riêng tư khác.

![](https://static-docs.nocobase.com/202501031623549.png)

### Sao lưu ứng dụng

Để đảm bảo bảo mật dữ liệu ứng dụng, tránh mất dữ liệu, chúng tôi khuyến nghị bạn định kỳ sao lưu database.

Người dùng phiên bản open source có thể tham khảo https://www.nocobase.com/en/blog/nocobase-backup-restore để sao lưu bằng công cụ database, đồng thời chúng tôi khuyến nghị bạn giữ gìn cẩn thận file sao lưu, ngăn rò rỉ dữ liệu.

Người dùng phiên bản chuyên nghiệp trở lên có thể sử dụng Backup Manager để sao lưu, Backup Manager cung cấp các tính năng sau:

- Sao lưu tự động định kỳ: Sao lưu tự động chu kỳ, tiết kiệm thời gian và thao tác thủ công, bảo mật dữ liệu được đảm bảo hơn.
- Đồng bộ file sao lưu lên cloud storage: Cô lập file sao lưu và dịch vụ ứng dụng để ngăn chặn dịch vụ không khả dụng do lỗi server đồng thời mất file sao lưu.
- Mã hóa file sao lưu: Đặt mật khẩu cho file sao lưu, giảm rủi ro rò rỉ dữ liệu do rò rỉ file sao lưu.

![](https://static-docs.nocobase.com/202501031623107.png)

## Bảo mật môi trường runtime

Triển khai NocoBase đúng cách và đảm bảo bảo mật môi trường runtime là một trong những yếu tố then chốt để đảm bảo bảo mật ứng dụng NocoBase.

### Triển khai HTTPS

Để ngăn chặn tấn công Man-in-the-Middle, chúng tôi khuyến nghị bạn thêm chứng chỉ SSL/TLS cho site ứng dụng NocoBase để đảm bảo bảo mật trong quá trình truyền tải dữ liệu qua mạng.

### Mã hóa truyền API

> Phiên bản doanh nghiệp

Trong môi trường có yêu cầu bảo mật dữ liệu nghiêm ngặt hơn, NocoBase hỗ trợ kích hoạt mã hóa truyền API, mã hóa nội dung request và response của API, tránh truyền dạng plain text, tăng ngưỡng phá mã dữ liệu.

### Triển khai riêng tư

Mặc định, NocoBase không cần giao tiếp với dịch vụ bên thứ ba, team NocoBase sẽ không thu thập bất kỳ thông tin nào của người dùng. Chỉ khi thực hiện hai loại thao tác sau cần kết nối với server NocoBase:

1. Tự động tải plugin thương mại qua nền tảng NocoBase Service.
2. Xác minh và kích hoạt online ứng dụng phiên bản thương mại.

Nếu bạn sẵn sàng hy sinh một mức độ tiện lợi nhất định, hai loại thao tác này cũng đều hỗ trợ hoàn thành offline, không cần kết nối trực tiếp với server NocoBase.

NocoBase hỗ trợ triển khai mạng nội bộ hoàn toàn, tham khảo

- https://www.nocobase.com/en/blog/load-docker-image

### Cô lập đa môi trường

> Phiên bản chuyên nghiệp trở lên

Trong thực tiễn sử dụng thực tế, chúng tôi khuyến nghị người dùng doanh nghiệp cô lập môi trường test và môi trường production để đảm bảo bảo mật dữ liệu ứng dụng và môi trường runtime trong môi trường production. Sử dụng plugin Migration Manager có thể thực hiện migrate dữ liệu ứng dụng giữa các môi trường khác nhau.

![](https://static-docs.nocobase.com/202501031627729.png)

## Audit và giám sát

### Audit log

> Phiên bản doanh nghiệp

Tính năng audit log của NocoBase ghi lại các bản ghi hoạt động của người dùng trong hệ thống. Thông qua việc ghi lại các thao tác và hành vi truy cập then chốt của người dùng, quản trị viên có thể:

- Kiểm tra IP, thiết bị truy cập của người dùng và thời gian thao tác để phát hiện các hành vi bất thường kịp thời.
- Truy xuất lịch sử thao tác tài nguyên dữ liệu trong hệ thống.

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

### Log ứng dụng

NocoBase cung cấp nhiều loại log để giúp bạn hiểu tình trạng vận hành và bản ghi hành vi của hệ thống, phát hiện và định vị các vấn đề hệ thống kịp thời, đảm bảo bảo mật và khả năng kiểm soát của hệ thống từ các chiều khác nhau. Các loại log chính bao gồm:

- Log request: Log yêu cầu API, bao gồm URL truy cập, HTTP method, tham số request, thời gian phản hồi và status code, v.v.
- Log hệ thống: Ghi lại các sự kiện vận hành ứng dụng, bao gồm khởi động dịch vụ, thay đổi cấu hình, thông tin lỗi và các thao tác then chốt.
- Log SQL: Ghi lại các câu lệnh thao tác database và thời gian thực thi, bao gồm các hành vi truy vấn, cập nhật, chèn và xóa.
- Log workflow: Log thực thi của workflow, bao gồm thời gian thực thi, thông tin chạy, thông tin lỗi.
