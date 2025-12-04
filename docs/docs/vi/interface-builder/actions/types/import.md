---
pkg: "@nocobase/plugin-action-import"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Nhập dữ liệu

## Giới thiệu

Bạn có thể nhập dữ liệu bằng mẫu Excel. Hệ thống cho phép bạn cấu hình các trường cần nhập và tự động tạo mẫu.

![20251029165818](https://static-docs.nocobase.com/20251029165818.png)

## Hướng dẫn nhập dữ liệu

### Trường kiểu Số

Hỗ trợ các giá trị số và phần trăm. Các văn bản như `N/A` hoặc `-` sẽ được lọc bỏ.

| Số 1 | Phần trăm | Số 2 | Số 3 |
| ----- | ------ | ----- | ----- |
| 123   | 25%    | N/A   | -     |

Sau khi chuyển đổi sang JSON:

```ts
{
  "Số 1": 123,
  "Phần trăm": 0.25,
  "Số 2": null,
  "Số 3": null,
}
```

### Trường kiểu Boolean

Văn bản đầu vào được hỗ trợ (tiếng Anh không phân biệt chữ hoa/thường):

- `Yes`, `Y`, `True`, `1`, `是`
- `No`, `N`, `False`, `0`, `否`

| Trường 1 | Trường 2 | Trường 3 | Trường 4 | Trường 5 |
| ----- | ----- | ----- | ----- | ----- |
| 否    | 是    | Y     | true  | 0     |

Sau khi chuyển đổi sang JSON:

```ts
{
  "Trường 1": false,
  "Trường 2": true,
  "Trường 3": true,
  "Trường 4": true,
  "Trường 5": false,
}
```

### Trường kiểu Ngày

| DateOnly            | Local(+08:00)       | GMT                 |
| ------------------- | ------------------- | ------------------- |
| 2023-01-18 22:22:22 | 2023-01-18 22:22:22 | 2023-01-18 22:22:22 |

Sau khi chuyển đổi sang JSON:

```ts
{
  "DateOnly": "2023-01-18T00:00:00.000Z",
  "Local(+08:00)": "2023-01-18T14:22:22.000Z",
  "GMT": "2023-01-18T22:22:22.000Z",
}
```

### Trường kiểu Chọn

Bạn có thể sử dụng cả giá trị tùy chọn và nhãn tùy chọn làm văn bản nhập. Khi có nhiều tùy chọn, chúng được phân tách bằng dấu phẩy (`,` `，`) hoặc dấu chấm phẩy (`、`).

Ví dụ, các tùy chọn cho trường `Ưu tiên` bao gồm:

| Giá trị tùy chọn | Nhãn tùy chọn |
| ------ | -------- |
| low    | Thấp       |
| medium | Trung bình |
| high   | Cao        |

Cả giá trị tùy chọn và nhãn tùy chọn đều có thể dùng làm văn bản nhập.

| Ưu tiên |
| ------ |
| Cao     |
| low    |

Sau khi chuyển đổi sang JSON:

```ts
[{ Ưu tiên: 'high' }, { Ưu tiên: 'low' }];
```

### Trường Khu vực hành chính Trung Quốc

| Khu vực 1         | Khu vực 2         |
| ------------- | ------------- |
| 北京市/市辖区 | 天津市/市辖区 |

Sau khi chuyển đổi sang JSON:

```ts
{
  "Khu vực 1": ["11","1101"],
  "Khu vực 2": ["12","1201"]
}
```

### Trường Tệp đính kèm

| Tệp đính kèm                                     |
| ---------------------------------------- |
| https://www.nocobase.com/images/logo.png |

Sau khi chuyển đổi sang JSON:

```ts
{
  "Tệp đính kèm": [
    {
      "filename": "logo.png",
      "title": "logo.png",
      "extname": ".png",
      "url": "https://www.nocobase.com/images/logo.png"
    }
  ]
}
```

### Trường kiểu Quan hệ

Nhiều mục dữ liệu được phân tách bằng dấu phẩy (`,` `，`) hoặc dấu chấm phẩy (`、`).

| Phòng ban/Tên | Danh mục/Tiêu đề    |
| --------- | ------------ |
| Nhóm Phát triển    | Danh mục 1、Danh mục 2 |

Sau khi chuyển đổi sang JSON:

```ts
{
  "Phòng ban": [1], // 1 là ID bản ghi của phòng ban có tên "Nhóm Phát triển"
  "Danh mục": [1,2], // 1,2 là ID bản ghi của các danh mục có tiêu đề "Danh mục 1" và "Danh mục 2"
}
```

### Trường kiểu JSON

| JSON1           |
| --------------- |
| {"key":"value"} |

Sau khi chuyển đổi sang JSON:

```ts
{
  "JSON": {"key":"value"}
}
```

### Trường kiểu Hình học bản đồ

| Point | Line        | Polygon           | Circle |
| ----- | ----------- | ----------------- | ------ |
| 1,2   | (1,2),(3,4) | (1,2),(3,4),(1,2) | 1,2,3  |

Sau khi chuyển đổi sang JSON:

```ts
{
  "Point": [1,2],
  "Line": [[1,2], [3,4]],
  "Polygon": [[1,2], [3,4], [1,2]],
  "Circle": [1,2,3]
}
```

## Định dạng nhập dữ liệu tùy chỉnh

Đăng ký một `ValueParser` tùy chỉnh thông qua phương thức `db.registerFieldValueParsers()`, ví dụ:

```ts
import { BaseValueParser } from '@nocobase/database';

class PointValueParser extends BaseValueParser {
  async setValue(value) {
    if (Array.isArray(value)) {
      this.value = value;
    } else if (typeof value === 'string') {
      this.value = value.split(',');
    } else {
      this.errors.push('Value invalid');
    }
  }
}

const db = new Database();

// Khi nhập trường có type=point, dữ liệu sẽ được phân tích bởi PointValueParser
db.registerFieldValueParsers({
  point: PointValueParser,
});
```

Ví dụ nhập dữ liệu

| Point |
| ----- |
| 1,2   |

Sau khi chuyển đổi sang JSON:

```ts
{
  "Point": [1,2]
}
```

## Cấu hình thao tác

![20251029170959](https://static-docs.nocobase.com/20251029170959.png)

- Cấu hình các trường có thể nhập

![20251029171036](https://static-docs.nocobase.com/20251029171036.png)

- [Quy tắc liên kết](/interface-builder/actions/action-settings/linkage-rule): Hiển thị/ẩn nút động;
- [Chỉnh sửa nút](/interface-builder/actions/action-settings/edit-button): Chỉnh sửa tiêu đề, kiểu và biểu tượng của nút;