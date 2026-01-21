:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# FlowModel: Luồng Sự Kiện và Cấu Hình

FlowModel cung cấp một cách tiếp cận dựa trên "luồng sự kiện (Flow)" để triển khai logic cấu hình cho các thành phần, giúp hành vi và cấu hình của chúng dễ mở rộng và trực quan hơn.

## Model Tùy Chỉnh

Bạn có thể tạo một model thành phần tùy chỉnh bằng cách kế thừa `FlowModel`. Model cần triển khai phương thức `render()` để định nghĩa logic render của thành phần.

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## Đăng Ký Flow (Luồng Sự Kiện)

Mỗi model có thể đăng ký một hoặc nhiều **Flow** để mô tả logic cấu hình và các bước tương tác của thành phần.

```ts
MyModel.registerFlow({
  key: 'buttonSettings',
  title: 'Cài đặt Nút',
  steps: {
    general: {
      title: 'Cấu hình Chung',
      uiSchema: {
        title: {
          type: 'string',
          title: 'Tiêu đề Nút',
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

-   `key`: Định danh duy nhất cho Flow.
-   `title`: Tên của Flow, dùng để hiển thị trên giao diện người dùng (UI).
-   `steps`: Định nghĩa các bước cấu hình (Step). Mỗi bước bao gồm:
    -   `title`: Tiêu đề của bước.
    -   `uiSchema`: Cấu trúc biểu mẫu cấu hình (tương thích với Formily Schema).
    -   `defaultParams`: Các tham số mặc định.
    -   `handler(ctx, params)`: Được kích hoạt khi lưu, dùng để cập nhật trạng thái của model.

## Render Model

Khi render một model thành phần, bạn có thể sử dụng tham số `showFlowSettings` để kiểm soát liệu có bật tính năng cấu hình hay không. Nếu `showFlowSettings` được bật, một điểm truy cập cấu hình (ví dụ: biểu tượng cài đặt hoặc nút) sẽ tự động hiển thị ở góc trên bên phải của thành phần.

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## Mở Biểu Mẫu Cấu Hình Thủ Công Bằng openFlowSettings

Ngoài việc mở biểu mẫu cấu hình thông qua điểm truy cập tương tác tích hợp sẵn, bạn cũng có thể gọi thủ công `openFlowSettings()` trong mã nguồn.

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### Định Nghĩa Tham Số

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // Bắt buộc, thể hiện model mà nó thuộc về
  preset?: boolean;               // Chỉ render các bước được đánh dấu preset=true (mặc định là false)
  flowKey?: string;               // Chỉ định một Flow duy nhất
  flowKeys?: string[];            // Chỉ định nhiều Flow (bị bỏ qua nếu flowKey cũng được cung cấp)
  stepKey?: string;               // Chỉ định một bước duy nhất (thường dùng kèm với flowKey)
  uiMode?: 'dialog' | 'drawer';   // Container hiển thị biểu mẫu, mặc định là 'dialog'
  onCancel?: () => void;          // Callback khi nhấp Hủy
  onSaved?: () => void;           // Callback sau khi cấu hình được lưu thành công
}
```

### Ví Dụ: Mở Biểu Mẫu Cấu Hình Của Một Flow Cụ Thể Ở Chế Độ Drawer

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('Cấu hình nút đã được lưu');
  },
});
```