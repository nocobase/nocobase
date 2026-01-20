:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Hướng dẫn bảo mật NocoBase

NocoBase chú trọng đến bảo mật dữ liệu và ứng dụng từ khâu thiết kế tính năng đến triển khai hệ thống. Nền tảng này tích hợp nhiều tính năng bảo mật như xác thực người dùng, kiểm soát truy cập và mã hóa dữ liệu, đồng thời cho phép cấu hình linh hoạt các chính sách bảo mật theo nhu cầu thực tế. Dù là bảo vệ dữ liệu người dùng, quản lý quyền truy cập hay cô lập môi trường phát triển và sản xuất, NocoBase đều cung cấp các công cụ và giải pháp thiết thực. Hướng dẫn này nhằm cung cấp chỉ dẫn để sử dụng NocoBase một cách an toàn, giúp người dùng bảo vệ dữ liệu, ứng dụng và môi trường, đảm bảo an toàn cho người dùng đồng thời sử dụng các tính năng hệ thống một cách hiệu quả.

## Xác thực người dùng

Xác thực người dùng dùng để nhận diện danh tính người dùng, ngăn chặn truy cập trái phép vào hệ thống và đảm bảo danh tính người dùng không bị lạm dụng.

### Khóa Token

Theo mặc định, NocoBase sử dụng JWT (JSON Web Token) để xác thực các API phía máy chủ. Người dùng có thể đặt khóa Token thông qua biến môi trường hệ thống `APP_KEY`. Vui lòng quản lý khóa Token của ứng dụng một cách cẩn thận để tránh rò rỉ ra bên ngoài. Lưu ý rằng, nếu `APP_KEY` bị thay đổi, các Token cũ cũng sẽ không còn hiệu lực.

### Chính sách Token

NocoBase hỗ trợ thiết lập các chính sách bảo mật sau cho Token của người dùng:

| Mục cấu hình              | Mô tả                                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Thời hạn hiệu lực của phiên          | Thời gian hiệu lực tối đa cho mỗi lần đăng nhập của người dùng. Trong thời hạn hiệu lực của phiên, Token sẽ tự động được cập nhật. Sau khi hết thời gian chờ, người dùng sẽ được yêu cầu đăng nhập lại.                                                                                                |
| Thời hạn hiệu lực của Token        | Thời hạn hiệu lực của mỗi API Token được cấp. Sau khi Token hết hạn, nếu vẫn trong thời hạn hiệu lực của phiên và chưa vượt quá thời hạn làm mới, máy chủ sẽ tự động cấp Token mới để duy trì phiên người dùng, nếu không người dùng sẽ được yêu cầu đăng nhập lại. (Mỗi Token chỉ có thể được làm mới một lần) |
| Thời hạn làm mới Token đã hết hạn | Thời gian tối đa cho phép làm mới một Token sau khi nó hết hạn.                                                                                                                                                        |

Thông thường, chúng tôi khuyên quản trị viên nên:

-   Đặt thời hạn hiệu lực Token ngắn hơn để giới hạn thời gian Token bị lộ.
-   Đặt thời hạn hiệu lực phiên hợp lý, dài hơn thời hạn hiệu lực Token nhưng không quá dài, để cân bằng trải nghiệm người dùng và bảo mật. Tận dụng cơ chế tự động làm mới Token để đảm bảo các phiên người dùng đang hoạt động không bị gián đoạn, đồng thời giảm thiểu rủi ro lạm dụng các phiên dài hạn.
-   Đặt thời hạn làm mới Token đã hết hạn hợp lý, để Token tự động hết hạn khi người dùng không hoạt động trong thời gian dài mà không cấp Token mới, giảm thiểu rủi ro lạm dụng các phiên người dùng không hoạt động.

### Lưu trữ Token phía máy khách

Theo mặc định, Token của người dùng được lưu trữ trong LocalStorage của trình duyệt. Sau khi đóng và mở lại trang trình duyệt, nếu Token vẫn còn hiệu lực, người dùng không cần đăng nhập lại.

Nếu bạn muốn người dùng phải đăng nhập lại mỗi khi truy cập trang, bạn có thể đặt biến môi trường `API_CLIENT_STORAGE_TYPE=sessionStorage` để lưu Token người dùng vào SessionStorage của trình duyệt, nhằm mục đích người dùng đăng nhập lại mỗi khi mở trang.

### Chính sách mật khẩu

> Phiên bản Chuyên nghiệp trở lên

NocoBase hỗ trợ đặt quy tắc mật khẩu và chính sách khóa tài khoản sau nhiều lần đăng nhập sai cho tất cả người dùng, nhằm tăng cường bảo mật cho các ứng dụng NocoBase có bật tính năng đăng nhập bằng mật khẩu. Bạn có thể tham khảo [Chính sách mật khẩu](./password-policy/index.md) để hiểu rõ từng mục cấu hình.

#### Quy tắc mật khẩu

| Mục cấu hình                     | Mô tả                                                     |
| -------------------------- | -------------------------------------------------------- |
| **Độ dài mật khẩu**               | Yêu cầu độ dài mật khẩu tối thiểu, độ dài tối đa là 64.                      |
| **Độ phức tạp của mật khẩu**             | Đặt yêu cầu về độ phức tạp của mật khẩu, các loại ký tự phải được bao gồm.               |
| **Không được chứa tên người dùng trong mật khẩu** | Đặt xem mật khẩu có thể chứa tên người dùng hiện tại hay không.                     |
| **Ghi nhớ lịch sử mật khẩu**           | Ghi nhớ số lượng mật khẩu gần đây nhất mà người dùng đã sử dụng, người dùng không thể sử dụng lại chúng khi thay đổi mật khẩu. |

#### Cấu hình hết hạn mật khẩu

| Mục cấu hình                   | Mô tả                                                                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Thời hạn hiệu lực của mật khẩu**           | Thời hạn hiệu lực của mật khẩu người dùng. Người dùng phải đổi mật khẩu trước khi hết hạn để thời hạn hiệu lực được tính lại. Nếu không đổi mật khẩu trước khi hết hạn, người dùng sẽ không thể đăng nhập bằng mật khẩu cũ và cần quản trị viên hỗ trợ đặt lại.<br>Nếu có cấu hình các phương thức đăng nhập khác, người dùng có thể sử dụng các phương thức đó để đăng nhập. |
| **Kênh thông báo nhắc nhở hết hạn mật khẩu** | Trong vòng 10 ngày trước khi mật khẩu người dùng hết hạn, một lời nhắc sẽ được gửi mỗi khi người dùng đăng nhập.                                                                                                                                         |

#### Bảo mật đăng nhập bằng mật khẩu

| Mục cấu hình                             | Mô tả                                                                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Số lần thử đăng nhập mật khẩu không hợp lệ tối đa**       | Đặt số lần đăng nhập tối đa mà người dùng có thể thử trong một khoảng thời gian quy định.                                                                                      |
| **Khoảng thời gian tối đa cho các lần thử đăng nhập mật khẩu không hợp lệ (giây)** | Đặt khoảng thời gian tính số lần đăng nhập không hợp lệ tối đa của người dùng, đơn vị là giây.                                                                                  |
| **Thời gian khóa (giây)**                 | Đặt thời gian khóa người dùng sau khi vượt quá giới hạn đăng nhập mật khẩu không hợp lệ (0 nghĩa là không giới hạn).<br>Trong thời gian người dùng bị khóa, mọi phương thức xác thực để truy cập hệ thống đều bị cấm, bao gồm cả API keys. |

Thông thường, chúng tôi khuyên bạn nên:

-   Đặt quy tắc mật khẩu mạnh để giảm thiểu rủi ro mật khẩu bị đoán dựa trên liên kết hoặc bị tấn công vét cạn (brute force).
-   Đặt thời hạn hiệu lực mật khẩu hợp lý để buộc người dùng thay đổi mật khẩu định kỳ.
-   Kết hợp cấu hình số lần đăng nhập mật khẩu không hợp lệ và thời gian để giới hạn các lần thử đăng nhập mật khẩu tần suất cao trong thời gian ngắn, ngăn chặn hành vi tấn công vét cạn mật khẩu.
-   Trong các trường hợp yêu cầu bảo mật nghiêm ngặt, bạn có thể đặt thời gian khóa người dùng hợp lý khi vượt quá giới hạn đăng nhập. Tuy nhiên, cần lưu ý rằng cài đặt thời gian khóa có thể bị lợi dụng một cách độc hại. Kẻ tấn công có thể cố ý nhập sai mật khẩu nhiều lần vào tài khoản mục tiêu, buộc tài khoản bị khóa và không thể sử dụng bình thường. Trong quá trình sử dụng thực tế, có thể kết hợp các biện pháp như giới hạn IP, giới hạn tần suất API để phòng chống các cuộc tấn công kiểu này.
-   Thay đổi tên người dùng, email và mật khẩu mặc định của tài khoản root trong NocoBase để tránh bị lợi dụng.
-   Vì mật khẩu hết hạn hoặc tài khoản bị khóa đều sẽ không thể truy cập hệ thống, kể cả tài khoản quản trị viên, nên khuyến nghị thiết lập nhiều tài khoản có quyền đặt lại mật khẩu và mở khóa người dùng trong hệ thống.

![](https://static-docs.nocobase.com/202501031618900.png)

### Khóa người dùng

> Phiên bản Chuyên nghiệp trở lên, bao gồm trong plugin chính sách mật khẩu

Quản lý người dùng bị khóa do vượt quá giới hạn đăng nhập mật khẩu không hợp lệ. Bạn có thể chủ động mở khóa hoặc chủ động thêm người dùng bất thường vào danh sách khóa. Sau khi người dùng bị khóa, mọi phương thức xác thực để truy cập hệ thống đều bị cấm, bao gồm cả API keys.

![](https://static-docs.nocobase.com/202501031618399.png)

### API Keys

NocoBase hỗ trợ gọi API hệ thống thông qua API keys. Người dùng có thể thêm API keys trong cấu hình plugin API Keys.

-   Vui lòng gán vai trò chính xác cho API key và đảm bảo các quyền liên quan đến vai trò được cấu hình đúng.
-   Trong quá trình sử dụng API keys, hãy ngăn chặn việc API keys bị rò rỉ ra bên ngoài.
-   Thông thường, chúng tôi khuyên người dùng nên đặt thời hạn hiệu lực cho API keys và không sử dụng tùy chọn "Không bao giờ hết hạn".
-   Nếu phát hiện API key bị sử dụng bất thường, có thể có nguy cơ rò rỉ. Người dùng có thể xóa API key tương ứng để vô hiệu hóa nó.

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

### Đăng nhập một lần (Single Sign-On)

> Plugin thương mại

NocoBase cung cấp nhiều plugin xác thực SSO phong phú, hỗ trợ nhiều giao thức phổ biến như OIDC, SAML 2.0, LDAP, CAS. Đồng thời, NocoBase cũng có các giao diện mở rộng phương thức xác thực hoàn chỉnh, có thể hỗ trợ phát triển và tích hợp nhanh chóng các loại xác thực khác. Bạn có thể dễ dàng tích hợp IdP hiện có với NocoBase để quản lý tập trung danh tính người dùng trên IdP, từ đó nâng cao bảo mật.
![](https://static-docs.nocobase.com/202501031619427.png)

### Xác thực hai yếu tố (Two-factor authentication)

> Phiên bản Doanh nghiệp

Xác thực hai yếu tố yêu cầu người dùng cung cấp thông tin hợp lệ thứ hai để chứng minh danh tính khi đăng nhập bằng mật khẩu, ví dụ như gửi mã xác minh động một lần đến thiết bị đáng tin cậy của người dùng, nhằm xác minh danh tính người dùng, đảm bảo danh tính người dùng không bị lạm dụng và giảm thiểu rủi ro rò rỉ mật khẩu.

### Kiểm soát truy cập IP

> Phiên bản Doanh nghiệp

NocoBase hỗ trợ thiết lập danh sách đen hoặc danh sách trắng cho IP truy cập của người dùng.

-   Trong môi trường yêu cầu bảo mật nghiêm ngặt, có thể thiết lập danh sách trắng IP để chỉ cho phép các IP hoặc dải IP cụ thể truy cập hệ thống, nhằm hạn chế kết nối mạng bên ngoài trái phép và giảm thiểu rủi ro bảo mật từ nguồn.
-   Trong điều kiện truy cập mạng công cộng, nếu quản trị viên phát hiện truy cập bất thường, có thể thiết lập danh sách đen IP để chặn các địa chỉ IP độc hại đã biết hoặc truy cập từ các nguồn đáng ngờ, giảm thiểu các mối đe dọa bảo mật như quét độc hại, tấn công vét cạn.
-   Giữ lại nhật ký ghi lại các yêu cầu truy cập bị từ chối.

## Kiểm soát quyền hạn

Bằng cách thiết lập các vai trò khác nhau trong hệ thống và gán các quyền tương ứng cho từng vai trò, có thể kiểm soát chi tiết quyền truy cập tài nguyên của người dùng. Quản trị viên cần cấu hình hợp lý dựa trên nhu cầu thực tế để giảm thiểu rủi ro rò rỉ tài nguyên hệ thống.

### Người dùng Root

Khi cài đặt NocoBase lần đầu, ứng dụng sẽ khởi tạo một người dùng root. Khuyến nghị người dùng nên sửa đổi thông tin liên quan đến người dùng root bằng cách thiết lập các biến môi trường hệ thống để tránh bị lợi dụng.

-   `INIT_ROOT_USERNAME` - Tên người dùng root
-   `INIT_ROOT_EMAIL` - Email người dùng root
-   `INIT_ROOT_PASSWORD` - Mật khẩu người dùng root, vui lòng đặt mật khẩu mạnh.

Trong quá trình sử dụng hệ thống sau này, khuyến nghị người dùng nên thiết lập và sử dụng các tài khoản quản trị viên khác, cố gắng tránh sử dụng trực tiếp người dùng root để vận hành ứng dụng.

### Vai trò và quyền hạn

NocoBase kiểm soát quyền truy cập tài nguyên của người dùng bằng cách thiết lập các vai trò trong hệ thống, cấp quyền cho các vai trò khác nhau và gán người dùng vào các vai trò tương ứng. Mỗi người dùng có thể có nhiều vai trò, và có thể chuyển đổi vai trò để thao tác tài nguyên từ các góc nhìn khác nhau. Nếu cài đặt plugin phòng ban, vai trò cũng có thể được gán với phòng ban, người dùng sẽ có các vai trò được gán cho phòng ban của họ.

![](https://static-docs.nocobase.com/202501031620965.png)

### Quyền cấu hình hệ thống

Quyền cấu hình hệ thống bao gồm các cài đặt sau:

-   Có cho phép giao diện cấu hình hay không
-   Có cho phép cài đặt, kích hoạt, vô hiệu hóa plugin hay không
-   Có cho phép cấu hình plugin hay không
-   Có cho phép xóa bộ nhớ đệm, khởi động lại ứng dụng hay không
-   Quyền cấu hình của từng plugin

### Quyền truy cập menu

Quyền truy cập menu được sử dụng để kiểm soát quyền của người dùng khi truy cập các trang menu khác nhau, bao gồm cả trên máy tính để bàn và thiết bị di động.
![](https://static-docs.nocobase.com/202501031620717.png)

### Quyền dữ liệu

NocoBase cung cấp khả năng kiểm soát chi tiết quyền truy cập dữ liệu trong hệ thống cho người dùng, đảm bảo rằng các người dùng khác nhau chỉ có thể truy cập dữ liệu liên quan đến trách nhiệm của họ, ngăn chặn việc vượt quyền và rò rỉ dữ liệu.

#### Kiểm soát toàn cầu

![](https://static-docs.nocobase.com/202501031620866.png)

#### Kiểm soát cấp bảng, cấp trường

![](https://static-docs.nocobase.com/202501031621047.png)

#### Kiểm soát phạm vi dữ liệu

Đặt phạm vi dữ liệu mà người dùng có thể thao tác. Lưu ý rằng phạm vi dữ liệu ở đây khác với phạm vi dữ liệu được cấu hình trong khối. Phạm vi dữ liệu được cấu hình trong khối thường chỉ được sử dụng để lọc dữ liệu phía giao diện người dùng. Nếu cần kiểm soát chặt chẽ quyền truy cập tài nguyên dữ liệu của người dùng, cần cấu hình tại đây và được kiểm soát bởi máy chủ.

![](https://static-docs.nocobase.com/202501031621712.png)

## Bảo mật dữ liệu

Trong quá trình lưu trữ và sao lưu dữ liệu, NocoBase cung cấp các cơ chế hiệu quả để đảm bảo an toàn dữ liệu.

### Lưu trữ mật khẩu

Mật khẩu người dùng của NocoBase được mã hóa và lưu trữ bằng thuật toán scrypt, có thể chống lại hiệu quả các cuộc tấn công phần cứng quy mô lớn.

### Biến môi trường và khóa bí mật

Khi sử dụng các dịch vụ của bên thứ ba trong NocoBase, chúng tôi khuyên bạn nên cấu hình thông tin khóa bí mật của bên thứ ba vào các biến môi trường và lưu trữ chúng dưới dạng mã hóa. Điều này vừa tiện lợi cho việc cấu hình và sử dụng ở nhiều nơi khác nhau, vừa tăng cường bảo mật. Bạn có thể xem tài liệu để biết cách sử dụng chi tiết.

:::warning
Theo mặc định, khóa bí mật được mã hóa bằng thuật toán AES-256-CBC. NocoBase sẽ tự động tạo khóa mã hóa 32 bit và lưu vào `storage/.data/environment/aes_key.dat`. Người dùng nên bảo quản tệp khóa bí mật cẩn thận để tránh bị đánh cắp. Nếu cần di chuyển dữ liệu, tệp khóa bí mật cũng cần được di chuyển cùng.
:::

![](https://static-docs.nocobase.com/202501031622612.png)

### Lưu trữ tệp

Nếu có nhu cầu lưu trữ các tệp nhạy cảm, khuyến nghị sử dụng dịch vụ lưu trữ đám mây tương thích với giao thức S3 và kết hợp với plugin thương mại File storage: S3 (Pro) để thực hiện việc đọc/ghi tệp riêng tư. Nếu cần sử dụng trong môi trường mạng nội bộ, khuyến nghị sử dụng các ứng dụng lưu trữ hỗ trợ triển khai riêng tư và tương thích với giao thức S3 như MinIO.

![](https://static-docs.nocobase.com/202501031623549.png)

### Sao lưu ứng dụng

Để đảm bảo an toàn dữ liệu ứng dụng và tránh mất dữ liệu, chúng tôi khuyên bạn nên sao lưu cơ sở dữ liệu định kỳ.

Người dùng phiên bản mã nguồn mở có thể tham khảo https://www.nocobase.com/en/blog/nocobase-backup-restore để sao lưu bằng các công cụ cơ sở dữ liệu. Đồng thời, chúng tôi khuyên bạn nên bảo quản cẩn thận các tệp sao lưu để tránh rò rỉ dữ liệu.

Người dùng phiên bản Chuyên nghiệp trở lên có thể sử dụng trình quản lý sao lưu để thực hiện sao lưu. Trình quản lý sao lưu cung cấp các tính năng sau:

-   **Sao lưu tự động theo lịch trình**: Sao lưu tự động định kỳ giúp tiết kiệm thời gian và thao tác thủ công, đảm bảo an toàn dữ liệu tốt hơn.
-   **Đồng bộ hóa tệp sao lưu lên lưu trữ đám mây**: Cô lập các tệp sao lưu khỏi chính dịch vụ ứng dụng, ngăn chặn việc mất tệp sao lưu khi dịch vụ không khả dụng do lỗi máy chủ.
-   **Mã hóa tệp sao lưu**: Đặt mật khẩu cho tệp sao lưu, giảm thiểu rủi ro rò rỉ dữ liệu do tệp sao lưu bị lộ.

![](https://static-docs.nocobase.com/202501031623107.png)

## Bảo mật môi trường vận hành

Triển khai NocoBase đúng cách và đảm bảo an toàn môi trường vận hành là một trong những yếu tố then chốt để đảm bảo bảo mật cho ứng dụng NocoBase.

### Triển khai HTTPS

Để ngăn chặn các cuộc tấn công trung gian (man-in-the-middle), chúng tôi khuyên bạn nên thêm chứng chỉ SSL/TLS cho trang web ứng dụng NocoBase để đảm bảo an toàn dữ liệu trong quá trình truyền tải qua mạng.

### Mã hóa truyền tải API

> Phiên bản Doanh nghiệp

Trong các môi trường có yêu cầu bảo mật dữ liệu nghiêm ngặt hơn, NocoBase hỗ trợ bật mã hóa truyền tải API, mã hóa nội dung yêu cầu và phản hồi của API, tránh truyền tải văn bản rõ ràng và nâng cao ngưỡng phá mã dữ liệu.

### Triển khai riêng tư

Theo mặc định, NocoBase không cần giao tiếp với các dịch vụ của bên thứ ba và đội ngũ NocoBase sẽ không thu thập bất kỳ thông tin nào của người dùng. Chỉ khi thực hiện hai thao tác sau mới cần kết nối với máy chủ NocoBase:

1.  Tự động tải xuống các plugin thương mại thông qua nền tảng NocoBase Service.
2.  Xác minh danh tính và kích hoạt ứng dụng phiên bản thương mại trực tuyến.

Nếu bạn sẵn sàng đánh đổi một phần tiện lợi, cả hai thao tác này đều hỗ trợ hoàn thành ngoại tuyến, không cần kết nối trực tiếp với máy chủ NocoBase.

NocoBase hỗ trợ triển khai hoàn toàn trong mạng nội bộ, tham khảo:

-   https://www.nocobase.com/en/blog/load-docker-image
-   [Tải plugin lên thư mục plugin để cài đặt và nâng cấp](/get-started/install-upgrade-plugins#third-party-plugins)

### Cô lập đa môi trường

> Phiên bản Chuyên nghiệp trở lên

Trong thực tế sử dụng, chúng tôi khuyến nghị người dùng doanh nghiệp nên cô lập môi trường thử nghiệm và sản xuất để đảm bảo an toàn dữ liệu ứng dụng và môi trường vận hành trong môi trường sản xuất. Sử dụng plugin quản lý di chuyển, có thể thực hiện di chuyển dữ liệu ứng dụng giữa các môi trường khác nhau.

![](https://static-docs.nocobase.com/202501031627729.png)

## Kiểm toán và giám sát

### Nhật ký kiểm toán

> Phiên bản Doanh nghiệp

Chức năng nhật ký kiểm toán của NocoBase ghi lại các hoạt động của người dùng trong hệ thống. Bằng cách ghi lại các thao tác quan trọng và hành vi truy cập của người dùng, quản trị viên có thể:

-   Kiểm tra thông tin truy cập của người dùng như IP, thiết bị, và thời gian thao tác để kịp thời phát hiện các hành vi bất thường.
-   Truy vết lịch sử thao tác tài nguyên dữ liệu trong hệ thống.

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

### Nhật ký ứng dụng

NocoBase cung cấp nhiều loại nhật ký khác nhau, giúp người dùng hiểu rõ tình trạng hoạt động và ghi nhận hành vi của hệ thống, kịp thời phát hiện và định vị các vấn đề của hệ thống, từ đó đảm bảo tính bảo mật và khả năng kiểm soát của hệ thống từ nhiều khía cạnh. Các loại nhật ký chính bao gồm:

-   **Nhật ký yêu cầu**: Nhật ký yêu cầu API, bao gồm URL đã truy cập, phương thức HTTP, tham số yêu cầu, thời gian phản hồi và mã trạng thái.
-   **Nhật ký hệ thống**: Ghi lại các sự kiện vận hành ứng dụng, bao gồm khởi động dịch vụ, thay đổi cấu hình, thông báo lỗi và các thao tác quan trọng.
-   **Nhật ký SQL**: Ghi lại các câu lệnh thao tác cơ sở dữ liệu và thời gian thực thi của chúng, bao gồm các hành vi như truy vấn, cập nhật, chèn và xóa.
-   **Nhật ký luồng công việc**: Nhật ký thực thi của luồng công việc, bao gồm thời gian thực thi, thông tin vận hành, thông báo lỗi.