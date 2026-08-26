---
title: "EventDefinition Định nghĩa Event"
description: "EventDefinition định nghĩa logic xử lý Event trong Flow, phản hồi kích hoạt sự kiện, là alias của ActionDefinition, dùng cho cấu hình Event của Flow."
keywords: "EventDefinition,định nghĩa Event,Flow Event,ActionDefinition,xử lý Event,FlowEngine,NocoBase"
---

# EventDefinition

EventDefinition định nghĩa logic xử lý Event trong Flow, dùng để phản hồi các kích hoạt sự kiện cụ thể. Event là cơ chế quan trọng trong Flow engine để kích hoạt việc thực thi Flow.

## Định nghĩa kiểu

```ts
type EventDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> = ActionDefinition<TModel, TCtx>;
```

EventDefinition thực chất là alias của ActionDefinition, nên có cùng các thuộc tính và phương thức.

## Cách đăng ký

```ts
// Đăng ký toàn cục (qua FlowEngine)
const engine = new FlowEngine();
engine.registerEvent({
  name: 'clickEvent',
  title: 'Click Event',
  handler: async (ctx, params) => {
    // Logic xử lý Event
  }
});

// Đăng ký cấp Model (qua FlowModel)
class MyModel extends FlowModel {}
MyModel.registerEvent({
  name: 'submitEvent',
  title: 'Submit Event',
  handler: async (ctx, params) => {
    // Logic xử lý Event
  }
});

// Sử dụng trong Flow
MyModel.registerFlow({
  key: 'formFlow',
  on: 'submitEvent',  // Tham chiếu Event đã đăng ký
  steps: {
    step1: {
      use: 'processFormAction'
    }
  }
});
```

## Mô tả thuộc tính

### name

**Kiểu**: `string`  
**Bắt buộc**: Có  
**Mô tả**: Định danh duy nhất của Event

Dùng để tham chiếu Event trong Flow thông qua thuộc tính `on`.

**Ví dụ**:
```ts
name: 'clickEvent'
name: 'submitEvent'
name: 'customEvent'
```

### title

**Kiểu**: `string`  
**Bắt buộc**: Không  
**Mô tả**: Tiêu đề hiển thị của Event

Dùng để hiển thị trên giao diện và debug.

**Ví dụ**:
```ts
title: 'Click Event'
title: 'Form Submit'
title: 'Data Change'
```

### handler

**Kiểu**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Bắt buộc**: Có  
**Mô tả**: Hàm xử lý của Event

Logic cốt lõi của Event, nhận ctx và params, trả về kết quả xử lý.

**Ví dụ**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Thực thi logic xử lý Event
    const result = await handleEvent(params);
    
    // Trả về kết quả
    return {
      success: true,
      data: result,
      message: 'Event handled successfully'
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
**Mô tả**: Tham số mặc định của Event

Điền giá trị mặc định cho tham số khi Event được kích hoạt.

**Ví dụ**:
```ts
// Tham số mặc định tĩnh
defaultParams: {
  preventDefault: true,
  stopPropagation: false
}

// Tham số mặc định động
defaultParams: (ctx) => {
  return {
    timestamp: Date.now(),
    userId: ctx.model.uid,
    eventSource: 'user'
  }
}

// Tham số mặc định bất đồng bộ
defaultParams: async (ctx) => {
  const userInfo = await getUserInfo();
  return {
    user: userInfo,
    session: await getSessionInfo()
  }
}
```

### uiSchema

**Kiểu**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Bắt buộc**: Không  
**Mô tả**: Schema cấu hình UI của Event

Định nghĩa cách Event hiển thị trên giao diện và cấu hình form.

**Ví dụ**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    preventDefault: {
      type: 'boolean',
      title: 'Prevent Default',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    stopPropagation: {
      type: 'boolean',
      title: 'Stop Propagation',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    customData: {
      type: 'object',
      title: 'Custom Data',
      'x-component': 'Form',
      'x-decorator': 'FormItem',
      properties: {
        key: {
          type: 'string',
          title: 'Key',
          'x-component': 'Input'
        },
        value: {
          type: 'string',
          title: 'Value',
          'x-component': 'Input'
        }
      }
    }
  }
}
```

### beforeParamsSave

**Kiểu**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Bắt buộc**: Không  
**Mô tả**: Hook trước khi lưu tham số

Thực thi trước khi lưu tham số Event, có thể dùng để xác thực hoặc chuyển đổi tham số.

**Ví dụ**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Xác thực tham số
  if (!params.eventType) {
    throw new Error('Event type is required');
  }
  
  // Chuyển đổi tham số
  params.eventType = params.eventType.toLowerCase();
  
  // Ghi nhận thay đổi
  console.log('Event params changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Kiểu**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Bắt buộc**: Không  
**Mô tả**: Hook sau khi lưu tham số

Thực thi sau khi lưu tham số Event, có thể dùng để kích hoạt các thao tác khác.

**Ví dụ**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Ghi log
  console.log('Event params saved:', params);
  
  // Kích hoạt event
  ctx.model.emitter.emit('eventConfigChanged', {
    eventName: 'clickEvent',
    params,
    previousParams
  });
  
  // Cập nhật cache
  ctx.model.updateCache('eventConfig', params);
}
```

### uiMode

**Kiểu**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Bắt buộc**: Không  
**Mô tả**: Chế độ hiển thị UI của Event

Điều khiển cách hiển thị Event trên giao diện.

**Các chế độ hỗ trợ**:
- `'dialog'` - Chế độ hộp thoại
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
    width: 600,
    title: 'Event Configuration'
  }
}

// Chế độ động
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

## Các kiểu Event tích hợp

Flow engine tích hợp sẵn các kiểu Event thông dụng sau:

- `'click'` - Sự kiện click
- `'submit'` - Sự kiện submit
- `'reset'` - Sự kiện reset
- `'remove'` - Sự kiện xóa
- `'openView'` - Sự kiện mở view
- `'dropdownOpen'` - Sự kiện mở dropdown
- `'popupScroll'` - Sự kiện cuộn popup
- `'search'` - Sự kiện tìm kiếm
- `'customRequest'` - Sự kiện request tùy chỉnh
- `'collapseToggle'` - Sự kiện toggle thu gọn

## Ví dụ đầy đủ

```ts
class FormModel extends FlowModel {}

// Đăng ký Event submit form
FormModel.registerEvent({
  name: 'formSubmitEvent',
  title: 'Form Submit Event',
  handler: async (ctx, params) => {
    const { formData, validation } = params;
    
    try {
      // Xác thực dữ liệu form
      if (validation && !validateFormData(formData)) {
        throw new Error('Form validation failed');
      }
      
      // Xử lý submit form
      const result = await submitForm(formData);
      
      return {
        success: true,
        data: result,
        message: 'Form submitted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: {
    validation: true,
    preventDefault: true,
    stopPropagation: false
  },
  uiSchema: {
    'x-component': 'Form',
    properties: {
      validation: {
        type: 'boolean',
        title: 'Enable Validation',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      preventDefault: {
        type: 'boolean',
        title: 'Prevent Default',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      stopPropagation: {
        type: 'boolean',
        title: 'Stop Propagation',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: false
      },
      customHandlers: {
        type: 'array',
        title: 'Custom Handlers',
        'x-component': 'ArrayItems',
        'x-decorator': 'FormItem',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              title: 'Handler Name',
              'x-component': 'Input'
            },
            enabled: {
              type: 'boolean',
              title: 'Enabled',
              'x-component': 'Switch'
            }
          }
        }
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (params.validation && !params.formData) {
      throw new Error('Form data is required when validation is enabled');
    }
  },
  afterParamsSave: (ctx, params) => {
    ctx.model.emitter.emit('formEventConfigChanged', params);
  },
  uiMode: 'dialog'
});

// Đăng ký Event thay đổi dữ liệu
FormModel.registerEvent({
  name: 'dataChangeEvent',
  title: 'Data Change Event',
  handler: async (ctx, params) => {
    const { field, oldValue, newValue } = params;
    
    try {
      // Ghi nhận thay đổi dữ liệu
      await logDataChange({
        field,
        oldValue,
        newValue,
        timestamp: Date.now(),
        userId: ctx.model.uid
      });
      
      // Kích hoạt thao tác liên quan
      ctx.model.emitter.emit('dataChanged', {
        field,
        oldValue,
        newValue
      });
      
      return {
        success: true,
        message: 'Data change logged successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: (ctx) => ({
    logLevel: 'info',
    notify: true,
    timestamp: Date.now()
  }),
  uiMode: 'embed'
});

// Sử dụng Event trong Flow
FormModel.registerFlow({
  key: 'formProcessing',
  title: 'Form Processing',
  on: 'formSubmitEvent',
  steps: {
    validate: {
      use: 'validateFormAction',
      title: 'Validate Form',
      sort: 0
    },
    process: {
      use: 'processFormAction',
      title: 'Process Form',
      sort: 1
    },
    save: {
      use: 'saveFormAction',
      title: 'Save Form',
      sort: 2
    }
  }
});
```
