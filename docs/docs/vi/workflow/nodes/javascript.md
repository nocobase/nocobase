---
pkg: '@nocobase/plugin-workflow-javascript'
---

:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/workflow/nodes/javascript).
:::

# Kịch bản JavaScript

## Giới thiệu

Nút kịch bản JavaScript cho phép người dùng thực thi một đoạn kịch bản JavaScript tùy chỉnh phía máy chủ trong luồng công việc. Kịch bản có thể sử dụng các biến từ thượng nguồn của quy trình làm tham số và có thể cung cấp giá trị trả về của kịch bản cho các nút hạ nguồn sử dụng.

Kịch bản sẽ được thực thi trong một luồng công việc (worker thread) trên phía máy chủ của ứng dụng NocoBase và hỗ trợ hầu hết các tính năng của Node.js, nhưng vẫn có một số khác biệt so với môi trường thực thi gốc, chi tiết xem tại [Danh sách đặc tính](#danh-sách-đặc-tính).

## Tạo nút

Trong giao diện cấu hình luồng công việc, nhấp vào nút dấu cộng (“+”) trong quy trình để thêm nút “JavaScript”:

![20241202203457](https://static-docs.nocobase.com/20241202203457.png)

## Cấu hình nút

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

### Tham số

Dùng để truyền các biến hoặc giá trị tĩnh từ ngữ cảnh quy trình vào kịch bản để logic mã trong kịch bản sử dụng. Trong đó `name` là tên tham số, sau khi truyền vào kịch bản sẽ đóng vai trò là tên biến. `value` là giá trị tham số, có thể chọn biến hoặc nhập hằng số.

### Nội dung kịch bản

Nội dung kịch bản có thể được xem như một hàm, có thể viết bất kỳ mã JavaScript nào được hỗ trợ trong môi trường Node.js và có thể sử dụng câu lệnh `return` để trả về một giá trị làm kết quả chạy của nút, nhằm cung cấp cho các nút tiếp theo sử dụng như một biến.

Sau khi viết mã, bạn có thể thông qua nút kiểm tra bên dưới khung chỉnh sửa để mở hộp thoại thực thi kiểm tra, điền giá trị tĩnh vào tham số để mô phỏng thực thi. Sau khi thực thi, bạn có thể thấy giá trị trả về và nội dung đầu ra (nhật ký) trong hộp thoại.

![20241202203833](https://static-docs.nocobase.com/20241202203833.png)

### Cài đặt thời gian chờ

Đơn vị tính bằng mili giây, khi thiết lập là `0` có nghĩa là không thiết lập thời gian chờ.

### Tiếp tục luồng công việc sau khi lỗi

Sau khi chọn, nếu kịch bản bị lỗi hoặc lỗi do quá thời gian chờ, các nút tiếp theo vẫn sẽ được thực thi.

:::info{title="Gợi ý"}
Sau khi kịch bản bị lỗi sẽ không có giá trị trả về, kết quả của nút sẽ được điền bằng thông tin lỗi. Nếu các nút tiếp theo sử dụng biến kết quả của nút kịch bản, cần xử lý thận trọng.
:::

## Danh sách đặc tính

### Phiên bản Node.js

Nhất quán với phiên bản Node.js mà ứng dụng chính đang chạy.

### Hỗ trợ mô-đun

Trong kịch bản có thể sử dụng mô-đun một cách hạn chế, nhất quán với CommonJS, sử dụng chỉ thị `require()` trong mã để nhập mô-đun.

Hỗ trợ các mô-đun gốc của Node.js và các mô-đun đã được cài đặt trong `node_modules` (bao gồm các gói phụ thuộc mà NocoBase đã sử dụng). Các mô-đun muốn cung cấp cho mã sử dụng cần được khai báo trong biến môi trường ứng dụng `WORKFLOW_SCRIPT_MODULES`, nhiều tên gói được phân tách bằng dấu phẩy nửa chiều rộng, ví dụ:

```ini
WORKFLOW_SCRIPT_MODULES=crypto,timers,lodash,dayjs
```

:::info{title="Gợi ý"}
Các mô-đun chưa được khai báo trong biến môi trường `WORKFLOW_SCRIPT_MODULES`, ngay cả khi là mô-đun gốc của Node.js hoặc đã được cài đặt trong `node_modules`, cũng **không thể** sử dụng trong kịch bản. Chiến lược này có thể được sử dụng để kiểm soát danh sách các mô-đun mà người dùng có thể sử dụng ở tầng vận hành, tránh việc kịch bản có quyền hạn quá cao trong một số tình huống.
:::

Trong môi trường không triển khai bằng mã nguồn, nếu một mô-đun nào đó chưa được cài đặt trong `node_modules`, bạn có thể cài đặt thủ công gói cần thiết vào thư mục `storage`. Ví dụ khi cần sử dụng gói `exceljs`, có thể thực hiện các thao tác sau:

```shell
cd storage
npm i --no-save --no-package-lock --prefix . exceljs
```

Sau đó thêm đường dẫn tương đối (hoặc tuyệt đối) của gói đó dựa trên CWD (thư mục làm việc hiện tại) của ứng dụng vào biến môi trường `WORKFLOW_SCRIPT_MODULES`:

```ini
WORKFLOW_SCRIPT_MODULES=./storage/node_modules/exceljs
```

Là có thể sử dụng gói `exceljs` trong kịch bản (tên của `require` cần phải hoàn toàn nhất quán với tên được định nghĩa trong biến môi trường):

```js
const ExcelJS = require('./storage/node_modules/exceljs');
// ...
```

### Biến toàn cục

**Không hỗ trợ** các biến toàn cục như `global`, `process`, `__dirname` và `__filename`.

```js
console.log(global); // will throw error: "global is not defined"
```

### Tham số truyền vào

Các tham số được cấu hình trong nút sẽ đóng vai trò là biến toàn cục trong kịch bản, có thể sử dụng trực tiếp. Tham số truyền vào kịch bản chỉ hỗ trợ các kiểu cơ bản như `boolean`, `number`, `string`, `object` và mảng. Đối tượng `Date` sau khi truyền vào sẽ được chuyển đổi thành chuỗi dựa trên định dạng ISO. Các kiểu phức tạp khác không thể truyền trực tiếp, chẳng hạn như các thực thể của lớp tùy chỉnh.

### Giá trị trả về

Thông qua câu lệnh `return` có thể trả về dữ liệu kiểu cơ bản (cùng quy tắc với tham số) về nút làm kết quả. Nếu trong mã không gọi câu lệnh `return`, thì việc thực thi nút sẽ không có giá trị trả về.

```js
return 123;
```

### Đầu ra (Nhật ký)

**Hỗ trợ** sử dụng `console` để xuất nhật ký.

```js
console.log('hello world!');
```

Khi luồng công việc thực thi, đầu ra của nút kịch bản cũng sẽ được ghi lại vào tệp nhật ký của luồng công việc tương ứng.

### Bất đồng bộ

**Hỗ trợ** sử dụng `async` để định nghĩa hàm bất đồng bộ, cũng như `await` để gọi hàm bất đồng bộ. **Hỗ trợ** sử dụng đối tượng toàn cục `Promise`.

```js
async function test() {
  return Promise.resolve(1);
}

const value = await test();
return value;
```

### Bộ hẹn giờ

Nếu cần sử dụng các phương thức như `setTimeout`, `setInterval` hoặc `setImmediate`, cần nhập thông qua gói `timers` của Node.js.

```js
const { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } = require('timers');

async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

await sleep(1000);

return 123;
```