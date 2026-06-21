---
pkg: "@nocobase/preset-cluster"
title: "Tách dịch vụ"
description: "Trong chế độ Cluster tách các dịch vụ tốn thời gian như workflow, async task vào các node độc lập, cấu hình node request và node task qua WORKER_MODE, hỗ trợ scale ngang và cô lập tài nguyên."
keywords: "Tách dịch vụ,WORKER_MODE,async workflow,async-task,scale ngang,node request,node task,triển khai cluster,NocoBase"
---

# Tách dịch vụ <Badge>v1.9.0+</Badge>

## Giới thiệu

Thông thường, tất cả các dịch vụ của ứng dụng NocoBase chạy trong cùng một instance Node.js. Khi các tính năng trong ứng dụng dần trở nên phức tạp theo nghiệp vụ, một số dịch vụ tốn thời gian có thể ảnh hưởng đến hiệu năng tổng thể.

Để nâng cao hiệu năng của ứng dụng, NocoBase hỗ trợ tách các dịch vụ của ứng dụng vào các node khác nhau để chạy trong chế độ Cluster, để tránh vấn đề hiệu năng của một dịch vụ ảnh hưởng đến toàn bộ ứng dụng, dẫn đến không thể phản hồi request người dùng bình thường.

Mặt khác cũng có thể scale ngang một số dịch vụ cụ thể, nâng cao hiệu quả sử dụng tài nguyên của cluster.

NocoBase khi triển khai cluster có thể tách triển khai các dịch vụ khác nhau vào các node khác nhau để chạy. Hình dưới đây minh họa cấu trúc tách:

![20250803214857](https://static-docs.nocobase.com/20250803214857.png)

## Các dịch vụ có thể tách

### Async Workflow

**Service KEY**: `workflow:process`

Workflow ở chế độ async, sau khi được kích hoạt sẽ vào hàng đợi để thực thi. Loại workflow này có thể được xem như tác vụ background, thông thường không cần người dùng đợi kết quả trả về. Đặc biệt với các quy trình phức tạp và tốn thời gian, khi lượng kích hoạt cũng lớn, khuyến nghị tách chúng vào node độc lập để chạy.

### Các tác vụ async cấp người dùng khác

**Service KEY**: `async-task:process`

Bao gồm các tác vụ được tạo bởi thao tác người dùng như import, export async. Khi lượng dữ liệu lớn hoặc concurrent nhiều, khuyến nghị tách chúng vào node độc lập để chạy.

## Cách tách dịch vụ

Tách các dịch vụ khác nhau vào các node khác nhau cần thực hiện thông qua cấu hình biến môi trường `WORKER_MODE`. Biến môi trường này có thể được cấu hình theo các quy tắc sau:

- `WORKER_MODE=<rỗng>`: Chưa cấu hình hoặc cấu hình rỗng, chế độ làm việc giống với single-instance hiện tại, nhận tất cả request và xử lý tất cả tác vụ. Tương thích với các ứng dụng chưa cấu hình trước đó.
- `WORKER_MODE=!`: Chế độ làm việc chỉ xử lý request, không xử lý bất kỳ tác vụ nào.
- `WORKER_MODE=workflow:process,async-task:process`: Cấu hình thành một hoặc nhiều service identifier (phân tách bằng dấu phẩy), chế độ làm việc chỉ xử lý các tác vụ của identifier đó, không xử lý request.
- `WORKER_MODE=*`: Chế độ làm việc xử lý tất cả các tác vụ background, không phân module, nhưng không xử lý request.
- `WORKER_MODE=!,workflow:process`: Chế độ làm việc xử lý request, đồng thời chỉ xử lý các tác vụ của một identifier nào đó.
- `WORKER_MODE=-`: Chế độ làm việc không xử lý bất kỳ request và tác vụ nào (cần chế độ này trong process worker).

Ví dụ trong môi trường K8S, có thể sử dụng cùng cấu hình biến môi trường cho các node có cùng tính năng tách, để dễ dàng scale ngang một loại dịch vụ nào đó.

## Ví dụ cấu hình

### Nhiều node xử lý riêng biệt

Giả sử có ba node là `node1`, `node2` và `node3`, có thể cấu hình như sau:

- `node1`: Chỉ xử lý request UI người dùng, cấu hình `WORKER_MODE=!`.
- `node2`: Chỉ xử lý tác vụ workflow, cấu hình `WORKER_MODE=workflow:process`.
- `node3`: Chỉ xử lý tác vụ async, cấu hình `WORKER_MODE=async-task:process`.

### Nhiều node xử lý hỗn hợp

Giả sử có bốn node là `node1`, `node2`, `node3` và `node4`, có thể cấu hình như sau:

- `node1` và `node2`: Xử lý tất cả request thông thường, cấu hình `WORKER_MODE=!`, load balancer sẽ tự động phân phối request đến hai node này.
- `node3` và `node4`: Xử lý tất cả các tác vụ background khác, cấu hình `WORKER_MODE=*`.

## Tài liệu phát triển

Khi phát triển plugin nghiệp vụ, có thể tách các dịch vụ tiêu thụ tài nguyên lớn dựa trên tình huống nhu cầu. Có thể thực hiện theo cách sau:

1. Định nghĩa một service identifier mới, ví dụ `my-plugin:process`, dùng cho cấu hình biến môi trường và cung cấp tài liệu mô tả.
2. Trong tính năng nghiệp vụ phía server của plugin, sử dụng interface `serving()` để kiểm tra môi trường, quyết định xem biến môi trường có điều khiển node hiện tại cung cấp một dịch vụ nào đó hay không.

```javascript
import { serving } from '@nocobase/server';

const MY_PLUGIN_SERVICE_KEY = 'my-plugin:process';
// Trong code phía server của plugin
if (serving(MY_PLUGIN_SERVICE_KEY)) {
  // Xử lý logic nghiệp vụ của dịch vụ này
} else {
  // Không xử lý logic nghiệp vụ của dịch vụ này
}
```
