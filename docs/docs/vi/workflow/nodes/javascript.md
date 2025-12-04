---
pkg: '@nocobase/plugin-workflow-javascript'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Tập lệnh JavaScript

## Giới thiệu

Nút Tập lệnh JavaScript cho phép người dùng thực thi một đoạn tập lệnh JavaScript tùy chỉnh phía máy chủ trong một **luồng công việc**. Tập lệnh có thể sử dụng các biến từ các bước trước đó trong **luồng công việc** làm tham số, và giá trị trả về của nó có thể được cung cấp cho các nút tiếp theo.

Tập lệnh chạy trong một luồng worker trên máy chủ ứng dụng NocoBase và hỗ trợ hầu hết các tính năng của Node.js. Tuy nhiên, vẫn có một số khác biệt so với môi trường thực thi gốc. Để biết chi tiết, vui lòng xem [Danh sách tính năng](#danh-sach-tinh-nang).

## Tạo nút

Trong giao diện cấu hình **luồng công việc**, nhấp vào nút dấu cộng (“+”) trong luồng để thêm nút "JavaScript":

![20241202203457](https://static-docs.nocobase.com/20241202203457.png)

## Cấu hình nút

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

### Tham số

Dùng để truyền các biến hoặc giá trị tĩnh từ ngữ cảnh của **luồng công việc** vào tập lệnh, phục vụ cho logic mã trong tập lệnh. Trong đó, `name` là tên tham số, sau khi được truyền vào tập lệnh sẽ trở thành tên biến. `value` là giá trị tham số, bạn có thể chọn một biến hoặc nhập một hằng số.

### Nội dung tập lệnh

Nội dung tập lệnh có thể được xem như một hàm. Bạn có thể viết bất kỳ mã JavaScript nào được hỗ trợ trong môi trường Node.js và sử dụng câu lệnh `return` để trả về một giá trị làm kết quả thực thi của nút, để các nút tiếp theo có thể sử dụng giá trị này như một biến.

Sau khi viết mã, bạn có thể nhấp vào nút kiểm tra bên dưới trình chỉnh sửa để mở hộp thoại thực thi kiểm tra. Tại đây, bạn điền các giá trị tĩnh vào tham số để mô phỏng quá trình thực thi. Sau khi thực thi, bạn có thể xem giá trị trả về và nội dung đầu ra (log) trong hộp thoại.

![20241202203833](https://static-docs.nocobase.com/20241202203833.png)

### Cài đặt thời gian chờ

Đơn vị tính bằng mili giây. Khi đặt là `0` có nghĩa là không cài đặt thời gian chờ.

### Tiếp tục luồng công việc khi có lỗi

Nếu chọn tùy chọn này, các nút tiếp theo vẫn sẽ được thực thi ngay cả khi tập lệnh gặp lỗi hoặc hết thời gian chờ.

:::info{title="Lưu ý"}
Nếu tập lệnh gặp lỗi, nó sẽ không có giá trị trả về, và kết quả của nút sẽ được điền bằng thông báo lỗi. Nếu các nút tiếp theo sử dụng biến kết quả từ nút tập lệnh, bạn cần xử lý cẩn thận.
:::

## Danh sách tính năng

### Phiên bản Node.js

Giống với phiên bản Node.js mà ứng dụng chính đang chạy.

### Hỗ trợ module

Các module có thể được sử dụng trong tập lệnh với một số giới hạn, tương tự như CommonJS, bằng cách sử dụng chỉ thị `require()` để nhập module.

Hỗ trợ các module gốc của Node.js và các module đã cài đặt trong `node_modules` (bao gồm các gói phụ thuộc mà NocoBase đã sử dụng). Các module cần được cung cấp cho mã phải được khai báo trong biến môi trường `WORKFLOW_SCRIPT_MODULES` của ứng dụng, với nhiều tên gói được phân tách bằng dấu phẩy, ví dụ:

```ini
WORKFLOW_SCRIPT_MODULES=crypto,timers,lodash,dayjs
```

:::info{title="Lưu ý"}
Các module không được khai báo trong biến môi trường `WORKFLOW_SCRIPT_MODULES`, ngay cả khi chúng là module gốc của Node.js hoặc đã được cài đặt trong `node_modules`, cũng **không thể** được sử dụng trong tập lệnh. Chính sách này có thể được dùng ở cấp độ vận hành để kiểm soát danh sách các module mà người dùng có thể sử dụng, tránh việc tập lệnh có quyền hạn quá cao trong một số trường hợp.
:::

Trong môi trường không triển khai từ mã nguồn, nếu một module chưa được cài đặt trong `node_modules`, bạn có thể cài đặt thủ công gói cần thiết vào thư mục `storage`. Ví dụ, khi cần sử dụng gói `exceljs`, bạn có thể thực hiện các bước sau:

```shell
cd storage
npm i --no-save --no-package-lock --prefix . exceljs
```

Sau đó, thêm đường dẫn tương đối (hoặc tuyệt đối) của gói dựa trên CWD (thư mục làm việc hiện tại) của ứng dụng vào biến môi trường `WORKFLOW_SCRIPT_MODULES`:

```ini
WORKFLOW_SCRIPT_MODULES=./storage/node_modules/exceljs
```

Sau đó, bạn có thể sử dụng gói `exceljs` trong tập lệnh của mình:

```js
const ExcelJS = require('exceljs');
// ...
```

### Biến toàn cục

**Không hỗ trợ** các biến toàn cục như `global`, `process`, `__dirname` và `__filename`.

```js
console.log(global); // will throw error: "global is not defined"
```

### Tham số đầu vào

Các tham số được cấu hình trong nút sẽ trở thành biến toàn cục trong tập lệnh và có thể được sử dụng trực tiếp. Các tham số truyền vào tập lệnh chỉ hỗ trợ các kiểu dữ liệu cơ bản, như `boolean`, `number`, `string`, `object` và mảng. Đối tượng `Date` khi được truyền vào sẽ được chuyển đổi thành chuỗi định dạng ISO. Các kiểu phức tạp khác, như các thể hiện của lớp tùy chỉnh, không thể truyền trực tiếp.

### Giá trị trả về

Bạn có thể sử dụng câu lệnh `return` để trả về dữ liệu kiểu cơ bản (theo cùng quy tắc với tham số) về nút làm kết quả. Nếu không có câu lệnh `return` nào được gọi trong mã, quá trình thực thi nút sẽ không có giá trị trả về.

```js
return 123;
```

### Đầu ra (Log)

**Hỗ trợ** sử dụng `console` để xuất log.

```js
console.log('hello world!');
```

Khi **luồng công việc** được thực thi, đầu ra của nút tập lệnh cũng sẽ được ghi vào tệp log của **luồng công việc** tương ứng.

### Bất đồng bộ

**Hỗ trợ** sử dụng `async` để định nghĩa các hàm bất đồng bộ và `await` để gọi chúng. **Hỗ trợ** sử dụng đối tượng toàn cục `Promise`.

```js
async function test() {
  return Promise.resolve(1);
}

const value = await test();
return value;
```

### Bộ hẹn giờ

Để sử dụng các phương thức như `setTimeout`, `setInterval` hoặc `setImmediate`, bạn cần nhập chúng từ gói `timers` của Node.js.

```js
const { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } = require('timers');

async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

await sleep(1000);

return 123;
```