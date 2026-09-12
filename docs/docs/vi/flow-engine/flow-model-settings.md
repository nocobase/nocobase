---
title: "Luồng sự kiện và cấu hình hóa FlowModel"
description: "Luồng sự kiện và cấu hình hóa FlowModel: registerFlow đăng ký Flow, cấu hình Flow, sự kiện, thuộc tính trong xây dựng giao diện, triển khai điều phối no-code."
keywords: "Cấu hình FlowModel,registerFlow,Cấu hình luồng sự kiện,Điều phối no-code,Xây dựng giao diện,FlowEngine,NocoBase"
---

# Luồng sự kiện và cấu hình hóa FlowModel

FlowModel cung cấp một cách dựa trên "luồng sự kiện (Flow)" để triển khai logic cấu hình hóa của component, làm cho hành vi và cấu hình của component có khả năng mở rộng và trực quan hơn.

## Tùy chỉnh Model

Bạn có thể tạo model component tùy chỉnh bằng cách kế thừa `FlowModel`. Model cần triển khai phương thức `render()` để định nghĩa logic render của component.

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## Đăng ký Flow (luồng sự kiện)

Mỗi model có thể đăng ký một hoặc nhiều **Flow**, dùng để mô tả logic cấu hình và các bước tương tác của component.

```ts
MyModel.registerFlow({
  key: 'buttonSettings',
  title: 'Cài đặt nút',
  steps: {
    general: {
      title: 'Cấu hình chung',
      uiSchema: {
        title: {
          type: 'string',
          title: 'Tiêu đề nút',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      defaultParams: {
        type: 'primary',
      },
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
      },
    },
  },
});
```

Mô tả

-   `key`: Định danh duy nhất của Flow.
-   `title`: Tên của Flow, dùng để hiển thị UI.
-   `steps`: Định nghĩa các bước cấu hình (Step). Mỗi bước bao gồm:
    -   `title`: Tiêu đề của bước.
    -   `uiSchema`: Cấu trúc form cấu hình (tương thích với Formily Schema).
    -   `defaultParams`: Tham số mặc định.
    -   `handler(ctx, params)`: Kích hoạt khi lưu, dùng để cập nhật trạng thái model.

## Render Model

Khi render component model, có thể kiểm soát có bật chức năng cấu hình hóa hay không thông qua tham số `showFlowSettings`. Nếu bật `showFlowSettings`, góc trên bên phải của component sẽ tự động hiển thị lối vào cấu hình (như biểu tượng cài đặt hoặc nút).

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## Sử dụng openFlowSettings để mở form cấu hình thủ công

Ngoài việc mở form cấu hình thông qua lối vào tương tác tích hợp, cũng có thể gọi
`openFlowSettings()` thủ công trong code.

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### Định nghĩa tham số

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // Bắt buộc, instance model thuộc về
  preset?: boolean;               // Chỉ render các bước được đánh dấu preset=true (mặc định false)
  flowKey?: string;               // Chỉ định một Flow
  flowKeys?: string[];            // Chỉ định nhiều Flow (sẽ bị bỏ qua khi đồng thời cung cấp flowKey)
  stepKey?: string;               // Chỉ định một bước (thường kết hợp với flowKey)
  uiMode?: 'dialog' | 'drawer';   // Container hiển thị form, mặc định 'dialog'
  onCancel?: () => void;          // Callback khi click hủy
  onSaved?: () => void;           // Callback sau khi lưu cấu hình thành công
}
```

### Ví dụ: Mở form cấu hình của Flow cụ thể ở chế độ Drawer

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('Cấu hình nút đã được lưu');
  },
});
```
