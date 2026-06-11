# ý định thiết kế ứng dụng nb

Các lệnh liên quan đến `nb app` về cơ bản là những điều chỉnh dựa trên các phương pháp quản lý quy trình khác nhau, sau đó hợp nhất thành một tập hợp các cổng quản lý ứng dụng ổn định. Mục đích của việc này là cố gắng tập trung việc sử dụng trí óc trong quá trình vận hành và bảo trì hàng ngày vào một tập hợp các lệnh.

Hiện nay, các phương pháp quản lý quy trình ứng dụng được CLI hỗ trợ chủ yếu bao gồm:

- Docker
-PM2

Nếu chúng tôi cần hỗ trợ nhiều phương pháp hơn trong tương lai, chẳng hạn như Người giám sát, chúng tôi sẽ tiếp tục thực hiện các điều chỉnh ở lớp này. Cổng ra lệnh tần số cao tiếp xúc với thế giới bên ngoài vẫn được giữ nguyên:

```bash
nb app start
nb app restart
nb app logs
nb app upgrade
nb app stop
```

## Tại sao phải hợp nhất thành `nb app`

Quản lý quy trình có thể được thực hiện theo nhiều cách, nhưng đối với hầu hết người dùng, điều họ thực sự quan tâm không phải là những gì được sử dụng ở lớp dưới cùng mà là các hành động cụ thể như "Tôi muốn khởi động ứng dụng", "Tôi muốn đọc nhật ký" và "Tôi muốn nâng cấp ứng dụng".

Nếu sự khác biệt cơ bản được bộc lộ trực tiếp, trước tiên người dùng cần xác định chế độ vận hành nào họ hiện đang sử dụng, sau đó ghi nhớ bộ phương thức vận hành tương ứng. Sau khi được hợp nhất thành `nb app`, những hành động tần suất cao này có thể hội tụ thành một tập hợp các lối vào ổn định.

###Giảm chi phí học tập

Các giải pháp quản lý quy trình khác nhau hoạt động theo những cách khác nhau:

- Docker có hệ thống lệnh của Docker
- PM2 có hệ thống lệnh PM2
- Người giám sát cũng có phương pháp cấu hình riêng

Nếu những khác biệt này được bộc lộ trực tiếp, người dùng sẽ cần tìm hiểu nhiều phương pháp sử dụng và sẽ dễ dàng bỏ lỡ các bước chính trong các tình huống thường xuyên xảy ra như nâng cấp, khởi động lại và khắc phục sự cố nhật ký.

Sau khi hợp nhất thành `nb app`, hầu hết việc quản lý hàng ngày chỉ yêu cầu nắm vững một bộ lệnh.

### Thống nhất quy trình kinh doanh

Quản lý vòng đời ứng dụng không chỉ là quản lý quy trình.

Trong các quy trình như khởi động, nâng cấp và dừng, CLI thường cần xử lý logic bổ sung, chẳng hạn như:

- Kiểm tra môi trường
- Xử lý cấu hình
- Di chuyển dữ liệu
- Nâng cấp phiên bản
- Quản lý nhật ký

Bằng cách sử dụng `nb app` làm lối vào thống nhất, bạn có thể đảm bảo rằng hoạt động của các quy trình này là nhất quán. Nếu bạn tiếp tục mở rộng khả năng của mình trong tương lai, bạn không cần phải học lại lối vào vận hành và bảo trì mới.

## Tại sao vẫn cần `nb app autostart`?

Sau khi có lối vào quản lý quy trình thống nhất, một lớp khả năng "quản lý tự khởi động" khác cần được thêm vào để hoàn tất toàn bộ quy trình. Đây là lý do tại sao `nb app autostart` tồn tại.

Cách sử dụng phổ biến là:

```bash
# 为当前 env 开启自启动
nb app autostart enable

# 为指定 env 开启自启动
nb app autostart enable --env app1

# 查看自启动状态
nb app autostart list

# 启动所有已开启自启动的 env
nb app autostart run

# 启动时显示底层启动输出
nb app autostart run --verbose
```

Trọng tâm của bộ mệnh lệnh này là tiếp tục duy trì sự thống nhất từ ​​bên ngoài. Nói cách khác, trong suy nghĩ của người dùng ở lớp `nb app` này, bạn không cần quan tâm liệu lớp dưới cùng là Docker, PM2 hay các phương thức khác có thể được hỗ trợ trong tương lai. Phương thức hoạt động thống nhất bên ngoài vẫn tương tự như:

```bash
nb app autostart enable --env app1
nb app autostart disable --env app1
```

### `run` Lớp này thích ứng với điều gì?

`nb app autostart` cũng được chia thành hai cấp độ trách nhiệm:

- `enable` / `disable` chịu trách nhiệm quản lý xem một env nào đó có cho phép khởi động tự động hay không
- `run` chịu trách nhiệm lấy tất cả các env đã kích hoạt tính năng tự khởi động trong giai đoạn khởi động hệ thống.

Nói cách khác, CLI cũng sẽ cung cấp mục nhập `run` thống nhất để cung cấp quyền truy cập vào cơ chế tự khởi động của hệ thống:

```bash
nb app autostart run
```

Những gì được điều chỉnh ở đây là các cơ chế khởi động hệ thống như `systemd`, `launchd` và các tập lệnh khởi động máy chủ chứ không phải các trình quản lý quy trình ứng dụng như Người giám sát.

## Tổng thể

- Các lệnh liên quan đến `nb app` về cơ bản là một lớp thích ứng bên trên các phương pháp quản lý quy trình khác nhau. Sau khi được thống nhất từ ​​bên ngoài, chúng có thể làm giảm sự nhầm lẫn về tinh thần của người dùng.
- Việc thực hiện quản lý quy trình có thể là Docker, PM2, Giám sát viên, v.v. Hiện tại, Docker và PM2 được hỗ trợ
- Vì cấu hình tự khởi động của các phương pháp quản lý quy trình khác nhau là khác nhau nên cần có một bộ khả năng `nb app autostart` thống nhất để toàn bộ quy trình hoàn tất.

Nếu bạn muốn tiếp tục xem các hoạt động hàng ngày, bạn có thể truy cập trực tiếp vào [Quản lý ứng dụng](../operations/manage-app.md). Nếu bạn đã sẵn sàng triển khai ứng dụng vào môi trường chính thức, bạn có thể tiếp tục xem [Triển khai môi trường sản xuất](../production/index.md).
