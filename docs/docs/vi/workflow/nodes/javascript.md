---
pkg: '@nocobase/plugin-workflow-javascript'
title: "Node Workflow - Script JavaScript"
description: "Node script JavaScript: thực thi script tùy chỉnh phía server, sử dụng biến phía trên, giá trị trả về cho phía dưới sử dụng."
keywords: "workflow,JavaScript,script,logic tùy chỉnh,script server,NocoBase"
---

# Script JavaScript

## Giới thiệu

Node script JavaScript cho phép người dùng thực thi một đoạn JavaScript phía server tùy chỉnh trong Workflow. Trong script có thể sử dụng biến phía trên quy trình làm tham số và có thể cung cấp giá trị trả về của script cho các Node phía dưới sử dụng.

Script sẽ chạy trong một worker thread được mở ở phía server của ứng dụng NocoBase, mặc định sử dụng sandbox bảo mật (isolated-vm) để chạy, không hỗ trợ `require` và API tích hợp sẵn của Node.js, xem chi tiết tại [Engine thực thi](#engine-thực-thi) và [Danh sách tính năng](#danh-sách-tính-năng).

## Tạo Node

Trong giao diện cấu hình Workflow, bấm nút dấu cộng ("+") trong quy trình để thêm Node "JavaScript":

![20241202203457](https://static-docs.nocobase.com/20241202203457.png)

## Cấu hình Node

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

### Tham số

Được dùng để truyền biến của ngữ cảnh quy trình hoặc giá trị tĩnh vào script để logic code trong script sử dụng. Trong đó `name` là tên tham số, sau khi truyền vào script sẽ trở thành tên biến. `value` là giá trị tham số, có thể chọn biến hoặc nhập hằng số.

### Nội dung script

Nội dung script có thể coi là một hàm, có thể viết bất kỳ code JavaScript nào được hỗ trợ trong môi trường Node.js và có thể sử dụng câu lệnh `return` để trả về một giá trị làm kết quả chạy của Node để các Node tiếp theo sử dụng làm biến.

Sau khi viết code có thể qua nút kiểm thử phía dưới ô soạn thảo để mở hộp thoại kiểm thử thực thi, điền giá trị tĩnh vào tham số để mô phỏng thực thi. Sau khi thực thi có thể thấy giá trị trả về và nội dung output (log) trong hộp thoại.

![20241202203833](https://static-docs.nocobase.com/20241202203833.png)

### Thiết lập timeout

Đơn vị tính bằng mili giây, khi đặt là `0` nghĩa là không đặt timeout.

### Tiếp tục quy trình sau lỗi

Sau khi chọn, khi script bị lỗi hoặc lỗi timeout vẫn sẽ thực thi các Node tiếp theo.

:::info{title="Mẹo"}
Sau khi script bị lỗi sẽ không có giá trị trả về, kết quả của Node sẽ được lấp đầy bằng thông tin lỗi. Nếu các Node tiếp theo sử dụng biến kết quả của Node script, cần xử lý cẩn thận.
:::

## Engine thực thi

Node script JavaScript hỗ trợ hai engine thực thi, tự động chuyển đổi qua việc biến môi trường `WORKFLOW_SCRIPT_MODULES` có được cấu hình hay không:

### Chế độ an toàn (mặc định)

Khi **không cấu hình** biến môi trường `WORKFLOW_SCRIPT_MODULES`, script sử dụng engine [isolated-vm](https://github.com/laverdet/isolated-vm) để thực thi. Engine này chạy code trong môi trường isolate V8 độc lập với các đặc điểm sau:

- **Không hỗ trợ** `require`, không thể import bất kỳ module nào
- **Không hỗ trợ** API tích hợp sẵn của Node.js (như `process`, `Buffer`, `global`...)
- Chỉ có thể sử dụng các đối tượng tích hợp sẵn tiêu chuẩn của ECMAScript (như `JSON`, `Math`, `Promise`, `Date`...)
- Hỗ trợ truyền dữ liệu qua tham số, hỗ trợ `console` xuất log, hỗ trợ `async`/`await`

Đây là chế độ mặc định được khuyến nghị, phù hợp với logic tính toán thuần và xử lý dữ liệu, cung cấp mức cách ly bảo mật cao nhất.

### Chế độ không an toàn (cần hỗ trợ module)

Khi **đã cấu hình** biến môi trường `WORKFLOW_SCRIPT_MODULES`, script chuyển sang engine `vm` tích hợp sẵn của Node.js để thực thi nhằm có khả năng `require`.

:::warning{title="Cảnh báo bảo mật"}
Ở chế độ không an toàn, mặc dù script chạy trong sandbox `vm` và đã giới hạn các module có thể sử dụng, nhưng module `vm` của Node.js không phải là cơ chế sandbox an toàn. Bật chế độ này có nghĩa là tin tưởng tất cả người dùng có quyền chỉnh sửa script Workflow. Admin cần tự đánh giá rủi ro bảo mật và quản lý nghiêm ngặt whitelist module và quyền chỉnh sửa Workflow.
:::

Sử dụng module trong script tương tự CommonJS, trong code sử dụng chỉ thị `require()` để import module.

Hỗ trợ module gốc của Node.js và module đã cài đặt trong `node_modules` (bao gồm các package phụ thuộc đã được NocoBase sử dụng). Module muốn cung cấp cho code sử dụng cần được khai báo trong biến môi trường ứng dụng `WORKFLOW_SCRIPT_MODULES`, nhiều tên package phân tách bằng dấu phẩy nửa cấp, ví dụ:

```ini
WORKFLOW_SCRIPT_MODULES=crypto,timers,lodash,dayjs
```

:::info{title="Mẹo"}
Module chưa được khai báo trong biến môi trường `WORKFLOW_SCRIPT_MODULES`, kể cả là module gốc của Node.js hay đã được cài đặt trong `node_modules`, đều **không thể** sử dụng trong script. Chiến lược này có thể được dùng để quản lý ở tầng vận hành danh sách module người dùng có thể sử dụng, tránh script có quyền quá cao trong một số tình huống.
:::

Trong môi trường triển khai không phải mã nguồn, nếu một module nào đó chưa được cài đặt trong node_modules, có thể cài đặt thủ công package cần thiết vào thư mục storage. Ví dụ khi cần sử dụng package `exceljs`, có thể thực hiện thao tác sau:

```shell
cd storage
npm i --no-save --no-package-lock --prefix . exceljs
```

Sau đó thêm package đó dựa trên CWD (thư mục làm việc hiện tại) của ứng dụng theo đường dẫn tương đối (hoặc tuyệt đối) vào biến môi trường `WORKFLOW_SCRIPT_MODULES`:

```ini
WORKFLOW_SCRIPT_MODULES=./storage/node_modules/exceljs
```

Như vậy có thể sử dụng package `exceljs` trong script (tên `require` cần hoàn toàn nhất quán với định nghĩa trong biến môi trường):

```js
const ExcelJS = require('./storage/node_modules/exceljs');
// ...
```

## Danh sách tính năng

### Phiên bản Node.js

Nhất quán với phiên bản Node.js mà ứng dụng chính đang chạy.

### Biến toàn cục

**Không hỗ trợ** các biến toàn cục như `global`, `process`, `__dirname` và `__filename`...

```js
console.log(global); // will throw error: "global is not defined"
```

### Tham số truyền vào

Tham số được cấu hình trong Node sẽ được dùng làm biến toàn cục trong script, có thể trực tiếp sử dụng. Tham số truyền vào script chỉ hỗ trợ kiểu cơ bản như `boolean`, `number`, `string`, `number`, `object` và mảng. Đối tượng `Date` sau khi truyền vào sẽ được chuyển thành chuỗi định dạng ISO. Các kiểu phức tạp khác không thể truyền trực tiếp như instance class tùy chỉnh...

### Giá trị trả về

Qua câu lệnh `return` có thể trả về dữ liệu kiểu cơ bản (cùng quy tắc với tham số) về Node làm kết quả. Nếu trong code không gọi câu lệnh `return` thì việc thực thi Node không có giá trị trả về.

```js
return 123;
```

### Output (log)

**Hỗ trợ** sử dụng `console` để xuất log.

```js
console.log('hello world!');
```

Khi Workflow thực thi, output của Node script cũng sẽ được ghi vào file log của Workflow tương ứng.

### Bất đồng bộ

**Hỗ trợ** sử dụng `async` để định nghĩa hàm bất đồng bộ và `await` để gọi hàm bất đồng bộ. **Hỗ trợ** sử dụng đối tượng toàn cục `Promise`.

```js
async function test() {
  return Promise.resolve(1);
}

const value = await test();
return value;
```

### Timer

Nếu cần sử dụng các phương thức `setTimeout`, `setInterval` hoặc `setImmediate`..., cần import qua package `timers` của Node.js (chỉ có thể dùng ở chế độ không an toàn).

```js
const { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } = require('timers');

async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

await sleep(1000);

return 123;
```
