:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# ActionDefinition

ActionDefinition định nghĩa các hành động có thể tái sử dụng, những hành động này có thể được tham chiếu trong nhiều luồng công việc và bước khác nhau. Một hành động là đơn vị thực thi cốt lõi trong FlowEngine, đóng gói logic nghiệp vụ cụ thể.

## Định nghĩa kiểu

```ts
interface ActionDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> {
  name: string;
  title?: string;
  handler: (ctx: TCtx, params: any) => Promise<any> | any;
  uiSchema?: Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>);
  defaultParams?: Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>);
  beforeParamsSave?: (ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>;
  afterParamsSave?: (ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>;
  useRawParams?: boolean | ((ctx: TCtx) => boolean | Promise<boolean>);
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>);
  scene?: ActionScene | ActionScene[];
  sort?: number;
}
```

## Cách thức đăng ký

```ts
// Đăng ký toàn cục (qua FlowEngine)
const engine = new FlowEngine();
engine.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    // Logic xử lý
  }
});

// Đăng ký cấp mô hình (qua FlowModel)
class MyModel extends FlowModel {}
MyModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    // Logic xử lý
  }
});

// Sử dụng trong một luồng công việc
MyModel.registerFlow({
  key: 'dataFlow',
  steps: {
    step1: {
      use: 'loadDataAction',  // Tham chiếu hành động toàn cục
    },
    step2: {
      use: 'processDataAction', // Tham chiếu hành động cấp mô hình
    }
  }
});
```

## Mô tả thuộc tính

### name

**Kiểu**: `string`  
**Bắt buộc**: Có  
**Mô tả**: Định danh duy nhất cho hành động

Dùng để tham chiếu hành động trong một bước thông qua thuộc tính `use`.

**Ví dụ**:
```ts
name: 'loadDataAction'
name: 'processDataAction'
name: 'saveDataAction'
```

### title

**Kiểu**: `string`  
**Bắt buộc**: Không  
**Mô tả**: Tiêu đề hiển thị của hành động

Dùng cho việc hiển thị trên giao diện người dùng và gỡ lỗi.

**Ví dụ**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### handler

**Kiểu**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Bắt buộc**: Có  
**Mô tả**: Hàm xử lý cho hành động

Đây là logic cốt lõi của hành động, nhận vào ngữ cảnh và các tham số, sau đó trả về kết quả xử lý.

**Ví dụ**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Thực thi logic cụ thể
    const result = await performAction(params);
    
    // Trả về kết quả
    return {
      success: true,
      data: result,
      message: 'Action completed successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

### defaultParams

**Kiểu**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**Bắt buộc**: Không  
**Mô tả**: Các tham số mặc định cho hành động

Điền các giá trị mặc định cho tham số trước khi hành động được thực thi.

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
    timestamp: Date.now(),
    version: ctx.flowEngine.version
  }
}

// Tham số mặc định bất đồng bộ
defaultParams: async (ctx) => {
  const config = await loadConfiguration();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
    timeout: config.timeout
  }
}
```

### uiSchema

**Kiểu**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Bắt buộc**: Không  
**Mô tả**: Schema cấu hình giao diện người dùng (UI) cho hành động

Định nghĩa cách hành động được hiển thị trong UI và cấu hình biểu mẫu của nó.

**Ví dụ**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical',
    labelCol: { span: 6 },
    wrapperCol: { span: 18 }
  },
  properties: {
    url: {
      type: 'string',
      title: 'API URL',
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      required: true
    },
    method: {
      type: 'string',
      title: 'HTTP Method',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
      default: 'GET'
    },
    timeout: {
      type: 'number',
      title: 'Timeout (ms)',
      'x-component': 'InputNumber',
      'x-decorator': 'FormItem',
      default: 5000
    }
  }
}
```

### beforeParamsSave

**Kiểu**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Bắt buộc**: Không  
**Mô tả**: Hàm hook được thực thi trước khi lưu tham số

Được thực thi trước khi các tham số của hành động được lưu, có thể dùng để xác thực hoặc chuyển đổi tham số.

**Ví dụ**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Xác thực tham số
  if (!params.url) {
    throw new Error('URL is required');
  }
  
  // Chuyển đổi tham số
  params.url = params.url.trim();
  if (!params.url.startsWith('http')) {
    params.url = 'https://' + params.url;
  }
  
  // Ghi lại thay đổi
  console.log('Parameters changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Kiểu**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Bắt buộc**: Không  
**Mô tả**: Hàm hook được thực thi sau khi lưu tham số

Được thực thi sau khi các tham số của hành động được lưu, có thể dùng để kích hoạt các thao tác khác.

**Ví dụ**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Ghi nhật ký
  console.log('Action params saved:', params);
  
  // Kích hoạt sự kiện
  ctx.model.emitter.emit('actionParamsChanged', {
    actionName: 'loadDataAction',
    params,
    previousParams
  });
  
  // Cập nhật bộ nhớ đệm
  ctx.model.updateCache('actionParams', params);
}
```

### useRawParams

**Kiểu**: `boolean | ((ctx: TCtx) => boolean | Promise<boolean>)`  
**Bắt buộc**: Không  
**Mô tả**: Có sử dụng tham số thô hay không

Nếu là `true`, các tham số thô sẽ được truyền trực tiếp đến hàm xử lý mà không qua bất kỳ quá trình xử lý nào.

**Ví dụ**:
```ts
// Cấu hình tĩnh
useRawParams: true

// Cấu hình động
useRawParams: (ctx) => {
  return ctx.model.isDebugMode;
}
```

### uiMode

**Kiểu**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Bắt buộc**: Không  
**Mô tả**: Chế độ hiển thị UI cho hành động

Kiểm soát cách hành động được hiển thị trong UI.

**Các chế độ được hỗ trợ**:
- `'dialog'` - Chế độ hộp thoại
- `'drawer'` - Chế độ ngăn kéo
- `'embed'` - Chế độ nhúng
- hoặc một đối tượng cấu hình tùy chỉnh

**Ví dụ**:
```ts
// Chế độ đơn giản
uiMode: 'dialog'

// Cấu hình tùy chỉnh
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Action Configuration',
    maskClosable: false
  }
}

// Chế độ động
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### scene

**Kiểu**: `ActionScene | ActionScene[]`  
**Bắt buộc**: Không  
**Mô tả**: Các kịch bản sử dụng cho hành động

Giới hạn hành động chỉ được sử dụng trong các kịch bản cụ thể.

**Các kịch bản được hỗ trợ**:
- `'settings'` - Kịch bản cài đặt
- `'runtime'` - Kịch bản thời gian chạy
- `'design'` - Kịch bản thời gian thiết kế

**Ví dụ**:
```ts
scene: 'settings'  // Chỉ sử dụng trong kịch bản cài đặt
scene: ['settings', 'runtime']  // Sử dụng trong kịch bản cài đặt và thời gian chạy
```

### sort

**Kiểu**: `number`  
**Bắt buộc**: Không  
**Mô tả**: Trọng số sắp xếp cho hành động

Dùng để kiểm soát thứ tự hiển thị của hành động trong danh sách. Giá trị càng nhỏ thì vị trí càng cao (hiển thị trước).

**Ví dụ**:
```ts
sort: 0  // Vị trí cao nhất
sort: 10 // Vị trí trung bình
sort: 100 // Vị trí thấp hơn
```

## Ví dụ đầy đủ

```ts
class DataProcessingModel extends FlowModel {}

// Đăng ký hành động tải dữ liệu
DataProcessingModel.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    const { url, method = 'GET', timeout = 5000 } = params;
    
    try {
      const response = await fetch(url, {
        method,
        timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data,
        message: 'Data loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: {
    method: 'GET',
    timeout: 5000
  },
  uiSchema: {
    'x-component': 'Form',
    properties: {
      url: {
        type: 'string',
        title: 'API URL',
        'x-component': 'Input',
        'x-decorator': 'FormItem',
        required: true
      },
      method: {
        type: 'string',
        title: 'HTTP Method',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['GET', 'POST', 'PUT', 'DELETE']
      },
      timeout: {
        type: 'number',
        title: 'Timeout (ms)',
        'x-component': 'InputNumber',
        'x-decorator': 'FormItem'
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (!params.url) {
      throw new Error('URL is required');
    }
    params.url = params.url.trim();
  },
  afterParamsSave: (ctx, params) => {
    ctx.model.emitter.emit('dataSourceChanged', params);
  },
  uiMode: 'dialog',
  scene: ['settings', 'runtime'],
  sort: 0
});

// Đăng ký hành động xử lý dữ liệu
DataProcessingModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    const { data, processor, options = {} } = params;
    
    try {
      const processedData = await processData(data, processor, options);
      
      return {
        success: true,
        data: processedData,
        message: 'Data processed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: (ctx) => ({
    processor: 'default',
    options: {
      format: 'json',
      encoding: 'utf8'
    }
  }),
  uiSchema: {
    'x-component': 'Form',
    properties: {
      processor: {
        type: 'string',
        title: 'Processor',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['default', 'advanced', 'custom']
      },
      options: {
        type: 'object',
        title: 'Options',
        'x-component': 'Form',
        'x-decorator': 'FormItem',
        properties: {
          format: {
            type: 'string',
            title: 'Format',
            'x-component': 'Select',
            enum: ['json', 'xml', 'csv']
          },
          encoding: {
            type: 'string',
            title: 'Encoding',
            'x-component': 'Select',
            enum: ['utf8', 'ascii', 'latin1']
          }
        }
      }
    }
  },
  scene: 'runtime',
  sort: 1
});
```