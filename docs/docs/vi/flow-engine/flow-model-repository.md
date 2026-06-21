---
title: "Lưu trữ FlowModel và Repository"
description: "Lưu trữ FlowModel và mô hình Repository: tải dữ liệu, lưu, tương tác với nguồn dữ liệu, hỗ trợ thao tác CRUD, quản lý dữ liệu FlowEngine."
keywords: "Lưu trữ FlowModel,Repository,Tải dữ liệu,CRUD,Tương tác nguồn dữ liệu,FlowEngine,NocoBase"
---

# Lưu trữ FlowModel

FlowEngine cung cấp một hệ thống lưu trữ đầy đủ

![20251008231338](https://static-docs.nocobase.com/20251008231338.png)

## IFlowModelRepository

`IFlowModelRepository` là interface lưu trữ model của FlowEngine, định nghĩa các thao tác như tải, lưu và xóa từ xa của model. Bằng cách triển khai interface này, có thể lưu trữ dữ liệu model vào database backend, API hoặc các phương tiện lưu trữ khác, đồng bộ dữ liệu frontend-backend.

### Phương thức chính

- **findOne(query: Query): Promise<FlowModel \| null>**  
  Tải dữ liệu model từ xa dựa trên định danh duy nhất uid.

- **save(model: FlowModel): Promise<any\>**  
  Lưu dữ liệu model vào lưu trữ từ xa.

- **destroy(uid: string): Promise<boolean\>**  
  Xóa model khỏi lưu trữ từ xa dựa trên uid.

### Ví dụ FlowModelRepository

```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async findOne(query) {
    const { uid, parentId } = query;
    // Triển khai: Lấy model dựa trên uid
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // Triển khai: Lưu model
    return model;
  }

  async destroy(uid: string) {
    // Triển khai: Xóa model dựa trên uid
    return true;
  }
}
```

### Đặt FlowModelRepository

```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## Phương thức quản lý model do FlowEngine cung cấp

### Phương thức cục bộ

```ts
await flowEngine.createModelAsync(options); // Tạo instance model cục bộ
flowEngine.getModel(uid);        // Lấy instance model cục bộ
flowEngine.removeModel(uid);     // Xóa instance model cục bộ
```

### Phương thức từ xa (do ModelRepository triển khai)

```ts
await flowEngine.loadModel(uid);     // Tải model từ xa
await flowEngine.saveModel(model);   // Lưu model lên server
await flowEngine.destroyModel(uid);  // Xóa model từ xa
```

## Phương thức instance model

```ts
const model = await this.flowEngine.createModelAsync({
  use: 'FlowModel',
});
await model.save();     // Lưu lên server
await model.destroy();  // Xóa từ xa
```
