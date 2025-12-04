:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# StepDefinition

StepDefinition định nghĩa một bước riêng lẻ trong một luồng. Mỗi bước có thể là một hành động, xử lý sự kiện hoặc một thao tác khác. Một bước là đơn vị thực thi cơ bản của một luồng.

## Định nghĩa kiểu

```ts
interface StepDefinition<TModel extends FlowModel = FlowModel>
  extends Partial<Omit<ActionDefinition<TModel, FlowRuntimeContext<TModel>>, 'name'>> {
  key?: string;
  isAwait?: boolean;
  use?: string;
  sort?: number;
  preset?: boolean;
  paramsRequired?: boolean;
  hideInSettings?: boolean;
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>);
}
```

## Cách sử dụng

```ts
class MyModel extends FlowModel {}

MyModel.registerFlow({
  key: 'pageSettings',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step',
      sort: 0,
      preset: true
    },
    step2: {
      handler: async (ctx, params) => {
        // Logic xử lý tùy chỉnh
        return { result: 'success' };
      },
      title: 'Second Step',
      sort: 1
    }
  }
});
```

## Mô tả thuộc tính

### key

**Kiểu**: `string`  
**Bắt buộc**: Không  
**Mô tả**: Mã định danh duy nhất cho bước trong luồng.

Nếu không được cung cấp, tên khóa của bước trong đối tượng `steps` sẽ được sử dụng.

**Ví dụ**:
```ts
steps: {
  loadData: {  // key là 'loadData'
    use: 'loadDataAction'
  }
}
```

### use

**Kiểu**: `string`  
**Bắt buộc**: Không  
**Mô tả**: Tên của một ActionDefinition đã đăng ký để sử dụng.

Thuộc tính `use` cho phép bạn tham chiếu một hành động đã đăng ký, tránh định nghĩa trùng lặp.

**Ví dụ**:
```ts
// Đăng ký hành động trước
MyModel.registerAction({
  name: 'loadDataAction',
  handler: async (ctx, params) => {
    // Logic tải dữ liệu
  }
});

// Sử dụng trong một bước
steps: {
  step1: {
    use: 'loadDataAction',  // Tham chiếu hành động đã đăng ký
    title: 'Load Data'
  }
}
```

### title

**Kiểu**: `string`  
**Bắt buộc**: Không  
**Mô tả**: Tiêu đề hiển thị của bước.

Dùng để hiển thị trên giao diện người dùng và gỡ lỗi.

**Ví dụ**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### sort

**Kiểu**: `number`  
**Bắt buộc**: Không  
**Mô tả**: Thứ tự thực thi của bước. Giá trị càng nhỏ, bước đó càng được thực thi trước.

Dùng để kiểm soát thứ tự thực thi của nhiều bước trong cùng một luồng.

**Ví dụ**:
```ts
steps: {
  step1: { sort: 0 },  // Thực thi đầu tiên
  step2: { sort: 1 },  // Thực thi tiếp theo
  step3: { sort: 2 }   // Thực thi cuối cùng
}
```

### handler

**Kiểu**: `(ctx: FlowRuntimeContext<TModel>, params: any) => Promise<any> | any`  
**Bắt buộc**: Không  
**Mô tả**: Hàm xử lý cho bước.

Khi không sử dụng thuộc tính `use`, bạn có thể định nghĩa trực tiếp hàm xử lý.

**Ví dụ**:
```ts
handler: async (ctx, params) => {
  // Lấy thông tin ngữ cảnh
  const { model, flowEngine } = ctx;
  
  // Logic xử lý
  const result = await processData(params);
  
  // Trả về kết quả
  return { success: true, data: result };
}
```

### defaultParams

**Kiểu**: `Record<string, any> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, any> | Promise<Record<string, any>>)`  
**Bắt buộc**: Không  
**Mô tả**: Các tham số mặc định cho bước.

Điền các tham số với giá trị mặc định trước khi bước được thực thi.

**Ví dụ**:
```ts
// Tham số mặc định tĩnh
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// Tham số mặc định động
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now()
  }
}

// Tham số mặc định bất đồng bộ
defaultParams: async (ctx) => {
  const config = await loadConfig();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey
  }
}
```

### uiSchema

**Kiểu**: `Record<string, ISchema> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Bắt buộc**: Không  
**Mô tả**: Lược đồ cấu hình giao diện người dùng (UI) cho bước.

Định nghĩa cách bước được hiển thị trên giao diện và cấu hình biểu mẫu của nó.

**Ví dụ**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    name: {
      type: 'string',
      title: 'Name',
      'x-component': 'Input'
    },
    age: {
      type: 'number',
      title: 'Age',
      'x-component': 'InputNumber'
    }
  }
}
```

### beforeParamsSave

**Kiểu**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Bắt buộc**: Không  
**Mô tả**: Hàm hook chạy trước khi các tham số được lưu.

Thực thi trước khi các tham số bước được lưu, và có thể được sử dụng để xác thực hoặc chuyển đổi tham số.

**Ví dụ**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Xác thực tham số
  if (!params.name) {
    throw new Error('Name is required');
  }
  
  // Chuyển đổi tham số
  params.name = params.name.trim().toLowerCase();
}
```

### afterParamsSave

**Kiểu**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Bắt buộc**: Không  
**Mô tả**: Hàm hook chạy sau khi các tham số được lưu.

Thực thi sau khi các tham số bước được lưu, và có thể được sử dụng để kích hoạt các thao tác khác.

**Ví dụ**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Ghi nhật ký
  console.log('Step params saved:', params);
  
  // Kích hoạt các thao tác khác
  ctx.model.emitter.emit('paramsChanged', params);
}
```

### uiMode

**Kiểu**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Bắt buộc**: Không  
**Mô tả**: Chế độ hiển thị giao diện người dùng (UI) cho bước.

Kiểm soát cách bước được hiển thị trên giao diện.

**Các chế độ được hỗ trợ**:
- `'dialog'` - Chế độ hộp thoại
- `'drawer'` - Chế độ ngăn kéo
- `'embed'` - Chế độ nhúng
- Hoặc một đối tượng cấu hình tùy chỉnh

**Ví dụ**:
```ts
// Chế độ đơn giản
uiMode: 'dialog'

// Cấu hình tùy chỉnh
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Step Configuration'
  }
}

// Chế độ động
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### preset

**Kiểu**: `boolean`  
**Bắt buộc**: Không  
**Mô tả**: Cho biết đây có phải là bước cài đặt sẵn hay không.

Các tham số cho các bước có `preset: true` cần được điền vào khi tạo. Những bước không có cờ này có thể được điền vào sau khi mô hình được tạo.

**Ví dụ**:
```ts
steps: {
  step1: {
    preset: true,  // Tham số phải được điền vào khi tạo
    use: 'requiredAction'
  },
  step2: {
    preset: false, // Tham số có thể được điền vào sau
    use: 'optionalAction'
  }
}
```

### paramsRequired

**Kiểu**: `boolean`  
**Bắt buộc**: Không  
**Mô tả**: Cho biết các tham số bước có bắt buộc hay không.

Nếu là `true`, một hộp thoại cấu hình sẽ mở ra trước khi thêm mô hình.

**Ví dụ**:
```ts
paramsRequired: true  // Tham số phải được cấu hình trước khi thêm mô hình
paramsRequired: false // Tham số có thể được cấu hình sau
```

### hideInSettings

**Kiểu**: `boolean`  
**Bắt buộc**: Không  
**Mô tả**: Cho biết có ẩn bước trong menu cài đặt hay không.

**Ví dụ**:
```ts
hideInSettings: true  // Ẩn trong cài đặt
hideInSettings: false // Hiển thị trong cài đặt (mặc định)
```

### isAwait

**Kiểu**: `boolean`  
**Bắt buộc**: Không  
**Mặc định**: `true`  
**Mô tả**: Cho biết có chờ hàm xử lý hoàn thành hay không.

**Ví dụ**:
```ts
isAwait: true  // Chờ hàm xử lý hoàn thành (mặc định)
isAwait: false // Không chờ, thực thi bất đồng bộ
```

## Ví dụ đầy đủ

```ts
class DataProcessingModel extends FlowModel {}

DataProcessingModel.registerFlow({
  key: 'dataProcessing',
  title: 'Data Processing',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Load Data',
      sort: 0,
      preset: true,
      paramsRequired: true,
      defaultParams: {
        source: 'api',
        timeout: 5000
      },
      uiMode: 'dialog'
    },
    processData: {
      handler: async (ctx, params) => {
        const data = await ctx.model.getData();
        return processData(data, params);
      },
      title: 'Process Data',
      sort: 1,
      defaultParams: (ctx) => ({
        userId: ctx.model.uid,
        timestamp: Date.now()
      }),
      beforeParamsSave: (ctx, params) => {
        if (!params.processor) {
          throw new Error('Processor is required');
        }
      },
      afterParamsSave: (ctx, params) => {
        ctx.model.emitter.emit('dataProcessed', params);
      }
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data',
      sort: 2,
      hideInSettings: false,
      uiMode: {
        type: 'drawer',
        props: {
          width: 600,
          title: 'Save Configuration'
        }
      }
    }
  }
});
```