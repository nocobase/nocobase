:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Hiển thị FlowModel

`FlowModelRenderer` là một component React cốt lõi dùng để hiển thị một `FlowModel`. Component này có nhiệm vụ chuyển đổi một thể hiện (instance) của `FlowModel` thành một component React trực quan.

## Cách sử dụng cơ bản

### FlowModelRenderer

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// Cách sử dụng cơ bản
<FlowModelRenderer model={myModel} />
```

### FieldModelRenderer

Đối với các Field Model được kiểm soát (controlled), bạn hãy sử dụng `FieldModelRenderer` để hiển thị:

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// Hiển thị trường được kiểm soát
<FieldModelRenderer model={fieldModel} />
```

## Các thuộc tính (Props)

### FlowModelRendererProps

| Tham số | Kiểu dữ liệu | Giá trị mặc định | Mô tả |
|------|------|--------|------|
| `model` | `FlowModel` | - | Thể hiện FlowModel cần hiển thị |
| `uid` | `string` | - | Mã định danh duy nhất cho model luồng công việc |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | Nội dung dự phòng hiển thị khi quá trình hiển thị thất bại |
| `showFlowSettings` | `boolean \| object` | `false` | Có hiển thị lối vào cài đặt luồng công việc hay không |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | Kiểu tương tác cho cài đặt luồng công việc |
| `hideRemoveInSettings` | `boolean` | `false` | Có ẩn nút xóa trong cài đặt hay không |
| `showTitle` | `boolean` | `false` | Có hiển thị tiêu đề model ở góc trên bên trái của khung hay không |
| `skipApplyAutoFlows` | `boolean` | `false` | Có bỏ qua việc áp dụng các luồng công việc tự động hay không |
| `inputArgs` | `Record<string, any>` | - | Ngữ cảnh bổ sung được truyền tới `useApplyAutoFlows` |
| `showErrorFallback` | `boolean` | `true` | Có bọc component `FlowErrorFallback` ở lớp ngoài cùng hay không |
| `settingsMenuLevel` | `number` | - | Cấp độ menu cài đặt: 1=chỉ model hiện tại, 2=bao gồm cả model con |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | Các mục bổ sung trên thanh công cụ |

### Cấu hình chi tiết cho `showFlowSettings`

Khi `showFlowSettings` là một đối tượng, các cấu hình sau được hỗ trợ:

```tsx pure
showFlowSettings={{
  showBackground: true,    // Hiển thị nền
  showBorder: true,        // Hiển thị viền
  showDragHandle: true,    // Hiển thị tay cầm kéo
  style: {},              // Kiểu dáng thanh công cụ tùy chỉnh
  toolbarPosition: 'inside' // Vị trí thanh công cụ: 'inside' | 'above' | 'below'
}}
```

## Vòng đời hiển thị

Toàn bộ chu trình hiển thị sẽ gọi các phương thức sau theo thứ tự:

1.  **model.dispatchEvent('beforeRender')** - Sự kiện trước khi hiển thị
2.  **model.render()** - Thực thi phương thức hiển thị của model
3.  **model.onMount()** - Hook khi component được gắn kết (mount)
4.  **model.onUnmount()** - Hook khi component được gỡ bỏ (unmount)

## Ví dụ sử dụng

### Hiển thị cơ bản

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

function MyComponent() {
  const model = useFlowModel();
  
  return (
    <FlowModelRenderer 
      model={model}
      fallback={<div>Đang tải...</div>}
    />
  );
}
```

### Hiển thị kèm cài đặt luồng công việc

```tsx pure
// Hiển thị cài đặt nhưng ẩn nút xóa
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// Hiển thị cài đặt và tiêu đề
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  showTitle={true}
/>

// Sử dụng chế độ menu chuột phải
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  hideRemoveInSettings={true}
/>
```

### Thanh công cụ tùy chỉnh

```tsx pure
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  extraToolbarItems={[
    {
      key: 'custom-action',
      title: 'Thao tác tùy chỉnh',
      icon: 'SettingOutlined',
      onClick: () => {
        console.log('Thao tác tùy chỉnh');
      }
    }
  ]}
/>
```

### Bỏ qua các luồng công việc tự động

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### Hiển thị Field Model

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

function FormField({ model, onChange, ...props }) {
  return (
    <FieldModelRenderer
      model={model}
      onChange={onChange}
      {...props}
    />
  );
}
```

## Xử lý lỗi

`FlowModelRenderer` tích hợp sẵn cơ chế xử lý lỗi toàn diện:

-   **Ranh giới lỗi tự động**: Mặc định bật `showErrorFallback={true}`
-   **Lỗi luồng công việc tự động**: Bắt và xử lý các lỗi trong quá trình thực thi luồng công việc tự động
-   **Lỗi hiển thị**: Hiển thị nội dung dự phòng khi model không thể hiển thị

```tsx pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>Hiển thị thất bại, vui lòng thử lại</div>}
/>
```

## Tối ưu hiệu suất

### Bỏ qua các luồng công việc tự động

Đối với các trường hợp không cần luồng công việc tự động, bạn có thể bỏ qua chúng để cải thiện hiệu suất:

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### Cập nhật phản ứng (Reactive Updates)

`FlowModelRenderer` sử dụng `observer` từ `@formily/reactive-react` để thực hiện cập nhật phản ứng, đảm bảo component tự động hiển thị lại khi trạng thái của model thay đổi.

## Lưu ý

1.  **Xác thực Model**: Đảm bảo `model` được truyền vào có phương thức `render` hợp lệ.
2.  **Quản lý vòng đời**: Các hook vòng đời của model sẽ được gọi vào thời điểm thích hợp.
3.  **Ranh giới lỗi**: Nên bật ranh giới lỗi trong môi trường sản xuất để mang lại trải nghiệm người dùng tốt hơn.
4.  **Cân nhắc hiệu suất**: Đối với các trường hợp hiển thị nhiều model, hãy cân nhắc sử dụng tùy chọn `skipApplyAutoFlows`.