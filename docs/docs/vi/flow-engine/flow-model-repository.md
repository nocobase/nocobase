:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Lưu trữ FlowModel

FlowEngine cung cấp một hệ thống lưu trữ dữ liệu hoàn chỉnh.

![20251008231338](https://static-docs.nocobase.com/20251008231338.png)

## IFlowModelRepository

`IFlowModelRepository` là giao diện (interface) để lưu trữ các mô hình (model) của FlowEngine. Giao diện này định nghĩa các thao tác như tải, lưu và xóa mô hình từ xa. Bằng cách triển khai giao diện này, dữ liệu mô hình có thể được lưu trữ vào cơ sở dữ liệu backend, API hoặc các phương tiện lưu trữ khác, giúp đồng bộ hóa dữ liệu giữa frontend và backend.

### Các phương thức chính

- **findOne(query: Query): Promise<FlowModel \| null>**  
  Tải dữ liệu mô hình từ xa dựa trên định danh duy nhất `uid`.

- **save(model: FlowModel): Promise<any\>**  
  Lưu dữ liệu mô hình vào bộ nhớ từ xa.

- **destroy(uid: string): Promise<boolean\>**  
  Xóa mô hình khỏi bộ nhớ từ xa dựa trên `uid`.

### Ví dụ về FlowModelRepository

```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async findOne(query) {
    const { uid, parentId } = query;
    // Triển khai: Lấy mô hình theo uid
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // Triển khai: Lưu mô hình
    return model;
  }

  async destroy(uid: string) {
    // Triển khai: Xóa mô hình theo uid
    return true;
  }
}
```

### Thiết lập FlowModelRepository

```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## Các phương thức quản lý mô hình do FlowEngine cung cấp

### Các phương thức cục bộ

```ts
flowEngine.createModel(options); // Tạo một thể hiện mô hình cục bộ
flowEngine.getModel(uid);        // Lấy một thể hiện mô hình cục bộ
flowEngine.removeModel(uid);     // Xóa một thể hiện mô hình cục bộ
```

### Các phương thức từ xa (Được triển khai bởi ModelRepository)

```ts
await flowEngine.loadModel(uid);     // Tải mô hình từ xa
await flowEngine.saveModel(model);   // Lưu mô hình vào bộ nhớ từ xa
await flowEngine.destroyModel(uid);  // Xóa mô hình từ xa
```

## Các phương thức của thể hiện mô hình

```ts
const model = this.flowEngine.createModel({
  use: 'FlowModel',
});
await model.save();     // Lưu vào bộ nhớ từ xa
await model.destroy();  // Xóa khỏi bộ nhớ từ xa
```