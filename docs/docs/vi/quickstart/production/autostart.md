---
title: "Ứng dụng tự động khởi động"
description: "Sử dụng tính năng tự động khởi động ứng dụng nb để định cấu hình mục nhập tự động khởi động ứng dụng hợp nhất cho NocoBase env được lưu trữ trên CLI."
keywords: "NocoBase, tự động khởi động ứng dụng, tự động khởi động ứng dụng nb, systemd, Docker, PM2"
---


# Ứng dụng tự động khởi động

Trong NocoBase CLI, `nb app autostart` được sử dụng để quản lý "env nào được phép khởi động tự động" và "cách kéo các env này lên một cách thống nhất sau khi hệ thống khởi động."

Nếu bạn định chạy chính thức một ứng dụng được lưu trữ trên máy chủ CLI thì đây thường là bước mặc định trong môi trường sản xuất.

## Tại sao vẫn cần `nb app autostart`?

Vấn đề này là rất phổ biến.

Khi nhiều người nhìn thấy điều này lần đầu tiên, họ sẽ nghĩ rằng vì lớp dưới cùng đã có Docker, PM2 hoặc bản thân hệ thống đã có `systemd`, tại sao chúng ta lại cần một lớp `nb app autostart` khác.

Lý do là các lớp này không thực sự giải quyết được cùng một vấn đề:

- Các khả năng như Docker, PM2 và Giám sát giải quyết vấn đề "các ứng dụng thường chạy như thế nào và cách quản lý các quy trình ứng dụng".
- Các khả năng như `systemd`, `launchd` và tập lệnh khởi động máy chủ giải quyết vấn đề "chạy lệnh nào khi hệ thống khởi động?"
- `nb app autostart` giải quyết vấn đề "ở cấp độ NocoBase CLI, cách quản lý thống nhất những env nào được phép khởi động tự động và cách kéo chúng lên sau khi hệ thống khởi động"

Nói cách khác, CLI không loại bỏ nhu cầu về Docker, PM2 hoặc Người giám sát. Thay vào đó, nó điều chỉnh các phương pháp quản lý quy trình khác nhau theo cách thống nhất, sau đó hội tụ chúng thành một bộ cổng quản lý tự khởi động ổn định để giảm bớt bệnh tâm thần của người dùng.

Khi hệ thống khởi động lớp này, nó tiếp tục được chuyển giao cho `systemd`, `launchd` hoặc tập lệnh khởi động máy chủ. Họ có trách nhiệm thực thi khi máy khởi động:

```bash
nb app autostart run
```

Lệnh này sau đó sẽ hiển thị tất cả các ứng dụng đã bật tính năng tự động khởi động.

Nếu không có lớp này, khi phương thức hoạt động cơ bản khác nhau, bạn cần nhớ cấu hình tự khởi động và quy trình khôi phục tương ứng của Docker, PM2 hoặc các phương thức khác. Sau khi thêm `nb app autostart`, bạn chỉ cần tiếp tục ghi nhớ tập thói quen sử dụng NocoBase CLI tương tự.

Nếu bạn muốn biết lý do tại sao thiết kế này được chia nhỏ theo cách này trước tiên, hãy tiếp tục đọc [ý định thiết kế ứng dụng nb](../cli-design/nb-app-design-intent.md#Tại sao vẫn cần-nb-app-autostart).

## Trách nhiệm của nhóm lệnh này là gì?

Những cái được sử dụng phổ biến nhất là:

- `nb app autostart enable`
- `nb app autostart disable`
- `nb app autostart list`
- `nb app autostart run`

Nếu chỉ nhìn vào hai cấp độ trách nhiệm phổ biến nhất, bạn có thể hiểu nó như thế này:

- `enable` / `disable` chịu trách nhiệm quản lý xem một env nào đó có cho phép khởi động tự động hay không
- `run` chịu trách nhiệm lấy tất cả các env đã kích hoạt tính năng tự khởi động trong giai đoạn khởi động hệ thống.

Trước tiên hãy bật cờ tự động khởi động cho env hiện tại:

```bash
nb app autostart enable
```

Nếu bạn muốn thao tác trên một cái gì đó khác với env hiện tại, bạn có thể chỉ định nó một cách rõ ràng:

```bash
nb app autostart enable --env app1 --yes
```

Sau khi kích hoạt nó, bạn có thể kiểm tra xem env nào đã được đánh dấu là tự khởi động:

```bash
nb app autostart list
```

Sau khi hệ thống khởi động, bạn cần thực hiện lệnh sau để lấy tất cả các env đã bật tính năng tự động khởi động:

```bash
nb app autostart run
```

Nếu bạn muốn xem kết quả khởi động cơ bản khi khắc phục sự cố, bạn có thể thêm:

```bash
nb app autostart run --verbose
```

Nếu bạn không muốn khởi động env với hệ thống nữa, bạn cũng có thể hủy dấu này:

```bash
nb app autostart disable --env app1 --yes
```

## Mối quan hệ của nó với Docker, PM2 và systemd là gì?

Có một ranh giới ở đây có thể dễ dàng bị nhầm lẫn.

`nb app` Lớp này giải quyết vấn đề "ứng dụng chạy như thế nào". Lớp dưới cùng có thể thích ứng với các phương thức chạy khác nhau, chẳng hạn như Docker và PM2, đồng thời có thể tiếp tục được mở rộng trong tương lai.

`nb app autostart` Lớp này giải quyết vấn đề "làm thế nào để kéo env cho phép tự động khởi động sau khi khởi động máy." Nó giống như cung cấp một điểm vào ổn định cho cơ chế khởi động máy chủ hơn là thay thế một công cụ quản lý quy trình cụ thể.

nói cách khác:

- Các khả năng như Docker, PM2 và Giám sát gần hơn với cách ứng dụng chạy
- `systemd`, `launchd`, tập lệnh khởi động máy chủ, gần với lớp khởi động hệ thống hơn

Đây là lý do tại sao trong môi trường chính thức, bạn thường cần kết nối `nb app autostart run` với quy trình khởi động hệ thống của riêng mình, chẳng hạn như `systemd`, `launchd`, tập lệnh khởi động nền tảng vùng chứa hoặc các cơ chế tự động khởi động máy chủ khác mà bạn đang sử dụng.

##Phạm vi áp dụng

`nb app autostart` chỉ áp dụng cho env có thời gian chạy được quản lý CLI, nghĩa là:

- `local`
- `docker`

Nếu env này chỉ là kết nối API từ xa hoặc không phải là ứng dụng chạy dưới sự quản lý CLI trên máy hiện tại thì bộ lệnh này không phù hợp để tự khởi động.

##Thực hành mặc định

Trong hầu hết các trường hợp, trình tự sau là đủ:

1. Trước tiên hãy xác nhận rằng ứng dụng có thể khởi động bình thường trên máy hiện tại
2. Thực thi `nb app autostart enable --env <name> --yes`
3. Kết nối `nb app autostart run` với hệ thống để bắt đầu quá trình
4. Khởi động lại máy hoặc thực hiện thủ công `run` để xác minh xem máy có phục hồi bình thường hay không.

Nếu bạn vẫn cần định cấu hình lớp mục nhập sản xuất tiếp theo, hãy tiếp tục xem [reverse proxy](./reverse-proxy/index.md).

## Các lệnh liên quan

```bash
nb app autostart enable --env app1 --yes
nb app autostart disable --env app1 --yes
nb app autostart list
nb app autostart run
nb app autostart run --verbose
```

## Các liên kết liên quan

- [Tổng quan về triển khai môi trường sản xuất](./index.md)
- [Proxy ngược](./reverse-proxy/index.md)
- [ý định thiết kế ứng dụng nb](../cli-design/nb-app-design-intent.md)
- [Quản lý ứng dụng](../Operations/manage-app.md)
