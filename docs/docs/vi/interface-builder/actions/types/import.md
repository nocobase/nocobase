---
pkg: "@nocobase/plugin-action-import"
title: "Action nhập"
description: "Action nhập: nhập dữ liệu từ tập tin Excel và các tập tin khác vào Table dữ liệu, hỗ trợ tải mẫu, ánh xạ Field."
keywords: "Action nhập,Import,nhập Excel,nhập dữ liệu,Interface Builder,NocoBase"
---
# Nhập

## Giới thiệu

Sử dụng mẫu Excel để nhập dữ liệu, có thể cấu hình nhập những Field nào, tự động tạo mẫu.

![20251029165818](https://static-docs.nocobase.com/20251029165818.png)

## Hướng dẫn nhập

### Field kiểu số

Hỗ trợ số và phần trăm, văn bản `N/A` hoặc `-` sẽ bị lọc bỏ

| Số 1 | Phần trăm | Số 2 | Số 3 |
| ----- | ------ | ----- | ----- |
| 123   | 25%    | N/A   | -     |

Sau khi chuyển sang JSON là

```ts
{
  "Số 1": 123,
  "Phần trăm": 0.25,
  "Số 2": null,
  "Số 3": null,
}
```

### Field kiểu boolean

Văn bản nhập hỗ trợ (tiếng Anh không phân biệt chữ hoa chữ thường):

- `Yes`, `Y`, `True`, `1`, `Có`
- `No`, `N`, `False`, `0`, `Không`

| Field 1 | Field 2 | Field 3 | Field 4 | Field 5 |
| ----- | ----- | ----- | ----- | ----- |
| Không    | Có    | Y     | true  | 0     |

Sau khi chuyển sang JSON là

```ts
{
  "Field 1": false,
  "Field 2": true,
  "Field 3": true,
  "Field 4": true,
  "Field 5": false,
}
```

### Field kiểu ngày tháng

| DateOnly            | Local(+08:00)       | GMT                 |
| ------------------- | ------------------- | ------------------- |
| 2023-01-18 22:22:22 | 2023-01-18 22:22:22 | 2023-01-18 22:22:22 |

Sau khi chuyển sang JSON là

```ts
{
  "DateOnly": "2023-01-18T00:00:00.000Z",
  "Local(+08:00)": "2023-01-18T14:22:22.000Z",
  "GMT": "2023-01-18T22:22:22.000Z",
}
```

### Field kiểu chọn

Cả giá trị tùy chọn và nhãn tùy chọn đều có thể là văn bản nhập, nhiều tùy chọn được phân tách bằng dấu phẩy (`,` `，`) hoặc dấu phẩy ngược (`、`)

Ví dụ các tùy chọn của Field `Mức độ ưu tiên` bao gồm:

| Giá trị tùy chọn | Nhãn tùy chọn |
| ------ | -------- |
| low    | Thấp     |
| medium | Trung bình |
| high   | Cao      |

Cả giá trị tùy chọn và nhãn tùy chọn đều có thể là văn bản nhập

| Mức độ ưu tiên |
| ------ |
| Cao     |
| low    |

Sau khi chuyển sang JSON là

```ts
[{ 'Mức độ ưu tiên': 'high' }, { 'Mức độ ưu tiên': 'low' }];
```

### Field khu vực hành chính Trung Quốc

| Khu vực 1         | Khu vực 2         |
| ------------- | ------------- |
| Bắc Kinh/Quận trung tâm | Thiên Tân/Quận trung tâm |

Sau khi chuyển sang JSON là

```ts
{
  "Khu vực 1": ["11","1101"],
  "Khu vực 2": ["12","1201"]
}
```

### Field tập tin đính kèm

| Tập tin đính kèm                                     |
| ---------------------------------------- |
| https://www.nocobase.com/images/logo.png |

Sau khi chuyển sang JSON là

```ts
{
  "Tập tin đính kèm": [
    {
      "filename": "logo.png",
      "title": "logo.png",
      "extname": ".png",
      "url": "https://www.nocobase.com/images/logo.png"
    }
  ]
}
```

### Field kiểu quan hệ

Nhiều bản ghi được phân tách bằng dấu phẩy (`,` `，`) hoặc dấu phẩy ngược (`、`)

| Phòng ban/Tên | Phân loại/Tiêu đề    |
| --------- | ------------ |
| Nhóm phát triển    | Phân loại 1、Phân loại 2 |

Sau khi chuyển sang JSON là

```ts
{
  "Phòng ban": [1], // 1 là ID bản ghi của phòng ban có tên "Nhóm phát triển"
  "Phân loại": [1,2], // 1,2 là ID bản ghi của phân loại có tiêu đề "Phân loại 1" và "Phân loại 2"
}
```

### Field kiểu JSON

| JSON1           |
| --------------- |
| {"key":"value"} |

Sau khi chuyển sang JSON là

```ts
{
  "JSON": {"key":"value"}
}
```

### Kiểu hình học bản đồ

| Point | Line        | Polygon           | Circle |
| ----- | ----------- | ----------------- | ------ |
| 1,2   | (1,2),(3,4) | (1,2),(3,4),(1,2) | 1,2,3  |

Sau khi chuyển sang JSON là

```ts
{
  "Point": [1,2],
  "Line": [[1,2], [3,4]],
  "Polygon": [[1,2], [3,4], [1,2]],
  "Circle": [1,2,3]
}
```

## Định dạng nhập tùy chỉnh

Đăng ký `ValueParser` tùy chỉnh thông qua phương thức `db.registerFieldValueParsers()`, ví dụ:

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

// Khi nhập Field type=point, sẽ phân tích dữ liệu thông qua PointValueParser
db.registerFieldValueParsers({
  point: PointValueParser,
});
```

Ví dụ nhập

| Point |
| ----- |
| 1,2   |

Sau khi chuyển sang JSON là

```ts
{
  "Point": [1,2]
}
```


## Tùy chọn cấu hình Action

![20251029170959](https://static-docs.nocobase.com/20251029170959.png)

- Cấu hình Field có thể nhập

![20251029171036](https://static-docs.nocobase.com/20251029171036.png)

- [Quy tắc liên kết](/interface-builder/actions/action-settings/linkage-rule): hiển thị/ẩn nút bấm động;
- [Chỉnh sửa nút bấm](/interface-builder/actions/action-settings/edit-button): chỉnh sửa tiêu đề, loại, biểu tượng của nút bấm;
