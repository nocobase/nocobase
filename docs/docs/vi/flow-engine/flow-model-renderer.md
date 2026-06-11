---
title: "FlowModelRenderer - Render FlowModel"
description: "FlowModelRenderer render FlowModel thành component React, cách dùng và cấu hình render FlowModel, lối vào render của FlowEngine."
keywords: "FlowModelRenderer,Render FlowModel,Component React,Render FlowEngine,NocoBase"
---

# Render FlowModel

FlowModelRenderer là component React cốt lõi dùng để render FlowModel, nó chịu trách nhiệm chuyển đổi instance FlowModel thành component React trực quan.

## Cách dùng cơ bản

### FlowModelRenderer

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// Cách dùng cơ bản
<FlowModelRenderer model={myModel} />
```

```tsx file="./_demos/flow-model-renderer.tsx" preview
```

### FieldModelRenderer

Đối với Field Model có kiểm soát, dùng FieldModelRenderer để render:

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// Render Field có kiểm soát
<FieldModelRenderer model={fieldModel} />
```

## Tham số Props

### FlowModelRendererProps

| Tham số | Kiểu | Mặc định | Mô tả |
|------|------|--------|------|
| `model` | `FlowModel` | - | Instance FlowModel cần render |
| `uid` | `string` | - | Định danh duy nhất của model luồng |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | Nội dung fallback khi render thất bại |
| `showFlowSettings` | `boolean \| object` | `false` | Có hiển thị lối vào cài đặt Flow |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | Phong cách tương tác của cài đặt Flow |
| `hideRemoveInSettings` | `boolean` | `false` | Có ẩn nút xóa trong cài đặt |
| `showTitle` | `boolean` | `false` | Có hiển thị tiêu đề model ở góc trên bên trái viền |
| `skipApplyAutoFlows` | `boolean` | `false` | Có bỏ qua tự động áp dụng Flow |
| `inputArgs` | `Record<string, any>` | - | Context bổ sung được truyền cho useApplyAutoFlows |
| `showErrorFallback` | `boolean` | `true` | Có bọc component FlowErrorFallback ở lớp ngoài cùng |
| `settingsMenuLevel` | `number` | - | Cấp menu cài đặt: 1=chỉ model hiện tại, 2=bao gồm subModel |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | Các mục thanh công cụ bổ sung |

### Cấu hình chi tiết showFlowSettings

Khi `showFlowSettings` là một object, hỗ trợ các cấu hình sau:

```tsx pure
showFlowSettings={{
  showBackground: true,    // Hiển thị nền
  showBorder: true,        // Hiển thị viền
  showDragHandle: true,    // Hiển thị tay cầm kéo
  style: {},              // Kiểu thanh công cụ tùy chỉnh
  toolbarPosition: 'inside' // Vị trí thanh công cụ: 'inside' | 'above' | 'below'
}}
```

## Vòng đời render

Toàn bộ chu kỳ render sẽ gọi các phương thức sau theo thứ tự:

1. **model.dispatchEvent('beforeRender')** - Sự kiện trước khi render
2. **model.render()** - Thực thi phương thức render của model
3. **model.onMount()** - Hook khi component mount
4. **model.onUnmount()** - Hook khi component unmount

## Ví dụ sử dụng

### Render cơ bản

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

### Render kèm cài đặt Flow

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

// Dùng chế độ menu chuột phải
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

### Bỏ qua Flow tự động

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### Render Field model

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

FlowModelRenderer tích hợp sẵn cơ chế xử lý lỗi hoàn thiện:

- **Error boundary tự động**: Mặc định bật `showErrorFallback={true}`
- **Lỗi Flow tự động**: Bắt và xử lý lỗi trong khi thực thi Flow tự động
- **Lỗi render**: Hiển thị nội dung fallback khi model render thất bại

```tsx pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>Render thất bại, vui lòng thử lại</div>}
/>
```

## Tối ưu hiệu năng

### Bỏ qua Flow tự động

Đối với các tình huống không cần Flow tự động, có thể bỏ qua để nâng cao hiệu năng:

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### Cập nhật phản ứng

FlowModelRenderer dùng `observer` của `@formily/reactive-react` để cập nhật phản ứng, đảm bảo component có thể tự động render lại khi trạng thái model thay đổi.

## Lưu ý

1. **Validate model**: Đảm bảo `model` được truyền vào có phương thức `render` hợp lệ
2. **Quản lý vòng đời**: Các hook vòng đời của model sẽ được gọi vào thời điểm thích hợp
3. **Error boundary**: Khuyến nghị bật error boundary trong môi trường sản xuất để cung cấp trải nghiệm người dùng tốt hơn
4. **Cân nhắc hiệu năng**: Đối với các tình huống render nhiều model, cân nhắc dùng tùy chọn `skipApplyAutoFlows`
