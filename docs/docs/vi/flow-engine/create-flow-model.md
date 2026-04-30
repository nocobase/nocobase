---
title: "Tạo FlowModel"
description: "Tạo FlowModel: các bước define, registerFlow, renderComponent, viết component có thể điều phối từ đầu, nhập môn phát triển FlowEngine."
keywords: "Tạo FlowModel,define,registerFlow,renderComponent,Component có thể điều phối,Phát triển FlowEngine,NocoBase"
---

# Tạo FlowModel

## Làm root node

### Xây dựng instance FlowModel

Xây dựng một instance cục bộ

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Lưu FlowModel

Khi instance đã xây dựng cần lưu trữ, có thể lưu thông qua phương thức save.

```ts
await model.save();
```

### Tải FlowModel từ kho từ xa

Model đã lưu có thể tải thông qua loadModel, phương thức này sẽ tải toàn bộ cây model (bao gồm các node con):

```ts
await engine.loadModel(uid);
```

### Tải hoặc tạo FlowModel

Nếu model tồn tại thì tải, không tồn tại thì tạo và lưu.

```ts
await engine.loadOrCreateModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Render FlowModel

```tsx pure
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
const model = await engine.loadModel(uid);
const model = await engine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

## Làm node con

Khi bạn cần quản lý thuộc tính và hành vi của nhiều subcomponent hoặc module bên trong một model, thì cần dùng SubModel, ví dụ tình huống bố cục lồng nhau, render điều kiện, v.v.

### Tạo SubModel

Khuyến nghị dùng `<AddSubModelButton />`

Có thể tự động xử lý các vấn đề thêm, gắn, lưu trữ subModel, xem chi tiết tại [Hướng dẫn sử dụng AddSubModelButton](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model).

### Render SubModel

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## Làm ForkModel

Fork thường được dùng cho các tình huống cần render cùng một template model ở nhiều vị trí (nhưng trạng thái độc lập), ví dụ mỗi hàng trong bảng.

### Tạo ForkModel

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```
### Render ForkModel

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```
