---
title: "StepDefinition - Định nghĩa Step"
description: "StepDefinition định nghĩa một bước trong Flow, mỗi bước có thể là Action, xử lý sự kiện hoặc thao tác khác, là đơn vị thực thi cơ bản của Flow."
keywords: "StepDefinition,Định nghĩa Step,Bước Flow,Đơn vị thực thi Flow,FlowEngine,NocoBase"
---

# StepDefinition

StepDefinition định nghĩa một bước trong Flow, mỗi bước có thể là một Action, xử lý sự kiện hoặc thao tác khác. Bước là đơn vị thực thi cơ bản của Flow.

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

## Cách dùng

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
**Mô tả**: Định danh duy nhất của bước trong Flow

Nếu không cung cấp, sẽ dùng tên key của bước trong đối tượng `steps`.

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
**Mô tả**: Tên ActionDefinition đã đăng ký cần dùng

Thông qua thuộc tính `use` có thể tham chiếu Action đã đăng ký, tránh định nghĩa lặp lại.

**Ví dụ**:
```ts
// Đăng ký Action trước
MyModel.registerAction({
  name: 'loadDataAction',
  handler: async (ctx, params) => {
    // Logic tải dữ liệu
  }
});

// Dùng trong bước
steps: {
  step1: {
    use: 'loadDataAction',  // Tham chiếu Action đã đăng ký
    title: 'Load Data'
  }
}
```

### title

**Kiểu**: `string`  
**Bắt buộc**: Không  
**Mô tả**: Tiêu đề hiển thị của bước

Dùng cho hiển thị giao diện và debug.

**Ví dụ**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### sort

**Kiểu**: `number`  
**Bắt buộc**: Không  
**Mô tả**: Thứ tự thực thi bước, số càng nhỏ càng được thực thi trước

Dùng để kiểm soát thứ tự thực thi của nhiều bước trong cùng một Flow.

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
**Mô tả**: Hàm xử lý của bước

Khi không dùng thuộc tính `use`, có thể định nghĩa hàm xử lý trực tiếp.

**Ví dụ**:
```ts
handler: async (ctx, params) => {
  // Lấy thông tin context
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
**Mô tả**: Tham số mặc định của bước

Trước khi bước thực thi, điền giá trị mặc định cho tham số.

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
**Mô tả**: Schema cấu hình UI của bước

Định nghĩa cách hiển thị của bước trong giao diện và cấu hình form.

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
**Mô tả**: Hook function trước khi lưu tham số

Thực thi trước khi tham số bước được lưu, có thể dùng để validate hoặc chuyển đổi tham số.

**Ví dụ**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Validate tham số
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
**Mô tả**: Hook function sau khi lưu tham số

Thực thi sau khi tham số bước được lưu, có thể dùng để kích hoạt các thao tác khác.

**Ví dụ**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Ghi log
  console.log('Step params saved:', params);
  
  // Kích hoạt các thao tác khác
  ctx.model.emitter.emit('paramsChanged', params);
}
```

### uiMode

**Kiểu**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Bắt buộc**: Không  
**Mô tả**: Chế độ hiển thị UI của bước

Kiểm soát cách hiển thị của bước trong giao diện.

**Các chế độ được hỗ trợ**:
- `'dialog'` - Chế độ dialog
- `'drawer'` - Chế độ drawer
- `'embed'` - Chế độ nhúng
- Hoặc đối tượng cấu hình tùy chỉnh

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
**Mô tả**: Có phải bước preset hay không

Tham số của bước có `preset: true` cần được điền khi tạo, các bước không được đánh dấu có thể điền sau khi tạo model.

**Ví dụ**:
```ts
steps: {
  step1: {
    preset: true,  // Bắt buộc điền tham số khi tạo
    use: 'requiredAction'
  },
  step2: {
    preset: false, // Có thể điền tham số sau
    use: 'optionalAction'
  }
}
```

### paramsRequired

**Kiểu**: `boolean`  
**Bắt buộc**: Không  
**Mô tả**: Tham số bước có bắt buộc hay không

Nếu là `true`, sẽ mở dialog cấu hình trước khi thêm model.

**Ví dụ**:
```ts
paramsRequired: true  // Bắt buộc cấu hình tham số trước khi thêm model
paramsRequired: false // Có thể cấu hình tham số sau
```

### hideInSettings

**Kiểu**: `boolean`  
**Bắt buộc**: Không  
**Mô tả**: Có ẩn bước trong menu cài đặt hay không

**Ví dụ**:
```ts
hideInSettings: true  // Ẩn trong cài đặt
hideInSettings: false // Hiển thị trong cài đặt (mặc định)
```

### isAwait

**Kiểu**: `boolean`  
**Bắt buộc**: Không  
**Mặc định**: `true`  
**Mô tả**: Có chờ hàm xử lý hoàn thành hay không

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
