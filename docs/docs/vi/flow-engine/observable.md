---
title: "Cơ chế phản ứng Observable của FlowEngine"
description: "Cơ chế phản ứng Observable: thay đổi thuộc tính và cập nhật view trong FlowEngine, hiểu nguyên lý phản ứng và ràng buộc dữ liệu của FlowModel."
keywords: "Observable,Phản ứng,Thay đổi thuộc tính,Cập nhật view,Phản ứng FlowModel,FlowEngine,NocoBase"
---

# Cơ chế phản ứng: Observable

:::info
Cơ chế phản ứng Observable của NocoBase về bản chất tương tự như [MobX](https://mobx.js.org/README.html). Triển khai bên dưới hiện tại sử dụng [@formily/reactive](https://github.com/alibaba/formily/tree/next/packages/reactive), cú pháp và ý tưởng tương thích cao với [MobX](https://mobx.js.org/README.html), chỉ vì lý do lịch sử mà không dùng [MobX](https://mobx.js.org/README.html) trực tiếp.
:::

Trong NocoBase 2.0, đối tượng phản ứng `Observable` có ở khắp mọi nơi. Nó là cốt lõi của luồng dữ liệu và phản hồi UI tầng dưới, được áp dụng rộng rãi trong các giai đoạn FlowContext, FlowModel, FlowStep, v.v.

## Tại sao chọn Observable?

NocoBase chọn Observable thay vì các phương án quản lý trạng thái như Redux, Recoil, Zustand, Jotai, lý do chính là:

- **Linh hoạt tột độ**: Observable có thể biến bất kỳ object, array, Map, Set, v.v. nào thành phản ứng, hỗ trợ tự nhiên việc lồng sâu và cấu trúc động, rất phù hợp cho các model nghiệp vụ phức tạp.
- **Không xâm lấn**: Bạn có thể thao tác trực tiếp lên đối tượng gốc, không cần định nghĩa action, reducer hoặc store bổ sung, trải nghiệm phát triển tốt.
- **Tự động thu thập phụ thuộc**: Chỉ cần bọc component bằng `observer`, component sẽ tự động truy vết các thuộc tính Observable được dùng đến, khi dữ liệu thay đổi sẽ tự động làm mới UI, không cần quản lý phụ thuộc thủ công.
- **Áp dụng cho tình huống không phải React**: Cơ chế phản ứng Observable không chỉ áp dụng cho React, cũng có thể kết hợp với các framework khác, đáp ứng nhu cầu dữ liệu phản ứng rộng hơn.

## Tại sao cần dùng observer?

`observer` sẽ lắng nghe sự thay đổi của đối tượng Observable, và tự động kích hoạt cập nhật của component React khi dữ liệu thay đổi. Như vậy có thể giữ UI đồng bộ với dữ liệu, không cần gọi `setState` hoặc các phương thức cập nhật khác thủ công.

## Cách dùng cơ bản

```tsx
import React from 'react';
import { Input } from 'antd';
import { observer, observable } from '@nocobase/flow-engine';

const obs = observable.deep({
  value: 'aa'
});

const MyComponent = observer(() => {
  return (
    <div>
      <Input
        defaultValue={obs.value}
        onChange={(e) => {
          obs.value = e.target.value;
        }}
      />
      <div>{obs.value}</div>
    </div>
  );
});

export default MyComponent;
```

Nếu cần tìm hiểu thêm về cách dùng phản ứng, có thể tham khảo tài liệu [@formily/reactive](https://reactive.formilyjs.org/).
