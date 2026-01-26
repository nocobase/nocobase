:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tạo FlowModel

## Với vai trò là Nút Gốc

### Xây dựng một phiên bản FlowModel

Xây dựng một phiên bản cục bộ

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Lưu FlowModel

Khi một phiên bản đã được xây dựng cần được duy trì, bạn có thể lưu nó bằng phương thức save.

```ts
await model.save();
```

### Tải FlowModel từ kho lưu trữ từ xa

Một model đã được lưu có thể được tải bằng phương thức loadModel. Phương thức này sẽ tải toàn bộ cây model (bao gồm các nút con):

```ts
await engine.loadModel(uid);
```

### Tải hoặc Tạo FlowModel

Nếu model tồn tại, nó sẽ được tải; ngược lại, nó sẽ được tạo và lưu.

```ts
await engine.loadOrCreateModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Hiển thị FlowModel

```tsx pure
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
const model = await engine.loadModel(uid);
const model = await engine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

## Với vai trò là Nút Con

Khi bạn cần quản lý các thuộc tính và hành vi của nhiều thành phần con hoặc module bên trong một model, bạn cần sử dụng SubModel, ví dụ như trong các tình huống bố cục lồng nhau, hiển thị có điều kiện, v.v.

### Tạo SubModel

Chúng tôi khuyến nghị sử dụng `<AddSubModelButton />`

Nó có thể tự động xử lý các vấn đề như thêm, liên kết và lưu trữ các Model con. Để biết thêm chi tiết, hãy xem [Hướng dẫn sử dụng AddSubModelButton](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model).

### Hiển thị SubModel

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## Với vai trò là ForkModel

Fork thường được sử dụng trong các tình huống cần hiển thị cùng một mẫu model ở nhiều vị trí (nhưng với trạng thái độc lập), ví dụ như mỗi hàng trong một bảng.

### Tạo ForkModel

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```
### Hiển thị ForkModel

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```