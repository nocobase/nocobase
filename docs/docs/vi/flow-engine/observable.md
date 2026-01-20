:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Cơ chế phản ứng: Observable

:::info
Cơ chế phản ứng Observable của NocoBase về bản chất tương tự như [MobX](https://mobx.js.org/README.html). Hiện tại, việc triển khai nền tảng đang sử dụng [@formily/reactive](https://github.com/alibaba/formily/tree/next/packages/reactive), với cú pháp và triết lý tương thích cao với [MobX](https://mobx.js.org/README.html). Việc không sử dụng trực tiếp [MobX](https://mobx.js.org/README.html) chỉ là do các lý do lịch sử.
:::

Trong NocoBase 2.0, các đối tượng phản ứng `Observable` có mặt ở khắp mọi nơi. Đây là cốt lõi của luồng dữ liệu nền tảng và khả năng phản hồi của giao diện người dùng (UI), được ứng dụng rộng rãi trong các thành phần như FlowContext, FlowModel, FlowStep, v.v.

## Tại sao chọn Observable?

NocoBase chọn Observable thay vì các giải pháp quản lý trạng thái khác như Redux, Recoil, Zustand, Jotai, v.v., chủ yếu vì các lý do sau:

- **Cực kỳ linh hoạt**: Observable có thể biến bất kỳ đối tượng, mảng, Map, Set, v.v., thành phản ứng. Nó tự nhiên hỗ trợ lồng ghép sâu và cấu trúc động, rất phù hợp cho các mô hình nghiệp vụ phức tạp.
- **Không xâm lấn**: Bạn có thể thao tác trực tiếp với đối tượng gốc mà không cần định nghĩa action, reducer hoặc store bổ sung, mang lại trải nghiệm phát triển tuyệt vời.
- **Tự động theo dõi phụ thuộc**: Chỉ cần bọc một component bằng `observer`, component đó sẽ tự động theo dõi các thuộc tính Observable mà nó sử dụng. Khi dữ liệu thay đổi, giao diện người dùng (UI) sẽ tự động làm mới mà không cần quản lý phụ thuộc thủ công.
- **Phù hợp cho các kịch bản không phải React**: Cơ chế phản ứng Observable không chỉ áp dụng cho React mà còn có thể kết hợp với các framework khác để đáp ứng nhu cầu dữ liệu phản ứng rộng hơn.

## Tại sao sử dụng `observer`?

`observer` sẽ lắng nghe các thay đổi trong đối tượng Observable và tự động kích hoạt cập nhật cho các React component khi dữ liệu thay đổi. Điều này giúp giao diện người dùng (UI) của bạn luôn đồng bộ với dữ liệu mà không cần gọi thủ công `setState` hoặc các phương thức cập nhật khác.

## Cách sử dụng cơ bản

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

Để biết thêm thông tin về cách sử dụng phản ứng, vui lòng tham khảo tài liệu [@formily/reactive](https://reactive.formilyjs.org/).